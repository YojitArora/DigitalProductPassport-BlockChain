# TraceLedger — Enterprise Web3 Infrastructure

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.x-yellow.svg)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff.svg)](https://vitejs.dev/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-purple.svg)](https://docs.ethers.org/v6/)
[![Tests](https://img.shields.io/badge/Tests-98%20Passing-brightgreen.svg)](#6-testing--verification)

**TraceLedger** is an enterprise-grade Web3 infrastructure platform for persistent, verifiable **Digital Product Passports (DPPs)**. It provides a decentralized, tamper-evident record of product provenance, alternating lifecycle history ledgers, certified maintenance records, two-step custody transfers, factory inventory retention, and anti-theft locking.

---

## 1. System Architecture & Design Philosophy

TraceLedger couples gas-efficient on-chain smart contract storage with an event-driven historical auditing engine:

- **Single Smart Contract Source of Truth**: All core blockchain logic resides in [`contracts/PassportRegistry.sol`](file:///Users/yojitarora/Documents/BlockChain/contracts/PassportRegistry.sol).
- **Bounded Storage with Event Sourcing**:
  - **On-Chain State**: Stores current state (`owner`, `status`, `repairCount`, `lastRepairTimestamp`, `warranty`) in tightly packed storage slots.
  - **Product History Ledger**: Every lifecycle mutation emits indexed EVM events (`ProductRegistered`, `OwnershipTransferRequested`, `OwnershipTransferAccepted`, `OwnershipTransferCancelled`, `ServiceStarted`, `ServiceCompleted`, `WarrantyActivated`, `ProductReportedStolen`, `ProductRecovered`), enabling full off-chain timeline reconstruction without unbounded contract storage growth.
- **Serverless Web3 Client**:
  - **Public Verification**: Direct read-only RPC calls via fallback provider without requiring MetaMask or wallet connection.
  - **Authorized Role Portals**: MetaMask `BrowserProvider` with dynamic multi-role detection (`isAdmin`, `isApprovedManufacturer`, `isApprovedServiceCenter`, `isOwner`) and 6-stage transaction lifecycle feedback.

---

## 2. Core Capabilities

### 🏛️ Role-Based Governance & Portals
- **Platform Admin Portal**: Authorize and revoke manufacturers and certified service centers; assign platform admin governance rights.
- **Manufacturer Portal**: Register & mint Digital Product Passports directly to customers or hold in factory inventory; activate certified warranties; execute direct inventory sales.
- **Service Center Portal**: Register products for service with on-chain anti-theft checks; log certified maintenance records with permanent description hashes.
- **Owner Portal**: Manage owned products; execute two-step custody transfers (`initiateTransfer` & `acceptTransfer`); cancel pending transfers; report stolen and mark recovered.

### 🛡️ Product Lifecycle & Trustless Verification
- **Alternating S-Curve History Ledger**: Interactive visual timeline tracking every event from birth to custody transfers, maintenance, and status changes.
- **Professional DPP ID System**: Deterministic alphanumeric identifiers (e.g. `DPP-AURA-000001`) with automatic 6-digit zero padding and query resolution.
- **Dynamic Warranty Evaluation**: Real-time evaluation of active vs. expired warranty duration directly computed from block timestamps.
- **Anti-Theft Protocol**: Products flagged as `ReportedStolen` immediately block custody transfers and unauthorized maintenance intake.
- **Dynamic QR Code Engine**: High-resolution QR code generator encoding verification URLs with one-click copy and PNG canvas export.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Smart Contracts** | Solidity `^0.8.20` | Custom errors, packed structs, and role-based access control |
| **Development Toolchain** | Hardhat 3 (TypeScript) | Compilation, testing, deployment, and type generation |
| **Frontend Framework** | React 18 + TypeScript + Vite | Enterprise SPA with dark charcoal design system and vertical sidebar |
| **Web3 Provider** | Ethers.js (v6) | Contract abstraction, JSON-RPC provider, and MetaMask signer integration |
| **QR Code Engine** | `qrcode.react` | Client-side dynamic QR code rendering and canvas PNG export |
| **Styling & Icons** | Vanilla CSS + `react-icons/lu` | Pitch-black theme, design tokens, and micro-interactions |
| **Local Blockchain** | Ganache / Hardhat Node | Deterministic EVM network with pre-funded test accounts |

---

## 4. Repository Structure

```
BlockChain/
├── contracts/
│   ├── PassportRegistry.sol         # Core Digital Product Passport registry
│   └── interfaces/                  # Contract interface declarations
├── scripts/
│   ├── deploy.ts                    # Deployment script (exports ABI & address to frontend)
│   └── seed.ts                      # Local development chain demo seeding script
├── test/                            # Hardhat TypeScript test suites (98 passing tests)
│   ├── PassportRegistry.admin.test.ts
│   ├── PassportRegistry.manufacturer.test.ts
│   ├── PassportRegistry.owner.test.ts
│   ├── PassportRegistry.serviceCenter.test.ts
│   ├── PassportRegistry.status.test.ts
│   ├── PassportRegistry.transfer.test.ts
│   └── dppIdUtils.test.ts
├── frontend/                        # Frontend workspace (React + TS + Vite)
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Sidebar.tsx          # Full-height vertical navigation sidebar
│   │   │   ├── ProductCard.tsx      # Digital product passport presentation card
│   │   │   ├── QRCodeModal.tsx      # Dynamic QR code generator modal
│   │   │   ├── StatusBadge.tsx      # Lifecycle status badge
│   │   │   ├── WarrantyBadge.tsx    # Dynamic warranty countdown badge
│   │   │   ├── TransactionModal.tsx # Multi-stage transaction progress modal
│   │   │   ├── timeline/            # LifecycleTimeline S-curve component
│   │   │   └── repair/              # PublicRepairHistory ledger component
│   │   ├── context/                 # WalletContext & AuthContext
│   │   ├── contracts/               # Generated ABI & deployed contract addresses
│   │   ├── hooks/                   # useWallet, useAuth, useTransaction
│   │   ├── pages/                   # PublicVerifyPage, Operations, Role Portals, Login
│   │   ├── services/                # PassportService, HistoryService, provider
│   │   ├── styles/                  # Global CSS variables and design tokens
│   │   ├── types/                   # TypeScript domain interfaces
│   │   ├── App.tsx                  # Root application shell router
│   │   └── main.tsx                 # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── hardhat.config.ts                # Compiler (0.8.20) and network configuration
├── package.json                     # Root orchestrator scripts
├── .env.example                     # Root environment variable template
└── README.md                        # Master documentation
```

---

## 5. Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x` or higher
- **MetaMask**: Browser extension for Web3 authentication
- **Ganache**: [Ganache UI](https://trufflesuite.com/ganache/) or local Ethereum node

### Step 1: Install Dependencies
```bash
# Install root dependencies (Hardhat toolchain)
npm install

# Install frontend dependencies
npm run frontend:install
```

### Step 2: Compile & Test Smart Contracts
```bash
# Compile contracts with Solidity 0.8.20
npm run compile

# Execute complete test suite (98 passing unit & integration tests)
npm test
```

### Step 3: Deploy to Local Network
Start Ganache on `http://127.0.0.1:7545` (Chain ID `1337`), then run:
```bash
npm run deploy:ganache
```
*Note: Deploying automatically synchronizes the compiled ABI and contract address directly into `frontend/src/contracts/`.*

### Step 4: Seed Demo Data (Optional)
Populate your local contract with a registered manufacturer, certified service center, and sample product passports:
```bash
npm run seed:ganache
```

### Step 5: Start the Frontend Application
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 6. Testing & Verification

The test suite covers full unit, integration, and security edge cases across all smart contract modules and utility layers:

```bash
npm test
```

```
  98 passing (1s)
```

---

## 7. Security Best Practices

- **Never Commit Secrets**: Do not commit real private keys, seed phrases, or sensitive RPC API keys to version control.
- **Environment Isolation**: Always copy `.env.example` to `.env` locally for custom network configuration.
- **Safe Development Keys**: Test accounts generated by local Ganache networks should never be used on public Ethereum mainnets or hold real funds.

---

## 8. License

This project is licensed under the [MIT License](LICENSE).
