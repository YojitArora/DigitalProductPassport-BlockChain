import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  LuExternalLink,
  LuSparkles,
} from "react-icons/lu";

interface LifecycleTimelineProps {
  product: Product;
  events?: LedgerEvent[];
}

const CATEGORY_COLORS: Record<LedgerCategory, { color: string; bg: string; border: string; glow: string }> = {
  Manufacturing: {
    color: "var(--accent-primary, #7187A8)",
    bg: "rgba(113, 135, 168, 0.12)",
    border: "rgba(113, 135, 168, 0.35)",
    glow: "rgba(113, 135, 168, 0.25)",
  },
  Warranty: {
    color: "var(--status-success, #10b981)",
    bg: "rgba(16, 185, 129, 0.10)",
    border: "rgba(16, 185, 129, 0.25)",
    glow: "rgba(16, 185, 129, 0.2)",
  },
  Ownership: {
    color: "var(--accent-secondary, #8298B8)",
    bg: "rgba(130, 152, 184, 0.12)",
    border: "rgba(130, 152, 184, 0.35)",
    glow: "rgba(130, 152, 184, 0.25)",
  },
  Custody: {
    color: "var(--accent-primary, #7187A8)",
    bg: "rgba(113, 135, 168, 0.12)",
    border: "rgba(113, 135, 168, 0.35)",
    glow: "rgba(113, 135, 168, 0.25)",
  },
  Service: {
    color: "var(--status-warning, #f59e0b)",
    bg: "rgba(245, 158, 11, 0.10)",
    border: "rgba(245, 158, 11, 0.25)",
    glow: "rgba(245, 158, 11, 0.2)",
  },
  Security: {
    color: "var(--status-danger, #ef4444)",
    bg: "rgba(239, 68, 68, 0.10)",
    border: "rgba(239, 68, 68, 0.25)",
    glow: "rgba(239, 68, 68, 0.2)",
  },
  Certification: {
    color: "var(--accent-secondary, #8298B8)",
    bg: "rgba(130, 152, 184, 0.12)",
    border: "rgba(130, 152, 184, 0.35)",
    glow: "rgba(130, 152, 184, 0.25)",
  },
};

/**
 * Generates the smooth continuous WAVY / CURVED vertical line passing through the ● nodes.
 * ViewBox: 0 0 60 1000
 * Nodes alternate gently between X=24 (Left-side event) and X=36 (Right-side event)
 */
