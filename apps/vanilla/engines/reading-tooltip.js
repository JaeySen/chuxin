import { el } from "/shared/ui.js";
import { recordAttempt } from "/shared/progress.js";

export function mount(host, lesson) {
  host.innerHTML = "";
  injectStyle();

  const glossaryMap = new Map(lesson.glossary.map((g) => [g.token, g]));
  const tokens = [...glossaryMap.keys()].sort((a, b) => b.length - a.length);

  const passageHost = el("div", { class: "tooltip-passage hanzi" });
  const annotated = annotate(lesson.passage, tokens);
  passageHost.innerHTML = annotated;
  host.appendChild(passageHost);

  passageHost.querySelectorAll(".gloss").forEach((node) => {
    node.addEventListener("click", (e) => {
      const t = node.dataset.token;
      const g = glossaryMap.get(t);
      showTooltip(node, g);
      e.stopPropagation();
    });
  });
  document.addEventListener("click", () => {
    const t = document.querySelector(".tooltip-pop");
    if (t) t.remove();
  });

  if (lesson.glossary?.length) {
    host.appendChild(el("h3", { style: "margin-top:22px;" }, "Bảng từ"));
    const tbl = el("table", { class: "vocab-table" });
    tbl.appendChild(el("tr", {},
      el("th", {}, "Từ"), el("th", {}, "Pinyin"), el("th", {}, "Nghĩa")));
    lesson.glossary.forEach((g) => {
      tbl.appendChild(el("tr", {},
        el("td", { class: "hanzi" }, g.token),
        el("td", {}, g.pinyin),
        el("td", {}, g.vi)));
    });
    host.appendChild(tbl);
  }

  if (lesson.comprehension?.length) {
    host.appendChild(el("h3", { style: "margin-top:22px;" }, "Câu hỏi đọc hiểu"));
    let answered = 0, correct = 0;
    lesson.comprehension.forEach((q, qi) => {
      const wrap = el("div", { style: "margin: 14px 0;" });
      wrap.appendChild(el("div", { style: "font-weight:600;" }, `${qi + 1}. ${q.prompt}`));
      q.options.forEach((opt, oi) => {
        const b = el("button", { class: "option-btn" }, opt);
        b.addEventListener("click", () => {
          wrap.querySelectorAll(".option-btn").forEach((x) => x.disabled = true);
          if (oi === q.correctIndex) { b.classList.add("correct"); correct++; }
          else { b.classList.add("wrong"); wrap.querySelectorAll(".option-btn")[q.correctIndex].classList.add("correct"); }
          answered++;
          if (answered === lesson.comprehension.length) {
            recordAttempt(lesson.id, {
              score: Math.round((correct / lesson.comprehension.length) * 100),
              durationSec: 0, completed: true,
            });
          }
        });
        wrap.appendChild(b);
      });
      host.appendChild(wrap);
    });
  } else {
    recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
  }
}

function annotate(text, tokens) {
  const escaped = text.replace(/[&<>"]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
  }[c]));
  let html = escaped;
  for (const t of tokens) {
    const re = new RegExp(escapeRe(t), "g");
    html = html.replace(re, (m) => `<span class="gloss" data-token="${t}">${m}</span>`);
  }
  return html.replace(/\n/g, "<br/>");
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function showTooltip(anchor, gloss) {
  document.querySelectorAll(".tooltip-pop").forEach((n) => n.remove());
  const r = anchor.getBoundingClientRect();
  const pop = el("div", { class: "tooltip-pop" });
  pop.innerHTML = `<div class="tp-pinyin">${gloss.pinyin}</div><div>${gloss.vi}</div>`;
  pop.style.left = `${r.left + window.scrollX}px`;
  pop.style.top = `${r.bottom + window.scrollY + 8}px`;
  document.body.appendChild(pop);
}

function injectStyle() {
  if (document.getElementById("tt-style")) return;
  const s = document.createElement("style");
  s.id = "tt-style";
  s.textContent = `
    .tooltip-passage { background: white; padding: 24px; border-radius: 14px;
      border: 1px solid var(--c-divider); line-height: 2.1; font-size: 22px; }
    .tooltip-passage .gloss { background: #fff7ed; border-bottom: 2px dotted var(--c-orange);
      cursor: pointer; padding: 0 2px; border-radius: 4px; }
    .tooltip-passage .gloss:hover { background: #ffedd5; }
    .tooltip-pop { position: absolute; z-index: 90;
      background: var(--c-blue-dark); color: white; padding: 10px 14px;
      border-radius: 10px; font-size: 14px; box-shadow: 0 6px 20px var(--c-shadow);
      max-width: 280px; }
    .tooltip-pop .tp-pinyin { color: #fde68a; font-weight: 600; margin-bottom: 4px; }
    .vocab-table { width: 100%; border-collapse: collapse; margin-top: 8px;
      background: white; border-radius: 12px; overflow: hidden; }
    .vocab-table th, .vocab-table td { padding: 10px 14px; text-align: left;
      border-bottom: 1px solid var(--c-divider); }
    .vocab-table th { background: #f1f5f9; font-weight: 600; }
  `;
  document.head.appendChild(s);
}
