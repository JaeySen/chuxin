import { useState } from "react";
import { RubyText, pairsFromDict } from "../components/RubyText";
import {
  pinyinDict,
  vocabulary,
  optionsData,
  serverDialogues,
  stepLabels,
  SELECTION_KEYS,
  OPTION_CATEGORY,
  type GmSelectionKey,
} from "../data/goimonanData";

// Ported from chuxin-teachers-docs/k34/goimonan.html
// "HSK1 餐厅点餐 (Gọi món)" — Roleplay Practice, Thầy Trung

type Selection = Record<GmSelectionKey, string | null>;

const EMPTY_SELECTION: Selection = {
  cuisine: null,
  bowlSize: null,
  spiciness: null,
  serving: null,
  utensils: null,
};

function Ruby({ text }: { text: string }) {
  return <RubyText pairs={pairsFromDict(text, pinyinDict)} fallback={text} />;
}

function getOption(key: GmSelectionKey, id: string | null) {
  if (!id) return null;
  return optionsData[OPTION_CATEGORY[key]].find((o) => o.id === id) ?? null;
}

function BillRows({ selection }: { selection: Selection }) {
  const rows: [string, GmSelectionKey][] = [
    ["菜肴 (Món):", "cuisine"],
    ["碗型 (Tô):", "bowlSize"],
    ["辣度 (Cay):", "spiciness"],
    ["就餐 (Ăn):", "serving"],
    ["餐具 (Đũa):", "utensils"],
  ];
  return (
    <>
      {rows.map(([label, key]) => {
        const opt = getOption(key, selection[key]);
        return (
          <div className="ro-bill-row" key={key}>
            <span className="ro-bill-label">{label}</span>
            <span className="ro-bill-value">{opt ? <Ruby text={opt.name} /> : ""}</span>
          </div>
        );
      })}
    </>
  );
}

