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
          padding: "2.5rem 2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
          textAlign: "center",
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
                height: "52px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <h2
            className="text-card-title"
            style={{
              fontSize: "1.65rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              marginBottom: "0.35rem",
            }}
          >
            TraceLedger Enterprise Access
          </h2>

          <p className="text-secondary" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
            Authenticate using your Web3 cryptographic wallet signature to access your authorized role portals.
          </p>
        </div>

        {/* Security Workflow Pipeline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
            textAlign: "left",
            background: "var(--bg-card)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            fontSize: "0.825rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
            <LuWallet style={{ color: "var(--accent-secondary)" }} />
            <span>1. Connect Web3 Wallet (MetaMask)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
            <LuKey style={{ color: "var(--accent-primary)" }} />
            <span>2. Cryptographic Signature Verification</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
            <LuCheck style={{ color: "var(--status-success)" }} />
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
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>Looking to inspect a product? </span>
          <Link
            to="/verify"
            style={{
              color: "var(--accent-primary)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
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
