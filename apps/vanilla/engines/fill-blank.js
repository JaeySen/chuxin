import { el } from "/shared/ui.js";
import { answerMatches } from "/shared/pinyin.js";
import { scoreStrip, setStripCounter, timer, summary } from "/shared/engine-base.js";

export function mount(host, lesson) {
  let idx = 0, correct = 0, wrong = 0;
  const items = lesson.items;
  const toneSensitive = !!lesson.toneSensitive;

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
    stage.appendChild(el("h3", { style: "margin: 8px 0 18px;" }, it.prompt.replace(/_+/g, "____")));

    const inputs = it.blanks.map((_, i) =>
      el("input", { class: "input-blank", placeholder: `Đáp án ${i + 1}`, "data-i": String(i) }),
    );
    inputs.forEach((inp) => stage.appendChild(inp));

    if (it.hint) {
      const hintBox = el("div", { class: "feedback feedback-info hidden", id: "hint" }, `💡 ${it.hint}`);
      stage.appendChild(el("div", { class: "row gap", style: "margin-top:12px;" },
        el("button", {
          class: "btn btn-ghost",
          onClick: () => hintBox.classList.toggle("hidden"),
        }, "Gợi ý"),
      ));
      stage.appendChild(hintBox);
    }

    const submit = el("button", { class: "btn btn-primary", style: "margin-top:14px;" }, "Kiểm tra");
    submit.addEventListener("click", () => check(inputs, it));
    stage.appendChild(submit);
  }

  function check(inputs, it) {
    let allCorrect = true;
    inputs.forEach((inp, i) => {
      const blank = it.blanks[i];
      const ok = answerMatches(inp.value, blank.answer, blank.alternatives, { toneSensitive });
      inp.classList.remove("correct", "wrong");
      inp.classList.add(ok ? "correct" : "wrong");
      inp.disabled = true;
      if (!ok) allCorrect = false;
    });
    if (allCorrect) correct++; else wrong++;
    setStripCounter(strip, { idx: idx + 1, total: items.length, correct, wrong });

    const fb = el("div", { class: `feedback ${allCorrect ? "feedback-ok" : "feedback-bad"}` },
      allCorrect ? "Đúng hết!" : "Có chỗ chưa đúng. Đáp án mẫu: " +
        it.blanks.map((b) => b.answer).join(" / "));
    stage.appendChild(fb);
    const next = el("button", { class: "btn btn-primary", style: "margin-top:14px;" },
      idx + 1 === items.length ? "Xem kết quả" : "Câu tiếp");
    next.addEventListener("click", () => { idx++; render(); });
    stage.appendChild(next);
  }
}
