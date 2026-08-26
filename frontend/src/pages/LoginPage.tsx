import React, { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import {
  LuWallet,
  LuKey,
  LuCheck,
  LuLock,
  LuShieldAlert,
  LuLoader,
  LuSearch,
} from "react-icons/lu";

export const LoginPage: React.FC = () => {
  const { isAuthenticated, isAuthenticating, authError, flashMessage, login, clearAuthError, clearFlashMessage } = useAuth();
  const { isMetaMaskInstalled } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/operations";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleAuthenticate = async () => {
    clearAuthError();
    clearFlashMessage();
    const success = await login();
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div
      style={{
        maxWidth: "520px",
        margin: "3.5rem auto",
        padding: "0 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      {/* Flash Disconnect Notification if present */}
      {flashMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.85rem 1.15rem",
            background: "var(--status-warning-tint)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: "var(--radius-md)",
            color: "var(--status-warning)",
            fontSize: "0.875rem",
          }}
        >
          <LuLock style={{ fontSize: "1.15rem", flexShrink: 0 }} />
          <div>{flashMessage}</div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div
        className="card-base"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          padding: "2.5rem 2.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
          textAlign: "center",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* TraceLedger Brand Header */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem",
            }}
          >
            <img
              src="/traceledger-emblem.png"
              alt="TraceLedger"
              style={{
                height: "56px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.2rem 0.6rem",
              background: "var(--bg-card)",
              border: "1px solid rgba(113, 135, 168, 0.3)",
              color: "var(--accent-primary)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.725rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Enterprise Web3 Infrastructure
          </div>

          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              marginBottom: "0.4rem",
              lineHeight: 1.2,
            }}
          >
            TraceLedger Access
          </h2>

          <p className="text-secondary" style={{ fontSize: "0.875rem", lineHeight: 1.55 }}>
            Authenticate using your cryptographic Web3 wallet signature to access your authorized enterprise role portals.
          </p>
        </div>

        {/* Security Workflow Pipeline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            textAlign: "left",
            background: "var(--bg-card)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            fontSize: "0.825rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "var(--text-primary)" }}>
            <LuWallet style={{ color: "var(--accent-primary)", fontSize: "1.1rem" }} />
            <span>1. Connect Web3 Wallet (MetaMask)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "var(--text-primary)" }}>
            <LuKey style={{ color: "var(--accent-primary)", fontSize: "1.1rem" }} />
            <span>2. Cryptographic Signature Verification</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "var(--text-primary)" }}>
            <LuCheck style={{ color: "var(--status-success)", fontSize: "1.1rem" }} />
            <span>3. Direct Smart Contract Role Authorization</span>
          </div>
        </div>

        {/* Error Feedback */}
        {authError && (
          <div
            className="card-danger"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-sm)",
              color: "var(--status-danger)",
              fontSize: "0.85rem",
              textAlign: "left",
            }}
          >
            <LuShieldAlert style={{ flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

        {/* Action Button */}
        {!isMetaMaskInstalled ? (
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              padding: "0.85rem 1.5rem",
              fontSize: "0.95rem",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            <LuWallet /> Install MetaMask
          </a>
        ) : (
          <button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            className="btn btn-primary"
            style={{
              padding: "0.85rem 1.5rem",
              fontSize: "0.95rem",
              justifyContent: "center",
            }}
          >
            {isAuthenticating ? (
              <>
                <LuLoader style={{ animation: "spin 1.5s linear infinite" }} />
                Verifying Signature...
              </>
            ) : (
              <>
                <LuKey />
                Sign In with Wallet
              </>
            )}
          </button>
        )}

        {/* Public Verification Link */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.15rem", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>Looking to inspect a product? </span>
          <Link
            to="/verify"
            style={{
              color: "var(--accent-primary)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              textDecoration: "none",
            }}
          >
            <LuSearch /> Public Verification Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
