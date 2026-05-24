import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import hsk1Raw from "../data/hsk1.json";
import hsk2Raw from "../data/hsk2.json";
import hsk3Raw from "../data/hsk3.json";
import { createBingoGame, type BingoWord, type BoardSize } from "../lib/bingoGame";
import { useAuth } from "../lib/auth-context";

interface SetupConfig {
  size: BoardSize;
  hsk1: boolean;
  hsk2: boolean;
  hsk3: boolean;
  maxPlayers: number;
}

export function BingoTeacher() {
  const navigate = useNavigate();
  const { role, user, loading } = useAuth();
  const [config, setConfig] = useState<SetupConfig>({
    size: 4, hsk1: true, hsk2: true, hsk3: false, maxPlayers: 10,
  });
  const [busy, setBusy] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const wordMap = useMemo<Record<string, BingoWord>>(() => {
    const map: Record<string, BingoWord> = {};
    if (config.hsk1) {
      for (const [char, v] of Object.entries(hsk1Raw as Record<string, { pinyin: string; en: string }>)) {
        map[char] = { char, pinyin: v.pinyin, en: v.en };
      }
    }
    if (config.hsk2) for (const w of hsk2Raw as BingoWord[]) map[w.char] = w;
    if (config.hsk3) for (const w of hsk3Raw as BingoWord[]) map[w.char] = w;
    return map;
  }, [config.hsk1, config.hsk2, config.hsk3]);

  const wordCount = Object.keys(wordMap).length;
  const minNeeded = config.size * config.size;

  if (loading) return <div className="bingo-setup-shell"><span className="muted">Đang tải…</span></div>;

  if (!user) {
    return (
      <div className="bingo-setup-shell">
        <h2>Tạo trò chơi Bingo</h2>
        <div className="feedback feedback-info">Bạn cần đăng nhập để tạo trò chơi.</div>
      </div>
    );
  }
  if (role !== "teacher" && role !== "admin") {
    return (
      <div className="bingo-setup-shell">
        <h2>Tạo trò chơi Bingo</h2>
        <div className="feedback feedback-bad">
          Chỉ giáo viên mới có thể tạo trò chơi. Nếu bạn là giáo viên, vui lòng đăng nhập bằng tài khoản giáo viên.
        </div>
      </div>
    );
  }

  async function handleCreate() {
    if (wordCount < minNeeded) return;
    setBusy(true); setErr(null);
    try {
      const game = await createBingoGame({
        size: config.size,
        maxPlayers: config.maxPlayers,
        words: wordMap,
        wordPool: Object.keys(wordMap),
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
      <h2>Tạo trò chơi Bingo</h2>

      <div className="ws-config-card">
        <div className="ws-config-section">
          <div className="ws-config-label">Kích thước bảng</div>
          <div className="bingo-size-picker">
            {([3, 4, 5] as BoardSize[]).map((s) => (
              <button key={s}
                className={`bingo-size-btn ${config.size === s ? "bingo-size-btn--active" : ""}`}
                onClick={() => setConfig((c) => ({ ...c, size: s }))}>
                <span className="bingo-size-label">{s}×{s}</span>
                <span className="bingo-size-sub">{s * s} ô</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ws-config-section">
          <div className="ws-config-label">Chọn nhóm từ vựng</div>
          {(["hsk1", "hsk2", "hsk3"] as const).map((lvl) => (
            <label key={lvl} className="ws-checkbox-row">
              <input type="checkbox" checked={config[lvl]}
                onChange={(e) => setConfig((c) => ({ ...c, [lvl]: e.target.checked }))} />
              <span className="ws-lvl-badge">{lvl.toUpperCase()}</span>
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
          {wordCount} từ trong nhóm · cần tối thiểu <strong>{minNeeded}</strong> từ
        </div>
        {wordCount < minNeeded && (
          <div className="feedback feedback-info">Cần thêm từ vựng. Hãy chọn thêm nhóm HSK.</div>
        )}
        {err && <div className="feedback feedback-bad">{err}</div>}

        <button className="btn btn-primary" disabled={busy || wordCount < minNeeded} onClick={handleCreate}>
          {busy ? "Đang tạo..." : "Tạo trò chơi"}
        </button>
      </div>
    </div>
  );
}
