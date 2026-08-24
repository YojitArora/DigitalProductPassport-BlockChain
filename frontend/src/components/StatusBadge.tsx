import React from "react";
import { ProductStatus, PRODUCT_STATUS_META } from "../types";
import { LuCheck, LuWrench, LuShieldAlert, LuRotateCcw } from "react-icons/lu";

interface StatusBadgeProps {
  status: ProductStatus;
  size?: "sm" | "md" | "lg";
}

const STATUS_ICONS: Record<ProductStatus, React.ReactNode> = {
  [ProductStatus.Active]: <LuCheck />,
  [ProductStatus.UnderService]: <LuWrench />,
  [ProductStatus.ReportedStolen]: <LuShieldAlert />,
  [ProductStatus.Recovered]: <LuRotateCcw />,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const meta = PRODUCT_STATUS_META[status] || {
    label: "Unknown",
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.12)",
  };

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

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: paddings[size],
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.color}40`,
        borderRadius: "var(--radius-sm, 6px)",
        fontSize: fontSizes[size],
        fontWeight: 600,
        fontFamily: "var(--font-sans, sans-serif)",
        letterSpacing: "0.01em",
      }}
    >
      {STATUS_ICONS[status]}
      <span>{meta.label}</span>
    </span>
  );
};

export default StatusBadge;
