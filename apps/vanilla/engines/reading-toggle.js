import { el } from "/shared/ui.js";
import { recordAttempt } from "/shared/progress.js";

export function mount(host, lesson) {
  host.innerHTML = "";
  let showPinyin = true, showVi = true;

  const controls = el("div", { class: "row gap", style: "margin-bottom:18px;" },
    el("button", { class: "btn", id: "tg-pinyin" }, "Ẩn pinyin"),
    el("button", { class: "btn", id: "tg-vi" }, "Ẩn nghĩa"),
  );
  host.appendChild(controls);

  const passage = el("div", { class: "reading-passage" });
  lesson.passage.forEach((line) => {
    const row = el("div", { class: "reading-line" });
    row.appendChild(el("div", { class: "hanzi", style: "font-size:22px;" }, line.hanzi));
    row.appendChild(el("div", { class: "muted py-line", style: "font-size:14px; margin-top:4px;" }, line.pinyin));
    row.appendChild(el("div", { class: "vi-line", style: "font-size:15px; margin-top:2px;" }, line.vi));
    passage.appendChild(row);
  });
  host.appendChild(passage);

  controls.querySelector("#tg-pinyin").addEventListener("click", (e) => {
    showPinyin = !showPinyin;
    e.target.textContent = showPinyin ? "Ẩn pinyin" : "Hiện pinyin";
    passage.querySelectorAll(".py-line").forEach((n) => n.style.display = showPinyin ? "" : "none");
  });
  controls.querySelector("#tg-vi").addEventListener("click", (e) => {
    showVi = !showVi;
    e.target.textContent = showVi ? "Ẩn nghĩa" : "Hiện nghĩa";
    passage.querySelectorAll(".vi-line").forEach((n) => n.style.display = showVi ? "" : "none");
  });

  if (lesson.vocab?.length) {
    host.appendChild(el("h3", { style: "margin-top:24px;" }, "Từ vựng"));
    const tbl = el("table", { class: "vocab-table" });
    const hdr = el("tr", {},
      el("th", {}, "Hán tự"), el("th", {}, "Pinyin"), el("th", {}, "Nghĩa"));
    tbl.appendChild(hdr);
    lesson.vocab.forEach((v) => {
      tbl.appendChild(el("tr", {},
        el("td", { class: "hanzi" }, v.hanzi),
        el("td", {}, v.pinyin),
        el("td", {}, v.vi)));
    });
    host.appendChild(tbl);
  }

  if (lesson.comprehension?.length) {
    host.appendChild(el("h3", { style: "margin-top:24px;" }, "Câu hỏi đọc hiểu"));
    let answered = 0, correct = 0;
    lesson.comprehension.forEach((q, qi) => {
      const wrap = el("div", { style: "margin: 14px 0;" });
      wrap.appendChild(el("div", { style: "font-weight:600;" }, `${qi + 1}. ${q.prompt}`));
      q.options.forEach((opt, oi) => {
        const b = el("button", { class: "option-btn" }, opt);
        b.addEventListener("click", () => {
          wrap.querySelectorAll(".option-btn").forEach((x) => x.disabled = true);
          if (oi === q.correctIndex) { b.classList.add("correct"); correct++; }
          else { b.classList.add("wrong"); wrap.querySelectorAll(".option-btn")[q.correctIndex].classList.add("correct"); }
          answered++;
          if (answered === lesson.comprehension.length) {
            recordAttempt(lesson.id, {
              score: Math.round((correct / lesson.comprehension.length) * 100),
              durationSec: 0, completed: true,
            });
          }
        });
        wrap.appendChild(b);
      });
      host.appendChild(wrap);
    });
  } else {
    recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
  }

  injectStyle();
}

function injectStyle() {
  if (document.getElementById("rt-style")) return;
  const s = document.createElement("style");
  s.id = "rt-style";
  s.textContent = `
    .reading-passage { background: white; border-radius: 14px;
      border: 1px solid var(--c-divider); padding: 20px; }
    .reading-line { padding: 8px 0; border-bottom: 1px dashed var(--c-divider); }
    .reading-line:last-child { border-bottom: 0; }
    .vocab-table { width: 100%; border-collapse: collapse; margin-top: 8px;
      background: white; border-radius: 12px; overflow: hidden; }
    .vocab-table th, .vocab-table td { padding: 10px 14px; text-align: left;
      border-bottom: 1px solid var(--c-divider); }
    .vocab-table th { background: #f1f5f9; font-weight: 600; }
  `;
  document.head.appendChild(s);
}
