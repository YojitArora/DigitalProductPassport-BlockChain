import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LuShieldCheck, LuWallet, LuUnlink, LuSearch, LuLayoutDashboard } from "react-icons/lu";
import { useWallet } from "../hooks/useWallet";
import { SUPPORTED_NETWORKS } from "../services/provider";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const {
    account,
    chainId,
    isConnected,
    isConnecting,
    isMetaMaskInstalled,
    isNetworkSupported,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ${chainId}`
    : "Unknown Network";

  const truncate = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  const isNavActive = (path: string) => {
    if (path === "/verify" && (location.pathname === "/" || location.pathname.startsWith("/verify"))) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "rgba(17, 24, 39, 0.85)",
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
              Blockchain Registry
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

          <Link
            to="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              color: isNavActive("/dashboard") ? "#ffffff" : "var(--text-secondary)",
              background: isNavActive("/dashboard") ? "rgba(99, 102, 241, 0.15)" : "transparent",
              border: isNavActive("/dashboard") ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
            }}
          >
            <LuLayoutDashboard /> Dashboard
          </Link>
        </nav>

        {/* Network & Wallet Section */}
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

          {/* Connect / Disconnect Button */}
          {!isMetaMaskInstalled ? (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.95rem",
                background: "var(--accent-primary)",
                color: "#ffffff",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <LuWallet /> Install MetaMask
            </a>
          ) : isConnected && account ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.85rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                }}
              >
                <LuWallet style={{ color: "var(--status-success)" }} />
                <span>{truncate(account)}</span>
              </div>

              <button
                onClick={disconnect}
                title="Disconnect Wallet"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.45rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "var(--status-danger)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                <LuUnlink />
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
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
                cursor: isConnecting ? "not-allowed" : "pointer",
                opacity: isConnecting ? 0.7 : 1,
              }}
            >
              <LuWallet /> {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
