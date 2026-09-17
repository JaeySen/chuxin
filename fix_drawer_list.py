import re
with open("apps/react/src/App.tsx", "r") as f:
    app = f.read()

bad_drawer = """      {/* Mobile nav drawer — absolute overlay, doesn't push content */}
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

good_drawer = """      {/* Mobile nav drawer — absolute overlay, doesn't push content */}
      {menuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-header" style={{ justifyContent: 'flex-end', borderBottom: 'none' }}>
            <button className="mobile-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
          </div>
          
          <div className="mobile-drawer-body" style={{ padding: '0 20px 20px' }}>
            <div className="mobile-drawer-list">
              <a href="/#gioi-thieu" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Về chúng tôi
              </a>
              <a href="/#courses" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Các khóa học
              </a>
              <a href={PUBLIC_LINKS[2].to} target="_blank" rel="noreferrer" className="mobile-list-item" onClick={() => setMenuOpen(false)}>
                Thư viện
              </a>
              <a href={CONTACT.zalo} target="_blank" rel="noreferrer" className="mobile-list-item mobile-list-item--zalo" onClick={() => setMenuOpen(false)}>
                Tư vấn Zalo
              </a>
            </div>
          </div>
        </div>
      )}"""

app = app.replace(bad_drawer, good_drawer)
with open("apps/react/src/App.tsx", "w") as f:
    f.write(app)

with open("apps/react/src/styles.css", "r") as f:
    styles = f.read()

# Add CSS for mobile-list-item
styles += """
.mobile-drawer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mobile-list-item {
  display: block;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  color: var(--c-text);
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}
.mobile-list-item:active {
  background: #e9ecef;
}
.mobile-list-item--zalo {
  background: #a71e22;
  color: #FFF !important;
  margin-top: 8px;
}
"""

with open("apps/react/src/styles.css", "w") as f:
    f.write(styles)
