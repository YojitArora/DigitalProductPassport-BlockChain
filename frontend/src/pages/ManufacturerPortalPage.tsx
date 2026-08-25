import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTransaction } from "../hooks/useTransaction";
import { useAuth } from "../hooks/useAuth";
import { PassportService } from "../services/passportService";
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
} from "react-icons/lu";

export const ManufacturerPortalPage: React.FC = () => {
  const tx = useTransaction();
  const { session } = useAuth();
  const account = session?.account || "";

  // Registered Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "inventory" | "sold">("all");

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
              background: "rgba(99, 102, 241, 0.15)",
              color: "var(--accent-primary)",
              fontSize: "20px",
            }}
          >
            <LuFactory />
          </div>
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Manufacturer Operations Portal
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Mint immutable Digital Product Passports, manage factory inventory, activate certified warranties, and initiate first-time customer sales.
            </p>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.75rem" }}>
        {/* Mint Product Passport Form */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LuPlus style={{ color: "var(--accent-primary)" }} /> Mint Product Passport
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Create an immutable Digital Product Passport on-chain for customer-owned goods or factory inventory.
          </p>

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
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {/* Inventory / Initial Owner Explicit Control */}
            <div
              style={{
                background: "var(--bg-card)",
                padding: "0.85rem",
                borderRadius: "var(--radius-sm)",
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
                  color: "var(--text-primary)",
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
                    background: "rgba(99, 102, 241, 0.1)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    lineHeight: 1.4,
                  }}
                >
                  <LuWarehouse style={{ fontSize: "1.1rem", flexShrink: 0 }} />
                  <div>
                    The manufacturer will temporarily hold product custody until the first sale. This item will appear in <strong>Manufacturer Inventory</strong>.
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="mfg-initial-owner" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem", display: "block" }}>
                    Initial Customer Owner Address (Required):
                  </label>
                  <input
                    id="mfg-initial-owner"
                    name="initialOwner"
                    type="text"
                    required={!mintForm.keepInInventory}
                    placeholder="0x... Initial Customer Wallet Address"
                    value={mintForm.initialOwner}
                    onChange={(e) => setMintForm({ ...mintForm, initialOwner: e.target.value })}
                    autoComplete="off"
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                    }}
                  />
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Direct customer sale: the specified customer address will become the immediate owner upon minting.
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="mfg-product-name" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
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
                style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label htmlFor="mfg-brand" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
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
                  style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                />
              </div>
              <div>
                <label htmlFor="mfg-category" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
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
                  style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label htmlFor="mfg-model-number" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
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
                  style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                />
              </div>
              <div>
                <label htmlFor="mfg-serial-number" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
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
                  style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="mfg-manufacture-date" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
                Manufacture Date:
              </label>
              <input
                id="mfg-manufacture-date"
                name="manufactureDate"
                type="date"
                required
                value={mintForm.manufactureDate}
                onChange={(e) => setMintForm({ ...mintForm, manufactureDate: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.85rem" }}
              />
            </div>
            <button
              type="submit"
              style={{ padding: "0.75rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.5rem", cursor: "pointer", border: "none" }}
            >
              Register & Mint Passport
            </button>
          </form>
        </div>

        {/* Activate Warranty Form */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LuShieldCheck style={{ color: "var(--status-success)" }} /> Activate Warranty Coverage
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Activate warranty coverage for your registered product in whole days. Can only be activated once per product.
          </p>

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
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div>
              <label htmlFor="mfg-warranty-passport-id" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
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
                style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.85rem" }}
              />
            </div>

            <div>
              <label htmlFor="mfg-warranty-duration-days" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
                Warranty Duration (Days)
              </label>
              <input
                id="mfg-warranty-duration-days"
                name="durationDays"
                type="number"
                required
                min="1"
                placeholder="Warranty Duration (Days, e.g. 365, 730)"
                value={warrantyForm.durationDays}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, durationDays: e.target.value })}
                autoComplete="off"
                style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.85rem" }}
              />
            </div>
            <button
              type="submit"
              style={{ padding: "0.75rem", background: "var(--status-success)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.5rem", cursor: "pointer", border: "none" }}
            >
              Activate Warranty
            </button>
          </form>
        </div>
      </div>

      {/* Manufacturer Registered Products Section */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LuLayers style={{ color: "var(--accent-primary)", fontSize: "1.2rem" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Registered Product Catalog ({products.length})
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
                background: activeTab === "all" ? "var(--accent-primary)" : "transparent",
                color: activeTab === "all" ? "#ffffff" : "var(--text-secondary)",
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
                background: activeTab === "inventory" ? "var(--accent-primary)" : "transparent",
                color: activeTab === "inventory" ? "#ffffff" : "var(--text-secondary)",
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
                background: activeTab === "sold" ? "var(--accent-primary)" : "transparent",
                color: activeTab === "sold" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              <LuShoppingBag /> Sold ({soldProducts.length})
            </button>
          </div>

          <button
            onClick={fetchRegisteredProducts}
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
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "1.5rem", marginBottom: "0.5rem" }} />
            <div>Loading registered products from blockchain...</div>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
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
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>ID</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Product Name</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Model / Serial</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Current Custody / Owner</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Warranty</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const inInventory = isProductInInventory(p);
                  const hasTransferPending = p.pendingTransfer.exists;

                  return (
                    <tr key={p.passportId.toString()} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-primary)" }}>
                        #{p.passportId.toString()}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {p.productName}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-secondary)" }}>
                        {p.modelNumber} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>({p.serialNumber})</span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {inInventory ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              color: "var(--accent-primary)",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              background: "rgba(99, 102, 241, 0.12)",
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
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <StatusBadge status={p.status} isInventory={inInventory} />
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <WarrantyBadge warranty={p.warranty} />
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
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
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    padding: "0.3rem 0.6rem",
                                    background: "var(--accent-primary)",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  <LuArrowRightLeft /> Transfer / Sell
                                </button>
                              ) : (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                  <span style={{ fontSize: "0.75rem", color: "var(--status-warning)", background: "rgba(245, 158, 11, 0.12)", padding: "0.2rem 0.4rem", borderRadius: "var(--radius-sm)" }}>
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
                                      padding: "0.2rem 0.4rem",
                                      background: "rgba(239, 68, 68, 0.2)",
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
                            to={`/verify/${p.passportId.toString()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              color: "var(--text-secondary)",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              textDecoration: "none",
                              padding: "0.3rem 0.5rem",
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "var(--radius-sm)",
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
                Initiate First Ownership Transfer
              </h3>
              <button
                onClick={() => setTransferModalProduct(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                <LuX />
              </button>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.4 }}>
              Transferring inventory product <strong>{transferModalProduct.productName}</strong> (Passport #{transferModalProduct.passportId.toString()}) to first customer. The recipient must accept this transfer in their Owner Portal.
            </p>

            <label htmlFor="mfg-transfer-recipient" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
              First Customer Wallet Address
            </label>
            <input
              id="mfg-transfer-recipient"
              name="transferRecipient"
              type="text"
              placeholder="First Customer Wallet Address (0x...)"
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
                    fetchRegisteredProducts();
                    return res;
                  });
                }}
                disabled={!transferRecipient}
                style={{ flex: 1, padding: "0.75rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: !transferRecipient ? "not-allowed" : "pointer" }}
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
