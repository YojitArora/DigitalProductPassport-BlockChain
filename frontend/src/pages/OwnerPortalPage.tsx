import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTransaction } from "../hooks/useTransaction";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { PassportService } from "../services/passportService";
import { SUPPORTED_NETWORKS } from "../services/provider";
import { Product, ProductStatus } from "../types";
import TransactionModal from "../components/TransactionModal";
import QRCodeModal from "../components/QRCodeModal";
import StatusBadge from "../components/StatusBadge";
import WarrantyBadge from "../components/WarrantyBadge";
import EmptyState from "../components/EmptyState";
import { formatDate } from "../utils/dateUtils";
import {
  LuUser,
  LuArrowLeft,
  LuArrowRightLeft,
  LuShieldAlert,
  LuRotateCcw,
  LuQrCode,
  LuExternalLink,
  LuRefreshCw,
  LuLoader,
  LuLayers,
  LuX,
  LuPackageSearch,
  LuInbox,
  LuCheck,
  LuCopy,
} from "react-icons/lu";

export const OwnerPortalPage: React.FC = () => {
  const tx = useTransaction();
  const { session, refreshRoles } = useAuth();
  const { chainId } = useWallet();
  const account = session?.account || "";

  // Owned Products & Incoming Transfers State
  const [ownedProducts, setOwnedProducts] = useState<Product[]>([]);
  const [incomingTransfers, setIncomingTransfers] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);

  // Transfer Input State for active modal/dialog
  const [transferModalProduct, setTransferModalProduct] = useState<Product | null>(null);
  const [transferRecipient, setTransferRecipient] = useState<string>("");

  // QR Modal State
  const [selectedQrProduct, setSelectedQrProduct] = useState<Product | null>(null);

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ${chainId}`
    : "Ganache Local (1337)";

  const fetchProducts = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const [ownedList, incomingList] = await Promise.all([
        PassportService.getProductsByOwner(account),
        PassportService.getPendingIncomingTransfers(account),
      ]);

      // Unsold factory inventory is managed in the Manufacturer Portal and excluded from customer Owner Portal
      const customerOwned = ownedList.filter(
        (p) => p.manufacturer.toLowerCase() !== account.toLowerCase()
      );
      setOwnedProducts(customerOwned);
      setIncomingTransfers(incomingList);
      refreshRoles();
    } catch (err) {
      console.warn("Failed to fetch owner products:", err);
    } finally {
      setLoading(false);
    }
  }, [account, refreshRoles]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAcceptTransfer = (passportId: bigint) => {
    tx.execute(async (cb) => {
      const res = await PassportService.acceptTransfer(passportId, cb);
      await fetchProducts();
      return res;
    });
  };

  const handleCopyWallet = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

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
          <div style={{ maxWidth: "560px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.65rem",
                background: "var(--bg-card)",
                border: "1px solid rgba(113, 135, 168, 0.3)",
                color: "var(--accent-primary)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              <LuUser /> TraceLedger Owner Portal
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
              My Products
            </h1>

            <p className="text-secondary" style={{ fontSize: "0.925rem", lineHeight: 1.55 }}>
              Your verified Digital Product Passports, blockchain asset custody records, and anti-theft security controls.
            </p>
          </div>

          {/* Owner Identity & Refresh Action */}
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
                  Owner Identity
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
              onClick={fetchProducts}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                width: "100%",
                padding: "0.45rem 0.85rem",
                fontSize: "0.825rem",
                justifyContent: "center",
              }}
            >
              <LuRefreshCw className={loading ? "animate-spin" : ""} /> Refresh Ownership State
            </button>
          </div>
        </div>
      </div>

      {/* Incoming Ownership Transfers Section */}
      {incomingTransfers.length > 0 && (
        <div
          className="card-base"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <LuInbox style={{ color: "var(--status-warning)", fontSize: "1.25rem" }} />
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                Pending Incoming Transfers ({incomingTransfers.length})
              </h2>
            </div>
            <div style={{ fontSize: "0.785rem", color: "var(--status-warning)", fontWeight: 500 }}>
              Action Required: Review and accept custody on-chain
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
            {incomingTransfers.map((product) => (
              <div
                key={`incoming-${product.passportId.toString()}`}
                className="card-base"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1.25rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          fontSize: "0.825rem",
                          color: "var(--status-warning)",
                          background: "rgba(245, 158, 11, 0.12)",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "var(--radius-sm)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {product.dppId || `Passport #${product.passportId.toString()}`}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          background: "var(--bg-secondary)",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        #{product.passportId.toString()}
                      </span>
                    </div>

                    <WarrantyBadge warranty={product.warranty} />
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.25rem" }}>
                    {product.productName}
                  </h3>
                  <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                    {product.brand} · {product.category} · Model {product.modelNumber}
                  </div>

                  <div
                    style={{
                      background: "var(--bg-secondary)",
                      padding: "0.85rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "0.8rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.45rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Manufacturer</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {truncate(product.manufacturer)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Sender / Current Owner</span>
                      <span style={{ fontWeight: 600, color: "var(--status-warning)", fontFamily: "var(--font-mono)" }}>
                        {truncate(product.currentOwner)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Serial Number</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {product.serialNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id={`accept-transfer-btn-${product.passportId.toString()}`}
                  name={`acceptTransfer-${product.passportId.toString()}`}
                  onClick={() => handleAcceptTransfer(product.passportId)}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    justifyContent: "center",
                    background: "#162e26",
                    borderColor: "rgba(16, 185, 129, 0.4)",
                    color: "var(--status-success)",
                  }}
                >
                  <LuCheck /> Accept Ownership Transfer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Owned Products Section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LuLayers style={{ color: "var(--accent-primary)", fontSize: "1.2rem" }} />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
              Owned Product Passports ({ownedProducts.length})
            </h2>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Cryptographically registered to your connected wallet
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3.5rem", color: "var(--text-secondary)" }}>
            <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "2rem", color: "var(--accent-primary)", marginBottom: "0.75rem" }} />
            <div>Loading verified product passports from blockchain...</div>
          </div>
        ) : ownedProducts.length === 0 && incomingTransfers.length === 0 ? (
          <EmptyState
            icon={<LuPackageSearch />}
            title="No Product Passports Owned"
            description={`Wallet ${truncate(account)} does not currently hold ownership of any product passports on the blockchain.`}
          />
        ) : ownedProducts.length === 0 ? (
          <div
            className="card-base"
            style={{
              padding: "2.5rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            You currently hold no accepted products. Review your pending incoming transfers above.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
            {ownedProducts.map((product) => {
              const isStolen = product.status === ProductStatus.ReportedStolen;
              const hasTransferPending = product.pendingTransfer.exists;

              return (
                <div
                  key={product.passportId.toString()}
                  className="card-base"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.75rem",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "1.25rem",
                    transition: "border-color 0.2s ease, transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(113, 135, 168, 0.45)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div>
                    {/* Header: DPP ID & Status Badges */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "var(--accent-primary)",
                            background: "rgba(113, 135, 168, 0.12)",
                            border: "1px solid rgba(113, 135, 168, 0.3)",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          {product.dppId || `Passport #${product.passportId.toString()}`}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            background: "var(--bg-secondary)",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          #{product.passportId.toString()}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <StatusBadge status={product.status} />
                        <WarrantyBadge warranty={product.warranty} />
                      </div>
                    </div>

                    {/* Product Title & Model */}
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.25rem" }}>
                      {product.productName}
                    </h3>
                    <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                      {product.brand} · {product.category} · Model {product.modelNumber}
                    </div>

                    {/* Specifications Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.65rem",
                        background: "var(--bg-secondary)",
                        padding: "0.85rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "0.8rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.725rem", textTransform: "uppercase", fontWeight: 600 }}>
                          Serial Number
                        </div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)", marginTop: "0.15rem" }}>
                          {product.serialNumber}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.725rem", textTransform: "uppercase", fontWeight: 600 }}>
                          Manufactured
                        </div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "0.15rem" }}>
                          {formatDate(product.manufactureDate)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.725rem", textTransform: "uppercase", fontWeight: 600 }}>
                          Repairs Logged
                        </div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "0.15rem" }}>
                          {product.repairCount.toString()} repairs
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.725rem", textTransform: "uppercase", fontWeight: 600 }}>
                          Manufacturer
                        </div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)", marginTop: "0.15rem" }}>
                          {truncate(product.manufacturer)}
                        </div>
                      </div>
                    </div>

                    {/* Pending Outgoing Transfer Notice */}
                    {hasTransferPending && (
                      <div
                        style={{
                          padding: "0.75rem",
                          background: "var(--status-warning-tint)",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.8rem",
                          color: "var(--status-warning)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "1rem",
                        }}
                      >
                        <div>
                          <strong>Transfer Pending:</strong> to {truncate(product.pendingTransfer.to)}
                        </div>
                        <button
                          onClick={() =>
                            tx.execute(async (cb) => {
                              const res = await PassportService.cancelTransfer(product.passportId, cb);
                              fetchProducts();
                              return res;
                            })
                          }
                          style={{
                            padding: "0.25rem 0.6rem",
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "var(--status-danger)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Asset Quick Action Controls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {/* Initiate Transfer or Pending Button */}
                      {!hasTransferPending ? (
                        <button
                          onClick={() => {
                            setTransferModalProduct(product);
                            setTransferRecipient("");
                          }}
                          disabled={isStolen}
                          className="btn btn-primary"
                          style={{
                            padding: "0.55rem",
                            fontSize: "0.8rem",
                            justifyContent: "center",
                            opacity: isStolen ? 0.45 : 1,
                            cursor: isStolen ? "not-allowed" : "pointer",
                          }}
                        >
                          <LuArrowRightLeft /> Transfer Custody
                        </button>
                      ) : (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0.55rem",
                            background: "var(--status-warning-tint)",
                            color: "var(--status-warning)",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          Transfer Active
                        </div>
                      )}

                      {/* Theft Protection Action */}
                      {!isStolen ? (
                        <button
                          onClick={() =>
                            tx.execute(async (cb) => {
                              const res = await PassportService.reportStolen(product.passportId, cb);
                              fetchProducts();
                              return res;
                            })
                          }
                          className="btn btn-danger"
                          style={{
                            padding: "0.55rem",
                            fontSize: "0.8rem",
                            justifyContent: "center",
                          }}
                        >
                          <LuShieldAlert /> Report Stolen
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            tx.execute(async (cb) => {
                              const res = await PassportService.reportRecovered(product.passportId, cb);
                              fetchProducts();
                              return res;
                            })
                          }
                          className="btn"
                          style={{
                            padding: "0.55rem",
                            fontSize: "0.8rem",
                            justifyContent: "center",
                            background: "#122a22",
                            borderColor: "rgba(16, 185, 129, 0.4)",
                            color: "var(--status-success)",
                          }}
                        >
                          <LuRotateCcw /> Mark Recovered
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {/* QR Code Trigger */}
                      <button
                        onClick={() => setSelectedQrProduct(product)}
                        className="btn btn-secondary"
                        style={{
                          padding: "0.5rem",
                          fontSize: "0.8rem",
                          justifyContent: "center",
                        }}
                      >
                        <LuQrCode /> QR Code
                      </button>

                      {/* Public Verification Link */}
                      <Link
                        to={`/verify/${product.dppId || product.passportId.toString()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{
                          padding: "0.5rem",
                          fontSize: "0.8rem",
                          justifyContent: "center",
                          textDecoration: "none",
                        }}
                      >
                        Inspect <LuExternalLink />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transfer Recipient Modal Dialog */}
      {transferModalProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            className="card-base"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              padding: "2rem",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "var(--shadow-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff" }}>
                Initiate Ownership Transfer
              </h3>
              <button
                onClick={() => setTransferModalProduct(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}
              >
                <LuX />
              </button>
            </div>

            <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
              Enter the recipient's Ethereum wallet address. The recipient must accept the transfer before on-chain custody updates.
            </p>

            <div>
              <label htmlFor="owner-transfer-recipient" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                Recipient Wallet Address
              </label>
              <input
                id="owner-transfer-recipient"
                name="transferRecipient"
                type="text"
                placeholder="0x..."
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                autoComplete="off"
                className="input-base"
                style={{
                  width: "100%",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => setTransferModalProduct(null)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const pid = transferModalProduct.passportId;
                  const rec = transferRecipient;
                  setTransferModalProduct(null);
                  tx.execute(async (cb) => {
                    const res = await PassportService.initiateTransfer(pid, rec, cb);
                    fetchProducts();
                    return res;
                  });
                }}
                disabled={!transferRecipient}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center", opacity: !transferRecipient ? 0.5 : 1, cursor: !transferRecipient ? "not-allowed" : "pointer" }}
              >
                Submit Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQrProduct && (
        <QRCodeModal
          passportId={selectedQrProduct.passportId}
          dppId={selectedQrProduct.dppId}
          productName={selectedQrProduct.productName}
          isOpen={Boolean(selectedQrProduct)}
          onClose={() => setSelectedQrProduct(null)}
        />
      )}

      <TransactionModal state={tx.state} onClose={tx.reset} />
    </div>
  );
};

export default OwnerPortalPage;
