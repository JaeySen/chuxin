import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import hsk1Raw from "../data/hsk1.json";
import hsk2Raw from "../data/hsk2.json";
import hsk3Raw from "../data/hsk3.json";
import { generateBoard, pinyinToChars, type WordEntry } from "../utils/wordSearchGen";
import { createWordSearchGame } from "../lib/wordSearchGame";
import { useAuth } from "../lib/auth-context";

const BOARD_SIZE = 12;
const TOTAL_WORDS = 10;

function buildPool() {
  const hsk1: WordEntry[] = Object.entries(hsk1Raw as Record<string, { pinyin: string; en: string }>)
    .map(([char, v]) => ({ char, pinyin: v.pinyin, en: v.en, pinyinChars: pinyinToChars(v.pinyin) }));
  const hsk2: WordEntry[] = (hsk2Raw as { char: string; pinyin: string; en: string }[])
    .map((w) => ({ ...w, pinyinChars: pinyinToChars(w.pinyin) }));
  const hsk3: WordEntry[] = (hsk3Raw as { char: string; pinyin: string; en: string }[])
    .map((w) => ({ ...w, pinyinChars: pinyinToChars(w.pinyin) }));
  return { hsk1, hsk2, hsk3 };
}
const POOL = buildPool();

export function WordSearchTeacher() {
  const navigate = useNavigate();
  const { role, user, loading } = useAuth();
  const [config, setConfig] = useState({ hsk1: true, hsk2: true, hsk3: false, maxPlayers: 10 });
  const [busy, setBusy] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const activePool = useMemo<WordEntry[]>(() => {
    const words: WordEntry[] = [];
    if (config.hsk1) words.push(...POOL.hsk1);
    if (config.hsk2) words.push(...POOL.hsk2);
    if (config.hsk3) words.push(...POOL.hsk3);
    return words;
  }, [config.hsk1, config.hsk2, config.hsk3]);

  if (loading) return <div className="bingo-setup-shell"><span className="muted">Đang tải…</span></div>;
  if (!user) {
    return (
      <div className="bingo-setup-shell">
        <h2>Tạo trò chơi Tìm từ</h2>
        <div className="feedback feedback-info">Bạn cần đăng nhập để tạo trò chơi.</div>
      </div>
    );
  }
  if (role !== "teacher" && role !== "admin") {
    return (
      <div className="bingo-setup-shell">
        <h2>Tạo trò chơi Tìm từ</h2>
        <div className="feedback feedback-bad">Chỉ giáo viên mới có thể tạo trò chơi.</div>
      </div>
    );
  }

  async function handleCreate() {
    if (activePool.length === 0) return;
    setBusy(true); setErr(null);
    try {
      const shuffled = [...activePool].sort((a, b) => a.pinyinChars.length - b.pinyinChars.length);
      const candidates = shuffled.slice(0, Math.min(30, shuffled.length));
      const selected = [...candidates].sort(() => Math.random() - 0.5).slice(0, TOTAL_WORDS);

      const { grid, placed } = generateBoard(selected, BOARD_SIZE);
      // Drop words that didn't fit + remap indices
      const placedIndices = new Set(placed.map((p) => p.wordIndex));
      const finalWords = selected.filter((_, i) => placedIndices.has(i));
      const remap = new Map<number, number>();
      let next = 0;
      for (let i = 0; i < selected.length; i++) if (placedIndices.has(i)) remap.set(i, next++);
      const finalPlacements = placed.map((p) => ({
        wordIndex: remap.get(p.wordIndex)!,
        positions: p.positions,
      }));

      const game = await createWordSearchGame({
        maxPlayers: config.maxPlayers,
        board: grid,
        wordList: finalWords,
        placements: finalPlacements,
      });
      setGameId(game.id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (gameId) {
    const link = `${window.location.origin}/word-search/${gameId}`;
    return (
      <div className="bingo-setup-shell">
        <h2>Trò chơi Tìm từ đã tạo!</h2>
        <p className="muted">Chia sẻ đường link cho học viên:</p>
        <div className="ws-link-box">
          <span className="ws-link-url">{link}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => copyLink(link)}>
            {copied ? "Đã copy ✓" : "Copy"}
          </button>
        </div>
        <div className="bingo-setup-btns">
          <button className="btn btn-primary" onClick={() => navigate(`/word-search/${gameId}`)}>
            Vào phòng với tư cách giáo viên →
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
      <h2>Tạo trò chơi Tìm từ</h2>
      <div className="ws-config-card">
        <div className="ws-config-section">
          <div className="ws-config-label">Chọn nhóm từ vựng</div>
          {(["hsk1", "hsk2", "hsk3"] as const).map((lvl) => (
            <label key={lvl} className="ws-checkbox-row">
              <input type="checkbox" checked={config[lvl]}
                onChange={(e) => setConfig((c) => ({ ...c, [lvl]: e.target.checked }))} />
              <span className="ws-lvl-badge">{lvl.toUpperCase()}</span>
              <span className="muted" style={{ marginLeft: 8 }}>{POOL[lvl].length} từ</span>
            </label>
          ))}
        </div>

        <div className="ws-config-section">
          <div className="ws-config-label">
            Số học viên tối đa:&nbsp;<strong>{config.maxPlayers}</strong>
          </div>
          <input type="range" min={2} max={30} value={config.maxPlayers}
            onChange={(e) => setConfig((c) => ({ ...c, maxPlayers: +e.target.value }))}
            className="ws-range" />
        </div>

        <div className="ws-config-note">
          Bảng {BOARD_SIZE}×{BOARD_SIZE} · {TOTAL_WORDS} từ mỗi ván · {activePool.length} từ trong nhóm
        </div>
        {err && <div className="feedback feedback-bad">{err}</div>}

        <button className="btn btn-primary" disabled={busy || activePool.length === 0} onClick={handleCreate}>
          {busy ? "Đang tạo..." : "Tạo trò chơi"}
        </button>
      </div>
    </div>
  );
}
