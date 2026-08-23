# PROJECT_SPEC.md
## Blockchain-Based Digital Product Passport System

**Document status:** Single source of truth. Every engineer — human or AI — must read this document in full before writing code, opening a pull request, or proposing an architectural change. If a decision in this document seems wrong, raise it explicitly; do not silently deviate from it.

**Version:** 2.0 (MVP)
**Audience:** Engineers joining the project, including AI coding assistants (Claude Code, Cursor, Codex, Gemini CLI, etc.)

---

## 1. Purpose and Philosophy

### 1.1 What this system is

The Digital Product Passport (DPP) system gives every physical product a persistent, verifiable digital identity. The passport tracks a product's lifecycle — registration, warranty, repairs, ownership changes, and status — and lets anyone verify a product's authenticity and history without needing to trust a single company's private database.

### 1.2 Why blockchain, specifically, and only where it earns its place

Blockchain is not used here because it is fashionable. It is used because this system has a specific trust problem that a centralized database does not solve well: **multiple mutually distrusting parties (manufacturers, service centers, owners, and the public) need to agree on a shared, tamper-evident history of events for a product they don't jointly control.**

Concretely:

- A manufacturer should not be able to quietly rewrite warranty history after a dispute.
- A service center should not be able to fabricate repair records to justify a warranty claim.
- An owner should not be able to claim a product was never reported stolen if it was.
- A public buyer should be able to verify all of the above without asking any of these parties to "please trust us."

This is a legitimate case for a shared, append-only, publicly auditable event log — which is exactly what a blockchain provides.

What blockchain is **not** used for in this system:

- **UI state.** Dashboards, search, filtering, and rendering are pure frontend concerns.
- **Large or mutable data.** Product images, documents, and long-form descriptions do not belong on-chain (see Section 6 and Section 17 — Future Scope for IPFS).
- **Historical records.** Repair history, ownership transfer history, and other append-only logs are recorded as blockchain events, not stored in contract state. Events are cheap, immutable, and queryable — exactly what history data needs. On-chain storage is reserved for current state only.
- **Access control logic that doesn't need public verifiability**, beyond what's necessary to protect on-chain writes.

If a future feature request doesn't need multi-party trust or tamper-evidence, it does not touch the smart contract. This is the standing architectural rule for the whole project.

### 1.3 Engineering priorities, in order

1. **Security** — this system establishes legal/ownership-adjacent facts (authenticity, theft status). Getting access control wrong has real consequences.
2. **Clean Architecture** — clear separation between on-chain state, on-chain events, and off-chain presentation.
3. **Maintainability & Readability** — the contract will likely never be upgraded post-deployment (see Section 9.5), so it must be simple enough to audit and get right the first time.
4. **Scalability** — the data model must not force expensive on-chain operations as the product catalog grows. No unbounded arrays. No string-keyed lookups where integers suffice.
5. **Modularity** — dashboards, roles, and contract sections should be independently extensible.

---

## 2. System Overview

The system consists of:

1. **A single Solidity smart contract** (`PassportRegistry.sol`) deployed to an Ethereum-compatible chain, which is the canonical source of truth for passport state and lifecycle events.
2. **A React frontend** that reads/writes to the contract via `ethers.js` and MetaMask, and renders five role-specific dashboards plus a public verification page.
3. **No backend server.** All state lives on-chain; all reads happen via a node provider (local Ganache node in development). This is a deliberate MVP constraint — see Section 9.4 for when this changes.

Each product is represented by one **Passport**, identified by a platform-generated **Passport ID**. On-chain, the Passport ID is a `uint256` auto-incrementing integer — the contract's canonical key for all mappings, modifiers, events, and function parameters. The human-readable display format `DPP-000001` is a **presentation-layer concern**: the frontend formats `uint256(1)` as `DPP-000001` for display, QR codes, and URL routing. The serial number is stored as metadata under the passport (see Section 5.2 for why).

---

## 3. User Roles and Permissions

There are exactly five roles. Roles are enforced on-chain via role-gated modifiers (see Section 10.1), not just hidden in the UI — a hidden button is not access control.

### 3.1 Admin

The platform operator. There is exactly one admin address at deployment (the contract deployer), with the ability to add further admins if needed post-launch.

Permissions:
- Register (approve) manufacturer addresses
- Register (approve) service center addresses
- Revoke manufacturer/service center approval (see Section 10.3)
- Report a product as stolen on behalf of a verified owner (see Section 3.4)

Admin does **not** register products, issue warranties, or touch ownership — those are domain actions that belong to the roles below. Keeping Admin's on-chain permissions minimal limits the blast radius if the admin key is ever compromised. The one exception is admin-assisted theft reporting, which is a safety mechanism for cases where the legitimate owner cannot act (see Section 3.4).

### 3.2 Manufacturer

Must be approved by Admin before any write access is granted (see Section 10.1). Represents a brand/company account.

Permissions:
- Register new products and mint their Digital Product Passports
- Activate warranties on products they manufactured

A manufacturer can only act on products where `product.manufacturer == msg.sender`. This is enforced at the contract level, not assumed from UI flow.

### 3.3 Service Center

Must be approved by Admin. Represents an authorized repair/maintenance provider.

Permissions:
- Add repair/maintenance records to a passport

A service center does **not** need to be the same service center for every repair on a given product; any approved service center may add a record. This reflects reality — a product may be serviced by different authorized centers over its life. Repair authenticity comes from the fact that only *approved* addresses can write, not from binding a product to one center.

### 3.4 Product Owner

Any wallet address currently holding ownership of a passport. No admin approval is required to become an owner — ownership is established by the manufacturer at registration, or by a completed ownership transfer.

