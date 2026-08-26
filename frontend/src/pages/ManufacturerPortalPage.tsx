import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTransaction } from "../hooks/useTransaction";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { PassportService } from "../services/passportService";
import { SUPPORTED_NETWORKS } from "../services/provider";
import { Product } from "../types";
import TransactionModal from "../components/TransactionModal";
import StatusBadge from "../components/StatusBadge";
import WarrantyBadge from "../components/WarrantyBadge";
import { isProductInInventory } from "../utils/productUtils";
import {
  LuFactory,
  LuArrowLeft,
  LuPlus,
  LuShieldCheck,
  LuLayers,
  LuExternalLink,
  LuRefreshCw,
  LuLoader,
  LuWarehouse,
  LuArrowRightLeft,
  LuX,
  LuBoxes,
  LuShoppingBag,
  LuCheck,
  LuCopy,
} from "react-icons/lu";

export const ManufacturerPortalPage: React.FC = () => {
  const tx = useTransaction();
  const { session } = useAuth();
  const { chainId } = useWallet();
  const account = session?.account || "";

  // Registered Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "inventory" | "sold">("all");
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);

  // Transfer Modal State for Inventory Items
  const [transferModalProduct, setTransferModalProduct] = useState<Product | null>(null);
  const [transferRecipient, setTransferRecipient] = useState<string>("");

  // Manufacturer Mint Form
  const [mintForm, setMintForm] = useState({
    initialOwner: "",
    keepInInventory: true,
    productName: "",
    brand: "",
    category: "",
    modelNumber: "",
    serialNumber: "",
    manufactureDate: "",
  });

  // Warranty Activation Form
  const [warrantyForm, setWarrantyForm] = useState({
    passportId: "",
    durationDays: "365",
  });

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ${chainId}`
    : "Ganache Local (1337)";

  const fetchRegisteredProducts = useCallback(async () => {
    if (!account) return;
    setLoadingProducts(true);
    try {
      const list = await PassportService.getProductsByManufacturer(account);
      setProducts(list);
    } catch (err) {
      console.warn("Failed to fetch manufacturer registered products:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [account]);

  useEffect(() => {
    fetchRegisteredProducts();
  }, [fetchRegisteredProducts]);

  const handleCopyWallet = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const truncate = (addr: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "None";

  // Filtered product lists
  const inventoryProducts = products.filter((p) => isProductInInventory(p));
  const soldProducts = products.filter((p) => !isProductInInventory(p));

  const displayedProducts =
    activeTab === "inventory"
      ? inventoryProducts
      : activeTab === "sold"
      ? soldProducts
      : products;

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
              <LuFactory /> TraceLedger Manufacturer Console
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
              Manufacturer Portal
            </h1>

            <p className="text-secondary" style={{ fontSize: "0.925rem", lineHeight: 1.55 }}>
              Mint immutable Digital Product Passports, manage factory inventory, activate certified warranties, and initiate customer sales.
            </p>
          </div>

          {/* Manufacturer Identity & Refresh Action */}
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
                  Manufacturer Identity
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
              onClick={fetchRegisteredProducts}
              disabled={loadingProducts}
              className="btn btn-secondary"
              style={{
                width: "100%",
                padding: "0.45rem 0.85rem",
                fontSize: "0.825rem",
                justifyContent: "center",
              }}
            >
              <LuRefreshCw className={loadingProducts ? "animate-spin" : ""} /> Refresh Catalog State
            </button>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.75rem" }}>
        {/* Mint Product Passport Form */}
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
              <LuPlus style={{ color: "var(--accent-primary)" }} /> Create Digital Product Passport
            </h3>
            <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
              Mint an immutable Digital Product Passport on-chain for customer goods or factory inventory.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const mDate = Math.floor(new Date(mintForm.manufactureDate || Date.now()).getTime() / 1000);

              tx.execute(async (cb) => {
                const res = await PassportService.registerProduct(
                  {
                    initialOwner: mintForm.initialOwner,
                    keepInInventory: mintForm.keepInInventory,
                    productName: mintForm.productName,
                    brand: mintForm.brand,
                    category: mintForm.category,
                    modelNumber: mintForm.modelNumber,
                    serialNumber: mintForm.serialNumber,
                    manufactureDate: mDate,
                  },
                  cb
                );
                // Reset form
                setMintForm({
                  initialOwner: "",
                  keepInInventory: true,
                  productName: "",
                  brand: "",
                  category: "",
                  modelNumber: "",
                  serialNumber: "",
                  manufactureDate: "",
                });
                fetchRegisteredProducts();
                return res;
              });
            }}
            style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
          >
            {/* Inventory / Initial Owner Control */}
            <div
              style={{
                background: "var(--bg-card)",
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <label
                htmlFor="mfg-keep-in-inventory"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#ffffff",
                  userSelect: "none",
                }}
              >
                <input
                  id="mfg-keep-in-inventory"
                  name="keepInInventory"
                  type="checkbox"
                  checked={mintForm.keepInInventory}
                  onChange={(e) =>
                    setMintForm({
                      ...mintForm,
                      keepInInventory: e.target.checked,
                      initialOwner: e.target.checked ? "" : mintForm.initialOwner,
                    })
                  }
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent-primary)" }}
                />
                <span>Keep Product in Manufacturer Inventory</span>
              </label>

              {mintForm.keepInInventory ? (
                <div
                  style={{
                    fontSize: "0.775rem",
                    color: "var(--accent-primary)",
                    background: "rgba(113, 135, 168, 0.1)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(113, 135, 168, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    lineHeight: 1.45,
                  }}
                >
                  <LuWarehouse style={{ fontSize: "1.1rem", flexShrink: 0 }} />
                  <div>
                    Manufacturer holds product custody until first sale. Item appears in <strong>Manufacturer Inventory</strong>.
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="mfg-initial-owner" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                    Initial Customer Owner Address (Required)
                  </label>
                  <input
                    id="mfg-initial-owner"
                    name="initialOwner"
                    type="text"
                    required={!mintForm.keepInInventory}
                    placeholder="0x..."
                    value={mintForm.initialOwner}
                    onChange={(e) => setMintForm({ ...mintForm, initialOwner: e.target.value })}
                    autoComplete="off"
                    className="input-base"
                    style={{
                      width: "100%",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                    }}
                  />
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                    Direct customer sale: specified wallet becomes immediate owner on-chain.
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="mfg-product-name" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                Product Name
              </label>
              <input
                id="mfg-product-name"
                name="productName"
                type="text"
                required
                placeholder="Product Name (e.g. Royal Chronometer)"
                value={mintForm.productName}
                onChange={(e) => setMintForm({ ...mintForm, productName: e.target.value })}
                autoComplete="off"
                className="input-base"
                style={{ width: "100%", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div>
                <label htmlFor="mfg-brand" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Brand
                </label>
                <input
                  id="mfg-brand"
                  name="brand"
                  type="text"
                  required
                  placeholder="Brand"
                  value={mintForm.brand}
                  onChange={(e) => setMintForm({ ...mintForm, brand: e.target.value })}
                  autoComplete="off"
                  className="input-base"
                  style={{ width: "100%", fontSize: "0.85rem" }}
                />
              </div>
              <div>
                <label htmlFor="mfg-category" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Category
                </label>
                <input
                  id="mfg-category"
                  name="category"
                  type="text"
                  required
                  placeholder="Category"
                  value={mintForm.category}
                  onChange={(e) => setMintForm({ ...mintForm, category: e.target.value })}
                  autoComplete="off"
                  className="input-base"
                  style={{ width: "100%", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div>
                <label htmlFor="mfg-model-number" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Model Number
                </label>
                <input
                  id="mfg-model-number"
                  name="modelNumber"
                  type="text"
                  required
                  placeholder="Model Number"
                  value={mintForm.modelNumber}
                  onChange={(e) => setMintForm({ ...mintForm, modelNumber: e.target.value })}
                  autoComplete="off"
                  className="input-base"
                  style={{ width: "100%", fontSize: "0.85rem" }}
                />
              </div>
              <div>
                <label htmlFor="mfg-serial-number" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Serial Number
                </label>
                <input
                  id="mfg-serial-number"
                  name="serialNumber"
                  type="text"
                  required
                  placeholder="Serial Number"
                  value={mintForm.serialNumber}
                  onChange={(e) => setMintForm({ ...mintForm, serialNumber: e.target.value })}
                  autoComplete="off"
                  className="input-base"
                  style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="mfg-manufacture-date" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                Manufacture Date
              </label>
              <input
                id="mfg-manufacture-date"
                name="manufactureDate"
                type="date"
                required
                value={mintForm.manufactureDate}
                onChange={(e) => setMintForm({ ...mintForm, manufactureDate: e.target.value })}
                className="input-base"
                style={{ width: "100%", fontSize: "0.85rem" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "0.75rem",
                fontSize: "0.9rem",
                justifyContent: "center",
                marginTop: "0.5rem",
              }}
            >
              <LuPlus /> Register & Mint Passport
            </button>
          </form>
        </div>

        {/* Activate Warranty Form */}
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
              <LuShieldCheck style={{ color: "var(--status-success)" }} /> Activate Warranty Coverage
            </h3>
            <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
              Activate warranty coverage for your registered product in whole days. Can only be activated once per product on-chain.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              tx.execute(async (cb) => {
                const res = await PassportService.activateWarranty(
                  BigInt(warrantyForm.passportId),
                  BigInt(warrantyForm.durationDays),
                  cb
                );
                fetchRegisteredProducts();
                return res;
              });
            }}
            style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
          >
            <div>
              <label htmlFor="mfg-warranty-passport-id" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                Passport ID
              </label>
              <input
                id="mfg-warranty-passport-id"
                name="passportId"
                type="number"
                required
                placeholder="Passport ID (e.g. 1)"
                value={warrantyForm.passportId}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, passportId: e.target.value })}
                autoComplete="off"
                className="input-base"
                style={{ width: "100%", fontSize: "0.85rem" }}
              />
            </div>

            <div>
              <label htmlFor="mfg-warranty-duration-days" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                Warranty Duration (Days)
              </label>
              <input
                id="mfg-warranty-duration-days"
                name="durationDays"
                type="number"
                required
                min="1"
                placeholder="Days (e.g. 365, 730)"
                value={warrantyForm.durationDays}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, durationDays: e.target.value })}
                autoComplete="off"
                className="input-base"
                style={{ width: "100%", fontSize: "0.85rem" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "0.75rem",
                fontSize: "0.9rem",
                justifyContent: "center",
                marginTop: "0.5rem",
                background: "#162e26",
                borderColor: "rgba(16, 185, 129, 0.4)",
                color: "var(--status-success)",
              }}
            >
              <LuShieldCheck /> Activate Warranty Coverage
            </button>
          </form>
        </div>
      </div>

      {/* Manufacturer Registered Products Section */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LuLayers style={{ color: "var(--accent-primary)", fontSize: "1.2rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
              Manufacturing Inventory & Catalog ({products.length})
            </h3>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "0.4rem", background: "var(--bg-card)", padding: "0.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setActiveTab("all")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                background: activeTab === "all" ? "#253346" : "transparent",
                color: activeTab === "all" ? "#ffffff" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <LuBoxes /> All ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                background: activeTab === "inventory" ? "#253346" : "transparent",
                color: activeTab === "inventory" ? "#ffffff" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <LuWarehouse /> Inventory ({inventoryProducts.length})
            </button>
            <button
              onClick={() => setActiveTab("sold")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                background: activeTab === "sold" ? "#253346" : "transparent",
                color: activeTab === "sold" ? "#ffffff" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <LuShoppingBag /> Sold ({soldProducts.length})
            </button>
          </div>

          <button
            onClick={fetchRegisteredProducts}
            disabled={loadingProducts}
            className="btn btn-secondary"
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
            }}
          >
            <LuRefreshCw className={loadingProducts ? "animate-spin" : ""} /> Refresh Catalog
          </button>
        </div>

        {loadingProducts ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
            <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "1.75rem", color: "var(--accent-primary)", marginBottom: "0.5rem" }} />
            <div>Loading registered products from blockchain...</div>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>
            {activeTab === "inventory"
              ? "No products currently held in manufacturer inventory."
              : activeTab === "sold"
              ? "No products sold to customers yet."
              : `No products registered on-chain yet for wallet ${truncate(account)}. Mint your first product passport above.`}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <th style={{ padding: "0.85rem 0.75rem" }}>DPP ID</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Product</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Model / Serial</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Custody / Owner</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Status</th>
                  <th style={{ padding: "0.85rem 0.75rem" }}>Warranty</th>
                  <th style={{ padding: "0.85rem 0.75rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const inInventory = isProductInInventory(p);
                  const hasTransferPending = p.pendingTransfer.exists;

                  return (
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
                        {p.modelNumber} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>({p.serialNumber})</span>
                      </td>
                      <td style={{ padding: "0.85rem 0.75rem" }}>
                        {inInventory ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              color: "var(--accent-primary)",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              background: "rgba(113, 135, 168, 0.12)",
                              border: "1px solid rgba(113, 135, 168, 0.3)",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            <LuWarehouse /> Manufacturer Inventory
                          </span>
                        ) : (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            {truncate(p.currentOwner)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.85rem 0.75rem" }}>
                        <StatusBadge status={p.status} isInventory={inInventory} />
                      </td>
                      <td style={{ padding: "0.85rem 0.75rem" }}>
                        <WarrantyBadge warranty={p.warranty} />
                      </td>
                      <td style={{ padding: "0.85rem 0.75rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
                          {/* Inventory First Sale Transfer Action */}
                          {inInventory && (
                            <>
                              {!hasTransferPending ? (
                                <button
                                  onClick={() => {
                                    setTransferModalProduct(p);
                                    setTransferRecipient("");
                                  }}
                                  className="btn btn-primary"
                                  style={{
                                    padding: "0.3rem 0.65rem",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  <LuArrowRightLeft /> Transfer / Sell
                                </button>
                              ) : (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                  <span style={{ fontSize: "0.725rem", color: "var(--status-warning)", background: "var(--status-warning-tint)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "0.2rem 0.45rem", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)" }}>
                                    Pending: {truncate(p.pendingTransfer.to)}
                                  </span>
                                  <button
                                    onClick={() =>
                                      tx.execute(async (cb) => {
                                        const res = await PassportService.cancelTransfer(p.passportId, cb);
                                        fetchRegisteredProducts();
                                        return res;
                                      })
                                    }
                                    style={{
                                      padding: "0.2rem 0.45rem",
                                      background: "rgba(239, 68, 68, 0.15)",
                                      color: "var(--status-danger)",
                                      border: "1px solid rgba(239, 68, 68, 0.3)",
                                      borderRadius: "var(--radius-sm)",
                                      fontSize: "0.7rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </>
                          )}

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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Modal for Inventory Products */}
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
                Initiate First Ownership Transfer
              </h3>
              <button
                onClick={() => setTransferModalProduct(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}
              >
                <LuX />
              </button>
            </div>

            <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
              Transferring inventory product <strong>{transferModalProduct.productName}</strong> ({transferModalProduct.dppId || `Passport #${transferModalProduct.passportId.toString()}`}) to first customer. The recipient must accept this transfer in their Owner Portal before custody updates on-chain.
            </p>

            <div>
              <label htmlFor="mfg-transfer-recipient" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                First Customer Wallet Address
              </label>
              <input
                id="mfg-transfer-recipient"
                name="transferRecipient"
                type="text"
                placeholder="0x..."
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                autoComplete="off"
                className="input-base"
                style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
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
                    fetchRegisteredProducts();
                    return res;
                  });
                }}
                disabled={!transferRecipient}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center", opacity: !transferRecipient ? 0.5 : 1, cursor: !transferRecipient ? "not-allowed" : "pointer" }}
              >
                Initiate First Sale
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionModal state={tx.state} onClose={tx.reset} />
    </div>
  );
};

export default ManufacturerPortalPage;
