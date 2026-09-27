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
      <footer className="sotam-footer">
        <div className="container footer-grid">
          <div className="footer-col">
            <h3 className="footer-brand">Hán ngữ Sơ Tâm</h3>
            <p>Khởi đầu từ đam mê, vươn xa cùng Hán ngữ.</p>

          </div>
          <div className="footer-col">
            <h3>Liên hệ</h3>
            <p>📍 Địa chỉ: Cao Lỗ, Ho Chi Minh City, Vietnam</p>
            <p>📞 Điện thoại: 0989 175 437</p>
            <p>✉️ Email: hanngusotam@gmail.com</p>
            <p>🌐 Website: hanngusotam.com</p>
            <p style={{ marginTop: 12 }}>🕒 <strong>Giờ làm việc (UTC+7):</strong></p>
            <p>08:00 - 22:30 (Thứ 2 - Thứ 7)</p>
            <p>08:00 - 12:00 (Chủ nhật)</p>
          </div>
                              <div className="footer-col footer-col-course">
            <h3 className="desktop-only">Khóa học</h3>
            <h3 className="mobile-only">Liên lạc với chúng tôi</h3>
            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/course/han1">HSK 1</Link>
              <Link to="/course/han2">HSK 2</Link>
              <Link to="/course/han3">HSK 3</Link>
              <Link to="/course/han4">HSK 4</Link>
            </div>
            {/* The mobile inline contacts have been removed so it's empty on mobile, leaving space for the floating contacts! */}
            <div className="mobile-only" style={{ height: '200px' }} />
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Hán ngữ Sơ Tâm. All rights reserved.</p>
        </div>
      </footer>
      <FloatingContact />
    </AuthProvider>
  );
}

// Always-visible links (with optional sub-items for dropdown)
const PUBLIC_LINKS = [
  {
    to: "/#gioi-thieu",
    label: "Về chúng tôi",
    icon: "",
    sub: [
      { to: "/#gioi-thieu", label: "Giới thiệu trung tâm" },
      { to: "/#giao-vien",  label: "Đội ngũ giáo viên" },
    ],
  },
  {
    to: "/#courses",
    label: "Khóa học",
    icon: "",
    sub: [
      { to: "/course/han1", label: "HSK 1" },
      { to: "/course/han2", label: "HSK 2" },
      { to: "/course/han3", label: "HSK 3" },
      { to: "/course/han4", label: "HSK 4" },
      { to: "/course/han5", label: "HSK 5" },
      { to: "/course/han6", label: "HSK 6" },
      { to: "/course/thuong-mai", label: "Thương mại" },
      { to: "/course/tre-em", label: "Trẻ em" },
    ],
  },
  {
    to: "/#lich-khai-giang",
    label: "Lịch khai giảng",
    icon: "",
    sub: [],
  },
  {
    to: "/thu-vien",
    label: "Thư viện",
    icon: "",
    sub: [
      { to: "/thu-vien?cap=so",    label: "Sơ cấp" },
      { to: "/thu-vien?cap=trung", label: "Trung cấp" },
      { to: "/thu-vien?cap=cao",   label: "Cao cấp" },
    ],
  },
];

const ALL_SUB_LINKS = PUBLIC_LINKS.flatMap(l => l.sub);

// Games submenu — only rendered when logged in
const GAME_LINKS = [
  { to: "/pinyin",              label: "Ngữ âm",             icon: "🔊" },
  { to: "/word-search",         label: "Tìm từ",              icon: "🔍" },
  { to: "/bingo",                label: "Bingo",               icon: "🎯" },
  { to: "/bai-tap-tuong-tac",   label: "Bài tập tương tác",  icon: "🎮" },
];

