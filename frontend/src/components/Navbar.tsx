import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LuWallet,
  LuLogOut,
  LuSearch,
  LuLayoutDashboard,
  LuKey,
} from "react-icons/lu";
import { useWallet } from "../hooks/useWallet";
import { useAuth } from "../hooks/useAuth";
import { SUPPORTED_NETWORKS } from "../services/provider";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { chainId, isConnected, isNetworkSupported, switchNetwork } = useWallet();
  const { isAuthenticated, session, roles, logout } = useAuth();

  const account = session?.account;

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ${chainId}`
    : "Unknown Network";

  const truncate = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  const isNavActive = (path: string) => {
    if (path === "/verify" && (location.pathname === "/" || location.pathname.startsWith("/verify"))) {
      return true;
    }
    if (path === "/operations" && location.pathname.startsWith("/operations")) {
      return true;
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout("Wallet disconnected. Please reconnect to continue.");
    navigate("/verify");
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "rgba(5, 5, 5, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "0.85rem 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Brand Logo Lockup */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            textDecoration: "none",
            color: "var(--text-primary)",
          }}
        >
          <img
            src="/traceledger-emblem.png"
            alt="TraceLedger Logo"
            style={{
              height: "32px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em", lineHeight: 1.1, color: "#ffffff" }}>
              TraceLedger
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--accent-primary)", fontWeight: 500, letterSpacing: "0.02em" }}>
              Enterprise Web3 Infrastructure
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link
            to="/verify"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              fontWeight: 500,
              textDecoration: "none",
              color: isNavActive("/verify") ? "#ffffff" : "var(--text-secondary)",
              background: isNavActive("/verify") ? "var(--accent-primary-tint)" : "transparent",
              border: isNavActive("/verify") ? "1px solid var(--border-active)" : "1px solid transparent",
              transition: "all var(--transition-fast)",
            }}
          >
            <LuSearch /> Public Verify
          </Link>

          {isAuthenticated && (
            <Link
              to="/operations"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.85rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: 500,
                textDecoration: "none",
                color: isNavActive("/operations") ? "#ffffff" : "var(--text-secondary)",
                background: isNavActive("/operations") ? "var(--accent-primary-tint)" : "transparent",
                border: isNavActive("/operations") ? "1px solid var(--border-active)" : "1px solid transparent",
                transition: "all var(--transition-fast)",
              }}
            >
              <LuLayoutDashboard /> Operations Center
            </Link>
          )}
        </nav>

        {/* Network & Session Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          {/* Network Badge */}
          {isConnected && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.65rem",
                background: "var(--bg-card)",
                color: isNetworkSupported ? "var(--text-secondary)" : "var(--status-danger)",
                border: `1px solid ${isNetworkSupported ? "var(--border-subtle)" : "rgba(239, 68, 68, 0.35)"}`,
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                cursor: !isNetworkSupported ? "pointer" : "default",
              }}
              onClick={!isNetworkSupported ? () => switchNetwork(1337) : undefined}
              title={!isNetworkSupported ? "Click to switch to Ganache 1337" : networkName}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isNetworkSupported ? "var(--status-success)" : "var(--status-danger)",
                }}
              />
              {networkName}
            </div>
          )}

          {/* Authenticated Account Pill or Sign In Button */}
          {isAuthenticated && account ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.35rem 0.75rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  color: "var(--text-primary)",
                }}
              >
                <LuWallet style={{ color: "var(--accent-primary)" }} />
                <span>{truncate(account)}</span>

                {/* Highest Role Pill */}
                {roles.isAdmin ? (
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "var(--status-danger-tint)", color: "var(--status-danger)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                    Admin
                  </span>
                ) : roles.isManufacturer ? (
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "var(--accent-primary-tint)", color: "var(--accent-primary)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                    Mfg
                  </span>
                ) : roles.isServiceCenter ? (
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "var(--status-warning-tint)", color: "var(--status-warning)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                    Service
                  </span>
                ) : (
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "var(--status-success-tint)", color: "var(--status-success)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                    Owner
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                title="Disconnect & Sign Out"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem",
                  padding: "0.4rem 0.7rem",
                  background: "transparent",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <LuLogOut />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{
                padding: "0.45rem 1rem",
                fontSize: "0.85rem",
              }}
            >
              <LuKey /> Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
