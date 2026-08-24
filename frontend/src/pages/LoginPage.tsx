import React, { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import {
  LuShieldCheck,
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
        maxWidth: "540px",
        margin: "3rem auto",
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
            padding: "1rem 1.25rem",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "var(--radius-md)",
            color: "var(--status-warning, #f59e0b)",
            fontSize: "0.9rem",
          }}
        >
          <LuLock style={{ fontSize: "1.25rem", flexShrink: 0 }} />
          <div>{flashMessage}</div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div
        style={{
          background: "var(--bg-secondary, #111827)",
          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "2.5rem 2rem",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
          textAlign: "center",
        }}
      >
        {/* Shield Icon Header */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "var(--accent-primary, #6366f1)",
              fontSize: "30px",
              marginBottom: "1rem",
            }}
          >
            <LuShieldCheck />
          </div>

          <h2
            style={{
              fontSize: "1.65rem",
              fontWeight: 800,
              color: "var(--text-primary, #f9fafb)",
              letterSpacing: "-0.02em",
              marginBottom: "0.4rem",
            }}
          >
            Enterprise Access Portal
          </h2>

          <p style={{ color: "var(--text-secondary, #9ca3af)", fontSize: "0.9rem", lineHeight: 1.4 }}>
            Authenticate using your Web3 wallet signature to access your authorized blockchain portals.
          </p>
        </div>

        {/* Security Workflow Pipeline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            textAlign: "left",
            background: "var(--bg-card, #1f2937)",
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "var(--radius-sm)",
              color: "var(--status-danger, #ef4444)",
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
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.85rem 1.5rem",
              background: "var(--accent-primary)",
              color: "#ffffff",
              borderRadius: "var(--radius-md)",
              fontSize: "0.95rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <LuWallet /> Install MetaMask
          </a>
        ) : (
          <button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.85rem 1.5rem",
              background: "var(--accent-primary)",
              color: "#ffffff",
              borderRadius: "var(--radius-md)",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: isAuthenticating ? "not-allowed" : "pointer",
              opacity: isAuthenticating ? 0.7 : 1,
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
