import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTransaction } from "../hooks/useTransaction";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { PassportService } from "../services/passportService";
import { SUPPORTED_NETWORKS } from "../services/provider";
import { Product, ProductStatus } from "../types";
import TransactionModal from "../components/TransactionModal";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/dateUtils";
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
  LuCopy,
  LuShieldAlert,
} from "react-icons/lu";

export const ServiceCenterPortalPage: React.FC = () => {
  const tx = useTransaction();
  const { session } = useAuth();
  const { chainId } = useWallet();
  const account = session?.account || "";

  // Service Center Products Queries
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);

  // Service Form States
  const [serviceStartId, setServiceStartId] = useState<string>("");
  const [serviceCompleteId, setServiceCompleteId] = useState<string>("");
  const [serviceDescription, setServiceDescription] = useState<string>("");

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ${chainId}`
    : "Ganache Local (1337)";

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

  const handleCopyWallet = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const activeServiceJobs = allProducts.filter(
    (p) => p.status === ProductStatus.UnderService
  );

  const completedServiceJobs = allProducts.filter(
    (p) => p.repairCount > 0n && p.status !== ProductStatus.UnderService
  );

  const truncate = (addr: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "None";

  return (
    <div
      style={{
        maxWidth: "1160px",
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
            marginBottom: "1.25rem",
            textDecoration: "none",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <LuArrowLeft /> Back to Operations Center
        </Link>

        {/* Identity & Header Card */}
        <div
          className="card-base"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            padding: "2rem 2.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div style={{ maxWidth: "580px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.65rem",
                background: "var(--bg-card)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "var(--status-warning)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              <LuWrench /> TraceLedger Service Center Console
            </div>

            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                marginBottom: "0.4rem",
                lineHeight: 1.2,
              }}
            >
              Service Center Portal
            </h1>

            <p className="text-secondary" style={{ fontSize: "0.925rem", lineHeight: 1.55 }}>
              Initiate official service sessions, log certified maintenance records with permanent description hashes, and manage active service queues.
            </p>
          </div>

          {/* Service Center Identity & Refresh Action */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              minWidth: "300px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Service Center Identity
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>
                    {truncate(account)}
                  </span>
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
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Network
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--status-success)",
                      display: "inline-block",
                    }}
                  />
                  <span>{networkName}</span>
                </div>
              </div>
            </div>

            <button
              onClick={fetchServiceData}
              disabled={loadingProducts}
              className="btn btn-secondary"
              style={{
                width: "100%",
                padding: "0.45rem 0.85rem",
                fontSize: "0.825rem",
                justifyContent: "center",
              }}
            >
              <LuRefreshCw className={loadingProducts ? "animate-spin" : ""} /> Refresh Service State
            </button>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.75rem" }}>
        {/* Start Service Form */}
        <div
          className="card-base"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            height: "fit-content",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuPlay style={{ color: "var(--status-warning)" }} /> Register Product for Service
            </h3>
            <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
              Transition product to UnderService status and assign servicing rights to your service center wallet.
            </p>
          </div>

          <div
            style={{
              padding: "0.65rem 0.85rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.775rem",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <LuShieldAlert style={{ color: "var(--status-warning)", flexShrink: 0, fontSize: "1rem" }} />
            <span>Anti-theft verification: stolen products are locked and rejected by smart contracts.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label htmlFor="sc-start-passport-id" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                Passport ID
              </label>
              <input
                id="sc-start-passport-id"
                name="startPassportId"
                type="number"
                placeholder="Passport ID (e.g. 1)"
                value={serviceStartId}
                onChange={(e) => setServiceStartId(e.target.value)}
                autoComplete="off"
                className="input-base"
                style={{ width: "100%", fontSize: "0.85rem" }}
              />
            </div>

            <button
              onClick={() =>
                tx.execute(async (cb) => {
                  const res = await PassportService.startService(BigInt(serviceStartId), cb);
                  fetchServiceData();
                  return res;
                })
              }
              disabled={!serviceStartId}
              className="btn btn-primary"
              style={{
                padding: "0.75rem",
                fontSize: "0.9rem",
                justifyContent: "center",
                marginTop: "0.25rem",
                background: "#242014",
                borderColor: "rgba(245, 158, 11, 0.4)",
                color: "var(--status-warning)",
                opacity: !serviceStartId ? 0.5 : 1,
                cursor: !serviceStartId ? "not-allowed" : "pointer",
              }}
            >
              <LuPlay /> Start Service Session
            </button>
          </div>
        </div>

        {/* Complete Service Form */}
        <div
          className="card-base"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuCheck style={{ color: "var(--status-success)" }} /> Certify Service Completion
            </h3>
            <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
              Log permanent maintenance record hashes, increment repair counter, and restore previous operational status.
            </p>
          </div>

          <div
            style={{
              padding: "0.65rem 0.85rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.775rem",
              color: "var(--text-secondary)",
              lineHeight: 1.45,
            }}
          >
            <strong>Certified Maintenance Record:</strong> Service notes are permanently sealed into the blockchain product history ledger.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label htmlFor="sc-complete-passport-id" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                Passport ID
              </label>
              <input
                id="sc-complete-passport-id"
                name="completePassportId"
                type="number"
                placeholder="Passport ID (e.g. 1)"
                value={serviceCompleteId}
                onChange={(e) => setServiceCompleteId(e.target.value)}
                autoComplete="off"
                className="input-base"
                style={{ width: "100%", fontSize: "0.85rem" }}
              />
            </div>

            <div>
              <label htmlFor="sc-repair-notes" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                Certified Service / Repair Notes
              </label>
              <textarea
                id="sc-repair-notes"
                name="repairNotes"
                placeholder="Detailed maintenance notes (e.g. Ultrasonic cleaning, gasket replacement, timing regulation within specs, waterproof pressure testing passed.)"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={3}
                className="input-base"
                style={{
                  width: "100%",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.85rem",
                  resize: "vertical",
                  minHeight: "80px",
                }}
              />
            </div>

            <button
              onClick={() =>
                tx.execute(async (cb) => {
                  const res = await PassportService.completeService(BigInt(serviceCompleteId), serviceDescription, cb);
                  fetchServiceData();
                  return res;
                })
              }
              disabled={!serviceCompleteId || !serviceDescription}
              className="btn btn-primary"
              style={{
                padding: "0.75rem",
                fontSize: "0.9rem",
                justifyContent: "center",
                marginTop: "0.25rem",
                background: "#162e26",
                borderColor: "rgba(16, 185, 129, 0.4)",
                color: "var(--status-success)",
                opacity: !serviceCompleteId || !serviceDescription ? 0.5 : 1,
                cursor: !serviceCompleteId || !serviceDescription ? "not-allowed" : "pointer",
              }}
            >
              <LuCheck /> Complete & Certify Repair
            </button>
          </div>
        </div>
      </div>

      {/* Active Service Jobs Section */}
      <div
        className="card-base"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LuClock style={{ color: "var(--status-warning)", fontSize: "1.2rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
              Active Service Queue ({activeServiceJobs.length})
            </h3>
          </div>

          <button
            onClick={fetchServiceData}
            disabled={loadingProducts}
            className="btn btn-secondary"
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
            }}
          >
            <LuRefreshCw className={loadingProducts ? "animate-spin" : ""} /> Refresh Queue
          </button>
        </div>

        {loadingProducts ? (
          <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-secondary)" }}>
            <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "1.75rem", color: "var(--accent-primary)", marginBottom: "0.5rem" }} />
            <div>Loading service queue from blockchain...</div>
          </div>
        ) : activeServiceJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>
            No products currently under active service on-chain.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <th style={{ padding: "0.85rem 0.75rem" }}>DPP ID</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Product Name</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Servicing Center</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Status</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Repairs Logged</th>
                  <th style={{ padding: "0.85rem 0.75rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeServiceJobs.map((p) => (
                  <tr
                    key={p.passportId.toString()}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.85rem 0.75rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-primary)" }}>
                      <div>{p.dppId || `#${p.passportId.toString()}`}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>Passport #{p.passportId.toString()}</div>
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", fontWeight: 600, color: "#ffffff" }}>
                      {p.productName}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {truncate(p.currentServiceCenter)}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem" }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", color: "var(--text-secondary)" }}>
                      {p.repairCount.toString()} repairs
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => {
                            setServiceCompleteId(p.passportId.toString());
                          }}
                          className="btn btn-primary"
                          style={{
                            padding: "0.3rem 0.65rem",
                            fontSize: "0.75rem",
                            background: "#162e26",
                            borderColor: "rgba(16, 185, 129, 0.4)",
                            color: "var(--status-success)",
                          }}
                        >
                          Complete
                        </button>
                        <Link
                          to={`/verify/${p.dppId || p.passportId.toString()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{
                            padding: "0.3rem 0.55rem",
                            fontSize: "0.75rem",
                            textDecoration: "none",
                          }}
                        >
                          Verify <LuExternalLink />
                        </Link>
                      </div>
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
        className="card-base"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LuLayers style={{ color: "var(--status-success)", fontSize: "1.2rem" }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Completed Service Records ({completedServiceJobs.length})
          </h3>
        </div>

        {completedServiceJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>
            No past completed repairs recorded yet on the blockchain.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <th style={{ padding: "0.85rem 0.75rem" }}>DPP ID</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Product Name</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Last Repair Date</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Total Repairs</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Status</th>
                  <th style={{ padding: "0.85rem 0.75rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {completedServiceJobs.map((p) => (
                  <tr
                    key={p.passportId.toString()}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.85rem 0.75rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-primary)" }}>
                      <div>{p.dppId || `#${p.passportId.toString()}`}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>Passport #{p.passportId.toString()}</div>
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", fontWeight: 600, color: "#ffffff" }}>
                      {p.productName}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", color: "var(--text-secondary)" }}>
                      {formatDate(p.lastRepairTimestamp)}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", color: "var(--text-secondary)" }}>
                      {p.repairCount.toString()} repairs
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem" }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", textAlign: "right" }}>
                      <Link
                        to={`/verify/${p.dppId || p.passportId.toString()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{
                          padding: "0.3rem 0.55rem",
                          fontSize: "0.75rem",
                          textDecoration: "none",
                        }}
                      >
                        Verify <LuExternalLink />
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
