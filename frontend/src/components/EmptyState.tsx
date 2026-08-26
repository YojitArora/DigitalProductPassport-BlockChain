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
        background: "var(--bg-card)",
        borderRadius: "var(--radius-md)",
        border: "1px dashed var(--border-subtle)",
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
          background: "rgba(255, 255, 255, 0.04)",
          color: "var(--text-muted)",
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
          color: "#ffffff",
          marginBottom: "0.25rem",
        }}
      >
        {title}
      </h4>

      <p
        className="text-secondary"
        style={{
          fontSize: "0.85rem",
          maxWidth: "380px",
          lineHeight: "1.45",
          marginBottom: action ? "1rem" : "0",
        }}
      >
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary"
          style={{
            padding: "0.45rem 0.9rem",
            fontSize: "0.825rem",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
