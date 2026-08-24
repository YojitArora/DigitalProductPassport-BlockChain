import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LuShieldCheck,
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
        background: "rgba(17, 24, 39, 0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
        padding: "0.85rem 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
            color: "var(--text-primary)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              color: "#ffffff",
              fontSize: "20px",
            }}
          >
            <LuShieldCheck />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
              ProductPassport
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--accent-secondary)", fontWeight: 500 }}>
              Enterprise Operations
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
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              color: isNavActive("/verify") ? "#ffffff" : "var(--text-secondary)",
              background: isNavActive("/verify") ? "rgba(99, 102, 241, 0.15)" : "transparent",
              border: isNavActive("/verify") ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
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
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                color: isNavActive("/operations") ? "#ffffff" : "var(--text-secondary)",
                background: isNavActive("/operations") ? "rgba(99, 102, 241, 0.15)" : "transparent",
                border: isNavActive("/operations") ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
              }}
            >
              <LuLayoutDashboard /> Operations Center
            </Link>
          )}
        </nav>

        {/* Network & Session Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Network Badge */}
          {isConnected && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                background: isNetworkSupported ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.12)",
                color: isNetworkSupported ? "var(--status-success)" : "var(--status-danger)",
                border: `1px solid ${isNetworkSupported ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
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
                  gap: "0.4rem",
                  padding: "0.4rem 0.75rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.825rem",
                  color: "var(--text-primary)",
                }}
              >
                <LuWallet style={{ color: "var(--status-success)" }} />
                <span>{truncate(account)}</span>

                {/* Highest Role Pill */}
                {roles.isAdmin ? (
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(239, 68, 68, 0.2)", color: "var(--status-danger)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                    Admin
                  </span>
                ) : roles.isManufacturer ? (
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(99, 102, 241, 0.2)", color: "var(--accent-primary)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                    Mfg
                  </span>
                ) : roles.isServiceCenter ? (
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(245, 158, 11, 0.2)", color: "var(--status-warning)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                    Service
                  </span>
                ) : (
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(16, 185, 129, 0.2)", color: "var(--status-success)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
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
                  padding: "0.45rem 0.75rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "var(--status-danger)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
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
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 1rem",
                background: "var(--accent-primary)",
                color: "#ffffff",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
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
