import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { AuthProvider } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// Pages
import PublicVerifyPage from "./pages/PublicVerifyPage";
import LoginPage from "./pages/LoginPage";
import OperationsCenterPage from "./pages/OperationsCenterPage";
import AdminPortalPage from "./pages/AdminPortalPage";
import ManufacturerPortalPage from "./pages/ManufacturerPortalPage";
import ServiceCenterPortalPage from "./pages/ServiceCenterPortalPage";
import OwnerPortalPage from "./pages/OwnerPortalPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

export const App: React.FC = () => {
  return (
    <Router>
      <WalletProvider>
        <AuthProvider>
          <div className="app-layout">
            {/* Full-Height Vertical Left Sidebar */}
            <Sidebar />

            {/* Main Application Content Area */}
            <div className="main-content-area">
              <main style={{ flex: 1 }}>
                <Routes>
                  {/* Public Verification Routes */}
                  <Route path="/" element={<PublicVerifyPage />} />
                  <Route path="/verify" element={<PublicVerifyPage />} />
                  <Route path="/verify/:passportId" element={<PublicVerifyPage />} />

                  {/* Authentication & Authorization Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Authenticated Operations Center */}
                  <Route
                    path="/operations"
                    element={
                      <ProtectedRoute>
                        <OperationsCenterPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Role-Based Portals */}
                  <Route
                    path="/operations/admin"
                    element={
                      <RoleProtectedRoute role="admin">
                        <AdminPortalPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/operations/manufacturer"
                    element={
                      <RoleProtectedRoute role="manufacturer">
                        <ManufacturerPortalPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/operations/service"
                    element={
                      <RoleProtectedRoute role="serviceCenter">
                        <ServiceCenterPortalPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/operations/owner"
                    element={
                      <RoleProtectedRoute role="owner">
                        <OwnerPortalPage />
                      </RoleProtectedRoute>
                    }
                  />

                  {/* Catch-all Fallback */}
                  <Route path="*" element={<Navigate to="/verify" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </AuthProvider>
      </WalletProvider>
    </Router>
  );
};

export default App;