Permissions:
- Accept an incoming ownership transfer
- Initiate an outgoing ownership transfer
- Report their own product as stolen
- Report their own product as recovered

An owner can only act on passports where `product.currentOwner == msg.sender`.

**Admin-assisted theft reporting:** In practice, theft may involve a compromised wallet or a situation where the legitimate owner cannot execute a transaction. To prevent the stolen-product feature from being unusable in the scenarios where it matters most, Admin may also flag a product as stolen via `reportStolenByAdmin(passportId)`. This emits a distinct event (`ProductReportedStolenByAdmin`) so the audit trail clearly distinguishes owner-initiated and admin-initiated reports. The admin must perform off-chain identity verification before using this capability — the contract enforces the action, not the verification process.

### 3.5 Public User

Any party, including those without a wallet or ETH. Read-only.

Permissions:
- Search a Passport ID
- Scan a QR code (see Section 8)
- View the public subset of passport data (Section 5.3 distinguishes public vs. owner-only fields)

Public verification must not require a wallet connection or gas — see Section 9.6 on read access.

---

## 4. Ownership Transfer Workflow

Ownership must never change automatically or unilaterally. A two-step request/accept pattern prevents:
- Transfers to a typo'd or wrong address (funds/products stuck at an address nobody controls)
- One party unilaterally reassigning ownership without the recipient's consent (which would make "ownership" meaningless as a verifiable fact)

### 4.1 Flow

```
Current Owner
     │
     │  initiateTransfer(passportId, recipientAddress)
     ▼
Status: PendingTransfer
     │
     │  Recipient is now able to act
     ▼
Recipient Accepts ── acceptTransfer(passportId)
     │
     ▼
Ownership Changes (currentOwner = recipient)
     │
     ▼
Blockchain Records Event: OwnershipTransferAccepted
Status returns to: Active
```

### 4.2 Rules

- Only the current owner may call `initiateTransfer`.
- While a passport is `PendingTransfer`, the current owner retains legal ownership but the contract blocks a second concurrent transfer request (prevents double-initiation races).
- Only the designated recipient address may call `acceptTransfer`. No one else — not the current owner, not an admin — can force acceptance.
- The current owner may cancel a pending transfer they initiated (`cancelTransfer`), returning status to `Active`. This is necessary in practice (recipient never accepts, wrong address entered, etc.). Cancellation emits `OwnershipTransferCancelled` so the timeline accurately reflects the full sequence of events.
- A product with status `ReportedStolen` cannot have transfers initiated against it. This is checked on-chain, not just hidden in the UI.

### 4.3 On-chain storage for transfers

Only the **current pending transfer** is stored on-chain, as a single `PendingTransfer` struct on the product (containing the `to` address and `requestedAt` timestamp). This struct is overwritten on each new transfer initiation and cleared on accept or cancel.

**Historical transfer records are not stored on-chain.** The complete ownership transfer history is reconstructed from blockchain events (`OwnershipTransferRequested`, `OwnershipTransferAccepted`, `OwnershipTransferCancelled`). This is consistent with the current-state-vs-history principle (Section 5.1) and avoids unbounded on-chain arrays.

---

## 5. Product Passport — Data Model

### 5.1 Design principle: current state vs. history

On-chain storage is expensive and should not be repeatedly rewritten. The data model therefore separates:

- **Current state** — a single struct per product holding only the *latest* values (current owner, current status, warranty end timestamp, repair count). This is what's read on every page load and every access-control check, so it must be cheap and simple to read.
- **Historical records** — blockchain events emitted on every state-changing action. These are written once and never modified. The frontend reconstructs the Product Timeline (Section 8) by reading the event log directly, not by querying stored arrays.

No arrays of historical records are stored in contract state. Repair history, ownership history, and status change history exist exclusively as blockchain events. On-chain, the product struct stores only summary counters and timestamps (e.g., `repairCount`, `lastRepairTimestamp`) for quick current-state reads. This keeps per-product storage bounded regardless of how many repairs or transfers a product accumulates over its lifetime.

### 5.2 Why Passport ID is separate from Serial Number

The manufacturer's serial number:
- Is chosen by the manufacturer, in a format the platform doesn't control
- May collide across different manufacturers
- May not be globally unique in the way a platform identifier needs to be

The Passport ID:
- Is a `uint256` auto-incrementing integer maintained by the contract (starting at 1)
- Is guaranteed unique across the entire system
- Is the value used in all on-chain lookups, events, modifiers, and function parameters
- Is formatted by the frontend as `DPP-000001` for display and QR encoding

The serial number is stored as metadata on the product struct for display and cross-referencing against the manufacturer's own internal systems, but it is never used as a mapping key on-chain.

**Duplicate registration prevention:** The contract enforces a uniqueness constraint on the pair `(manufacturer address, serial number)` via a dedicated mapping. A manufacturer cannot register two passports with the same serial number. This prevents the most common accidental (or malicious) duplication vector — the same physical product getting two passports. Different manufacturers may independently use the same serial number format since their namespaces are separate.

### 5.3 Passport fields (on-chain Product struct)

