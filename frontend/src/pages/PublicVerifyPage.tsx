import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PassportService } from "../services/passportService";
import { Product } from "../types";
import ProductCard from "../components/ProductCard";
import LifecycleTimeline from "../components/timeline/LifecycleTimeline";
import EmptyState from "../components/EmptyState";
import {
  LuSearch,
  LuShieldCheck,
  LuShieldAlert,
  LuLoader,
  LuSparkles,
  LuClock,
  LuPackageSearch,
} from "react-icons/lu";

export const PublicVerifyPage: React.FC = () => {
  const { passportId } = useParams<{ passportId?: string }>();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState<string>(passportId ? passportId.trim() : "");
  const [product, setProduct] = useState<Product | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPassport = useCallback(async (idStr: string) => {
    const trimmed = idStr.trim();
    if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) {
      setError("Please enter a valid numeric Passport ID (e.g. 1, 2, 3...).");
      setProduct(null);
      setVerifiedAt(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const p = await PassportService.getProduct(BigInt(trimmed));
      setProduct(p);
      setVerifiedAt(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err: any) {
      setProduct(null);
      setVerifiedAt(null);
      setError(err.message || `No Digital Product Passport found for ID #${trimmed}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (passportId && passportId.trim()) {
      const trimmed = passportId.trim();
      setSearchId(trimmed);
      fetchPassport(trimmed);
    } else {
      setSearchId("");
      setProduct(null);
      setVerifiedAt(null);
      setError(null);
      setLoading(false);
    }
  }, [passportId, fetchPassport]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (trimmed) {
      if (passportId === trimmed) {
        fetchPassport(trimmed);
      } else {
        navigate(`/verify/${trimmed}`);
      }
    } else {
      setError("Please enter a numeric Passport ID to verify.");
      setProduct(null);
      setVerifiedAt(null);
    }
  };

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "2.5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {/* Page Hero Header */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.35rem 0.85rem",
            background: "rgba(99, 102, 241, 0.12)",
            color: "var(--accent-primary, #6366f1)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: "0.75rem",
          }}
        >
          <LuSparkles /> Public Trustless Verification
        </div>

        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "var(--text-primary, #f9fafb)",
            marginBottom: "0.5rem",
          }}
        >
          Verify Digital Product Passport
        </h1>

        <p
          style={{
            color: "var(--text-secondary, #9ca3af)",
            fontSize: "1rem",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Inspect immutable product authenticity, ownership provenance, real-time status, and verified repair records directly on-chain. No wallet required.
        </p>
      </div>

      {/* Passport ID Search Input Bar */}
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          gap: "0.75rem",
          background: "var(--bg-secondary, #111827)",
          padding: "0.6rem",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: "0.75rem",
            color: "var(--text-muted)",
            fontSize: "1.2rem",
          }}
        >
          <LuSearch />
        </div>

        <input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Enter Passport ID (e.g. 1, 2, 3...)"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: "1rem",
            fontFamily: "var(--font-sans)",
          }}
        />

        <button
          type="submit"
          disabled={loading || !searchId.trim()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.75rem 1.5rem",
            background: "var(--accent-primary)",
            color: "#ffffff",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: loading || !searchId.trim() ? "not-allowed" : "pointer",
            opacity: loading || !searchId.trim() ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <LuLoader style={{ animation: "spin 1.5s linear infinite" }} /> Verifying...
            </>
          ) : (
            <>
              <LuShieldCheck /> Verify
            </>
          )}
        </button>
      </form>

      {/* Verified On-Chain Timestamp Indicator */}
      {verifiedAt && product && !loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 1rem",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            color: "var(--status-success)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
            <LuShieldCheck /> Verified live against smart contract
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-secondary)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
            <LuClock /> Verified on-chain at: {verifiedAt}
          </div>
        </div>
      )}

      {/* Error View */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1.25rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "var(--radius-md)",
            color: "var(--status-danger, #ef4444)",
          }}
        >
          <LuShieldAlert style={{ fontSize: "1.5rem", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600 }}>Verification Unsuccessful</div>
            <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>{error}</div>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && !product && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "var(--text-secondary)",
          }}
        >
          <LuLoader
            style={{
              animation: "spin 1.5s linear infinite",
              fontSize: "2.5rem",
              color: "var(--accent-primary)",
              marginBottom: "0.75rem",
            }}
          />
          <div>Querying blockchain smart contract...</div>
        </div>
      )}

      {/* Empty State when no product is found and not loading */}
      {!loading && !product && !error && (
        <EmptyState
          icon={<LuPackageSearch />}
          title="No Product Passport Loaded"
          description="Enter a valid numeric Passport ID above to query its on-chain registration, provenance, warranty, and repair history."
        />
      )}

      {/* Product Passport Result Card & Lifecycle Timeline */}
      {product && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <ProductCard product={product} showActions={true} />
          <LifecycleTimeline product={product} />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PublicVerifyPage;
