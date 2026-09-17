import os
import re

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"
shared_dir = "/Users/tranngochienlong/chuxin/packages/shared/src"

# 1. Update shared/src/course.ts
course_ts_path = os.path.join(shared_dir, "course.ts")
with open(course_ts_path, "r") as f:
    course_ts = f.read()

course_ts = course_ts.replace('"han1-2"', '"han1", "han2"')
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

curr_ts = curr_ts.replace('"han1-2"', '"han1"')
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
                  <Link key={s.to} to={s.to} className="nav-tile" onClick={() => setMenuOpen(false)}>
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
            )}"""

app_tsx = re.sub(r'\) : role === "student" \? \([\s\S]*?\)\n            \)}', MOBILE_MENU_JSX, app_tsx)

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

# 4. Update Home.tsx
home_tsx_path = os.path.join(base_dir, "pages/Home.tsx")
with open(home_tsx_path, "r") as f:
    home_tsx = f.read()

# Remove games icons
home_tsx = home_tsx.replace('<div className="game-card-icon">{g.icon}</div>', '')

# Add "Xem chi tiết" button to courses
home_tsx = home_tsx.replace("""<div className="tile-bar" style={{ background: c.color }} />
          </Link>""", """<div className="tile-bar" style={{ background: c.color }} />
            <div className="course-view-btn" style={{ color: c.color }}>Xem chi tiết →</div>
          </Link>""")

with open(home_tsx_path, "w") as f:
    f.write(home_tsx)


# 5. Update CoursePage.tsx
course_tsx_path = os.path.join(base_dir, "pages/CoursePage.tsx")
with open(course_tsx_path, "r") as f:
    course_tsx = f.read()

COURSE_VIEW_JSX = """function GuestCourseView({ course, chapters }: { course: typeof COURSES[number]; chapters: any[] }) {
  return (
    <div className="course-guest-view">
      {/* Overview */}
      <section className="course-section">
        <h2>Tổng quan lộ trình học</h2>
        <p>Khóa học <strong style={{ color: course.color }}>{course.title}</strong> được xây dựng theo chuẩn HSK 3.0 mới nhất, tập trung vào việc phát triển toàn diện 4 kỹ năng: Nghe, Nói, Đọc, Viết. Lộ trình học được thiết kế khoa học, kết hợp giữa lý thuyết nền tảng và thực hành ứng dụng thực tế thông qua các trò chơi tương tác độc quyền của Sơ Tâm.</p>
      </section>

      {/* Topics */}
      <section className="course-section">
        <h2>Các chủ đề bài học</h2>
        <div className="topic-grid">
          {chapters.length > 0 ? chapters.map(ch => (
            <div key={ch.bai} className="topic-card">
              <div className="topic-num">Bài {ch.bai}</div>
              <div className="topic-hanzi">{ch.hanzi}</div>
              <div className="topic-vi">{ch.vi}</div>
            </div>
          )) : (
            <>
              <div className="topic-card"><div className="topic-num">Chủ đề 1</div><div className="topic-hanzi">Giao tiếp cơ bản</div><div className="topic-vi">Chào hỏi, làm quen, giới thiệu bản thân</div></div>
              <div className="topic-card"><div className="topic-num">Chủ đề 2</div><div className="topic-hanzi">Đời sống thường ngày</div><div className="topic-vi">Mua sắm, ăn uống, hỏi đường</div></div>
              <div className="topic-card"><div className="topic-num">Chủ đề 3</div><div className="topic-hanzi">Công việc & Học tập</div><div className="topic-vi">Môi trường công sở, lịch trình trường học</div></div>
              <div className="topic-card"><div className="topic-num">Chủ đề 4</div><div className="topic-hanzi">Văn hóa & Xã hội</div><div className="topic-vi">Lễ hội, phong tục tập quán Trung Hoa</div></div>
            </>
          )}
        </div>
      </section>

      {/* Requirements & Outcomes */}
      <section className="course-section req-out-grid">
        <div className="req-card">
          <h3>🎓 Yêu cầu đầu vào</h3>
          <ul>
            <li>Đam mê và yêu thích tiếng Trung.</li>
            <li>Không yêu cầu kiến thức nền tảng (đối với HSK 1).</li>
            <li>Hoàn thành bài test năng lực nếu đăng ký từ HSK 2 trở lên.</li>
            <li>Cam kết tham gia đầy đủ các buổi học và làm bài tập trên hệ thống.</li>
          </ul>
        </div>
        <div className="req-card">
          <h3>🏆 Kết quả đầu ra</h3>
          <ul>
            <li>Nắm vững từ vựng và điểm ngữ pháp trọng tâm chuẩn HSK {course.title.replace('Hán ngữ ', '')}.</li>
            <li>Phát âm chuẩn Pinyin, phản xạ tự nhiên trong giao tiếp.</li>
            <li>Đủ khả năng thi đỗ chứng chỉ HSK và HSKK tương ứng.</li>
            <li>Sử dụng tiếng Trung linh hoạt trong đời sống và công việc thực tế.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}"""

course_tsx = re.sub(r'function GuestCourseView\(\{.*?\}\) \{[\s\S]*?\n\}', COURSE_VIEW_JSX, course_tsx)

with open(course_tsx_path, "w") as f:
    f.write(course_tsx)


# 6. Update styles.css
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

# Add hover underline and other CSS
NEW_CSS = """
/* Navbar hover underline */
.nav-dropdown-btn, .subnav-item {
  position: relative;
}
.nav-dropdown-btn::after, .subnav-item::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--c-red);
  transition: width 0.3s ease;
}
.nav-dropdown-btn:hover::after, .subnav-item:hover::after {
  width: 100%;
}