| Field | Type | Visibility | Notes |
|---|---|---|---|
| Passport ID | `uint256` | Public | Primary key, auto-incrementing, platform-generated |
| Product Name | `string` | Public | Max 128 bytes |
| Brand | `string` | Public | Max 64 bytes |
| Category | `string` | Public | Max 64 bytes |
| Model Number | `string` | Public | Max 64 bytes |
| Manufacturer Serial Number | `string` | Public | Max 64 bytes. Metadata only, see 5.2 |
| Manufacturer (address) | `address` | Public | Resolved to registered manufacturer name in UI |
| Manufacturing Date | `uint256` (timestamp) | Public | |
| Current Owner (address) | `address` | **Owner-restricted display** | See privacy note below |
| Warranty End Timestamp | `uint256` | Public (active/expired), Owner (details) | `0` if no warranty activated. See Section 5.5 |
| Repair Count | `uint256` | Public | Incremented on each `addRepairRecord` |
| Last Repair Timestamp | `uint256` | Public | `0` if no repairs |
| Product Status | `enum` | Public | See Section 6 |
| Pending Transfer | `struct` | Public | See Section 4.3; zeroed when no transfer is active |

**Important architectural note on privacy:** Ethereum is a public ledger. Wallet addresses are visible to anyone who queries the contract directly, regardless of what the frontend chooses to display. The "public vs owner-restricted" distinction above governs the **application layer's presentation**, not on-chain privacy, which does not exist in this architecture. Do not promise users on-chain data is private. If a future requirement needs real privacy (e.g., hiding owner identity from the public), that requires off-chain identity resolution or a privacy-preserving chain design — explicitly out of scope for MVP.

### 5.4 Supporting entities

- **Manufacturer**: `address`, `name (string, max 128 bytes)`, `approved (bool)`, `registeredAt (uint256)`
- **Service Center**: `address`, `name (string, max 128 bytes)`, `approved (bool)`, `registeredAt (uint256)`
- **PendingTransfer**: `to (address)`, `requestedAt (uint256)` — stored on the product struct; zeroed when inactive

All of these are normalized: a product does not embed a copy of manufacturer details, it stores the manufacturer's address and the frontend resolves the name via a lookup. This avoids stale duplicated data if a manufacturer's registered name is ever corrected.

### 5.5 Warranty model

Warranty status is **computed, not stored as a boolean**. The product struct stores `warrantyEndTimestamp` — a `uint256` set at activation time:

```
warrantyEndTimestamp = block.timestamp + (durationMonths * 30 days)
```

The contract exposes a view function:

```solidity
function isWarrantyActive(uint256 passportId) external view returns (bool) {
    return products[passportId].warrantyEndTimestamp > 0
        && block.timestamp <= products[passportId].warrantyEndTimestamp;
}
```

This avoids the problem of a stored `active` boolean that nobody ever sets to `false`. Warranty expiry is always correct as of the current block timestamp, with no external maintenance required.

A warranty that has not been activated has `warrantyEndTimestamp == 0`. The `activateWarranty` function may only be called by the product's manufacturer, and only once per product (the contract reverts if `warrantyEndTimestamp` is already non-zero).

### 5.6 String length validation

Every string stored in contract state has an explicit maximum byte length, enforced at the contract level with `require(bytes(field).length <= MAX)`. These limits bound gas costs and prevent storage-spam griefing by approved-but-malicious actors.

| Field | Maximum Bytes |
|---|---|
| Product Name | 128 |
| Brand | 64 |
| Category | 64 |
| Model Number | 64 |
| Manufacturer Serial Number | 64 |
| Repair Description | 256 |
| Manufacturer Name | 128 |
| Service Center Name | 128 |

These limits are defined as contract constants (`uint256 constant MAX_PRODUCT_NAME_LENGTH = 128;` etc.) and referenced in the validation logic, so they are self-documenting and trivially auditable.

---

## 6. Product Status

```solidity
enum ProductStatus {
    Active,
    PendingTransfer,
    ReportedStolen,
    RecoveredFromTheft,
    Decommissioned
}
```

### 6.1 Status transition rules

| From | To | Triggered by | Notes |
|---|---|---|---|
| (none) | `Active` | Manufacturer registers product | Initial state for every new passport |
| `Active` | `PendingTransfer` | Owner calls `initiateTransfer` | |
| `PendingTransfer` | `Active` | Recipient calls `acceptTransfer` or owner calls `cancelTransfer` | Ownership updates on accept; no change on cancel |
| `Active` / `RecoveredFromTheft` | `ReportedStolen` | Owner calls `reportStolen` or Admin calls `reportStolenByAdmin` | Blocks all transfers |
| `ReportedStolen` | `RecoveredFromTheft` | Owner calls `reportRecovered` | See note below |
| `Active` / `RecoveredFromTheft` | `Decommissioned` | Manufacturer or Admin calls `decommissionProduct` | Terminal state. See note below |

**State machine invariants:**
- `ReportedStolen` products cannot have transfers initiated. The `notReportedStolen` modifier enforces this.
- `Decommissioned` is a terminal state. No further status transitions are permitted. No transfers, repairs, or warranty activations may occur on a decommissioned product. The `notDecommissioned` modifier enforces this.
- `RecoveredFromTheft` is functionally equivalent to `Active` for all operations (transfers, repairs, warranty reads). The contract's access-control modifiers treat both statuses identically. The distinction is preserved on-chain because a product that was stolen and recovered is materially different from one that never had an incident — this is a fact the timeline should reflect, and the on-chain enum preserves it permanently.

**Design note on `RecoveredFromTheft`:** There is no `RecoveredFromTheft → Active` transition. `RecoveredFromTheft` remains as the product's status permanently, serving as an on-chain historical marker. The `ProductRecovered` event records the moment of recovery. Since the contract treats `RecoveredFromTheft` and `Active` identically for all permission checks, no automatic or manual status revert is needed.

**Design note on `Decommissioned`:** This status supports end-of-life tracking. The status enum in a non-upgradeable contract cannot be extended post-deployment, so `Decommissioned` is included now even though the workflow is simple for MVP. Either the original manufacturer or an admin may decommission a product. This accommodates product recalls, destruction, recycling, and regulatory end-of-life requirements.

