# PROJECT_SPEC.md
## Blockchain-Based Digital Product Passport System

**Document status:** Single source of truth. Every engineer — human or AI — must read this document in full before writing code, opening a pull request, or proposing an architectural change. If a decision in this document seems wrong, raise it explicitly; do not silently deviate from it.

**Version:** 1.0 (MVP)
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
- **Large or mutable data.** Product images, documents, and long-form descriptions do not belong on-chain (see Section 6 and Section 15 — Future Scope for IPFS).
- **Access control logic that doesn't need public verifiability**, beyond what's necessary to protect on-chain writes.

If a future feature request doesn't need multi-party trust or tamper-evidence, it does not touch the smart contract. This is the standing architectural rule for the whole project.

### 1.3 Engineering priorities, in order

1. **Security** — this system establishes legal/ownership-adjacent facts (authenticity, theft status). Getting access control wrong has real consequences.
2. **Clean Architecture** — clear separation between on-chain state, on-chain events, and off-chain presentation.
3. **Maintainability & Readability** — the contract will likely never be upgraded post-deployment (see Section 9.4), so it must be simple enough to audit and get right the first time.
4. **Scalability** — the data model must not force expensive on-chain operations as the product catalog grows.
5. **Modularity** — dashboards, roles, and contract sections should be independently extensible.

---

## 2. System Overview

The system consists of:

1. **A single Solidity smart contract** (`PassportRegistry.sol`) deployed to an Ethereum-compatible chain, which is the canonical source of truth for passport state and lifecycle events.
2. **A React frontend** that reads/writes to the contract via `ethers.js` and MetaMask, and renders five role-specific dashboards plus a public verification page.
3. **No backend server.** All state lives on-chain; all reads happen via a node provider (local Ganache node in development). This is a deliberate MVP constraint — see Section 9.5 for when this changes.

Each product is represented by one **Passport**, identified by a platform-generated **Passport ID** (e.g. `DPP-000001`), which is distinct from the manufacturer's own serial number. The Passport ID is the canonical identity used throughout the system; the serial number is stored as metadata under it (see Section 5.2 for why).

---

## 3. User Roles and Permissions

There are exactly five roles. Roles are enforced on-chain via role-gated modifiers (see Section 10.1), not just hidden in the UI — a hidden button is not access control.

### 3.1 Admin

The platform operator. There is exactly one admin address at deployment (the contract deployer), with the ability to add further admins if needed post-launch.

Permissions:
- Register (approve) manufacturer addresses
- Register (approve) service center addresses
- Revoke manufacturer/service center approval (see Section 10.3)

Admin does **not** register products, issue warranties, or touch ownership — those are domain actions that belong to the roles below. Keeping Admin's on-chain permissions minimal limits the blast radius if the admin key is ever compromised.

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

### 3.5 Public User

Any party, including those without a wallet or ETH. Read-only.

Permissions:
- Search a Passport ID
- Scan a QR code (see Section 8)
- View the public subset of passport data (Section 5.3 distinguishes public vs. owner-only fields)

Public verification must not require a wallet connection or gas — see Section 9.5 on read access.

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
Status: Pending Transfer
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
- While a passport is `Pending Transfer`, the current owner retains legal ownership but the contract blocks a second concurrent transfer request (prevents double-initiation races).
- Only the designated recipient address may call `acceptTransfer`. No one else — not the current owner, not an admin — can force acceptance.
- The current owner may cancel a pending transfer they initiated (`cancelTransfer`), returning status to `Active`. This is necessary in practice (recipient never accepts, wrong address entered, etc.).
- A product with status `Reported Stolen` cannot have transfers initiated against it. This is checked on-chain, not just hidden in the UI.

---

## 5. Product Passport — Data Model

### 5.1 Design principle: current state vs. history

On-chain storage is expensive and should not be repeatedly rewritten. The data model therefore separates:

