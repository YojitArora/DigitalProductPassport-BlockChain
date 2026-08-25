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
      style={{
        background: "var(--bg-secondary, #111827)",
        border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
        borderRadius: "var(--radius-lg, 16px)",
        padding: "1.75rem",
        boxShadow: "var(--shadow-md)",
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
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.12)",
              color: "var(--status-warning, #f59e0b)",
              fontSize: "18px",
            }}
          >
            <LuWrench />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Repair History
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "var(--radius-sm)",
                  background: repairEvents.length > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  color: repairEvents.length > 0 ? "var(--status-warning)" : "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {repairEvents.length} {repairEvents.length === 1 ? "Record" : "Records"}
              </span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.825rem", marginTop: "0.1rem" }}>
              Official certified maintenance sessions and repair notes recorded on-chain by authorized service centers
            </p>
          </div>
        </div>

        {/* Sort Order Toggle */}
        {repairEvents.length > 1 && (
          <button
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-card, #1f2937)",
              color: "var(--text-secondary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Toggle chronological sorting"
          >
            <LuArrowUpDown />
            {sortOrder === "asc" ? "Oldest First (Default)" : "Newest First"}
          </button>
        )}
      </div>

      {/* Empty State */}
      {repairEvents.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2.5rem 1.5rem",
            background: "var(--bg-card, #1f2937)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          <LuWrench style={{ fontSize: "2rem", color: "var(--text-muted)", marginBottom: "0.75rem", opacity: 0.7 }} />
          <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
            No Maintenance Records
          </div>
          <div>No repair history has been recorded for this product.</div>
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
                  background: "var(--bg-card, #1f2937)",
                  border: isExpanded ? "1px solid var(--status-warning, #f59e0b)" : "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md, 12px)",
                  overflow: "hidden",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: isExpanded ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "none",
                }}
              >
                {/* Collapsed Card Header (Clickable) */}
                <div
                  onClick={() => toggleExpand(repair.id)}
                  style={{
                    padding: "1.25rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    background: isExpanded ? "rgba(245, 158, 11, 0.04)" : "transparent",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    {/* Badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(245, 158, 11, 0.15)",
                        color: "var(--status-warning, #f59e0b)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                      }}
                    >
                      <LuHash /> Repair #{repairNum}
                    </div>

                    <span
                      style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "var(--status-success, #10b981)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      Completed
                    </span>

                    {/* Completion Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-secondary)", fontSize: "0.825rem" }}>
                      <LuCalendar style={{ color: "var(--text-muted)" }} />
                      {formatDate(repair.timestamp)}
                    </div>

                    {/* Performed by */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-primary)", fontSize: "0.825rem", fontWeight: 600 }}>
                      <LuBuilding2 style={{ color: "var(--accent-secondary, #06b6d4)" }} />
                      Performed by: {scName}
                    </div>
                  </div>

                  {/* Expand / Collapse Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(repair.id);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      background: isExpanded ? "var(--status-warning)" : "var(--bg-secondary, #111827)",
                      color: isExpanded ? "#111827" : "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isExpanded ? (
                      <>
                        Hide Details <LuChevronUp />
                      </>
                    ) : (
                      <>
                        View Details <LuChevronDown />
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Card Details Body */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "1.25rem",
                      borderTop: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      background: "rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {/* Metadata Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "0.75rem",
                      }}
                    >
                      {/* Record Index */}
                      <div
                        style={{
                          background: "var(--bg-card)",
                          padding: "0.75rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "0.2rem" }}>
                          Sequential Repair Number
                        </div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                          Session #{repairNum}
                        </div>
                      </div>

                      {/* Precise Timestamp */}
                      <div
                        style={{
                          background: "var(--bg-card)",
                          padding: "0.75rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "0.2rem" }}>
                          Exact Timestamp
                        </div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>
                          {formatDateTime(repair.timestamp)}
                        </div>
                      </div>

                      {/* Authorized Service Center */}
                      <div
                        style={{
                          background: "var(--bg-card)",
                          padding: "0.75rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Service Center Wallet</span>
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
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {truncate(scAddress)}
                        </div>
                      </div>

                      {/* Blockchain Verification Badge */}
                      <div
                        style={{
                          background: "var(--bg-card)",
                          padding: "0.75rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Blockchain Proof</span>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--status-success)", fontSize: "0.85rem", fontWeight: 600 }}>
                          <LuShieldCheck /> Verified On-Chain
                        </div>
                        {txHash && (
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-primary)", marginTop: "0.15rem" }}>
                            Tx: {truncate(txHash)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Maintenance Notes Box */}
                    <div
                      style={{
                        background: "var(--bg-card)",
                        padding: "1rem 1.25rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                        <LuFileText style={{ color: "var(--status-warning)" }} /> Certified Maintenance Description & Service Notes
                      </div>
                      <div
                        style={{
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          background: "rgba(0, 0, 0, 0.25)",
                          padding: "0.75rem 1rem",
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