---

## 7. Blockchain Events

Every state-changing action emits an event. Events serve two purposes: they are the backbone of the Product Timeline (Section 8), and they are the sole source of historical data (repairs, transfers, status changes). The frontend does not reconstruct history by diffing state or querying stored arrays — it reads the event log directly, which is both cheaper and more reliable.

### 7.1 Product lifecycle events

```solidity
event ProductRegistered(uint256 indexed passportId, address indexed manufacturer, uint256 timestamp);
event WarrantyActivated(uint256 indexed passportId, uint256 warrantyEndTimestamp, uint256 timestamp);
event RepairAdded(uint256 indexed passportId, address indexed serviceCenter, string description, uint256 timestamp);
event ProductReportedStolen(uint256 indexed passportId, address reportedBy, uint256 timestamp);
event ProductReportedStolenByAdmin(uint256 indexed passportId, address admin, uint256 timestamp);
event ProductRecovered(uint256 indexed passportId, address reportedBy, uint256 timestamp);
event ProductDecommissioned(uint256 indexed passportId, address decommissionedBy, uint256 timestamp);
```

### 7.2 Ownership transfer events

```solidity
event OwnershipTransferRequested(uint256 indexed passportId, address indexed from, address indexed to, uint256 timestamp);
event OwnershipTransferAccepted(uint256 indexed passportId, address from, address to, uint256 timestamp);
event OwnershipTransferCancelled(uint256 indexed passportId, address from, address to, uint256 timestamp);
```

### 7.3 Admin events

```solidity
event ManufacturerRegistered(address indexed manufacturer, string name, uint256 timestamp);
event ManufacturerRevoked(address indexed manufacturer, uint256 timestamp);
event ServiceCenterRegistered(address indexed serviceCenter, string name, uint256 timestamp);
event ServiceCenterRevoked(address indexed serviceCenter, uint256 timestamp);
event AdminAdded(address indexed newAdmin, address indexed addedBy, uint256 timestamp);
```

### 7.4 Indexing strategy

Every event includes the `passportId` (for product events) or address (for admin events), marked `indexed` for efficient log filtering. The `passportId` is `uint256`, so indexed event filtering is a direct topic match — no hashing required, unlike string-indexed parameters. This makes event queries for a specific product's timeline a single RPC call with a known topic.

---

## 8. QR Verification and the Product Timeline

### 8.1 QR Code

Every passport, once registered, has a QR code generated **client-side** (not on-chain — QR generation is a pure presentation concern) encoding a URL of the form:

```
https://<app-domain>/verify/DPP-000001
```

The frontend parses the numeric suffix from the `DPP-XXXXXX` format to recover the `uint256` passport ID for contract queries. Scanning opens the public verification page, which:
- Requires no wallet connection
- Requires no gas — reads are free `view` calls against a public RPC provider
- Displays the public subset of fields (Section 5.3) and the full public event timeline

### 8.2 Product Timeline — the centerpiece UI

The Product Timeline is the primary way any user (public, owner, manufacturer) understands a product's story. It is a single vertical/horizontal chronological feed built directly from the on-chain event log (Section 7), rendered with distinct visual treatment per event type (e.g., registration vs. theft report vs. transfer). This is the feature the rest of the UI is designed to support, not an afterthought bolted onto a data table — see Section 12 (Dashboards) for where it appears in each role's view.

The timeline is constructed by querying all events for a given `passportId` topic, sorting by `timestamp`, and rendering each event type with its own card/icon/color treatment. Because events are the sole history source, the timeline is always complete and never contradicts on-chain state.

---

## 9. Technology Stack

| Layer | Choice | Version | Why |
|---|---|---|---|
| Smart contracts | Solidity | `^0.8.20` | Built-in overflow checks, custom errors, mature EVM target |
| Contract dev/test framework | Hardhat | `^2.19.0` | Compilation, testing, scripting, deployment in one toolchain |
| Frontend | React | `^18` | Component model fits role-based dashboards well; large ecosystem |
| Blockchain interaction | ethers.js | `^6` | Mature, well-documented, works cleanly with Hardhat's artifacts |
| Wallet | MetaMask | — | Standard for MVP-stage dApps; every target user already has it or can install it |
| Blockchain | Ethereum (EVM-compatible) | — | Widest tooling/audit support; not chosen for throughput, chosen for ecosystem maturity |
| Local dev chain | Ganache | `^7` | Fast local iteration, deterministic accounts for testing each role |
| Version control | Git / GitHub | — | Standard |

### 9.1 Compiler configuration

The Hardhat configuration must pin the Solidity compiler version and optimizer settings:

```javascript
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
```

The contract source must use the pragma `pragma solidity ^0.8.20;` and no other. This ensures built-in overflow/underflow checks, support for custom error types, and a stable ABI.

### 9.2 No backend, by design

All reads and writes for MVP go directly from the React frontend to the chain via `ethers.js` and a provider (MetaMask injected provider for writes, RPC provider for public reads). There is deliberately no Express/Node API layer.

### 9.3 Why this is viable for MVP

- All data that requires multi-party trust already lives on-chain — that's the whole premise of the project (Section 1.2).
- Public reads don't need a backend to be gasless; `eth_call` against a public/local node is already free.
- Avoiding a backend removes an entire class of infrastructure (server hosting, database, API auth) that provides no additional trust guarantee here.

### 9.4 When a backend *would* become justified (explicitly not now)

