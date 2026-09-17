import re
with open("apps/react/src/styles.css", "r") as f:
    styles = f.read()

broken = """  .floating-contact {
    transition: bottom 0.3s ease;
  }
  
  
  
  
  .desktop-only { display: none !important; }
  .mobile-only { display: block !important; }
}
@media (min-width: 769px) {
  .desktop-only { display: block !important; }
  .mobile-only { display: none !important; }
}"""

fixed = """@media (max-width: 768px) {
  .desktop-only { display: none !important; }
  .mobile-only { display: block !important; }
}
@media (min-width: 769px) {
  .desktop-only { display: block !important; }
  .mobile-only { display: none !important; }
}"""

styles = styles.replace(broken, fixed)

with open("apps/react/src/styles.css", "w") as f:
    f.write(styles)
