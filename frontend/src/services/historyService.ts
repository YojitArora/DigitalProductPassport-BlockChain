/**
 * @file historyService.ts
 * @notice Enterprise Product History Ledger service layer.
 * @dev Reconstructs the complete, immutable on-chain event ledger for any Digital Product Passport
 *      by querying blockchain event logs, parsing verifiable parameters, and synthesizing a chronological history.
 */

import { getPassportContract } from "./provider";
import { PassportService } from "./passportService";
import { Product, LedgerEvent, ProductHistoryLedger } from "../types";

export class HistoryService {
  /**
   * Retrieves the unified, immutable on-chain Product History Ledger for a given passport.
   */
  static async getProductHistoryLedger(passportId: bigint | number): Promise<ProductHistoryLedger> {
    const pid = BigInt(passportId.toString());
    const contract = await getPassportContract();
    const product = await PassportService.getProduct(pid);

    const ledgerEvents: LedgerEvent[] = [];

    try {
      // 1. Query all on-chain events indexed by passportId
      const [
        regLogs,
        warrantyLogs,
        transferReqLogs,
        transferAccLogs,
        transferCancelLogs,
        serviceStartLogs,
        repairLogs,
        serviceCompLogs,
        stolenLogs,
        recoveredLogs,
      ] = await Promise.all([
        contract.queryFilter(contract.filters.ProductRegistered(pid), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.WarrantyActivated(pid), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.OwnershipTransferRequested(pid), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.OwnershipTransferAccepted(pid), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.OwnershipTransferCancelled(pid), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.ServiceStarted(pid), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.RepairAdded(pid), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.ServiceCompleted(pid), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.ProductReportedStolen(pid), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.ProductRecovered(pid), 0, "latest").catch(() => []),
      ]);

      // --- Map ProductRegistered ---
      for (const log of regLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          const isInv = parsed.initialOwner.toLowerCase() === parsed.manufacturer.toLowerCase();
          ledgerEvents.push({
            id: `evt-reg-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "ProductMinted",
            category: "Manufacturing",
            title: "Product Manufactured & Registered",
            subtitle: isInv ? "Minted directly into Manufacturer Inventory" : "Minted & assigned to initial customer owner",
            description: `Digital Product Passport #${pid.toString()} minted on blockchain by authorized manufacturer. Serial number ${parsed.serialNumber}.`,
            timestamp: BigInt(parsed.timestamp.toString()),
            actor: parsed.manufacturer,
            actorRole: "Manufacturer",
            newEntity: parsed.initialOwner,
            metadata: {
              serialNumber: parsed.serialNumber,
              productName: parsed.productName,
              initialCustody: isInv ? "Manufacturer Inventory" : "Customer Ownership",
            },
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }

      // --- Map WarrantyActivated ---
      for (const log of warrantyLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          const durationDays = (BigInt(parsed.endTimestamp.toString()) - BigInt(parsed.startTimestamp.toString())) / 86400n;
          ledgerEvents.push({
            id: `evt-war-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "WarrantyActivated",
            category: "Warranty",
            title: "Commercial Warranty Activated",
            subtitle: `${durationDays.toString()}-Day Certified Manufacturer Warranty`,
            description: `Manufacturer activated standard warranty coverage starting at block timestamp ${parsed.startTimestamp.toString()}.`,
            timestamp: BigInt(parsed.startTimestamp.toString()),
            actor: parsed.manufacturer,
            actorRole: "Manufacturer",
            metadata: {
              startTimestamp: parsed.startTimestamp.toString(),
              endTimestamp: parsed.endTimestamp.toString(),
              durationDays: durationDays.toString(),
            },
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }

      // --- Map OwnershipTransferRequested ---
      for (const log of transferReqLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          ledgerEvents.push({
            id: `evt-tx-req-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "TransferRequested",
            category: "Ownership",
            title: "Ownership Transfer Initiated",
            subtitle: `Transfer requested to ${parsed.to.substring(0, 6)}...${parsed.to.substring(parsed.to.length - 4)}`,
            description: `Current owner initiated a verifiable two-step ownership transfer. Awaiting recipient acceptance.`,
            timestamp: BigInt(parsed.timestamp.toString()),
            actor: parsed.from,
            actorRole: "Current Owner",
            previousEntity: parsed.from,
            newEntity: parsed.to,
            metadata: {
              from: parsed.from,
              to: parsed.to,
            },
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }

      // --- Map OwnershipTransferAccepted ---
      for (const log of transferAccLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          ledgerEvents.push({
            id: `evt-tx-acc-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "TransferAccepted",
            category: "Ownership",
            title: "Ownership Transfer Accepted",
            subtitle: `Custody transferred to ${parsed.to.substring(0, 6)}...${parsed.to.substring(parsed.to.length - 4)}`,
            description: `Designated recipient accepted ownership transfer. Legal product custody updated on-chain.`,
            timestamp: BigInt(parsed.timestamp.toString()),
            actor: parsed.to,
            actorRole: "New Owner",
            previousEntity: parsed.from,
            newEntity: parsed.to,
            metadata: {
              previousOwner: parsed.from,
              newOwner: parsed.to,
            },
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }

      // --- Map OwnershipTransferCancelled ---
      for (const log of transferCancelLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          ledgerEvents.push({
            id: `evt-tx-can-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "TransferCancelled",
            category: "Ownership",
            title: "Ownership Transfer Cancelled",
            subtitle: `In-flight transfer to ${parsed.to.substring(0, 6)}... revoked`,
            description: `Product owner aborted the pending transfer request. Current custody retained.`,
            timestamp: BigInt(parsed.timestamp.toString()),
            actor: parsed.from,
            actorRole: "Current Owner",
            previousEntity: parsed.from,
            newEntity: parsed.to,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }

      // Helper to resolve entity names
      const scCache = new Map<string, string>();
      const resolveServiceName = async (addr: string): Promise<string> => {
        const key = addr.toLowerCase();
        if (scCache.has(key)) return scCache.get(key)!;
        try {
          const sc = await contract.getServiceCenter(addr);
          if (sc.name) {
            scCache.set(key, sc.name);
            return sc.name;
          }
        } catch {}
        const fallback = `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
        scCache.set(key, fallback);
        return fallback;
      };

      // --- Map ServiceStarted ---
      for (const log of serviceStartLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          const scName = await resolveServiceName(parsed.serviceCenter);
          ledgerEvents.push({
            id: `evt-srv-start-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "ServiceStarted",
            category: "Service",
            title: "Certified Service Session Opened",
            subtitle: `Intake by ${scName}`,
            description: `Authorized service center (${scName}) accepted product for maintenance or certified inspection. Status changed to UnderService.`,
            timestamp: BigInt(parsed.timestamp.toString()),
            actor: parsed.serviceCenter,
            actorRole: "Service Center",
            metadata: {
              serviceCenter: parsed.serviceCenter,
              serviceCenterName: scName,
            },
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }

      // --- Map RepairAdded ---
      for (const log of repairLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          const scName = await resolveServiceName(parsed.serviceCenter);
          ledgerEvents.push({
            id: `evt-repair-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "RepairRecorded",
            category: "Service",
            title: `Repair #${parsed.repairNumber.toString()}`,
            subtitle: `Performed by ${scName}`,
            description: parsed.description,
            timestamp: BigInt(parsed.timestamp.toString()),
            actor: parsed.serviceCenter,
            actorRole: "Service Center",
            metadata: {
              repairNumber: parsed.repairNumber.toString(),
              description: parsed.description,
              serviceCenter: parsed.serviceCenter,
              serviceCenterName: scName,
            },
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }

      // --- Map ServiceCompleted ---
      for (const log of serviceCompLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          const scName = await resolveServiceName(parsed.serviceCenter);
          ledgerEvents.push({
            id: `evt-srv-comp-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "ServiceCompleted",
            category: "Service",
            title: "Certified Service Session Completed",
            subtitle: `Finalized by ${scName}`,
            description: `Service center (${scName}) finalized the maintenance session and restored original operational status on-chain.`,
            timestamp: BigInt(parsed.timestamp.toString()),
            actor: parsed.serviceCenter,
            actorRole: "Service Center",
            metadata: {
              serviceCenter: parsed.serviceCenter,
              serviceCenterName: scName,
            },
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }

      // --- Map ProductReportedStolen ---
      for (const log of stolenLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          ledgerEvents.push({
            id: `evt-stolen-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "TheftReported",
            category: "Security",
            title: "Reported Stolen — Security Alert",
            subtitle: `Flagged on-chain by verified owner`,
            description: `Owner reported product as stolen. On-chain transfers and servicing locked.`,
            timestamp: BigInt(parsed.timestamp.toString()),
            actor: parsed.reportedBy,
            actorRole: "Product Owner",
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }

      // --- Map ProductRecovered ---
      for (const log of recoveredLogs) {
        const parsed = (log as any).args || contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.args;
        if (parsed) {
          ledgerEvents.push({
            id: `evt-recov-${log.transactionHash}-${log.index}`,
            passportId: pid,
            type: "AssetRecovered",
            category: "Security",
            title: "Product Recovered — Security Cleared",
            subtitle: `Operational capabilities restored`,
            description: `Owner reported stolen product as recovered. Theft flag cleared and operational abilities restored.`,
            timestamp: BigInt(parsed.timestamp.toString()),
            actor: parsed.recoveredBy,
            actorRole: "Product Owner",
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }
    } catch (err) {
      console.warn("[HistoryService] Log query fallback active:", err);
    }

    // Baseline fallback if events could not be fetched or no logs returned
    if (ledgerEvents.length === 0) {
      ledgerEvents.push(...this.synthesizeBaselineEvents(product));
    }

    // Sort chronologically (ascending)
    ledgerEvents.sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });

    // Deduplicate by ID
    const seen = new Set<string>();
    const uniqueEvents = ledgerEvents.filter((evt) => {
      if (seen.has(evt.id)) return false;
      seen.add(evt.id);
      return true;
    });

    return {
      passportId: pid,
      events: uniqueEvents,
      totalEvents: uniqueEvents.length,
      lastUpdated: BigInt(Math.floor(Date.now() / 1000)),
    };
  }

  /**
   * Deterministic baseline fallback synthesized directly from stored `Product` struct.
   */
  private static synthesizeBaselineEvents(product: Product): LedgerEvent[] {
    const events: LedgerEvent[] = [];
    const pid = product.passportId;
    const isInv = product.currentOwner.toLowerCase() === product.manufacturer.toLowerCase();

    // 1. Manufacturing Event
    events.push({
      id: `fallback-mint-${pid.toString()}`,
      passportId: pid,
      type: "ProductMinted",
      category: "Manufacturing",
      title: "Product Manufactured & Registered",
      subtitle: isInv ? "Minted into Manufacturer Inventory" : "Minted & assigned to customer owner",
      description: `Physical asset manufactured and registered on-chain with serial number ${product.serialNumber}.`,
      timestamp: product.manufactureDate || product.createdAt,
      actor: product.manufacturer,
      actorRole: "Manufacturer",
      newEntity: product.currentOwner,
      metadata: {
        serialNumber: product.serialNumber,
        modelNumber: product.modelNumber,
        category: product.category,
      },
    });

    // 2. Warranty Event (if active)
    if (product.warranty.startTimestamp > 0n) {
      const durationDays = (product.warranty.endTimestamp - product.warranty.startTimestamp) / 86400n;
      events.push({
        id: `fallback-warranty-${pid.toString()}`,
        passportId: pid,
        type: "WarrantyActivated",
        category: "Warranty",
        title: "Commercial Warranty Activated",
        subtitle: `${durationDays.toString()}-Day Certified Manufacturer Warranty`,
        description: `Official manufacturer warranty registered on-chain.`,
        timestamp: product.warranty.startTimestamp,
        actor: product.manufacturer,
        actorRole: "Manufacturer",
        metadata: {
          startTimestamp: product.warranty.startTimestamp.toString(),
          endTimestamp: product.warranty.endTimestamp.toString(),
          durationDays: durationDays.toString(),
        },
      });
    }

    // 3. Pending Transfer (if active)
    if (product.pendingTransfer.exists) {
      events.push({
        id: `fallback-pending-${pid.toString()}`,
        passportId: pid,
        type: "TransferRequested",
        category: "Ownership",
        title: "Ownership Transfer Initiated",
        subtitle: `Pending acceptance by ${product.pendingTransfer.to.substring(0, 6)}...`,
        description: `Active pending ownership transfer in progress.`,
        timestamp: product.pendingTransfer.requestedAt,
        actor: product.currentOwner,
        actorRole: "Current Owner",
        previousEntity: product.currentOwner,
        newEntity: product.pendingTransfer.to,
      });
    }

    // 4. Last Repair (if recorded)
    if (product.repairCount > 0n && product.lastRepairTimestamp > 0n) {
      events.push({
        id: `fallback-repair-${pid.toString()}`,
        passportId: pid,
        type: "RepairRecorded",
        category: "Service",
        title: `Certified Maintenance (Repair Count: ${product.repairCount.toString()})`,
        subtitle: `Latest verified service record`,
        description: `Certified service and inspection performed by authorized service center.`,
        timestamp: product.lastRepairTimestamp,
        actorRole: "Service Center",
        metadata: {
          repairCount: product.repairCount.toString(),
        },
      });
    }

    return events;
  }
}
