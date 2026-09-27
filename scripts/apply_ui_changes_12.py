import os
import re

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"

# ═══════════════════════════════════════════════════════════════════════
# 1. Update App.tsx
# ═══════════════════════════════════════════════════════════════════════
app_path = os.path.join(base_dir, "App.tsx")
with open(app_path, "r") as f:
    app_tsx = f.read()

# --- 1a. Update PUBLIC_LINKS ---
OLD_PUBLIC_LINKS = """const PUBLIC_LINKS = [
  {
    to: "/#gioi-thieu",
    label: "Về chúng tôi",
    icon: "🏫",
    sub: [
      { to: "/#gioi-thieu", label: "Giới thiệu trung tâm" },
      { to: "/#giao-vien",  label: "Giới thiệu giáo viên" },
      { to: "/#feedback",   label: "Feedback của học viên" },
    ],
  },
  {
    to: "/#courses",
    label: "Các khóa học",
    icon: "📚",
    sub: [
      { to: "/course/han1", label: "Hán ngữ 1 (HSK 1)" },
      { to: "/course/han2", label: "Hán ngữ 2 (HSK 2)" },
      { to: "/course/han3", label: "Hán ngữ 3 (HSK 3)" },
      { to: "/course/han4", label: "Hán ngữ 4 (HSK 4)" },
      { to: "/course/han5", label: "Hán ngữ 5 (HSK 5)" },
      { to: "/course/han6", label: "Hán ngữ 6 (HSK 6)" },
      { to: "/course/thuong-mai", label: "Tiếng Trung Thương mại" },
      { to: "/course/tre-em", label: "Tiếng Trung Trẻ em" },
    ],
  },
  {
    to: "/thu-vien",
    label: "Thư viện",
    icon: "📄",
    sub: [
      { to: "/thu-vien?cap=so",    label: "Sơ cấp" },
      { to: "/thu-vien?cap=trung", label: "Trung cấp" },
      { to: "/thu-vien?cap=cao",   label: "Cao cấp" },
    ],
  },
];"""

NEW_PUBLIC_LINKS = """const PUBLIC_LINKS = [
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
];"""

app_tsx = app_tsx.replace(OLD_PUBLIC_LINKS, NEW_PUBLIC_LINKS)

# --- 1b. Remove icons from navbar rendering ---
app_tsx = app_tsx.replace("{l.icon} {l.label}", "{l.label}")

# --- 1c. Update mobile drawer ---
app_tsx = app_tsx.replace(
    """              <a href="/#gioi-thieu" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Về chúng tôi
              </a>
              <a href="/#courses" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Các khóa học
              </a>""",
    """              <a href="/#gioi-thieu" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Về chúng tôi
              </a>
              <a href="/#courses" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Khóa học
              </a>
              <a href="/#lich-khai-giang" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Lịch khai giảng
              </a>"""
)

# --- 1d. Sub-navbar: skip rendering if sub is empty ---
app_tsx = app_tsx.replace(
    """{PUBLIC_LINKS[activeMenu].sub.map((s) => (
            <Link key={s.to} to={s.to} className="subnav-item">{s.label}</Link>
          ))}""",
    """{PUBLIC_LINKS[activeMenu].sub.length > 0 && PUBLIC_LINKS[activeMenu].sub.map((s) => (
            <Link key={s.to} to={s.to} className="subnav-item">{s.label}</Link>
          ))}"""
)

with open(app_path, "w") as f:
    f.write(app_tsx)

# ═══════════════════════════════════════════════════════════════════════
# 2. Update Home.tsx
# ═══════════════════════════════════════════════════════════════════════
home_path = os.path.join(base_dir, "pages", "Home.tsx")
with open(home_path, "r") as f:
    home_tsx = f.read()

# --- 2a. Replace hero description and remove CTA buttons ---
OLD_HERO = """          <p>
            Các khóa học được xây dựng chuẩn hoá theo phương pháp kết hợp lý thuyết và thực hành,
            cùng hệ thống bài học và trò chơi tương tác như Flashcard, đố vui, ghép cặp đến luyện nghe – nói,
            mỗi hoạt động đều được thiết kế, chọn lọc và kiểm duyệt kỹ càng bởi đội ngũ giáo viên
            là các Thạc sĩ chuyên ngành Hán ngữ Quốc tế.
          </p>
          <div className="hero-cta">
            <a href="#courses" className="btn btn-primary" onClick={scrollToCourses}>Xem các khoá học</a>
            <Link to="/ve-chung-toi" className="btn btn-secondary">Về chúng tôi</Link>
          </div>"""

NEW_HERO = """          <p>
            Các khóa học tại Sơ Tâm được xây dựng bài bản, kết hợp lý thuyết và thực hành,
            giúp học viên ghi nhớ kiến thức hiệu quả và từng bước chinh phục mục tiêu tiếng Trung của mình.
          </p>
          <div className="hero-highlights">
            <div className="hero-highlight-item">
              <span className="hero-highlight-icon">🚩</span>
              <span>Lộ trình học rõ ràng</span>
            </div>
            <div className="hero-highlight-item">
              <span className="hero-highlight-icon">📖</span>
              <span>Giáo trình HSK 3.0</span>
            </div>
            <div className="hero-highlight-item">
              <span className="hero-highlight-icon">🎓</span>
              <span>Giáo viên là NCS Tiến sĩ, Thạc sĩ</span>
            </div>
            <div className="hero-highlight-item">
              <span className="hero-highlight-icon">⭐</span>
              <span>Chú trọng thực hành, ứng dụng thực tế</span>
            </div>
          </div>"""