- If off-chain metadata (e.g. IPFS-hosted images, Section 17) needs indexing/search beyond what the chain can efficiently provide
- If usage volume makes direct RPC calls from every client impractical and a caching/indexing layer (e.g. TheGraph, or a custom indexer) becomes necessary
- If notification delivery (Section 17) is implemented, since push notifications need a server component

None of these apply to MVP. Do not introduce a backend preemptively.

### 9.5 Contract upgradeability — explicit non-decision

This spec does not mandate a proxy/upgradeable contract pattern for MVP. A single, non-upgradeable `PassportRegistry.sol` is simpler to audit and reason about, and upgradeability introduces its own attack surface (proxy admin key compromise, storage layout bugs). Given the local-network-only deployment target for MVP (Ganache; public deployment is Future Scope, Section 17), this tradeoff is acceptable now. **This decision must be revisited before any public mainnet/testnet deployment.**

### 9.6 Public reads without a wallet

The public verification page must function for users without MetaMask installed. This is achieved by instantiating a read-only `ethers.JsonRpcProvider` pointed at the configured RPC endpoint for all public-page reads, reserving the MetaMask-injected `BrowserProvider` for signing transactions in the authenticated dashboards.

### 9.7 Ganache: development only

MVP UX is developed against Ganache with instant block mining, zero real gas costs, and unlimited pre-funded accounts. This is appropriate for local development and testing but does **not** represent production behavior.

Before any public network deployment (testnet or mainnet), all write-operation flows must be retested with:
- Realistic block confirmation times (12–15 seconds on Ethereum mainnet)
- Real gas estimation and transaction pricing
- Transaction failure and timeout recovery patterns
- MetaMask gas approval and confirmation UX under real conditions

Do not mistake Ganache's instant-mining behavior for how the application will perform on a live network. Transaction confirmation UX, gas estimation, and failure recovery patterns will need to be designed at that stage.

---

## 10. Smart Contract Architecture

### 10.1 Single contract, internally organized

Per project philosophy, this is **one contract**: `PassportRegistry.sol`. It is organized internally into clearly commented sections rather than split into multiple contracts, because:

- The domain is small enough that cross-contract calls would add gas overhead and complexity without a corresponding benefit.
- All the data (products, warranties, repairs, transfers) is relationally tied to the same Passport ID — splitting it across contracts would mean either duplicating access-control logic in each contract or introducing brittle cross-contract trust assumptions.
- A single audited contract is easier to reason about for a security review than several interacting ones.

Internal section organization (as Solidity comment regions, in this order):

```
1. State variables, structs & constants
2. Enums
3. Events
4. Custom errors
5. Modifiers (access control)
6. Admin functions
7. Manufacturer functions
8. Service Center functions
9. Owner functions
10. Public view functions
11. Internal/private helper functions
```

This ordering mirrors the role hierarchy in Section 3 and should be preserved as the contract grows — a new engineer should be able to find "who can call what" by scanning section headers alone.

### 10.2 Access control modifiers

```solidity
modifier onlyAdmin()
modifier onlyApprovedManufacturer()
modifier onlyApprovedServiceCenter()
modifier onlyProductOwner(uint256 passportId)
modifier onlyProductManufacturer(uint256 passportId)
modifier passportExists(uint256 passportId)
modifier notReportedStolen(uint256 passportId)
modifier notDecommissioned(uint256 passportId)
```

**`passportExists`** checks that a product has been registered (e.g., `product.manufacturer != address(0)` or a dedicated `exists` flag). It is applied to every function that operates on a specific passport, providing a clear revert message when a caller references a non-existent passport ID rather than silently comparing against zero-initialized default values.

Every state-changing external function must use at least one access-control modifier. A function with no access modifier is treated as a bug, not an oversight to be fixed later — flag it in review immediately.

### 10.3 Revocation

Admin can revoke a manufacturer's or service center's `approved` flag. Revocation does **not** retroactively invalidate past actions (a repair record added by a since-revoked service center remains valid history — rewriting history would defeat the entire purpose of the system per Section 1.2). It only blocks future writes from that address.

**Behavior during in-flight operations:** If a manufacturer is revoked while products it registered have pending transfers, those transfers may still be completed by the recipient — the recipient is innocent, and blocking their `acceptTransfer` would be punitive. However, a revoked manufacturer cannot activate new warranties or register new products, since those are new write operations requiring active approval.

### 10.4 Replay and duplicate-action prevention

- Each write function checks current on-chain state before acting (e.g., `initiateTransfer` reverts if a transfer is already `Pending`), which prevents duplicate/conflicting actions within the same chain state.
- Standard EVM transaction nonce handling already prevents literal transaction replay; no additional nonce scheme is implemented at the application layer for MVP.
- `acceptTransfer` explicitly checks `msg.sender == pendingTransfer.to` to prevent any address other than the intended recipient from completing a transfer.
- `registerProduct` checks the `(manufacturer address, serial number)` uniqueness constraint (Section 5.2) to prevent duplicate passport creation for the same physical product.

### 10.5 Custom errors

The contract uses custom error types (Solidity 0.8.4+) instead of `require(condition, "string message")` for all reverts. Custom errors are more gas-efficient (no dynamic string encoding) and provide structured error data that the frontend can parse into user-friendly messages.

```solidity
error Unauthorized();
error PassportNotFound(uint256 passportId);
error PassportAlreadyExists(uint256 passportId);
error DuplicateSerialNumber(address manufacturer, string serialNumber);
error InvalidStatus(uint256 passportId, ProductStatus current, ProductStatus expected);
error TransferNotPending(uint256 passportId);
error NotTransferRecipient(uint256 passportId, address caller);
error WarrantyAlreadyActivated(uint256 passportId);
error ProductIsDecommissioned(uint256 passportId);
error StringTooLong(string fieldName, uint256 maxLength);
```

