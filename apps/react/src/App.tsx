import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiAuthConfig, type AuthConfig } from "./lib/api";

export function App() {
  return (
    <AuthProvider>
      <Header />
      <main>
        <Outlet />
      </main>
    </AuthProvider>
  );
}

// Always-visible links
const PUBLIC_LINKS = [
  { to: "/courses",      label: "Các khoá học",  icon: "📚" },
  { to: "/thu-vien",     label: "Thư viện",       icon: "📄" },
  { to: "/ve-chung-toi", label: "Về chúng tôi",   icon: "🏫" },
];

// Games submenu — only rendered when logged in
const GAME_LINKS = [
  { to: "/pinyin",      label: "Ngữ âm",  icon: "🔊" },
  { to: "/word-search", label: "Tìm từ",  icon: "🔍" },
  { to: "/bingo",       label: "Bingo",   icon: "🎯" },
];

function GamesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="nav-dropdown" ref={ref}>
      <button
        className="nav-dropdown-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        🎮 Trò chơi <span className="nav-dropdown-caret">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="nav-dropdown-menu">
          {GAME_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="nav-dropdown-item">
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user, role, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const location = useLocation();
  const nav = useNavigate();

  async function handleLogout() {
    await logout();
    nav("/");
  }

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".sotam-header")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const mobileTiles = [
    ...PUBLIC_LINKS,
    ...(user ? GAME_LINKS : []),
  ];

  return (
    <header className="sotam-header">
      <div className="sotam-header-inner">
        {/* Brand */}
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <img src="/chuxin-logo.jpg" alt="Sơ Tâm" className="brand-mark" />
          <span>Hán ngữ Sơ Tâm</span>
        </Link>

        {/* Desktop nav */}
        <nav className="sotam-nav sotam-nav--desktop">
          {role === "admin" ? (
            <Link to="/admin" style={{ color: "var(--c-red)", fontWeight: 700 }}>⚙ Quản trị</Link>
          ) : role === "teacher" ? (
            <>
              <Link to="/" className="nav-class-tab">Trang chủ</Link>
              <Link to="/giaovu" className="nav-class-tab">Lớp học</Link>
              <GamesDropdown />
            </>
          ) : role === "student" ? (
            <Link to="/" className="nav-class-tab">
              {user?.classes?.[0]?.name ?? "Lớp học"}
            </Link>
          ) : (
            <>
              {PUBLIC_LINKS.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
              {user && <GamesDropdown />}
            </>
          )}
        </nav>

        {/* Right cluster: auth + hamburger */}
        <div className="sotam-header-right">
          <div className="sotam-auth">
            {user ? (
              <div className="sotam-user">
                <span className="sotam-user-name">{user.displayName ?? user.email}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Đăng xuất</button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
                Đăng nhập
              </button>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className={`hamburger ${menuOpen ? "hamburger--open" : ""}`}
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile nav drawer — absolute overlay, doesn't push content */}
      {menuOpen && (
        <nav className="sotam-nav--mobile">
          <div className="sotam-nav--mobile-grid">
            {role === "admin" ? (
              <Link to="/admin" className="nav-tile nav-tile--admin">
                <span className="nav-tile-icon">⚙</span>
                <span className="nav-tile-label">Quản trị</span>
              </Link>
            ) : role === "teacher" ? (
              <>
                <Link to="/giaovu" className="nav-tile" onClick={() => setMenuOpen(false)}>
                  <span className="nav-tile-icon">🏫</span>
                  <span className="nav-tile-label">Lớp học</span>
                </Link>
                <Link to="/word-search" className="nav-tile" onClick={() => setMenuOpen(false)}>
                  <span className="nav-tile-icon">🔍</span>
                  <span className="nav-tile-label">Tìm từ</span>
                </Link>
                <Link to="/bingo" className="nav-tile" onClick={() => setMenuOpen(false)}>
                  <span className="nav-tile-icon">🎯</span>
                  <span className="nav-tile-label">Bingo</span>
                </Link>
                <Link to="/pinyin" className="nav-tile" onClick={() => setMenuOpen(false)}>
                  <span className="nav-tile-icon">🔊</span>
                  <span className="nav-tile-label">Pinyin</span>
                </Link>
              </>
            ) : role === "student" ? (
              <Link to="/" className="nav-tile">
                <span className="nav-tile-icon">🏫</span>
                <span className="nav-tile-label">{user?.classes?.[0]?.name ?? "Lớp học"}</span>
              </Link>
            ) : (
              mobileTiles.map((l) => (
                <Link key={l.to} to={l.to} className="nav-tile">
                  <span className="nav-tile-icon">{l.icon}</span>
                  <span className="nav-tile-label">{l.label}</span>
                </Link>
              ))
            )}
          </div>
        </nav>
      )}

      {modalOpen && <SignInModal close={() => setModalOpen(false)} />}
    </header>
  );
}

// ── Phone helpers ─────────────────────────────────────────────────
function stripNonDigits(v: string) {
  return v.replace(/\D/g, "");
}

// ── Sign-in only modal (signup removed — admin creates accounts) ──
function SignInModal({ close }: { close: () => void }) {
  const { signIn } = useAuth();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw]       = useState("");
  const [err, setErr]     = useState<string | null>(null);
  const [busy, setBusy]   = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { apiAuthConfig().then(setConfig); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [close]);

  useEffect(() => {
    cardRef.current?.querySelector<HTMLElement>("input")?.focus();
  }, [config]);

  const usePhone = !!(config?.disableEmailLogin && config?.allowPhoneLogin);

  async function handleSignIn() {
    setBusy(true); setErr(null);
    try {
      await signIn(usePhone ? { phone, password: pw } : { email, password: pw });
      close();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  const modal = (
    <div className="sotam-modal" role="dialog" aria-modal="true" onClick={close}>
      <div className="sotam-modal-card" ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <h3>Đăng nhập</h3>

        {config === null && <div className="muted" style={{ fontSize: 14 }}>Đang tải…</div>}

        {config !== null && (
          <>
            {usePhone ? (
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Số điện thoại (VD: 0901234567)"
                value={phone}
                onChange={(e) => setPhone(stripNonDigits(e.target.value))}
                autoComplete="tel"
              />
            ) : (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            )}

            <input
              type="password"
              placeholder="Mật khẩu"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === "Enter") handleSignIn(); }}
            />

            {err && <div className="feedback feedback-bad" style={{ marginTop: 0 }}>{err}</div>}

            <div className="modal-actions">
              <button className="btn btn-primary" disabled={busy} onClick={handleSignIn}>
                {busy ? "Đang đăng nhập…" : "Đăng nhập"}
              </button>
            </div>
          </>
        )}

        <button className="btn btn-text close-x" onClick={close} aria-label="Đóng">✕</button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
