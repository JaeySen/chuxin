import { el } from "/shared/ui.js";
import { answerMatches } from "/shared/pinyin.js";
import { recordAttempt } from "/shared/progress.js";

export function mount(host, lesson) {
  host.innerHTML = "";
  injectStyle();

  let active = "theory";
  const tabs = el("div", { class: "gt-tabs" });
  ["theory", "vocab", "exercises"].forEach((k) => {
    const labels = { theory: "Lý thuyết", vocab: "Từ vựng", exercises: "Bài tập" };
    const btn = el("button", { class: "gt-tab", "data-k": k }, labels[k]);
    btn.addEventListener("click", () => { active = k; refresh(); });
    tabs.appendChild(btn);
  });
  const body = el("div", { class: "gt-body" });
  host.appendChild(tabs);
  host.appendChild(body);

  refresh();

  function refresh() {
    [...tabs.children].forEach((b) => b.classList.toggle("active", b.dataset.k === active));
    body.innerHTML = "";
    if (active === "theory") renderTheory();
    else if (active === "vocab") renderVocab();
    else renderExercises();
  }

  function renderTheory() {
    lesson.theory.forEach((t) => {
      const card = el("div", { class: "gt-card" });
      card.appendChild(el("h4", { style: "margin:0 0 6px;" }, t.point));
      card.appendChild(el("div", { style: "white-space:pre-wrap; color: var(--c-text-soft); margin-bottom:10px;" }, t.explanation));
      t.examples?.forEach((ex) => {
        const ex_ = el("div", { class: "gt-example" });
        ex_.appendChild(el("div", { class: "hanzi", style: "font-size:18px;" }, ex.hanzi));
        ex_.appendChild(el("div", { class: "muted", style: "font-size:13px;" }, ex.pinyin));
        ex_.appendChild(el("div", { style: "font-size:14px;" }, ex.vi));
        card.appendChild(ex_);
      });
      body.appendChild(card);
    });
  }

  function renderVocab() {
    if (!lesson.vocab?.length) {
      body.appendChild(el("div", { class: "muted" }, "Không có từ vựng."));
      return;
    }
    const tbl = el("table", { class: "vocab-table" });
    tbl.appendChild(el("tr", {},
      el("th", {}, "Hán tự"), el("th", {}, "Pinyin"), el("th", {}, "Nghĩa")));
    lesson.vocab.forEach((v) => {
      tbl.appendChild(el("tr", {},
        el("td", { class: "hanzi" }, v.hanzi),
        el("td", {}, v.pinyin),
        el("td", {}, v.vi)));
    });
    body.appendChild(tbl);
  }

  function renderExercises() {
    let total = 0, correct = 0;
    let attempted = 0;
    const finalize = () => {
      attempted++;
      if (attempted >= total) {
        recordAttempt(lesson.id, {
          score: total ? Math.round((correct / total) * 100) : 100,
          durationSec: 0, completed: true,
        });
      }
    };

    (lesson.exercises?.mcq ?? []).forEach((q, qi) => {
      total++;
      const wrap = el("div", { class: "gt-card" });
      wrap.appendChild(el("div", { style: "font-weight:600;" }, `Trắc nghiệm ${qi + 1}: ${q.prompt}`));
      q.options.forEach((opt, oi) => {
        const b = el("button", { class: "option-btn" }, opt);
        b.addEventListener("click", () => {
          wrap.querySelectorAll(".option-btn").forEach((x) => x.disabled = true);
          if (oi === q.correctIndex) { b.classList.add("correct"); correct++; }
          else { b.classList.add("wrong"); wrap.querySelectorAll(".option-btn")[q.correctIndex].classList.add("correct"); }
          if (q.explanation) wrap.appendChild(el("div", { class: "feedback feedback-info", style: "margin-top:6px;" }, q.explanation));
          finalize();
        });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
    });

    (lesson.exercises?.fillBlank ?? []).forEach((it, i) => {
      total++;
      const wrap = el("div", { class: "gt-card" });
      wrap.appendChild(el("div", { style: "font-weight:600;" }, `Điền từ ${i + 1}: ${it.prompt.replace(/_+/g, "____")}`));
      const inputs = it.blanks.map(() => el("input", { class: "input-blank" }));
      inputs.forEach((inp) => wrap.appendChild(inp));
      const btn = el("button", { class: "btn btn-primary", style: "margin-top:8px;" }, "Kiểm tra");
      btn.addEventListener("click", () => {
        let allOk = true;
        inputs.forEach((inp, j) => {
          const b = it.blanks[j];
          const ok = answerMatches(inp.value, b.answer, b.alternatives ?? []);
          inp.classList.add(ok ? "correct" : "wrong");
          inp.disabled = true;
          if (!ok) allOk = false;
        });
        btn.disabled = true;
        if (allOk) correct++;
        wrap.appendChild(el("div", {
          class: `feedback ${allOk ? "feedback-ok" : "feedback-bad"}`,
        }, allOk ? "Đúng rồi!" : `Đáp án mẫu: ${it.blanks.map(b => b.answer).join(" / ")}`));
        finalize();
      });
      wrap.appendChild(btn);
      body.appendChild(wrap);
    });

    if (total === 0) body.appendChild(el("div", { class: "muted" }, "Bài này chưa có bài tập."));
  }
}

function injectStyle() {
  if (document.getElementById("gt-style")) return;
  const s = document.createElement("style");
  s.id = "gt-style";
  s.textContent = `
    .gt-tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--c-divider);
      margin-bottom: 14px; }
    .gt-tab { padding: 10px 18px; border: 0; background: transparent; cursor: pointer;
      font-weight: 600; color: var(--c-text-soft); border-bottom: 3px solid transparent;
      margin-bottom: -2px; }
    .gt-tab.active { color: var(--c-blue-dark); border-bottom-color: var(--c-orange); }
    .gt-card { background: white; padding: 16px; border-radius: 12px;
      border: 1px solid var(--c-divider); margin-bottom: 12px; }
    .gt-example { background: #f8fafc; padding: 10px 14px; border-radius: 10px;
      border-left: 3px solid var(--c-blue); margin: 8px 0; }
  `;
  document.head.appendChild(s);
}
