import React, { useState } from "react";
import { Product } from "../types";
import StatusBadge from "./StatusBadge";
import WarrantyBadge from "./WarrantyBadge";
import RepairSummary from "./RepairSummary";
import TransferStatus from "./TransferStatus";
import QRCodeModal from "./QRCodeModal";
import {
  LuQrCode,
  LuExternalLink,
  LuCopy,
  LuCheck,
  LuCalendar,
  LuTag,
  LuLayers,
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

  const passportIdStr = product.passportId.toString();
  const manufactureDate = new Date(Number(product.manufactureDate) * 1000).toLocaleDateString();
  const createdDate = new Date(Number(product.createdAt) * 1000).toLocaleDateString();

  const truncate = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  const handleCopyOwner = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.currentOwner);
    setCopiedOwner(true);
    setTimeout(() => setCopiedOwner(false), 2000);
  };

  return (
    <>
      <div
        style={{
          background: "var(--bg-secondary, #111827)",
          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "1.75rem",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          transition: "border-color 0.2s ease, transform 0.2s ease",
        }}
      >
        {/* Header: Title & Badges */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  color: "var(--accent-secondary, #06b6d4)",
                  background: "rgba(6, 182, 212, 0.1)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 600,
                }}
              >
                #{passportIdStr}
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {product.brand}
              </span>
            </div>

            <h3
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "var(--text-primary, #f9fafb)",
                letterSpacing: "-0.01em",
              }}
            >
              {product.productName}
            </h3>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <StatusBadge status={product.status} />
            <WarrantyBadge warranty={product.warranty} />
          </div>
        </div>

        {/* Product Spec Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.75rem",
            padding: "1rem",
            background: "var(--bg-card, #1f2937)",
            borderRadius: "var(--radius-md, 10px)",
            border: "1px solid var(--border-subtle)",
            fontSize: "0.825rem",
          }}
        >
          <div>
            <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <LuTag /> Serial Number
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
              {product.serialNumber}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <LuLayers /> Model Number
            </div>
            <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              {product.modelNumber}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <LuCalendar /> Manufactured
            </div>
            <div style={{ color: "var(--text-primary)" }}>{manufactureDate}</div>
          </div>

          <div>
            <div style={{ color: "var(--text-muted)" }}>Category</div>
            <div style={{ color: "var(--text-primary)" }}>{product.category}</div>
          </div>
        </div>

        {/* Ownership & Provenance Line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            fontSize: "0.825rem",
            padding: "0.25rem 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Current Owner:</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 500 }}>
              {truncate(product.currentOwner)}
            </span>
            <button
              onClick={handleCopyOwner}
              title="Copy Owner Address"
              style={{
                color: copiedOwner ? "var(--status-success)" : "var(--text-muted)",
                fontSize: "0.9rem",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {copiedOwner ? <LuCheck /> : <LuCopy />}
            </button>
          </div>

          <div style={{ color: "var(--text-muted)", fontSize: "0.775rem" }}>
            Registered: {createdDate}
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
              gap: "0.75rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={() => setIsQRModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.85rem",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              <LuQrCode /> Show QR Code
            </button>

            <Link
              to={`/verify/${passportIdStr}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--accent-primary)",
              }}
            >
              Public Verify <LuExternalLink />
            </Link>
          </div>
        )}
      </div>

      <QRCodeModal
        passportId={product.passportId}
        productName={product.productName}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </>
  );
};

export default ProductCard;
