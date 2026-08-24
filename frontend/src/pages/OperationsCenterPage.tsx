import React, { useEffect } from "react";
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
} from "react-icons/lu";

export const OperationsCenterPage: React.FC = () => {
  const { session, roles, refreshRoles } = useAuth();
  const { chainId } = useWallet();

  const account = session?.account || "";
  const truncate = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  const networkName = chainId
    ? SUPPORTED_NETWORKS[chainId]?.name || `Chain ${chainId}`
    : "Ganache Local (1337)";

  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

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
            bgColor: "rgba(239, 68, 68, 0.12)",
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
            color: "var(--accent-primary, #6366f1)",
            bgColor: "rgba(99, 102, 241, 0.12)",
            borderColor: "rgba(99, 102, 241, 0.25)",
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
            bgColor: "rgba(245, 158, 11, 0.12)",
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
            color: "var(--status-success, #10b981)",
            bgColor: "rgba(16, 185, 129, 0.12)",
            borderColor: "rgba(16, 185, 129, 0.25)",
            badge: "Owner",
          },
        ]
      : []),
  ];

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
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "2rem 2.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.3rem 0.75rem",
              background: "rgba(99, 102, 241, 0.15)",
              color: "var(--accent-primary)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            <LuSparkles /> Authenticated Operations Center
          </div>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: "0.4rem",
            }}
          >
            Welcome, {truncate(account)}
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Select an authorized portal below to manage Digital Product Passports, permissions, or lifecycle operations.
          </p>
        </div>

        {/* Enterprise Diagnostics Summary Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            minWidth: "300px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Network
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.15rem" }}>
              {networkName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Authentication
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--status-success)", marginTop: "0.15rem" }}>
              <LuCheck /> Verified
            </div>
          </div>

          <div style={{ gridColumn: "span 2", paddingTop: "0.5rem", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.35rem" }}>
              Detected On-Chain Roles
            </div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {roles.isAdmin && (
                <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", background: "rgba(239, 68, 68, 0.15)", color: "var(--status-danger)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  ✓ Platform Admin
                </span>
              )}
              {roles.isManufacturer && (
                <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", background: "rgba(99, 102, 241, 0.15)", color: "var(--accent-primary)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  ✓ Manufacturer
                </span>
              )}
              {roles.isServiceCenter && (
                <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", background: "rgba(245, 158, 11, 0.15)", color: "var(--status-warning)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                  ✓ Service Center
                </span>
              )}
              {roles.isOwner && (
                <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", background: "rgba(16, 185, 129, 0.15)", color: "var(--status-success)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
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

      {/* Available Portals Grid */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <LuLayers style={{ color: "var(--accent-secondary)", fontSize: "1.2rem" }} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Available Enterprise Portals ({portals.length})
          </h2>
        </div>

        {portals.length === 0 ? (
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "2.5rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <LuInfo style={{ fontSize: "2rem", color: "var(--accent-primary)" }} />
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
              No Operational Portals Assigned
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "500px" }}>
              This wallet is authenticated, but holds no administrative, manufacturing, or servicing roles, and currently owns zero product passports on-chain.
            </p>
            <Link
              to="/verify"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.2rem",
                background: "var(--accent-primary)",
                color: "#ffffff",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Search & Inspect Public Passports
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
                style={{
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: "var(--bg-secondary, #111827)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg, 16px)",
                  padding: "1.75rem",
                  boxShadow: "var(--shadow-md)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = portal.borderColor;
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.transform = "translateY(0)";
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
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: portal.bgColor,
                        color: portal.color,
                        fontSize: "24px",
                      }}
                    >
                      {portal.icon}
                    </div>

                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: portal.color,
                        background: portal.bgColor,
                        padding: "0.25rem 0.6rem",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {portal.badge}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: "0.25rem" }}>
                    {portal.subtitle}
                  </div>

                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {portal.title}
                  </h3>

                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                      lineHeight: 1.5,
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
                    color: portal.color,
                    fontSize: "0.9rem",
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
    </div>
  );
};

export default OperationsCenterPage;
