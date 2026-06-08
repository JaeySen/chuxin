import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { WordSearchBoard } from "../components/WordSearchBoard";
import {
  useWordSearchGame, joinWordSearch, startWordSearch, endWordSearch,
  submitFoundWord, expireWordSearchGuestLink,
} from "../lib/wordSearchGame";
import { useAuth } from "../lib/auth-context";

export function WordSearchGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { game, error } = useWordSearchGame(gameId);
  const [joined, setJoined] = useState(false);
  const [guestUid, setGuestUid] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [joinErr, setJoinErr] = useState<string | null>(null);
  const [actErr, setActErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isTeacher = !!game && !!user && game.teacherUid === user.id;
  const myUid = guestUid ?? user?.id ?? null;
  const me = game && myUid ? game.players[myUid] : null;

  // Auth users: auto-join
  useEffect(() => {
    if (!game || !user || joined || isTeacher) return;
    if (me) { setJoined(true); return; }
    joinWordSearch(game.id)
      .then(() => setJoined(true))
      .catch((e) => setJoinErr(e instanceof Error ? e.message : String(e)));
  }, [game, user, isTeacher, me, joined]);

  // Guests: show name prompt once game loads
  useEffect(() => {
    if (authLoading || user || !game || joined || showNamePrompt) return;
    if (game.guestExpired) return;
    setShowNamePrompt(true);
  }, [authLoading, user, game, joined, showNamePrompt]);

  // Restore guest uid from sessionStorage on refresh
  useEffect(() => {
    if (!gameId || user) return;
    const stored = sessionStorage.getItem(`ws_guest_${gameId}`);
    if (stored) { setGuestUid(stored); setJoined(true); setShowNamePrompt(false); }
  }, [gameId, user]);

  async function handleGuestJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!game || !guestName.trim()) return;
    setJoinErr(null);
    try {
      const { game: updated, guestUid: uid } = await joinWordSearch(game.id, { name: guestName.trim() });
      const resolvedUid = uid ?? Object.values(updated.players).find(
        (p) => p.name === guestName.trim() && p.uid.startsWith("guest_"),
      )?.uid;
      if (resolvedUid) {
        setGuestUid(resolvedUid);
        sessionStorage.setItem(`ws_guest_${game.id}`, resolvedUid);
      }
      setShowNamePrompt(false);
      setJoined(true);
    } catch (e: unknown) {
      setJoinErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function runAction(fn: () => Promise<unknown>) {
    setActErr(null);
    try { await fn(); }
    catch (e: unknown) { setActErr(e instanceof Error ? e.message : String(e)); }
  }

  async function handleFound(wordIndex: number, positions: [number, number][]) {
    if (!game) return;
    await runAction(() => submitFoundWord(game.id, wordIndex, positions, guestUid ?? undefined));
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (authLoading || !gameId) return <div className="bingo-shell ws-center-col"><span className="muted">Đang tải…</span></div>;
  if (error && !game) return <div className="bingo-shell"><div className="feedback feedback-bad">{error}</div></div>;
  if (!game) return <div className="bingo-shell ws-center-col"><span className="muted">Đang tải…</span></div>;

  // Guest link expired
  if (!user && game.guestExpired) {
    return (
      <div className="bingo-shell ws-center-col">
        <div className="ws-lobby-card">
          <h2>Link đã hết hạn</h2>
          <p className="muted">Giáo viên đã thu hồi link mời này. Vui lòng liên hệ giáo viên để nhận link mới.</p>
        </div>
      </div>
    );
  }

  // Guest name prompt
  if (showNamePrompt && !user) {
    return (
      <div className="bingo-shell ws-center-col">
        <div className="ws-lobby-card">
          <h2>Tham gia Tìm từ</h2>
          <p className="muted">Nhập tên hiển thị của bạn để tham gia trò chơi.</p>
          <form onSubmit={handleGuestJoin} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Tên của bạn…"
              maxLength={40}
              required
              autoFocus
              style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--c-divider)", fontSize: 15, fontFamily: "inherit" }}
            />
            {joinErr && <div className="feedback feedback-bad">{joinErr}</div>}
            <button type="submit" className="btn btn-primary" disabled={!guestName.trim()}>
              Tham gia
            </button>
          </form>
        </div>
      </div>
    );
  }

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
                {p.name}{p.uid === myUid ? " (bạn)" : ""}
              </div>
            ))}
            {playerCount === 0 && <span className="muted">Chưa có học viên nào…</span>}
          </div>
          <div className="ws-link-row">
            <button className="btn btn-ghost btn-sm" onClick={copyLink}>
              {copied ? "Đã copy ✓" : "Copy link mời"}
            </button>
            {isTeacher && !game.guestExpired && (
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--c-red-dark)" }}
                onClick={() => runAction(() => expireWordSearchGuestLink(game.id))}>
                Thu hồi link
              </button>
            )}
            {isTeacher && game.guestExpired && (
              <span className="muted" style={{ fontSize: 13 }}>Link đã thu hồi</span>
            )}
          </div>
          {joinErr && <div className="feedback feedback-bad">{joinErr}</div>}
          {actErr && <div className="feedback feedback-bad">{actErr}</div>}
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
              Click chữ đầu, di chuột để xem trước, click chữ cuối để xác nhận. Trên điện thoại: vuốt chọn. Chỉ ngang và dọc.
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
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => runAction(() => endWordSearch(game.id))}>
                Kết thúc trò chơi
              </button>
              {!game.guestExpired && (
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--c-red-dark)" }}
                  onClick={() => runAction(() => expireWordSearchGuestLink(game.id))}>
                  Thu hồi link khách
                </button>
              )}
              {game.guestExpired && <span className="muted" style={{ fontSize: 13 }}>Link khách đã thu hồi</span>}
            </>
          )}
          {actErr && <div className="feedback feedback-bad">{actErr}</div>}

          <div className="ws-wl-title" style={{ marginTop: 16 }}>Học viên</div>
          <div className="bingo-scoreboard">
            {Object.values(game.players).map((p) => {
              const count = Object.values(game.found).filter((f) => f.by === p.uid).length;
              return (
                <div key={p.uid}
                  className={`bingo-score-row ${p.uid === myUid ? "bingo-score-row--me" : ""}`}>
                  <span className="bingo-score-name">
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 5,
                      background: p.color, marginRight: 6, verticalAlign: "middle" }} />
                    {p.name}{p.uid === myUid ? " (bạn)" : ""}
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
