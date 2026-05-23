import { el } from "/shared/ui.js";
import { recordAttempt } from "/shared/progress.js";

export function mount(host, lesson) {
  host.innerHTML = "";
  const sceneById = new Map(lesson.scenes.map((s) => [s.id, s]));
  let preferredHits = 0, totalChoices = 0;
  go(lesson.startScene);

  function go(id) {
    const s = sceneById.get(id);
    if (!s) {
      host.innerHTML = `<div class="feedback feedback-bad">Cảnh «${id}» không tồn tại.</div>`;
      return;
    }
    host.innerHTML = "";
    host.appendChild(el("div", { class: "rp-bubble" },
      el("div", { class: "rp-speaker" }, s.speaker),
      el("div", { class: "hanzi", style: "font-size:22px; margin-top:6px;" }, s.line),
      s.pinyin ? el("div", { class: "muted", style: "margin-top:4px;" }, s.pinyin) : null,
      s.vi ? el("div", { style: "margin-top:4px;" }, s.vi) : null,
      s.audioUrl ? el("button", {
        class: "btn btn-audio", style: "margin-top:10px;",
        onClick: () => { const a = new Audio(s.audioUrl); a.play().catch(() => {}); },
      }, "▶︎ Nghe") : null,
    ));

    if (s.end) {
      const score = totalChoices ? Math.round((preferredHits / totalChoices) * 100) : 100;
      recordAttempt(lesson.id, { score, durationSec: 0, completed: true });
      host.appendChild(el("div", { class: "summary-card", style: "margin-top:18px;" },
        el("h3", {}, "Kết thúc cảnh"),
        el("div", { class: "summary-score" }, `${score}/100`),
        el("div", { class: "muted" }, `Lựa chọn tốt: ${preferredHits}/${totalChoices}`),
        el("button", {
          class: "btn btn-primary", style: "margin-top:18px;",
          onClick: () => { preferredHits = 0; totalChoices = 0; mount(host, lesson); },
        }, "Chơi lại"),
      ));
      return;
    }

    const choices = el("div", { style: "margin-top: 18px;" });
    s.choices.forEach((c) => {
      const b = el("button", { class: "option-btn" });
      b.innerHTML = `<strong class="hanzi">${c.text}</strong>${c.vi ? `<div class="muted" style="font-size:13px; margin-top:2px;">${c.vi}</div>` : ""}`;
      b.addEventListener("click", () => {
        totalChoices++;
        if (c.isPreferred) preferredHits++;
        go(c.next);
      });
      choices.appendChild(b);
    });
    host.appendChild(choices);
    injectStyle();
  }
}

function injectStyle() {
  if (document.getElementById("rp-style")) return;
  const s = document.createElement("style");
  s.id = "rp-style";
  s.textContent = `
    .rp-bubble { background: white; border-left: 4px solid var(--c-blue);
      padding: 18px 20px; border-radius: 12px;
      box-shadow: 0 4px 14px var(--c-shadow); }
    .rp-speaker { font-size: 13px; font-weight: 600; color: var(--c-blue);
      text-transform: uppercase; letter-spacing: 0.06em; }
  `;
  document.head.appendChild(s);
}