const generateWavyPath = (count: number): string => {
  if (count <= 0) return "M 30 0 L 30 1000";
  if (count === 1) return "M 30 0 L 30 1000";

  const step = 1000 / count;
  const nodes = Array.from({ length: count }, (_, i) => ({
    x: i % 2 === 0 ? 24 : 36,
    y: i * step + step * 0.5,
  }));

  const segments: string[] = [`M ${nodes[0].x} 0 L ${nodes[0].x} ${nodes[0].y}`];

  for (let i = 0; i < count - 1; i++) {
    const curr = nodes[i];
    const next = nodes[i + 1];
    const dy = next.y - curr.y;

    const cp1x = curr.x;
    const cp1y = curr.y + dy * 0.5;
    const cp2x = next.x;
    const cp2y = next.y - dy * 0.5;

    segments.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`);
  }

  const last = nodes[count - 1];
  segments.push(`L ${last.x} 1000`);

  return segments.join(" ");
};

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({ product, events: propEvents }) => {
  const [events, setEvents] = useState<LedgerEvent[]>(propEvents || []);
  const [loading, setLoading] = useState<boolean>(!propEvents);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeModalEvent, setActiveModalEvent] = useState<LedgerEvent | null>(null);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);
  const [copiedActor, setCopiedActor] = useState<boolean>(false);

  // Active events set (indices currently reached by scroll)
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set([0]));
  const timelineRootRef = useRef<HTMLDivElement | null>(null);
  const activePathRef = useRef<SVGPathElement | null>(null);
  const mobileFillRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const loadLedger = useCallback(async () => {
    if (propEvents) {
      setEvents(propEvents);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ledger = await HistoryService.getProductHistoryLedger(product.passportId);
      setEvents(ledger.events);
    } catch (err) {
      console.warn("Failed to load history ledger:", err);
    } finally {
      setLoading(false);
    }
  }, [product.passportId, propEvents]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const categories = ["All", "Manufacturing", "Ownership", "Service", "Warranty", "Security"];

  const filteredEvents = events.filter((evt) => {
    if (selectedCategory === "All") return true;
    return evt.category === selectedCategory;
  });

  const wavyPathD = useMemo(() => {
    return generateWavyPath(filteredEvents.length);
  }, [filteredEvents.length]);

  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fully continuous bidirectional scroll synchronization
  useEffect(() => {
    if (isReducedMotion) {
      if (activePathRef.current) activePathRef.current.style.strokeDashoffset = "0";
      if (mobileFillRef.current) mobileFillRef.current.style.height = "100%";
      setActiveIndices(new Set(filteredEvents.map((_, i) => i)));
      return;
    }

    let ticking = false;

    const updateTimelineProgress = () => {
      const rootEl = timelineRootRef.current;
      if (!rootEl) return;

      const rect = rootEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      // Viewport trigger line (approx 65% down from top of viewport)
      const triggerY = viewportHeight * 0.65;
      const totalHeight = rect.height;
      if (totalHeight <= 0) return;

      // Calculate progress between 0 and 1 continuously
      const distanceIntoTimeline = triggerY - rect.top;
      const progress = Math.max(0, Math.min(1, distanceIntoTimeline / totalHeight));

      // Direct physical DOM update for instantaneous zero-lag response during scrolling
      if (activePathRef.current) {
        activePathRef.current.style.strokeDashoffset = `${1000 * (1 - progress)}`;
      }
      if (mobileFillRef.current) {
        mobileFillRef.current.style.height = `${progress * 100}%`;
      }

      // Determine active indices based on current scroll position
      const newActive = new Set<number>();

      // Keep event 0 active when top of timeline enters viewport
      if (rect.top <= viewportHeight * 0.85) {
        newActive.add(0);
      }

      filteredEvents.forEach((_, idx) => {
        const itemEl = itemRefs.current[idx];
        if (itemEl) {
          const itemRect = itemEl.getBoundingClientRect();
          // Active when event item's upper section has passed triggerY
          if (itemRect.top + itemRect.height * 0.25 <= triggerY) {
            newActive.add(idx);
          }
        }
      });

      // Update state only when active set changes to avoid re-rendering cards unnecessarily
      setActiveIndices((prev) => {
        if (prev.size === newActive.size && Array.from(newActive).every((val) => prev.has(val))) {
          return prev;
        }
        return newActive;
      });
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateTimelineProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial calculation on mount
    updateTimelineProgress();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [filteredEvents, isReducedMotion]);

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
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "2rem 1.5rem",
        boxShadow: "var(--shadow-sm)",
        position: "relative",
      }}
    >
      {/* Product History Section Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", background: "var(--accent-primary-tint)", color: "var(--accent-primary)", border: "1px solid var(--border-active)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              <LuSparkles /> Chronological Audit Ledger
            </div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Complete Product History
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem", maxWidth: "620px" }}>
              The immutable, cryptographically-proven historical lifecycle of this Digital Product Passport. Every manufacturing, custody, warranty, service, and security event is permanently recorded on the blockchain.
            </p>
          </div>

          {/* DPP ID & Total Events Pill */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "var(--accent-secondary)",
                  background: "var(--accent-secondary-tint)",
                  border: "1px solid rgba(113, 135, 168, 0.3)",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {product.dppId || `Passport #${product.passportId.toString()}`}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "rgba(255, 255, 255, 0.04)",
                  padding: "0.25rem 0.55rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {events.length} {events.length === 1 ? "Event" : "Historical Events"}
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, marginRight: "0.25rem" }}>
            <LuFilter /> Filter:
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: isActive ? "1px solid rgba(113, 135, 168, 0.45)" : "1px solid var(--border-subtle)",
                  background: isActive ? "#253346" : "var(--bg-card)",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "0.8rem",
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
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-secondary)" }}>
          <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "2.25rem", color: "var(--accent-primary)", marginBottom: "0.75rem" }} />
          <div style={{ fontWeight: 600 }}>Reconstructing chronological event history ledger...</div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          No historical events found for the "{selectedCategory}" category filter.
        </div>
      ) : (
        /* 
          Timeline Container:
          LEFT EVENT:  [LEFT CARD] ───── ● ───── [ICON]
          RIGHT EVENT: [ICON] ───── ● ───── [RIGHT CARD]
        */
        <div
          ref={timelineRootRef}
          className="product-history-timeline-root"
          style={{ position: "relative", width: "100%", padding: "1.5rem 0" }}
        >
          {/* Responsive CSS styles */}
          <style>{`
            @media (min-width: 768px) {
              .timeline-row {
                display: grid;
                grid-template-columns: 1fr 60px 1fr;
                align-items: center;
                gap: 0;
                margin-bottom: 3.5rem;
                position: relative;
                width: 100%;
              }
              .timeline-left-col {
                grid-column: 1;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 0;
                width: 100%;
              }
              .timeline-center-col {
                grid-column: 2;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                z-index: 2;
                width: 60px;
                height: 100%;
              }
              .timeline-right-col {
                grid-column: 3;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 0;
                width: 100%;
              }
              .timeline-spine-svg {
                display: block;
              }
              .timeline-mobile-line {
                display: none;
              }
              .timeline-mobile-node {
                display: none;
              }
            }

            @media (max-width: 767px) {
              .timeline-row {
                display: flex;
                align-items: center;
                margin-bottom: 2.25rem;
                position: relative;
                padding-left: 2.25rem;
              }
              .timeline-left-col, .timeline-right-col {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                width: 100%;
              }
              .timeline-center-col {
                display: none;
              }
              .timeline-spine-svg {
                display: none;
              }
              .timeline-mobile-line {
                display: block;
                position: absolute;
                left: 10px;
                top: 0;
                bottom: 0;
                width: 2px;
                background: transparent;
                z-index: 0;
                overflow: hidden;
              }
              .timeline-mobile-node {
                display: block;
                position: absolute;
                left: 4px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 2;
                transition: opacity 0.4s ease, transform 0.4s ease;
              }
            }
          `}</style>

          {/* Desktop Central Smooth Wavy Spine (SVG) - ONLY revealed animated path, ZERO future/dotted line */}
          <div
            className="timeline-spine-svg"
            style={{
              position: "absolute",
              top: "0px",
              bottom: "0px",
              left: "50%",
              width: "60px",
              transform: "translateX(-50%)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 60 1000"
              preserveAspectRatio="none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <linearGradient id="wavyGlowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7187A8" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#8298B8" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#5F789D" stopOpacity="0.95" />
                </linearGradient>
              </defs>

              {/* Foreground active wavy path revealed progressively with scroll */}
              <path
                ref={activePathRef}
                d={wavyPathD}
                fill="none"
                stroke="url(#wavyGlowGradient)"
                strokeWidth="3"
                pathLength="1000"
                strokeDasharray="1000"
                strokeDashoffset="1000"
                style={{
                  filter: "drop-shadow(0 0 3px rgba(113, 135, 168, 0.4))",
                }}
              />
            </svg>
          </div>

          {/* Mobile Vertical Track updated directly in sync with scroll position */}
          <div className="timeline-mobile-line">
            <div
              ref={mobileFillRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "0%",
                background: "linear-gradient(180deg, #5F789D 0%, #7187A8 50%, #8298B8 100%)",
                borderRadius: "2px",
                boxShadow: "0 0 4px rgba(113, 135, 168, 0.3)",
              }}
            />
          </div>

          {/* Render All Chronological Events */}
          {filteredEvents.map((evt, idx) => {
            const isEven = idx % 2 === 0;
            const isActive = isReducedMotion || activeIndices.has(idx);
            const catStyle = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Manufacturing;

            return (
              <div
                key={evt.id || idx}
                ref={(el) => (itemRefs.current[idx] = el)}
                data-event-index={idx}
                className="timeline-row"
              >
                {/* Mobile Dot Node */}
                <div
                  className="timeline-mobile-node"
                  style={{
                    width: "13px",
                    height: "13px",
                    borderRadius: "50%",
                    background: "#080808",
                    border: `2px solid ${catStyle.color}`,
                    boxShadow: isActive ? `0 0 6px ${catStyle.border}` : "none",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateY(-50%) scale(1)" : "translateY(-50%) scale(0.4)",
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                  }}
                />

                {/* 
                  LEFT COLUMN:
                  - If Even index (Left Event): [LEFT CARD] ─────
                  - If Odd index (Right Event): ───── [ICON] (facing timeline)
                */}
                <div className="timeline-left-col">
                  {isEven ? (
                    /* Left Event Card with connector to central node */
                    <div
                      className={`timeline-card-left ${isActive ? "timeline-card-revealed" : ""}`}
                      style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "flex-end" }}
                    >
                      <div style={{ flex: 1, maxWidth: "430px" }}>
                        <EventCardContent
                          evt={evt}
                          catStyle={catStyle}
                          onInspect={() => setActiveModalEvent(evt)}
                          truncate={truncate}
                        />
                      </div>
                      <div
                        style={{
                          width: "32px",
                          height: "2px",
                          background: catStyle.border,
                          flexShrink: 0,
                          opacity: isActive ? 1 : 0,
                          transition: "opacity 0.4s ease",
                        }}
                      />
                    </div>
                  ) : (
                    /* Right Event: Opposite Icon on the LEFT of the timeline */
                    <div
                      className={`timeline-card-left ${isActive ? "timeline-card-revealed" : ""}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}
                    >
                      <EventIconBadge
                        evt={evt}
                        catStyle={catStyle}
                        isActive={isActive}
                        onInspect={() => setActiveModalEvent(evt)}
                        getEventIcon={getEventIcon}
                      />
                      <div
                        style={{
                          width: "28px",
                          height: "2px",
                          background: catStyle.border,
                          flexShrink: 0,
                          opacity: isActive ? 1 : 0,
                          transition: "opacity 0.4s ease",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 
                  CENTER COLUMN:
                  Timeline Node ● situated directly on the wavy vertical timeline
                */}
                <div className="timeline-center-col">
                  <div
                    onClick={() => setActiveModalEvent(evt)}
                    style={{
                      width: "15px",
                      height: "15px",
                      borderRadius: "50%",
                      background: "#080808",
                      border: `2.5px solid ${catStyle.color}`,
                      boxShadow: isActive ? `0 0 6px ${catStyle.border}` : "none",
                      cursor: "pointer",
                      opacity: isActive ? 1 : 0,
                      transform: isEven
                        ? `translateX(-6px) scale(${isActive ? 1 : 0.4})`
                        : `translateX(6px) scale(${isActive ? 1 : 0.4})`,
                      transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease",
                      flexShrink: 0,
                    }}
                    title={`${evt.title} - Timeline node`}
                  />
                </div>

                {/* 
                  RIGHT COLUMN:
                  - If Even index (Left Event): ───── [ICON] (Opposite Icon on the RIGHT)
                  - If Odd index (Right Event): ───── [RIGHT CARD]
                */}
                <div className="timeline-right-col">
                  {isEven ? (
                    /* Left Event: Opposite Icon on the RIGHT of the timeline */
                    <div
                      className={`timeline-card-right ${isActive ? "timeline-card-revealed" : ""}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "2px",
                          background: catStyle.border,
                          flexShrink: 0,
                          opacity: isActive ? 1 : 0,
                          transition: "opacity 0.4s ease",
                        }}
                      />
                      <EventIconBadge
                        evt={evt}
                        catStyle={catStyle}
                        isActive={isActive}
                        onInspect={() => setActiveModalEvent(evt)}
                        getEventIcon={getEventIcon}
                      />
                    </div>
                  ) : (
                    /* Right Event Card with connector from central node */
                    <div
                      className={`timeline-card-right ${isActive ? "timeline-card-revealed" : ""}`}
                      style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "flex-start" }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "2px",
                          background: catStyle.border,
                          flexShrink: 0,
                          opacity: isActive ? 1 : 0,
                          transition: "opacity 0.4s ease",
                        }}
                      />
                      <div style={{ flex: 1, maxWidth: "430px" }}>
                        <EventCardContent
                          evt={evt}
                          catStyle={catStyle}
                          onInspect={() => setActiveModalEvent(evt)}
                          truncate={truncate}
                        />
                      </div>
                    </div>
                  )}
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
            backdropFilter: "blur(8px)",
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
              maxWidth: "560px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: CATEGORY_COLORS[activeModalEvent.category]?.bg || "rgba(99,102,241,0.12)",
                    border: `1px solid ${CATEGORY_COLORS[activeModalEvent.category]?.border || "transparent"}`,
                    color: CATEGORY_COLORS[activeModalEvent.category]?.color || "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {getEventIcon(activeModalEvent)}
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: CATEGORY_COLORS[activeModalEvent.category]?.color || "var(--accent-primary)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {activeModalEvent.category} Event
                  </span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {activeModalEvent.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveModalEvent(null)}
                style={{
                  color: "var(--text-muted)",
                  fontSize: "1.25rem",
                  padding: "0.25rem",
                  cursor: "pointer",
                  borderRadius: "var(--radius-sm)",
                }}
                aria-label="Close modal"
              >
                <LuX />
              </button>
            </div>

            {/* Description & Subtitle */}
            <div>
              {activeModalEvent.subtitle && (
                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  {activeModalEvent.subtitle}
                </div>
              )}
              <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                {activeModalEvent.description}
              </div>
            </div>

            {/* Structured Properties Grid */}
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Timestamp</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>
                  {formatDateTime(activeModalEvent.timestamp)}
                </span>
              </div>

              {activeModalEvent.actor && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)" }}>
                    {activeModalEvent.actorRole || "Executing Actor"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      {truncate(activeModalEvent.actor)}
                    </span>
                    <button
                      onClick={() => handleCopy(activeModalEvent.actor || "", "actor")}
                      style={{ color: copiedActor ? "var(--status-success)" : "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}
                      title="Copy full address"
                    >
                      {copiedActor ? <LuCheck /> : <LuCopy />}
                    </button>
                  </div>
                </div>
              )}

              {activeModalEvent.newEntity && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)" }}>Recipient / Transferee</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {truncate(activeModalEvent.newEntity)}
                  </span>
                </div>
              )}

              {activeModalEvent.blockNumber !== undefined && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)" }}>Block Number</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    #{activeModalEvent.blockNumber.toString()}
                  </span>
                </div>
              )}

              {activeModalEvent.transactionHash && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)" }}>Transaction Hash</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      {truncate(activeModalEvent.transactionHash)}
                    </span>
                    <button
                      onClick={() => handleCopy(activeModalEvent.transactionHash || "", "tx")}
                      style={{ color: copiedTx ? "var(--status-success)" : "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}
                      title="Copy transaction hash"
                    >
                      {copiedTx ? <LuCheck /> : <LuCopy />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Event Metadata (if any) */}
            {activeModalEvent.metadata && Object.keys(activeModalEvent.metadata).length > 0 && (
              <div
                style={{
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "1rem",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Event Specific Metadata
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                  {Object.entries(activeModalEvent.metadata).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "capitalize" }}>
                        {key.replace(/([A-Z])/g, " $1")}
                      </div>
                      <div style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                        {String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                onClick={() => setActiveModalEvent(null)}
                style={{
                  padding: "0.6rem 1.25rem",
                  background: "#253346",
                  border: "1px solid rgba(113, 135, 168, 0.4)",
                  color: "#ffffff",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface EventIconBadgeProps {
  evt: LedgerEvent;
  catStyle: { color: string; bg: string; border: string; glow: string };
  isActive: boolean;
  onInspect: () => void;
  getEventIcon: (evt: LedgerEvent) => React.ReactNode;
}

const EventIconBadge: React.FC<EventIconBadgeProps> = ({
  evt,
  catStyle,
  isActive,
  onInspect,
  getEventIcon,
}) => {
  return (
    <div
      onClick={onInspect}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-card)",
        border: `1px solid ${isActive ? catStyle.border : "var(--border-subtle)"}`,
        color: isActive ? catStyle.color : "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        cursor: "pointer",
        boxShadow: "var(--shadow-sm)",
        opacity: isActive ? 1 : 0,
        transform: isActive ? "scale(1)" : "scale(0.5)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        flexShrink: 0,
      }}
      title={`${evt.title} - Click to inspect`}
    >
      {getEventIcon(evt)}
    </div>
  );
};

interface EventCardContentProps {
  evt: LedgerEvent;
  catStyle: { color: string; bg: string; border: string; glow: string };
  onInspect: () => void;
  truncate: (addr?: string) => string;
}

const EventCardContent: React.FC<EventCardContentProps> = ({
  evt,
  catStyle,
  onInspect,
  truncate,
}) => {
  return (
    <div
      onClick={onInspect}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "1.25rem",
        boxShadow: "var(--shadow-sm)",
        cursor: "pointer",
        transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = catStyle.border;
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top Bar: Category Pill & Formatted Timestamp */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.4rem" }}>
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            textTransform: "uppercase",
            padding: "0.2rem 0.55rem",
            borderRadius: "var(--radius-sm)",
            color: catStyle.color,
            background: catStyle.bg,
            border: `1px solid ${catStyle.border}`,
            letterSpacing: "0.04em",
          }}
        >
          {evt.category}
        </span>

        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {formatDateTime(evt.timestamp)}
        </div>
      </div>

      {/* Title & Subtitle */}
      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.2rem", letterSpacing: "-0.01em" }}>
        {evt.title}
      </h3>

      {evt.subtitle && (
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, marginBottom: "0.4rem" }}>
          {evt.subtitle}
        </div>
      )}

      {evt.description && (
        <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
          {evt.description}
        </p>
      )}

      {/* Footer Info: Actor & Blockchain Verification Tag */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "0.65rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {evt.actor && (
            <span>
              <strong>{evt.actorRole ? `${evt.actorRole}: ` : "Actor: "}</strong>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{truncate(evt.actor)}</span>
            </span>
          )}
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--accent-primary)", fontWeight: 600 }}>
          Inspect <LuExternalLink />
        </div>
      </div>
    </div>
  );
};

export default LifecycleTimeline;