function NavDropdown({ link }: { link: typeof PUBLIC_LINKS[number] }) {
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
    <div className="nav-dropdown" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="nav-dropdown-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {link.label} <span className="nav-dropdown-caret">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="nav-dropdown-menu">
          <Link to={link.to} className="nav-dropdown-item nav-dropdown-item--header" onClick={() => setOpen(false)}>
            {link.icon} {link.label}
          </Link>
          <div className="nav-dropdown-divider" />
          {link.sub.map((s) => (
            <Link key={s.to} to={s.to} className="nav-dropdown-item" onClick={() => setOpen(false)}>
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
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
    <div className="nav-dropdown" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
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
  const [activeMenu, setActiveMenu] = useState(0);
  const [activeMobileSub, setActiveMobileSub] = useState<typeof PUBLIC_LINKS[number] | null>(null);
  const [hidden, setHidden] = useState(false);
  const { user, role, logout } = useAuth();
  const [consultOpen, setConsultOpen] = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const location = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > 500 && currentY > lastY) {
        setHidden(true);
        setMenuOpen(false);
      } else {
        setHidden(false);
      }
      lastY = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <header className={`sotam-header ${hidden ? "header-hidden" : ""}`}>
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
              <Link to="/" className="nav-dropdown-btn">Trang chủ</Link>
              <Link to="/giaovu" className="nav-dropdown-btn">Lớp học</Link>
              <GamesDropdown />
            </>
          ) : role === "student" ? (
            <Link to="/" className="nav-dropdown-btn">
              {user?.classes?.[0]?.name ?? "Lớp học"}
            </Link>
          ) : (
            <>
              {PUBLIC_LINKS.map((l, i) => (
                <div key={l.to} onMouseEnter={() => setActiveMenu(i)}>
                  <Link to={l.to} className="nav-dropdown-btn" style={{ background: activeMenu === i ? 'rgba(0,0,0,0.05)' : '' }}>
                    {l.label}
                  </Link>
                </div>
              ))}
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
              <button className="btn btn-consult btn-sm desktop-only" onClick={() => setConsultOpen(true)}>
                Gọi/Zalo để tư vấn: {CONTACT.phone}
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
        <div className="mobile-drawer">

          
          <div className="mobile-drawer-body" style={{ padding: '0 20px 20px' }}>
            <div className="mobile-drawer-list">
              <a href="/#gioi-thieu" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Về chúng tôi
              </a>
              <a href="/#courses" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Khóa học
              </a>
              <a href="/#lich-khai-giang" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Lịch khai giảng
              </a>
              <a href={PUBLIC_LINKS[2].to} target="_blank" rel="noreferrer" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Thư viện
              </a>
              <a href={CONTACT.zalo} target="_blank" rel="noreferrer" className="mobile-list-item mobile-list-item--zalo" onClick={() => setMenuOpen(false)}>
                Tư vấn Zalo
              </a>
            </div>
          </div>
        </div>
      )}

      {consultOpen && <ConsultModal close={() => setConsultOpen(false)} />}
      
      {/* Sub-navbar with Slide Animation */}
      <div className="sotam-subnav-bar">
        <div key={activeMenu} className="subnav-slide-in">
          {PUBLIC_LINKS[activeMenu].sub.length > 0 && PUBLIC_LINKS[activeMenu].sub.map((s) => (
            <Link key={s.to} to={s.to} className="subnav-item">{s.label}</Link>
          ))}
        </div>
      </div>
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
  const [expandedClick, setExpandedClick] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // If we are near the bottom (in the footer)
      const isFooter = window.innerHeight + window.scrollY >= document.body.offsetHeight - 350;
      setAtFooter(isFooter);
      if (!isFooter) {
        setExpandedClick(false); // auto-close blur when scrolling away
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const buttons = [
    { label: "TikTok",    href: CONTACT.tiktok,   text: "Theo dõi trên TikTok", className: "fc-btn-tiktok",   svg: <TikTokIcon /> },
    { label: "Facebook",  href: CONTACT.facebook,  text: "Theo dõi trên Facebook", className: "fc-btn-facebook", svg: <FacebookIcon /> },
    { label: "Zalo",      href: CONTACT.zalo,      text: "Chat qua Zalo", className: "fc-btn-zalo",      svg: <ZaloIcon /> },
    { label: "Điện thoại", href: `tel:${CONTACT.phone}`, text: "Gọi điện thoại", className: "fc-btn-phone", svg: <PhoneIcon /> },
  ];

  const isExpanded = expandedClick || atFooter;
  const showBlur = expandedClick && !atFooter;

  const handleMobileClick = (e: React.MouseEvent, href: string) => {
    if (window.innerWidth <= 768 && !isExpanded) {
      e.preventDefault();
      setExpandedClick(true);
    }
  };

  return (
    <>
      {showBlur && (
        <div className="fc-backdrop" onClick={() => setExpandedClick(false)} />
      )}
      <div className={`floating-contact ${isExpanded ? "fc-expanded" : ""} ${atFooter ? "fc-at-footer" : ""}`} aria-label="Liên hệ">
        {buttons.map((b) => (
          <a key={b.label} href={b.href} className={`fc-pill ${b.className}`}
             target={b.href.startsWith("tel:") ? undefined : "_blank"}
             rel="noopener noreferrer" aria-label={b.label}
             onClick={(e) => handleMobileClick(e, b.href)}>
            <span className="fc-text">{b.text}</span>
            <span className="fc-icon">{b.svg}</span>
          </a>
        ))}
      </div>
    </>
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
    <svg viewBox="0 0 50 50" fill="currentColor" width="22" height="22">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.779 43.589C10.1019 43.846 13.0061 43.1836 15.0682 42.1825C24.0225 47.1318 38.0197 46.8954 46.4923 41.4732C46.8209 40.9803 47.1279 40.4677 47.4128 39.9363C49.1062 36.7779 50.0004 33.22 50.0004 27.1316V22.7175C50.0004 16.629 49.1062 13.0711 47.4128 9.91273C45.7385 6.75436 43.2461 4.28093 40.0877 2.58758C36.9293 0.894239 33.3714 0 27.283 0H22.8499C17.6644 0 14.2982 0.652754 11.4699 1.89893C11.3153 2.03737 11.1636 2.17818 11.0151 2.32135C2.71734 10.3203 2.08658 27.6593 9.12279 37.0782C9.13064 37.0921 9.13933 37.1061 9.14889 37.1203C10.2334 38.7185 9.18694 41.5154 7.55068 43.1516C7.28431 43.399 7.37944 43.5512 7.779 43.5892Z" fill="white"/>
      <path d="M20.5632 17H10.8382V19.0853H17.5869L10.9329 27.3317C10.7244 27.635 10.5728 27.9194 10.5728 28.5639V29.0947H19.748C20.203 29.0947 20.5822 28.7156 20.5822 28.2606V27.1421H13.4922L19.748 19.2938C19.8428 19.1801 20.0134 18.9716 20.0893 18.8768L20.1272 18.8199C20.4874 18.2891 20.5632 17.8341 20.5632 17.2844V17Z" fill="currentColor"/>
      <path d="M32.9416 29.0947H34.3255V17H32.2402V28.3933C32.2402 28.7725 32.5435 29.0947 32.9416 29.0947Z" fill="currentColor"/>
      <path d="M25.814 19.6924C23.1979 19.6924 21.0747 21.8156 21.0747 24.4317C21.0747 27.0478 23.1979 29.171 25.814 29.171C28.4301 29.171 30.5533 27.0478 30.5533 24.4317C30.5723 21.8156 28.4491 19.6924 25.814 19.6924ZM25.814 27.2184C24.2785 27.2184 23.0273 25.9672 23.0273 24.4317C23.0273 22.8962 24.2785 21.645 25.814 21.645C27.3495 21.645 28.6007 22.8962 28.6007 24.4317C28.6007 25.9672 27.3685 27.2184 25.814 27.2184Z" fill="currentColor"/>
      <path d="M40.4867 19.6162C37.8516 19.6162 35.7095 21.7584 35.7095 24.3934C35.7095 27.0285 37.8516 29.1707 40.4867 29.1707C43.1217 29.1707 45.2639 27.0285 45.2639 24.3934C45.2639 21.7584 43.1217 19.6162 40.4867 19.6162ZM40.4867 27.2181C38.9322 27.2181 37.681 25.9669 37.681 24.4124C37.681 22.8579 38.9322 21.6067 40.4867 21.6067C42.0412 21.6067 43.2924 22.8579 43.2924 24.4124C43.2924 25.9669 42.0412 27.2181 40.4867 27.2181Z" fill="currentColor"/>
      <path d="M29.4562 29.0944H30.5747V19.957H28.6221V28.2793C28.6221 28.7153 29.0012 29.0944 29.4562 29.0944Z" fill="currentColor"/>
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

