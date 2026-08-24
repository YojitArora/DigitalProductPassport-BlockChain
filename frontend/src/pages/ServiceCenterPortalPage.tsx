import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTransaction } from "../hooks/useTransaction";
import { PassportService } from "../services/passportService";
import { Product, ProductStatus } from "../types";
import TransactionModal from "../components/TransactionModal";
import StatusBadge from "../components/StatusBadge";
import {
  LuWrench,
  LuArrowLeft,
  LuPlay,
  LuCheck,
  LuLayers,
  LuExternalLink,
  LuRefreshCw,
  LuLoader,
  LuClock,
} from "react-icons/lu";

export const ServiceCenterPortalPage: React.FC = () => {
  const tx = useTransaction();

  // Service Center Products Queries
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Service Form States
  const [serviceStartId, setServiceStartId] = useState<string>("");
  const [serviceCompleteId, setServiceCompleteId] = useState<string>("");
  const [serviceDescription, setServiceDescription] = useState<string>("");

  const fetchServiceData = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const list = await PassportService.getAllProducts();
      setAllProducts(list);
    } catch (err) {
      console.warn("Failed to fetch service center products:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);

  const activeServiceJobs = allProducts.filter(
    (p) => p.status === ProductStatus.UnderService
  );

  const completedServiceJobs = allProducts.filter(
    (p) => p.repairCount > 0n && p.status !== ProductStatus.UnderService
  );

  const formatDate = (ts: bigint) => {
    if (!ts || ts === 0n) return "N/A";
    return new Date(Number(ts) * 1000).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncate = (addr: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "None";

  return (
    <div
      style={{
        maxWidth: "1150px",
        margin: "0 auto",
        padding: "2.5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "2.25rem",
      }}
    >
      {/* Back Link & Header */}
      <div>
        <Link
          to="/operations"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            fontWeight: 500,
            marginBottom: "1rem",
            textDecoration: "none",
          }}
        >
          <LuArrowLeft /> Back to Operations Center
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "var(--status-warning)",
              fontSize: "20px",
            }}
          >
            <LuWrench />
          </div>
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Certified Service Center Portal
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Initiate official service sessions, log permanent maintenance & repair event logs, and review service queues.
            </p>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.75rem" }}>
        {/* Start Service */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LuPlay style={{ color: "var(--status-warning)" }} /> Start Service Session
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Transition product to UnderService status and lock servicing rights to your service center wallet.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="number"
              placeholder="Passport ID (e.g. 1)"
              value={serviceStartId}
              onChange={(e) => setServiceStartId(e.target.value)}
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
            />
            <button
              onClick={() =>
                tx.execute(async (cb) => {
                  const res = await PassportService.startService(BigInt(serviceStartId), cb);
                  fetchServiceData();
                  return res;
                })
              }
              disabled={!serviceStartId}
              style={{ padding: "0.75rem", background: "var(--status-warning)", color: "#111827", borderRadius: "var(--radius-md)", fontWeight: 700, marginTop: "0.25rem" }}
            >
              Start Service Session
            </button>
          </div>
        </div>

        {/* Complete Service */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LuCheck style={{ color: "var(--status-success)" }} /> Complete Service Session
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Log permanent repair event metadata, increment repair count, and restore previous operational status.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="number"
              placeholder="Passport ID (e.g. 1)"
              value={serviceCompleteId}
              onChange={(e) => setServiceCompleteId(e.target.value)}
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
            />
            <textarea
              placeholder="Certified Service / Repair Notes (e.g. Ultrasonic clean, movement lubrication, waterproof pressure testing passed.)"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              rows={3}
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
            />
            <button
              onClick={() =>
                tx.execute(async (cb) => {
                  const res = await PassportService.completeService(BigInt(serviceCompleteId), serviceDescription, cb);
                  fetchServiceData();
                  return res;
                })
              }
              disabled={!serviceCompleteId || !serviceDescription}
              style={{ padding: "0.75rem", background: "var(--status-success)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.25rem" }}
            >
              Complete Service & Log Repair
            </button>
          </div>
        </div>
      </div>

      {/* Active Service Jobs Section */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LuClock style={{ color: "var(--status-warning)", fontSize: "1.2rem" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Current Active Service Jobs ({activeServiceJobs.length})
            </h3>
          </div>

          <button
            onClick={fetchServiceData}
            disabled={loadingProducts}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.4rem 0.8rem",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            <LuRefreshCw className={loadingProducts ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {loadingProducts ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)" }}>
            <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "1.5rem", marginBottom: "0.5rem" }} />
            <div>Loading service queue from blockchain...</div>
          </div>
        ) : activeServiceJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
            No products currently under active service on-chain.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>ID</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Product Name</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Servicing Center</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Repairs</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeServiceJobs.map((p) => (
                  <tr key={p.passportId.toString()} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-primary)" }}>
                      #{p.passportId.toString()}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {p.productName}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {truncate(p.currentServiceCenter)}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-secondary)" }}>
                      {p.repairCount.toString()}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setServiceCompleteId(p.passportId.toString());
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.3rem 0.6rem",
                          background: "var(--status-success)",
                          color: "#ffffff",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          marginRight: "0.5rem",
                        }}
                      >
                        Complete
                      </button>
                      <Link
                        to={`/verify/${p.passportId.toString()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          color: "var(--accent-primary)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        View <LuExternalLink />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completed Service History Section */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <LuLayers style={{ color: "var(--status-success)", fontSize: "1.2rem" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Completed Service Jobs ({completedServiceJobs.length})
          </h3>
        </div>

        {completedServiceJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
            No past completed repairs recorded yet on the blockchain.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>ID</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Product Name</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Last Repair Date</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Total Repairs</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {completedServiceJobs.map((p) => (
                  <tr key={p.passportId.toString()} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-primary)" }}>
                      #{p.passportId.toString()}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {p.productName}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-secondary)" }}>
                      {formatDate(p.lastRepairTimestamp)}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-secondary)" }}>
                      {p.repairCount.toString()}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                      <Link
                        to={`/verify/${p.passportId.toString()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          color: "var(--accent-primary)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        View <LuExternalLink />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal state={tx.state} onClose={tx.reset} />
    </div>
  );
};

export default ServiceCenterPortalPage;
