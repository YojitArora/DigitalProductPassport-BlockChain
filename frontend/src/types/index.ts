/**
 * Lifecycle status state machine for a physical product passport.
 * Aligns with the smart contract `PassportRegistry.ProductStatus` enum.
 */
export enum ProductStatus {
  Active = 0,
  UnderService = 1,
  ReportedStolen = 2,
  Recovered = 3,
}

/**
 * Product status display labels and color semantics.
 */
export const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; color: string; bg: string }
> = {
  [ProductStatus.Active]: {
    label: "Active",
    color: "var(--status-success, #10b981)",
    bg: "rgba(16, 185, 129, 0.12)",
  },
  [ProductStatus.UnderService]: {
    label: "Under Service",
    color: "var(--status-warning, #f59e0b)",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  [ProductStatus.ReportedStolen]: {
    label: "Reported Stolen",
    color: "var(--status-danger, #ef4444)",
    bg: "rgba(239, 68, 68, 0.12)",
  },
  [ProductStatus.Recovered]: {
    label: "Recovered",
    color: "var(--status-info, #3b82f6)",
    bg: "rgba(59, 130, 246, 0.12)",
  },
};

/**
 * Dynamic product warranty information.
 */
export interface Warranty {
  startTimestamp: bigint;
  endTimestamp: bigint;
  isActive?: boolean;
}

/**
 * Two-step pending ownership transfer details.
 */
export interface PendingTransfer {
  to: string;
  requestedAt: bigint;
  exists: boolean;
}

/**
 * Ephemeral repair log entry.
 */
export interface RepairRecord {
  serviceCenter: string;
  description: string;
  timestamp: bigint;
  repairNumber?: bigint;
}

/**
 * Full on-chain Digital Product Passport entity.
 */
export interface Product {
  passportId: bigint;
  manufacturer: string;
  currentOwner: string;
  status: ProductStatus;
  previousOperationalStatus: ProductStatus;
  currentServiceCenter: string;
  manufactureDate: bigint;
  createdAt: bigint;
  repairCount: bigint;
  lastRepairTimestamp: bigint;
  warranty: Warranty;
  pendingTransfer: PendingTransfer;
  productName: string;
  brand: string;
  category: string;
  modelNumber: string;
  serialNumber: string;
}

/**
 * Parameters required to register/mint a new Product Passport.
 */
export interface RegisterProductParams {
  initialOwner: string;
  productName: string;
  brand: string;
  category: string;
  modelNumber: string;
  serialNumber: string;
  manufactureDate: number | bigint;
}

/**
 * Authorized Manufacturer organization entity.
 */
export interface Manufacturer {
  walletAddress: string;
  approved: boolean;
  registeredAt: bigint;
  name: string;
}

/**
 * Authorized Service Center organization entity.
 */
export interface ServiceCenter {
  walletAddress: string;
  approved: boolean;
  registeredAt: bigint;
  name: string;
}

/**
 * Six-stage transaction lifecycle status.
 */
export type TransactionStatus =
  | "idle"
  | "preparing"
  | "awaiting_wallet_confirmation"
  | "pending_transaction"
  | "confirmed"
  | "failed";

/**
 * Full state object for an active or completed transaction.
 */
export interface TransactionState {
  status: TransactionStatus;
  stepMessage: string;
  txHash?: string;
  receipt?: any;
  error?: string;
}

/**
 * Timeline event representation for off-chain indexing.
 */
export interface TimelineEvent {
  type: string;
  passportId: bigint;
  actor: string;
  timestamp: bigint;
  details?: Record<string, any>;
  transactionHash: string;
}
