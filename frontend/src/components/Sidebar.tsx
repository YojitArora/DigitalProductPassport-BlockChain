import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LuSearch,
  LuQrCode,
  LuLayoutDashboard,
  LuBoxes,
  LuFactory,
  LuWrench,
  LuShield,
  LuWallet,
  LuLogOut,
  LuKey,
  LuCheck,
  LuCopy,
  LuMenu,
  LuX,
} from "react-icons/lu";
import { useWallet } from "../hooks/useWallet";
import { useAuth } from "../hooks/useAuth";
import { SUPPORTED_NETWORKS } from "../services/provider";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { chainId, isConnected, isNetworkSupported, switchNetwork } = useWallet();
  const { isAuthenticated, session, roles, logout } = useAuth();

  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const account = session?.account;

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ${chainId}`
    : "Ganache Local (1337)";

  const truncate = (addr: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "None";

  const handleCopyWallet = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleLogout = () => {
    logout("Wallet disconnected. Please reconnect to continue.");
    navigate("/verify");
    setMobileMenuOpen(false);
  };

  const isNavActive = (path: string) => {
    if (path === "/verify") {
      return location.pathname === "/" || location.pathname.startsWith("/verify");
    }
    if (path === "/operations") {
      return location.pathname === "/operations";
    }
    return location.pathname.startsWith(path);
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Top App Bar (Only visible on screens < 1024px) */}
      <div
        className="mobile-top-bar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "rgba(5, 5, 5, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0.75rem 1.25rem",
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
          }}
        >
          <img
            src="/traceledger-emblem.png"
            alt="TraceLedger"
            style={{ height: "28px", width: "auto", objectFit: "contain" }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#ffffff", letterSpacing: "-0.02em" }}>
              TraceLedger
            </div>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isConnected && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.55rem",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.725rem",
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isNetworkSupported ? "var(--status-success)" : "var(--status-danger)",
                }}
              />
              <span>{networkName}</span>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              color: "#ffffff",
              fontSize: "1.35rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <LuX /> : <LuMenu />}
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile Slide-over Drawer */}
      {mobileMenuOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1040,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Vertical Left Sidebar */}
      <aside
        className={`app-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}
        style={{
          width: "275px",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1050,
          background: "#050505",
          borderRight: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1.5rem 1.15rem 1.25rem 1.15rem",
          overflowY: "auto",
        }}
      >
        {/* Top Branding Section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
            <Link
              to="/"
              onClick={closeMobile}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                textDecoration: "none",
              }}
            >
              <img
                src="/traceledger-emblem.png"
                alt="TraceLedger Logo"
                style={{
                  height: "36px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    color: "#ffffff",
                  }}
                >
                  TraceLedger
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--accent-primary)",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    marginTop: "0.15rem",
                  }}
                >
                  Enterprise Web3 Infrastructure
                </div>
              </div>
            </Link>

            {/* Mobile close button inside drawer */}
            <button
              onClick={closeMobile}
              className="mobile-close-btn"
              style={{
                display: "none",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "1.25rem",
                cursor: "pointer",
              }}
            >
              <LuX />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* SECTION 1: VERIFICATION */}
            <div>
              <div
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                  marginBottom: "0.5rem",
                  paddingLeft: "0.5rem",
                }}
              >
                Verification
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <Link
                  to="/verify"
                  onClick={closeMobile}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    color: isNavActive("/verify") ? "#ffffff" : "var(--text-secondary)",
                    background: isNavActive("/verify") ? "#182333" : "transparent",
                    border: isNavActive("/verify") ? "1px solid rgba(113, 135, 168, 0.4)" : "1px solid transparent",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <LuSearch style={{ color: isNavActive("/verify") ? "var(--accent-primary)" : "var(--text-muted)", fontSize: "1rem" }} />
                  <span>Public Verify</span>
                </Link>

                <Link
                  to="/verify"
                  onClick={closeMobile}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    color: "var(--text-secondary)",
                    background: "transparent",
                    border: "1px solid transparent",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <LuQrCode style={{ color: "var(--text-muted)", fontSize: "1rem" }} />
                  <span>Scan QR Code</span>
                </Link>
              </div>
            </div>

            {/* SECTION 2: PLATFORM */}
            <div>
              <div
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                  marginBottom: "0.5rem",
                  paddingLeft: "0.5rem",
                }}
              >
                Platform
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <Link
                  to="/operations"
                  onClick={closeMobile}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    color: isNavActive("/operations") ? "#ffffff" : "var(--text-secondary)",
                    background: isNavActive("/operations") ? "#182333" : "transparent",
                    border: isNavActive("/operations") ? "1px solid rgba(113, 135, 168, 0.4)" : "1px solid transparent",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <LuLayoutDashboard style={{ color: isNavActive("/operations") ? "var(--accent-primary)" : "var(--text-muted)", fontSize: "1rem" }} />
                  <span>Operations Center</span>
                </Link>
              </div>
            </div>

            {/* SECTION 3: AUTHENTICATED PORTALS */}
            {isAuthenticated && (
              <div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-muted)",
                    marginBottom: "0.5rem",
                    paddingLeft: "0.5rem",
                  }}
                >
                  Authenticated Portals
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {(roles.isOwner || roles.isAdmin) && (
                    <Link
                      to="/operations/owner"
                      onClick={closeMobile}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.825rem",
                        fontWeight: 500,
                        textDecoration: "none",
                        color: location.pathname.startsWith("/operations/owner") ? "#ffffff" : "var(--text-secondary)",
                        background: location.pathname.startsWith("/operations/owner") ? "#182333" : "transparent",
                        border: location.pathname.startsWith("/operations/owner") ? "1px solid rgba(113, 135, 168, 0.4)" : "1px solid transparent",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <LuBoxes style={{ color: location.pathname.startsWith("/operations/owner") ? "var(--accent-primary)" : "var(--text-muted)", fontSize: "0.95rem" }} />
                      <span>Owner Portal</span>
                    </Link>
                  )}

                  {(roles.isManufacturer || roles.isAdmin) && (
                    <Link
                      to="/operations/manufacturer"
                      onClick={closeMobile}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.825rem",
                        fontWeight: 500,
                        textDecoration: "none",
                        color: location.pathname.startsWith("/operations/manufacturer") ? "#ffffff" : "var(--text-secondary)",
                        background: location.pathname.startsWith("/operations/manufacturer") ? "#182333" : "transparent",
                        border: location.pathname.startsWith("/operations/manufacturer") ? "1px solid rgba(113, 135, 168, 0.4)" : "1px solid transparent",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <LuFactory style={{ color: location.pathname.startsWith("/operations/manufacturer") ? "var(--accent-primary)" : "var(--text-muted)", fontSize: "0.95rem" }} />
                      <span>Manufacturer Portal</span>
                    </Link>
                  )}

                  {(roles.isServiceCenter || roles.isAdmin) && (
                    <Link
                      to="/operations/service"
                      onClick={closeMobile}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.825rem",
                        fontWeight: 500,
                        textDecoration: "none",
                        color: location.pathname.startsWith("/operations/service") ? "#ffffff" : "var(--text-secondary)",
                        background: location.pathname.startsWith("/operations/service") ? "#182333" : "transparent",
                        border: location.pathname.startsWith("/operations/service") ? "1px solid rgba(113, 135, 168, 0.4)" : "1px solid transparent",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <LuWrench style={{ color: location.pathname.startsWith("/operations/service") ? "var(--accent-primary)" : "var(--text-muted)", fontSize: "0.95rem" }} />
                      <span>Service Center</span>
                    </Link>
                  )}

                  {roles.isAdmin && (
                    <Link
                      to="/operations/admin"
                      onClick={closeMobile}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.825rem",
                        fontWeight: 500,
                        textDecoration: "none",
                        color: location.pathname.startsWith("/operations/admin") ? "#ffffff" : "var(--text-secondary)",
                        background: location.pathname.startsWith("/operations/admin") ? "#182333" : "transparent",
                        border: location.pathname.startsWith("/operations/admin") ? "1px solid rgba(113, 135, 168, 0.4)" : "1px solid transparent",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <LuShield style={{ color: location.pathname.startsWith("/operations/admin") ? "var(--status-danger)" : "var(--text-muted)", fontSize: "0.95rem" }} />
                      <span>Platform Admin</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Section: Account & Network */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
          {isAuthenticated && account ? (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <LuWallet style={{ color: "var(--accent-primary)", fontSize: "0.95rem" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 600, color: "#ffffff" }}>
                    {truncate(account)}
                  </span>
                </div>
                <button
                  onClick={handleCopyWallet}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: copiedWallet ? "var(--status-success)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    padding: "0.15rem",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  title="Copy wallet address"
                >
                  {copiedWallet ? <LuCheck /> : <LuCopy />}
                </button>
              </div>

              {/* Role Badge and Disconnect Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  {roles.isAdmin ? (
                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "rgba(239, 68, 68, 0.15)", color: "var(--status-danger)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                      Admin
                    </span>
                  ) : roles.isManufacturer ? (
                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "rgba(113, 135, 168, 0.15)", color: "var(--accent-primary)", border: "1px solid rgba(113, 135, 168, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                      Manufacturer
                    </span>
                  ) : roles.isServiceCenter ? (
                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "rgba(245, 158, 11, 0.15)", color: "var(--status-warning)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                      Service Center
                    </span>
                  ) : roles.isOwner ? (
                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "rgba(16, 185, 129, 0.15)", color: "var(--status-success)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                      Owner
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Connected</span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "0.725rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--status-danger)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  title="Disconnect Session"
                >
                  <LuLogOut /> Disconnect
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={closeMobile}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                fontSize: "0.825rem",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <LuKey /> Sign In with Wallet
            </Link>
          )}

          {/* Network Status Indicator */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.5rem 0.75rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.725rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                cursor: !isNetworkSupported ? "pointer" : "default",
                color: isNetworkSupported ? "var(--text-secondary)" : "var(--status-danger)",
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
                  display: "inline-block",
                }}
              />
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                {networkName}
              </span>
            </div>

            <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
