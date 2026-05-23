import { el, shuffle } from "/shared/ui.js";
import { recordAttempt } from "/shared/progress.js";

export function mount(host, lesson) {
  host.innerHTML = "";
  injectStyle();
  let drawn = false;
  const drawCount = lesson.drawCount ?? 1;

  host.appendChild(el("p", { class: "muted" },
    `Bấm vào lá thăm để nhận ${drawCount} chủ đề ngẫu nhiên.`));

  const stage = el("div", { class: "draw-stage" });
  const ticket = el("button", { class: "draw-ticket" });
  ticket.innerHTML = `<div style="font-size:42px;">🎟️</div><div>Bốc thăm</div>`;
  ticket.addEventListener("click", draw);
  stage.appendChild(ticket);
  host.appendChild(stage);

  const result = el("div", { class: "draw-result hidden" });
  host.appendChild(result);

  function draw() {
    if (drawn) return;
    drawn = true;
    ticket.style.transform = "rotate(720deg) scale(0.6)";
    ticket.style.opacity = "0";
    setTimeout(() => {
      const picked = shuffle(lesson.outcomes).slice(0, drawCount);
      result.classList.remove("hidden");
      result.innerHTML = "";
      result.appendChild(el("h3", {}, "Chủ đề của bạn:"));
      picked.forEach((p, i) => {
        result.appendChild(el("div", { class: "draw-card" }, `${i + 1}. ${p}`));
      });
      result.appendChild(el("button", {
        class: "btn btn-primary", style: "margin-top: 18px;",
        onClick: () => mount(host, lesson),
      }, "Bốc lại"));
      recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
    }, 700);
  }
}

function injectStyle() {
  if (document.getElementById("ld-style")) return;
  const s = document.createElement("style");
  s.id = "ld-style";
  s.textContent = `
    .draw-stage { text-align: center; padding: 40px 0; }
    .draw-ticket { background: linear-gradient(135deg, #FF8C00, #fbbf24);
      color: white; border: 0; padding: 30px 40px; border-radius: 18px;
      font-size: 18px; font-weight: 600; cursor: pointer;
      box-shadow: 0 12px 30px rgba(255,140,0,0.4);
      transition: transform 0.7s, opacity 0.7s; }
    .draw-ticket:hover { transform: scale(1.05); }
    .draw-result.hidden { display: none; }
    .draw-card { background: var(--c-warm-bg); border-left: 4px solid var(--c-warm);
      padding: 14px 18px; border-radius: 10px; margin: 10px 0; font-size: 18px; }
  `;
  document.head.appendChild(s);
}
