import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTransaction } from "../hooks/useTransaction";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { PassportService } from "../services/passportService";
import { SUPPORTED_NETWORKS } from "../services/provider";
import TransactionModal from "../components/TransactionModal";
import {
  LuShield,
  LuArrowLeft,
  LuUserPlus,
  LuFactory,
  LuWrench,
  LuShieldAlert,
  LuCheck,
  LuCopy,
  LuBuilding2,
  LuKeyRound,
} from "react-icons/lu";

export const AdminPortalPage: React.FC = () => {
  const tx = useTransaction();
  const { session } = useAuth();
  const { chainId } = useWallet();
  const account = session?.account || "";

  // Admin Form States
  const [newAdminAddr, setNewAdminAddr] = useState<string>("");
  const [mfgAddr, setMfgAddr] = useState<string>("");
  const [mfgName, setMfgName] = useState<string>("");
  const [revokeMfgAddr, setRevokeMfgAddr] = useState<string>("");
  const [scAddr, setScAddr] = useState<string>("");
  const [scName, setScName] = useState<string>("");
  const [revokeScAddr, setRevokeScAddr] = useState<string>("");
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ${chainId}`
    : "Ganache Local (1337)";

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
          <div style={{ maxWidth: "580px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.65rem",
                background: "var(--bg-card)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--status-danger)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              <LuShield /> TraceLedger Governance Console
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
              Platform Administration
            </h1>

            <p className="text-secondary" style={{ fontSize: "0.925rem", lineHeight: 1.55 }}>
              Manage decentralized access control, enterprise organization credentials, and platform administrative authority.
            </p>
          </div>

          {/* Platform Admin Identity Panel */}
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
                  Platform Admin Identity
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "0.5rem",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "0.75rem",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Governance Level</span>
              <span
                style={{
                  color: "var(--status-danger)",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <LuKeyRound /> Superadmin Authority
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Manufacturer Authority & Lifecycle */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LuFactory style={{ color: "var(--accent-primary)", fontSize: "1.2rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Manufacturer Authority & Lifecycle
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {/* Register Manufacturer */}
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
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <LuBuilding2 style={{ color: "var(--accent-primary)" }} /> Authorize Manufacturer
              </h3>
              <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                Grant an approved brand or manufacturing entity product passport minting privileges on-chain.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label htmlFor="admin-mfg-addr" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Manufacturer Wallet Address
                </label>
                <input
                  id="admin-mfg-addr"
                  name="mfgAddress"
                  type="text"
                  placeholder="0x..."
                  value={mfgAddr}
                  onChange={(e) => setMfgAddr(e.target.value)}
                  autoComplete="off"
                  className="input-base"
                  style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label htmlFor="admin-mfg-name" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Brand / Company Name
                </label>
                <input
                  id="admin-mfg-name"
                  name="mfgName"
                  type="text"
                  placeholder="e.g. Aura Swiss Timepieces"
                  value={mfgName}
                  onChange={(e) => setMfgName(e.target.value)}
                  autoComplete="organization"
                  className="input-base"
                  style={{ width: "100%", fontSize: "0.85rem" }}
                />
              </div>

              <button
                onClick={() => tx.execute((cb) => PassportService.registerManufacturer(mfgAddr, mfgName, cb))}
                disabled={!mfgAddr || !mfgName}
                className="btn btn-primary"
                style={{
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                  justifyContent: "center",
                  marginTop: "0.25rem",
                  opacity: !mfgAddr || !mfgName ? 0.5 : 1,
                  cursor: !mfgAddr || !mfgName ? "not-allowed" : "pointer",
                }}
              >
                <LuBuilding2 /> Authorize Manufacturer
              </button>
            </div>
          </div>

          {/* Revoke Manufacturer */}
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
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <LuShieldAlert style={{ color: "var(--status-danger)" }} /> Revoke Manufacturer
              </h3>
              <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                Immediately strip an authorized manufacturer of product passport minting rights.
              </p>
            </div>

            <div
              style={{
                padding: "0.65rem 0.85rem",
                background: "var(--bg-card)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.775rem",
                color: "var(--text-secondary)",
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: "var(--status-danger)" }}>Privileged Action:</strong> Existing issued passports remain valid, but future minting is blocked immediately.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label htmlFor="admin-revoke-mfg-addr" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Manufacturer Wallet Address to Revoke
                </label>
                <input
                  id="admin-revoke-mfg-addr"
                  name="revokeMfgAddress"
                  type="text"
                  placeholder="0x..."
                  value={revokeMfgAddr}
                  onChange={(e) => setRevokeMfgAddr(e.target.value)}
                  autoComplete="off"
                  className="input-base"
                  style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                />
              </div>

              <button
                onClick={() => tx.execute((cb) => PassportService.revokeManufacturer(revokeMfgAddr, cb))}
                disabled={!revokeMfgAddr}
                className="btn btn-primary"
                style={{
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                  justifyContent: "center",
                  marginTop: "0.25rem",
                  background: "#2b1818",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  color: "var(--status-danger)",
                  opacity: !revokeMfgAddr ? 0.5 : 1,
                  cursor: !revokeMfgAddr ? "not-allowed" : "pointer",
                }}
              >
                <LuShieldAlert /> Revoke Authorization
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Service Center Authority & Lifecycle */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LuWrench style={{ color: "var(--status-warning)", fontSize: "1.2rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Service Center Authority & Lifecycle
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {/* Register Service Center */}
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
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <LuWrench style={{ color: "var(--status-warning)" }} /> Authorize Service Center
              </h3>
              <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                Register an approved maintenance and certified repair service center on-chain.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label htmlFor="admin-sc-addr" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Service Center Wallet Address
                </label>
                <input
                  id="admin-sc-addr"
                  name="serviceCenterAddress"
                  type="text"
                  placeholder="0x..."
                  value={scAddr}
                  onChange={(e) => setScAddr(e.target.value)}
                  autoComplete="off"
                  className="input-base"
                  style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label htmlFor="admin-sc-name" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Service Center Name
                </label>
                <input
                  id="admin-sc-name"
                  name="serviceCenterName"
                  type="text"
                  placeholder="e.g. Apex Certified Horology Service"
                  value={scName}
                  onChange={(e) => setScName(e.target.value)}
                  autoComplete="organization"
                  className="input-base"
                  style={{ width: "100%", fontSize: "0.85rem" }}
                />
              </div>

              <button
                onClick={() => tx.execute((cb) => PassportService.registerServiceCenter(scAddr, scName, cb))}
                disabled={!scAddr || !scName}
                className="btn btn-primary"
                style={{
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                  justifyContent: "center",
                  marginTop: "0.25rem",
                  opacity: !scAddr || !scName ? 0.5 : 1,
                  cursor: !scAddr || !scName ? "not-allowed" : "pointer",
                }}
              >
                <LuWrench /> Authorize Service Center
              </button>
            </div>
          </div>

          {/* Revoke Service Center */}
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
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <LuShieldAlert style={{ color: "var(--status-danger)" }} /> Revoke Service Center
              </h3>
              <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                Revoke servicing credentials and repair logging privileges for a service center.
              </p>
            </div>

            <div
              style={{
                padding: "0.65rem 0.85rem",
                background: "var(--bg-card)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.775rem",
                color: "var(--text-secondary)",
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: "var(--status-danger)" }}>Privileged Action:</strong> The entity will be immediately blocked from starting or completing maintenance sessions.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label htmlFor="admin-revoke-sc-addr" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                  Service Center Wallet Address to Revoke
                </label>
                <input
                  id="admin-revoke-sc-addr"
                  name="revokeScAddress"
                  type="text"
                  placeholder="0x..."
                  value={revokeScAddr}
                  onChange={(e) => setRevokeScAddr(e.target.value)}
                  autoComplete="off"
                  className="input-base"
                  style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                />
              </div>

              <button
                onClick={() => tx.execute((cb) => PassportService.revokeServiceCenter(revokeScAddr, cb))}
                disabled={!revokeScAddr}
                className="btn btn-primary"
                style={{
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                  justifyContent: "center",
                  marginTop: "0.25rem",
                  background: "#2b1818",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  color: "var(--status-danger)",
                  opacity: !revokeScAddr ? 0.5 : 1,
                  cursor: !revokeScAddr ? "not-allowed" : "pointer",
                }}
              >
                <LuShieldAlert /> Revoke Service Center
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Platform Governance & Privileges */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LuUserPlus style={{ color: "var(--accent-primary)", fontSize: "1.2rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Platform Governance & Privileges
          </h2>
        </div>

        {/* Add Platform Admin */}
        <div
          className="card-base"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            maxWidth: "600px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LuUserPlus style={{ color: "var(--accent-primary)" }} /> Grant Platform Admin Role
            </h3>
            <p className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
              Grant full platform administrative, organization registration, and governance authority to a new wallet address.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label htmlFor="admin-new-admin-addr" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                New Admin Wallet Address
              </label>
              <input
                id="admin-new-admin-addr"
                name="newAdminAddress"
                type="text"
                placeholder="0x..."
                value={newAdminAddr}
                onChange={(e) => setNewAdminAddr(e.target.value)}
                autoComplete="off"
                className="input-base"
                style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
              />
            </div>

            <button
              onClick={() => tx.execute((cb) => PassportService.addAdmin(newAdminAddr, cb))}
              disabled={!newAdminAddr}
              className="btn btn-primary"
              style={{
                padding: "0.75rem",
                fontSize: "0.9rem",
                justifyContent: "center",
                marginTop: "0.25rem",
                opacity: !newAdminAddr ? 0.5 : 1,
                cursor: !newAdminAddr ? "not-allowed" : "pointer",
              }}
            >
              <LuShield /> Grant Admin Privileges
            </button>
          </div>
        </div>
      </div>

      <TransactionModal state={tx.state} onClose={tx.reset} />
    </div>
  );
};

export default AdminPortalPage;
