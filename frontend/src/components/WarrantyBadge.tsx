import React from "react";
import { Warranty } from "../types";
import { LuShieldCheck, LuShieldX, LuShieldOff } from "react-icons/lu";

interface WarrantyBadgeProps {
  warranty: Warranty;
  size?: "sm" | "md" | "lg";
}

export const WarrantyBadge: React.FC<WarrantyBadgeProps> = ({ warranty, size = "md" }) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const endTimestamp = Number(warranty.endTimestamp);
  const startTimestamp = Number(warranty.startTimestamp);

  const isConfigured = endTimestamp > 0;
  const isActive =
    isConfigured &&
    currentTimestamp <= endTimestamp &&
    (startTimestamp === 0 || currentTimestamp >= startTimestamp);

  const daysRemaining = isActive
    ? Math.max(0, Math.ceil((endTimestamp - currentTimestamp) / 86400))
    : 0;

  const fontSizes = {
    sm: "0.725rem",
    md: "0.8rem",
    lg: "0.9rem",
  };

  const paddings = {
    sm: "0.2rem 0.5rem",
    md: "0.3rem 0.65rem",
    lg: "0.45rem 0.85rem",
  };

  if (!isConfigured) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: paddings[size],
          background: "rgba(255, 255, 255, 0.04)",
          color: "var(--text-muted)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          fontSize: fontSizes[size],
          fontWeight: 500,
        }}
      >
        <LuShieldOff /> Unactivated Warranty
      </span>
    );
  }

  if (isActive) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: paddings[size],
          background: "var(--status-success-tint)",
          color: "var(--status-success)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "var(--radius-sm)",
          fontSize: fontSizes[size],
          fontWeight: 600,
        }}
      >
        <LuShieldCheck /> Warranty Active ({daysRemaining}d left)
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: paddings[size],
        background: "var(--status-danger-tint)",
        color: "var(--status-danger)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "var(--radius-sm)",
        fontSize: fontSizes[size],
        fontWeight: 600,
      }}
    >
      <LuShieldX /> Warranty Expired
    </span>
  );
};

export default WarrantyBadge;
