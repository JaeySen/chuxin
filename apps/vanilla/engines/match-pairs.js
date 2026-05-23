import { el, shuffle } from "/shared/ui.js";
import { recordAttempt } from "/shared/progress.js";
import { timer } from "/shared/engine-base.js";

export function mount(host, lesson) {
  host.innerHTML = "";
  const tiles = [];
  lesson.pairs.forEach((p, i) => {
    tiles.push({ id: i, value: p.a, side: "a" });
    tiles.push({ id: i, value: p.b, side: "b" });
  });
  const shuffled = shuffle(tiles);

  injectStyle();
  const t = timer((label) => { tEl.textContent = `⏱ ${label}`; });

  const tEl = el("div", { class: "muted" }, "⏱ 0:00");
  host.appendChild(el("div", { class: "row gap", style: "justify-content:space-between;" },
    el("div", { class: "muted" }, "Tìm cặp tương ứng — bấm 2 thẻ để ghép"),
    tEl));

  const board = el("div", { class: "match-board" });
  const states = []; // 'hidden' | 'open' | 'matched'
  const open = [];
  let matched = 0;

  shuffled.forEach((tile, idx) => {
    const cell = el("button", { class: "match-cell", "data-idx": String(idx) }, "?");
    cell.addEventListener("click", () => flip(idx));
    board.appendChild(cell);
    states.push("hidden");
  });
  host.appendChild(board);

  function flip(idx) {
    if (states[idx] !== "hidden" || open.length === 2) return;
    const tile = shuffled[idx];
    const cell = board.children[idx];
    cell.textContent = tile.value;
    cell.classList.add("open");
    states[idx] = "open";
    open.push(idx);
    if (open.length === 2) {
      const [a, b] = open;
      const ta = shuffled[a], tb = shuffled[b];
      if (ta.id === tb.id && ta.side !== tb.side) {
        states[a] = states[b] = "matched";
        board.children[a].classList.add("matched");
        board.children[b].classList.add("matched");
        matched++;
        open.length = 0;
        if (matched === lesson.pairs.length) finish();
      } else {
        setTimeout(() => {
          board.children[a].textContent = "?";
          board.children[b].textContent = "?";
          board.children[a].classList.remove("open");
          board.children[b].classList.remove("open");
          states[a] = states[b] = "hidden";
          open.length = 0;
        }, 800);
      }
    }
  }

  function finish() {
    t.stop();
    const sec = t.elapsed();
    recordAttempt(lesson.id, { score: 100, durationSec: sec, completed: true });
    setTimeout(() => {
      host.innerHTML = `<div class="summary-card">
        <h2>Đã ghép xong! 🎉</h2>
        <div class="summary-score">${lesson.pairs.length} cặp</div>
        <div class="muted">Thời gian: ${Math.floor(sec / 60)}m ${sec % 60}s</div>
        <div class="row gap" style="justify-content:center; margin-top:24px;">
          <a class="btn btn-primary" href="/">Về trang chính</a>
          <button class="btn btn-ghost" id="retry">Chơi lại</button>
        </div></div>`;
      host.querySelector("#retry").addEventListener("click", () => mount(host, lesson));
    }, 600);
  }
}

function injectStyle() {
  if (document.getElementById("match-style")) return;
  const s = document.createElement("style");
  s.id = "match-style";
  s.textContent = `
    .match-board { display: grid; gap: 10px; margin-top: 16px;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
    .match-cell {
      min-height: 78px; border-radius: 14px; cursor: pointer;
      background: var(--c-blue); color: white; font-size: 22px;
      font-weight: 600; border: none;
      transition: all 0.2s ease;
    }
    .match-cell.open { background: white; color: var(--c-text);
      border: 2px solid var(--c-orange); }
    .match-cell.matched { background: var(--c-correct-bg); color: #166534;
      border: 2px solid var(--c-correct); cursor: default; }
  `;
  document.head.appendChild(s);
}
