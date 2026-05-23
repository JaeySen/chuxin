import { el } from "/shared/ui.js";
import { recordAttempt } from "/shared/progress.js";

export function mount(host, lesson) {
  host.innerHTML = "";
  injectStyle();

  host.appendChild(el("div", { class: "debate-topic" },
    el("div", { class: "muted" }, "Chủ đề tranh luận"),
    el("div", { class: "hanzi", style: "font-size:24px; margin-top:6px;" }, lesson.topic),
    lesson.topicVi ? el("div", { style: "margin-top:6px; color: var(--c-text-soft);" }, lesson.topicVi) : null,
  ));

  const cols = el("div", { class: "debate-cols" });
  cols.appendChild(makeColumn("✅ Ủng hộ (赞成)", lesson.pro, "#16a34a"));
  cols.appendChild(makeColumn("❌ Phản đối (反对)", lesson.con, "#dc2626"));
  host.appendChild(cols);

  if (lesson.discussionQuestions?.length) {
    host.appendChild(el("h3", { style: "margin-top:24px;" }, "Câu hỏi thảo luận"));
    const ul = el("ul", { class: "debate-list" });
    lesson.discussionQuestions.forEach((q) => ul.appendChild(el("li", {}, q)));
    host.appendChild(ul);
  }

  host.appendChild(el("button", {
    class: "btn btn-primary", style: "margin-top: 24px;",
    onClick: () => {
      recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
      const note = el("div", { class: "feedback feedback-ok" }, "Đã ghi nhận hoàn thành!");
      host.appendChild(note);
    },
  }, "Đánh dấu đã thảo luận"));
}

function makeColumn(title, items, color) {
  const col = el("div", { class: "debate-col" },
    el("h4", { style: `color:${color}; margin-top:0;` }, title));
  items.forEach((it) => col.appendChild(el("div", { class: "debate-item" }, it)));
  return col;
}

function injectStyle() {
  if (document.getElementById("dbt-style")) return;
  const s = document.createElement("style");
  s.id = "dbt-style";
  s.textContent = `
    .debate-topic { background: white; padding: 20px; border-radius: 14px;
      border: 1px solid var(--c-divider); margin-bottom: 22px; }
    .debate-cols { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
    @media (max-width: 720px) { .debate-cols { grid-template-columns: 1fr; } }
    .debate-col { background: white; padding: 18px; border-radius: 12px;
      border: 1px solid var(--c-divider); }
    .debate-item { padding: 10px 12px; border-radius: 8px;
      background: #f8fafc; margin: 8px 0; font-size: 15px; }
    .debate-list { padding-left: 20px; line-height: 2; }
  `;
  document.head.appendChild(s);
}
