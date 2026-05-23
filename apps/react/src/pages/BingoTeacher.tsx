import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import hsk1Raw from "../data/hsk1.json";
import hsk2Raw from "../data/hsk2.json";
import hsk3Raw from "../data/hsk3.json";
import {
  createBingoGame,
  type BingoConfig,
  type BingoWord,
  type BoardSize,
} from "../lib/bingoGame";

export function BingoTeacher() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<BingoConfig>({
    size: 4,
    hsk1: true,
    hsk2: true,
    hsk3: false,
    maxPlayers: 10,
  });
  const [loading, setLoading] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const wordMap = useMemo<Record<string, BingoWord>>(() => {
    const map: Record<string, BingoWord> = {};
    if (config.hsk1) {
      for (const [char, v] of Object.entries(hsk1Raw)) {
        map[char] = { char, pinyin: v.pinyin, en: v.en };
      }
    }
    if (config.hsk2) {
      for (const w of hsk2Raw as BingoWord[]) map[w.char] = w;
    }
    if (config.hsk3) {
      for (const w of hsk3Raw as BingoWord[]) map[w.char] = w;
    }
    return map;
  }, [config.hsk1, config.hsk2, config.hsk3]);

  const wordCount = Object.keys(wordMap).length;
  const minNeeded = config.size * config.size;

  async function handleCreate() {
    if (wordCount < minNeeded) return;
    setLoading(true);
    try {
      const id = await createBingoGame(wordMap, Object.keys(wordMap), config);
      localStorage.setItem(`bingoCreator_${id}`, "1");
      setGameId(id);
    } finally {
      setLoading(false);
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (gameId) {
    const link = `${window.location.origin}/bingo/${gameId}`;
    return (
      <div className="bingo-setup-shell">
        <h2>Trò chơi Bingo đã tạo!</h2>
        <p className="muted">Chia sẻ đường link này cho học viên:</p>
        <div className="ws-link-box">
          <span className="ws-link-url">{link}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => copyLink(link)}>
            {copied ? "Đã copy ✓" : "Copy"}
          </button>
        </div>
        <div className="bingo-setup-btns">
          <button className="btn btn-primary" onClick={() => navigate(`/bingo/${gameId}`)}>
            Vào phòng →
          </button>
          <button className="btn btn-ghost" onClick={() => { setGameId(null); setCopied(false); }}>
            Tạo trò chơi mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bingo-setup-shell">
      <h2>Tạo trò chơi Bingo</h2>

      <div className="ws-config-card">
        {/* Board size */}
        <div className="ws-config-section">
          <div className="ws-config-label">Kích thước bảng</div>
          <div className="bingo-size-picker">
            {([3, 4, 5] as BoardSize[]).map((s) => (
              <button
                key={s}
                className={`bingo-size-btn ${config.size === s ? "bingo-size-btn--active" : ""}`}
                onClick={() => setConfig((c) => ({ ...c, size: s }))}
              >
                <span className="bingo-size-label">{s}×{s}</span>
                <span className="bingo-size-sub">{s * s} ô</span>
              </button>
            ))}
          </div>
        </div>

        {/* HSK levels */}
        <div className="ws-config-section">
          <div className="ws-config-label">Chọn nhóm từ vựng</div>
          {(["hsk1", "hsk2", "hsk3"] as const).map((lvl) => (
            <label key={lvl} className="ws-checkbox-row">
              <input
                type="checkbox"
                checked={config[lvl]}
                onChange={(e) => setConfig((c) => ({ ...c, [lvl]: e.target.checked }))}
              />
              <span className="ws-lvl-badge">{lvl.toUpperCase()}</span>
            </label>
          ))}
        </div>

        {/* Max players */}
        <div className="ws-config-section">
          <div className="ws-config-label">
            Số học viên tối đa:&nbsp;<strong>{config.maxPlayers}</strong>
          </div>
          <input
            type="range"
            min={2}
            max={30}
            value={config.maxPlayers}
            onChange={(e) => setConfig((c) => ({ ...c, maxPlayers: +e.target.value }))}
            className="ws-range"
          />
          <div className="ws-config-note" style={{ marginTop: 4 }}>
            2 — 30 học viên
          </div>
        </div>

        <div className="ws-config-note">
          {wordCount} từ trong nhóm · cần tối thiểu{" "}
          <strong>{minNeeded}</strong> từ cho bảng {config.size}×{config.size}
        </div>

        {wordCount < minNeeded && (
          <div className="feedback feedback-info">
            Cần thêm từ vựng. Hãy chọn thêm nhóm HSK.
          </div>
        )}

        <button
          className="btn btn-primary"
          disabled={loading || wordCount < minNeeded}
          onClick={handleCreate}
        >
          {loading ? "Đang tạo..." : "Tạo trò chơi"}
        </button>
      </div>
    </div>
  );
}
