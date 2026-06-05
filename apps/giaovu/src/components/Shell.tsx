import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

interface NavItem { to: string; icon: string; label: string; roles?: string[]; }

const NAV: NavItem[] = [
  { to: "/",           icon: "🏠", label: "Tổng quan" },
  { to: "/calendar",   icon: "📅", label: "Lịch dạy",  roles: ["teacher", "admin"] },
  { to: "/classes",    icon: "🏫", label: "Lớp học" },
  { to: "/students",   icon: "👥", label: "Học viên",   roles: ["staff", "admin", "teacher"] },
  { to: "/homework",   icon: "📝", label: "Bài tập",    roles: ["assistant", "teacher", "admin"] },
  { to: "/staff",      icon: "👤", label: "Nhân sự",    roles: ["staff", "admin"] },
];

export function Shell({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const visibleNav = NAV.filter((n) =>
    !n.roles || n.roles.includes(user?.role ?? ""),
  );

  const roleLabel: Record<string, string> = {
    teacher:   "Giáo viên",
    admin:     "Quản trị viên",
    staff:     "Nhân viên",
    assistant: "Trợ giảng",
  };

  return (
    <div className="gv-shell">
      {/* Sidebar */}
      <aside className="gv-sidebar">
        <Link to="/" className="gv-sidebar-brand">
          <img src="/chuxin-logo.jpg" alt="Sơ Tâm" />
          <div className="gv-sidebar-brand-text">
            <span className="gv-sidebar-brand-title">Sơ Tâm</span>
            <span className="gv-sidebar-brand-sub">Giáo Vụ</span>
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
          <span className="gv-topbar-title">{title ?? "Cổng Giáo Vụ"}</span>
          <div className="gv-topbar-right">
            <span className="muted" style={{ fontSize: 13 }}>{user?.email}</span>
          </div>
        </div>
        <div className="gv-content">{children}</div>
      </div>
    </div>
  );
}
