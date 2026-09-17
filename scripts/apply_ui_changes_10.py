import os
import re

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"
app_tsx_path = os.path.join(base_dir, "App.tsx")
with open(app_tsx_path, "r") as f:
    app_tsx = f.read()

# 1. Update FloatingContact Component
FLOATING_CONTACT = """function FloatingContact() {
  const [expandedClick, setExpandedClick] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // If we are near the bottom (in the footer)
      const isFooter = window.innerHeight + window.scrollY >= document.body.offsetHeight - 350;
      setAtFooter(isFooter);
      if (!isFooter) {
        setExpandedClick(false); // auto-close blur when scrolling away
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const buttons = [
    { label: "TikTok",    href: CONTACT.tiktok,   text: "Theo dõi trên TikTok", className: "fc-btn-tiktok",   svg: <TikTokIcon /> },
    { label: "Facebook",  href: CONTACT.facebook,  text: "Theo dõi trên Facebook", className: "fc-btn-facebook", svg: <FacebookIcon /> },
    { label: "Zalo",      href: CONTACT.zalo,      text: "Chat qua Zalo", className: "fc-btn-zalo",      svg: <ZaloIcon /> },
    { label: "Điện thoại", href: `tel:${CONTACT.phone}`, text: "Gọi điện thoại", className: "fc-btn-phone", svg: <PhoneIcon /> },
  ];

  const isExpanded = expandedClick || atFooter;
  const showBlur = expandedClick && !atFooter;

  const handleMobileClick = (e: React.MouseEvent, href: string) => {
    if (window.innerWidth <= 768 && !isExpanded) {
      e.preventDefault();
      setExpandedClick(true);
    }
  };

  return (
    <>
      {showBlur && (
        <div className="fc-backdrop" onClick={() => setExpandedClick(false)} />
      )}
      <div className={`floating-contact ${isExpanded ? "fc-expanded" : ""} ${atFooter ? "fc-at-footer" : ""}`} aria-label="Liên hệ">
        {buttons.map((b) => (
          <a key={b.label} href={b.href} className={`fc-pill ${b.className}`}
             target={b.href.startsWith("tel:") ? undefined : "_blank"}
             rel="noopener noreferrer" aria-label={b.label}
             onClick={(e) => handleMobileClick(e, b.href)}>
            <span className="fc-text">{b.text}</span>
            <span className="fc-icon">{b.svg}</span>
          </a>
        ))}
      </div>
    </>
  );
}"""

app_tsx = re.sub(r'function FloatingContact\(\) \{[\s\S]*?</div>\n    </>\n  \);\n}', FLOATING_CONTACT, app_tsx)

# 2. Revert the Footer Column 3 back to original "Khóa học" BUT with "Liên lạc với chúng tôi" on mobile
FOOTER_COL_3 = """          <div className="footer-col footer-col-course">
            <h3 className="desktop-only">Khóa học</h3>
            <h3 className="mobile-only">Liên lạc với chúng tôi</h3>
            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/course/han1">HSK 1</Link>
              <Link to="/course/han2">HSK 2</Link>
              <Link to="/course/han3">HSK 3</Link>
              <Link to="/course/han4">HSK 4</Link>
            </div>
            {/* The mobile inline contacts have been removed so it's empty on mobile, leaving space for the floating contacts! */}
            <div className="mobile-only" style={{ height: '200px' }} />
          </div>"""

app_tsx = re.sub(r'<div className="footer-col footer-col-course">[\s\S]*?</div>\n          </div>', FOOTER_COL_3, app_tsx)

with open(app_tsx_path, "w") as f:
    f.write(app_tsx)

# 3. Update styles.css
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

# Remove old `.fc-backdrop` and `.fc-expanded` logic so we can write clean ones.
styles = re.sub(r'\.fc-backdrop \{[\s\S]*?z-index: 899;\n  \}', '', styles)
styles = re.sub(r'\.floating-contact\.fc-at-bottom \{[\s\S]*?\}', '', styles)
styles = re.sub(r'\.fc-expanded-inline \{[\s\S]*?\}', '', styles)
styles = re.sub(r'\.fc-expanded-inline \.fc-text \{[\s\S]*?\}', '', styles)
styles = re.sub(r'\.floating-contact\.fc-expanded \{[\s\S]*?\}', '', styles)
styles = re.sub(r'\.floating-contact\.fc-expanded \.fc-pill \{[\s\S]*?\}', '', styles)
styles = re.sub(r'\.floating-contact\.fc-expanded \.fc-text \{[\s\S]*?\}', '', styles)

NEW_CSS = """
/* Floating Contact Fixes */
.fc-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
/* Ensure perfect centering of the SVG inside the 48x48 icon container */
.fc-icon svg {
  width: 24px;
  height: 24px;
  display: block;
}
.fc-btn-facebook .fc-icon svg {
  width: 26px;
  height: 26px;
}
.fc-btn-tiktok .fc-icon svg {
  width: 22px;
  height: 22px;
}
.fc-btn-zalo .fc-icon svg {
  width: 26px;
  height: 26px;
}
.fc-btn-phone .fc-icon svg {
  width: 24px;
  height: 24px;
}

.fc-pill {
  transition: max-width 0.4s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s ease;
}
/* Expanded State applies on hover OR via .fc-expanded class */
.fc-pill:hover, .fc-pill:focus, .fc-pill:active, .floating-contact.fc-expanded .fc-pill {
  max-width: 250px;
}
.fc-text {
  padding-left: 0;
  padding-right: 0;
}
.fc-pill:hover .fc-text, .fc-pill:focus .fc-text, .fc-pill:active .fc-text, .floating-contact.fc-expanded .fc-text {
  opacity: 1;
  padding-left: 20px;
  padding-right: 4px;
  max-width: 200px;
}

.fc-backdrop {
  display: none;
}
@media (max-width: 768px) {
  .fc-backdrop {
    display: block;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    backdrop-filter: blur(5px);
    background: rgba(0,0,0,0.3);
    z-index: 899;
  }
  .floating-contact {
    transition: bottom 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .floating-contact.fc-expanded {
    z-index: 900;
  }
  /* Push higher when at footer to avoid copyright text */
  .floating-contact.fc-at-footer {
    bottom: 90px;
  }
}
"""

styles = styles + "\n" + NEW_CSS

with open(styles_path, "w") as f:
    f.write(styles)

print("Done script 10")
