import re

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"
home_path = base_dir + "/pages/Home.tsx"
styles_path = base_dir + "/styles.css"

# ═══════════════════════════════════════════════════════════════
# 1. Home.tsx — fix jumbotrons to full viewport width
#    and redesign portal sections as landing sections
# ═══════════════════════════════════════════════════════════════
with open(home_path, "r") as f:
    home = f.read()

# Fix 1: The GuestHome container wraps everything in padding: 12px 16px
# Change jumbotron-hero and jumbotron-section to escape via negative margin trick
# that accounts for the actual container padding
# Best approach: remove container constraints via full-bleed wrappers

# Fix jumbotron-hero: add full-bleed class via JSX
home = home.replace(
    '<section className="jumbotron-hero">',
    '<section className="jumbotron-hero full-bleed">'
)

home = home.replace(
    '<div className="jumbotron-section">',
    '<div className="jumbotron-section full-bleed">'
)

# Fix teacher strip: already uses 100vw but make it taller and 3-visible
home = home.replace(
    '''function TeacherCoverflow() {
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
}''',
    '''function TeacherCoverflow() {
  return (
    <div className="teacher-strip-wrapper full-bleed">
      <div className="teacher-strip-track">
        {[...TEACHER_BRIEFS, ...TEACHER_BRIEFS, ...TEACHER_BRIEFS].map((t, idx) => (
          <div key={idx} className="teacher-strip-card">
            <img src={t.file} alt={t.name} className="teacher-strip-img" />
          </div>
        ))}
      </div>
    </div>
  );
}'''
)

# Fix 2: Portal sections — replace card style with clean landing section style
home = home.replace(
    '''      {/* Bài tập trực tuyến — below courses */}
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
      </section>''',
    '''      {/* Bài tập trực tuyến — landing section */}
      <section className="landing-section landing-section--student full-bleed">
        <div className="landing-section-inner">
          <div className="landing-section-text">
            <div className="landing-section-eyebrow">Dành cho học viên</div>
            <h2 className="landing-section-title">Bài tập trực tuyến</h2>
            <p className="landing-section-desc">
              Làm bài trắc nghiệm nhiều lần, xem đáp án ngay sau khi nộp.<br />
              Theo dõi tiến trình và nhận phản hồi từ giáo viên.
            </p>
            <button
              className="btn btn-primary landing-section-btn"
              onClick={() => setLoginTarget("student")}
            >
              Đăng nhập học viên →
            </button>
          </div>
          <div className="landing-section-art">📚</div>
        </div>
      </section>'''
)

home = home.replace(
    '''      {/* Tham gia với chúng tôi — after teacher section */}
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
      </section>''',
    '''      {/* Tham gia với chúng tôi — landing section */}
      <section className="landing-section landing-section--teacher full-bleed">
        <div className="landing-section-inner landing-section-inner--reverse">
          <div className="landing-section-art">🏫</div>
          <div className="landing-section-text">
            <div className="landing-section-eyebrow">Dành cho giáo viên</div>
            <h2 className="landing-section-title">Tham gia với chúng tôi</h2>
            <p className="landing-section-desc">
              Quản lý lớp học, tạo bài tập và theo dõi<br />
              kết quả học viên trên một nền tảng duy nhất.
            </p>
            <button
              className="btn btn-secondary landing-section-btn"
              onClick={() => setLoginTarget("teacher")}
            >
              Đăng nhập giáo viên →
            </button>
          </div>
        </div>
      </section>'''
)

with open(home_path, "w") as f:
    f.write(home)
print("Done Home.tsx")

# ═══════════════════════════════════════════════════════════════
# 2. styles.css — fix full-bleed, teacher strip size, portal sections
# ═══════════════════════════════════════════════════════════════
with open(styles_path, "r") as f:
    styles = f.read()

# Fix jumbotron margin — the container has max-width 1080px centered
# full-bleed: escape any container to span 100vw
NEW_FULLBLEED = """
/* Full-bleed utility: escapes padded container to 100vw */
.full-bleed {
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}
"""

# Fix jumbotron-hero (was using -16px margin which doesn't work in centered container)
styles = styles.replace(
    """.jumbotron-hero {
  background: linear-gradient(135deg, var(--c-red-dark) 0%, var(--c-red) 100%);
  margin: -12px -16px 0;
  padding: 0 16px;
}""",
    """.jumbotron-hero {
  background: linear-gradient(135deg, var(--c-red-dark) 0%, var(--c-red) 100%);
  padding: 0;
  overflow: hidden;
}
.jumbotron-hero .container,
.jumbotron-hero > .hero {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px;
}"""
)

# Fix jumbotron-section
styles = styles.replace(
    """.jumbotron-section {
  background: linear-gradient(135deg, var(--c-red-dark) 0%, var(--c-red) 100%);
  margin: 0 -16px;
  padding: 48px 24px 40px;
  text-align: center;
  color: white;
}""",
    """.jumbotron-section {
  background: linear-gradient(135deg, var(--c-red-dark) 0%, var(--c-red) 100%);
  padding: 56px 24px 48px;
  text-align: center;
  color: white;
}"""
)

# Fix teacher strip to show exactly 3 at a time, taller
styles = styles.replace(
    """.teacher-strip-wrapper {
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
}""",
    """.teacher-strip-wrapper {
  overflow: hidden;
  padding: 16px 0;
}
.teacher-strip-track {
  display: flex;
  gap: 24px;
  width: max-content;
  animation: teacherScroll 24s linear infinite;
}
.teacher-strip-wrapper:hover .teacher-strip-track {
  animation-play-state: paused;
}
@keyframes teacherScroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(calc(-100% / 3)); }
}
.teacher-strip-card {
  flex-shrink: 0;
  /* 3 cards visible: (100vw - 2*24px gap) / 3 */
  width: calc((100vw - 48px) / 3);
  height: 420px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
}
.teacher-strip-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}
@media (max-width: 768px) {
  .teacher-strip-card {
    width: calc((100vw - 24px) / 2);
    height: 300px;
  }
}"""
)

# Add landing section styles
LANDING_SECTIONS_CSS = """
/* ── Landing sections (Bài tập / Tham gia) ─────────────────── */
.landing-section {
  padding: 64px 0;
}
.landing-section--student {
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}
.landing-section--teacher {
  background: #fff;
}
.landing-section-inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 60px;
}
.landing-section-inner--reverse {
  flex-direction: row-reverse;
}
.landing-section-text { flex: 1; }
.landing-section-art {
  font-size: 7rem;
  flex-shrink: 0;
  line-height: 1;
  opacity: 0.9;
}
.landing-section-eyebrow {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--c-red);
  margin-bottom: 10px;
}
.landing-section-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 14px;
  color: var(--c-text);
  line-height: 1.2;
}
.landing-section-desc {
  font-size: 1.05rem;
  color: var(--c-text-soft);
  line-height: 1.7;
  margin: 0 0 24px;
}
.landing-section-btn {
  min-width: 200px;
}
@media (max-width: 768px) {
  .landing-section-inner,
  .landing-section-inner--reverse {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }
  .landing-section-art { font-size: 4rem; }
  .landing-section-title { font-size: 1.5rem; }
  .landing-section { padding: 40px 0; }
}
"""

styles = NEW_FULLBLEED + "\n" + styles + "\n" + LANDING_SECTIONS_CSS

with open(styles_path, "w") as f:
    f.write(styles)
print("Done styles.css")
