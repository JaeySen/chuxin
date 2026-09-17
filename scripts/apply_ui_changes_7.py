import os
import re

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"
shared_dir = "/Users/tranngochienlong/chuxin/packages/shared/src"

# 1. Update shared/src/course.ts
course_ts_path = os.path.join(shared_dir, "course.ts")
with open(course_ts_path, "r") as f:
    course_ts = f.read()

course_ts = course_ts.replace('z.enum(["han1-2"', 'z.enum(["han1", "han2"')
course_ts = course_ts.replace(
"""  { id: "han1-2", title: "Hán ngữ 1 & 2", subtitle: "HSK 1-2 — Khởi đầu & Tiếp nối", order: 1, color: "#c64a1f", status: "ongoing", lessonIds: [], brochureUrl: "/brochure-hsk1-2.pdf" },""",
"""  { id: "han1", title: "Hán ngữ 1", subtitle: "HSK 1 — Khởi đầu", order: 1, color: "#c64a1f", status: "ongoing", lessonIds: [], brochureUrl: "/brochure-hsk1-2.pdf" },
  { id: "han2", title: "Hán ngữ 2", subtitle: "HSK 2 — Tiếp nối", order: 2, color: "#d97a1b", status: "ongoing", lessonIds: [], brochureUrl: "/brochure-hsk1-2.pdf" },""")

with open(course_ts_path, "w") as f:
    f.write(course_ts)

# 2. Update shared/src/curriculum.ts
curr_ts_path = os.path.join(shared_dir, "curriculum.ts")
with open(curr_ts_path, "r") as f:
    curr_ts = f.read()

curr_ts = curr_ts.replace('course: "han1-2"', 'course: "han1"')
curr_ts = curr_ts.replace('  "han1-2": HSK1_CHAPTERS,', '  han1: HSK1_CHAPTERS,\n  han2: [],')

with open(curr_ts_path, "w") as f:
    f.write(curr_ts)

# 3. Update App.tsx
app_tsx_path = os.path.join(base_dir, "App.tsx")
with open(app_tsx_path, "r") as f:
    app_tsx = f.read()

# Fix PUBLIC_LINKS for han1 and han2
app_tsx = app_tsx.replace('{ to: "/course/han1-2", label: "Hán ngữ 1 & 2 (HSK 1-2)" },', 
"""{ to: "/course/han1", label: "Hán ngữ 1 (HSK 1)" },
      { to: "/course/han2", label: "Hán ngữ 2 (HSK 2)" },""")

# Add mobile menu state and logic
MOBILE_STATE = """  const [activeMenu, setActiveMenu] = useState(0);
  const [activeMobileSub, setActiveMobileSub] = useState<typeof PUBLIC_LINKS[number] | null>(null);
  const [hidden, setHidden] = useState(false);"""
app_tsx = app_tsx.replace("""  const [activeMenu, setActiveMenu] = useState(0);
  const [hidden, setHidden] = useState(false);""", MOBILE_STATE)

MOBILE_HIDE = """      if (currentY > 500 && currentY > lastY) {
        setHidden(true);
        setMenuOpen(false);"""
app_tsx = app_tsx.replace("""      if (currentY > 500 && currentY > lastY) {
        setHidden(true);""", MOBILE_HIDE)

app_tsx = app_tsx.replace("""  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as HTMLElement;
      if (!target.closest(".sotam-nav--mobile") && !target.closest(".hamburger")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);""", """  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as HTMLElement;
      if (!target.closest(".sotam-nav--mobile") && !target.closest(".hamburger")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) setActiveMobileSub(null);
  }, [menuOpen]);""")