This list is representative, not exhaustive. Every revert condition must use a custom error. Do not use `require` with string messages anywhere in the contract.

---

## 11. Security Considerations

| Concern | Mitigation |
|---|---|
| Role-based access control | Enforced via Solidity modifiers on every state-changing function (Section 10.2), never assumed from frontend routing alone |
| Wallet authentication | MetaMask signature is the sole authentication mechanism; `msg.sender` is the source of truth for identity, never a value passed as a parameter |
| Ownership validation | `onlyProductOwner` modifier re-checks `currentOwner` on every owner action, not cached client-side state |
| Passport existence | `passportExists` modifier prevents operations on non-existent passport IDs with a clear revert |
| Input validation | All string fields validated against defined byte length limits (Section 5.6); enforced at the contract level |
| Duplicate prevention | `(manufacturer, serialNumber)` uniqueness constraint prevents duplicate passport creation (Section 5.2) |
| Smart contract security | No `delegatecall` to untrusted addresses; no unbounded loops; no stored arrays that grow with usage; checks-effects-interactions ordering followed in every state-changing function |
| Storage bounds | No on-chain arrays of historical data. All history is in events. Per-product storage is bounded and constant regardless of product age or activity volume |
| Replay prevention | Covered by state-based guards (10.4); no custom signature scheme is introduced that would need its own replay protection |
| Unauthorized access prevention | Every dashboard's write actions are gated twice: contract-level modifiers (authoritative) and frontend-level role checks (UX only, never trusted as the real gate) |
| Front-running on transfer accept | `acceptTransfer` is address-gated (`msg.sender == pendingTransfer.to`), so front-running the accept call has no benefit to an attacker — they still can't satisfy the sender check |
| Stolen product catch-22 | Admin-assisted theft reporting (Section 3.4) ensures the feature remains usable even when the owner's wallet is compromised |

**Standing rule:** any frontend check (e.g., "hide this button if role !== manufacturer") is a UX convenience only. It must have a corresponding on-chain check. If a security review finds a frontend-only permission check, it is a bug, not a soft/acceptable gap.

---

## 12. Dashboards

Each dashboard is a distinct route/view, sharing common components (Product Timeline, Passport Card, QR display) but with role-specific actions:

- **Admin Dashboard** — pending manufacturer/service center approvals; registered organizations list; revocation controls; admin-assisted theft reporting.
- **Manufacturer Dashboard** — register new product form; list of products registered by this manufacturer with status; activate warranty action.
- **Service Center Dashboard** — search-by-Passport-ID to add a repair record; list of repairs this service center has logged.
- **Owner Dashboard** — passports currently owned; initiate/cancel/accept transfer actions; report stolen/recovered; full Product Timeline per owned passport.
- **Public Verification Dashboard** — search bar / QR scan entry point; read-only passport view with full public timeline; no wallet required (Section 9.6).

Every dashboard that shows a specific product renders the Product Timeline (Section 8.2) as its centerpiece — this is a shared component, not five separate implementations.

### 12.1 Dashboard data retrieval

The Manufacturer, Service Center, and Owner dashboards each need to display "my products" or "my activity" — a reverse lookup from an address to a list of passport IDs. For MVP, these lists are constructed by scanning relevant event logs:

- **Manufacturer Dashboard:** scan `ProductRegistered` events filtered by `manufacturer == connectedAddress`.
- **Owner Dashboard:** scan `ProductRegistered` and `OwnershipTransferAccepted` events to find passports transferred to the connected address, then verify current ownership on-chain. An `OwnershipTransferAccepted` event where `to == connectedAddress` means the user received a product, but a subsequent transfer away means they no longer own it — `getProduct(passportId).currentOwner` is the definitive check.
- **Service Center Dashboard:** scan `RepairAdded` events filtered by `serviceCenter == connectedAddress`.

This approach works at MVP scale (local Ganache, hundreds of products). At larger scale, an off-chain indexing layer (see Section 9.4) would replace direct event scanning.

### 12.2 Role resolution on wallet connection

On wallet connection, the frontend queries the contract for all roles the connected address holds using gas-free view functions:

```
isAdmin(address) → bool
isApprovedManufacturer(address) → bool
isApprovedServiceCenter(address) → bool
```

Ownership is not a pre-registered role — it is determined per-product.

