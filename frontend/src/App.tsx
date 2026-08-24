import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Navbar from "./components/Navbar";
import PublicVerifyPage from "./pages/PublicVerifyPage";
import DashboardPage from "./pages/DashboardPage";

export const App: React.FC = () => {
  return (
    <Router>
      <WalletProvider>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-primary, #0a0e17)",
            color: "var(--text-primary, #f9fafb)",
          }}
        >
          <Navbar />

          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<PublicVerifyPage />} />
              <Route path="/verify" element={<PublicVerifyPage />} />
              <Route path="/verify/:passportId" element={<PublicVerifyPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
      </WalletProvider>
    </Router>
  );
};

export default App;
