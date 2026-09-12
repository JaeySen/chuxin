import os

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"
public_dir = "/Users/tranngochienlong/chuxin/apps/react/public"

# 1. .htaccess
htaccess_path = os.path.join(public_dir, ".htaccess")
with open(htaccess_path, "w") as f:
    f.write("""RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]

<FilesMatch "\\.pdf$">
    Header set Content-Disposition inline
</FilesMatch>
""")

# 2. App.tsx
app_tsx_path = os.path.join(base_dir, "App.tsx")
with open(app_tsx_path, "r") as f:
    app_tsx = f.read()

# Add useState import if not present
if "useState" not in app_tsx:
    app_tsx = app_tsx.replace("import { useEffect", "import { useState, useEffect")

app_tsx = app_tsx.replace("export function App() {", """export function App() {
  const [activeMenu, setActiveMenu] = useState(0);""")

app_tsx = app_tsx.replace("""{PUBLIC_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="nav-dropdown-btn">
                  {l.icon} {l.label}
                </Link>
              ))}""", """{PUBLIC_LINKS.map((l, i) => (
                <div key={l.to} onMouseEnter={() => setActiveMenu(i)}>
                  <Link to={l.to} className="nav-dropdown-btn" style={{ background: activeMenu === i ? 'rgba(0,0,0,0.05)' : '' }}>
                    {l.icon} {l.label}
                  </Link>
                </div>
              ))}""")

app_tsx = app_tsx.replace("""{/* Marquee sub-navbar */}
      <div className="sotam-subnav-marquee">
        <div className="marquee-content">
          {ALL_SUB_LINKS.map((s, i) => (
            <Link key={i} to={s.to} className="marquee-item">{s.label}</Link>
          ))}
          {/* Duplicate for seamless infinite scroll */}
          {ALL_SUB_LINKS.map((s, i) => (
            <Link key={i + 100} to={s.to} className="marquee-item">{s.label}</Link>
          ))}
          {ALL_SUB_LINKS.map((s, i) => (
            <Link key={i + 200} to={s.to} className="marquee-item">{s.label}</Link>
          ))}
        </div>
      </div>""", """{/* Sub-navbar with Slide Animation */}
      <div className="sotam-subnav-bar">
        <div key={activeMenu} className="subnav-slide-in">
          {PUBLIC_LINKS[activeMenu].sub.map((s) => (
            <Link key={s.to} to={s.to} className="subnav-item">{s.label}</Link>
          ))}
        </div>
      </div>""")

app_tsx = app_tsx.replace("""</main>
    </div>""", """</main>
      <footer className="sotam-footer">
        <div className="container">
          <p><strong>Hán ngữ Sơ Tâm (Chuxin)</strong></p>
          <p>📍 Địa chỉ: 123 Đường Sơ Tâm, Quận Sơ Tâm, TP. HCM</p>
          <p>📞 Điện thoại: {CONTACT.phone}</p>
          <p>✉️ Email: contact@hanngusotam.com</p>
          <p style={{ marginTop: 8, fontSize: '0.85em', opacity: 0.7 }}>© {new Date().getFullYear()} Hán ngữ Sơ Tâm. All rights reserved.</p>
        </div>
      </footer>
    </div>""")

with open(app_tsx_path, "w") as f:
    f.write(app_tsx)

# 3. Home.tsx
home_tsx_path = os.path.join(base_dir, "pages/Home.tsx")
with open(home_tsx_path, "r") as f:
    home_tsx = f.read()

# Make sure useState and useEffect are imported in Home.tsx if not already
if "useState" not in home_tsx:
    home_tsx = home_tsx.replace("import { Link } from \"react-router-dom\";", "import { Link } from \"react-router-dom\";\nimport { useState, useEffect } from \"react\";")

COVERFLOW_COMP = """
function TeacherCoverflow() {
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
        let tx = offset * 120;
        let scale = offset === 0 ? 1 : 0.8;
        let rotateY = offset === 0 ? 0 : (offset > 0 ? -25 : 25);
        let opacity = Math.abs(offset) > 2 ? 0 : 1;

        return (
          <div 
            key={t.name}
            className={`coverflow-card ${offset === 0 ? 'coverflow-card-active' : ''}`}
            style={{ 
              zIndex, 
              opacity,
              transform: `translateX(${tx}px) scale(${scale}) perspective(800px) rotateY(${rotateY}deg)`
            }}
            onClick={() => setActiveIdx(idx)}
          >
            <img src={t.file} alt={t.name} />
          </div>
        );
      })}
    </div>
  );
}
"""

