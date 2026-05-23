import { el } from "/shared/ui.js";
import { recordAttempt } from "/shared/progress.js";

export function mount(host, lesson) {
  host.innerHTML = "";
  injectStyle();

  let showPinyin = true, showVi = true, hideRole = null;

  const speakers = lesson.roles ?? [...new Set(lesson.lines.map((l) => l.speaker))];
  const colors = ["#0EA5E9", "#FF8C00", "#10B981", "#8B5CF6"];
  const speakerColor = new Map(speakers.map((s, i) => [s, colors[i % colors.length]]));

  const controls = el("div", { class: "row gap", style: "flex-wrap:wrap; margin-bottom:14px;" });
  controls.appendChild(makeToggle("Ẩn pinyin", () => { showPinyin = !showPinyin; rerender(); }));
  controls.appendChild(makeToggle("Ẩn nghĩa", () => { showVi = !showVi; rerender(); }));
  speakers.forEach((s) => {
    controls.appendChild(makeToggle(`Ẩn vai «${s}»`, () => {
      hideRole = hideRole === s ? null : s;
      rerender();
    }));
  });
  host.appendChild(controls);

  const list = el("div", { class: "dlg-list" });
  host.appendChild(list);

  rerender();

  host.appendChild(el("button", {
    class: "btn btn-primary", style: "margin-top:18px;",
    onClick: () => recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true })
      .then(() => host.appendChild(el("div", { class: "feedback feedback-ok" }, "Đã đánh dấu hoàn thành."))),
  }, "Đánh dấu đã đọc xong"));

  function rerender() {
    list.innerHTML = "";
    lesson.lines.forEach((line) => {
      const isHidden = hideRole === line.speaker;
      const row = el("div", { class: "dlg-line" });
      row.style.borderLeft = `4px solid ${speakerColor.get(line.speaker) ?? "#999"}`;
      row.appendChild(el("div", { class: "dlg-speaker" }, line.speaker));
      row.appendChild(el("div", { class: "hanzi", style: "font-size:18px;" },
        isHidden ? "（隐藏）" : line.hanzi));
      if (showPinyin && !isHidden)
        row.appendChild(el("div", { class: "muted", style: "font-size:13px; margin-top:2px;" }, line.pinyin));
      if (showVi && !isHidden)
        row.appendChild(el("div", { style: "margin-top:2px; font-size:14px;" }, line.vi));
      if (line.audioUrl)
        row.appendChild(el("button", {
          class: "btn btn-audio btn-sm", style: "margin-top:8px;",
          onClick: () => { const a = new Audio(line.audioUrl); a.play().catch(() => {}); },
        }, "▶︎"));
      list.appendChild(row);
    });
  }
}

function makeToggle(label, onClick) {
  return el("button", { class: "btn btn-ghost btn-sm", onClick }, label);
}

function injectStyle() {
  if (document.getElementById("dlg-style")) return;
  const s = document.createElement("style");
  s.id = "dlg-style";
  s.textContent = `
    .dlg-list { display: flex; flex-direction: column; gap: 10px; }
    .dlg-line { background: white; padding: 12px 16px; border-radius: 10px;
      box-shadow: 0 1px 3px var(--c-shadow); }
    .dlg-speaker { font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--c-text-soft); margin-bottom: 4px; }
  `;
  document.head.appendChild(s);
}
