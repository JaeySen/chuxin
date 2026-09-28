import re

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"
home_path = base_dir + "/pages/Home.tsx"
styles_path = base_dir + "/styles.css"

with open(home_path, "r") as f:
    home = f.read()

# ═══════════════════════════════════════════════════════════════
# 1. Restructure entire GuestHome layout
# ═══════════════════════════════════════════════════════════════

# 1a. Add jumbotron to hero section (wrap hero section)
home = home.replace(
    '      {/* Hero */}\n      <section className="hero">',
    '      {/* Hero — Jumbotron banner */}\n      <section className="jumbotron-hero">\n      <section className="hero">'
)
home = home.replace(
    '        <HeroTestimonials />\n      </section>\n\n      {/* Games section */}',
    '        <HeroTestimonials />\n      </section>\n      </section>\n\n      {/* Games section */}'
)

# 1b. After courses section add "Bài tập trực tuyến" card (student portal)
# Move portal-section AFTER courses grid and BEFORE gioi-thieu
OLD_LAYOUT = '''      {/* Portal cards */}
      <section className="portal-section">
        <div className="portal-grid">
          {/* Student card */}
          <div className="portal-card portal-card--student">
            <h3 className="portal-card-title">Bài tập trực tuyến</h3>
            <p className="portal-card-desc">
              Học viên đăng nhập để truy cập bài tập, theo dõi tiến trình học tập
              và tham gia các hoạt động tương tác trong lớp. Tại đây bạn có thể xem lại kết quả học tập, ôn luyện từ vựng qua flashcard, làm bài tập về nhà và nhận feedback trực tiếp từ giáo viên nhanh chóng.
            </p>
            <button
              className="btn btn-primary portal-card-btn"
              onClick={() => setLoginTarget("student")}
            >
              Đăng nhập học viên
            </button>
          </div>

          {/* Teacher card */}
          <div className="portal-card portal-card--teacher">
            <h3 className="portal-card-title">Tham gia với chúng tôi</h3>
            <p className="portal-card-desc">
              Giáo viên đăng nhập để quản lý lớp học, tạo bài tập và theo dõi
              kết quả học viên qua bảng điều khiển giáo vụ. Hệ thống cung cấp công cụ chấm điểm tự động, quản lý học viên tiện lợi và hỗ trợ tổ chức các hoạt động lớp học trực tuyến chuyên nghiệp.
            </p>
            <button
              className="btn btn-secondary portal-card-btn"
              onClick={() => setLoginTarget("teacher")}
            >
              Đăng nhập giáo viên
            </button>
          </div>
        </div>
      </section>

      {loginTarget && (
        <SignInModal
          close={() => setLoginTarget(null)}
          redirectTo={loginTarget === "teacher" ? "/giaovu" : undefined}
          heading={loginTarget === "teacher" ? "Đăng nhập giáo viên" : "Đăng nhập học viên"}
        />
      )}

      {/* Courses */}
      <h2 className="section-h" id="courses">Các khoá học</h2>
      <div className="course-grid">
        {COURSES.map((c) => (
          <Link key={c.id} className="course-tile" to={`/course/${c.id}`}>
            {c.status && (
              <span className={`course-status-badge ${STATUS_CLASS[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            )}
            <h3>{c.title}</h3>
            <div className="muted">{c.subtitle}</div>
            <div className="tile-bar" style={{ background: c.color }} />
            <div className="course-view-btn" style={{ color: c.color }}>Xem chi tiết →</div>
          </Link>
        ))}
      </div>'''

NEW_LAYOUT = '''      {loginTarget && (
        <SignInModal
          close={() => setLoginTarget(null)}
          redirectTo={loginTarget === "teacher" ? "/giaovu" : undefined}
          heading={loginTarget === "teacher" ? "Đăng nhập giáo viên" : "Đăng nhập học viên"}
        />
      )}

      {/* Courses */}
      <h2 className="section-h" id="courses">Các khoá học</h2>
      <div className="course-grid">
        {COURSES.map((c) => (
          <Link key={c.id} className="course-tile" to={`/course/${c.id}`}>
            {c.status && (
              <span className={`course-status-badge ${STATUS_CLASS[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            )}
            <h3>{c.title}</h3>
            <div className="muted">{c.subtitle}</div>
            <div className="tile-bar" style={{ background: c.color }} />
            <div className="course-view-btn" style={{ color: c.color }}>Xem chi tiết →</div>
          </Link>
        ))}
      </div>

      {/* Bài tập trực tuyến — below courses */}
      <section className="portal-section portal-section--student-only" style={{ marginTop: 40 }}>
        <div className="portal-card portal-card--student portal-card--wide">
          <div className="portal-card-icon-lg">📚</div>
          <div className="portal-card-body">
            <h3 className="portal-card-title">Bài tập trực tuyến</h3>
            <p className="portal-card-desc">
              Làm bài trắc nghiệm nhiều lần, xem đáp án ngay sau khi nộp. Theo dõi tiến trình và nhận phản hồi từ giáo viên.
            </p>
            <button
              className="btn btn-primary portal-card-btn"
              onClick={() => setLoginTarget("student")}
            >
              Đăng nhập học viên
            </button>
          </div>
        </div>
      </section>'''

