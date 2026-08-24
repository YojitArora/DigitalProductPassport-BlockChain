# Blockchain-Based Digital Product Passport System

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.x-yellow.svg)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff.svg)](https://vitejs.dev/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-purple.svg)](https://docs.ethers.org/v6/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

The **Digital Product Passport (DPP)** system gives physical products a persistent, verifiable digital identity recorded on an Ethereum-compatible blockchain. It provides a decentralized, tamper-evident record of product authenticity, lifecycle events, warranty coverage, certified repairs, two-step ownership transfers, and theft recovery.

---

## 1. System Architecture & Design Philosophy

The system is designed around gas-efficient on-chain state management paired with rich event-driven historical auditing:

- **Single Smart Contract Source of Truth**: All core blockchain logic resides in [`contracts/PassportRegistry.sol`](file:///Users/yojitarora/Documents/BlockChain/contracts/PassportRegistry.sol).
- **Bounded Storage with Event Sourcing**:
  - **On-Chain State**: Stores current state (`owner`, `status`, `repairCount`, `lastRepairTimestamp`, `warranty`) in optimized packed storage slots.
  - **Audit Trail**: Every lifecycle mutation emits indexed events (`ProductRegistered`, `OwnershipTransferRequested`, `OwnershipTransferAccepted`, `OwnershipTransferCancelled`, `ServiceStarted`, `ServiceCompleted`, `WarrantyActivated`, `ProductReportedStolen`, `ProductRecovered`), enabling full off-chain timeline reconstruction without unbounded storage growth.
- **Serverless Web3 Client**:
  - **Public Verification**: Direct read-only RPC calls via fallback provider without requiring MetaMask or wallet connection.
  - **Authorized Dashboards**: MetaMask `BrowserProvider` with dynamic multi-role detection (`isAdmin`, `isApprovedManufacturer`, `isApprovedServiceCenter`) and 6-stage transaction lifecycle feedback.

---

## 2. Core Features

### 🏛️ Role-Based Governance
- **Platform Admin**: Authorize and revoke manufacturers and certified service centers; add additional platform admins.
- **Approved Manufacturer**: Register & mint Digital Product Passports for physical goods; activate warranty coverage.
- **Certified Service Center**: Initiate service sessions on registered products; log certified repairs with maintenance descriptions.
- **Product Owner**: Secure two-step ownership transfers (`initiateTransfer` & `acceptTransfer`), cancel pending transfers, report products stolen, and report recovered products.

### 🛡️ Product Lifecycle & Trustless Verification
- **Dynamic Warranty Calculation**: Real-time evaluation of remaining warranty days directly from start and end timestamps.
- **Anti-Theft Protocol**: Flagging a product as `ReportedStolen` immediately blocks unauthorized ownership transfers and servicing sessions.
- **Client-Side QR Code Verification**: Generates high-resolution verifiable QR codes on demand encoding verification URLs with one-click copy and PNG download.
- **Public Verification Portal**: Instant trustless verification of any Passport ID with zero wallet requirements.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Smart Contracts** | Solidity `^0.8.20` | Core smart contract language with custom errors and optimized structs |
| **Development Toolchain** | Hardhat 3 (TypeScript) | Compilation, testing, deployment scripts, and type generation |
| **Frontend Framework** | React 18 + TypeScript + Vite | Responsive Single Page Application with dynamic role dashboards |
| **Web3 Provider** | Ethers.js (v6) | Contract abstraction, JSON-RPC provider, and MetaMask signer integration |
| **QR Code Engine** | `qrcode.react` | Client-side dynamic QR code rendering and canvas PNG export |
| **Styling & Icons** | Vanilla CSS + `react-icons/lu` | Modern dark theme, design tokens, and micro-interactions |
| **Local Blockchain** | Ganache / Hardhat Node | Deterministic EVM network with pre-funded test accounts |

---

## 4. Repository Directory Structure

```
BlockChain/
├── contracts/
│   ├── PassportRegistry.sol         # Core Digital Product Passport contract
│   └── interfaces/                  # Contract interface declarations
├── scripts/
│   ├── deploy.ts                    # Deployment script (exports ABI & address to frontend)
│   └── seed.ts                      # Local development chain demo seeding script
├── test/                            # Hardhat TypeScript test suites (86 passing tests)
│   ├── PassportRegistry.admin.test.ts
│   ├── PassportRegistry.manufacturer.test.ts
│   ├── PassportRegistry.owner.test.ts
│   ├── PassportRegistry.serviceCenter.test.ts
│   ├── PassportRegistry.status.test.ts
│   └── PassportRegistry.transfer.test.ts
├── frontend/                        # Frontend workspace (React + TS + Vite)
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── EmptyState.tsx       # Friendly empty state cards
│   │   │   ├── Navbar.tsx           # Navigation bar with wallet status
│   │   │   ├── ProductCard.tsx      # Comprehensive product passport card
│   │   │   ├── QRCodeModal.tsx      # Dynamic QR code generator modal
│   │   │   ├── RepairSummary.tsx    # Repair count and service date display
│   │   │   ├── StatusBadge.tsx      # Lifecycle status visualizer
│   │   │   ├── TransactionModal.tsx # 6-stage transaction progress modal
│   │   │   ├── TransferStatus.tsx   # Pending transfer recipient display
│   │   │   └── WarrantyBadge.tsx    # Dynamic warranty countdown badge
│   │   ├── context/
│   │   │   └── WalletContext.tsx    # Global Web3 wallet context & state
│   │   ├── contracts/               # Generated ABI & deployed contract addresses
│   │   │   ├── PassportRegistryABI.json
│   │   │   └── contract-address.json
│   │   ├── hooks/                   # Custom hooks (useWallet, useTransaction)
│   │   ├── pages/                   # PublicVerifyPage & DashboardPage
│   │   ├── services/                # PassportService, provider, errorHandler
│   │   ├── styles/                  # Global CSS variables and design tokens
│   │   ├── types/                   # Domain TypeScript models and interfaces
│   │   ├── App.tsx                  # Root application router
│   │   └── main.tsx                 # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── hardhat.config.ts                # Compiler (0.8.20) and network configuration
├── package.json                     # Root orchestrator scripts
├── .env.example                     # Environment variable template
└── README.md                        # Master documentation
```

---

## 5. Quickstart & Installation

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x` or higher
- **MetaMask**: Browser extension for Web3 authentication
- **Ganache**: [Ganache UI](https://trufflesuite.com/ganache/) or local Ethereum node

### Step 1: Install Dependencies
```bash
# Install root dependencies (Hardhat 3 toolchain)
npm install

# Install frontend dependencies
npm run frontend:install
```

### Step 2: Compile & Test Smart Contracts
```bash
# Compile contracts with Solidity 0.8.20
npm run compile

# Execute complete test suite (86 passing unit & integration tests)
npm test
```

### Step 3: Deploy to Local Network
Start Ganache on `http://127.0.0.1:7545` (Chain ID `1337`), then run:
```bash
npm run deploy:ganache
```
*Note: Deploying automatically writes the compiled ABI and deployed contract address directly into `frontend/src/contracts/`.*

### Step 4: Seed Demo Data (Optional)
Populate your local contract with a registered manufacturer, certified service center, and sample product passport #1:
```bash
npm run seed:ganache
```

### Step 5: Start the Frontend
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 6. Ganache & MetaMask Setup Guide

To test the application locally with multiple roles:

1. **Configure Ganache**:
   - Hostname: `127.0.0.1`
   - Port: `7545`
   - Network ID / Chain ID: `1337`
2. **Add Network in MetaMask**:
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`
3. **Import Test Accounts**:
   - In Ganache, click the **key icon** on Account 0 (Deployer/Admin), Account 1 (Manufacturer), Account 2 (Service Center), and Account 3 (Owner).
   - In MetaMask, select **Import Account** and paste the private key for each role.

---

## 7. Future Improvements & Roadmap

- [ ] **Decentralized Storage (IPFS / Arweave)**: Off-chain storage of high-resolution product manuals and manufacturing certificates.
- [ ] **Multi-Contract ERC-721 Tokenization**: Optional ERC-721 wrapper to allow product passports to be traded on standard NFT marketplaces.
- [ ] **Zero-Knowledge Proofs**: Selective disclosure of ownership or service history without revealing full account addresses.

---

## 8. License

This project is licensed under the [MIT License](LICENSE).
