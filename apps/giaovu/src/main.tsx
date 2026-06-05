import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { CalendarPage } from "./pages/CalendarPage";
import { ClassesPage } from "./pages/ClassesPage";
import { ClassDetailPage } from "./pages/ClassDetailPage";
import { CheckinPage } from "./pages/CheckinPage";
import { HomeworkListPage, HomeworkDetailPage } from "./pages/HomeworkPage";
import { StudentsPage } from "./pages/StudentsPage";
import { StaffPage } from "./pages/StaffPage";
import "./styles.css";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 14, color: "#888" }}>Đang tải…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><OverviewPage /></RequireAuth>} />
          <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
          <Route path="/classes" element={<RequireAuth><ClassesPage /></RequireAuth>} />
          <Route path="/classes/:id" element={<RequireAuth><ClassDetailPage /></RequireAuth>} />
          <Route path="/sessions/:sessionId" element={<RequireAuth><CheckinPage /></RequireAuth>} />
          <Route path="/homework" element={<RequireAuth><HomeworkListPage /></RequireAuth>} />
          <Route path="/homework/:materialId" element={<RequireAuth><HomeworkDetailPage /></RequireAuth>} />
          <Route path="/students" element={<RequireAuth><StudentsPage /></RequireAuth>} />
          <Route path="/staff" element={<RequireAuth><StaffPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
