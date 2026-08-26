import React from "react";
import { LuWrench, LuHistory } from "react-icons/lu";
import { formatDate } from "../utils/dateUtils";

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
  const formattedDate = formatDate(lastRepairTimestamp, "No repairs logged");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
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
            background: isUnderService ? "rgba(245, 158, 11, 0.15)" : "rgba(113, 135, 168, 0.15)",
            color: isUnderService ? "var(--status-warning)" : "var(--accent-primary)",
          }}
        >
          <LuWrench />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {count} {count === 1 ? "Repair" : "Repairs"} Recorded
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "var(--text-secondary)",
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
            padding: "0.2rem 0.5rem",
            background: "rgba(245, 158, 11, 0.15)",
            color: "var(--status-warning)",
            borderRadius: "var(--radius-sm)",
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
