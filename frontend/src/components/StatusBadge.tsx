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
    color: "var(--text-muted)",
    bg: "rgba(255, 255, 255, 0.05)",
  };

  let icon = STATUS_ICONS[status];

  // If in inventory and in normal active state, display as Manufacturer Inventory
  if (isInventory && status === ProductStatus.Active) {
    meta = {
      label: "Manufacturer Inventory",
      color: "var(--accent-primary)",
      bg: "rgba(113, 135, 168, 0.12)",
    };
    icon = <LuWarehouse />;
  }

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
        borderRadius: "var(--radius-sm)",
        fontSize: fontSizes[size],
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        letterSpacing: "0.01em",
      }}
    >
      {icon}
      <span>{meta.label}</span>
    </span>
  );
};

export default StatusBadge;
