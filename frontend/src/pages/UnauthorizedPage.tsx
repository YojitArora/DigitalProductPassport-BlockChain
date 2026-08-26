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
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "None";

  return (
    <div
      style={{
        maxWidth: "580px",
        margin: "4rem auto",
        padding: "0 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        className="card-base"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "2.75rem 2.25rem",
          boxShadow: "var(--shadow-md)",
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
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--status-danger)",
            fontSize: "32px",
          }}
        >
          <LuShieldAlert />
        </div>

        <div>
          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: "0.4rem",
              letterSpacing: "-0.02em",
            }}
          >
            Access Denied
          </h1>
          <p className="text-secondary" style={{ fontSize: "0.925rem", lineHeight: 1.55 }}>
            Your connected wallet is not recognized by the smart contract as an authorized actor for this role.
          </p>
        </div>

        {/* Diagnostic Wallet Box */}
        <div
          style={{
            width: "100%",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            padding: "1.15rem 1.25rem",
            textAlign: "left",
            fontSize: "0.85rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.775rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
              Connected Wallet
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#ffffff" }}>
              {truncate(account)}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.775rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
              Required Permission
            </span>
            <span style={{ fontWeight: 700, color: "var(--status-danger)", fontSize: "0.85rem" }}>
              {requiredRole.toUpperCase()}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.25rem", borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.775rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
              Detected Roles
            </span>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {roles.isAdmin && (
                <span style={{ fontSize: "0.725rem", padding: "0.15rem 0.45rem", background: "rgba(239, 68, 68, 0.15)", color: "var(--status-danger)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  Admin
                </span>
              )}
              {roles.isManufacturer && (
                <span style={{ fontSize: "0.725rem", padding: "0.15rem 0.45rem", background: "rgba(113, 135, 168, 0.15)", color: "var(--accent-primary)", border: "1px solid rgba(113, 135, 168, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  Manufacturer
                </span>
              )}
              {roles.isServiceCenter && (
                <span style={{ fontSize: "0.725rem", padding: "0.15rem 0.45rem", background: "rgba(245, 158, 11, 0.15)", color: "var(--status-warning)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  Service Center
                </span>
              )}
              {roles.isOwner && (
                <span style={{ fontSize: "0.725rem", padding: "0.15rem 0.45rem", background: "rgba(16, 185, 129, 0.15)", color: "var(--status-success)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  Owner
                </span>
              )}
              {!roles.isAdmin && !roles.isManufacturer && !roles.isServiceCenter && !roles.isOwner && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  No Roles Found
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div style={{ display: "flex", gap: "0.85rem", width: "100%", marginTop: "0.5rem" }}>
          <Link
            to="/operations"
            className="btn btn-primary"
            style={{
              flex: 1,
              justifyContent: "center",
              padding: "0.75rem 1rem",
              textDecoration: "none",
            }}
          >
            <LuLayoutDashboard /> Operations Center
          </Link>

          <Link
            to="/verify"
            className="btn btn-secondary"
            style={{
              flex: 1,
              justifyContent: "center",
              padding: "0.75rem 1rem",
              textDecoration: "none",
            }}
          >
            <LuSearch /> Public Verify
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
