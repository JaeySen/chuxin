import os
import re

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"
app_tsx_path = os.path.join(base_dir, "App.tsx")
with open(app_tsx_path, "r") as f:
    app_tsx = f.read()

# 1. New Zalo Icon (White Monochrome)
NEW_ZALO = """function ZaloIcon() {
  return (
    <svg viewBox="0 0 50 50" fill="currentColor" width="22" height="22">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.779 43.589C10.1019 43.846 13.0061 43.1836 15.0682 42.1825C24.0225 47.1318 38.0197 46.8954 46.4923 41.4732C46.8209 40.9803 47.1279 40.4677 47.4128 39.9363C49.1062 36.7779 50.0004 33.22 50.0004 27.1316V22.7175C50.0004 16.629 49.1062 13.0711 47.4128 9.91273C45.7385 6.75436 43.2461 4.28093 40.0877 2.58758C36.9293 0.894239 33.3714 0 27.283 0H22.8499C17.6644 0 14.2982 0.652754 11.4699 1.89893C11.3153 2.03737 11.1636 2.17818 11.0151 2.32135C2.71734 10.3203 2.08658 27.6593 9.12279 37.0782C9.13064 37.0921 9.13933 37.1061 9.14889 37.1203C10.2334 38.7185 9.18694 41.5154 7.55068 43.1516C7.28431 43.399 7.37944 43.5512 7.779 43.5892Z" fill="white"/>
      <path d="M20.5632 17H10.8382V19.0853H17.5869L10.9329 27.3317C10.7244 27.635 10.5728 27.9194 10.5728 28.5639V29.0947H19.748C20.203 29.0947 20.5822 28.7156 20.5822 28.2606V27.1421H13.4922L19.748 19.2938C19.8428 19.1801 20.0134 18.9716 20.0893 18.8768L20.1272 18.8199C20.4874 18.2891 20.5632 17.8341 20.5632 17.2844V17Z" fill="currentColor"/>
      <path d="M32.9416 29.0947H34.3255V17H32.2402V28.3933C32.2402 28.7725 32.5435 29.0947 32.9416 29.0947Z" fill="currentColor"/>
      <path d="M25.814 19.6924C23.1979 19.6924 21.0747 21.8156 21.0747 24.4317C21.0747 27.0478 23.1979 29.171 25.814 29.171C28.4301 29.171 30.5533 27.0478 30.5533 24.4317C30.5723 21.8156 28.4491 19.6924 25.814 19.6924ZM25.814 27.2184C24.2785 27.2184 23.0273 25.9672 23.0273 24.4317C23.0273 22.8962 24.2785 21.645 25.814 21.645C27.3495 21.645 28.6007 22.8962 28.6007 24.4317C28.6007 25.9672 27.3685 27.2184 25.814 27.2184Z" fill="currentColor"/>
      <path d="M40.4867 19.6162C37.8516 19.6162 35.7095 21.7584 35.7095 24.3934C35.7095 27.0285 37.8516 29.1707 40.4867 29.1707C43.1217 29.1707 45.2639 27.0285 45.2639 24.3934C45.2639 21.7584 43.1217 19.6162 40.4867 19.6162ZM40.4867 27.2181C38.9322 27.2181 37.681 25.9669 37.681 24.4124C37.681 22.8579 38.9322 21.6067 40.4867 21.6067C42.0412 21.6067 43.2924 22.8579 43.2924 24.4124C43.2924 25.9669 42.0412 27.2181 40.4867 27.2181Z" fill="currentColor"/>
      <path d="M29.4562 29.0944H30.5747V19.957H28.6221V28.2793C28.6221 28.7153 29.0012 29.0944 29.4562 29.0944Z" fill="currentColor"/>
    </svg>
  );
}"""

app_tsx = re.sub(r'function ZaloIcon\(\) \{[\s\S]*?\n\}', NEW_ZALO, app_tsx)

