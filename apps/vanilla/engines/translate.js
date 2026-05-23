import { el } from "/shared/ui.js";
import { answerMatches } from "/shared/pinyin.js";
import { scoreStrip, setStripCounter, timer, summary } from "/shared/engine-base.js";

export function mount(host, lesson) {
  let idx = 0, correct = 0, wrong = 0;
  const pairs = lesson.pairs;

  host.innerHTML = "";
  const strip = scoreStrip({ total: pairs.length });
  const t = timer((label) => {
    const e = strip.querySelector("#ss-time");
    if (e) e.textContent = `⏱ ${label}`;
  });
  const stage = el("div", {});
  host.appendChild(strip);
  host.appendChild(stage);
  render();

  function render() {
    setStripCounter(strip, { idx: idx + 1, total: pairs.length, correct, wrong });
    if (idx >= pairs.length) {
      t.stop();
      summary({ host, lessonId: lesson.id, score: correct, total: pairs.length,
        durationSec: t.elapsed(),
        onRetry: () => { idx = 0; correct = 0; wrong = 0; mount(host, lesson); } });
      return;
    }
    const p = pairs[idx];
    stage.innerHTML = "";
    stage.appendChild(el("div", { class: "muted", style: "font-size:13px;" }, "Dịch sang tiếng Việt"));
    stage.appendChild(el("div", { class: "hanzi", style: "font-size:28px; margin: 6px 0;" }, p.zh));
    if (p.pinyin) stage.appendChild(el("div", { class: "muted" }, p.pinyin));

    const ta = el("textarea", {
      placeholder: "Nhập bản dịch tiếng Việt…",
      style: "width:100%; min-height:90px; margin-top:14px; padding:12px; border-radius:10px; border:2px solid var(--c-divider); font-family:inherit; font-size:15px;",
    });
    stage.appendChild(ta);

    const submit = el("button", { class: "btn btn-primary", style: "margin-top:14px;" }, "Kiểm tra");
    submit.addEventListener("click", () => {
      const ok = answerMatches(ta.value, p.vi, p.alternatives ?? [], { caseSensitive: false, toneSensitive: false });
      submit.disabled = true; ta.disabled = true;
      if (ok) correct++; else wrong++;
      setStripCounter(strip, { idx: idx + 1, total: pairs.length, correct, wrong });
      stage.appendChild(el("div", {
        class: `feedback ${ok ? "feedback-ok" : "feedback-bad"}`,
      }, ok ? "Chính xác!" : `Bản dịch tham khảo: ${p.vi}`));
      const next = el("button", { class: "btn btn-primary", style: "margin-top:14px;" },
        idx + 1 === pairs.length ? "Xem kết quả" : "Câu tiếp");
      next.addEventListener("click", () => { idx++; render(); });
      stage.appendChild(next);
    });
    stage.appendChild(submit);
  }
}
