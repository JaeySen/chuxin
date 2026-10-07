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
            <h3>Khóa học</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/khoa-hoc/hsk1">HSK 1</Link>
              <Link to="/khoa-hoc/hsk2">HSK 2</Link>
              <Link to="/khoa-hoc/hsk3">HSK 3</Link>
              <Link to="/khoa-hoc/hsk4">HSK 4</Link>
              <Link to="/khoa-hoc/hsk5">HSK 5</Link>
              <Link to="/khoa-hoc/hsk6">HSK 6</Link>
              <Link to="/khoa-hoc/tieng-trung-tre-em">Tiếng Trung Trẻ em</Link>
              <Link to="/khoa-hoc/tieng-trung-thuong-mai">Tiếng Trung Thương mại</Link>
            </div>
            <div className="mobile-only" style={{ height: '100px' }} />
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

const MAIN_NAV = [
  { to: "/#gioi-thieu", label: "Giới thiệu" },
  { to: "/#courses", label: "Khóa học" },
  { to: "/#lich-khai-giang", label: "Lịch khai giảng" },
  { to: "/#giao-vien", label: "Giáo viên" },
];

// Games submenu — only rendered when logged in
const GAME_LINKS = [
  { to: "/pinyin",              label: "Ngữ âm",             icon: "🔊" },
  { to: "/word-search",         label: "Tìm từ",              icon: "🔍" },
  { to: "/bingo",                label: "Bingo",               icon: "🎯" },
  { to: "/bai-tap-tuong-tac",   label: "Bài tập tương tác",  icon: "🎮" },
];

function LibraryDropdown() {
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
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
      <button className="nav-dropdown-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ fontFamily: 'inherit' }}>
        Thư viện <span className="nav-dropdown-caret">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="nav-dropdown-menu" style={{ width: 220 }}>
          <div 
            className="nav-dropdown-item has-submenu" 
            onMouseEnter={() => setSubOpen(true)} 
            onMouseLeave={() => setSubOpen(false)}
            style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            Học liệu các cấp <span>▸</span>
            {subOpen && (
              <div className="nav-dropdown-menu" style={{ position: 'absolute', left: '100%', top: -8, width: 160, display: 'block' }}>
                <Link to="/thu-vien/hoc-lieu/so-cap" className="nav-dropdown-item" onClick={() => setOpen(false)}>Sơ cấp</Link>
                <Link to="/thu-vien/hoc-lieu/trung-cap" className="nav-dropdown-item" onClick={() => setOpen(false)}>Trung cấp</Link>
                <Link to="/thu-vien/hoc-lieu/cao-cap" className="nav-dropdown-item" onClick={() => setOpen(false)}>Cao cấp</Link>
              </div>
            )}
          </div>
          <a href="/thu-vien/video-giang-day-thu" target="_blank" rel="noreferrer" className="nav-dropdown-item" onClick={() => setOpen(false)}>Video giảng dạy thử</a>
          <a href="/thu-vien/blog" target="_blank" rel="noreferrer" className="nav-dropdown-item" onClick={() => setOpen(false)}>Blog</a>
          <div className="nav-dropdown-divider" style={{ margin: '8px 0', borderTop: '1px solid var(--c-divider)' }} />
          <a href="https://thuchanh.hanngusotam.com" target="_blank" rel="noreferrer" className="nav-dropdown-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setOpen(false)}>Bài tập trực tuyến <svg style={{ marginLeft: 4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>
          <a href="https://giaovu.hanngusotam.com" target="_blank" rel="noreferrer" className="nav-dropdown-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setOpen(false)}>Hỗ trợ giáo viên <svg style={{ marginLeft: 4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>
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
  const [hidden, setHidden] = useState(false);
  const { user, role, logout } = useAuth();
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

  return (
    <header className={`sotam-header ${hidden ? "header-hidden" : ""}`}>
      <div className="sotam-header-inner">
        {/* Brand */}
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <img src="/chuxin-logo.webp" alt="Sơ Tâm" className="brand-mark" />
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
              {MAIN_NAV.map((l) => (
                <div key={l.to}>
                  {l.to.startsWith("/#") ? (
                    <a href={l.to} className="nav-dropdown-btn" onClick={(e) => {
                      e.preventDefault();
                      const id = l.to.replace("/#", "");
                      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                    }}>{l.label}</a>
                  ) : (
                    <Link to={l.to} className="nav-dropdown-btn">{l.label}</Link>
                  )}
                </div>
              ))}
              <LibraryDropdown />
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
              <a href={CONTACT.zalo} target="_blank" rel="noreferrer" className="btn btn-consult btn-sm desktop-only" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ZaloIcon /> Liên hệ tư vấn: {CONTACT.phone}
              </a>
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
              {MAIN_NAV.map((l) => (
                l.to.startsWith("/#") ? (
                  <a key={l.to} href={l.to} className="mobile-list-item" onClick={(e) => {
                    setMenuOpen(false);
                    const id = l.to.replace("/#", "");
                    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
                  }}>{l.label}</a>
                ) : (
                  <Link key={l.to} to={l.to} className="mobile-list-item" onClick={() => setMenuOpen(false)}>{l.label}</Link>
                )
              ))}
              <div className="mobile-list-item" style={{ fontWeight: 600, color: 'var(--c-red-dark)', marginTop: 8, paddingBottom: 4 }}>Thư viện</div>
              <Link to="/thu-vien/hoc-lieu/so-cap" className="mobile-list-item" style={{ paddingLeft: 16 }} onClick={() => setMenuOpen(false)}>Học liệu Sơ cấp</Link>
              <Link to="/thu-vien/hoc-lieu/trung-cap" className="mobile-list-item" style={{ paddingLeft: 16 }} onClick={() => setMenuOpen(false)}>Học liệu Trung cấp</Link>
              <Link to="/thu-vien/hoc-lieu/cao-cap" className="mobile-list-item" style={{ paddingLeft: 16 }} onClick={() => setMenuOpen(false)}>Học liệu Cao cấp</Link>
              <a href="/thu-vien/video-giang-day-thu" target="_blank" rel="noreferrer" className="mobile-list-item" style={{ paddingLeft: 16 }} onClick={() => setMenuOpen(false)}>Video giảng dạy thử</a>
              <a href="/thu-vien/blog" target="_blank" rel="noreferrer" className="mobile-list-item" style={{ paddingLeft: 16 }} onClick={() => setMenuOpen(false)}>Blog</a>
              
              <div className="mobile-list-item" style={{ fontWeight: 600, color: 'var(--c-red-dark)', marginTop: 8, paddingBottom: 4 }}>Dành cho Hệ thống</div>
              <a href="https://thuchanh.hanngusotam.com" target="_blank" rel="noreferrer" className="mobile-list-item" style={{ paddingLeft: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setMenuOpen(false)}><span>Bài tập trực tuyến</span> <svg style={{ marginLeft: 4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>
              <a href="https://giaovu.hanngusotam.com" target="_blank" rel="noreferrer" className="mobile-list-item" style={{ paddingLeft: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setMenuOpen(false)}><span>Hỗ trợ giáo viên</span> <svg style={{ marginLeft: 4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
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
  return <img src="/zalo-icon.webp" width="22" height="22" alt="Zalo" style={{ display: 'block', borderRadius: '50%' }} />;
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );
}

