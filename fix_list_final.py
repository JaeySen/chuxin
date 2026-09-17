import re
with open("apps/react/src/App.tsx", "r") as f:
    app = f.read()

# Remove the drawer header
header_block = """          <div className="mobile-drawer-header" style={{ justifyContent: 'flex-end', borderBottom: 'none' }}>
            <button className="mobile-drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
          </div>"""
app = app.replace(header_block, "")

# Remove any other potential drawer headers
app = re.sub(r'<div className="mobile-drawer-header"[\s\S]*?</div>\n', '', app)

with open("apps/react/src/App.tsx", "w") as f:
    f.write(app)

with open("apps/react/src/styles.css", "r") as f:
    styles = f.read()

# Replace the mobile-list-item CSS
old_css = """.mobile-drawer-list {
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
}"""

new_css = """.mobile-drawer-list {
  display: flex;
  flex-direction: column;
}
.mobile-list-item {
  display: block;
  padding: 20px 0;
  font-size: 1.15rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--c-text);
  background: transparent;
  border-bottom: 1px solid #eaeaea;
  text-align: left;
}
.mobile-list-item:active {
  background: #f9f9f9;
}
.mobile-list-item--zalo {
  background: #a71e22;
  color: #FFF !important;
  margin-top: 24px;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  border-bottom: none;
  font-weight: 600;
}"""

styles = styles.replace(old_css, new_css)

with open("apps/react/src/styles.css", "w") as f:
    f.write(styles)
