import os

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"

# 1. Update App.tsx
app_tsx_path = os.path.join(base_dir, "App.tsx")
with open(app_tsx_path, "r") as f:
    app_tsx = f.read()

# Header scroll logic
SCROLL_EFFECT_CODE = """function Header() {
  const [activeMenu, setActiveMenu] = useState(0);
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
      } else {
        setHidden(false);
      }
      lastY = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {"""

# Replace Header start
import re
app_tsx = re.sub(r'function Header\(\) \{[\s\S]*?async function handleLogout\(\) \{', SCROLL_EFFECT_CODE, app_tsx)

app_tsx = app_tsx.replace('<header className="sotam-header">', '<header className={`sotam-header ${hidden ? "header-hidden" : ""}`}>')

# Replace Footer
OLD_FOOTER = """      <footer className="sotam-footer">
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

NEW_FOOTER = """      <footer className="sotam-footer">
        <div className="container footer-grid">
          <div className="footer-col">
            <h3 className="footer-brand">Hán ngữ Sơ Tâm</h3>
            <p>Khởi đầu từ đam mê, vươn xa cùng Hán ngữ.</p>
            <div className="footer-socials">
              <a href="https://zalo.me/0989175437" target="_blank" rel="noreferrer" className="social-pill">
                <span className="social-icon">Zalo</span>
                <span className="social-text">Chat qua Zalo</span>
              </a>
              <a href={CONTACT.facebook} target="_blank" rel="noreferrer" className="social-pill">
                <span className="social-icon">FB</span>
                <span className="social-text">Theo dõi trên Facebook</span>
              </a>
              <a href={CONTACT.tiktok} target="_blank" rel="noreferrer" className="social-pill">
                <span className="social-icon">TikTok</span>
                <span className="social-text">Theo dõi trên TikTok</span>
              </a>
            </div>
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

# Update spacing and add info to coverflow
home_tsx = home_tsx.replace("let tx = offset * 120;", "let tx = offset * 180;")
home_tsx = home_tsx.replace("""            <img src={t.file} alt={t.name} />
            {offset === 0 && (
              <div className="coverflow-progress">
                <div key={activeIdx} className="coverflow-progress-fill" style={{ animationPlayState: paused ? 'paused' : 'running' }} />
              </div>
            )}
          </div>""", """            <img src={t.file} alt={t.name} />
            <div className="coverflow-info">
              <h4>{t.name}</h4>
              <p>Thạc sĩ Hán ngữ Quốc tế</p>
            </div>
            {offset === 0 && (
              <div className="coverflow-progress">
                <div key={activeIdx} className="coverflow-progress-fill" style={{ animationPlayState: paused ? 'paused' : 'running' }} />
              </div>
            )}
          </div>""")

# Update portal grid to add images and body classes
home_tsx = home_tsx.replace("""      <section className="portal-grid">
        <Link to="/login" className="portal-card portal-card--student">
          <h3>Bài tập trực tuyến</h3>
          <p>
            Học viên đăng nhập để truy cập bài tập, theo dõi tiến trình học tập
            và tham gia các hoạt động tương tác trong lớp. Tại đây bạn có thể xem lại kết quả học tập, ôn luyện từ vựng qua flashcard, làm bài tập về nhà và nhận feedback trực tiếp từ giáo viên nhanh chóng.
          </p>
          <div className="portal-arrow">→</div>
        </Link>
        <Link to="/admin" className="portal-card portal-card--teacher">
          <h3>Tham gia với chúng tôi</h3>
          <p>
            Giáo viên đăng nhập để quản lý lớp học, tạo bài tập và theo dõi
            kết quả học viên qua bảng điều khiển giáo vụ. Hệ thống cung cấp công cụ chấm điểm tự động, quản lý học viên tiện lợi và hỗ trợ tổ chức các hoạt động lớp học trực tuyến chuyên nghiệp.
          </p>
          <div className="portal-arrow">→</div>
        </Link>
      </section>""", """      <section className="portal-grid">
        <Link to="/login" className="portal-card portal-card--student">
          <img src="https://placehold.co/600x300/a71e22/FFF?text=Học+viên" alt="Học viên" className="portal-img" />
          <div className="portal-body">
            <h3>Bài tập trực tuyến</h3>
            <p>
              Học viên đăng nhập để truy cập bài tập, theo dõi tiến trình học tập
              và tham gia các hoạt động tương tác trong lớp. Tại đây bạn có thể xem lại kết quả học tập, ôn luyện từ vựng qua flashcard, làm bài tập về nhà và nhận feedback trực tiếp từ giáo viên nhanh chóng.
            </p>
            <div className="portal-arrow">→</div>
          </div>
        </Link>
        <Link to="/admin" className="portal-card portal-card--teacher">
          <img src="https://placehold.co/600x300/e6a316/FFF?text=Giáo+viên" alt="Giáo viên" className="portal-img" />
          <div className="portal-body">
            <h3>Tham gia với chúng tôi</h3>
            <p>
              Giáo viên đăng nhập để quản lý lớp học, tạo bài tập và theo dõi
              kết quả học viên qua bảng điều khiển giáo vụ. Hệ thống cung cấp công cụ chấm điểm tự động, quản lý học viên tiện lợi và hỗ trợ tổ chức các hoạt động lớp học trực tuyến chuyên nghiệp.
            </p>
            <div className="portal-arrow">→</div>
          </div>
        </Link>
      </section>""")

