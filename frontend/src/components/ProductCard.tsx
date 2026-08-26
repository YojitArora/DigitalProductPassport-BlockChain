import React, { useState } from "react";
import { Product } from "../types";
import StatusBadge from "./StatusBadge";
import WarrantyBadge from "./WarrantyBadge";
import RepairSummary from "./RepairSummary";
import TransferStatus from "./TransferStatus";
import QRCodeModal from "./QRCodeModal";
import { formatDate } from "../utils/dateUtils";
import { isProductInInventory } from "../utils/productUtils";
import {
  LuQrCode,
  LuExternalLink,
  LuCopy,
  LuCheck,
  LuCalendar,
  LuTag,
  LuLayers,
  LuWarehouse,
  LuShieldCheck,
  LuCpu,
} from "react-icons/lu";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showActions = true,
}) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [copiedOwner, setCopiedOwner] = useState<boolean>(false);
  const [copiedMfg, setCopiedMfg] = useState<boolean>(false);

  const isInventory = isProductInInventory(product);
  const passportIdStr = product.passportId.toString();
  const manufactureDate = formatDate(product.manufactureDate);
  const createdDate = formatDate(product.createdAt);

  const truncate = (addr: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "None";

  const handleCopyOwner = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.currentOwner);
    setCopiedOwner(true);
    setTimeout(() => setCopiedOwner(false), 2000);
  };

  const handleCopyMfg = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.manufacturer);
    setCopiedMfg(true);
    setTimeout(() => setCopiedMfg(false), 2000);
  };

  return (
    <>
      <div
        className="card-base"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle top ambient accent line (Restrained Slate Tone) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #5F789D 0%, #7187A8 50%, #8298B8 100%)",
          }}
        />

        {/* Header: DPP ID & Status Badges */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            {/* Identity Badge Strip */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <span className="text-dpp-id" style={{ fontSize: "0.9rem" }}>
                {product.dppId || `#${passportIdStr}`}
              </span>

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  background: "rgba(255, 255, 255, 0.04)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
                title="Internal Blockchain Passport Index"
              >
                Passport #{passportIdStr}
              </span>

              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <StatusBadge status={product.status} isInventory={isInventory} />
                <WarrantyBadge warranty={product.warranty} />
              </div>
            </div>

            <h2
              className="text-card-title"
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "0.2rem",
                color: "#ffffff",
              }}
            >
              {product.productName}
            </h2>

            <div style={{ color: "var(--accent-primary)", fontSize: "0.95rem", fontWeight: 600 }}>
              {product.brand}
            </div>
          </div>

          {/* QR Code Quick Action */}
          {showActions && (
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="btn btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.5rem 0.95rem",
                fontSize: "0.85rem",
              }}
              title="View & Export Verification QR Code"
            >
              <LuQrCode style={{ fontSize: "1.05rem", color: "var(--accent-primary)" }} />
              <span>Scan / QR Code</span>
            </button>
          )}
        </div>

        {/* Specifications Technical Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            padding: "1.15rem 1.25rem",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div className="text-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
              <LuTag /> Serial Number
            </div>
            <div className="text-address" style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              {product.serialNumber}
            </div>
          </div>

          <div>
            <div className="text-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
              <LuLayers /> Model Number
            </div>
            <div className="text-address" style={{ color: "var(--text-primary)" }}>
              {product.modelNumber}
            </div>
          </div>

          <div>
            <div className="text-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
              <LuCalendar /> Manufactured
            </div>
            <div style={{ color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: 500 }}>
              {manufactureDate}
            </div>
          </div>

          <div>
            <div className="text-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
              <LuCpu /> Category
            </div>
            <div style={{ color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: 600 }}>
              {product.category}
            </div>
          </div>
        </div>

        {/* Ownership & Provenance Line */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            background: "var(--bg-card)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            fontSize: "0.85rem",
          }}
        >
          {/* Manufacturer & Registration Date */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Manufacturer:</span>
              <span className="text-address">{truncate(product.manufacturer)}</span>
              <button
                onClick={handleCopyMfg}
                title="Copy Manufacturer Address"
                style={{
                  color: copiedMfg ? "var(--status-success)" : "var(--text-muted)",
                  fontSize: "0.95rem",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.15rem",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {copiedMfg ? <LuCheck /> : <LuCopy />}
              </button>
            </div>

            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Registered On-Chain: {createdDate}
            </div>
          </div>

          {/* Current Custody / Owner */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.6rem" }}>
            {isInventory ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Current Custody:</span>
                <span
                  style={{
                    color: "var(--accent-primary)",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    background: "var(--accent-primary-tint)",
                    border: "1px solid var(--border-active)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8rem",
                  }}
                >
                  <LuWarehouse /> Manufacturer Inventory (Unsold)
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Current Owner:</span>
                <span className="text-address">{truncate(product.currentOwner)}</span>
                <button
                  onClick={handleCopyOwner}
                  title="Copy Owner Address"
                  style={{
                    color: copiedOwner ? "var(--status-success)" : "var(--text-muted)",
                    fontSize: "0.95rem",
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.15rem",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {copiedOwner ? <LuCheck /> : <LuCopy />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pending Transfer Alert if active */}
        <TransferStatus pendingTransfer={product.pendingTransfer} />

        {/* Repair Summary */}
        <RepairSummary
          repairCount={product.repairCount}
          lastRepairTimestamp={product.lastRepairTimestamp}
          isUnderService={product.status === 1}
        />

        {/* Footer Actions */}
        {showActions && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--status-success)", fontSize: "0.825rem", fontWeight: 600 }}>
              <LuShieldCheck /> Cryptographically Signed On-Chain Asset
            </div>

            <Link
              to={`/verify/${product.dppId || passportIdStr}`}
              className="btn btn-ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.85rem",
                color: "var(--accent-primary)",
                fontWeight: 600,
              }}
            >
              Public Certificate View <LuExternalLink />
            </Link>
          </div>
        )}
      </div>

      <QRCodeModal
        passportId={product.passportId}
        dppId={product.dppId}
        productName={product.productName}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </>
  );
};

export default ProductCard;
