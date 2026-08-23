# Blockchain-Based Digital Product Passport System

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.x-yellow.svg)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff.svg)](https://vitejs.dev/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-purple.svg)](https://docs.ethers.org/v6/)

The **Digital Product Passport (DPP)** system gives every physical product a persistent, verifiable digital identity recorded on an Ethereum-compatible blockchain. It enables manufacturers, authorized service centers, product owners, and public consumers to interact with a shared, tamper-evident lifecycle history (registration, warranties, repair logs, transfers, and theft reports) without relying on a centralized database.

---

## 1. Architecture & Design Philosophy

- **Single Smart Contract Source of Truth**: Core on-chain logic resides in `contracts/PassportRegistry.sol`.
- **Current State vs. Event History**:
  - **On-Chain State**: Stores current product state (owner, status, repair count, warranty timestamp) in a bounded struct for gas efficiency.
  - **Historical Records**: Repairs, transfers, and status changes are recorded as indexed blockchain events, enabling client-side reconstruction of the product timeline without unbounded storage costs.
- **Serverless Architecture**: All reads and writes occur directly between the React client and the Ethereum node via `ethers.js` (read-only `JsonRpcProvider` for public verification; MetaMask `BrowserProvider` for authenticated role dashboards).

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Smart Contracts** | Solidity `^0.8.20` | Smart contract language with native overflow checks and custom errors |
| **Development Toolchain** | Hardhat 3 (TypeScript) | Compilation, testing, scripting, and deployment modules |
| **Libraries** | OpenZeppelin Contracts | Standard contract utilities and access controls |
| **Frontend Framework** | React 18 + TypeScript + Vite | Scalable UI and role-based dashboards |
| **Web3 Provider** | ethers.js (v6) | Contract abstraction and JSON-RPC / MetaMask integration |
| **Styling & UI** | Vanilla CSS + React Icons | Responsive layout, modern dark theme, and micro-interactions |
| **QR Code Engine** | qrcode.react | Client-side QR generation for public verification URLs |
| **Local Dev Node** | Ganache | Local EVM network with deterministic test accounts |

---

## 3. Project Structure

```
BlockChain/
├── contracts/
│   ├── PassportRegistry.sol         # Core Digital Product Passport contract
│   └── interfaces/                  # Reserved for multi-contract interfaces
├── scripts/
│   ├── deploy.ts                    # Deployment script (exports ABI & address to frontend)
│   └── seed.ts                      # Local dev chain seeding script
├── test/                            # Domain-organized Hardhat test suites
│   ├── PassportRegistry.admin.test.ts
│   ├── PassportRegistry.manufacturer.test.ts
│   ├── PassportRegistry.owner.test.ts
│   ├── PassportRegistry.serviceCenter.test.ts
│   ├── PassportRegistry.status.test.ts
│   └── PassportRegistry.transfer.test.ts
├── ignition/
│   └── modules/
│       └── PassportRegistry.ts      # Hardhat Ignition deployment module
├── frontend/                        # Frontend workspace (React + TS + Vite)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── assets/                  # Static media, icons, and assets
│       ├── components/              # Modular UI components
│       │   ├── passport/            # Passport cards, metadata badges, QR components
│       │   ├── timeline/            # Chronological product lifecycle feed
│       │   └── shared/              # Reusable buttons, modals, transaction states
│       ├── contracts/               # Generated ABI and deployed address artifacts
│       │   ├── PassportRegistryABI.json
│       │   └── contract-address.json
│       ├── hooks/                   # Custom Web3 and wallet state hooks
│       ├── layouts/                 # Page layouts and navigation
│       ├── pages/                   # Role-based dashboard and public verification views
│       ├── services/                # Provider and contract interaction services
│       ├── styles/                  # Global CSS styles and design tokens
│       ├── types/                   # TypeScript interfaces and domain enums
│       ├── utils/                   # Passport ID formatting and error decoding
│       ├── App.tsx                  # Root application component
│       └── main.tsx                 # React entry point
├── hardhat.config.ts                # Compiler (0.8.20) and network configuration
├── tsconfig.json
├── package.json                     # Root orchestrator scripts & dev dependencies
├── .env.example                     # Root environment variable template
├── .gitignore                       # Root gitignore
└── PROJECT_SPEC_v2.md               # Master architectural specification
```

---

## 4. Prerequisites

- **Node.js**: `v18.x` or `v20.x` LTS recommended
- **npm**: `v9.x` or higher
- **Ganache**: [Ganache UI](https://trufflesuite.com/ganache/) or `ganache-cli` for local blockchain simulation
- **MetaMask**: Browser extension for managing Web3 test accounts

---

## 5. Quickstart & Installation

```bash
# 1. Install root dependencies (Hardhat 3 toolchain & OpenZeppelin)
npm install

# 2. Install frontend dependencies
cd frontend && npm install && cd ..
```

---

## 6. Blockchain Development (Smart Contracts)

All smart contract operations are run directly from the repository root:

### Compile Smart Contracts
```bash
npm run compile
# or: npx hardhat compile
```

### Run Test Suite
```bash
npm test
# or: npx hardhat test
```

### Deploy to Local Network (Ganache)
Ensure Ganache is running on `http://127.0.0.1:7545` (Chain ID `1337`).

```bash
npm run deploy:ganache
# or: npx hardhat run scripts/deploy.ts --network ganache
```
*Note: Deploying automatically writes `PassportRegistryABI.json` and `contract-address.json` directly into `frontend/src/contracts/`.*

### Seed Demo Data (Local Development)
```bash
npm run seed:ganache
# or: npx hardhat run scripts/seed.ts --network ganache
```

---

## 7. Frontend Development

Run the frontend development server:

```bash
npm run dev
# or: npm run frontend:dev
```

The application will be accessible at:
```
http://localhost:3000
```

To build for production:
```bash
npm run build
```

---

## 8. Manual Setup Guide: Ganache & MetaMask

To test the application locally with multiple roles (Admin, Manufacturer, Service Center, Owner):

### Step 1: Configure Ganache
1. Open **Ganache** and select **Quickstart (Ethereum)** or create a new workspace.
2. In **Settings -> Server**:
   - **Hostname**: `127.0.0.1`
   - **Port Number**: `7545`
   - **Network ID / Chain ID**: `1337`
3. Save and restart the workspace.

### Step 2: Configure MetaMask
1. Open your MetaMask browser extension.
2. Click the **Network Selector** dropdown in the top left -> **Add Network** -> **Add a network manually**.
3. Fill in the network details:
   - **Network Name**: `Ganache Local`
   - **New RPC URL**: `http://127.0.0.1:7545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: `ETH`
4. Click **Save** and switch to `Ganache Local`.

### Step 3: Import Ganache Test Accounts
1. In Ganache, click the **key icon** next to any account to view its private key.
2. In MetaMask, click your account avatar -> **Add account or hardware wallet** -> **Import account**.
3. Paste the private key and name the account (e.g., `Ganache Admin`, `Ganache Manufacturer`).
4. Repeat for 2–3 accounts to simulate role switching and ownership transfers.

---

## 9. License

This project is licensed under the MIT License.
