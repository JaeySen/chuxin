import { el } from "/shared/ui.js";
import { recordAttempt } from "/shared/progress.js";
import { timer } from "/shared/engine-base.js";

export function mount(host, lesson) {
  host.innerHTML = "";
  injectStyle();
  let pos = lesson.startIndex;
  let mistakes = 0;
  const tEl = el("div", { class: "muted" }, "⏱ 0:00");
  const t = timer((label) => { tEl.textContent = `⏱ ${label}`; });

  host.appendChild(el("div", { class: "row gap", style: "justify-content:space-between;" },
    el("div", { class: "muted" }, `Bấm theo thứ tự bắt đầu từ ô đầu tiên`), tEl));

  const grid = el("div", { class: "count-grid" });
  grid.style.gridTemplateColumns = `repeat(${lesson.gridCols ?? 5}, 1fr)`;
  lesson.cells.forEach((c, i) => {
    const cell = el("button", { class: "count-cell hanzi", "data-i": String(i) }, c);
    if (i === lesson.startIndex) cell.classList.add("start");
    if (i === lesson.endIndex) cell.classList.add("end");
    cell.addEventListener("click", () => clickCell(i, cell));
    grid.appendChild(cell);
  });
  host.appendChild(grid);

  function clickCell(i, cell) {
    if (cell.classList.contains("done")) return;
    if (i === pos) {
      cell.classList.add("done");
      if (i === lesson.endIndex) finish();
      else pos++;
    } else {
      cell.classList.add("shake");
      mistakes++;
      setTimeout(() => cell.classList.remove("shake"), 500);
    }
  }

  function finish() {
    t.stop();
    const sec = t.elapsed();
    const score = Math.max(0, 100 - mistakes * 10);
    recordAttempt(lesson.id, { score, durationSec: sec, completed: true });
    setTimeout(() => {
      host.innerHTML = `<div class="summary-card">
        <h2>Đã đến đích! 🏁</h2>
        <div class="summary-score">${score}/100</div>
        <div class="muted">Số ô bấm sai: ${mistakes} · Thời gian: ${Math.floor(sec / 60)}m ${sec % 60}s</div>
        <div class="row gap" style="justify-content:center; margin-top:24px;">
          <a class="btn btn-primary" href="/">Về trang chính</a>
          <button class="btn btn-ghost" id="retry">Chơi lại</button>
        </div></div>`;
      host.querySelector("#retry").addEventListener("click", () => mount(host, lesson));
    }, 400);
  }
}

function injectStyle() {
  if (document.getElementById("cg-style")) return;
  const s = document.createElement("style");
  s.id = "cg-style";
  s.textContent = `
    .count-grid { display: grid; gap: 8px; margin-top: 16px; }
    .count-cell { padding: 18px; border-radius: 12px; border: 2px solid var(--c-divider);
      background: white; font-size: 18px; cursor: pointer; transition: all 0.15s; font-weight:600; }
    .count-cell:hover { border-color: var(--c-orange); transform: scale(1.03); }
    .count-cell.done { background: var(--c-correct-bg); border-color: var(--c-correct); }
    .count-cell.start { box-shadow: inset 0 0 0 3px var(--c-orange); }
    .count-cell.end { box-shadow: inset 0 0 0 3px var(--c-blue); }
    .count-cell.shake { background: var(--c-wrong-bg); animation: cgshake 0.4s; }
    @keyframes cgshake {
      0%,100% { transform: translateX(0); }
      25% { transform: translateX(-6px); }
      75% { transform: translateX(6px); }
    }
  `;
  document.head.appendChild(s);
}
