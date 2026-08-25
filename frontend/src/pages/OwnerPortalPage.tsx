import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTransaction } from "../hooks/useTransaction";
import { useAuth } from "../hooks/useAuth";
import { PassportService } from "../services/passportService";
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
} from "react-icons/lu";

export const OwnerPortalPage: React.FC = () => {
  const tx = useTransaction();
  const { session, refreshRoles } = useAuth();
  const account = session?.account || "";

  // Owned Products & Incoming Transfers State
  const [ownedProducts, setOwnedProducts] = useState<Product[]>([]);
  const [incomingTransfers, setIncomingTransfers] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Transfer Input State for active modal/dialog
  const [transferModalProduct, setTransferModalProduct] = useState<Product | null>(null);
  const [transferRecipient, setTransferRecipient] = useState<string>("");

  // QR Modal State
  const [selectedQrProduct, setSelectedQrProduct] = useState<Product | null>(null);

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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "var(--status-success)",
                fontSize: "20px",
              }}
            >
              <LuUser />
            </div>
            <div>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
                Product Owner Portal
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Manage your physical assets, custody transfers, anti-theft flags, and client-side QR codes.
              </p>
            </div>
          </div>

          <button
            onClick={fetchProducts}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.5rem 0.9rem",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <LuRefreshCw className={loading ? "animate-spin" : ""} /> Refresh Assets
          </button>
        </div>
      </div>

      {/* Incoming Ownership Transfers Section */}
      {incomingTransfers.length > 0 && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: "var(--radius-lg, 16px)",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <LuInbox style={{ color: "var(--status-warning)", fontSize: "1.3rem" }} />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Incoming Ownership Transfers ({incomingTransfers.length})
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.25rem" }}>
            {incomingTransfers.map((product) => (
              <div
                key={`incoming-${product.passportId.toString()}`}
                style={{
                  background: "var(--bg-secondary, #111827)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  borderRadius: "var(--radius-md, 12px)",
                  padding: "1.5rem",
                  boxShadow: "var(--shadow-md)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1.25rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        color: "var(--status-warning)",
                        background: "rgba(245, 158, 11, 0.15)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      Passport #{product.passportId.toString()}
                    </span>

                    <WarrantyBadge warranty={product.warranty} />
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                    {product.productName}
                  </h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                    {product.brand} · {product.category} · Model {product.modelNumber}
                  </div>

                  <div
                    style={{
                      background: "var(--bg-card)",
                      padding: "0.85rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "0.8rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Manufacturer</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {truncate(product.manufacturer)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Pending From</span>
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
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    width: "100%",
                    padding: "0.75rem",
                    background: "var(--status-success, #10b981)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <LuCheck /> Accept Transfer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Owned Products Section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <LuLayers style={{ color: "var(--status-success)", fontSize: "1.2rem" }} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Owned Product Passports ({ownedProducts.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
            <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "2rem", marginBottom: "0.75rem" }} />
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
            style={{
              padding: "2rem",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            You currently hold no accepted products. Review your incoming transfers above.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
            {ownedProducts.map((product) => {
              const isStolen = product.status === ProductStatus.ReportedStolen;
              const hasTransferPending = product.pendingTransfer.exists;

              return (
                <div
                  key={product.passportId.toString()}
                  style={{
                    background: "var(--bg-secondary, #111827)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg, 16px)",
                    padding: "1.75rem",
                    boxShadow: "var(--shadow-md)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    {/* Header: ID & Status Badges */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          color: "var(--accent-primary)",
                          background: "rgba(99, 102, 241, 0.12)",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        Passport #{product.passportId.toString()}
                      </span>

                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <StatusBadge status={product.status} />
                        <WarrantyBadge warranty={product.warranty} />
                      </div>
                    </div>

                    {/* Product Title & Model */}
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                      {product.productName}
                    </h3>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                      {product.brand} · {product.category} · Model {product.modelNumber}
                    </div>

                    {/* Specifications Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.6rem",
                        background: "var(--bg-card)",
                        padding: "0.85rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "0.8rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Serial Number</div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                          {product.serialNumber}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Manufactured</div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {formatDate(product.manufactureDate)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Repairs Completed</div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {product.repairCount.toString()} repairs
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Manufacturer</div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                          {truncate(product.manufacturer)}
                        </div>
                      </div>
                    </div>

                    {/* Pending Transfer Notice if Active */}
                    {hasTransferPending && (
                      <div
                        style={{
                          padding: "0.75rem",
                          background: "rgba(245, 158, 11, 0.12)",
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
                            background: "rgba(239, 68, 68, 0.2)",
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
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.3rem",
                            padding: "0.6rem",
                            background: "var(--accent-primary)",
                            color: "#ffffff",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: isStolen ? "not-allowed" : "pointer",
                            opacity: isStolen ? 0.5 : 1,
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
                            padding: "0.6rem",
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "var(--status-warning)",
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
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.3rem",
                            padding: "0.6rem",
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "var(--status-danger)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
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
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.3rem",
                            padding: "0.6rem",
                            background: "rgba(59, 130, 246, 0.15)",
                            color: "var(--status-info)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
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
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.3rem",
                          padding: "0.55rem",
                          background: "var(--bg-card)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <LuQrCode /> QR Code
                      </button>

                      {/* Public Verification Link */}
                      <Link
                        to={`/verify/${product.passportId.toString()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.3rem",
                          padding: "0.55rem",
                          background: "var(--bg-card)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
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
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "2rem",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Initiate Ownership Transfer
              </h3>
              <button
                onClick={() => setTransferModalProduct(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                <LuX />
              </button>
            </div>

            <label htmlFor="owner-transfer-recipient" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
              Recipient Wallet Address
            </label>
            <input
              id="owner-transfer-recipient"
              name="transferRecipient"
              type="text"
              placeholder="Recipient Address (0x...)"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              autoComplete="off"
              style={{ width: "100%", padding: "0.75rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
            />

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setTransferModalProduct(null)}
                style={{ flex: 1, padding: "0.75rem", background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer" }}
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
                style={{ flex: 1, padding: "0.75rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: !transferRecipient ? "not-allowed" : "pointer" }}
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
