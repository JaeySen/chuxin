import { el } from "./ui.js";
import { recordAttempt } from "./progress.js";

export function scoreStrip({ total }) {
  const wrap = el(
    "div",
    { class: "score-strip" },
    el("span", { class: "pill", id: "ss-progress" }, `1 / ${total}`),
    el("span", { class: "pill pill-correct", id: "ss-correct" }, "✓ 0"),
    el("span", { class: "pill pill-wrong", id: "ss-wrong" }, "✗ 0"),
    el("span", { class: "pill pill-warm", id: "ss-time" }, "⏱ 0:00"),
  );
  return wrap;
}

export function timer(onTick) {
  const start = Date.now();
  const i = setInterval(() => {
    const s = Math.floor((Date.now() - start) / 1000);
    onTick(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`, s);
  }, 500);
  return {
    stop: () => clearInterval(i),
    elapsed: () => Math.floor((Date.now() - start) / 1000),
  };
}

export function summary({ host, lessonId, score, total, durationSec, onRetry }) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const card = el(
    "div",
    { class: "summary-card" },
    el("h2", {}, "Hoàn thành! 🎉"),
    el("div", { class: "summary-score" }, `${score} / ${total}`),
    el("div", { class: "muted" }, `Điểm: ${pct}%  · Thời gian: ${Math.floor(durationSec / 60)}m ${durationSec % 60}s`),
    el(
      "div",
      { class: "row gap", style: "justify-content:center; margin-top:24px;" },
      el(
        "button",
        { class: "btn btn-primary", onClick: () => onRetry?.() },
        "Làm lại",
      ),
      el("a", { class: "btn btn-ghost", href: "/" }, "Về trang chính"),
    ),
  );
  host.innerHTML = "";
  host.appendChild(card);

  recordAttempt(lessonId, {
    score: pct,
    durationSec,
    completed: pct >= 60,
  }).catch((e) => console.warn("recordAttempt failed:", e));
}

export function setStripCounter(host, { idx, total, correct, wrong }) {
  const p = host.querySelector("#ss-progress");
  if (p) p.textContent = `${idx} / ${total}`;
  const c = host.querySelector("#ss-correct");
  if (c) c.textContent = `✓ ${correct}`;
  const w = host.querySelector("#ss-wrong");
  if (w) w.textContent = `✗ ${wrong}`;
}
