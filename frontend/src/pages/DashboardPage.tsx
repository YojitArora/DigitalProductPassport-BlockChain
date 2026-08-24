import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "../hooks/useWallet";
import { useTransaction } from "../hooks/useTransaction";
import { PassportService } from "../services/passportService";
import TransactionModal from "../components/TransactionModal";
import {
  LuShield,
  LuFactory,
  LuWrench,
  LuUser,
  LuPlus,
  LuArrowRightLeft,
  LuShieldAlert,
  LuRotateCcw,
  LuShieldCheck,
  LuWallet,
  LuCheck,
  LuSparkles,
} from "react-icons/lu";

type TabKey = "admin" | "manufacturer" | "serviceCenter" | "owner";

export const DashboardPage: React.FC = () => {
  const { account, isConnected, connect } = useWallet();
  const tx = useTransaction();

  // Role detection state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isManufacturer, setIsManufacturer] = useState<boolean>(false);
  const [isServiceCenter, setIsServiceCenter] = useState<boolean>(false);

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<TabKey>("owner");

  // Form states
  // Admin Forms
  const [newAdminAddr, setNewAdminAddr] = useState<string>("");
  const [mfgAddr, setMfgAddr] = useState<string>("");
  const [mfgName, setMfgName] = useState<string>("");
  const [revokeMfgAddr, setRevokeMfgAddr] = useState<string>("");
  const [scAddr, setScAddr] = useState<string>("");
  const [scName, setScName] = useState<string>("");
  const [revokeScAddr, setRevokeScAddr] = useState<string>("");

  // Manufacturer Forms
  const [mintForm, setMintForm] = useState({
    initialOwner: "",
    productName: "",
    brand: "",
    category: "",
    modelNumber: "",
    serialNumber: "",
    manufactureDate: "",
  });
  const [warrantyForm, setWarrantyForm] = useState({
    passportId: "",
    durationDays: "365",
  });

  // Service Center Forms
  const [serviceStartId, setServiceStartId] = useState<string>("");
  const [serviceCompleteId, setServiceCompleteId] = useState<string>("");
  const [serviceDescription, setServiceDescription] = useState<string>("");

  // Owner Forms
  const [transferInitId, setTransferInitId] = useState<string>("");
  const [transferRecipient, setTransferRecipient] = useState<string>("");
  const [transferAcceptId, setTransferAcceptId] = useState<string>("");
  const [stolenPassportId, setStolenPassportId] = useState<string>("");
  const [recoveredPassportId, setRecoveredPassportId] = useState<string>("");

  // Check roles on account change
  const checkRoles = useCallback(async () => {
    if (!account) {
      setIsAdmin(false);
      setIsManufacturer(false);
      setIsServiceCenter(false);
      return;
    }

    try {
      const [adminRes, mfgRes, scRes] = await Promise.all([
        PassportService.isAdmin(account),
        PassportService.isApprovedManufacturer(account),
        PassportService.isApprovedServiceCenter(account),
      ]);

      setIsAdmin(adminRes);
      setIsManufacturer(mfgRes);
      setIsServiceCenter(scRes);

      // Default active tab to highest role if not already chosen
      if (adminRes) setActiveTab("admin");
      else if (mfgRes) setActiveTab("manufacturer");
      else if (scRes) setActiveTab("serviceCenter");
      else setActiveTab("owner");
    } catch (err) {
      console.error("Error checking roles:", err);
    }
  }, [account]);

  useEffect(() => {
    checkRoles();
  }, [checkRoles]);

  // Detected active roles count
  const detectedRoles: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "owner", label: "Product Owner", icon: <LuUser /> },
  ];
  if (isManufacturer) detectedRoles.push({ key: "manufacturer", label: "Manufacturer", icon: <LuFactory /> });
  if (isServiceCenter) detectedRoles.push({ key: "serviceCenter", label: "Service Center", icon: <LuWrench /> });
  if (isAdmin) detectedRoles.push({ key: "admin", label: "Platform Admin", icon: <LuShield /> });

  const hasMultipleRoles = detectedRoles.length > 1;

  if (!isConnected || !account) {
    return (
      <div
        style={{
          maxWidth: "500px",
          margin: "4rem auto",
          padding: "3rem 2rem",
          background: "var(--bg-secondary, #111827)",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border-subtle)",
          textAlign: "center",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.15)",
            color: "var(--accent-primary, #6366f1)",
            fontSize: "32px",
            marginBottom: "1.25rem",
          }}
        >
          <LuWallet />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Wallet Connection Required
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.75rem" }}>
          Please connect your MetaMask wallet to access your authorized role dashboard (Admin, Manufacturer, Service Center, or Owner).
        </p>
        <button
          onClick={connect}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.75rem",
            background: "var(--accent-primary)",
            color: "#ffffff",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          <LuWallet /> Connect MetaMask
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "2.5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {/* Dashboard Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Operations Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Role-governed decentralized management for the Digital Product Passport network.
          </p>
        </div>

        {/* Detected Roles Badges */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {isAdmin && (
            <span style={{ padding: "0.3rem 0.6rem", background: "rgba(239, 68, 68, 0.15)", color: "var(--status-danger)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}>
              Admin
            </span>
          )}
          {isManufacturer && (
            <span style={{ padding: "0.3rem 0.6rem", background: "rgba(99, 102, 241, 0.15)", color: "var(--accent-primary)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}>
              Manufacturer
            </span>
          )}
          {isServiceCenter && (
            <span style={{ padding: "0.3rem 0.6rem", background: "rgba(245, 158, 11, 0.15)", color: "var(--status-warning)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}>
              Service Center
            </span>
          )}
          <span style={{ padding: "0.3rem 0.6rem", background: "rgba(16, 185, 129, 0.15)", color: "var(--status-success)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}>
            Owner
          </span>
        </div>
      </div>

      {/* Multi-Role Switcher Notification Banner */}
      {hasMultipleRoles && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "var(--radius-md, 10px)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LuSparkles style={{ color: "var(--accent-primary)", fontSize: "1.1rem" }} />
            <span>
              <strong style={{ color: "var(--text-primary)" }}>Multi-Role Wallet:</strong> You possess {detectedRoles.length} platform roles. Select any role tab below to switch dashboards seamlessly.
            </span>
          </div>
        </div>
      )}

      {/* Role Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "0.5rem",
          overflowX: "auto",
        }}
      >
        {detectedRoles.map((r) => (
          <button
            key={r.key}
            onClick={() => setActiveTab(r.key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 1.2rem",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              fontSize: "0.9rem",
              background: activeTab === r.key ? "var(--bg-card)" : "transparent",
              color: activeTab === r.key ? "var(--text-primary)" : "var(--text-secondary)",
              border: activeTab === r.key ? "1px solid var(--border-active)" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* 1. PRODUCT OWNER TAB                                             */}
      {/* ================================================================ */}
      {activeTab === "owner" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Initiate Transfer Card */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuArrowRightLeft style={{ color: "var(--accent-primary)" }} /> Initiate Transfer
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Request a two-step ownership transfer to a new owner address.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="number"
                placeholder="Passport ID (e.g. 1)"
                value={transferInitId}
                onChange={(e) => setTransferInitId(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <input
                type="text"
                placeholder="Recipient Address (0x...)"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => tx.execute((cb) => PassportService.initiateTransfer(BigInt(transferInitId), transferRecipient, cb))}
                disabled={!transferInitId || !transferRecipient}
                style={{ padding: "0.7rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Initiate Transfer
              </button>
            </div>
          </div>

          {/* Accept / Cancel Transfer Card */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuCheck style={{ color: "var(--status-success)" }} /> Accept or Cancel Transfer
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Accept a transfer designated to your wallet or cancel an initiated transfer.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="number"
                placeholder="Passport ID (e.g. 1)"
                value={transferAcceptId}
                onChange={(e) => setTransferAcceptId(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => tx.execute((cb) => PassportService.acceptTransfer(BigInt(transferAcceptId), cb))}
                  disabled={!transferAcceptId}
                  style={{ flex: 1, padding: "0.7rem", background: "var(--status-success)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600 }}
                >
                  Accept Transfer
                </button>
                <button
                  onClick={() => tx.execute((cb) => PassportService.cancelTransfer(BigInt(transferAcceptId), cb))}
                  disabled={!transferAcceptId}
                  style={{ flex: 1, padding: "0.7rem", background: "rgba(239, 68, 68, 0.15)", color: "var(--status-danger)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)", fontWeight: 600 }}
                >
                  Cancel Transfer
                </button>
              </div>
            </div>
          </div>

          {/* Report Stolen Card */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuShieldAlert style={{ color: "var(--status-danger)" }} /> Report Stolen
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Flag a stolen product on-chain to block unauthorized transfers and servicing.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="number"
                placeholder="Passport ID (e.g. 1)"
                value={stolenPassportId}
                onChange={(e) => setStolenPassportId(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => tx.execute((cb) => PassportService.reportStolen(BigInt(stolenPassportId), cb))}
                disabled={!stolenPassportId}
                style={{ padding: "0.7rem", background: "var(--status-danger)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Report Stolen
              </button>
            </div>
          </div>

          {/* Report Recovered Card */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuRotateCcw style={{ color: "var(--status-info)" }} /> Report Recovered
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Restore operational and transfer capabilities for a recovered product.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="number"
                placeholder="Passport ID (e.g. 1)"
                value={recoveredPassportId}
                onChange={(e) => setRecoveredPassportId(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => tx.execute((cb) => PassportService.reportRecovered(BigInt(recoveredPassportId), cb))}
                disabled={!recoveredPassportId}
                style={{ padding: "0.7rem", background: "var(--status-info)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Report Recovered
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 2. MANUFACTURER TAB                                              */}
      {/* ================================================================ */}
      {activeTab === "manufacturer" && isManufacturer && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {/* Register Product Form */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuPlus style={{ color: "var(--accent-primary)" }} /> Mint Product Passport
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Mint an immutable Digital Product Passport on-chain for a manufactured item.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const mDate = Math.floor(new Date(mintForm.manufactureDate || Date.now()).getTime() / 1000);
                tx.execute((cb) =>
                  PassportService.registerProduct(
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
                  )
                );
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
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuShieldCheck style={{ color: "var(--status-success)" }} /> Activate Warranty
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Activate warranty coverage for your registered product in whole days.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                tx.execute((cb) =>
                  PassportService.activateWarranty(
                    BigInt(warrantyForm.passportId),
                    BigInt(warrantyForm.durationDays),
                    cb
                  )
                );
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
                style={{ padding: "0.75rem", background: "var(--status-success)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Activate Warranty
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 3. SERVICE CENTER TAB                                            */}
      {/* ================================================================ */}
      {activeTab === "serviceCenter" && isServiceCenter && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {/* Start Service */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuWrench style={{ color: "var(--status-warning)" }} /> Start Service Session
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Transition product to UnderService status and lock servicing rights.
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
                onClick={() => tx.execute((cb) => PassportService.startService(BigInt(serviceStartId), cb))}
                disabled={!serviceStartId}
                style={{ padding: "0.75rem", background: "var(--status-warning)", color: "#111827", borderRadius: "var(--radius-md)", fontWeight: 700 }}
              >
                Start Service Session
              </button>
            </div>
          </div>

          {/* Complete Service */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuCheck style={{ color: "var(--status-success)" }} /> Complete Service Session
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Log permanent repair event metadata and restore operational status.
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
                placeholder="Service / Repair Description (e.g. Replaced balance wheel and calibrated timing)"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={3}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
              />
              <button
                onClick={() => tx.execute((cb) => PassportService.completeService(BigInt(serviceCompleteId), serviceDescription, cb))}
                disabled={!serviceCompleteId || !serviceDescription}
                style={{ padding: "0.75rem", background: "var(--status-success)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Complete Service & Log Repair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 4. ADMIN TAB                                                     */}
      {/* ================================================================ */}
      {activeTab === "admin" && isAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Register Manufacturer */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Register Manufacturer
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="Manufacturer Wallet (0x...)"
                value={mfgAddr}
                onChange={(e) => setMfgAddr(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <input
                type="text"
                placeholder="Brand / Company Name"
                value={mfgName}
                onChange={(e) => setMfgName(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => tx.execute((cb) => PassportService.registerManufacturer(mfgAddr, mfgName, cb))}
                disabled={!mfgAddr || !mfgName}
                style={{ padding: "0.7rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Authorize Manufacturer
              </button>
            </div>
          </div>

          {/* Revoke Manufacturer */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Revoke Manufacturer
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="Manufacturer Wallet (0x...)"
                value={revokeMfgAddr}
                onChange={(e) => setRevokeMfgAddr(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => tx.execute((cb) => PassportService.revokeManufacturer(revokeMfgAddr, cb))}
                disabled={!revokeMfgAddr}
                style={{ padding: "0.7rem", background: "rgba(239, 68, 68, 0.2)", color: "var(--status-danger)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Revoke Authorization
              </button>
            </div>
          </div>

          {/* Register Service Center */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Register Service Center
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="Service Center Wallet (0x...)"
                value={scAddr}
                onChange={(e) => setScAddr(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <input
                type="text"
                placeholder="Service Center Name"
                value={scName}
                onChange={(e) => setScName(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => tx.execute((cb) => PassportService.registerServiceCenter(scAddr, scName, cb))}
                disabled={!scAddr || !scName}
                style={{ padding: "0.7rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Authorize Service Center
              </button>
            </div>
          </div>

          {/* Revoke Service Center */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Revoke Service Center
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="Service Center Wallet (0x...)"
                value={revokeScAddr}
                onChange={(e) => setRevokeScAddr(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => tx.execute((cb) => PassportService.revokeServiceCenter(revokeScAddr, cb))}
                disabled={!revokeScAddr}
                style={{ padding: "0.7rem", background: "rgba(239, 68, 68, 0.2)", color: "var(--status-danger)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Revoke Service Center
              </button>
            </div>
          </div>

          {/* Add Admin */}
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Add Platform Admin
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="New Admin Address (0x...)"
                value={newAdminAddr}
                onChange={(e) => setNewAdminAddr(e.target.value)}
                style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => tx.execute((cb) => PassportService.addAdmin(newAdminAddr, cb))}
                disabled={!newAdminAddr}
                style={{ padding: "0.7rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600 }}
              >
                Grant Admin Privileges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Feedback Modal */}
      <TransactionModal state={tx.state} onClose={tx.reset} />
    </div>
  );
};

export default DashboardPage;
