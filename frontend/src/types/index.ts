export enum ProductStatus {
  Active = 0,
  PendingTransfer = 1,
  ReportedStolen = 2,
  RecoveredFromTheft = 3,
  Decommissioned = 4,
}

export interface PendingTransfer {
  to: string;
  requestedAt: number;
}

export interface Product {
  passportId: bigint;
  name: string;
  brand: string;
  category: string;
  modelNumber: string;
  serialNumber: string;
  manufacturer: string;
  manufacturingDate: number;
  currentOwner: string;
  warrantyEndTimestamp: number;
  repairCount: number;
  lastRepairTimestamp: number;
  status: ProductStatus;
  pendingTransfer: PendingTransfer;
}

export interface Manufacturer {
  walletAddress: string;
  name: string;
  approved: boolean;
  registeredAt: number;
}

export interface ServiceCenter {
  walletAddress: string;
  name: string;
  approved: boolean;
  registeredAt: number;
}

export interface TimelineEvent {
  type: string;
  passportId: bigint;
  actor: string;
  timestamp: number;
  details?: Record<string, any>;
  transactionHash: string;
}
