import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { QuizImportPage } from "./pages/QuizImportPage";

import "./styles.css";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 14, color: "#888" }}>Đang tải…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.email !== "admin@sotam.test") return <div style={{ padding: 20 }}>Truy cập bị từ chối. Chỉ email admin@sotam.test mới có quyền truy cập cổng này.</div>;
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><OverviewPage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/users" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/classes" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/quizzes" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/logs" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/quizzes/import" element={<RequireAuth><QuizImportPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
