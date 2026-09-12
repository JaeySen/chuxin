import os

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"

# 1. Update Home.tsx
home_tsx_path = os.path.join(base_dir, "pages/Home.tsx")
with open(home_tsx_path, "r") as f:
    home_tsx = f.read()

# Remove the info label and adjust spacing
home_tsx = home_tsx.replace("""let tx = offset * 180;""", """let tx = offset * 220;""")

home_tsx = home_tsx.replace("""            <img src={t.file} alt={t.name} />
            <div className="coverflow-info">
              <h4>{t.name}</h4>
              <p>Thạc sĩ Hán ngữ Quốc tế</p>
            </div>
            {offset === 0 && (""", """            <img src={t.file} alt={t.name} />
            {offset === 0 && (""")

with open(home_tsx_path, "w") as f:
    f.write(home_tsx)


# 2. Update styles.css
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

# Update coverflow card size, object-fit, and remove shadows
styles = styles.replace("""/* 3D Coverflow Teachers */
.coverflow-container {
  position: relative;
  height: 520px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin: 20px 0;
}
.coverflow-card {
  position: absolute;
  width: 320px;
  height: 440px;
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
}""", """/* 3D Coverflow Teachers */
.coverflow-container {
  position: relative;
  height: 480px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin: 20px 0;
}
.coverflow-card {
  position: absolute;
  width: 90vw;
  max-width: 400px;
  height: 400px;
  background: transparent;
  border-radius: 16px;
  box-shadow: none;
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.6s, z-index 0s;
  cursor: pointer;
  will-change: transform;
}
.coverflow-card img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
  display: block;
}
.coverflow-card-active {
  box-shadow: none;
}""")

# Remove coverflow info CSS
import re
styles = re.sub(r'/\* Coverflow Info \*/[\s\S]*?\/\* Portal Grid Styling \*/', '/* Portal Grid Styling */', styles)

with open(styles_path, "w") as f:
    f.write(styles)

print("Done")
