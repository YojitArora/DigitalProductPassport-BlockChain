import React, { useState, useEffect, useCallback } from "react";
import { Product, LedgerEvent, LedgerCategory } from "../../types";
import { HistoryService } from "../../services/historyService";
import { formatDateTime } from "../../utils/dateUtils";
import {
  LuFactory,
  LuShieldCheck,
  LuArrowRightLeft,
  LuWrench,
  LuShieldAlert,
  LuRotateCcw,
  LuCheck,
  LuFilter,
  LuCopy,
  LuX,
  LuLoader,
  LuHistory,
} from "react-icons/lu";

interface LifecycleTimelineProps {
  product: Product;
}

const CATEGORY_COLORS: Record<LedgerCategory, { color: string; bg: string; border: string }> = {
  Manufacturing: {
    color: "var(--accent-primary, #6366f1)",
    bg: "rgba(99, 102, 241, 0.12)",
    border: "rgba(99, 102, 241, 0.3)",
  },
  Warranty: {
    color: "var(--status-success, #10b981)",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.3)",
  },
  Ownership: {
    color: "var(--status-info, #3b82f6)",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.3)",
  },
  Custody: {
    color: "var(--accent-secondary, #06b6d4)",
    bg: "rgba(6, 182, 212, 0.12)",
    border: "rgba(6, 182, 212, 0.3)",
  },
  Service: {
    color: "var(--status-warning, #f59e0b)",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
  },
  Security: {
    color: "var(--status-danger, #ef4444)",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.35)",
  },
  Certification: {
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.3)",
  },
};

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({ product }) => {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeModalEvent, setActiveModalEvent] = useState<LedgerEvent | null>(null);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);
  const [copiedActor, setCopiedActor] = useState<boolean>(false);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const ledger = await HistoryService.getProductHistoryLedger(product.passportId);
      setEvents(ledger.events);
    } catch (err) {
      console.warn("Failed to load history ledger:", err);
    } finally {
      setLoading(false);
    }
  }, [product.passportId]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const categories = ["All", "Manufacturing", "Ownership", "Service", "Warranty", "Security"];

  const filteredEvents = events.filter((evt) => {
    if (selectedCategory === "All") return true;
    return evt.category === selectedCategory;
  });

  const getEventIcon = (evt: LedgerEvent) => {
    switch (evt.type) {
      case "ProductMinted":
        return <LuFactory />;
      case "WarrantyActivated":
        return <LuShieldCheck />;
      case "TransferRequested":
      case "TransferAccepted":
      case "TransferCancelled":
        return <LuArrowRightLeft />;
      case "ServiceStarted":
      case "RepairRecorded":
      case "ServiceCompleted":
        return <LuWrench />;
      case "TheftReported":
        return <LuShieldAlert />;
      case "AssetRecovered":
        return <LuRotateCcw />;
      default:
        return <LuHistory />;
    }
  };

  const truncate = (addr?: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "None";

  const handleCopy = (text: string, type: "tx" | "actor") => {
    navigator.clipboard.writeText(text);
    if (type === "tx") {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else {
      setCopiedActor(true);
      setTimeout(() => setCopiedActor(false), 2000);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary, #111827)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg, 16px)",
        padding: "1.75rem",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Ledger Header & Category Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(99, 102, 241, 0.12)",
              color: "var(--accent-primary, #6366f1)",
              fontSize: "18px",
            }}
          >
            <LuHistory />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Product History Ledger
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.825rem" }}>
              Verifiable, immutable chronological audit trail recorded on Ethereum blockchain ({events.length} total events)
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
          <LuFilter style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginRight: "0.2rem" }} />
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: "var(--radius-sm)",
                  border: isActive ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  background: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
          <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "2rem", color: "var(--accent-primary)", marginBottom: "0.5rem" }} />
          <div>Reconstructing immutable blockchain history ledger...</div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          No historical events found for the "{selectedCategory}" category filter.
        </div>
      ) : (
        /* Chronological Event Ledger Timeline */
        <div style={{ position: "relative", paddingLeft: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Vertical Connecting Guide Line */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              bottom: "14px",
              left: "14px",
              width: "2px",
              background: "var(--border-subtle, #374151)",
              zIndex: 0,
            }}
          />

          {filteredEvents.map((evt, idx) => {
            const catStyle = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Manufacturing;

            return (
              <div
                key={evt.id || idx}
                onClick={() => setActiveModalEvent(evt)}
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  cursor: "pointer",
                }}
              >
                {/* Node Dot / Icon Badge */}
                <div
                  style={{
                    position: "absolute",
                    left: "-1.75rem",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: catStyle.bg,
                    border: `2px solid ${catStyle.color}`,
                    color: catStyle.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0.4)",
                    flexShrink: 0,
                  }}
                >
                  {getEventIcon(evt)}
                </div>

                {/* Event Card Content */}
                <div
                  style={{
                    flex: 1,
                    background: "var(--bg-card, #1f2937)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem 1.25rem",
                    transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = catStyle.color;
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateX(0px)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "var(--radius-sm)",
                          color: catStyle.color,
                          background: catStyle.bg,
                          border: `1px solid ${catStyle.border}`,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {evt.category}
                      </span>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {evt.title}
                      </h4>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {formatDateTime(evt.timestamp)}
                    </div>
                  </div>

                  {evt.subtitle && (
                    <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
                      {evt.subtitle}
                    </div>
                  )}

                  {evt.description && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: "0.5rem" }}>
                      {evt.description}
                    </div>
                  )}

                  {/* Footer metadata chips */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                    {evt.actor && (
                      <div>
                        <strong>Actor:</strong> {evt.actorRole ? `[${evt.actorRole}] ` : ""}{truncate(evt.actor)}
                      </div>
                    )}
                    {evt.transactionHash && (
                      <div style={{ fontFamily: "var(--font-mono)" }}>
                        <strong>Tx:</strong> {truncate(evt.transactionHash)}
                      </div>
                    )}
                    <div style={{ marginLeft: "auto", color: "var(--accent-primary)", fontWeight: 600, fontSize: "0.75rem" }}>
                      View Details →
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Event Details Modal */}
      {activeModalEvent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setActiveModalEvent(null)}
        >
          <div
            style={{
              background: "var(--bg-secondary, #111827)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg, 16px)",
              padding: "2rem",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "var(--radius-sm)",
                    color: CATEGORY_COLORS[activeModalEvent.category]?.color || "var(--accent-primary)",
                    background: CATEGORY_COLORS[activeModalEvent.category]?.bg || "rgba(99, 102, 241, 0.12)",
                    border: `1px solid ${CATEGORY_COLORS[activeModalEvent.category]?.border || "transparent"}`,
                  }}
                >
                  {activeModalEvent.category} Event
                </span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.5rem" }}>
                  {activeModalEvent.title}
                </h3>
              </div>

              <button
                onClick={() => setActiveModalEvent(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                <LuX />
              </button>
            </div>

            {/* Event Timestamp */}
            <div style={{ background: "var(--bg-card)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", fontSize: "0.85rem" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Block Timestamp</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {formatDateTime(activeModalEvent.timestamp)}
              </div>
            </div>

            {/* Description / Subtitle */}
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "0.2rem" }}>Event Description</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5, background: "var(--bg-card)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                {activeModalEvent.description || activeModalEvent.subtitle || "No additional event details provided."}
              </div>
            </div>

            {/* Event Participants & Actor */}
            {activeModalEvent.actor && (
              <div style={{ background: "var(--bg-card)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    Verified Actor {activeModalEvent.actorRole ? `(${activeModalEvent.actorRole})` : ""}
                  </span>
                  <button
                    onClick={() => handleCopy(activeModalEvent.actor || "", "actor")}
                    style={{ background: "transparent", border: "none", color: copiedActor ? "var(--status-success)" : "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
                  >
                    {copiedActor ? <LuCheck /> : <LuCopy />} {copiedActor ? "Copied" : "Copy"}
                  </button>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-primary)", wordBreak: "break-all" }}>
                  {activeModalEvent.actor}
                </div>
              </div>
            )}

            {/* Previous Entity / New Entity if present */}
            {(activeModalEvent.previousEntity || activeModalEvent.newEntity) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8rem" }}>
                {activeModalEvent.previousEntity && (
                  <div style={{ background: "var(--bg-card)", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>From</div>
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      {truncate(activeModalEvent.previousEntity)}
                    </div>
                  </div>
                )}
                {activeModalEvent.newEntity && (
                  <div style={{ background: "var(--bg-card)", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>To / Custody</div>
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--status-success)" }}>
                      {truncate(activeModalEvent.newEntity)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blockchain Transaction Hash */}
            {activeModalEvent.transactionHash && (
              <div style={{ background: "var(--bg-card)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Blockchain Transaction Hash</span>
                  <button
                    onClick={() => handleCopy(activeModalEvent.transactionHash || "", "tx")}
                    style={{ background: "transparent", border: "none", color: copiedTx ? "var(--status-success)" : "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
                  >
                    {copiedTx ? <LuCheck /> : <LuCopy />} {copiedTx ? "Copied" : "Copy"}
                  </button>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-primary)", wordBreak: "break-all" }}>
                  {activeModalEvent.transactionHash}
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveModalEvent(null)}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close Ledger Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LifecycleTimeline;
