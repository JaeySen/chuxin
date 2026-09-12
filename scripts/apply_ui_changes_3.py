import os
import sys

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"

# 1. Update App.tsx Footer
app_tsx_path = os.path.join(base_dir, "App.tsx")
with open(app_tsx_path, "r") as f:
    app_tsx = f.read()

OLD_FOOTER = """      <footer className="sotam-footer">
        <div className="container">
          <p><strong>Hán ngữ Sơ Tâm (Chuxin)</strong></p>
          <p>📍 Địa chỉ: 123 Đường Sơ Tâm, Quận Sơ Tâm, TP. HCM</p>
          <p>📞 Điện thoại: {CONTACT.phone}</p>
          <p>✉️ Email: contact@hanngusotam.com</p>
          <p style={{ marginTop: 8, fontSize: '0.85em', opacity: 0.7 }}>© {new Date().getFullYear()} Hán ngữ Sơ Tâm. All rights reserved.</p>
        </div>
      </footer>"""

NEW_FOOTER = """      <footer className="sotam-footer">
        <div className="container footer-grid">
          <div className="footer-col">
            <h3 className="footer-brand">Hán ngữ Sơ Tâm</h3>
            <p>Khởi đầu từ đam mê, vươn xa cùng Hán ngữ.</p>
            <div className="footer-socials">
              <a href={CONTACT.facebook} target="_blank" rel="noreferrer">FB</a>
              <a href={CONTACT.tiktok} target="_blank" rel="noreferrer">TikTok</a>
            </div>
          </div>
          <div className="footer-col">
            <h3>Liên hệ</h3>
            <p>📍 Địa chỉ: 123 Đường Sơ Tâm, Quận Sơ Tâm, TP. HCM</p>
            <p>📞 Điện thoại: {CONTACT.phone}</p>
            <p>✉️ Email: lienhe@hanngusotam.com</p>
          </div>
          <div className="footer-col">
            <h3>Khóa học</h3>
            <Link to="/course/han1-2">HSK 1-2</Link>
            <Link to="/course/han3">HSK 3</Link>
            <Link to="/course/han4">HSK 4</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Hán ngữ Sơ Tâm. All rights reserved.</p>
        </div>
      </footer>"""

app_tsx = app_tsx.replace(OLD_FOOTER, NEW_FOOTER)
with open(app_tsx_path, "w") as f:
    f.write(app_tsx)


# 2. Update Home.tsx
home_tsx_path = os.path.join(base_dir, "pages/Home.tsx")
with open(home_tsx_path, "r") as f:
    home_tsx = f.read()

# Update Coverflow rotation
home_tsx = home_tsx.replace("let rotateY = offset === 0 ? 0 : (offset > 0 ? -25 : 25);", "let rotateY = offset === 0 ? 0 : (offset > 0 ? 45 : -45);")

# Add progress bar to active coverflow card
PROGRESS_BAR_JSX = """
            <img src={t.file} alt={t.name} />
            {offset === 0 && (
              <div className="coverflow-progress">
                <div key={activeIdx} className="coverflow-progress-fill" style={{ animationPlayState: paused ? 'paused' : 'running' }} />
              </div>
            )}
          </div>
"""
home_tsx = home_tsx.replace("""
            <img src={t.file} alt={t.name} />
          </div>""", PROGRESS_BAR_JSX)

# Update Feedback section to use two marquees
OLD_FEEDBACK = """        <div className="feedback-grid">
          {FEEDBACKS.map((f) => (
            <div key={f.name} className="feedback-card">
              <div className="feedback-header">
                <span className="feedback-avatar">{f.avatar}</span>
                <div className="feedback-meta">
                  <div className="feedback-name">{f.name}</div>
                  <div className="feedback-course">Khoá {f.course}</div>
                </div>
                <div className="feedback-stars">{"⭐".repeat(f.rating)}</div>
              </div>
              <p className="feedback-text">"{f.text}"</p>
            </div>
          ))}
        </div>"""