home_tsx = home_tsx.replace(OLD_HERO, NEW_HERO)

# --- 2b. Remove icons from portal cards ---
home_tsx = home_tsx.replace('<div className="portal-card-icon">📚</div>\n            <h3 className="portal-card-title">Bài tập trực tuyến</h3>',
                            '<h3 className="portal-card-title">Bài tập trực tuyến</h3>')
home_tsx = home_tsx.replace('<div className="portal-card-icon">🏫</div>\n            <h3 className="portal-card-title">Tham gia với chúng tôi</h3>',
                            '<h3 className="portal-card-title">Tham gia với chúng tôi</h3>')

# --- 2c. Update "Về chúng tôi" heading ---
home_tsx = home_tsx.replace(
    '<h2 className="section-h" style={{ marginTop: 0, textAlign: "center", fontSize: "2rem" }}>Về chúng tôi</h2>\n        <h3 style={{ textAlign: "center", fontSize: "1.3rem", marginTop: "-10px", marginBottom: "30px", color: "var(--c-text-soft)" }}>Sứ mệnh</h3>',
    '<h2 className="section-h" style={{ marginTop: 0, textAlign: "center", fontSize: "2rem" }}>Giới thiệu trung tâm</h2>'
)

# --- 2d. Hide feedback section (comment out with style display none) ---
home_tsx = home_tsx.replace(
    '<div id="feedback" style={{ paddingTop: 60, paddingBottom: 60 }}>',
    '<div id="feedback" style={{ paddingTop: 60, paddingBottom: 60, display: "none" }}>'
)

# --- 2e. Add calendar section after teacher coverflow ---
# Find the closing of the giao-vien section, which is before the feedback section
CALENDAR_SECTION = """
      {/* Lịch khai giảng */}
      <div id="lich-khai-giang" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <h2 className="section-h" style={{ textAlign: "center" }}>Lịch khai giảng</h2>
        <p style={{ color: "var(--c-text-soft)", marginTop: 0, marginBottom: 30, textAlign: "center" }}>
          Lịch dự kiến khai giảng các khóa học trong tháng
        </p>
        <OpeningCalendar />
      </div>

"""

home_tsx = home_tsx.replace(
    '      <div id="feedback"',
    CALENDAR_SECTION + '      <div id="feedback"'
)

# --- 2f. Add OpeningCalendar component near TeacherCoverflow ---
CALENDAR_COMPONENT = """
function OpeningCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  
  // Sample opening dates (highlighted)
  const openingDates: Record<number, string> = {
    5: "HSK 1 — 19:00",
    12: "HSK 2 — 19:00",
    15: "HSK 3 — 18:30",
    20: "HSK 1 — 19:00",
    26: "HSK 4 — 18:30",
  };

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e${i}`} className="cal-cell cal-cell--empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const isOpening = d in openingDates;
    cells.push(
      <div key={d} className={`cal-cell ${isToday ? "cal-cell--today" : ""} ${isOpening ? "cal-cell--opening" : ""}`}>
        <span className="cal-date">{d}</span>
        {isOpening && <span className="cal-event">{openingDates[d]}</span>}
      </div>
    );
  }

  return (
    <div className="opening-calendar">
      <div className="cal-header">
        <h3>{monthNames[month]} {year}</h3>
      </div>
      <div className="cal-weekdays">
        {dayNames.map(d => <div key={d} className="cal-weekday">{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells}
      </div>
    </div>
  );
}

"""

# Insert before the first function GuestHome or after TeacherCoverflow
home_tsx = home_tsx.replace(
    "export function Home() {",
    CALENDAR_COMPONENT + "export function Home() {"
)

with open(home_path, "w") as f:
    f.write(home_tsx)

# ═══════════════════════════════════════════════════════════════════════
# 3. Update styles.css
# ═══════════════════════════════════════════════════════════════════════
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

NEW_CSS = """
/* Hero Highlights (2x2 pill grid) */
.hero-highlights {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 24px;
}
.hero-highlight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: #f8f9fa;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
}
.hero-highlight-icon {
  font-size: 1.2rem;
  color: var(--c-red);
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .hero-highlights {
    grid-template-columns: 1fr;
  }
}

/* Opening Calendar */
.opening-calendar {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 24px;
}
.cal-header {
  text-align: center;
  margin-bottom: 16px;
}
.cal-header h3 {
  font-size: 1.3rem;
  margin: 0;
}
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--c-text-soft);
  margin-bottom: 8px;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-cell {
  min-height: 56px;
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.9rem;
}
.cal-cell--empty {
  background: transparent;
}
.cal-date {
  font-weight: 600;
}
.cal-cell--today {
  background: #f0f0f0;
  border: 2px solid var(--c-red);
  border-radius: 8px;
}
.cal-cell--today .cal-date {
  color: var(--c-red);
}
.cal-cell--opening {
  background: #fff0f0;
}
.cal-cell--opening .cal-date {
  color: var(--c-red);
  font-weight: 700;
}
.cal-event {
  font-size: 0.65rem;
  color: var(--c-red);
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  margin-top: 2px;
}
@media (max-width: 768px) {
  .opening-calendar { padding: 12px; }
  .cal-cell { min-height: 48px; padding: 4px 2px; }
  .cal-event { font-size: 0.55rem; }
}
"""

styles += NEW_CSS

with open(styles_path, "w") as f:
    f.write(styles)

print("Done script 12")
