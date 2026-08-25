import React from "react";
import { ProductStatus, PRODUCT_STATUS_META } from "../types";
import { LuCheck, LuWrench, LuShieldAlert, LuRotateCcw, LuWarehouse } from "react-icons/lu";

interface StatusBadgeProps {
  status: ProductStatus;
  isInventory?: boolean;
  size?: "sm" | "md" | "lg";
}

const STATUS_ICONS: Record<ProductStatus, React.ReactNode> = {
  [ProductStatus.Active]: <LuCheck />,
  [ProductStatus.UnderService]: <LuWrench />,
  [ProductStatus.ReportedStolen]: <LuShieldAlert />,
  [ProductStatus.Recovered]: <LuRotateCcw />,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isInventory = false,
  size = "md",
}) => {
  let meta = PRODUCT_STATUS_META[status] || {
    label: "Unknown",
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.12)",
  };

  let icon = STATUS_ICONS[status];

  // If in inventory and in normal active state, display as Manufacturer Inventory
  if (isInventory && status === ProductStatus.Active) {
    meta = {
      label: "Manufacturer Inventory",
      color: "var(--accent-primary, #6366f1)",
      bg: "rgba(99, 102, 241, 0.12)",
    };
    icon = <LuWarehouse />;
  }

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
      {icon}
      <span>{meta.label}</span>
    </span>
  );
};

export default StatusBadge;