NEW_FEEDBACK = """        <div className="feedback-marquee-wrapper">
          <div className="feedback-marquee-track left">
            {[...FEEDBACKS.slice(0, 3), ...FEEDBACKS.slice(0, 3), ...FEEDBACKS.slice(0, 3)].map((f, i) => (
              <div key={i} className="feedback-card marquee-card">
                <div className="feedback-header">
                  <span className="feedback-avatar">{f.avatar}</span>
                  <div className="feedback-meta">
                    <div className="feedback-name">{f.name}</div>
                    <div className="feedback-course">Khoá {f.course}</div>
                  </div>
                  <div className="feedback-stars">{"⭐".repeat(f.rating)}</div>
                </div>
                <p className="feedback-text">"{f.text}"</p>
              </div>
            ))}
          </div>
        </div>
        <div className="feedback-marquee-wrapper" style={{ marginTop: 24 }}>
          <div className="feedback-marquee-track right">
            {[...FEEDBACKS.slice(3, 6), ...FEEDBACKS.slice(3, 6), ...FEEDBACKS.slice(3, 6)].map((f, i) => (
              <div key={i} className="feedback-card marquee-card">
                <div className="feedback-header">
                  <span className="feedback-avatar">{f.avatar}</span>
                  <div className="feedback-meta">
                    <div className="feedback-name">{f.name}</div>
                    <div className="feedback-course">Khoá {f.course}</div>
                  </div>
                  <div className="feedback-stars">{"⭐".repeat(f.rating)}</div>
                </div>
                <p className="feedback-text">"{f.text}"</p>
              </div>
            ))}
          </div>
        </div>"""

home_tsx = home_tsx.replace(OLD_FEEDBACK, NEW_FEEDBACK)
with open(home_tsx_path, "w") as f:
    f.write(home_tsx)


# 3. Update styles.css
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

# Make coverflow wider
styles = styles.replace("""  width: 260px;
  height: 380px;""", """  width: 320px;
  height: 440px;""")
styles = styles.replace("""  height: 450px;""", """  height: 520px;""")

# Add new CSS for Footer, Marquee, Progress Bar
CSS_APPEND = """
/* Progress Bar for active teacher */
.coverflow-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
}
.coverflow-progress-fill {
  height: 100%;
  width: 0%;
  background: var(--c-red);
  animation: fillProgress 2.5s linear forwards;
}
@keyframes fillProgress {
  from { width: 0%; }
  to { width: 100%; }
}

/* Feedback Marquee */
.feedback-marquee-wrapper {
  overflow: hidden;
  position: relative;
  width: 100%;
  padding: 10px 0;
  mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
}
.feedback-marquee-track {
  display: flex;
  gap: 24px;
  width: max-content;
}
.feedback-marquee-track.left {
  animation: marqueeLeft 30s linear infinite;
}
.feedback-marquee-track.right {
  animation: marqueeRight 30s linear infinite;
  transform: translateX(-33.33%);
}
.feedback-marquee-track:hover {
  animation-play-state: paused;
}
.marquee-card {
  width: 350px;
  flex-shrink: 0;
  white-space: normal;
}
@keyframes marqueeLeft {
  from { transform: translateX(0); }
  to { transform: translateX(-33.333%); }
}
@keyframes marqueeRight {
  from { transform: translateX(-33.333%); }
  to { transform: translateX(0); }
}

/* Red Footer */
.sotam-footer {
  background: var(--c-red-dark) !important;
  color: rgba(255,255,255,0.85) !important;
  padding: 60px 20px 20px !important;
  border-top: none !important;
  text-align: left !important;
}
.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}
.footer-col h3 {
  color: white;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.2rem;
}
.footer-brand {
  font-size: 1.5rem !important;
  font-weight: 800;
}
.footer-col p {
  margin: 10px 0 !important;
  line-height: 1.6;
}
.footer-col a {
  display: block;
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  margin: 10px 0;
  transition: color 0.2s;
}
.footer-col a:hover {
  color: white;
}
.footer-socials {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.footer-socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
  color: white;
  margin: 0;
}
.footer-socials a:hover {
  background: rgba(255,255,255,0.2);
}
.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 0.9em;
}
"""

styles = styles + "\n" + CSS_APPEND

with open(styles_path, "w") as f:
    f.write(styles)

print("Done")
