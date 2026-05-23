import { el } from "/shared/ui.js";
import { saveWorksheet, loadWorksheet, recordAttempt } from "/shared/progress.js";

export async function mount(host, lesson) {
  host.innerHTML = "";
  if (lesson.intro) {
    host.appendChild(el("div", { class: "feedback feedback-info", style: "white-space:pre-wrap;" }, lesson.intro));
  }

  const existing = await loadWorksheet(lesson.id);
  const data = existing?.fields ?? {};

  const form = el("div", { style: "margin-top:14px;" });
  const inputs = {};
  lesson.fields.forEach((f) => {
    const wrap = el("div", { style: "margin-bottom: 14px;" });
    wrap.appendChild(el("label", { style: "display:block; font-weight:600; margin-bottom:6px;" }, f.label));
    if (f.hint) wrap.appendChild(el("div", { class: "muted", style: "font-size:13px; margin-bottom:6px;" }, f.hint));
    const input = f.type === "textarea"
      ? el("textarea", {
          style: "width:100%; min-height:80px; padding:10px; border:2px solid var(--c-divider); border-radius:10px; font-family:inherit; font-size:15px;",
        })
      : el("input", {
          type: "text",
          style: "width:100%; padding:10px; border:2px solid var(--c-divider); border-radius:10px; font-size:15px;",
        });
    if (data[f.name]) input.value = data[f.name];
    inputs[f.name] = input;
    wrap.appendChild(input);
    form.appendChild(wrap);
  });
  host.appendChild(form);

  const actions = el("div", { class: "row gap", style: "margin-top:14px;" });
  if (lesson.submitMode === "save") {
    actions.appendChild(el("button", {
      class: "btn btn-primary",
      onClick: async () => {
        const fields = {};
        for (const k of Object.keys(inputs)) fields[k] = inputs[k].value;
        await saveWorksheet(lesson.id, fields);
        recordAttempt(lesson.id, { score: 100, durationSec: 0, completed: true });
        const fb = el("div", { class: "feedback feedback-ok", style: "margin-top:14px;" }, "Đã lưu!");
        host.appendChild(fb);
        setTimeout(() => fb.remove(), 1800);
      },
    }, "Lưu phiếu"));
  } else {
    actions.appendChild(el("button", {
      class: "btn btn-primary",
      onClick: () => window.print(),
    }, "In phiếu"));
  }
  host.appendChild(actions);
}
