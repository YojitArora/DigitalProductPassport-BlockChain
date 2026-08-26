import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PassportService } from "../services/passportService";
import { HistoryService } from "../services/historyService";
import { Product, LedgerEvent } from "../types";
import ProductCard from "../components/ProductCard";
import LifecycleTimeline from "../components/timeline/LifecycleTimeline";
import PublicRepairHistory from "../components/repair/PublicRepairHistory";
import EmptyState from "../components/EmptyState";
import { formatDateTime } from "../utils/dateUtils";
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
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([]);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPassport = useCallback(async (idStr: string) => {
    if (!idStr || !idStr.trim()) {
      setError("Please enter a valid Professional DPP ID (e.g. DPP-AURA-000001) or numeric Passport ID.");
      setProduct(null);
      setLedgerEvents([]);
      setVerifiedAt(null);
      return;
    }

    const trimmed = idStr.trim();
    setLoading(true);
    setError(null);

    try {
      const p = await PassportService.resolveProduct(trimmed);
      const ledger = await HistoryService.getProductHistoryLedger(p.passportId).catch(() => ({ events: [] as LedgerEvent[] }));
      setProduct(p);
      setLedgerEvents(ledger.events);
      setVerifiedAt(formatDateTime(new Date()));
    } catch (err: any) {
      setProduct(null);
      setLedgerEvents([]);
      setVerifiedAt(null);
      setError(err.message || `No Digital Product Passport found for identifier "${trimmed}".`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (passportId && passportId.trim()) {
      const decoded = decodeURIComponent(passportId.trim());
      setSearchId(decoded);
      fetchPassport(decoded);
    } else {
      setSearchId("");
      setProduct(null);
      setLedgerEvents([]);
      setVerifiedAt(null);
      setError(null);
      setLoading(false);
    }
  }, [passportId, fetchPassport]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (!trimmed) {
      setError("Please enter a Professional DPP ID (e.g. DPP-AURA-000001) or numeric ID.");
      setProduct(null);
      setVerifiedAt(null);
      return;
    }

    if (passportId?.toUpperCase() === trimmed.toUpperCase()) {
      fetchPassport(trimmed);
    } else {
      navigate(`/verify/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div
      style={{
        maxWidth: "1020px",
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
            gap: "0.45rem",
            padding: "0.3rem 0.8rem",
            background: "var(--accent-primary-tint)",
            border: "1px solid var(--border-active)",
            color: "var(--accent-primary)",
            borderRadius: "var(--radius-full)",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "0.85rem",
          }}
        >
          <LuSparkles /> Public Blockchain Trust Network
        </div>

        <h1 className="text-page-title" style={{ marginBottom: "0.5rem" }}>
          Verify Digital Product Passport
        </h1>

        <p className="text-page-subtitle" style={{ maxWidth: "620px", margin: "0 auto" }}>
          Query the immutable, on-chain provenance, certified ownership chain, warranty status, and certified service history of any registered physical product.
        </p>
      </div>

      {/* Search Bar Input Form */}
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "0.45rem 0.55rem 0.45rem 1.25rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ color: "var(--accent-primary)", fontSize: "1.2rem", display: "flex", alignItems: "center" }}>
          <LuSearch />
        </div>

        <input
          id="public-verify-passport-id"
          name="passportId"
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Enter DPP ID (e.g. DPP-AURA-000001) or Passport ID..."
          aria-label="Enter DPP ID or Passport ID"
          autoComplete="off"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            fontFamily: "var(--font-sans)",
          }}
        />

        <button
          type="submit"
          disabled={loading || !searchId.trim()}
          className="btn btn-primary"
          style={{
            opacity: loading || !searchId.trim() ? 0.5 : 1,
            padding: "0.65rem 1.35rem",
          }}
        >
          {loading ? (
            <>
              <LuLoader style={{ animation: "spin 1.5s linear infinite" }} /> Verifying...
            </>
          ) : (
            <>
              <LuShieldCheck /> Verify Passport
            </>
          )}
        </button>
      </form>

      {/* Verified On-Chain Certificate Banner (Restrained, Pitch-Black / Charcoal Base) */}
      {verifiedAt && product && !loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
            background: "#080808",
            border: "1px solid var(--border-verified)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-sm)",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, letterSpacing: "0.02em", color: "var(--status-success)" }}>
            <LuShieldCheck style={{ fontSize: "1.15rem" }} />
            <span>AUTHENTIC DIGITAL PRODUCT PASSPORT (VERIFIED ON-CHAIN)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
            <LuClock /> Verified at: {verifiedAt}
          </div>
        </div>
      )}

      {/* Error State View */}
      {error && (
        <div
          className="card-danger"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.85rem",
            padding: "1.25rem",
            borderRadius: "var(--radius-md)",
            color: "var(--status-danger)",
          }}
        >
          <LuShieldAlert style={{ fontSize: "1.4rem", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: "0.2rem" }}>Verification Unsuccessful</div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>{error}</div>
          </div>
        </div>
      )}

      {/* Loading State Spinner */}
      {loading && !product && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 1rem",
            color: "var(--text-secondary)",
          }}
        >
          <LuLoader
            style={{
              animation: "spin 1.5s linear infinite",
              fontSize: "2.25rem",
              color: "var(--accent-primary)",
              marginBottom: "0.85rem",
            }}
          />
          <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>
            Querying blockchain smart contract...
          </div>
          <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Verifying cryptographic proof and retrieving lifecycle events
          </div>
        </div>
      )}

      {/* Empty State when no product is loaded */}
      {!loading && !product && !error && (
        <EmptyState
          icon={<LuPackageSearch />}
          title="No Product Passport Loaded"
          description="Enter a valid Professional DPP ID (e.g. DPP-AURA-000001) or numeric Passport ID above to query its on-chain registration, provenance, warranty, and repair history."
        />
      )}

      {/* Product Passport Result: Hero Card, Lifecycle Timeline & Repair History */}
      {product && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* 1. Elevated Product Hero Card (No photo, pure technical passport) */}
          <ProductCard product={product} showActions={true} />

          {/* 2. Complete Chronological Product History Ledger */}
          <LifecycleTimeline product={product} events={ledgerEvents} />

          {/* 3. Certified Public Repair Records & Service History */}
          <PublicRepairHistory events={ledgerEvents} productStatus={product.status} />
        </div>
      )}
    </div>
  );
};

export default PublicVerifyPage;
