import React, { useEffect } from "react";
import { TransactionState } from "../types";
import {
  LuLoader,
  LuCheck,
  LuX,
  LuWallet,
} from "react-icons/lu";

interface TransactionModalProps {
  state: TransactionState;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ state, onClose }) => {
  const isPending =
    state.status === "preparing" ||
    state.status === "awaiting_wallet_confirmation" ||
    state.status === "pending_transaction";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending && state.status !== "idle") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, state.status, onClose]);

  if (state.status === "idle") return null;

  const isConfirmed = state.status === "confirmed";
  const isFailed = state.status === "failed";

  const getStatusIcon = () => {
    switch (state.status) {
      case "preparing":
      case "pending_transaction":
        return <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "36px" }} />;
      case "awaiting_wallet_confirmation":
        return <LuWallet style={{ fontSize: "36px", color: "var(--accent-primary)" }} />;
      case "confirmed":
        return <LuCheck style={{ fontSize: "36px", color: "var(--status-success)" }} />;
      case "failed":
        return <LuX style={{ fontSize: "36px", color: "var(--status-danger)" }} />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (state.status) {
      case "preparing":
        return "Preparing Transaction";
      case "awaiting_wallet_confirmation":
        return "Wallet Confirmation Required";
      case "pending_transaction":
        return "Processing On-Chain";
      case "confirmed":
        return "Transaction Confirmed!";
      case "failed":
        return "Transaction Failed";
      default:
        return "";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "1rem",
      }}
      onClick={!isPending ? onClose : undefined}
    >
      <div
        className="card-base"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "2.25rem 2rem",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "var(--shadow-lg)",
          textAlign: "center",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isPending && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              color: "var(--text-secondary)",
              fontSize: "1.25rem",
              padding: "0.25rem",
            }}
            aria-label="Close"
          >
            <LuX />
          </button>
        )}

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: isConfirmed
              ? "rgba(16, 185, 129, 0.15)"
              : isFailed
              ? "rgba(239, 68, 68, 0.15)"
              : "rgba(113, 135, 168, 0.15)",
            color: isConfirmed
              ? "var(--status-success)"
              : isFailed
              ? "var(--status-danger)"
              : "var(--accent-primary)",
            marginBottom: "1.25rem",
          }}
        >
          {getStatusIcon()}
        </div>

        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: "0.5rem",
          }}
        >
          {getTitle()}
        </h3>

        <p
          className="text-secondary"
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.5,
            marginBottom: "1.5rem",
          }}
        >
          {state.stepMessage}
        </p>

        {state.txHash && (
          <div
            style={{
              padding: "0.6rem 0.75rem",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              wordBreak: "break-all",
              marginBottom: "1.5rem",
              textAlign: "left",
            }}
          >
            <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.2rem" }}>
              Tx Hash:
            </div>
            {state.txHash}
          </div>
        )}

        {!isPending && (
          <button
            onClick={onClose}
            className={isConfirmed ? "btn btn-primary" : "btn btn-secondary"}
            style={{
              width: "100%",
              padding: "0.75rem 1.5rem",
              justifyContent: "center",
              fontSize: "0.95rem",
            }}
          >
            {isConfirmed ? "Done" : "Close"}
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;
