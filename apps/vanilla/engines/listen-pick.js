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
    let playCount = 0;
    const playBtn = el("button", { class: "btn btn-audio" }, "▶︎ Nghe");
    playBtn.addEventListener("click", () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      playCount++;
    });
    stage.appendChild(playBtn);
    if (it.prompt) stage.appendChild(el("h3", { style: "margin: 14px 0 18px;" }, it.prompt));

    const opts = el("div", { style: "margin-top: 14px;" });
    it.options.forEach((opt, i) => {
      const b = el("button", { class: "option-btn" }, opt);
      b.addEventListener("click", () => choose(b, i, it));
      opts.appendChild(b);
    });
    stage.appendChild(opts);
  }

  function choose(btn, i, it) {
    const buttons = stage.querySelectorAll(".option-btn");
    buttons.forEach((b, j) => {
      b.disabled = true;
      if (j === it.correctIndex) b.classList.add("correct");
      if (b === btn && i !== it.correctIndex) b.classList.add("wrong");
    });
    if (i === it.correctIndex) correct++; else wrong++;
    setStripCounter(strip, { idx: idx + 1, total: items.length, correct, wrong });

    const fb = el("div", {
      class: `feedback ${i === it.correctIndex ? "feedback-ok" : "feedback-bad"}`,
    });
    fb.innerHTML = i === it.correctIndex ? "Chính xác!" : "Chưa đúng.";
    if (it.transcript) {
      fb.appendChild(el("div", { style: "margin-top:6px;" },
        `Phiên âm: ${it.transcript}`));
    }
    stage.appendChild(fb);
    const next = el("button", { class: "btn btn-primary", style: "margin-top:14px;" },
      idx + 1 === items.length ? "Xem kết quả" : "Câu tiếp");
    next.addEventListener("click", () => { idx++; render(); });
    stage.appendChild(next);
  }
}