- **Current state** — a single struct per product holding only the *latest* values (current owner, current status, warranty summary). This is what's read on every page load and every access-control check, so it must be cheap and simple to read.
- **Historical records** — append-only arrays/events for repairs and ownership changes. These are written once and never modified. The frontend reconstructs the Product Timeline (Section 8) by reading historical events, not by re-reading current state repeatedly.

This avoids duplicating a growing repair/ownership history inside the "current state" struct, which would make every read more expensive as history grows.

### 5.2 Why Passport ID is separate from Serial Number

The manufacturer's serial number:
- Is chosen by the manufacturer, in a format the platform doesn't control
- May collide across different manufacturers
- May not be globally unique in the way a platform identifier needs to be

The Passport ID:
- Is generated by the platform itself as an auto-incrementing identifier (`DPP-000001`, `DPP-000002`, ...)
- Is guaranteed unique across the entire system
- Is the value encoded in the QR code and used in all cross-references (repairs, transfers, warranty)

The serial number is stored as metadata on the product struct for display and cross-referencing against the manufacturer's own internal systems, but it is never used as a lookup key on-chain.

### 5.3 Passport fields

| Field | Type | Visibility | Notes |
|---|---|---|---|
| Passport ID | string/uint | Public | Primary key, platform-generated |
| Product Name | string | Public | |
| Brand | string | Public | |
| Category | string | Public | |
| Model Number | string | Public | |
| Manufacturer Serial Number | string | Public | Metadata only, see 5.2 |
| Manufacturer (address) | address | Public | Resolved to registered manufacturer name in UI |
| Manufacturing Date | uint (timestamp) | Public | |
| Current Owner (address) | address | **Owner-restricted display** | Address is on-chain and technically readable by anyone (public blockchains have no field-level privacy), but the frontend only *surfaces* full owner contact/profile info to the owner and admin. Public verification page shows only that a valid current owner exists, not personal identifying info beyond the address itself. |
| Warranty Info | struct | Public (status), Owner (details) | |
| Repair History | array of Repair Records | Public | Builds trust in the timeline |
| Ownership History | array of Transfer events | Public | Addresses only; no personal data on-chain |
| Product Status | enum | Public | See Section 6 |

**Important architectural note on privacy:** Ethereum is a public ledger. Wallet addresses are visible to anyone who queries the contract directly, regardless of what the frontend chooses to display. The "public vs owner-restricted" distinction above governs the **application layer's presentation**, not on-chain privacy, which does not exist in this architecture. Do not promise users on-chain data is private. If a future requirement needs real privacy (e.g., hiding owner identity from the public), that requires off-chain identity resolution or a privacy-preserving chain design — explicitly out of scope for MVP.

### 5.4 Supporting entities

- **Manufacturer**: `address`, `name`, `approved (bool)`, `registeredAt`
- **Service Center**: `address`, `name`, `approved (bool)`, `registeredAt`
- **Warranty**: `passportId`, `startDate`, `durationMonths`, `active (bool)`
- **Repair Record**: `passportId`, `serviceCenter (address)`, `description`, `timestamp`
- **Ownership Transfer**: `passportId`, `from`, `to`, `status (Requested/Accepted/Cancelled)`, `timestamp`

All of these are normalized: a product does not embed a copy of manufacturer details, it stores the manufacturer's address and the frontend resolves the name via a lookup. This avoids stale duplicated data if a manufacturer's registered name is ever corrected.

---

## 6. Product Status

```
enum ProductStatus {
    Active,
    PendingTransfer,
    UnderService,
    ReportedStolen,
    Recovered
}
```

### 6.1 Status transition rules

| From | To | Triggered by |
|---|---|---|
| (none) | Active | Manufacturer registers product |
| Active | PendingTransfer | Owner initiates transfer |
| PendingTransfer | Active | Transfer accepted (ownership now changed) or transfer cancelled |
| Active | UnderService | *Optional MVP simplification — see note below* |
| Active / UnderService | ReportedStolen | Owner reports stolen |
| ReportedStolen | Recovered | Owner reports recovered |
| Recovered | Active | Automatic, next state read treats Recovered products as tradable again — see note |