export function RestaurantOrderPage() {
  const [showPinyin, setShowPinyin] = useState(false);
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [completed, setCompleted] = useState(false);

  function resetGame() {
    setStep(1);
    setSelection(EMPTY_SELECTION);
    setCompleted(false);
  }

  function selectOption(key: GmSelectionKey, id: string) {
    setSelection((prev) => ({ ...prev, [key]: id }));
  }

  function nextStep() {
    if (step < 6) setStep((s) => s + 1);
  }

  const currentKey = SELECTION_KEYS[step - 1];
  const nextDisabled = !currentKey || !selection[currentKey];

  const dialogueText =
    step === 6
      ? `您点的餐是：${getOption("cuisine", selection.cuisine)?.name ?? ""}，${getOption("bowlSize", selection.bowlSize)?.name ?? ""}，${getOption("spiciness", selection.spiciness)?.name ?? ""}，${getOption("serving", selection.serving)?.name ?? ""}，${getOption("utensils", selection.utensils)?.name ?? ""}一次性餐具。对吗？`
      : serverDialogues[`step${step}`].text;
  const dialogueEmoji = serverDialogues[`step${step}`].emoji;

  let customerReply: { text: string; emoji: string } | null = null;
  if (currentKey && selection[currentKey]) {
    const opt = getOption(currentKey, selection[currentKey]);
    if (opt) {
      let reply = "";
      if (currentKey === "cuisine") reply = `我想吃${opt.name}。`;
      else if (currentKey === "utensils") reply = `${opt.name}一次性餐具。`;
      else reply = `${opt.name}。`;
      customerReply = { text: reply, emoji: opt.emoji };
    }
  }

  return (
    <div className={`ro-shell ${showPinyin ? "ro-show-pinyin" : ""}`}>
      <div className="ro-container">
        <header className="ro-page-header">
          <div className="ro-header-title">
            <h1>HSK1 餐厅点餐 (Gọi món)</h1>
            <div className="ro-subtitle">Roleplay Practice - Thầy Trung</div>
          </div>
          <div
            className={`ro-toggle-container ${showPinyin ? "ro-active" : ""}`}
            onClick={() => setShowPinyin((v) => !v)}
          >
            <i className="ro-toggle-icon">拼</i>
            <span className="ro-toggle-label">
              {showPinyin ? "Ẩn Pinyin (Tắt phiên âm)" : "Hiện Pinyin (Bật phiên âm)"}
            </span>
          </div>
        </header>

        <div className="ro-step-bar">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const cls = n < step ? "completed" : n === step ? "active" : "";
            return (
              <div className={`ro-step-item ${cls}`} key={n}>
                {n < step ? "✓" : n}
                <div className="ro-step-label">{label}</div>
              </div>
            );
          })}
        </div>

        <div className="ro-main-card">
          {!completed && (
            <div className="ro-dialogue-area">
              <div className="ro-message ro-server">
                <div className="ro-avatar ro-avatar-server">🧑‍🍳</div>
                <div className="ro-bubble">
                  <Ruby text={dialogueText} /> <span className="ro-bubble-emoji">{dialogueEmoji}</span>
                </div>
              </div>
              {customerReply && (
                <div className="ro-message ro-customer">
                  <div className="ro-avatar ro-avatar-customer">🙋</div>
                  <div className="ro-bubble">
                    <Ruby text={customerReply.text} />{" "}
                    <span className="ro-bubble-emoji">{customerReply.emoji}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {!completed && step < 6 && (
            <div className="ro-options-grid">
              {optionsData[OPTION_CATEGORY[currentKey as GmSelectionKey]].map((opt) => (
                <div
                  key={opt.id}
                  className={`ro-option-card ${selection[currentKey as GmSelectionKey] === opt.id ? "ro-selected" : ""}`}
                  onClick={() => selectOption(currentKey as GmSelectionKey, opt.id)}
                >
                  <span className="ro-opt-emoji">{opt.emoji}</span>
                  <div className="ro-opt-text"><Ruby text={opt.name} /></div>
                </div>
              ))}
            </div>
          )}

          {!completed && step === 6 && (
            <div className="ro-confirm-zone">
              <div className="ro-bill-container">
                <div className="ro-bill-header">
                  <h3>订单 (Hóa đơn)</h3>
                  <p>Table: 01</p>
                </div>
                <BillRows selection={selection} />
                <div className="ro-bill-footer">谢谢光临 (Cảm ơn quý khách!)</div>
              </div>
              <div className="ro-confirm-actions">
                <button className="ro-btn ro-btn-reject" onClick={resetGame}>✕ 不对 (Sửa lại)</button>
                <button className="ro-btn ro-btn-confirm" onClick={() => setCompleted(true)}>✓ 对 (Đúng rồi)</button>
              </div>
            </div>
          )}

          {completed && (
            <div className="ro-complete-zone">
              <div className="ro-complete-icon">✅</div>
              <h2>完成点餐!</h2>
              <p className="ro-complete-sub">Bạn đã hoàn thành bài luyện tập gọi món.</p>
              <div className="ro-bill-container ro-final-summary">
                <div className="ro-bill-header">
                  <h3>订单 (Hóa đơn)</h3>
                  <p>Table: 01</p>
                </div>
                <BillRows selection={selection} />
                <div className="ro-bill-footer">谢谢光临 (Cảm ơn quý khách!)</div>
              </div>
              <button className="ro-btn ro-btn-confirm" onClick={resetGame}>↻ Luyện tập lại</button>
            </div>
          )}

          {!completed && (
            <div className="ro-controls">
              <button className="ro-btn ro-btn-reset" onClick={resetGame}>↺ Reset</button>
              <button className="ro-btn ro-btn-next" onClick={nextStep} disabled={nextDisabled}>
                Tiếp theo →
              </button>
            </div>
          )}
        </div>

        <aside className="ro-sidebar">
          <div className="ro-sidebar-title">📖 生词表 (Từ vựng)</div>
          <div className="ro-vocab-list">
            {vocabulary.map((v) => (
              <div className="ro-vocab-card" key={v.chinese}>
                <div className="ro-v-emoji">{v.emoji}</div>
                <div className="ro-v-content">
                  <div className="ro-v-hanzi"><Ruby text={v.chinese} /></div>
                  <div className="ro-v-meaning">{v.meaning}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
