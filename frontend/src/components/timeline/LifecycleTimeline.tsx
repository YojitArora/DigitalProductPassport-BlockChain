import React from "react";
import { Product, ProductStatus } from "../../types";
import { formatDate } from "../../utils/dateUtils";
import {
  LuFactory,
  LuShieldCheck,
  LuUser,
  LuWrench,
  LuShieldAlert,
  LuClock,
} from "react-icons/lu";

interface LifecycleTimelineProps {
  product: Product;
}

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({ product }) => {

  const isWarrantyActivated = product.warranty.startTimestamp > 0n;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isWarrantyActive =
    isWarrantyActivated &&
    product.warranty.endTimestamp > now;

  const truncate = (addr: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "None";

  // Milestones Data
  const milestones = [
    {
      id: "manufactured",
      title: "1. Manufactured & Minted",
      subtitle: `Created on ${formatDate(product.manufactureDate || product.createdAt)}`,
      icon: <LuFactory />,
      color: "var(--accent-primary, #6366f1)",
      bgColor: "rgba(99, 102, 241, 0.12)",
      statusBadge: "Verified On-Chain",
      badgeColor: "var(--status-success)",
      badgeBg: "rgba(16, 185, 129, 0.12)",
      details: [
        { label: "Manufacturer", value: truncate(product.manufacturer) },
        { label: "Serial Number", value: product.serialNumber },
        { label: "Model", value: product.modelNumber },
      ],
    },
    {
      id: "warranty",
      title: "2. Warranty Coverage",
      subtitle: isWarrantyActivated
        ? `Valid until ${formatDate(product.warranty.endTimestamp)}`
        : "Warranty not yet activated by manufacturer",
      icon: <LuShieldCheck />,
      color: isWarrantyActive ? "var(--status-success)" : isWarrantyActivated ? "var(--status-warning)" : "var(--text-muted)",
      bgColor: isWarrantyActive ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.05)",
      statusBadge: isWarrantyActive
        ? "Active Coverage"
        : isWarrantyActivated
        ? "Expired"
        : "Pending Activation",
      badgeColor: isWarrantyActive ? "var(--status-success)" : isWarrantyActivated ? "var(--status-danger)" : "var(--text-muted)",
      badgeBg: isWarrantyActive ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.05)",
      details: [
        { label: "Coverage Window", value: isWarrantyActivated ? `${formatDate(product.warranty.startTimestamp)} – ${formatDate(product.warranty.endTimestamp)}` : "Inactive" },
        { label: "Status", value: isWarrantyActive ? "Fully Covered" : "Out of Warranty" },
      ],
    },
    {
      id: "custody",
      title: "3. Ownership & Provenance",
      subtitle: `Current Custody: ${truncate(product.currentOwner)}`,
      icon: <LuUser />,
      color: "var(--status-info, #3b82f6)",
      bgColor: "rgba(59, 130, 246, 0.12)",
      statusBadge: product.pendingTransfer.exists ? "Transfer Pending" : "Secured Custody",
      badgeColor: product.pendingTransfer.exists ? "var(--status-warning)" : "var(--status-info)",
      badgeBg: product.pendingTransfer.exists ? "rgba(245, 158, 11, 0.12)" : "rgba(59, 130, 246, 0.12)",
      details: [
        { label: "Current Owner", value: truncate(product.currentOwner) },
        { label: "Pending Transfer", value: product.pendingTransfer.exists ? `To ${truncate(product.pendingTransfer.to)}` : "None" },
      ],
    },
    {
      id: "service",
      title: "4. Maintenance & Repair History",
      subtitle: `${product.repairCount.toString()} certified repairs recorded`,
      icon: <LuWrench />,
      color: product.status === ProductStatus.UnderService ? "var(--status-warning)" : "var(--accent-secondary, #06b6d4)",
      bgColor: "rgba(6, 182, 212, 0.12)",
      statusBadge: product.status === ProductStatus.UnderService ? "Currently in Service" : `${product.repairCount.toString()} Repairs`,
      badgeColor: product.status === ProductStatus.UnderService ? "var(--status-warning)" : "var(--accent-secondary)",
      badgeBg: "rgba(6, 182, 212, 0.12)",
      details: [
        { label: "Total Repairs", value: product.repairCount.toString() },
        { label: "Last Service", value: product.lastRepairTimestamp > 0n ? formatDate(product.lastRepairTimestamp) : "No Repairs" },
        { label: "Service Center", value: product.status === ProductStatus.UnderService ? truncate(product.currentServiceCenter) : "None Active" },
      ],
    },
    {
      id: "security",
      title: "5. Security & Anti-Theft State",
      subtitle: product.status === ProductStatus.ReportedStolen
        ? "FLAGGED: Reported Stolen on-chain"
        : product.status === ProductStatus.Recovered
        ? "Recovered & Cleared"
        : "Normal Operational Status",
      icon: <LuShieldAlert />,
      color: product.status === ProductStatus.ReportedStolen
        ? "var(--status-danger)"
        : product.status === ProductStatus.Recovered
        ? "var(--status-info)"
        : "var(--status-success)",
      bgColor: product.status === ProductStatus.ReportedStolen
        ? "rgba(239, 68, 68, 0.15)"
        : "rgba(16, 185, 129, 0.12)",
      statusBadge: product.status === ProductStatus.ReportedStolen
        ? "STOLEN ALERT"
        : product.status === ProductStatus.Recovered
        ? "Recovered"
        : "Clear & Active",
      badgeColor: product.status === ProductStatus.ReportedStolen ? "var(--status-danger)" : "var(--status-success)",
      badgeBg: product.status === ProductStatus.ReportedStolen ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.12)",
      details: [
        { label: "Operational State", value: ProductStatus[product.status] },
        { label: "Transfer Lock", value: product.status === ProductStatus.ReportedStolen ? "LOCKED (Stolen)" : "Unlocked" },
      ],
    },
  ];

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
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <LuClock style={{ color: "var(--accent-primary)", fontSize: "1.3rem" }} />
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Product Passport Lifecycle Flowchart
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative" }}>
        {milestones.map((m, index) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              gap: "1.25rem",
              position: "relative",
            }}
          >
            {/* Timeline Line Connector */}
            {index < milestones.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: "22px",
                  top: "44px",
                  bottom: "-20px",
                  width: "2px",
                  background: "var(--border-subtle)",
                  zIndex: 1,
                }}
              />
            )}

            {/* Step Icon Bubble */}
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: m.bgColor,
                border: `1px solid ${m.color}`,
                color: m.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
                zIndex: 2,
              }}
            >
              {m.icon}
            </div>

            {/* Step Content */}
            <div
              style={{
                flex: 1,
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    {m.title}
                  </h4>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                    {m.subtitle}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: m.badgeColor,
                    background: m.badgeBg,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {m.statusBadge}
                </span>
              </div>

              {/* Details Key-Value List */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "0.5rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--border-subtle)",
                  fontSize: "0.8rem",
                }}
              >
                {m.details.map((d, i) => (
                  <div key={i}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{d.label}</div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: d.label.includes("Owner") || d.label.includes("Manufacturer") || d.label.includes("Center") ? "var(--font-mono)" : "inherit" }}>
                      {d.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LifecycleTimeline;
