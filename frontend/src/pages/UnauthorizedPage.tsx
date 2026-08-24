import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LuShieldAlert,
  LuSearch,
  LuLayoutDashboard,
} from "react-icons/lu";

export const UnauthorizedPage: React.FC = () => {
  const { session, roles } = useAuth();
  const location = useLocation();

  const requiredRole = (location.state as any)?.requiredRole || "Specific Portal Role";
  const account = session?.account || "Unknown Wallet";
  const truncate = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "4rem auto",
        padding: "0 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "var(--bg-secondary, #111827)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "3rem 2rem",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.15)",
            color: "var(--status-danger, #ef4444)",
            fontSize: "36px",
          }}
        >
          <LuShieldAlert />
        </div>

        <div>
          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              color: "var(--text-primary, #f9fafb)",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Access Denied
          </h1>
          <p style={{ color: "var(--text-secondary, #9ca3af)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            You do not have on-chain permission to access this portal. The smart contract does not recognize your connected wallet as an authorized actor for this role.
          </p>
        </div>

        {/* Diagnostic Wallet Box */}
        <div
          style={{
            width: "100%",
            background: "var(--bg-card, #1f2937)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            padding: "1rem 1.25rem",
            textAlign: "left",
            fontSize: "0.85rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Connected Wallet:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
              {truncate(account)}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Required Permission:</span>
            <span style={{ fontWeight: 600, color: "var(--status-danger)" }}>
              {requiredRole.toUpperCase()}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)" }}>Detected Roles:</span>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {roles.isAdmin && (
                <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", background: "rgba(239, 68, 68, 0.2)", color: "var(--status-danger)", borderRadius: "var(--radius-sm)" }}>
                  Admin
                </span>
              )}
              {roles.isManufacturer && (
                <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", background: "rgba(99, 102, 241, 0.2)", color: "var(--accent-primary)", borderRadius: "var(--radius-sm)" }}>
                  Manufacturer
                </span>
              )}
              {roles.isServiceCenter && (
                <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", background: "rgba(245, 158, 11, 0.2)", color: "var(--status-warning)", borderRadius: "var(--radius-sm)" }}>
                  Service Center
                </span>
              )}
              {roles.isOwner && (
                <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", background: "rgba(16, 185, 129, 0.2)", color: "var(--status-success)", borderRadius: "var(--radius-sm)" }}>
                  Owner
                </span>
              )}
              {!roles.isAdmin && !roles.isManufacturer && !roles.isServiceCenter && !roles.isOwner && (
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  No Roles Found
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", width: "100%", marginTop: "0.5rem" }}>
          <Link
            to="/operations"
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.75rem 1rem",
              background: "var(--accent-primary)",
              color: "#ffffff",
              borderRadius: "var(--radius-md)",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <LuLayoutDashboard /> Return to Operations
          </Link>

          <Link
            to="/verify"
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.75rem 1rem",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <LuSearch /> Public Verification
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
