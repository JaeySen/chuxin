import { useState } from "react";
import { RubyText, type PinyinPairs } from "../components/RubyText";

// Ported from chuxin-teachers-docs/k34/cauchu比.html
// "早市 - Khu Chợ Sáng" — HSK2 比/没有 comparison-sentence builder game.

type MarketItem = { id: string; hanzi: string; chars: string[]; pinyin: string[]; emoji: string };

const ITEMS: MarketItem[] = [
  { id: "pingguo", hanzi: "苹果", chars: ["苹", "果"], pinyin: ["píng", "guǒ"], emoji: "🍎" },
  { id: "xiangjiao", hanzi: "香蕉", chars: ["香", "蕉"], pinyin: ["xiāng", "jiāo"], emoji: "🍌" },
  { id: "mangguo", hanzi: "芒果", chars: ["芒", "果"], pinyin: ["máng", "guǒ"], emoji: "🥭" },
  { id: "niunai", hanzi: "牛奶", chars: ["牛", "奶"], pinyin: ["niú", "nǎi"], emoji: "🥛" },
  { id: "dangao", hanzi: "蛋糕", chars: ["蛋", "糕"], pinyin: ["dàn", "gāo"], emoji: "🍰" },
  { id: "jidan", hanzi: "鸡蛋", chars: ["鸡", "蛋"], pinyin: ["jī", "dàn"], emoji: "🥚" },
  { id: "yadan", hanzi: "鸭蛋", chars: ["鸭", "蛋"], pinyin: ["yā", "dàn"], emoji: "🦆" },
  { id: "yu", hanzi: "鱼", chars: ["鱼"], pinyin: ["yú"], emoji: "🐟" },
  { id: "rou", hanzi: "肉", chars: ["肉"], pinyin: ["ròu"], emoji: "🥩" },
];

function pairsOf(chars: string[], pinyin: string[]): PinyinPairs {
  return chars.map((c, i) => [c, pinyin[i]]);
}

const P = {
  wo: pairsOf(["我"], ["wǒ"]),
  maide: pairsOf(["卖", "的"], ["mài", "de"]),
  kuai: pairsOf(["块"], ["kuài"]),
  keneng: pairsOf(["可", "能"], ["kě", "néng"]),
  bi: pairsOf(["比"], ["bǐ"]),
  dian: pairsOf(["店"], ["diàn"]),
  haochi: pairsOf(["好", "吃"], ["hǎo", "chī"]),
  pianyi: pairsOf(["便", "宜"], ["pián", "yi"]),
  meiyou: pairsOf(["没", "有"], ["méi", "yǒu"]),
  gui: pairsOf(["贵"], ["guì"]),
};

type WordEntry = { key: number; h: string; pairs: PinyinPairs };

function buildWordBank(item: MarketItem): WordEntry[] {
  const words: WordEntry[] = [
    { key: 0, h: "A店", pairs: [["A", ""], ...P.dian] },
    { key: 1, h: "B店", pairs: [["B", ""], ...P.dian] },
    { key: 2, h: "卖的", pairs: P.maide },
    { key: 3, h: item.hanzi, pairs: pairsOf(item.chars, item.pinyin) },
    { key: 4, h: "比", pairs: P.bi },
    { key: 5, h: "没有", pairs: P.meiyou },
    { key: 6, h: "贵", pairs: P.gui },
    { key: 7, h: "便宜", pairs: P.pianyi },
    { key: 8, h: "可能", pairs: P.keneng },
  ];
  // Fisher-Yates shuffle
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words;
}

