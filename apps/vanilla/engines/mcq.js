import { el } from "/shared/ui.js";
import { scoreStrip, setStripCounter, timer, summary } from "/shared/engine-base.js";

export function mount(host, lesson) {
  let idx = 0, correct = 0, wrong = 0;
  const qs = lesson.questions;

  host.innerHTML = "";
  const strip = scoreStrip({ total: qs.length });
  const t = timer((label) => {
    const e = strip.querySelector("#ss-time");
    if (e) e.textContent = `⏱ ${label}`;
  });
  const stage = el("div", {});
  host.appendChild(strip);
  host.appendChild(stage);
  render();

  function render() {
    setStripCounter(strip, { idx: idx + 1, total: qs.length, correct, wrong });
    if (idx >= qs.length) {
      t.stop();
      summary({ host, lessonId: lesson.id, score: correct, total: qs.length,
        durationSec: t.elapsed(),
        onRetry: () => { idx = 0; correct = 0; wrong = 0; mount(host, lesson); } });
      return;
    }
    const q = qs[idx];
    stage.innerHTML = "";
    if (q.audioUrl) {
      const a = new Audio(q.audioUrl);
      stage.appendChild(el("button", {
        class: "btn btn-audio",
        onClick: () => { a.currentTime = 0; a.play().catch(() => {}); },
      }, "▶︎ Nghe"));
    }
    stage.appendChild(el("h3", { style: "margin: 14px 0 18px;" }, q.prompt));
    const opts = el("div", {});
    q.options.forEach((opt, i) => {
      const b = el("button", { class: "option-btn", type: "button" }, opt);
      b.addEventListener("click", () => choose(b, i, q));
      opts.appendChild(b);
    });
    stage.appendChild(opts);
  }

  function choose(btn, i, q) {
    const buttons = stage.querySelectorAll(".option-btn");
    buttons.forEach((b, j) => {
      b.disabled = true;
      if (j === q.correctIndex) b.classList.add("correct");
      if (b === btn && i !== q.correctIndex) b.classList.add("wrong");
    });
    if (i === q.correctIndex) correct++; else wrong++;
    setStripCounter(strip, { idx: idx + 1, total: qs.length, correct, wrong });

    const fb = el("div", {
      class: `feedback ${i === q.correctIndex ? "feedback-ok" : "feedback-bad"}`,
    }, i === q.correctIndex ? "Chính xác!" : "Chưa đúng. ");
    if (q.explanation) fb.appendChild(el("div", { style: "margin-top:6px;" }, q.explanation));
    stage.appendChild(fb);

    const next = el("button", { class: "btn btn-primary", style: "margin-top:14px;" },
      idx + 1 === qs.length ? "Xem kết quả" : "Câu tiếp");
    next.addEventListener("click", () => { idx++; render(); });
    stage.appendChild(next);
  }
}
