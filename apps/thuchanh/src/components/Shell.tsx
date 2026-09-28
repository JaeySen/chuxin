import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api";



export function Shell({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (user) {
      apiFetch<{ id: string; name: string }[]>("/classes")
        .then(setClasses)
        .catch(console.error);
    }
  }, [user]);

  const roleLabel: Record<string, string> = {
    student: "Học viên",
  };

  return (
    <div className="gv-shell">
      {/* Sidebar */}
      <aside className="gv-sidebar">
        <Link to="/" className="gv-sidebar-brand">
          <img src="/chuxin-logo.jpg" alt="Sơ Tâm" />
          <div className="gv-sidebar-brand-text">
            <span className="gv-sidebar-brand-title">Sơ Tâm</span>
            <span className="gv-sidebar-brand-sub">Học Viên</span>
          </div>
        </Link>

        <nav className="gv-sidebar-nav">
          <div className="gv-nav-section">Menu</div>
          <Link to="/" className={`gv-nav-link ${location.pathname === "/" ? "active" : ""}`}>
            <span className="gv-nav-icon">🏠</span> Tổng quan
          </Link>
          {classes.map((c) => (
            <Link
              key={c.id}
              to={`/class/${c.id}`}
              className={`gv-nav-link ${location.pathname.startsWith(`/class/${c.id}`) ? "active" : ""}`}
            >
              <span className="gv-nav-icon">🏫</span> {c.name}
            </Link>
          ))}
        </nav>

        <div className="gv-sidebar-footer">
          <div className="gv-sidebar-user">
            <strong>{user?.displayName}</strong>
            <span>{roleLabel[user?.role ?? ""] ?? user?.role}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}
            style={{ color: "rgba(255,255,255,0.6)", width: "100%", justifyContent: "flex-start", marginTop: 4 }}>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="gv-main">
        <div className="gv-topbar">
          <span className="gv-topbar-title">{title ?? "Cổng Học Viên"}</span>
          <div className="gv-topbar-right">
            <span className="muted" style={{ fontSize: 13 }}>{user?.email}</span>
          </div>
        </div>
        <div className="gv-content">{children}</div>
      </div>
    </div>
  );
}