export function MarketComparisonPage() {
  const [hidePinyin, setHidePinyin] = useState(false);
  const [item, setItem] = useState<MarketItem | null>(null);
  const [priceA, setPriceA] = useState(0);
  const [priceB, setPriceB] = useState(0);
  const [targetHanzi, setTargetHanzi] = useState("");
  const [wordBank, setWordBank] = useState<WordEntry[]>([]);
  const [sentenceKeys, setSentenceKeys] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: React.ReactNode } | null>(null);

  function selectItem(it: MarketItem) {
    let pA = Math.floor(Math.random() * 16) + 5;
    let pB: number;
    do {
      pB = Math.floor(Math.random() * 16) + 5;
    } while (pA === pB);

    setItem(it);
    setPriceA(pA);
    setPriceB(pB);
    setFeedback(null);
    setSentenceKeys([]);

    const targetType = Math.random() > 0.5 ? 1 : 2; // 1: 比, 2: 没有
    let target: string;
    if (pA < pB) {
      target = targetType === 1 ? `A店卖的${it.hanzi}比B店便宜` : `A店卖的${it.hanzi}没有B店贵`;
    } else {
      target = targetType === 1 ? `A店卖的${it.hanzi}比B店贵` : `B店卖的${it.hanzi}没有A店贵`;
    }
    setTargetHanzi(target);
    setWordBank(buildWordBank(it));
  }

  function moveToBox(key: number) {
    setSentenceKeys((prev) => [...prev, key]);
    setFeedback(null);
  }

  function removeFromBox(idx: number) {
    setSentenceKeys((prev) => prev.filter((_, i) => i !== idx));
    setFeedback(null);
  }

  function clearSentence() {
    setSentenceKeys([]);
    setFeedback(null);
  }

  function checkAnswer() {
    if (!item) return;
    const currentSentence = sentenceKeys.map((k) => wordBank.find((w) => w.key === k)!.h).join("");

    let isCorrect = currentSentence === targetHanzi;
    if (priceA < priceB) {
      if (
        currentSentence === `B店卖的${item.hanzi}比A店贵` ||
        currentSentence === `B店卖的${item.hanzi}没有A店便宜`
      ) {
        isCorrect = true;
      }
    } else {
      if (
        currentSentence === `B店卖的${item.hanzi}比A店便宜` ||
        currentSentence === `A店卖的${item.hanzi}没有B店便宜`
      ) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      setFeedback({
        ok: true,
        msg: (
          <>🎉 Chính xác! Bạn nói rất chuẩn: <RubyText pairs={pairsOf(["太", "棒", "了"], ["tài", "bàng", "le"])} fallback="太棒了" />！</>
        ),
      });
    } else {
      setFeedback({
        ok: false,
        msg: (
          <>
            ❌ Chưa chính xác. Cấu trúc là:{" "}
            <strong>[Chủ thể 1] + 卖的 + [Đồ vật] + 比/没有 + [Chủ thể 2] + Tính từ</strong>. Hãy thử lại nhé!
          </>
        ),
      });
    }
  }

  const usedKeys = new Set(sentenceKeys);

  return (
    <div className={`mk-body ${hidePinyin ? "mk-hide-pinyin" : ""}`}>
      <div className="mk-container">
        <div className="mk-header">
          <button className="mk-toggle-btn" onClick={() => setHidePinyin((v) => !v)}>Bật/Tắt Pinyin</button>
          <h1>
            <RubyText pairs={pairsOf(["早", "市"], ["zǎo", "shì"])} fallback="早市" /> - Khu Chợ Sáng
          </h1>
          <div className="mk-story">
            🧑‍🎓 <strong>Bối cảnh:</strong> Bạn là du học sinh VN (trình độ HSK2). Sáng nay bạn đi chợ. Có 2 sạp
            hàng (A và B) đang cạnh tranh nhau. Hãy bấm vào một món đồ, xem giá, nghe người bán giới thiệu và
            dùng cấu trúc ngữ pháp vừa học để so sánh nhé!
          </div>
        </div>

        <div className="mk-shelf">
          {ITEMS.map((it) => (
            <div key={it.id} className="mk-item" onClick={() => selectItem(it)}>
              <div className="mk-item-emoji">{it.emoji}</div>
              <RubyText pairs={pairsOf(it.chars, it.pinyin)} fallback={it.hanzi} />
            </div>
          ))}
        </div>

        {item && (
          <div className="mk-interaction">
            <div className="mk-dialogues">
              <div className="mk-bubble mk-bubble-a">
                <div className="mk-avatar">
                  👨‍🌾 A<RubyText pairs={P.dian} fallback="店" />
                </div>
                <div>
                  <RubyText pairs={P.wo} fallback="我" />
                  <RubyText pairs={P.maide} fallback="卖的" /> {item.emoji}{" "}
                  <span className="mk-price-tag">{priceA}</span> <RubyText pairs={P.kuai} fallback="块" />！<br />
                  <RubyText pairs={P.keneng} fallback="可能" /> <RubyText pairs={P.bi} fallback="比" /> B
                  <RubyText pairs={P.dian} fallback="店" /> <RubyText pairs={P.haochi} fallback="好吃" />！
                </div>
              </div>
              <div className="mk-bubble mk-bubble-b">
                <div className="mk-avatar">
                  👩‍🌾 B<RubyText pairs={P.dian} fallback="店" />
                </div>
                <div>
                  <RubyText pairs={P.wo} fallback="我" />
                  <RubyText pairs={P.maide} fallback="卖的" /> {item.emoji}{" "}
                  <span className="mk-price-tag">{priceB}</span> <RubyText pairs={P.kuai} fallback="块" />！<br />
                  {priceB < priceA ? (
                    <>
                      <RubyText pairs={P.bi} fallback="比" /> A<RubyText pairs={P.dian} fallback="店" />{" "}
                      <RubyText pairs={P.pianyi} fallback="便宜" />！
                    </>
                  ) : (
                    <>
                      <RubyText pairs={P.meiyou} fallback="没有" /> A<RubyText pairs={P.dian} fallback="店" />{" "}
                      <RubyText pairs={P.gui} fallback="贵" />！
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mk-game-area">
              <h3>🧑‍🎓 Ghép câu nhận xét của bạn:</h3>
              <div className="mk-drop-zone">
                {sentenceKeys.map((k, idx) => {
                  const w = wordBank.find((x) => x.key === k)!;
                  return (
                    <button key={idx} className="mk-word-btn" onClick={() => removeFromBox(idx)}>
                      <RubyText pairs={w.pairs} fallback={w.h} />
                    </button>
                  );
                })}
              </div>

              <div className="mk-word-bank">
                {wordBank.map((w) =>
                  usedKeys.has(w.key) ? null : (
                    <button key={w.key} className="mk-word-btn" onClick={() => moveToBox(w.key)}>
                      <RubyText pairs={w.pairs} fallback={w.h} />
                    </button>
                  )
                )}
              </div>

              <div className="mk-action-btns">
                <button className="mk-btn-clear" onClick={clearSentence}>Xóa làm lại</button>
                <button className="mk-btn-check" onClick={checkAnswer}>Kiểm tra</button>
              </div>
              {feedback && (
                <div className={feedback.ok ? "mk-correct" : "mk-wrong"}>{feedback.msg}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
