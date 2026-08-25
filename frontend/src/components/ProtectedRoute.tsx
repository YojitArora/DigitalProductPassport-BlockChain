import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { LuShieldAlert, LuNetwork } from "react-icons/lu";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isAuthenticating } = useAuth();
  const { isNetworkSupported, switchNetwork } = useWallet();
  const location = useLocation();

  if (isAuthenticating) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          color: "var(--text-secondary)",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div>Verifying wallet cryptographic session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isNetworkSupported) {
    return (
      <div
        style={{
          maxWidth: "540px",
          margin: "4rem auto",
          padding: "2rem",
          background: "var(--bg-secondary)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: "var(--radius-lg)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(245, 158, 11, 0.15)",
            color: "var(--status-warning)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
          }}
        >
          <LuShieldAlert />
        </div>

        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
            Unsupported Network
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Your wallet is connected to an unsupported blockchain network. Please switch to Ganache Local (1337) or Hardhat (31337) to access enterprise operations.
          </p>
        </div>

        <button
          onClick={() => switchNetwork(1337)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            background: "var(--accent-primary)",
            color: "#ffffff",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          <LuNetwork /> Switch to Ganache (1337)
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
