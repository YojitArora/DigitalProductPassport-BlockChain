import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTransaction } from "../hooks/useTransaction";
import { PassportService } from "../services/passportService";
import TransactionModal from "../components/TransactionModal";
import {
  LuShield,
  LuArrowLeft,
  LuUserPlus,
  LuFactory,
  LuWrench,
  LuShieldAlert,
} from "react-icons/lu";

export const AdminPortalPage: React.FC = () => {
  const tx = useTransaction();

  // Admin Form States
  const [newAdminAddr, setNewAdminAddr] = useState<string>("");
  const [mfgAddr, setMfgAddr] = useState<string>("");
  const [mfgName, setMfgName] = useState<string>("");
  const [revokeMfgAddr, setRevokeMfgAddr] = useState<string>("");
  const [scAddr, setScAddr] = useState<string>("");
  const [scName, setScName] = useState<string>("");
  const [revokeScAddr, setRevokeScAddr] = useState<string>("");

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
              background: "rgba(239, 68, 68, 0.15)",
              color: "var(--status-danger)",
              fontSize: "20px",
            }}
          >
            <LuShield />
          </div>
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Platform Administration Portal
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Decentralized access control and authority management for the Digital Product Passport network.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Action Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Register Manufacturer */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LuFactory style={{ color: "var(--accent-primary)" }} /> Authorize Manufacturer
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Grant an approved brand or manufacturing entity product minting privileges.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label htmlFor="admin-mfg-addr" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Manufacturer Wallet Address
            </label>
            <input
              id="admin-mfg-addr"
              name="mfgAddress"
              type="text"
              placeholder="Manufacturer Wallet (0x...)"
              value={mfgAddr}
              onChange={(e) => setMfgAddr(e.target.value)}
              autoComplete="off"
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
            />
            <label htmlFor="admin-mfg-name" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Brand / Company Name
            </label>
            <input
              id="admin-mfg-name"
              name="mfgName"
              type="text"
              placeholder="Brand / Company Name"
              value={mfgName}
              onChange={(e) => setMfgName(e.target.value)}
              autoComplete="organization"
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.85rem" }}
            />
            <button
              onClick={() => tx.execute((cb) => PassportService.registerManufacturer(mfgAddr, mfgName, cb))}
              disabled={!mfgAddr || !mfgName}
              style={{ padding: "0.7rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.25rem", cursor: (!mfgAddr || !mfgName) ? "not-allowed" : "pointer" }}
            >
              Authorize Manufacturer
            </button>
          </div>
        </div>

        {/* Revoke Manufacturer */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LuShieldAlert style={{ color: "var(--status-danger)" }} /> Revoke Manufacturer
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Immediately strip a manufacturer of product passport minting rights.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label htmlFor="admin-revoke-mfg-addr" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Manufacturer Wallet Address to Revoke
            </label>
            <input
              id="admin-revoke-mfg-addr"
              name="revokeMfgAddress"
              type="text"
              placeholder="Manufacturer Wallet (0x...)"
              value={revokeMfgAddr}
              onChange={(e) => setRevokeMfgAddr(e.target.value)}
              autoComplete="off"
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
            />
            <button
              onClick={() => tx.execute((cb) => PassportService.revokeManufacturer(revokeMfgAddr, cb))}
              disabled={!revokeMfgAddr}
              style={{ padding: "0.7rem", background: "rgba(239, 68, 68, 0.15)", color: "var(--status-danger)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.25rem", cursor: !revokeMfgAddr ? "not-allowed" : "pointer" }}
            >
              Revoke Authorization
            </button>
          </div>
        </div>

        {/* Register Service Center */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LuWrench style={{ color: "var(--status-warning)" }} /> Authorize Service Center
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Register a certified maintenance and repair service center.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label htmlFor="admin-sc-addr" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Service Center Wallet Address
            </label>
            <input
              id="admin-sc-addr"
              name="serviceCenterAddress"
              type="text"
              placeholder="Service Center Wallet (0x...)"
              value={scAddr}
              onChange={(e) => setScAddr(e.target.value)}
              autoComplete="off"
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
            />
            <label htmlFor="admin-sc-name" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Service Center Name
            </label>
            <input
              id="admin-sc-name"
              name="serviceCenterName"
              type="text"
              placeholder="Service Center Name"
              value={scName}
              onChange={(e) => setScName(e.target.value)}
              autoComplete="organization"
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.85rem" }}
            />
            <button
              onClick={() => tx.execute((cb) => PassportService.registerServiceCenter(scAddr, scName, cb))}
              disabled={!scAddr || !scName}
              style={{ padding: "0.7rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.25rem", cursor: (!scAddr || !scName) ? "not-allowed" : "pointer" }}
            >
              Authorize Service Center
            </button>
          </div>
        </div>

        {/* Revoke Service Center */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LuShieldAlert style={{ color: "var(--status-danger)" }} /> Revoke Service Center
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Revoke servicing credentials and repair logging privileges for a service center.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label htmlFor="admin-revoke-sc-addr" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Service Center Wallet Address to Revoke
            </label>
            <input
              id="admin-revoke-sc-addr"
              name="revokeScAddress"
              type="text"
              placeholder="Service Center Wallet (0x...)"
              value={revokeScAddr}
              onChange={(e) => setRevokeScAddr(e.target.value)}
              autoComplete="off"
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
            />
            <button
              onClick={() => tx.execute((cb) => PassportService.revokeServiceCenter(revokeScAddr, cb))}
              disabled={!revokeScAddr}
              style={{ padding: "0.7rem", background: "rgba(239, 68, 68, 0.15)", color: "var(--status-danger)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.25rem", cursor: !revokeScAddr ? "not-allowed" : "pointer" }}
            >
              Revoke Service Center
            </button>
          </div>
        </div>

        {/* Add Platform Admin */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LuUserPlus style={{ color: "var(--accent-secondary)" }} /> Add Platform Admin
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Grant full platform administrative and governance authority to a new wallet.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label htmlFor="admin-new-admin-addr" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              New Admin Wallet Address
            </label>
            <input
              id="admin-new-admin-addr"
              name="newAdminAddress"
              type="text"
              placeholder="New Admin Address (0x...)"
              value={newAdminAddr}
              onChange={(e) => setNewAdminAddr(e.target.value)}
              autoComplete="off"
              style={{ padding: "0.6rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
            />
            <button
              onClick={() => tx.execute((cb) => PassportService.addAdmin(newAdminAddr, cb))}
              disabled={!newAdminAddr}
              style={{ padding: "0.7rem", background: "var(--accent-primary)", color: "#ffffff", borderRadius: "var(--radius-md)", fontWeight: 600, marginTop: "0.25rem", cursor: !newAdminAddr ? "not-allowed" : "pointer" }}
            >
              Grant Admin Privileges
            </button>
          </div>
        </div>
      </div>

      <TransactionModal state={tx.state} onClose={tx.reset} />
    </div>
  );
};

export default AdminPortalPage;
