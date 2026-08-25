/**
 * @file passportService.ts
 * @notice Reusable full-stack smart contract service layer for the Digital Product Passport.
 * @dev Encapsulates ethers v6 contract calls, struct formatting, custom error translation,
 *      and 6-stage transaction lifecycle updates across all system domains:
 *      - Section 1: Administrator Operations
 *      - Section 2: Manufacturer Operations
 *      - Section 3: Product Passport Queries
 *      - Section 4: Ownership & Transfer Lifecycle
 *      - Section 5: Service & Repair Lifecycle
 *      - Section 6: Warranty Management
 *      - Section 7: Status & Theft Lifecycle
 */

import { ContractTransactionReceipt, ContractTransactionResponse } from "ethers";
import { getPassportContract, getSigner } from "./provider";
import { formatContractError } from "./errorHandler";
import {
  Product,
  ProductStatus,
  Warranty,
  PendingTransfer,
  Manufacturer,
  ServiceCenter,
  RegisterProductParams,
  TransactionState,
} from "../types";

export type StateChangeCallback = (state: TransactionState) => void;

/**
 * Internal helper to format raw Solidity contract Product struct into typed TypeScript Product object.
 */
function mapContractProduct(raw: any): Product {
  return {
    passportId: BigInt(raw.passportId.toString()),
    manufacturer: raw.manufacturer,
    currentOwner: raw.currentOwner,
    status: Number(raw.status) as ProductStatus,
    previousOperationalStatus: Number(raw.previousOperationalStatus) as ProductStatus,
    currentServiceCenter: raw.currentServiceCenter,
    manufactureDate: BigInt(raw.manufactureDate.toString()),
    createdAt: BigInt(raw.createdAt.toString()),
    repairCount: BigInt(raw.repairCount.toString()),
    lastRepairTimestamp: BigInt(raw.lastRepairTimestamp.toString()),
    warranty: {
      startTimestamp: BigInt(raw.warranty.startTimestamp.toString()),
      endTimestamp: BigInt(raw.warranty.endTimestamp.toString()),
    },
    pendingTransfer: {
      to: raw.pendingTransfer.to,
      requestedAt: BigInt(raw.pendingTransfer.requestedAt.toString()),
      exists: Boolean(raw.pendingTransfer.exists),
    },
    productName: raw.productName,
    brand: raw.brand,
    category: raw.category,
    modelNumber: raw.modelNumber,
    serialNumber: raw.serialNumber,
  };
}

/**
 * Internal helper to execute a write transaction with full 6-stage lifecycle state reporting.
 */
async function executeTransaction(
  actionName: string,
  txPromise: (contract: any) => Promise<ContractTransactionResponse>,
  onStateChange?: StateChangeCallback
): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
  try {
    onStateChange?.({
      status: "preparing",
      stepMessage: `Preparing ${actionName}...`,
    });

    const signer = await getSigner();
    const contract = await getPassportContract(signer);
    const contractAddr = await contract.getAddress();
    const signerAddr = await signer.getAddress();
    const network = await signer.provider.getNetwork();

    console.log(`[PassportService] Executing "${actionName}"`);
    console.log(` - Contract Address: ${contractAddr}`);
    console.log(` - Signer Address: ${signerAddr}`);
    console.log(` - Chain ID: ${network.chainId.toString()}`);

    onStateChange?.({
      status: "awaiting_wallet_confirmation",
      stepMessage: `Please confirm ${actionName} in your wallet...`,
    });

    const tx = await txPromise(contract);

    onStateChange?.({
      status: "pending_transaction",
      stepMessage: `Transaction submitted. Waiting for blockchain confirmation...`,
      txHash: tx.hash,
    });

    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`Transaction failed during execution on-chain.`);
    }

    onStateChange?.({
      status: "confirmed",
      stepMessage: `${actionName} confirmed successfully on-chain!`,
      txHash: tx.hash,
      receipt,
    });

    return { txHash: tx.hash, receipt };
  } catch (error: any) {
    const formatted = formatContractError(error);
    onStateChange?.({
      status: "failed",
      stepMessage: formatted,
      error: formatted,
    });
    throw new Error(formatted);
  }
}

