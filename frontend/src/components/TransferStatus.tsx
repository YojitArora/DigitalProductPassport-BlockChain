import React from "react";
import { PendingTransfer } from "../types";
import { LuArrowRightLeft, LuClock, LuCheck } from "react-icons/lu";
import { formatDateTime } from "../utils/dateUtils";

interface TransferStatusProps {
  pendingTransfer: PendingTransfer;
  showEmpty?: boolean;
}

export const TransferStatus: React.FC<TransferStatusProps> = ({
  pendingTransfer,
  showEmpty = false,
}) => {
  if (!pendingTransfer || !pendingTransfer.exists) {
    if (!showEmpty) return null;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.6rem 0.85rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
        }}
      >
        <LuCheck style={{ color: "var(--status-success)" }} />
        <span>No pending transfers (Ownership is settled)</span>
      </div>
    );
  }

  const requestedDate = formatDateTime(pendingTransfer.requestedAt);
  const truncate = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        padding: "0.75rem 1rem",
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        borderRadius: "var(--radius-md)",
        fontSize: "0.85rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          color: "var(--status-warning)",
          fontWeight: 600,
        }}
      >
        <LuArrowRightLeft />
        <span>Pending Ownership Transfer</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "var(--text-secondary)",
          fontSize: "0.8rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span>Designated Recipient:</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
          {truncate(pendingTransfer.to)}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
        }}
      >
        <LuClock /> Requested: {requestedDate}
      </div>
    </div>
  );
};

export default TransferStatus;
