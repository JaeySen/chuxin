import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { WordSearchBoard } from "../components/WordSearchBoard";
import {
  useWordSearchGame, joinWordSearch, startWordSearch, endWordSearch, submitFoundWord,
} from "../lib/wordSearchGame";
import { useAuth } from "../lib/auth-context";

export function WordSearchGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { game, error } = useWordSearchGame(gameId);
  const [joined, setJoined] = useState(false);
  const [joinErr, setJoinErr] = useState<string | null>(null);
  const [actErr, setActErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isTeacher = !!game && !!user && game.teacherUid === user.id;
  const me = game && user ? game.players[user.id] : null;

  useEffect(() => {
    if (!game || !user || joined || isTeacher) return;
    if (me) { setJoined(true); return; }
    joinWordSearch(game.id)
      .then(() => setJoined(true))
      .catch((e) => setJoinErr(e instanceof Error ? e.message : String(e)));
  }, [game, user, isTeacher, me, joined]);

  async function runAction(fn: () => Promise<unknown>) {
    setActErr(null);
    try { await fn(); }
    catch (e: unknown) { setActErr(e instanceof Error ? e.message : String(e)); }
  }

  async function handleFound(wordIndex: number, positions: [number, number][]) {
    if (!game) return;
    await runAction(() => submitFoundWord(game.id, wordIndex, positions));
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (authLoading || !gameId) return <div className="bingo-shell ws-center-col"><span className="muted">Đang tải…</span></div>;
  if (!user) return <div className="bingo-shell"><div className="feedback feedback-info">Bạn cần đăng nhập để tham gia.</div></div>;
  if (error && !game) return <div className="bingo-shell"><div className="feedback feedback-bad">{error}</div></div>;
  if (!game) return <div className="bingo-shell ws-center-col"><span className="muted">Đang tải…</span></div>;

  const playerCount = Object.keys(game.players).length;
  const foundCount = Object.keys(game.found).length;

  // ── Lobby ─────────────────────────────────────
  if (game.status === "lobby") {
    return (
      <div className="bingo-shell ws-center-col">
        <div className="ws-lobby-card">
          <h2>Phòng chờ Tìm từ {isTeacher && <span className="ws-lvl-badge">Giáo viên</span>}</h2>
          <p className="muted">{playerCount} / {game.maxPlayers} học viên</p>
          <div className="ws-player-chips">
            {Object.values(game.players).map((p) => (
              <div key={p.uid} className="ws-player-chip"
                style={{ background: p.color + "22", borderColor: p.color, color: p.color }}>
                {p.name}
              </div>
            ))}
            {playerCount === 0 && <span className="muted">Chưa có học viên nào…</span>}
          </div>
          <div className="ws-link-row">
            <button className="btn btn-ghost btn-sm" onClick={copyLink}>
              {copied ? "Đã copy ✓" : "Copy link mời"}
            </button>
          </div>
          {joinErr && <div className="feedback feedback-bad">{joinErr}</div>}
          {isTeacher ? (
            <button className="btn btn-primary" disabled={playerCount === 0}
              onClick={() => runAction(() => startWordSearch(game.id))}>
              Bắt đầu ({playerCount} người)
            </button>
          ) : (
            <div className="feedback feedback-info">Đang chờ giáo viên bắt đầu…</div>
          )}
        </div>
      </div>
    );
  }

  // ── Active / Ended ────────────────────────────
  const isActive = game.status === "active";

  return (
    <div className="bingo-shell">
      {game.status === "ended" && (
        <div className="bingo-winner-bar">🎉 Hết giờ — tìm được {foundCount}/{game.wordList.length} từ</div>
      )}

      <div className="bingo-layout">
        <div className="bingo-board-col">
          <WordSearchBoard
            grid={game.board}
            found={game.found}
            wordList={game.wordList}
            placements={game.placements}
            onWordFound={handleFound}
            active={isActive && !isTeacher}
          />
          <div className="bingo-board-legend">
            <span className="muted">
              Kéo chuột để chọn dãy ô (ngang, dọc, chéo). Tìm chữ Hán bằng cách ghép pinyin.
            </span>
          </div>
        </div>

        <div className="bingo-right-col">
          <div className="ws-wl-title">Tìm các từ ({foundCount}/{game.wordList.length})</div>
          <div className="ws-word-list">
            {game.wordList.map((w, i) => {
              const f = game.found[String(i)];
              return (
                <div key={i} className={`ws-word-row ${f ? "ws-word-row--done" : ""}`}
                  style={f ? { background: f.color + "22", borderColor: f.color } : undefined}>
                  <div>
                    <div className="ws-word-hanzi">{w.char}</div>
                    <div className="ws-word-py">{w.pinyin}</div>
                    <div className="ws-word-vi muted">{w.en}</div>
                  </div>
                  {f && <span className="ws-word-by" style={{ color: f.color }}>✓ {f.name}</span>}
                </div>
              );
            })}
          </div>

          {isTeacher && isActive && (
            <button className="btn btn-ghost btn-sm" onClick={() => runAction(() => endWordSearch(game.id))}>
              Kết thúc trò chơi
            </button>
          )}
          {actErr && <div className="feedback feedback-bad">{actErr}</div>}

          <div className="ws-wl-title" style={{ marginTop: 16 }}>Học viên</div>
          <div className="bingo-scoreboard">
            {Object.values(game.players).map((p) => {
              const count = Object.values(game.found).filter((f) => f.by === p.uid).length;
              return (
                <div key={p.uid}
                  className={`bingo-score-row ${p.uid === user.id ? "bingo-score-row--me" : ""}`}>
                  <span className="bingo-score-name">
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 5,
                      background: p.color, marginRight: 6, verticalAlign: "middle" }} />
                    {p.name}{p.uid === user.id ? " (bạn)" : ""}
                  </span>
                  <span className="bingo-score-count">{count} từ</span>
                </div>
              );
            })}
            {playerCount === 0 && <div className="muted" style={{ fontSize: 13 }}>Chưa có học viên</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