home = home.replace(OLD_LAYOUT, NEW_LAYOUT)

# 1c. Add jumbotron banner to gioi-thieu section
home = home.replace(
    '      <div id="gioi-thieu" style={{ paddingTop: 60 }}>',
    '      <div id="gioi-thieu" style={{ paddingTop: 0 }}>\n        <div className="jumbotron-section">\n          <h2 className="jumbotron-title">Giới thiệu trung tâm</h2>\n          <p className="jumbotron-sub">初心 · Hán ngữ Sơ Tâm</p>\n        </div>'
)
# Remove the old h2 that would duplicate
home = home.replace(
    '        <h2 className="section-h" style={{ marginTop: 0, textAlign: "center", fontSize: "2rem" }}>Giới thiệu trung tâm</h2>',
    ''
)

# 1d. Move "Tham gia với chúng tôi" after teacher section and shorten desc
home = home.replace(
    '      </div>\n\n\n      {/* Lịch khai giảng */}',
    '''      </div>

      {/* Tham gia với chúng tôi — after teacher section */}
      <section className="portal-section portal-section--teacher-only" style={{ marginTop: 40 }}>
        <div className="portal-card portal-card--teacher portal-card--wide">
          <div className="portal-card-icon-lg">🏫</div>
          <div className="portal-card-body">
            <h3 className="portal-card-title">Tham gia với chúng tôi</h3>
            <p className="portal-card-desc">
              Giáo viên đăng nhập để quản lý lớp, tạo bài tập và theo dõi kết quả học viên.
            </p>
            <button
              className="btn btn-secondary portal-card-btn"
              onClick={() => setLoginTarget("teacher")}
            >
              Đăng nhập giáo viên
            </button>
          </div>
        </div>
      </section>

      {/* Lịch khai giảng */}'''
)

# 1e. Replace OpeningCalendar component with card-based design
OLD_CALENDAR = '''function OpeningCalendar() {
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
}'''

NEW_CALENDAR = '''const OPENING_CLASSES = [
  {
    name: "HSK 1 — Lớp 1.1",
    date: "01.10.2026",
    schedule: "Tối 3-5 (T3 & T5), 22:00 – 23:30",
    status: "upcoming" as const,
    statusLabel: "Sắp diễn ra",
  },
  {
    name: "HSK 1 — Lớp 1.2",
    date: "04.10.2026",
    schedule: "Cuối tuần (T7 & CN), 16:00 – 17:30",
    status: "enrolling" as const,
    statusLabel: "Đang tuyển sinh",
  },
];

function OpeningCalendar() {
  return (
    <div className="lich-grid">
      {OPENING_CLASSES.map((cls) => (
        <div key={cls.name} className={`lich-card lich-card--${cls.status}`}>
          <div className={`lich-status lich-status--${cls.status}`}>
            <span className="lich-status-dot" />
            {cls.statusLabel}
          </div>
          <h3 className="lich-name">{cls.name}</h3>
          <div className="lich-row">
            <span className="lich-row-icon">📅</span>
            <div>
              <div className="lich-row-label">NGÀY KHAI GIẢNG</div>
              <div className="lich-row-value">{cls.date}</div>
            </div>
          </div>
          <div className="lich-row">
            <span className="lich-row-icon">🕐</span>
            <div>
              <div className="lich-row-label">THỜI GIAN</div>
              <div className="lich-row-value lich-row-value--normal">{cls.schedule}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}'''

home = home.replace(OLD_CALENDAR, NEW_CALENDAR)

# 1f. Replace TeacherCoverflow with full-width auto-scroll strip
OLD_COVERFLOW = '''function TeacherCoverflow() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % TEACHER_BRIEFS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <div 
      className="coverflow-container" 
      onMouseEnter={() => setPaused(true)} 
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {TEACHER_BRIEFS.map((t, idx) => {
        let offset = idx - activeIdx;
        const total = TEACHER_BRIEFS.length;
        if (offset < -Math.floor(total / 2)) offset += total;
        if (offset > Math.floor(total / 2)) offset -= total;
        
        let zIndex = 100 - Math.abs(offset);
        let tx = offset * 220;
        let scale = offset === 0 ? 1 : 0.8;
        let rotateY = offset === 0 ? 0 : (offset > 0 ? 45 : -45);
        let opacity = Math.abs(offset) > 2 ? 0 : 1;

        return (
          <div 
            key={t.name}
            className={`coverflow-card ${offset === 0 ? \'coverflow-card-active\' : \'\'}`}
            style={{ 
              zIndex, 
              opacity,
              transform: `translateX(${tx}px) scale(${scale}) perspective(800px) rotateY(${rotateY}deg)`
            }}
            onClick={() => setActiveIdx(idx)}
          >
            <img src={t.file} alt={t.name} />
            {offset === 0 && (
              <div className="coverflow-progress">
                <div key={activeIdx} className="coverflow-progress-fill" style={{ animationPlayState: paused ? \'paused\' : \'running\' }} />
              </div>
            )}
          </div>

        );
      })}
    </div>
  );
}'''

