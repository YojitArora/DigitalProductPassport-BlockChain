import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { LuShieldCheck, LuWallet, LuUnlink, LuCheck, LuShieldAlert } from "react-icons/lu";
import { WalletProvider } from "./context/WalletContext";
import { useWallet } from "./hooks/useWallet";
import { CONTRACT_ADDRESS, SUPPORTED_NETWORKS } from "./services/provider";

const WalletStatusCard: React.FC = () => {
  const {
    account,
    chainId,
    isConnected,
    isConnecting,
    isMetaMaskInstalled,
    error,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ID ${chainId}`
    : "Unknown Network";

  const truncateAddress = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "2.5rem 2rem",
        maxWidth: "580px",
        width: "100%",
        boxShadow: "var(--shadow-lg)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "rgba(99, 102, 241, 0.12)",
          color: "var(--accent-primary)",
          fontSize: "32px",
          marginBottom: "1.25rem",
        }}
      >
        <LuShieldCheck />
      </div>

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
          letterSpacing: "-0.025em",
        }}
      >
        Digital Product Passport
      </h1>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.95rem",
          lineHeight: "1.5",
          marginBottom: "1.5rem",
        }}
      >
        Blockchain-Based Product Authentication & Provenance Registry.
      </p>

      {/* Contract & Network Badge Bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          padding: "1rem",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          marginBottom: "1.5rem",
          textAlign: "left",
          fontSize: "0.825rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)" }}>Contract:</span>
          <span style={{ color: "var(--accent-primary)" }}>{truncateAddress(CONTRACT_ADDRESS)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)" }}>Network:</span>
          <span style={{ color: isConnected ? "var(--status-success)" : "var(--text-muted)" }}>
            {isConnected ? networkName : "Not Connected"}
          </span>
        </div>
        {isConnected && account && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)" }}>Wallet:</span>
            <span style={{ color: "var(--status-success)" }}>{truncateAddress(account)}</span>
          </div>
        )}
      </div>

      {/* Error alert if any */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "var(--radius-sm)",
            color: "var(--status-danger)",
            fontSize: "0.85rem",
            textAlign: "left",
          }}
        >
          <LuShieldAlert style={{ flexShrink: 0, fontSize: "1.1rem" }} />
          <span>{error}</span>
        </div>
      )}

      {/* Wallet Action Buttons */}
      {!isMetaMaskInstalled ? (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.75rem 1.5rem",
            background: "var(--accent-primary)",
            color: "#ffffff",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            textDecoration: "none",
            fontSize: "0.95rem",
          }}
        >
          <LuWallet /> Install MetaMask
        </a>
      ) : isConnected ? (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => switchNetwork(1337)}
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
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Switch Ganache (1337)
          </button>
          <button
            onClick={disconnect}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.75rem 1.25rem",
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--status-danger)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "var(--radius-md)",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <LuUnlink /> Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.75rem 1.5rem",
            background: "var(--accent-primary)",
            color: "#ffffff",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: isConnecting ? "not-allowed" : "pointer",
            opacity: isConnecting ? 0.7 : 1,
          }}
        >
          <LuWallet /> {isConnecting ? "Connecting to Wallet..." : "Connect MetaMask"}
        </button>
      )}

      {/* Foundation Status Tag */}
      <div
        style={{
          marginTop: "1.5rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.4rem 0.85rem",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-subtle)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          color: isConnected ? "var(--status-success)" : "var(--accent-primary)",
        }}
      >
        <LuCheck /> {isConnected ? "Web3 Layer Connected" : "Sprint 6: Web3 Layer Active"}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <WalletProvider>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "var(--bg-primary)",
          }}
        >
          <WalletStatusCard />
        </div>
      </WalletProvider>
    </Router>
  );
};

export default App;
