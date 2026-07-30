import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ── Contact details — update here only ───────────────────────────────────────
const CONTACT = {
  phone:    "0989175437",
  zalo:     "https://zalo.me/0989175437",
  facebook: "https://www.facebook.com/profile.php?id=61588907533663",
  tiktok:   "https://www.tiktok.com/@hanngusotam",
};

export function App() {
  return (
    <AuthProvider>
      <Header />
      <main>
        <Outlet />
      </main>
      <FloatingContact />
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
  const [consultOpen, setConsultOpen] = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
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
              <button className="btn btn-consult btn-sm" onClick={() => setConsultOpen(true)}>
                Tư vấn: {CONTACT.phone}
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

      {consultOpen && <ConsultModal close={() => setConsultOpen(false)} />}
    </header>
  );
}

// ── Consultation / Zalo modal ────────────────────────────────────────────────
function ConsultModal({ close }: { close: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [close]);

  function openZalo() {
    window.open(CONTACT.zalo, "_blank", "noopener,noreferrer");
    close();
  }

  const modal = (
    <div className="sotam-modal" role="dialog" aria-modal="true" onClick={close}>
      <div className="sotam-modal-card consult-modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="consult-modal-label">Liên hệ tư vấn khoá học</p>
        <p className="consult-modal-phone">{CONTACT.phone}</p>
        <p className="consult-modal-hint">Nhắn tin qua Zalo để được tư vấn nhanh nhất.</p>
        <div className="modal-actions" style={{ flexDirection: "column", gap: 10 }}>
          <button className="btn btn-consult" style={{ width: "100%", justifyContent: "center" }} onClick={openZalo}>
            Mở Zalo nhắn tin
          </button>
          <a href={`tel:${CONTACT.phone}`} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>
            Gọi điện trực tiếp
          </a>
        </div>
        <button className="btn btn-text close-x" onClick={close} aria-label="Đóng">✕</button>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}

// ── Floating contact bar ──────────────────────────────────────────────────────
function FloatingContact() {
  const buttons = [
    { label: "TikTok",    href: CONTACT.tiktok,   className: "fc-btn--tiktok",    svg: <TikTokIcon /> },
    { label: "Facebook",  href: CONTACT.facebook,  className: "fc-btn--facebook",  svg: <FacebookIcon /> },
    { label: "Zalo",      href: CONTACT.zalo,      className: "fc-btn--zalo",      svg: <ZaloIcon /> },
    { label: "Điện thoại", href: `tel:${CONTACT.phone}`, className: "fc-btn--phone", svg: <PhoneIcon /> },
  ];
  return (
    <div className="floating-contact" aria-label="Liên hệ">
      {buttons.map((b) => (
        <a key={b.label} href={b.href} className={`fc-btn ${b.className}`}
           target={b.href.startsWith("tel:") ? undefined : "_blank"}
           rel="noopener noreferrer" aria-label={b.label}>
          {b.svg}
        </a>
      ))}
    </div>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.885v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}
function ZaloIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.01 16.492c-.23.336-.57.508-.96.508-.19 0-.386-.046-.567-.143l-2.44-1.373c-.44-.247-.714-.71-.714-1.213V9.63c0-.776.63-1.406 1.406-1.406.777 0 1.407.63 1.407 1.406v3.696l1.822 1.026c.672.378.912 1.232.534 1.904l.512.236zm-7.874.1c-2.95 0-5.346-2.395-5.346-5.346s2.395-5.346 5.346-5.346c1.475 0 2.81.598 3.782 1.566l-1.992 1.992a2.584 2.584 0 0 0-1.79-.714c-1.43 0-2.592 1.161-2.592 2.592s1.161 2.592 2.592 2.592c1.103 0 2.045-.693 2.424-1.668H9.136v-2.5h5.518c.063.322.096.655.096.996 0 2.95-2.395 5.346-5.346 5.346l-.268-.51z"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );
}

