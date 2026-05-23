import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import hsk1Raw from "../data/hsk1.json";
import hsk2Raw from "../data/hsk2.json";
import hsk3Raw from "../data/hsk3.json";
import { getSyllables, generateBoard } from "../utils/wordSearchGen";
import { createGame, type WordEntry, type GameConfig } from "../lib/wordSearchGame";

const TOTAL_WORDS = 14;
const MIN_SYLLABLES = 2; // only multi-syllable words for word search

function buildPool(): Record<"hsk1" | "hsk2" | "hsk3", WordEntry[]> {
  const hsk1: WordEntry[] = Object.entries(hsk1Raw)
    .map(([char, v]) => {
      const syls = getSyllables(v.pinyin);
      return { char, pinyin: v.pinyin, en: v.en, syllables: syls };
    })
    .filter((w) => w.syllables.length >= MIN_SYLLABLES);

  const hsk2: WordEntry[] = (hsk2Raw as { char: string; pinyin: string; en: string }[]).map((w) => ({
    ...w,
    syllables: getSyllables(w.pinyin),
  }));

  const hsk3: WordEntry[] = (hsk3Raw as { char: string; pinyin: string; en: string }[]).map((w) => ({
    ...w,
    syllables: getSyllables(w.pinyin),
  }));

  return { hsk1, hsk2, hsk3 };
}

const POOL = buildPool();

export function WordSearchTeacher() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<GameConfig>({
    hsk1: false,
    hsk2: true,
    hsk3: true,
    maxPlayers: 6,
  });
  const [loading, setLoading] = useState(false);
  const [gameLink, setGameLink] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  const activePool = useMemo(() => {
    const words: WordEntry[] = [];
    if (config.hsk1) words.push(...POOL.hsk1);
    if (config.hsk2) words.push(...POOL.hsk2);
    if (config.hsk3) words.push(...POOL.hsk3);
    return words;
  }, [config]);

  const fillPool = useMemo(
    () => [...new Set(activePool.flatMap((w) => w.syllables))],
    [activePool]
  );

  async function handleCreate() {
    if (activePool.length < 4) return;
    setLoading(true);
    try {
      // Shuffle and pick TOTAL_WORDS words; prefer 2-syllable (shorter = more placeable)
      const shuffled = [...activePool].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(TOTAL_WORDS, shuffled.length));

      const { grid, placed } = generateBoard(
        selected.map((w) => w.syllables),
        fillPool.length > 0 ? fillPool : ["zhong", "guo", "ren", "wo", "ni"],
        9
      );

      const id = await createGame(grid, selected, placed, config);
      localStorage.setItem(`wsCreator_${id}`, "1");

      const link = `${window.location.origin}/word-search/${id}`;
      setGameId(id);
      setGameLink(link);
    } finally {
      setLoading(false);
    }
  }

  if (gameLink && gameId) {
    return (
      <div className="ws-teacher-shell">
        <h2>Trò chơi đã tạo!</h2>
        <p className="muted">Chia sẻ đường link này cho học viên:</p>
        <div className="ws-link-box">
          <span className="ws-link-url">{gameLink}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigator.clipboard.writeText(gameLink)}
          >
            Copy
          </button>
        </div>
        <div className="ws-teacher-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/word-search/${gameId}`)}
          >
            Vào phòng →
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => { setGameLink(null); setGameId(null); }}
          >
            Tạo trò chơi mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ws-teacher-shell">
      <h2>Tạo trò chơi Tìm từ (Word Search)</h2>

      <div className="ws-config-card">
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
              <span className="muted">
                {POOL[lvl].length} từ
                {lvl === "hsk1" ? " (≥2 âm tiết)" : ""}
              </span>
            </label>
          ))}
        </div>

        <div className="ws-config-section">
          <div className="ws-config-label">
            Số học viên tối đa:&nbsp;
            <strong>{config.maxPlayers}</strong>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={config.maxPlayers}
            onChange={(e) => setConfig((c) => ({ ...c, maxPlayers: +e.target.value }))}
            className="ws-range"
          />
          <div className="ws-range-ticks">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>

        <div className="ws-config-note">
          {activePool.length} từ trong nhóm · {Math.min(TOTAL_WORDS, activePool.length)} từ mỗi ván
          · 8–10 từ có thể tìm được
        </div>

        <button
          className="btn btn-primary"
          disabled={loading || activePool.length < 4}
          onClick={handleCreate}
        >
          {loading ? "Đang tạo bảng..." : "Tạo trò chơi"}
        </button>

        {activePool.length < 4 && (
          <div className="feedback feedback-info">Hãy chọn ít nhất một nhóm từ vựng.</div>
        )}
      </div>
    </div>
  );
}