/* Floating Contact Expanding Pills */
.floating-contact {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 900;
  align-items: flex-end;
}
.fc-pill {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: var(--c-red-dark);
  color: white !important;
  border-radius: 999px;
  height: 48px;
  text-decoration: none !important;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: background 0.2s, max-width 0.4s ease;
  max-width: 48px;
}
.fc-pill:hover, .fc-pill:focus, .fc-pill:active {
  max-width: 250px;
  background: var(--c-red);
}
.fc-text {
  white-space: nowrap;
  font-weight: 600;
  opacity: 0;
  max-width: 0;
  transition: opacity 0.3s ease, padding 0.3s ease;
  font-size: 0.95rem;
}
.fc-pill:hover .fc-text, .fc-pill:focus .fc-text, .fc-pill:active .fc-text {
  opacity: 1;
  padding-left: 16px;
  max-width: 200px;
}
.fc-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fc-icon svg {
  width: 24px;
  height: 24px;
}

/* Course Card View Button */
.course-view-btn {
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 12px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s, transform 0.3s;
}
.course-tile:hover .course-view-btn {
  opacity: 1;
  transform: translateY(0);
}

/* Course Page New Layout */
.course-guest-view {
  margin-top: 30px;
}
.course-section {
  margin-bottom: 40px;
}
.course-section h2 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: var(--c-blue-dark);
}
.course-section p {
  line-height: 1.6;
  color: var(--c-text);
  font-size: 1.05rem;
}
.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.topic-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px var(--c-shadow);
  border: 1px solid var(--c-divider);
}
.topic-num {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--c-red);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.topic-hanzi {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 4px;
}
.topic-vi {
  color: var(--c-text-soft);
  font-size: 0.95rem;
}
.req-out-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
@media (min-width: 768px) {
  .req-out-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.req-card {
  background: var(--c-bg-subtle);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--c-divider);
}
.req-card h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--c-blue-dark);
}
.req-card ul {
  padding-left: 20px;
  margin: 0;
}
.req-card li {
  margin-bottom: 10px;
  line-height: 1.5;
  color: var(--c-text);
}

/* Mobile slide in right */
.slide-in-right {
  animation: slideInRightMob 0.3s forwards ease-out;
}
@keyframes slideInRightMob {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@media (max-width: 768px) {
  .sotam-subnav-bar {
    display: none !important; /* Hide sub-navbar on mobile */
  }
}
"""

styles = styles + "\n" + NEW_CSS

with open(styles_path, "w") as f:
    f.write(styles)

print("Done")