if "function TeacherCoverflow" not in home_tsx:
    home_tsx = home_tsx.replace("export function Home()", COVERFLOW_COMP + "\nexport function Home()")

home_tsx = home_tsx.replace("""<div className="teacher-slider-container">
          <div className="teacher-slider">
            {TEACHER_BRIEFS.map((t) => (
              <div key={t.name} className="teacher-slider-card">
                <img
                  src={t.file}
                  alt={`Giới thiệu giáo viên ${t.name}`}
                  className="teacher-brief-img"
                />
              </div>
            ))}
          </div>
        </div>""", """<TeacherCoverflow />""")

with open(home_tsx_path, "w") as f:
    f.write(home_tsx)


# 4. CoursePage.tsx
course_path = os.path.join(base_dir, "pages/CoursePage.tsx")
with open(course_path, "r") as f:
    course_tsx = f.read()

course_tsx = course_tsx.replace("""      {/* Chương trình tĩnh bị ẩn đi theo yêu cầu */}
      <div className="feedback feedback-info" style={{ marginTop: 16 }}>
        Đăng nhập tài khoản học viên để xem bài tập và nội dung chi tiết.
      </div>""", "")

with open(course_path, "w") as f:
    f.write(course_tsx)


# 5. styles.css
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

CSS_REPLACE = """/* Marquee Sub-navbar */
.sotam-subnav-marquee {
  overflow: hidden;
  white-space: nowrap;
  background: var(--c-red-dark);
  color: white;
  padding: 8px 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
}
.marquee-content {
  display: flex;
  animation: scrollMarquee 25s linear infinite;
}
.marquee-item {
  display: inline-block;
  padding: 0 30px;
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}
.marquee-item:hover {
  text-decoration: underline;
}
@keyframes scrollMarquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-33.333%); }
}

/* Teacher Slider */
.teacher-slider-container {
  overflow: hidden;
  width: 100%;
  padding: 20px 0;
}
.teacher-slider {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 20px;
  padding-left: 20px;
  padding-right: 20px;
}
.teacher-slider::-webkit-scrollbar {
  height: 8px;
}
.teacher-slider::-webkit-scrollbar-thumb {
  background: var(--c-divider);
  border-radius: 4px;
}
.teacher-slider-card {
  scroll-snap-align: center;
  flex: 0 0 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px var(--c-shadow);
  transition: transform 0.3s;
  overflow: hidden;
  position: relative;
}
.teacher-slider-card:hover {
  transform: translateY(-5px) scale(1.02);
}
.teacher-slider-card img {
  width: 100%;
  height: 400px;
  object-fit: cover;
  display: block;
}"""

CSS_NEW = """/* Slide-in Sub-navbar */
.sotam-subnav-bar {
  overflow: hidden;
  background: var(--c-red-dark);
  color: white;
  padding: 8px 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: center;
  /* Prevent horizontal scroll from overflow in slide animation */
}
.subnav-slide-in {
  display: flex;
  gap: 30px;
  animation: slideInRight 0.3s ease-out forwards;
}
.subnav-item {
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: opacity 0.2s;
}
.subnav-item:hover {
  text-decoration: underline;
  opacity: 0.8;
}
@keyframes slideInRight {
  from { transform: translateX(50px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* 3D Coverflow Teachers */
.coverflow-container {
  position: relative;
  height: 450px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin: 20px 0;
}
.coverflow-card {
  position: absolute;
  width: 260px;
  height: 380px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px var(--c-shadow);
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.6s, z-index 0s;
  cursor: pointer;
  will-change: transform;
}
.coverflow-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  display: block;
}
.coverflow-card-active {
  box-shadow: 0 15px 40px rgba(0,0,0,0.2);
}
.coverflow-card-active:hover {
  transform: translateX(0px) scale(1.05) perspective(800px) rotateY(0deg) !important;
}

/* Footer */
.sotam-footer {
  background: var(--c-bg-subtle);
  padding: 40px 20px;
  border-top: 1px solid var(--c-border);
  color: var(--c-text-soft);
  text-align: center;
}
.sotam-footer p {
  margin: 6px 0;
  font-size: 14px;
}
"""

styles = styles.replace(CSS_REPLACE, CSS_NEW)
with open(styles_path, "w") as f:
    f.write(styles)

print("Done")
