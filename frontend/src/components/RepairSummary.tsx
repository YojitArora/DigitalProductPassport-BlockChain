import React from "react";
import { LuWrench, LuHistory } from "react-icons/lu";

interface RepairSummaryProps {
  repairCount: bigint | number;
  lastRepairTimestamp: bigint | number;
  isUnderService?: boolean;
}

export const RepairSummary: React.FC<RepairSummaryProps> = ({
  repairCount,
  lastRepairTimestamp,
  isUnderService = false,
}) => {
  const count = Number(repairCount);
  const lastTimestamp = Number(lastRepairTimestamp);
  const formattedDate =
    lastTimestamp > 0
      ? new Date(lastTimestamp * 1000).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "No repairs logged";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1rem",
        background: "var(--bg-card, #1f2937)",
        border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
        borderRadius: "var(--radius-md, 10px)",
        fontSize: "0.85rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: isUnderService ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.12)",
            color: isUnderService ? "var(--status-warning)" : "var(--accent-primary)",
          }}
        >
          <LuWrench />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary, #f9fafb)" }}>
            {count} {count === 1 ? "Repair" : "Repairs"} Recorded
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "var(--text-secondary, #9ca3af)",
              fontSize: "0.75rem",
            }}
          >
            <LuHistory /> Last Service: {formattedDate}
          </div>
        </div>
      </div>

      {isUnderService && (
        <span
          style={{
            padding: "0.25rem 0.5rem",
            background: "rgba(245, 158, 11, 0.15)",
            color: "var(--status-warning, #f59e0b)",
            borderRadius: "var(--radius-sm, 6px)",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          In Service
        </span>
      )}
    </div>
  );
};

export default RepairSummary;
