import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { SUPPORTED_NETWORKS } from "../services/provider";
import {
  LuShield,
  LuFactory,
  LuWrench,
  LuUser,
  LuArrowRight,
  LuSparkles,
  LuLayers,
  LuCheck,
  LuInfo,
  LuCopy,
  LuKeyRound,
  LuSearch,
} from "react-icons/lu";

export const OperationsCenterPage: React.FC = () => {
  const { session, roles, refreshRoles } = useAuth();
  const { chainId } = useWallet();
  const [copiedWallet, setCopiedWallet] = useState(false);

  const account = session?.account || "";
  const truncate = (addr: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "—";

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ${chainId}`
    : "Ganache Local (1337)";

  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

  const handleCopyWallet = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  // Compile active portals based strictly on blockchain verified roles
  const portals = [
    ...(roles.isAdmin
      ? [
          {
            id: "admin",
            title: "Platform Administration",
            subtitle: "Governance & Access Control",
            description:
              "Authorize and revoke manufacturers and service centers, grant platform admin privileges, and audit governance rules.",
            path: "/operations/admin",
            icon: <LuShield />,
            color: "var(--status-danger, #ef4444)",
            bgColor: "rgba(239, 68, 68, 0.1)",
            borderColor: "rgba(239, 68, 68, 0.25)",
            badge: "Admin",
          },
        ]
      : []),
    ...(roles.isManufacturer
      ? [
          {
            id: "manufacturer",
            title: "Manufacturer Portal",
            subtitle: "Minting & Warranty Lifecycle",
            description:
              "Mint immutable Digital Product Passports for manufactured goods, review your registered products, and activate dynamic warranty coverage.",
            path: "/operations/manufacturer",
            icon: <LuFactory />,
            color: "var(--accent-primary, #7187A8)",
            bgColor: "rgba(113, 135, 168, 0.12)",
            borderColor: "rgba(113, 135, 168, 0.3)",
            badge: "Manufacturer",
          },
        ]
      : []),
    ...(roles.isServiceCenter
      ? [
          {
            id: "service",
            title: "Service Center Portal",
            subtitle: "Maintenance & Certified Repairs",
            description:
              "Track active service jobs, log certified maintenance records with permanent description hashes, and complete repairs.",
            path: "/operations/service",
            icon: <LuWrench />,
            color: "var(--status-warning, #f59e0b)",
            bgColor: "rgba(245, 158, 11, 0.1)",
            borderColor: "rgba(245, 158, 11, 0.25)",
            badge: "Service Center",
          },
        ]
      : []),
    ...(roles.isOwner
      ? [
          {
            id: "owner",
            title: "Owner Portal",
            subtitle: "Ownership & Asset Custody",
            description:
              "Manage owned product passports, execute secure two-step transfers, report theft/recovery, and generate verifiable QR codes.",
            path: "/operations/owner",
            icon: <LuUser />,
            color: "var(--accent-primary, #7187A8)",
            bgColor: "rgba(113, 135, 168, 0.12)",
            borderColor: "rgba(113, 135, 168, 0.3)",
            badge: "Owner",
          },
        ]
      : []),
  ];

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
      {/* Page Header & Identity Panel */}
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
          gap: "1.75rem",
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
            <LuSparkles /> TraceLedger Operations Console
          </div>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              marginBottom: "0.45rem",
              lineHeight: 1.2,
            }}
          >
            Operations Center
          </h1>

          <p className="text-secondary" style={{ fontSize: "0.925rem", lineHeight: 1.55 }}>
            Manage your authorized blockchain portals, on-chain role identities, and Digital Product Passport operations.
          </p>
        </div>

        {/* Enterprise Diagnostics & Blockchain Identity Panel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.85rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            minWidth: "320px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
              Connected Identity
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
                title="Copy connected wallet address"
              >
                {copiedWallet ? <LuCheck /> : <LuCopy />}
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
              Network & Status
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--status-success)",
                  boxShadow: "0 0 6px var(--status-success)",
                  display: "inline-block",
                }}
              />
              <span>{networkName}</span>
            </div>
          </div>

          <div style={{ gridColumn: "span 2", paddingTop: "0.65rem", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
              Detected On-Chain Roles
            </div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {roles.isAdmin && (
                <span style={{ fontSize: "0.725rem", padding: "0.2rem 0.55rem", background: "rgba(239, 68, 68, 0.15)", color: "var(--status-danger)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  ✓ Platform Admin
                </span>
              )}
              {roles.isManufacturer && (
                <span style={{ fontSize: "0.725rem", padding: "0.2rem 0.55rem", background: "rgba(113, 135, 168, 0.15)", color: "var(--accent-primary)", border: "1px solid rgba(113, 135, 168, 0.35)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  ✓ Manufacturer
                </span>
              )}
              {roles.isServiceCenter && (
                <span style={{ fontSize: "0.725rem", padding: "0.2rem 0.55rem", background: "rgba(245, 158, 11, 0.15)", color: "var(--status-warning)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  ✓ Service Center
                </span>
              )}
              {roles.isOwner && (
                <span style={{ fontSize: "0.725rem", padding: "0.2rem 0.55rem", background: "rgba(113, 135, 168, 0.15)", color: "var(--accent-primary)", border: "1px solid rgba(113, 135, 168, 0.35)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  ✓ Product Owner
                </span>
              )}
              {!roles.isAdmin && !roles.isManufacturer && !roles.isServiceCenter && !roles.isOwner && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  No active platform roles found for this address.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Portals Grid Section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LuLayers style={{ color: "var(--accent-primary)", fontSize: "1.2rem" }} />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
              Your Authorized Portals ({portals.length})
            </h2>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Cryptographically granted by smart contract registry
          </div>
        </div>

        {portals.length === 0 ? (
          <div
            className="card-base"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              padding: "3rem 2rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
                fontSize: "1.5rem",
              }}
            >
              <LuInfo />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff" }}>
              No Operational Portals Assigned
            </h3>
            <p className="text-secondary" style={{ fontSize: "0.9rem", maxWidth: "520px", lineHeight: 1.55 }}>
              This wallet is authenticated, but holds no administrative, manufacturing, or servicing roles, and currently owns zero product passports on-chain.
            </p>
            <Link
              to="/verify"
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                marginTop: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              <LuSearch /> Public Verification Portal
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {portals.map((portal) => (
              <Link
                key={portal.id}
                to={portal.path}
                className="card-base"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.75rem",
                  boxShadow: "var(--shadow-sm)",
                  transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(113, 135, 168, 0.45)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                <div>
                  {/* Portal Top: Icon & Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "44px",
                        height: "44px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-secondary)",
                        border: `1px solid ${portal.borderColor}`,
                        color: portal.color,
                        fontSize: "22px",
                      }}
                    >
                      {portal.icon}
                    </div>

                    <span
                      style={{
                        fontSize: "0.725rem",
                        fontWeight: 600,
                        color: portal.color,
                        background: portal.bgColor,
                        border: `1px solid ${portal.borderColor}`,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "var(--radius-sm)",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {portal.badge}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.775rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {portal.subtitle}
                  </div>

                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: "0.65rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {portal.title}
                  </h3>

                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                      lineHeight: 1.55,
                      marginBottom: "1.5rem",
                    }}
                  >
                    {portal.description}
                  </p>
                </div>

                {/* Portal Card Footer Action */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border-subtle)",
                    color: "var(--accent-primary)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  <span>Launch Portal</span>
                  <LuArrowRight />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Role Capabilities & Technical Permissions Summary Panel */}
      <div
        className="card-base"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LuKeyRound style={{ color: "var(--accent-primary)", fontSize: "1.1rem" }} />
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>
            On-Chain Permissions & Role Capabilities
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
            fontSize: "0.825rem",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
              Manufacturer Rights
            </div>
            <div style={{ color: roles.isManufacturer ? "var(--text-primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: roles.isManufacturer ? "var(--status-success)" : "var(--text-muted)" }}>
                {roles.isManufacturer ? "✓" : "—"}
              </span>
              <span>Mint Immutable Digital Product Passports</span>
            </div>
            <div style={{ color: roles.isManufacturer ? "var(--text-primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: roles.isManufacturer ? "var(--status-success)" : "var(--text-muted)" }}>
                {roles.isManufacturer ? "✓" : "—"}
              </span>
              <span>Factory Inventory & Warranty Activation</span>
            </div>
          </div>

          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
              Service Center Rights
            </div>
            <div style={{ color: roles.isServiceCenter ? "var(--text-primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: roles.isServiceCenter ? "var(--status-success)" : "var(--text-muted)" }}>
                {roles.isServiceCenter ? "✓" : "—"}
              </span>
              <span>Initiate Active Product Service Window</span>
            </div>
            <div style={{ color: roles.isServiceCenter ? "var(--text-primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: roles.isServiceCenter ? "var(--status-success)" : "var(--text-muted)" }}>
                {roles.isServiceCenter ? "✓" : "—"}
              </span>
              <span>Log Certified Maintenance Description Hashes</span>
            </div>
          </div>

          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
              Owner & Asset Custody
            </div>
            <div style={{ color: roles.isOwner ? "var(--text-primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: roles.isOwner ? "var(--status-success)" : "var(--text-muted)" }}>
                {roles.isOwner ? "✓" : "—"}
              </span>
              <span>Execute Two-Step Secure Ownership Transfers</span>
            </div>
            <div style={{ color: roles.isOwner ? "var(--text-primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: roles.isOwner ? "var(--status-success)" : "var(--text-muted)" }}>
                {roles.isOwner ? "✓" : "—"}
              </span>
              <span>Report On-Chain Stolen / Recovered Status</span>
            </div>
          </div>

          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
              Platform Administration
            </div>
            <div style={{ color: roles.isAdmin ? "var(--text-primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: roles.isAdmin ? "var(--status-success)" : "var(--text-muted)" }}>
                {roles.isAdmin ? "✓" : "—"}
              </span>
              <span>Authorize & Revoke Enterprise Roles</span>
            </div>
            <div style={{ color: roles.isAdmin ? "var(--text-primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: roles.isAdmin ? "var(--status-success)" : "var(--text-muted)" }}>
                {roles.isAdmin ? "✓" : "—"}
              </span>
              <span>Smart Contract Governance & Access Control</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsCenterPage;
