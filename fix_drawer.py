import re
with open("apps/react/src/App.tsx", "r") as f:
    app = f.read()

bad_drawer = """      {/* Mobile nav drawer — absolute overlay, doesn't push content */}
      {menuOpen && (
        <nav className="sotam-nav--mobile">
        <Link to="/" className="sotam-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-primary">Hán ngữ</span> Sơ Tâm
        </Link>
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)}>
          <span className="hamburger">☰</span>
        </button>

        {menuOpen && (
          <div className="mobile-drawer">
            <div className="mobile-drawer-header">
              <span className="brand-primary" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Hán ngữ Sơ Tâm</span>
              <button className="mobile-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            
            <div className="mobile-drawer-body">
              <div className="sotam-nav--mobile-grid">
                <a href="/#gioi-thieu" className="mobile-grid-item" onClick={() => setMenuOpen(false)}>
                  <div className="grid-icon">🏫</div>
                  <div className="grid-label">Về chúng tôi</div>
                </a>
                <a href="/#courses" className="mobile-grid-item" onClick={() => setMenuOpen(false)}>
                  <div className="grid-icon">📚</div>
                  <div className="grid-label">Các khóa học</div>
                </a>
                <a href={PUBLIC_LINKS[2].to} target="_blank" rel="noreferrer" className="mobile-grid-item" onClick={() => setMenuOpen(false)}>
                  <div className="grid-icon">🎵</div>
                  <div className="grid-label">Thư viện</div>
                </a>
                <a href={CONTACT.zalo} target="_blank" rel="noreferrer" className="mobile-grid-item" style={{ background: '#a71e22', color: '#FFF' }} onClick={() => setMenuOpen(false)}>
                  <div className="grid-icon" style={{ fontSize: '1.8rem' }}>💬</div>
                  <div className="grid-label">Tư vấn Zalo</div>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
      )}"""

good_drawer = """      {/* Mobile nav drawer — absolute overlay, doesn't push content */}
      {menuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-header">
            <span className="brand-primary" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Hán ngữ Sơ Tâm</span>
            <button className="mobile-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
          </div>
          
          <div className="mobile-drawer-body">
            <div className="sotam-nav--mobile-grid">
              <a href="/#gioi-thieu" className="nav-tile" onClick={() => setMenuOpen(false)}>
                <div className="grid-icon">🏫</div>
                <div className="grid-label">Về chúng tôi</div>
              </a>
              <a href="/#courses" className="nav-tile" onClick={() => setMenuOpen(false)}>
                <div className="grid-icon">📚</div>
                <div className="grid-label">Các khóa học</div>
              </a>
              <a href={PUBLIC_LINKS[2].to} target="_blank" rel="noreferrer" className="nav-tile" onClick={() => setMenuOpen(false)}>
                <div className="grid-icon">🎵</div>
                <div className="grid-label">Thư viện</div>
              </a>
              <a href={CONTACT.zalo} target="_blank" rel="noreferrer" className="nav-tile" style={{ background: '#a71e22', color: '#FFF' }} onClick={() => setMenuOpen(false)}>
                <div className="grid-icon" style={{ fontSize: '1.8rem' }}>💬</div>
                <div className="grid-label">Tư vấn Zalo</div>
              </a>
            </div>
          </div>
        </div>
      )}"""

app = app.replace(bad_drawer, good_drawer)

# Hide the consult button on mobile by wrapping in desktop-only or adding desktop-only class
consult = """<button className="btn btn-consult btn-sm" onClick={() => setConsultOpen(true)}>
                Gọi/Zalo để tư vấn: {CONTACT.phone}
              </button>"""
consult_good = """<button className="btn btn-consult btn-sm desktop-only" onClick={() => setConsultOpen(true)}>
                Gọi/Zalo để tư vấn: {CONTACT.phone}
              </button>"""
app = app.replace(consult, consult_good)

with open("apps/react/src/App.tsx", "w") as f:
    f.write(app)

# Double check styles.css
with open("apps/react/src/styles.css", "r") as f:
    styles = f.read()

# Make sure grid-icon and grid-label are styled like they were in nav-tile, or just reuse the nav-tile inner styles.
# The previous nav-tile styles were:
# .nav-tile .nav-tile-icon { font-size: 2rem; }
# Let's just fix it quickly in CSS.
if '.grid-icon' not in styles:
    styles += """
.grid-icon { font-size: 2.2rem; }
.grid-label { font-size: 0.95rem; font-weight: 600; margin-top: 4px; text-align: center; }
"""

with open("apps/react/src/styles.css", "w") as f:
    f.write(styles)
