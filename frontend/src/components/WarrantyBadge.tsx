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
    sm: "0.75rem",
    md: "0.85rem",
    lg: "0.95rem",
  };

  const paddings = {
    sm: "0.2rem 0.5rem",
    md: "0.35rem 0.75rem",
    lg: "0.5rem 1rem",
  };

  if (!isConfigured) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: paddings[size],
          background: "rgba(156, 163, 175, 0.12)",
          color: "var(--text-muted, #9ca3af)",
          border: "1px solid rgba(156, 163, 175, 0.25)",
          borderRadius: "var(--radius-sm, 6px)",
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
          background: "rgba(16, 185, 129, 0.12)",
          color: "var(--status-success, #10b981)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "var(--radius-sm, 6px)",
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
        background: "rgba(239, 68, 68, 0.12)",
        color: "var(--status-danger, #ef4444)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "var(--radius-sm, 6px)",
        fontSize: fontSizes[size],
        fontWeight: 600,
      }}
    >
      <LuShieldX /> Warranty Expired
    </span>
  );
};

export default WarrantyBadge;