**Design note on `UnderService`:** Unlike ownership and theft status, "under service" is not something that strictly requires an on-chain state change to be trustworthy — it's informational. For MVP, `UnderService` is a valid enum value that a service center can set at the start of a repair and clear at the end, but it is **not** a blocking status (it does not, for instance, prevent ownership transfer). This keeps the state machine simple. If real-world usage shows a need to lock a product during service (e.g. prevent transfer mid-repair), that constraint should be added deliberately, not implied.

**Design note on `Recovered`:** `Recovered` is kept as a distinct terminal-looking status rather than reverting straight back to `Active` automatically, because the recovery event itself is a fact worth preserving distinctly in the timeline (a product that was stolen and recovered is materially different from one that never had an incident, even once it's usable again). The frontend treats `Recovered` as functionally equivalent to `Active` for transfer eligibility.

---

## 7. Blockchain Events

Every state-changing action emits an event. Events are the backbone of the Product Timeline (Section 8) — the frontend does not reconstruct history by diffing state, it reads the event log directly, which is both cheaper and more reliable.

```solidity
event ProductRegistered(string passportId, address manufacturer, uint256 timestamp);
event WarrantyActivated(string passportId, uint256 durationMonths, uint256 timestamp);
event OwnershipTransferRequested(string passportId, address from, address to, uint256 timestamp);
event OwnershipTransferAccepted(string passportId, address from, address to, uint256 timestamp);
event RepairAdded(string passportId, address serviceCenter, string description, uint256 timestamp);
event ProductReportedStolen(string passportId, address reportedBy, uint256 timestamp);
event ProductRecovered(string passportId, address reportedBy, uint256 timestamp);
```

Every event includes the `passportId` and a `timestamp`, so the frontend can filter logs per-product and sort chronologically with a single indexed query (`passportId` should be marked `indexed` in the actual Solidity source for efficient filtering).

---

## 8. QR Verification and the Product Timeline

### 8.1 QR Code

Every passport, once registered, has a QR code generated **client-side** (not on-chain — QR generation is a pure presentation concern) encoding a URL of the form:

```
https://<app-domain>/verify/DPP-000001
```

Scanning it opens the public verification page, which:
- Requires no wallet connection
- Requires no gas — reads are free `view` calls against a public RPC provider
- Displays the public subset of fields (Section 5.3) and the full public event timeline

### 8.2 Product Timeline — the centerpiece UI

The Product Timeline is the primary way any user (public, owner, manufacturer) understands a product's story. It is a single vertical/horizontal chronological feed built directly from the on-chain event log (Section 7), rendered with distinct visual treatment per event type (e.g., registration vs. theft report vs. transfer). This is the feature the rest of the UI is designed to support, not an afterthought bolted onto a data table — see Section 12 (Dashboards) for where it appears in each role's view.

---

## 9. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React | Component model fits role-based dashboards well; large ecosystem |
| Blockchain interaction | ethers.js | Mature, well-documented, works cleanly with Hardhat's artifacts |
| Wallet | MetaMask | Standard for MVP-stage dApps; every target user already has it or can install it |
| Blockchain | Ethereum (EVM-compatible) | Widest tooling/audit support; not chosen for throughput, chosen for ecosystem maturity |
| Smart contracts | Solidity | Standard for EVM |
| Local dev chain | Ganache | Fast local iteration, deterministic accounts for testing each role |
| Contract dev/test framework | Hardhat | Compilation, testing, scripting, deployment in one toolchain |
| Version control | Git / GitHub | Standard |

### 9.1 No backend, by design

All reads and writes for MVP go directly from the React frontend to the chain via `ethers.js` and a provider (MetaMask injected provider for writes, RPC provider for public reads). There is deliberately no Express/Node API layer.

### 9.2 Why this is viable for MVP

- All data that requires multi-party trust already lives on-chain — that's the whole premise of the project (Section 1.2).
- Public reads don't need a backend to be gasless; `eth_call` against a public/local node is already free.
- Avoiding a backend removes an entire class of infrastructure (server hosting, database, API auth) that provides no additional trust guarantee here.

### 9.3 When a backend *would* become justified (explicitly not now)

- If off-chain metadata (e.g. IPFS-hosted images, Section 15) needs indexing/search beyond what the chain can efficiently provide
- If usage volume makes direct RPC calls from every client impractical and a caching/indexing layer (e.g. TheGraph, or a custom indexer) becomes necessary
- If notification delivery (Section 15) is implemented, since push notifications need a server component

None of these apply to MVP. Do not introduce a backend preemptively.

### 9.4 Contract upgradeability — explicit non-decision

This spec does not mandate a proxy/upgradeable contract pattern for MVP. A single, non-upgradeable `PassportRegistry.sol` is simpler to audit and reason about, and upgradeability introduces its own attack surface (proxy admin key compromise, storage layout bugs). Given the local-network-only deployment target for MVP (Ganache; public deployment is Future Scope, Section 15), this tradeoff is acceptable now. **This decision must be revisited before any public mainnet/testnet deployment.**

### 9.5 Public reads without a wallet

The public verification page must function for users without MetaMask installed. This is achieved by instantiating a read-only `ethers.providers.JsonRpcProvider` pointed at the configured RPC endpoint for all public-page reads, reserving the MetaMask-injected `Web3Provider` for signing transactions in the authenticated dashboards.

---

## 10. Smart Contract Architecture

### 10.1 Single contract, internally organized

Per project philosophy, this is **one contract**: `PassportRegistry.sol`. It is organized internally into clearly commented sections rather than split into multiple contracts, because:

- The domain is small enough that cross-contract calls would add gas overhead and complexity without a corresponding benefit.
- All the data (products, warranties, repairs, transfers) is relationally tied to the same Passport ID — splitting it across contracts would mean either duplicating access-control logic in each contract or introducing brittle cross-contract trust assumptions.
- A single audited contract is easier to reason about for a security review than several interacting ones.

Internal section organization (as Solidity comment regions, in this order):

```
1. State variables & structs
2. Enums
3. Events
4. Modifiers (access control)
5. Admin functions
6. Manufacturer functions
7. Service Center functions
8. Owner functions
9. Public view functions
10. Internal/private helper functions
```

This ordering mirrors the role hierarchy in Section 3 and should be preserved as the contract grows — a new engineer should be able to find "who can call what" by scanning section headers alone.

### 10.2 Access control modifiers

```solidity
modifier onlyAdmin()
modifier onlyApprovedManufacturer()
modifier onlyApprovedServiceCenter()
modifier onlyProductOwner(string memory passportId)
modifier onlyProductManufacturer(string memory passportId)
modifier notReportedStolen(string memory passportId)
```

Every state-changing external function must use at least one of these. A function with no access modifier is treated as a bug, not an oversight to be fixed later — flag it in review immediately.

### 10.3 Revocation

Admin can revoke a manufacturer's or service center's `approved` flag. Revocation does **not** retroactively invalidate past actions (a repair record added by a since-revoked service center remains valid history — rewriting history would defeat the entire purpose of the system per Section 1.2). It only blocks future writes from that address.

### 10.4 Replay and duplicate-action prevention

- Each write function checks current on-chain state before acting (e.g., `initiateTransfer` reverts if a transfer is already `Pending`), which prevents duplicate/conflicting actions within the same chain state.
- Standard EVM transaction nonce handling already prevents literal transaction replay; no additional nonce scheme is implemented at the application layer for MVP.
- `acceptTransfer` explicitly checks `msg.sender == pendingTransfer.to` to prevent any address other than the intended recipient from completing a transfer.

---

## 11. Security Considerations

| Concern | Mitigation |
|---|---|
| Role-based access control | Enforced via Solidity modifiers on every state-changing function (Section 10.2), never assumed from frontend routing alone |
| Wallet authentication | MetaMask signature is the sole authentication mechanism; `msg.sender` is the source of truth for identity, never a value passed as a parameter |
| Ownership validation | `onlyProductOwner` modifier re-checks `currentOwner` on every owner action, not cached client-side state |
| Input validation | Passport ID format validated on registration; string length limits enforced to bound gas costs and prevent storage-spam griefing |
| Smart contract security | No `delegatecall` to untrusted addresses; no unbounded loops over user-controlled arrays in any function that costs gas for a single caller; checks-effects-interactions ordering followed in every state-changing function |
| Replay prevention | Covered by state-based guards (10.4); no custom signature scheme is introduced that would need its own replay protection |
| Unauthorized access prevention | Every dashboard's write actions are gated twice: contract-level modifiers (authoritative) and frontend-level role checks (UX only, never trusted as the real gate) |
| Front-running on transfer accept | `acceptTransfer` is address-gated (`msg.sender == pendingTransfer.to`), so front-running the accept call has no benefit to an attacker — they still can't satisfy the sender check |

**Standing rule:** any frontend check (e.g., "hide this button if role !== manufacturer") is a UX convenience only. It must have a corresponding on-chain check. If a security review finds a frontend-only permission check, it is a bug, not a soft/acceptable gap.

---

## 12. Dashboards

Each dashboard is a distinct route/view, sharing common components (Product Timeline, Passport Card, QR display) but with role-specific actions:

- **Admin Dashboard** — pending manufacturer/service center approvals; registered organizations list; revocation controls.
- **Manufacturer Dashboard** — register new product form; list of products registered by this manufacturer with status; activate warranty action.
- **Service Center Dashboard** — search-by-Passport-ID to add a repair record; list of repairs this service center has logged.
- **Owner Dashboard** — passports currently owned; initiate/cancel/accept transfer actions; report stolen/recovered; full Product Timeline per owned passport.
- **Public Verification Dashboard** — search bar / QR scan entry point; read-only passport view with full public timeline; no wallet required (Section 9.5).

Every dashboard that shows a specific product renders the Product Timeline (Section 8.2) as its centerpiece — this is a shared component, not five separate implementations.

---

## 13. Folder Structure

```
digital-product-passport/
├── contracts/
│   ├── PassportRegistry.sol
│   └── interfaces/                # reserved for future multi-contract needs (Section 15)
├── test/
│   ├── PassportRegistry.admin.test.js
│   ├── PassportRegistry.manufacturer.test.js
│   ├── PassportRegistry.serviceCenter.test.js
│   ├── PassportRegistry.owner.test.js
│   └── PassportRegistry.transfer.test.js
├── scripts/
│   ├── deploy.js
│   └── seed.js                    # seeds Ganache with demo manufacturers/products for local dev
├── hardhat.config.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── timeline/          # Product Timeline component (Section 8.2)
│   │   │   ├── passport/          # Passport card, QR display
│   │   │   └── shared/            # buttons, forms, layout primitives
│   │   ├── dashboards/
│   │   │   ├── AdminDashboard/
│   │   │   ├── ManufacturerDashboard/
│   │   │   ├── ServiceCenterDashboard/
│   │   │   ├── OwnerDashboard/
│   │   │   └── PublicVerification/
│   │   ├── hooks/                 # useContract, useWallet, useRole
│   │   ├── contracts/             # ABI + address exports from Hardhat artifacts
│   │   ├── utils/
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

The `frontend/src/contracts/` directory is the single point where the frontend imports contract ABI and deployed address — generated/copied from Hardhat's build artifacts by the deploy script, so the frontend is never manually kept in sync with contract changes.

---

## 14. Coding Standards

### 14.1 Naming conventions

- **Solidity**: `PascalCase` for contracts/structs/events, `camelCase` for functions/variables, `UPPER_SNAKE_CASE` for constants.
- **React**: `PascalCase` for components and their files (`OwnerDashboard.jsx`), `camelCase` for hooks (`useContract.js`) and utility functions.
- **Passport ID format**: fixed prefix `DPP-` followed by a zero-padded incrementing number, generated and validated in the contract, never client-side.

### 14.2 Folder conventions

- One component per file; a component's styles (if any) live alongside it, not in a global catch-all stylesheet.
- Each dashboard owns its subcomponents in its own folder; shared cross-dashboard components go in `components/shared/`.

### 14.3 Component conventions

- Presentational components (e.g. `PassportCard`) receive data via props only — no direct contract calls inside them.
- Contract interaction is isolated to hooks (`useContract`, role-specific action hooks) so that presentational components stay testable without mocking `ethers.js`.

### 14.4 Function naming (contract)

- Actions are verbs: `registerProduct`, `initiateTransfer`, `acceptTransfer`, `addRepairRecord`, `reportStolen`, `reportRecovered`.
- View functions are prefixed with `get`: `getProduct`, `getRepairHistory`, `getOwnershipHistory`.

### 14.5 Smart contract organization

Follow the section ordering defined in Section 10.1 exactly. New functions are added to the section matching their role, not appended to the end of the file.

### 14.6 Commenting standards

- Every external/public function has a NatSpec comment block (`@notice`, `@param`, `@return`) — this is not optional, since this contract is the system of record and will be read by auditors and future engineers with no other documentation.
- Non-obvious business rules (e.g., why `Recovered` doesn't auto-revert to `Active`, Section 6) are commented at the point of implementation, referencing the relevant PROJECT_SPEC.md section number.

### 14.7 Commit message conventions

Conventional Commits format:

```
<type>(<scope>): <short summary>

type: feat | fix | refactor | test | docs | chore
scope: contract | frontend | admin-dashboard | owner-dashboard | etc.
```

Example: `feat(contract): add notReportedStolen modifier to transfer functions`

---

## 15. Future Scope (explicitly out of MVP)

These are acknowledged, intentionally deferred, and should not be designed around prematurely:

- **IPFS** — for storing product images/documents off-chain with a content hash referenced on-chain, once the platform needs rich media rather than text metadata.
- **Public Ethereum deployment** — MVP targets Ganache/local testnets only; mainnet or public testnet deployment requires revisiting Section 9.4 (upgradeability) and a full security audit first.
- **NFT integration** — representing passports as ERC-721 tokens would make ownership transfer composable with existing wallet/marketplace tooling, but adds standards-compliance overhead not needed for MVP's closed transfer flow.
- **IoT integration** — automatic status updates from sensors (e.g., tamper detection) would feed into `ProductStatus` but requires a trusted oracle design that doesn't exist yet.
- **Analytics** — aggregate dashboards (e.g., "repairs per model") are a read-layer concern and would likely require the indexing layer discussed in Section 9.3.
- **Notifications** — push/email alerts on transfer requests, stolen reports, etc., require the backend component explicitly deferred in Section 9.3.
- **Multi-chain support** — would require abstracting the current single-provider `ethers.js` setup behind a chain-selection layer; not justified until there's a concrete reason (e.g. gas cost on target chain).

---

## 16. Glossary

- **Passport / DPP**: The complete digital record for one physical product.
- **Passport ID**: Platform-generated unique identifier for a passport (`DPP-000001`), distinct from the manufacturer's serial number.
- **Current state**: The latest values for a product (owner, status, warranty), stored once and overwritten in place.
- **Historical record**: Append-only repair/transfer/event data, never overwritten.
- **Approved**: A manufacturer or service center address that Admin has explicitly whitelisted for write access.

---

*End of PROJECT_SPEC.md. Any change to role permissions, the status state machine (Section 6), or the contract's function set requires a corresponding update to this document in the same pull request.*
