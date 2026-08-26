import React, { useState } from "react";
import { LedgerEvent } from "../../types";
import { formatDateTime, formatDate } from "../../utils/dateUtils";
import {
  LuWrench,
  LuShieldCheck,
  LuCalendar,
  LuChevronDown,
  LuChevronUp,
  LuCopy,
  LuCheck,
  LuBuilding2,
  LuHash,
  LuArrowUpDown,
  LuFileText,
} from "react-icons/lu";

interface PublicRepairHistoryProps {
  events: LedgerEvent[];
  productStatus?: number;
}

export const PublicRepairHistory: React.FC<PublicRepairHistoryProps> = ({
  events,
}) => {
  const [expandedRepairIds, setExpandedRepairIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [copiedActorId, setCopiedActorId] = useState<string | null>(null);

  // Extract all repair events from the unified Product History Ledger
  const repairEvents = events.filter(
    (evt) => evt.type === "RepairRecorded" || (evt.category === "Service" && evt.metadata?.repairNumber)
  );

  // Sort repairs chronologically (asc = oldest first, desc = newest first)
  const sortedRepairs = [...repairEvents].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0;
    } else {
      return a.timestamp > b.timestamp ? -1 : a.timestamp < b.timestamp ? 1 : 0;
    }
  });

  const toggleExpand = (id: string) => {
    setExpandedRepairIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = (text: string, id: string, type: "tx" | "actor") => {
    navigator.clipboard.writeText(text);
    if (type === "tx") {
      setCopiedTxId(id);
      setTimeout(() => setCopiedTxId(null), 2000);
    } else {
      setCopiedActorId(id);
      setTimeout(() => setCopiedActorId(null), 2000);
    }
  };

  const truncate = (addr?: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "Unknown";

  return (
    <div
      className="card-base"
      style={{
        padding: "2rem",
      }}
    >
      {/* Section Header & Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-md)",
              background: "var(--status-warning-tint)",
              color: "var(--status-warning)",
              fontSize: "20px",
              border: "1px solid rgba(245, 158, 11, 0.25)",
            }}
          >
            <LuWrench />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h2 className="text-card-title" style={{ fontSize: "1.35rem" }}>
                Certified Maintenance & Repair Records
              </h2>
              <span className="badge-base badge-warning">
                {repairEvents.length} {repairEvents.length === 1 ? "Record" : "Records"}
              </span>
            </div>
            <p className="text-secondary" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Official certified service sessions, replacement notes, and maintenance signatures recorded on-chain
            </p>
          </div>
        </div>

        {/* Sort Order Toggle */}
        {repairEvents.length > 1 && (
          <button
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="btn btn-secondary"
            style={{
              padding: "0.4rem 0.85rem",
              fontSize: "0.8rem",
            }}
            title="Toggle chronological sorting"
          >
            <LuArrowUpDown />
            <span>{sortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {repairEvents.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          <LuWrench style={{ fontSize: "2.25rem", color: "var(--text-muted)", marginBottom: "0.75rem", opacity: 0.6 }} />
          <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem", fontSize: "1rem" }}>
            No Maintenance Records Recorded
          </div>
          <div style={{ color: "var(--text-secondary)" }}>
            This product passport contains no on-chain repair or service history.
          </div>
        </div>
      ) : (
        /* Expandable Repair Cards List */
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sortedRepairs.map((repair) => {
            const isExpanded = expandedRepairIds.has(repair.id);
            const repairNum = repair.metadata?.repairNumber || "1";
            const scName = repair.metadata?.serviceCenterName || repair.subtitle || "Authorized Service Center";
            const scAddress = repair.metadata?.serviceCenter || repair.actor || "";
            const txHash = repair.transactionHash || "";

            return (
              <div
                key={repair.id}
                style={{
                  background: "var(--bg-card)",
                  border: isExpanded ? "1px solid var(--status-warning)" : "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
                  boxShadow: isExpanded ? "var(--shadow-md)" : "none",
                }}
              >
                {/* Collapsed Card Header (Clickable) */}
                <div
                  onClick={() => toggleExpand(repair.id)}
                  style={{
                    padding: "1.25rem 1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.85rem",
                    background: isExpanded ? "rgba(245, 158, 11, 0.05)" : "transparent",
                    transition: "background var(--transition-fast)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
                    {/* Badge */}
                    <span className="badge-base badge-warning" style={{ fontSize: "0.8rem" }}>
                      <LuHash /> Repair #{repairNum}
                    </span>

                    <span className="badge-base badge-success" style={{ fontSize: "0.75rem" }}>
                      Certified Completed
                    </span>

                    {/* Completion Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      <LuCalendar style={{ color: "var(--text-muted)" }} />
                      {formatDate(repair.timestamp)}
                    </div>

                    {/* Performed by */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600 }}>
                      <LuBuilding2 style={{ color: "var(--accent-secondary)" }} />
                      <span>{scName}</span>
                    </div>
                  </div>

                  {/* Expand / Collapse Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(repair.id);
                    }}
                    className={isExpanded ? "btn btn-primary" : "btn btn-secondary"}
                    style={{
                      padding: "0.35rem 0.8rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    {isExpanded ? (
                      <>
                        Hide Details <LuChevronUp />
                      </>
                    ) : (
                      <>
                        Inspect Details <LuChevronDown />
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Card Details Body */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "1.5rem",
                      borderTop: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.25rem",
                      background: "rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    {/* Metadata Technical Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1rem",
                      }}
                    >
                      {/* Record Index */}
                      <div
                        style={{
                          background: "var(--bg-secondary)",
                          padding: "0.85rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div className="text-label" style={{ marginBottom: "0.25rem" }}>
                          Sequential Repair Number
                        </div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                          Session #{repairNum}
                        </div>
                      </div>

                      {/* Precise Timestamp */}
                      <div
                        style={{
                          background: "var(--bg-secondary)",
                          padding: "0.85rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div className="text-label" style={{ marginBottom: "0.25rem" }}>
                          Exact Timestamp
                        </div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>
                          {formatDateTime(repair.timestamp)}
                        </div>
                      </div>

                      {/* Authorized Service Center */}
                      <div
                        style={{
                          background: "var(--bg-secondary)",
                          padding: "0.85rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span className="text-label">Service Center Wallet</span>
                          {scAddress && (
                            <button
                              onClick={() => handleCopy(scAddress, repair.id, "actor")}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: copiedActorId === repair.id ? "var(--status-success)" : "var(--text-muted)",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                              }}
                            >
                              {copiedActorId === repair.id ? <LuCheck /> : <LuCopy />} {copiedActorId === repair.id ? "Copied" : "Copy"}
                            </button>
                          )}
                        </div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "0.15rem" }}>
                          {scName}
                        </div>
                        <div className="text-address" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {truncate(scAddress)}
                        </div>
                      </div>

                      {/* Blockchain Verification Badge */}
                      <div
                        style={{
                          background: "var(--bg-secondary)",
                          padding: "0.85rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span className="text-label">Blockchain Proof</span>
                          {txHash && (
                            <button
                              onClick={() => handleCopy(txHash, repair.id, "tx")}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: copiedTxId === repair.id ? "var(--status-success)" : "var(--text-muted)",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                              }}
                            >
                              {copiedTxId === repair.id ? <LuCheck /> : <LuCopy />} {copiedTxId === repair.id ? "Copied" : "Copy"}
                            </button>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--status-success)", fontSize: "0.85rem", fontWeight: 700 }}>
                          <LuShieldCheck /> Verified On-Chain
                        </div>
                        {txHash && (
                          <div className="text-hash" style={{ marginTop: "0.2rem" }}>
                            Tx: {truncate(txHash)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Maintenance Notes Box */}
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        padding: "1.25rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                        <LuFileText style={{ color: "var(--status-warning)" }} /> Certified Maintenance Description & Service Notes
                      </div>
                      <div
                        style={{
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          background: "rgba(0, 0, 0, 0.3)",
                          padding: "0.85rem 1.15rem",
                          borderRadius: "var(--radius-sm)",
                          borderLeft: "3px solid var(--status-warning)",
                        }}
                      >
                        {repair.description || repair.metadata?.description || "Certified inspection and maintenance completed successfully."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PublicRepairHistory;
