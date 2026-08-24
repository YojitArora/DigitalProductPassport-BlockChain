import React from "react";
import { LuInfo } from "react-icons/lu";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <LuInfo />,
  title,
  description,
  action,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem 1.5rem",
        background: "var(--bg-card, #1f2937)",
        borderRadius: "var(--radius-md, 10px)",
        border: "1px dashed var(--border-subtle, rgba(255, 255, 255, 0.15))",
        textAlign: "center",
        margin: "0.5rem 0",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "rgba(156, 163, 175, 0.12)",
          color: "var(--text-muted, #9ca3af)",
          fontSize: "22px",
          marginBottom: "0.75rem",
        }}
      >
        {icon}
      </div>

      <h4
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text-primary, #f9fafb)",
          marginBottom: "0.25rem",
        }}
      >
        {title}
      </h4>

      <p
        style={{
          color: "var(--text-secondary, #9ca3af)",
          fontSize: "0.85rem",
          maxWidth: "380px",
          lineHeight: "1.4",
          marginBottom: action ? "1rem" : "0",
        }}
      >
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 1rem",
            background: "var(--accent-primary, #6366f1)",
            color: "#ffffff",
            borderRadius: "var(--radius-sm, 6px)",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