with open(home_tsx_path, "w") as f:
    f.write(home_tsx)


# 3. Update styles.css
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

# Update Header z-index and styles
styles = styles.replace(""".sotam-header {
  position: sticky; top: 0; z-index: 100;""", """.sotam-header {
  position: sticky; top: 0; z-index: 1000;
  transition: transform 0.3s ease;""")

# Update subnavbar styling to match main header
styles = styles.replace("""/* Slide-in Sub-navbar */
.sotam-subnav-bar {
  overflow: hidden;
  background: var(--c-red-dark);
  color: white;
  padding: 8px 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: center;
  /* Prevent horizontal scroll from overflow in slide animation */
}""", """/* Slide-in Sub-navbar */
.sotam-subnav-bar {
  overflow: hidden;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  padding: 8px 0;
  border-top: 1px solid var(--c-divider);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  justify-content: center;
}""")

styles = styles.replace(""".subnav-item {
  color: white;""", """.subnav-item {
  color: var(--c-text-soft);""")
styles = styles.replace(""".subnav-item:hover {
  text-decoration: underline;
  opacity: 0.8;""", """.subnav-item:hover {
  color: var(--c-red-dark);
  text-decoration: none;""")

# Add new CSS classes
NEW_CSS = """
/* Header hide animation */
.header-hidden {
  transform: translateY(-100%);
}

/* Coverflow Info */
.coverflow-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px 16px 20px;
  background: linear-gradient(transparent, rgba(0,0,0,0.85));
  color: white;
  border-radius: 0 0 16px 16px;
  text-align: left;
}
.coverflow-info h4 { margin: 0 0 4px; font-size: 1.15rem; }
.coverflow-info p { margin: 0; font-size: 0.9rem; opacity: 0.9; }

/* Portal Grid Styling */
.portal-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 40px;
}
@media (min-width: 768px) {
  .portal-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.portal-card {
  padding: 0 !important;
  overflow: hidden;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
}
.portal-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid var(--c-divider);
}
.portal-body {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Social Hover Pills */
.footer-socials {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  margin-top: 20px;
}
.social-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(255,255,255,0.1);
  border-radius: 999px;
  color: white !important;
  text-decoration: none !important;
  overflow: hidden;
  height: 40px;
  transition: background 0.2s;
}
.social-pill:hover, .social-pill:focus, .social-pill:active {
  background: rgba(255,255,255,0.25);
}
.social-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.social-text {
  max-width: 0;
  opacity: 0;
  white-space: nowrap;
  transition: max-width 0.4s ease, opacity 0.3s ease, padding 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
}
.social-pill:hover .social-text, .social-pill:focus .social-text, .social-pill:active .social-text {
  max-width: 200px;
  opacity: 1;
  padding-right: 16px;
}
"""

styles = styles + "\n" + NEW_CSS

with open(styles_path, "w") as f:
    f.write(styles)

print("Done")
