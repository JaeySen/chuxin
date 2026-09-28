import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

interface NavItem { to: string; icon: string; label: string; roles?: string[]; }

const NAV: NavItem[] = [
  { to: "/",           icon: "🏠", label: "Tổng quan" },
  { to: "/class/hsk1", icon: "🏫", label: "Lớp HSK 1 - K23" },
  { to: "/class/hsk2", icon: "🏫", label: "Lớp HSK 2 - K24" },
];

export function Shell({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const visibleNav = NAV.filter((n) =>
    !n.roles || n.roles.includes(user?.role ?? ""),
  );

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
          {visibleNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`gv-nav-link ${location.pathname === n.to ? "active" : ""}`}
            >
              <span className="gv-nav-icon">{n.icon}</span>
              {n.label}
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