/**
 * Canonical PassportService encapsulating all smart contract interactions for the UI.
 */
export class PassportService {
  /* ================================================================ */
  /* 1. ADMINISTRATOR OPERATIONS                                      */
  /* ================================================================ */

  /**
   * Queries whether an address holds platform admin privileges.
   */
  static async isAdmin(account: string): Promise<boolean> {
    try {
      const contract = await getPassportContract();
      return await contract.isAdmin(account);
    } catch {
      return false;
    }
  }

  /**
   * Grants platform admin privileges to a new address.
   */
  static async addAdmin(
    newAdmin: string,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Add Platform Administrator",
      (contract) => contract.addAdmin(newAdmin),
      onStateChange
    );
  }

  /**
   * Registers a new manufacturer or re-authorizes a previously revoked manufacturer.
   */
  static async registerManufacturer(
    manufacturer: string,
    name: string,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Register Manufacturer",
      (contract) => contract.registerManufacturer(manufacturer, name),
      onStateChange
    );
  }

  /**
   * Revokes write authorization for an actively approved manufacturer.
   */
  static async revokeManufacturer(
    manufacturer: string,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Revoke Manufacturer Authorization",
      (contract) => contract.revokeManufacturer(manufacturer),
      onStateChange
    );
  }

  /**
   * Registers a new authorized service center or re-authorizes a previously revoked service center.
   */
  static async registerServiceCenter(
    serviceCenter: string,
    name: string,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Register Service Center",
      (contract) => contract.registerServiceCenter(serviceCenter, name),
      onStateChange
    );
  }

  /**
   * Revokes write authorization for an actively approved service center.
   */
  static async revokeServiceCenter(
    serviceCenter: string,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Revoke Service Center Authorization",
      (contract) => contract.revokeServiceCenter(serviceCenter),
      onStateChange
    );
  }

  /**
   * Retrieves the full registered Manufacturer entity for an address.
   */
  static async getManufacturer(account: string): Promise<Manufacturer> {
    try {
      const contract = await getPassportContract();
      const m = await contract.getManufacturer(account);
      return {
        walletAddress: m.walletAddress,
        approved: Boolean(m.approved),
        registeredAt: BigInt(m.registeredAt.toString()),
        name: m.name,
      };
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Retrieves the full registered ServiceCenter entity for an address.
   */
  static async getServiceCenter(account: string): Promise<ServiceCenter> {
    try {
      const contract = await getPassportContract();
      const sc = await contract.getServiceCenter(account);
      return {
        walletAddress: sc.walletAddress,
        approved: Boolean(sc.approved),
        registeredAt: BigInt(sc.registeredAt.toString()),
        name: sc.name,
      };
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /* ================================================================ */
  /* 2. MANUFACTURER OPERATIONS                                       */
  /* ================================================================ */

  /**
   * Queries whether an address is an actively approved manufacturer.
   */
  static async isApprovedManufacturer(account: string): Promise<boolean> {
    try {
      const contract = await getPassportContract();
      return await contract.isApprovedManufacturer(account);
    } catch {
      return false;
    }
  }

  /**
   * Mints and registers a new Digital Product Passport on-chain.
   * If `params.keepInInventory` is true, explicitly calls `registerInventoryProduct`.
   * Otherwise, calls `registerProduct` with the designated `params.initialOwner`.
   */
  static async registerProduct(
    params: RegisterProductParams,
    onStateChange?: StateChangeCallback
  ): Promise<{ passportId?: bigint; txHash: string; receipt: ContractTransactionReceipt }> {
    const isInventory = Boolean(params.keepInInventory);
    const actionName = isInventory
      ? "Inventory Product Registration"
      : "Product Registration";

    console.log(`[PassportService.registerProduct] Target Workflow: ${isInventory ? "Manufacturer Inventory" : "Customer-Owned"}`);
    console.log(" - productName:", params.productName);
    console.log(" - brand:", params.brand);
    console.log(" - category:", params.category);
    console.log(" - modelNumber:", params.modelNumber);
    console.log(" - serialNumber:", params.serialNumber);
    console.log(" - manufactureDate:", params.manufactureDate.toString());
    console.log(" - initialOwner:", params.initialOwner || "(None / Inventory)");
    console.log(" - keepInInventory:", isInventory);

    const res = await executeTransaction(
      actionName,
      async (contract) => {
        if (isInventory) {
          console.log("[PassportService] Simulating contract.registerInventoryProduct.staticCall...");
          try {
            const simId = await contract.registerInventoryProduct.staticCall(
              params.productName,
              params.brand,
              params.category,
              params.modelNumber,
              params.serialNumber,
              params.manufactureDate
            );
            console.log("[PassportService] staticCall succeeded! Simulated Passport ID:", simId.toString());
          } catch (simErr: any) {
            console.error("[PassportService] staticCall simulation failed:", simErr);
            throw simErr;
          }

          console.log("[PassportService] Invoking contract.registerInventoryProduct transaction...");
          return contract.registerInventoryProduct(
            params.productName,
            params.brand,
            params.category,
            params.modelNumber,
            params.serialNumber,
            params.manufactureDate
          );
        } else {
          const initialOwner = (params.initialOwner || "").trim();
          if (!initialOwner) {
            throw new Error("Initial customer owner address is required when not keeping in inventory.");
          }

          console.log("[PassportService] Simulating contract.registerProduct.staticCall...");
          try {
            const simId = await contract.registerProduct.staticCall(
              initialOwner,
              params.productName,
              params.brand,
              params.category,
              params.modelNumber,
              params.serialNumber,
              params.manufactureDate
            );
            console.log("[PassportService] staticCall succeeded! Simulated Passport ID:", simId.toString());
          } catch (simErr: any) {
            console.error("[PassportService] staticCall simulation failed:", simErr);
            throw simErr;
          }

          console.log("[PassportService] Invoking contract.registerProduct transaction...");
          return contract.registerProduct(
            initialOwner,
            params.productName,
            params.brand,
            params.category,
            params.modelNumber,
            params.serialNumber,
            params.manufactureDate
          );
        }
      },
      onStateChange
    );

    let mintedId: bigint | undefined;
    try {
      const contract = await getPassportContract();
      for (const log of res.receipt.logs) {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed && parsed.name === "ProductRegistered") {
          mintedId = BigInt(parsed.args.passportId.toString());
          break;
        }
      }
    } catch {
      // Non-critical parsing fallback
    }

    return { passportId: mintedId, txHash: res.txHash, receipt: res.receipt };
  }

  /**
   * Explicitly mints and registers a new Digital Product Passport into Manufacturer Inventory.
   */
  static async registerInventoryProduct(
    params: Omit<RegisterProductParams, "initialOwner" | "keepInInventory">,
    onStateChange?: StateChangeCallback
  ): Promise<{ passportId?: bigint; txHash: string; receipt: ContractTransactionReceipt }> {
    return this.registerProduct({ ...params, keepInInventory: true }, onStateChange);
  }

  /* ================================================================ */
  /* 3. PRODUCT PASSPORT QUERIES                                      */
  /* ================================================================ */

  /**
   * Retrieves the full Product passport entity for a given Passport ID.
   */
  static async getProduct(passportId: bigint | number): Promise<Product> {
    try {
      const contract = await getPassportContract();
      const raw = await contract.getProduct(passportId);
      return mapContractProduct(raw);
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Checks whether a product passport exists for a given Passport ID.
   */
  static async passportExists(passportId: bigint | number): Promise<boolean> {
    try {
      const contract = await getPassportContract();
      return await contract.passportExists(passportId);
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Returns the next auto-incrementing Passport ID that will be assigned.
   */
  static async getNextPassportId(): Promise<bigint> {
    try {
      const contract = await getPassportContract();
      const nextId = await contract.getNextPassportId();
      return BigInt(nextId.toString());
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Retrieves all minted product passports from the blockchain.
   */
  static async getAllProducts(): Promise<Product[]> {
    try {
      const nextId = await this.getNextPassportId();
      const count = Number(nextId);
      if (count <= 1) return [];

      const productPromises: Promise<Product>[] = [];
      for (let i = 1; i < count; i++) {
        productPromises.push(this.getProduct(BigInt(i)));
      }

      const results = await Promise.allSettled(productPromises);
      return results
        .filter((res): res is PromiseFulfilledResult<Product> => res.status === "fulfilled")
        .map((res) => res.value);
    } catch {
      return [];
    }
  }

  /**
   * Queries all product passports currently owned by a specific wallet.
   */
  static async getProductsByOwner(ownerAddress: string): Promise<Product[]> {
    if (!ownerAddress) return [];
    const all = await this.getAllProducts();
    return all.filter(
      (p) => p.currentOwner.toLowerCase() === ownerAddress.toLowerCase()
    );
  }

  /**
   * Queries all product passports registered by a specific manufacturer.
   */
  static async getProductsByManufacturer(manufacturerAddress: string): Promise<Product[]> {
    if (!manufacturerAddress) return [];
    const all = await this.getAllProducts();
    return all.filter(
      (p) => p.manufacturer.toLowerCase() === manufacturerAddress.toLowerCase()
    );
  }

  /**
   * Checks whether a wallet currently holds on-chain customer ownership of at least one product.
   * Unsold factory inventory is managed in the Manufacturer Portal and excluded from customer ownership.
   */
  static async hasOwnedProducts(account: string): Promise<boolean> {
    if (!account) return false;
    const owned = await this.getProductsByOwner(account);
    const customerOwned = owned.filter(
      (p) => p.manufacturer.toLowerCase() !== account.toLowerCase()
    );
    return customerOwned.length > 0;
  }

  /* ================================================================ */
  /* 4. OWNERSHIP & TRANSFER LIFECYCLE                                */
  /* ================================================================ */

  /**
   * Queries the current legal owner address of a passport.
   */
  static async getCurrentOwner(passportId: bigint | number): Promise<string> {
    try {
      const contract = await getPassportContract();
      return await contract.getCurrentOwner(passportId);
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Initiates a two-step ownership transfer to a designated recipient address.
   */
  static async initiateTransfer(
    passportId: bigint | number,
    recipient: string,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Initiate Ownership Transfer",
      (contract) => contract.initiateTransfer(passportId, recipient),
      onStateChange
    );
  }

  /**
   * Accepts a pending ownership transfer, becoming the new current owner.
   */
  static async acceptTransfer(
    passportId: bigint | number,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Accept Ownership Transfer",
      (contract) => contract.acceptTransfer(passportId),
      onStateChange
    );
  }

  /**
   * Cancels an active pending ownership transfer.
   */
  static async cancelTransfer(
    passportId: bigint | number,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Cancel Ownership Transfer",
      (contract) => contract.cancelTransfer(passportId),
      onStateChange
    );
  }

  /**
   * Retrieves the current pending ownership transfer details for a product.
   */
  static async getPendingTransfer(passportId: bigint | number): Promise<PendingTransfer> {
    try {
      const contract = await getPassportContract();
      const pt = await contract.getPendingTransfer(passportId);
      return {
        to: pt.to,
        requestedAt: BigInt(pt.requestedAt.toString()),
        exists: Boolean(pt.exists),
      };
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Checks whether a product currently has an active pending ownership transfer.
   */
  static async hasPendingTransfer(passportId: bigint | number): Promise<boolean> {
    try {
      const contract = await getPassportContract();
      return await contract.hasPendingTransfer(passportId);
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /* ================================================================ */
  /* 5. SERVICE & REPAIR LIFECYCLE                                    */
  /* ================================================================ */

  /**
   * Queries whether an address is an actively approved service center.
   */
  static async isApprovedServiceCenter(account: string): Promise<boolean> {
    try {
      const contract = await getPassportContract();
      return await contract.isApprovedServiceCenter(account);
    } catch {
      return false;
    }
  }

  /**
   * Initiates a maintenance or repair service lifecycle for a physical product passport.
   */
  static async startService(
    passportId: bigint | number,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Start Service Session",
      (contract) => contract.startService(passportId),
      onStateChange
    );
  }

  /**
   * Completes an active service session, records repair metadata, and restores operational status.
   */
  static async completeService(
    passportId: bigint | number,
    description: string,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Complete Service Session",
      (contract) => contract.completeService(passportId, description),
      onStateChange
    );
  }

  /**
   * Queries the total count of completed repairs on a product.
   */
  static async getRepairCount(passportId: bigint | number): Promise<bigint> {
    try {
      const contract = await getPassportContract();
      const count = await contract.getRepairCount(passportId);
      return BigInt(count.toString());
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Queries the timestamp of the last completed repair.
   */
  static async getLastRepairTimestamp(passportId: bigint | number): Promise<bigint> {
    try {
      const contract = await getPassportContract();
      const ts = await contract.getLastRepairTimestamp(passportId);
      return BigInt(ts.toString());
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Queries whether a product is currently under active service.
   */
  static async isUnderService(passportId: bigint | number): Promise<boolean> {
    try {
      const contract = await getPassportContract();
      return await contract.isUnderService(passportId);
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /* ================================================================ */
  /* 6. WARRANTY MANAGEMENT                                           */
  /* ================================================================ */

  /**
   * Retrieves the Warranty window struct for a product passport.
   */
  static async getWarranty(passportId: bigint | number): Promise<Warranty> {
    try {
      const contract = await getPassportContract();
      const w = await contract.getWarranty(passportId);
      const isActive = await contract.isWarrantyActive(passportId);
      return {
        startTimestamp: BigInt(w.startTimestamp.toString()),
        endTimestamp: BigInt(w.endTimestamp.toString()),
        isActive,
      };
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Queries the exact warranty expiration Unix timestamp.
   */
  static async getWarrantyEndTimestamp(passportId: bigint | number): Promise<bigint> {
    try {
      const contract = await getPassportContract();
      const end = await contract.getWarrantyEndTimestamp(passportId);
      return BigInt(end.toString());
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Computes dynamically whether the warranty for a product is currently valid and active.
   */
  static async isWarrantyActive(passportId: bigint | number): Promise<boolean> {
    try {
      const contract = await getPassportContract();
      return await contract.isWarrantyActive(passportId);
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Activates warranty for a product for a given duration in whole days.
   */
  static async activateWarranty(
    passportId: bigint | number,
    durationDays: number | bigint,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Activate Product Warranty",
      (contract) => contract.activateWarranty(passportId, durationDays),
      onStateChange
    );
  }

  /* ================================================================ */
  /* 7. STATUS & THEFT LIFECYCLE                                      */
  /* ================================================================ */

  /**
   * Queries the current lifecycle status enum of a product.
   */
  static async getProductStatus(passportId: bigint | number): Promise<ProductStatus> {
    try {
      const contract = await getPassportContract();
      const status = await contract.getProductStatus(passportId);
      return Number(status) as ProductStatus;
    } catch (err: any) {
      throw new Error(formatContractError(err));
    }
  }

  /**
   * Reports a physical product passport as stolen.
   */
  static async reportStolen(
    passportId: bigint | number,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Report Product Stolen",
      (contract) => contract.reportStolen(passportId),
      onStateChange
    );
  }

  /**
   * Reports a previously stolen product as recovered.
   */
  static async reportRecovered(
    passportId: bigint | number,
    onStateChange?: StateChangeCallback
  ): Promise<{ txHash: string; receipt: ContractTransactionReceipt }> {
    return executeTransaction(
      "Report Product Recovered",
      (contract) => contract.reportRecovered(passportId),
      onStateChange
    );
  }
}