- **Single role detected:** route directly to that dashboard.
- **Multiple roles detected:** display a role-switcher UI allowing the user to choose which dashboard to view. This is common during development (deployer address is admin and may also be registered as a manufacturer for testing) and possible in production.
- **No role detected:** default to the Public Verification Dashboard. No error is shown — the public view is a valid, wallet-connected experience (useful for an owner who hasn't yet received any products).

---

## 13. Error Handling

### 13.1 Contract-level errors

All reverts use custom error types (Section 10.5). No `require` with string messages. Custom errors are gas-efficient and provide structured data the frontend can decode.

### 13.2 Frontend transaction lifecycle

Every write operation follows a consistent state machine visible to the user:

| State | UI Treatment |
|---|---|
| **Idle** | Action button is enabled and ready |
| **Awaiting Signature** | Modal or overlay indicating "Please confirm in MetaMask." Triggered when the frontend submits the transaction to MetaMask |
| **Pending Confirmation** | Spinner or progress indicator with "Transaction submitted, waiting for confirmation." Shown after MetaMask returns a transaction hash but before the transaction is mined |
| **Success** | Toast/banner confirming the action completed. UI refreshes the relevant data from the contract |
| **Reverted** | Error message decoded from the custom error type. User-friendly text mapped from error names (e.g., `Unauthorized` → "You don't have permission to perform this action") |
| **Rejected by User** | Light dismissal ("Transaction cancelled") — the user clicked "Reject" in MetaMask. No error tone |
| **Network Error** | Retry prompt with guidance ("Could not reach the network. Check your connection and try again") |

This state machine is implemented once as a shared hook or utility (e.g., `useTransaction`) and reused across all dashboards. Individual dashboards do not implement their own transaction-handling logic.

### 13.3 Error message mapping

The frontend maintains a mapping from custom error names to user-facing messages. This mapping lives in a single file (`src/utils/errorMessages.js`) so that copy is consistent and updatable in one place.

---

## 14. Deployment

### 14.1 Deployment flow

1. `npx hardhat compile` — compiles `PassportRegistry.sol`, producing ABI and bytecode in `artifacts/`.
2. `npx hardhat run scripts/deploy.js --network localhost` — deploys the contract to the configured network (Ganache for MVP) and writes the deployment output.
3. The `deploy.js` script writes two outputs to `frontend/src/contracts/`:
   - `PassportRegistryABI.json` — the contract's ABI, extracted from Hardhat's compilation artifacts.
   - `contract-address.json` — a JSON object containing `{ "address": "0x..." }` with the deployed contract address.
4. `npx hardhat run scripts/seed.js --network localhost` — (development only) seeds the local chain with demo manufacturers, service centers, products, and transfers for UI development and testing.

### 14.2 Frontend synchronization

The `frontend/src/contracts/` directory is the single point where the frontend imports the contract ABI and deployed address. These files are generated by the deploy script, not maintained manually. The frontend never hardcodes a contract address — it reads from `contract-address.json` at runtime.

### 14.3 Environment configuration

The frontend uses environment variables for network configuration. `.env.example` documents the required variables:

```
REACT_APP_RPC_URL=http://127.0.0.1:7545
REACT_APP_CHAIN_ID=1337
```

For deployment to other networks (future scope), additional variables would be added. The contract address is not an environment variable — it comes from the deploy script output in `frontend/src/contracts/contract-address.json`.

---

## 15. Folder Structure

```
digital-product-passport/
├── contracts/
│   ├── PassportRegistry.sol
│   └── interfaces/                # reserved for future multi-contract needs (Section 17)
├── test/
│   ├── PassportRegistry.admin.test.js
│   ├── PassportRegistry.manufacturer.test.js
│   ├── PassportRegistry.serviceCenter.test.js
│   ├── PassportRegistry.owner.test.js
│   ├── PassportRegistry.transfer.test.js
│   └── PassportRegistry.status.test.js
├── scripts/
│   ├── deploy.js                  # deploys contract, writes ABI + address to frontend/src/contracts/
│   └── seed.js                    # seeds Ganache with demo data for local dev
├── hardhat.config.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── timeline/          # Product Timeline component (Section 8.2)
│   │   │   ├── passport/          # Passport card, QR display
│   │   │   └── shared/            # buttons, forms, layout primitives, TransactionStatus
│   │   ├── dashboards/
│   │   │   ├── AdminDashboard/
│   │   │   ├── ManufacturerDashboard/
│   │   │   ├── ServiceCenterDashboard/
│   │   │   ├── OwnerDashboard/
│   │   │   └── PublicVerification/
│   │   ├── hooks/                 # useContract, useWallet, useRole, useTransaction
│   │   ├── contracts/             # ABI + address JSON from deploy script (generated, not manual)
│   │   ├── utils/
│   │   │   ├── formatPassportId.js   # uint256 ↔ DPP-XXXXXX conversion
│   │   │   └── errorMessages.js      # custom error → user-facing message mapping
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── PROJECT_SPEC.md            # this document
│   └── architecture-diagrams/
├── .gitignore
├── package.json
└── README.md
```

---

## 16. Coding Standards

### 16.1 Naming conventions

- **Solidity**: `PascalCase` for contracts/structs/events/custom errors, `camelCase` for functions/variables, `UPPER_SNAKE_CASE` for constants.
- **React**: `PascalCase` for components and their files (`OwnerDashboard.jsx`), `camelCase` for hooks (`useContract.js`) and utility functions.
- **Passport ID**: on-chain, always `uint256`. In the frontend, formatted as `DPP-` followed by a zero-padded six-digit number via a shared utility function (`formatPassportId`). The frontend never sends `DPP-` strings to the contract — it strips the prefix and passes the integer.

### 16.2 Folder conventions

- One component per file; a component's styles (if any) live alongside it, not in a global catch-all stylesheet.
- Each dashboard owns its subcomponents in its own folder; shared cross-dashboard components go in `components/shared/`.

### 16.3 Component conventions

- Presentational components (e.g. `PassportCard`) receive data via props only — no direct contract calls inside them.
- Contract interaction is isolated to hooks (`useContract`, role-specific action hooks, `useTransaction`) so that presentational components stay testable without mocking `ethers.js`.
- Transaction lifecycle state (Section 13.2) is handled by a shared `useTransaction` hook, not reimplemented per-dashboard.

### 16.4 Function naming (contract)

- Actions are verbs: `registerProduct`, `initiateTransfer`, `acceptTransfer`, `cancelTransfer`, `addRepairRecord`, `reportStolen`, `reportRecovered`, `activateWarranty`, `decommissionProduct`.
- View functions are prefixed with `get` or `is`: `getProduct`, `isWarrantyActive`, `isAdmin`, `isApprovedManufacturer`, `getNextPassportId`.

### 16.5 Smart contract organization

Follow the section ordering defined in Section 10.1 exactly. New functions are added to the section matching their role, not appended to the end of the file.

### 16.6 Commenting standards

- Every external/public function has a NatSpec comment block (`@notice`, `@param`, `@return`) — this is not optional, since this contract is the system of record and will be read by auditors and future engineers with no other documentation.
- Non-obvious business rules (e.g., why `RecoveredFromTheft` doesn't auto-revert to `Active`, Section 6) are commented at the point of implementation, referencing the relevant PROJECT_SPEC.md section number.

### 16.7 Error conventions

- All contract reverts use custom error types (Section 10.5). No `require(condition, "string")` anywhere.
- The frontend maps custom error names to user-facing messages in `utils/errorMessages.js` (Section 13.3).

### 16.8 Commit message conventions

Conventional Commits format:

```
<type>(<scope>): <short summary>

type: feat | fix | refactor | test | docs | chore
scope: contract | frontend | admin-dashboard | owner-dashboard | etc.
```

Example: `feat(contract): add passportExists modifier to all product functions`

---

## 16.9 Testing Standards

Testing is not optional. For a non-upgradeable contract that must be correct at first deployment, the test suite is the last line of defense.

### Test file organization

Tests are organized by role/domain, matching the folder structure in Section 15:

| Test File | Coverage |
|---|---|
| `PassportRegistry.admin.test.js` | Admin registration, revocation, admin-assisted theft reporting |
| `PassportRegistry.manufacturer.test.js` | Product registration, warranty activation, duplicate prevention |
| `PassportRegistry.serviceCenter.test.js` | Repair record addition |
| `PassportRegistry.owner.test.js` | Theft reporting, recovery, decommissioning |
| `PassportRegistry.transfer.test.js` | Full transfer lifecycle (initiate, accept, cancel) |
| `PassportRegistry.status.test.js` | All valid and invalid status transitions |

### Required test categories

Every test file must include:

1. **Positive tests (happy path):** the function succeeds with valid inputs and authorized callers.
2. **Negative tests (access control):** the function reverts when called by an unauthorized address. Every modifier is tested — e.g., a non-owner cannot report stolen, a non-admin cannot register a manufacturer, a revoked service center cannot add a repair.
3. **Negative tests (invalid state):** the function reverts when preconditions are not met — e.g., transferring a stolen product, activating warranty twice, operating on a decommissioned product.
4. **Event emission tests:** every state-changing function's emitted event is verified for correct name, parameter values, and indexing.
5. **State transition tests:** every valid transition in the Section 6 table is tested. Every invalid transition (not in the table) is tested to confirm it reverts.
6. **Edge case tests:** boundary conditions, such as maximum-length strings, zero-padded values, and the first/second passport IDs.

### Gas reporting

The Hardhat gas reporter plugin (`hardhat-gas-reporter`) is configured to log gas usage for key operations in the test output. This provides a baseline gas profile and makes regressions visible. The following operations should be benchmarked:

- `registerProduct`
- `activateWarranty`
- `initiateTransfer` / `acceptTransfer`
- `addRepairRecord`
- `reportStolen` / `reportRecovered`

No specific gas targets are mandated for MVP (Ganache has no real gas cost), but the reported values should be reviewed to ensure no operation has unexpectedly high cost that would be problematic on a real network.

---

## 17. Future Scope (explicitly out of MVP)

These are acknowledged, intentionally deferred, and should not be designed around prematurely:

- **IPFS** — for storing product images/documents off-chain with a content hash referenced on-chain, once the platform needs rich media rather than text metadata.
- **Public Ethereum deployment** — MVP targets Ganache/local testnets only; mainnet or public testnet deployment requires revisiting Section 9.5 (upgradeability) and a full security audit first.
- **NFT integration** — representing passports as ERC-721 tokens would make ownership transfer composable with existing wallet/marketplace tooling, but adds standards-compliance overhead not needed for MVP's closed transfer flow.
- **IoT integration** — automatic status updates from sensors (e.g., tamper detection) would feed into `ProductStatus` but requires a trusted oracle design that doesn't exist yet.
- **Analytics** — aggregate dashboards (e.g., "repairs per model") are a read-layer concern and would likely require the indexing layer discussed in Section 9.4.
- **Notifications** — push/email alerts on transfer requests, stolen reports, etc., require the backend component explicitly deferred in Section 9.4.
- **Multi-chain support** — would require abstracting the current single-provider `ethers.js` setup behind a chain-selection layer; not justified until there's a concrete reason (e.g. gas cost on target chain).

---

## 18. Glossary

- **Passport / DPP**: The complete digital record for one physical product.
- **Passport ID**: Platform-generated unique identifier for a passport. On-chain: `uint256`. Display format: `DPP-000001`. Distinct from the manufacturer's serial number.
- **Current state**: The latest values for a product (owner, status, warranty end timestamp, repair count), stored once in a struct and overwritten in place. Bounded and constant-size regardless of product age.
- **Historical record**: Append-only blockchain events (repairs, transfers, status changes). Never stored in contract state. Reconstructed from event logs by the frontend.
- **Approved**: A manufacturer or service center address that Admin has explicitly whitelisted for write access.
- **Custom error**: A Solidity error type used for all reverts. More gas-efficient than `require` with strings and provides structured data for frontend error handling.
- **Decommissioned**: Terminal product status indicating end-of-life. No further operations permitted.

---

*End of PROJECT_SPEC.md v2.0. Any change to role permissions, the status state machine (Section 6), the event set (Section 7), or the contract's function set requires a corresponding update to this document in the same pull request.*
