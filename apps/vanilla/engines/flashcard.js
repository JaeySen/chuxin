import { el } from "/shared/ui.js";
import { recordAttempt } from "/shared/progress.js";

export function mount(host, lesson) {
  let i = 0;
  const cards = lesson.cards;
  host.innerHTML = "";

  const scene = el("div", { class: "flashcard-scene" });
  const card = el("div", { class: "flashcard" });
  const front = el("div", { class: "card-face card-front" });
  const back = el("div", { class: "card-face card-back" });
  card.appendChild(front);
  card.appendChild(back);
  scene.appendChild(card);
  card.addEventListener("click", () => card.classList.toggle("is-flipped"));

  const counter = el("div", { class: "muted", style: "margin: 8px 0 14px; text-align:center;" });
  const nav = el("div", { class: "row gap", style: "justify-content:center;" },
    el("button", { class: "btn btn-ghost", onClick: () => move(-1) }, "← Trước"),
    el("button", { class: "btn btn-ghost", onClick: () => move(1) }, "Tiếp →"),
    el("button", { class: "btn btn-primary", onClick: finish }, "Hoàn thành"),
  );

  host.appendChild(scene);
  host.appendChild(counter);
  host.appendChild(nav);

  injectStyle();
  render();

  function render() {
    const c = cards[i];
    front.innerHTML = `
      <div class="hanzi" style="font-size:80px; color: var(--c-blue-dark);">${escape(c.hanzi)}</div>
      <div class="muted" style="margin-top:24px;">Bấm để lật thẻ</div>`;
    back.innerHTML = `
      <div class="pinyin" style="font-size:32px; color: var(--c-blue);">${escape(c.pinyin)}</div>
      <div style="font-size:22px; font-weight:600; margin-top:10px;">${escape(c.vi)}</div>
      ${c.example ? `
        <div style="margin-top:18px; padding-top:14px; border-top:1px dashed var(--c-divider); font-size:14px;">
          <div class="hanzi">${escape(c.example.hanzi)}</div>
          <div class="muted" style="margin-top:4px;">${escape(c.example.pinyin)}</div>
          <div style="margin-top:4px;">${escape(c.example.vi)}</div>
        </div>` : ""}
    `;
    card.classList.remove("is-flipped");
    counter.textContent = `Thẻ ${i + 1} / ${cards.length}`;
  }

  function move(delta) {
    i = (i + delta + cards.length) % cards.length;
    render();
  }

  function finish() {
    recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
    host.innerHTML = `<div class="summary-card"><h2>Đã ôn xong! ✓</h2>
      <p class="muted">Bạn đã xem qua ${cards.length} thẻ.</p>
      <div class="row gap" style="justify-content:center; margin-top:18px;">
        <a class="btn btn-primary" href="/">Về trang chính</a>
      </div></div>`;
  }
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function injectStyle() {
  if (document.getElementById("flashcard-style")) return;
  const s = document.createElement("style");
  s.id = "flashcard-style";
  s.textContent = `
    .flashcard-scene { width: 100%; max-width: 480px; height: 360px; margin: 0 auto;
      perspective: 1200px; }
    .flashcard { position: relative; width: 100%; height: 100%;
      transition: transform 0.7s; transform-style: preserve-3d; cursor: pointer; }
    .flashcard.is-flipped { transform: rotateY(180deg); }
    .card-face { position: absolute; inset: 0; backface-visibility: hidden;
      border-radius: 20px; padding: 24px;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      box-shadow: 0 12px 30px var(--c-shadow); border: 1px solid var(--c-border);
      text-align: center; }
    .card-front { background: white; }
    .card-back { background: linear-gradient(135deg, #fff7ed, #ffe4c4);
      transform: rotateY(180deg); }
  `;
  document.head.appendChild(s);
}
