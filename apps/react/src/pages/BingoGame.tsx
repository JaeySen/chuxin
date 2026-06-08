import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  useBingoGame, joinBingo, startBingo, callNextWord, markCell, endBingo, expireBingoGuestLink,
} from "../lib/bingoGame";
import { useAuth } from "../lib/auth-context";

function findBingoLine(board: string[][], marked: Set<string>): [number, number][] | null {
  const n = board.length;
  for (let r = 0; r < n; r++) {
    if (board[r].every((c) => marked.has(c))) return board[r].map((_, c) => [r, c]);
  }
  for (let c = 0; c < n; c++) {
    if (board.every((row) => marked.has(row[c]))) return board.map((_, r) => [r, c]);
  }
  if (board.every((row, i) => marked.has(row[i]))) return board.map((_, i) => [i, i]);
  if (board.every((row, i) => marked.has(row[n - 1 - i]))) return board.map((_, i) => [i, n - 1 - i]);
  return null;
}

export function BingoGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { game, error } = useBingoGame(gameId);
  const [joined, setJoined] = useState(false);
  const [guestUid, setGuestUid] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [joinErr, setJoinErr] = useState<string | null>(null);
  const [actErr, setActErr] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copied, setCopied] = useState(false);

  const isTeacher = !!game && !!user && game.teacherUid === user.id;
  const myUid = guestUid ?? user?.id ?? null;
  const me = game && myUid ? game.players[myUid] : null;

  // Auth users: auto-join
  useEffect(() => {
    if (!game || !user || joined || isTeacher) return;
    if (me) { setJoined(true); return; }
    joinBingo(game.id)
      .then(() => setJoined(true))
      .catch((e) => setJoinErr(e instanceof Error ? e.message : String(e)));
  }, [game, user, isTeacher, me, joined]);

  // Guests: show name prompt once game loads and user is not authed
  useEffect(() => {
    if (authLoading || user || !game || joined || showNamePrompt) return;
    if (game.guestExpired) return;
    setShowNamePrompt(true);
  }, [authLoading, user, game, joined, showNamePrompt]);

  useEffect(() => {
    if (game?.winner?.uid === myUid) setShowCelebration(true);
  }, [game?.winner?.uid, myUid]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleGuestJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!game || !guestName.trim()) return;
    setJoinErr(null);
    try {
      const { game: updated, guestUid: uid } = await joinBingo(game.id, { name: guestName.trim() });
      if (uid) {
        setGuestUid(uid);
        sessionStorage.setItem(`bingo_guest_${game.id}`, uid);
      } else {
        // fallback: find by name
        const entry = Object.values(updated.players).find((p) => p.name === guestName.trim() && p.uid.startsWith("guest_"));
        if (entry) {
          setGuestUid(entry.uid);
          sessionStorage.setItem(`bingo_guest_${game.id}`, entry.uid);
        }
      }
      setShowNamePrompt(false);
      setJoined(true);
    } catch (e: unknown) {
      setJoinErr(e instanceof Error ? e.message : String(e));
    }
  }

  // Restore guest uid from sessionStorage on refresh
  useEffect(() => {
    if (!gameId || user) return;
    const stored = sessionStorage.getItem(`bingo_guest_${gameId}`);
    if (stored) { setGuestUid(stored); setJoined(true); setShowNamePrompt(false); }
  }, [gameId, user]);

  async function runAction(fn: () => Promise<unknown>) {
    setActErr(null);
    try { await fn(); }
    catch (e: unknown) { setActErr(e instanceof Error ? e.message : String(e)); }
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
          <h2>Tham gia Bingo</h2>
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
  const currentChar = game.called.at(-1) ?? null;
  const currentWord = currentChar ? game.words[currentChar] : null;
  const uncalledCount = game.wordPool.length - game.called.length;

  // ── Lobby ────────────────────────────────────────────────────
  if (game.status === "lobby") {
    return (
      <div className="bingo-shell ws-center-col">
        <div className="ws-lobby-card">
          <h2>Phòng chờ Bingo {isTeacher && <span className="ws-lvl-badge">Giáo viên</span>}</h2>
          <p className="muted">{playerCount} / {game.maxPlayers} học viên</p>
          <div className="ws-player-chips">
            {Object.values(game.players).map((p) => (
              <div key={p.uid} className="ws-player-chip"
                style={{ background: "#fff7d6", borderColor: "#ffc60b", color: "#7e1518" }}>
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
                onClick={() => runAction(() => expireBingoGuestLink(game.id))}>
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
              onClick={() => runAction(() => startBingo(game.id))}>
              Bắt đầu ({playerCount} người)
            </button>
          ) : (
            <div className="feedback feedback-info">Đang chờ giáo viên bắt đầu…</div>
          )}
        </div>
      </div>
    );
  }

  // ── Active / Ended ───────────────────────────────────────────
  const isActive = game.status === "active";

  return (
    <div className="bingo-shell">
      {showCelebration && (
        <div className="bingo-celebrate" onClick={() => setShowCelebration(false)}>
          <div className="bingo-celebrate-text">BINGO!</div>
          <div className="bingo-celebrate-sub">Nhấn để đóng</div>
        </div>
      )}

      {game.winner && (
        <div className={`bingo-winner-bar ${game.winner.uid === myUid ? "bingo-winner-bar--me" : ""}`}>
          {game.winner.uid === myUid ? "🎉 BINGO! Bạn thắng!" : `🎊 ${game.winner.name} đã BINGO!`}
        </div>
      )}

      <div className="bingo-layout">
        <div className="bingo-board-col">
          {isTeacher && !me ? (
            <TeacherBoardOverview game={game} />
          ) : me ? (
            <PlayerBoard game={game} me={me} currentChar={currentChar}
              onMark={(c) => runAction(() => markCell(game.id, c, guestUid ?? undefined))} isActive={isActive} />
          ) : (
            <div className="feedback feedback-info">Bạn chưa tham gia phòng này.</div>
          )}
        </div>

        <div className="bingo-right-col">
          <div className="bingo-current">
            <div className="bingo-current-label">Từ vừa rút</div>
            {currentWord ? (
              <>
                <div className="bingo-current-char">{currentWord.char}</div>
                <div className="bingo-current-py">{currentWord.pinyin}</div>
                <div className="bingo-current-en">{currentWord.en}</div>
              </>
            ) : <div className="muted" style={{ fontSize: 14 }}>Chưa rút từ nào</div>}
          </div>

          {isTeacher && isActive && (
            <>
              <button className="btn btn-primary" disabled={uncalledCount === 0}
                onClick={() => runAction(() => callNextWord(game.id))}>
                {uncalledCount > 0 ? `Rút từ tiếp theo (còn ${uncalledCount})` : "Hết từ"}
              </button>
              <button className="btn btn-ghost btn-sm"
                onClick={() => runAction(() => endBingo(game.id))}>
                Kết thúc trò chơi
              </button>
              {!game.guestExpired && (
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--c-red-dark)" }}
                  onClick={() => runAction(() => expireBingoGuestLink(game.id))}>
                  Thu hồi link khách
                </button>
              )}
              {game.guestExpired && <span className="muted" style={{ fontSize: 13 }}>Link khách đã thu hồi</span>}
            </>
          )}
          {actErr && <div className="feedback feedback-bad">{actErr}</div>}

          <div className="bingo-history-panel">
            <div className="ws-wl-title">Đã rút ({game.called.length})</div>
            <div className="bingo-called-chips">
              {[...game.called].reverse().map((char, i) => {
                const onMyBoard = !!me && me.board.flat().includes(char);
                const marked = !!me && me.marked.includes(char);
                return (
                  <span key={char}
                    className={`bingo-chip ${onMyBoard ? "bingo-chip--mine" : ""} ${marked ? "bingo-chip--marked" : ""}`}
                    title={game.words[char] ? `${game.words[char].pinyin} — ${game.words[char].en}` : ""}>
                    {char}
                    {i === 0 && <span className="bingo-chip-new">•</span>}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="bingo-scoreboard">
            <div className="ws-wl-title">Học viên</div>
            {Object.values(game.players)
              .sort((a, b) => b.marked.length - a.marked.length)
              .map((p) => (
                <div key={p.uid}
                  className={`bingo-score-row ${p.bingo ? "bingo-score-row--winner" : ""} ${p.uid === myUid ? "bingo-score-row--me" : ""}`}>
                  <span className="bingo-score-name">{p.name}{p.uid === myUid ? " (bạn)" : ""}</span>
                  <span className="bingo-score-count">{p.marked.length} ô</span>
                  {p.bingo && <span className="bingo-badge">BINGO</span>}
                </div>
              ))}
            {Object.keys(game.players).length === 0 && (
              <div className="muted" style={{ fontSize: 13 }}>Chưa có học viên</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherBoardOverview({ game }: { game: ReturnType<typeof useBingoGame>["game"] }) {
  const totalWords = useMemo(() => game?.wordPool.length ?? 0, [game]);
  if (!game) return null;
  return (
    <div className="lesson-card" style={{ padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>Giám sát giáo viên</h3>
      <p className="muted">
        {game.called.length} / {totalWords} từ đã được rút. Dùng nút bên phải để rút từ tiếp theo và kết thúc trò chơi.
      </p>
    </div>
  );
}

function PlayerBoard({
  game, me, currentChar, onMark, isActive,
}: {
  game: NonNullable<ReturnType<typeof useBingoGame>["game"]>;
  me: NonNullable<NonNullable<ReturnType<typeof useBingoGame>["game"]>["players"][string]>;
  currentChar: string | null;
  onMark: (char: string) => void;
  isActive: boolean;
}) {
  const markedSet = new Set(me.marked);
  const calledSet = new Set(game.called);
  const winLine = me.bingo ? findBingoLine(me.board, markedSet) : null;
  const winCells = winLine ? new Set(winLine.map(([r, c]) => `${r},${c}`)) : new Set<string>();

  return (
    <>
      <div className={`bingo-grid bingo-grid--${game.size}`}>
        {me.board.map((row, r) =>
          row.map((char, c) => {
            const word = game.words[char];
            const isMarked = markedSet.has(char);
            const isCalled = calledSet.has(char);
            const isWin = winCells.has(`${r},${c}`);
            const isNew = char === currentChar;
            let cls = "bingo-cell";
            if (isWin) cls += " bingo-cell--win";
            else if (isMarked) cls += " bingo-cell--marked";
            else if (isCalled) cls += " bingo-cell--callable";
            if (isNew && !isMarked) cls += " bingo-cell--new";
            return (
              <button key={`${r}-${c}`} className={cls}
                onClick={() => onMark(char)}
                disabled={!isActive || !isCalled || isMarked}
                title={word ? `${word.pinyin} — ${word.en}` : char}>
                <span className="bingo-cell-char">{char}</span>
                {word && <span className="bingo-cell-py">{word.pinyin}</span>}
              </button>
            );
          })
        )}
      </div>
      <div className="bingo-board-legend">
        <span className="bingo-legend-item bingo-legend--callable">Có thể đánh dấu</span>
        <span className="bingo-legend-item bingo-legend--marked">Đã đánh dấu</span>
        {winCells.size > 0 && <span className="bingo-legend-item bingo-legend--win">Bingo!</span>}
      </div>
    </>
  );
}