MOBILE_MENU_JSX = """            ) : role === "student" ? (
              <Link to="/" className="nav-tile">
                <span className="nav-tile-icon">🏫</span>
                <span className="nav-tile-label">{user?.classes?.[0]?.name ?? "Lớp học"}</span>
              </Link>
            ) : activeMobileSub ? (
              <div className="mobile-sub-menu slide-in-right" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="nav-tile" onClick={() => setActiveMobileSub(null)} style={{ background: "rgba(0,0,0,0.05)" }}>
                  <span className="nav-tile-icon">←</span>
                  <span className="nav-tile-label">Quay lại</span>
                </button>
                <div style={{ padding: "10px 16px", fontWeight: "bold", color: "var(--c-red-dark)" }}>{activeMobileSub.label}</div>
                {activeMobileSub.sub?.map((s) => (
                  <Link key={s.to} to={s.to} className="nav-tile" onClick={() => { setMenuOpen(false); setActiveMobileSub(null); }}>
                    <span className="nav-tile-label">{s.label}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mobile-main-menu" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PUBLIC_LINKS.map((l) => (
                  <button key={l.to} className="nav-tile" onClick={() => l.sub ? setActiveMobileSub(l) : (setMenuOpen(false), nav(l.to))}>
                    <span className="nav-tile-icon">{l.icon}</span>
                    <span className="nav-tile-label">{l.label}</span>
                    {l.sub && <span className="nav-tile-icon" style={{ marginLeft: "auto", background: "none" }}>›</span>}
                  </button>
                ))}
                
                <div className="mobile-contact-section" style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <a href={CONTACT.zalo} target="_blank" rel="noreferrer" className="btn btn-consult" style={{ width: "100%", justifyContent: "center" }}>
                    Chat qua Zalo
                  </a>
                  <a href={`tel:${CONTACT.phone}`} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>
                    Gọi: {CONTACT.phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </nav>
      )}"""

# We need to replace the entire mobile drawer part carefully.
# The mobile menu part starts at `<nav className="sotam-nav--mobile">` and ends at `</nav>\n      )}`
# Let's just find `            ) : role === "student" ? (`
# and replace down to the end of the nav.
import re
app_tsx = re.sub(
    r'\) : role === "student" \? \(\n\s*<Link to="/" className="nav-tile">\n\s*<span className="nav-tile-icon">🏫</span>\n\s*<span className="nav-tile-label">\{user\?\.classes\?\.\[0\]\?\.name \?\? "Lớp học"\}</span>\n\s*</Link>\n\s*\) : \(\n\s*mobileTiles\.map\(\(l\) => \(\n\s*<Link key=\{l\.to\} to=\{l\.to\} className="nav-tile">\n\s*<span className="nav-tile-icon">\{l\.icon\}</span>\n\s*<span className="nav-tile-label">\{l\.label\}</span>\n\s*</Link>\n\s*\)\)\n\s*\)\}\n\s*</div>\n\s*</nav>\n\s*\)\}',
    MOBILE_MENU_JSX, 
    app_tsx
)

# Replace FloatingContact component
FLOATING_CONTACT = """function FloatingContact() {
  const buttons = [
    { label: "TikTok",    href: CONTACT.tiktok,   text: "Tiktok",    svg: <TikTokIcon /> },
    { label: "Facebook",  href: CONTACT.facebook,  text: "Facebook",  svg: <FacebookIcon /> },
    { label: "Zalo",      href: CONTACT.zalo,      text: "Zalo",      svg: <ZaloIcon /> },
    { label: "Điện thoại", href: `tel:${CONTACT.phone}`, text: "Gọi điện", svg: <PhoneIcon /> },
  ];
  return (
    <div className="floating-contact" aria-label="Liên hệ">
      {buttons.map((b) => (
        <a key={b.label} href={b.href} className="fc-pill"
           target={b.href.startsWith("tel:") ? undefined : "_blank"}
           rel="noopener noreferrer" aria-label={b.label}>
          <span className="fc-text">{b.text}</span>
          <span className="fc-icon">{b.svg}</span>
        </a>
      ))}
    </div>
  );
}"""

app_tsx = re.sub(r'function FloatingContact\(\) \{[\s\S]*?</div>\n  \);\n}', FLOATING_CONTACT, app_tsx)

with open(app_tsx_path, "w") as f:
    f.write(app_tsx)

print("Done App.tsx")