# 2. Update FloatingContact Component
FLOATING_CONTACT = """function FloatingContact() {
  const [expanded, setExpanded] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
      setAtBottom(isBottom);
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

  const handleMobileClick = (e: React.MouseEvent, href: string) => {
    if (window.innerWidth <= 768 && !expanded) {
      e.preventDefault();
      setExpanded(true);
    }
  };

  return (
    <>
      {expanded && (
        <div className="fc-backdrop" onClick={() => setExpanded(false)} />
      )}
      <div className={`floating-contact ${expanded ? "fc-expanded" : ""} ${atBottom ? "fc-at-bottom" : ""}`} aria-label="Liên hệ">
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

app_tsx = re.sub(r'function FloatingContact\(\) \{[\s\S]*?</div>\n  \);\n}', FLOATING_CONTACT, app_tsx)

# 3. Footer Updates
FOOTER_SOCIALS_REMOVE = """            <div className="footer-socials">
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
            </div>"""
app_tsx = app_tsx.replace(FOOTER_SOCIALS_REMOVE, "")

FOOTER_COL_3 = """          <div className="footer-col footer-col-course">
            <h3 className="desktop-only">Khóa học</h3>
            <h3 className="mobile-only">Liên lạc với chúng tôi</h3>
            
            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/course/han1">HSK 1</Link>
              <Link to="/course/han2">HSK 2</Link>
              <Link to="/course/han3">HSK 3</Link>
              <Link to="/course/han4">HSK 4</Link>
            </div>
            
            <div className="mobile-only mobile-footer-contacts">
              <a href={CONTACT.tiktok} target="_blank" rel="noreferrer" className="fc-pill fc-btn-tiktok fc-expanded-inline">
                <span className="fc-text">Theo dõi trên TikTok</span>
                <span className="fc-icon"><TikTokIcon /></span>
              </a>
              <a href={CONTACT.facebook} target="_blank" rel="noreferrer" className="fc-pill fc-btn-facebook fc-expanded-inline">
                <span className="fc-text">Theo dõi trên Facebook</span>
                <span className="fc-icon"><FacebookIcon /></span>
              </a>
              <a href={CONTACT.zalo} target="_blank" rel="noreferrer" className="fc-pill fc-btn-zalo fc-expanded-inline">
                <span className="fc-text">Chat qua Zalo</span>
                <span className="fc-icon"><ZaloIcon /></span>
              </a>
              <a href={`tel:${CONTACT.phone}`} className="fc-pill fc-btn-phone fc-expanded-inline">
                <span className="fc-text">Gọi điện thoại</span>
                <span className="fc-icon"><PhoneIcon /></span>
              </a>
            </div>
          </div>"""

# Replace the 3rd column
app_tsx = re.sub(r'<div className="footer-col">\n\s*<h3>Khóa học</h3>[\s\S]*?</div>', FOOTER_COL_3, app_tsx)

with open(app_tsx_path, "w") as f:
    f.write(app_tsx)

# 4. Update styles.css
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

# Replace fc-pill styles
NEW_CSS = """
/* Floating Contact Brand Colors */
.fc-pill {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: white !important;
  border-radius: 999px;
  height: 48px;
  text-decoration: none !important;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: max-width 0.4s ease, transform 0.2s ease;
  max-width: 48px;
}
.fc-btn-facebook { background: #1877F2; }
.fc-btn-tiktok { background: #000000; }
.fc-btn-zalo { background: #0068FF; }
.fc-btn-phone { background: #25D366; }

.fc-pill:hover, .fc-pill:focus, .fc-pill:active {
  max-width: 250px;
}
.fc-expanded-inline {
  max-width: 100% !important;
  justify-content: flex-start;
  flex-direction: row-reverse; /* icon left, text right */
  margin-bottom: 12px;
}
.fc-expanded-inline .fc-text {
  opacity: 1 !important;
  max-width: 100% !important;
  padding-left: 0 !important;
  padding-right: 16px;
}

/* Mobile backdrop and expand logic */
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
    transition: bottom 0.3s ease;
  }
  .floating-contact.fc-expanded {
    z-index: 900;
  }
  .floating-contact.fc-expanded .fc-pill {
    max-width: 250px;
  }
  .floating-contact.fc-expanded .fc-text {
    opacity: 1;
    padding-left: 16px;
    max-width: 200px;
  }
  .floating-contact.fc-at-bottom {
    bottom: 80px; /* Avoid copyright */
    opacity: 0;
    pointer-events: none; /* Hide entirely if they prefer, or just move up. Let's hide it completely since it's now in the footer! */
  }
  .desktop-only { display: none !important; }
  .mobile-only { display: block !important; }
}
@media (min-width: 769px) {
  .desktop-only { display: block !important; }
  .mobile-only { display: none !important; }
}
"""

styles = re.sub(r'\.fc-pill \{[\s\S]*?width: 24px;\n  height: 24px;\n\}', '', styles)
styles = styles + "\n" + NEW_CSS

with open(styles_path, "w") as f:
    f.write(styles)

print("Done scripts 8")