NEW_COVERFLOW = '''function TeacherCoverflow() {
  return (
    <div className="teacher-strip-wrapper">
      <div className="teacher-strip-track">
        {[...TEACHER_BRIEFS, ...TEACHER_BRIEFS].map((t, idx) => (
          <div key={idx} className="teacher-strip-card">
            <img src={t.file} alt={t.name} className="teacher-strip-img" />
          </div>
        ))}
      </div>
    </div>
  );
}'''

home = home.replace(OLD_COVERFLOW, NEW_COVERFLOW)

with open(home_path, "w") as f:
    f.write(home)
print("Done Home.tsx")

# ═══════════════════════════════════════════════════════════════
# 2. styles.css
# ═══════════════════════════════════════════════════════════════
with open(styles_path, "r") as f:
    styles = f.read()

NEW_CSS = """

/* ── Jumbotron banners ─────────────────────────────────────── */
.jumbotron-hero {
  background: linear-gradient(135deg, var(--c-red-dark) 0%, var(--c-red) 100%);
  margin: -12px -16px 0;
  padding: 0 16px;
}
.jumbotron-hero .hero {
  color: white;
}
.jumbotron-hero .hero h1 { color: white; }
.jumbotron-hero .hero p { color: rgba(255,255,255,0.88); }
.jumbotron-hero .hero-highlight-item {
  background: rgba(255,255,255,0.15);
  color: white;
  backdrop-filter: blur(6px);
}
.jumbotron-hero .hero-accent { color: #ffe08a; }
.jumbotron-hero .hero-copy { padding-top: 40px; padding-bottom: 40px; }

.jumbotron-section {
  background: linear-gradient(135deg, var(--c-red-dark) 0%, var(--c-red) 100%);
  margin: 0 -16px;
  padding: 48px 24px 40px;
  text-align: center;
  color: white;
}
.jumbotron-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0 0 6px;
  color: white;
}
.jumbotron-sub {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.85;
  font-style: italic;
}

/* ── Portal cards redesign ─────────────────────────────────── */
.portal-section--student-only .portal-card--wide,
.portal-section--teacher-only .portal-card--wide {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
}
.portal-card--wide {
  max-width: 640px;
  margin: 0 auto;
}
.portal-card-icon-lg { font-size: 3rem; flex-shrink: 0; }
.portal-card-body { flex: 1; }
.portal-card-body .portal-card-title { margin: 0 0 8px; font-size: 1.25rem; }
.portal-card-body .portal-card-desc { margin: 0 0 16px; color: var(--c-text-soft); font-size: 0.95rem; line-height: 1.6; }
@media (max-width: 600px) {
  .portal-section--student-only .portal-card--wide,
  .portal-section--teacher-only .portal-card--wide {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
  }
}

/* ── Teacher strip (full-width scroll) ─────────────────────── */
.teacher-strip-wrapper {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  overflow: hidden;
  padding: 12px 0;
}
.teacher-strip-track {
  display: flex;
  gap: 16px;
  width: max-content;
  animation: teacherScroll 20s linear infinite;
}
.teacher-strip-wrapper:hover .teacher-strip-track {
  animation-play-state: paused;
}
@keyframes teacherScroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.teacher-strip-card {
  flex-shrink: 0;
  width: 260px;
  height: 340px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.teacher-strip-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}
@media (max-width: 768px) {
  .teacher-strip-card { width: 200px; height: 260px; }
}

/* ── Lịch khai giảng card grid ─────────────────────────────── */
.lich-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 760px;
  margin: 0 auto;
}
.lich-card {
  background: white;
  border-radius: 16px;
  padding: 22px 24px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
  border-top: 4px solid transparent;
}
.lich-card--upcoming  { border-top-color: #f59e0b; }
.lich-card--enrolling { border-top-color: #10b981; }
.lich-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}
.lich-status--upcoming  { color: #b45309; }
.lich-status--enrolling { color: #065f46; }
.lich-status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.lich-status--upcoming  .lich-status-dot { background: #f59e0b; }
.lich-status--enrolling .lich-status-dot { background: #10b981; }
.lich-name {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 18px;
  color: var(--c-text);
}
.lich-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}
.lich-row-icon { font-size: 1.2rem; margin-top: 2px; }
.lich-row-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-text-soft);
  margin-bottom: 3px;
}
.lich-row-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--c-red);
}
.lich-row-value--normal {
  color: var(--c-text);
  font-weight: 500;
  font-size: 0.95rem;
}
"""

styles += NEW_CSS
with open(styles_path, "w") as f:
    f.write(styles)
print("Done styles.css")
