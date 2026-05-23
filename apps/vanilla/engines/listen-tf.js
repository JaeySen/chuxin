import { el } from "/shared/ui.js";
import { scoreStrip, setStripCounter, timer, summary } from "/shared/engine-base.js";

export function mount(host, lesson) {
  let idx = 0, correct = 0, wrong = 0;
  const items = lesson.items;

  host.innerHTML = "";
  const strip = scoreStrip({ total: items.length });
  const t = timer((label) => {
    const e = strip.querySelector("#ss-time");
    if (e) e.textContent = `⏱ ${label}`;
  });
  const stage = el("div", {});
  host.appendChild(strip);
  host.appendChild(stage);
  render();

  function render() {
    setStripCounter(strip, { idx: idx + 1, total: items.length, correct, wrong });
    if (idx >= items.length) {
      t.stop();
      summary({ host, lessonId: lesson.id, score: correct, total: items.length,
        durationSec: t.elapsed(),
        onRetry: () => { idx = 0; correct = 0; wrong = 0; mount(host, lesson); } });
      return;
    }
    const it = items[idx];
    stage.innerHTML = "";
    const audio = new Audio(it.audioUrl);
    stage.appendChild(el("button", {
      class: "btn btn-audio",
      onClick: () => { audio.currentTime = 0; audio.play().catch(() => {}); },
    }, "▶︎ Nghe đoạn"));
    stage.appendChild(el("h3", { style: "margin: 14px 0 18px;" }, it.statement));

    const tBtn = el("button", { class: "option-btn", style: "background:#f0fdf4;" }, "对 — Đúng");
    const fBtn = el("button", { class: "option-btn", style: "background:#fef2f2;" }, "错 — Sai");
    tBtn.addEventListener("click", () => choose(true, tBtn, fBtn, it));
    fBtn.addEventListener("click", () => choose(false, tBtn, fBtn, it));
    stage.appendChild(tBtn);
    stage.appendChild(fBtn);
  }

  function choose(picked, tBtn, fBtn, it) {
    tBtn.disabled = fBtn.disabled = true;
    const right = it.correct ? tBtn : fBtn;
    right.classList.add("correct");
    const chosen = picked ? tBtn : fBtn;
    if (picked === it.correct) correct++;
    else { wrong++; chosen.classList.add("wrong"); }
    setStripCounter(strip, { idx: idx + 1, total: items.length, correct, wrong });

    const fb = el("div", {
      class: `feedback ${picked === it.correct ? "feedback-ok" : "feedback-bad"}`,
    }, picked === it.correct ? "Chính xác!" : "Chưa đúng.");
    if (it.transcript) fb.appendChild(el("div", { style: "margin-top:6px;" }, `Phiên âm: ${it.transcript}`));
    stage.appendChild(fb);
    const next = el("button", { class: "btn btn-primary", style: "margin-top:14px;" },
      idx + 1 === items.length ? "Xem kết quả" : "Câu tiếp");
    next.addEventListener("click", () => { idx++; render(); });
    stage.appendChild(next);
  }
}
