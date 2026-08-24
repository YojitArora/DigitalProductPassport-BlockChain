import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTransaction } from "../hooks/useTransaction";
import { useAuth } from "../hooks/useAuth";
import { PassportService } from "../services/passportService";
import { Product } from "../types";
import TransactionModal from "../components/TransactionModal";
import StatusBadge from "../components/StatusBadge";
import WarrantyBadge from "../components/WarrantyBadge";
import {
  LuFactory,
  LuArrowLeft,
  LuPlus,
  LuShieldCheck,
  LuLayers,
  LuExternalLink,
  LuRefreshCw,
  LuLoader,
} from "react-icons/lu";

export const ManufacturerPortalPage: React.FC = () => {
  const tx = useTransaction();
  const { session } = useAuth();
  const account = session?.account || "";

  // Registered Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Manufacturer Mint Form
  const [mintForm, setMintForm] = useState({
    initialOwner: "",
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
              Mint immutable Digital Product Passports, activate certified warranties, and track your registered product catalog.
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
            Create an immutable Digital Product Passport on-chain for a newly manufactured product.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const mDate = Math.floor(new Date(mintForm.manufactureDate || Date.now()).getTime() / 1000);
              tx.execute(async (cb) => {
                const res = await PassportService.registerProduct(
                  {
                    initialOwner: mintForm.initialOwner,
                    productName: mintForm.productName,
                    brand: mintForm.brand,
                    category: mintForm.category,
                    modelNumber: mintForm.modelNumber,
                    serialNumber: mintForm.serialNumber,
                    manufactureDate: mDate,
                  },
                  cb
                );
                fetchRegisteredProducts();
                return res;
              });
            }}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <input
              type="text"
              required
              placeholder="Initial Owner Address (0x...)"
              value={mintForm.initialOwner}
              onChange={(e) => setMintForm({ ...mintForm, initialOwner: e.target.value })}
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
            />
            <input
              type="text"
              required
              placeholder="Product Name (e.g. Royal Chronometer)"
              value={mintForm.productName}
              onChange={(e) => setMintForm({ ...mintForm, productName: e.target.value })}
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <input
                type="text"
                required
                placeholder="Brand"
                value={mintForm.brand}
                onChange={(e) => setMintForm({ ...mintForm, brand: e.target.value })}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <input
                type="text"
                required
                placeholder="Category"
                value={mintForm.category}
                onChange={(e) => setMintForm({ ...mintForm, category: e.target.value })}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <input
                type="text"
                required
                placeholder="Model Number"
                value={mintForm.modelNumber}
                onChange={(e) => setMintForm({ ...mintForm, modelNumber: e.target.value })}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <input
                type="text"
                required
                placeholder="Serial Number"
                value={mintForm.serialNumber}
                onChange={(e) => setMintForm({ ...mintForm, serialNumber: e.target.value })}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem", display: "block" }}>
                Manufacture Date:
              </label>
              <input
                type="date"
                required
                value={mintForm.manufactureDate}
                onChange={(e) => setMintForm({ ...mintForm, manufactureDate: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
            </div>
            <button
              type="submit"
              style={{ padding: "0.75rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.5rem" }}
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
            <input
              type="number"
              required
              placeholder="Passport ID (e.g. 1)"
              value={warrantyForm.passportId}
              onChange={(e) => setWarrantyForm({ ...warrantyForm, passportId: e.target.value })}
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
            />
            <input
              type="number"
              required
              min="1"
              placeholder="Warranty Duration (Days, e.g. 365, 730)"
              value={warrantyForm.durationDays}
              onChange={(e) => setWarrantyForm({ ...warrantyForm, durationDays: e.target.value })}
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
            />
            <button
              type="submit"
              style={{ padding: "0.75rem", background: "var(--status-success)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.5rem" }}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LuLayers style={{ color: "var(--accent-primary)", fontSize: "1.2rem" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Products Registered By This Manufacturer ({products.length})
            </h3>
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
            <LuRefreshCw className={loadingProducts ? "animate-spin" : ""} /> Refresh List
          </button>
        </div>

        {loadingProducts ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            <LuLoader style={{ animation: "spin 1.5s linear infinite", fontSize: "1.5rem", marginBottom: "0.5rem" }} />
            <div>Loading registered products from blockchain...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
            No products registered on-chain yet for wallet {truncate(account)}. Mint your first product passport above.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>ID</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Product Name</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Model / Serial</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Current Owner</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Warranty</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
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
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {truncate(p.currentOwner)}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <WarrantyBadge warranty={p.warranty} />
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

export default ManufacturerPortalPage;
