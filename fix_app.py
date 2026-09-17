import re
with open("apps/react/src/App.tsx", "r") as f:
    app = f.read()

app = app.replace("setMobileOpen", "setMenuOpen")
app = app.replace("mobileOpen", "menuOpen")
app = app.replace("background: '#0068FF'", "background: '#a71e22'")

with open("apps/react/src/App.tsx", "w") as f:
    f.write(app)
