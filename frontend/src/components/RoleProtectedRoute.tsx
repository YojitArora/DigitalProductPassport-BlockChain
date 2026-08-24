import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export type RequiredRole = "admin" | "manufacturer" | "serviceCenter" | "owner";

interface RoleProtectedRouteProps {
  role: RequiredRole;
  children: React.ReactNode;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ role, children }) => {
  const { isAuthenticated, roles, isAuthenticating } = useAuth();
  const location = useLocation();

  if (isAuthenticating) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          color: "var(--text-secondary)",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div>Verifying on-chain role authorization...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let hasRole = false;
  switch (role) {
    case "admin":
      hasRole = roles.isAdmin;
      break;
    case "manufacturer":
      hasRole = roles.isManufacturer;
      break;
    case "serviceCenter":
      hasRole = roles.isServiceCenter;
      break;
    case "owner":
      hasRole = roles.isOwner;
      break;
  }

  if (!hasRole) {
    // Navigate to dedicated Unauthorized / Access Denied page
    return <Navigate to="/unauthorized" state={{ requiredRole: role }} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
