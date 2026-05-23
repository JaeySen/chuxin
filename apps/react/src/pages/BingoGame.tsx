import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  subscribeBingo,
  joinBingo,
  startBingo,
  callNextWord,
  markCell,
  findBingoLine,
  type BingoGame as BingoGameState,
} from "../lib/bingoGame";

function getPlayerId(): string {
  let id = localStorage.getItem("bingoPlayerId");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem("bingoPlayerId", id);
  }
  return id;
}

export function BingoGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<BingoGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(
    () => localStorage.getItem("bingoPlayerName") ?? ""
  );
  const [joined, setJoined] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copied, setCopied] = useState(false);

  const playerId = getPlayerId();
  const isCreator = gameId ? !!localStorage.getItem(`bingoCreator_${gameId}`) : false;

  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeBingo(gameId, (g) => {
      setGame(g);
      setLoading(false);
      if (!g) { setError("Không tìm thấy trò chơi"); return; }
      if (g.players[playerId]) setJoined(true);
    });
    return unsub;
  }, [gameId, playerId]);

  // Show celebration when I win
  useEffect(() => {
    if (game?.winner?.uid === playerId) setShowCelebration(true);
  }, [game?.winner?.uid, playerId]);

  const handleJoin = useCallback(async () => {
    if (!gameId || !nameInput.trim()) return;
    localStorage.setItem("bingoPlayerName", nameInput.trim());
    const res = await joinBingo(gameId, playerId, nameInput.trim());
    if ("error" in res) { setError(res.error); return; }
    setJoined(true);
  }, [gameId, playerId, nameInput]);

  const handleMark = useCallback(
    async (char: string) => {
      if (!gameId || !game) return;
      const me = game.players[playerId];
      if (!me || !game.called.includes(char) || me.marked.includes(char)) return;
      await markCell(gameId, playerId, char, me.board, me.marked, me.name);
    },
    [gameId, game, playerId]
  );

  const handleCallWord = useCallback(async () => {
    if (!gameId) return;
    await callNextWord(gameId);
  }, [gameId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ── States ────────────────────────────────────────────────────
  if (loading) return <div className="bingo-shell ws-center-col"><span className="muted">Đang tải...</span></div>;
  if (error) return <div className="bingo-shell"><div className="feedback feedback-bad">{error}</div></div>;
  if (!game) return null;

  const playerCount = Object.keys(game.players).length;
  const currentChar = game.called.at(-1) ?? null;
  const currentWord = currentChar ? game.words[currentChar] : null;

  // ── Join screen ───────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="bingo-shell ws-center-col">
        <div className="ws-join-card">
          <h2>Tham gia Bingo</h2>
          <p className="muted">{playerCount} / {game.maxPlayers} người đã vào</p>
          <input
            className="ws-name-input"
            placeholder="Nhập tên của bạn"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            autoFocus
          />
          <button className="btn btn-primary" disabled={!nameInput.trim()} onClick={handleJoin}>
            Tham gia →
          </button>
        </div>
      </div>
    );
  }

  // ── Lobby ─────────────────────────────────────────────────────
  if (game.status === "lobby") {
    return (
      <div className="bingo-shell ws-center-col">
        <div className="ws-lobby-card">
          <h2>Phòng chờ Bingo</h2>
          <div className="ws-player-chips">
            {Object.values(game.players).map((p) => (
              <div
                key={p.name}
                className="ws-player-chip"
                style={{ background: "#e0f2fe", borderColor: "#0891b2", color: "#0e7490" }}
              >
                {p.name}
              </div>
            ))}
            {playerCount === 0 && <span className="muted">Chưa có ai...</span>}
          </div>
          <div className="ws-link-row">
            <button className="btn btn-ghost btn-sm" onClick={copyLink}>
              {copied ? "Đã copy ✓" : "Copy link mời"}
            </button>
          </div>
          {isCreator ? (
            <button
              className="btn btn-primary"
              disabled={playerCount === 0}
              onClick={() => startBingo(gameId!)}
            >
              Bắt đầu ({playerCount} người)
            </button>
          ) : (
            <div className="feedback feedback-info">Chờ giáo viên bắt đầu...</div>
          )}
        </div>
      </div>
    );
  }

  // ── Active / ended game ───────────────────────────────────────
  const me = game.players[playerId];
  if (!me) return <div className="bingo-shell"><div className="feedback feedback-bad">Bạn không trong trò chơi này.</div></div>;

  const markedSet = new Set(me.marked);
  const calledSet = new Set(game.called);
  const winLine = me.bingo ? findBingoLine(me.board, markedSet) : null;
  const winCells = winLine
    ? new Set(winLine.map(([r, c]) => `${r},${c}`))
    : new Set<string>();

  const isActive = game.status === "active";
  const uncalledCount = game.wordPool.length - game.called.length;

  return (
    <div className="bingo-shell">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="bingo-celebrate" onClick={() => setShowCelebration(false)}>
          <div className="bingo-celebrate-text">BINGO!</div>
          <div className="bingo-celebrate-sub">Nhấn để đóng</div>
        </div>
      )}

      {/* Winner banner */}
      {game.winner && (
        <div className={`bingo-winner-bar ${game.winner.uid === playerId ? "bingo-winner-bar--me" : ""}`}>
          {game.winner.uid === playerId
            ? "🎉 BINGO! Bạn thắng!"
            : `🎊 ${game.winner.name} đã BINGO!`}
        </div>
      )}

      <div className="bingo-layout">
        {/* ── Board ─────────────────────────────────────── */}
        <div className="bingo-board-col">
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
                  <button
                    key={`${r}-${c}`}
                    className={cls}
                    onClick={() => handleMark(char)}
                    disabled={!isActive || !isCalled || isMarked}
                    title={word ? `${word.pinyin} — ${word.en}` : char}
                  >
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
        </div>

        {/* ── Right panel ───────────────────────────────── */}
        <div className="bingo-right-col">
          {/* Current word */}
          <div className="bingo-current">
            <div className="bingo-current-label">Từ vừa rút</div>
            {currentWord ? (
              <>
                <div className="bingo-current-char">{currentWord.char}</div>
                <div className="bingo-current-py">{currentWord.pinyin}</div>
                <div className="bingo-current-en">{currentWord.en}</div>
              </>
            ) : (
              <div className="muted" style={{ fontSize: 14 }}>Chưa rút từ nào</div>
            )}
          </div>

          {/* Teacher: draw next word */}
          {isCreator && isActive && (
            <button
              className="btn btn-primary"
              onClick={handleCallWord}
              disabled={uncalledCount === 0}
            >
              {uncalledCount > 0 ? `Rút từ tiếp theo (còn ${uncalledCount})` : "Hết từ"}
            </button>
          )}

          {/* Called words history */}
          <div className="bingo-history-panel">
            <div className="ws-wl-title">Đã rút ({game.called.length})</div>
            <div className="bingo-called-chips">
              {[...game.called].reverse().map((char, i) => {
                const onMyBoard = me.board.flat().includes(char);
                const marked = markedSet.has(char);
                return (
                  <span
                    key={char}
                    className={`bingo-chip ${onMyBoard ? "bingo-chip--mine" : ""} ${marked ? "bingo-chip--marked" : ""}`}
                    title={game.words[char] ? `${game.words[char].pinyin} — ${game.words[char].en}` : ""}
                  >
                    {char}
                    {i === 0 && <span className="bingo-chip-new">•</span>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Player scoreboard */}
          <div className="bingo-scoreboard">
            <div className="ws-wl-title">Học viên</div>
            {Object.entries(game.players)
              .sort(([, a], [, b]) => b.marked.length - a.marked.length)
              .map(([uid, p]) => (
                <div
                  key={uid}
                  className={`bingo-score-row ${p.bingo ? "bingo-score-row--winner" : ""} ${uid === playerId ? "bingo-score-row--me" : ""}`}
                >
                  <span className="bingo-score-name">{p.name}{uid === playerId ? " (bạn)" : ""}</span>
                  <span className="bingo-score-count">{p.marked.length} ô</span>
                  {p.bingo && <span className="bingo-badge">BINGO</span>}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
