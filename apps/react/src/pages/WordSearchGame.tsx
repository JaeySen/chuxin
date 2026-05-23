import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { WordSearchBoard } from "../components/WordSearchBoard";
import {
  subscribeGame,
  joinGame,
  startGame,
  endGame,
  submitFoundWord,
  type GameState,
} from "../lib/wordSearchGame";

const GAME_DURATION = 60; // seconds

function getPlayerId(): string {
  let id = localStorage.getItem("wsPlayerId");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem("wsPlayerId", id);
  }
  return id;
}

export function WordSearchGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(
    () => localStorage.getItem("wsPlayerName") ?? ""
  );
  const [joined, setJoined] = useState(false);
  const [myColor, setMyColor] = useState("#2563eb");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerId = getPlayerId();
  const isCreator = gameId ? !!localStorage.getItem(`wsCreator_${gameId}`) : false;

  // Subscribe to Firestore game doc
  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeGame(gameId, (g) => {
      setGame(g);
      setLoading(false);
      if (!g) { setError("Không tìm thấy trò chơi"); return; }
      if (g.players[playerId]) {
        setJoined(true);
        setMyColor(g.players[playerId].color);
      }
    });
    return unsub;
  }, [gameId, playerId]);

  // Countdown timer derived from Firestore startAt
  useEffect(() => {
    if (game?.status !== "active" || !game.startAt) return;
    const startMs = (game.startAt as any).toMillis?.() ?? Date.now();

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startMs) / 1000;
      const left = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(Math.ceil(left));
      if (left <= 0) {
        clearInterval(timerRef.current!);
        if (isCreator) endGame(gameId!);
      }
    }, 250);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [game?.status, game?.startAt, isCreator, gameId]);

  const handleJoin = useCallback(async () => {
    if (!gameId || !nameInput.trim()) return;
    localStorage.setItem("wsPlayerName", nameInput.trim());
    const res = await joinGame(gameId, playerId, nameInput.trim());
    if ("error" in res) { setError(res.error); return; }
    setJoined(true);
    setMyColor(res.color);
  }, [gameId, playerId, nameInput]);

  const handleWordFound = useCallback(
    async (wordKey: string, positions: [number, number][]) => {
      if (!gameId || !game) return;
      const myName = game.players[playerId]?.name ?? nameInput;
      await submitFoundWord(gameId, wordKey, playerId, myName, myColor, positions);
    },
    [gameId, game, playerId, nameInput, myColor]
  );

  const handleStart = useCallback(async () => {
    if (!gameId) return;
    await startGame(gameId);
  }, [gameId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ── Loading / error ──────────────────────────────────────────
  if (loading) return <div className="ws-shell"><div className="ws-center muted">Đang tải...</div></div>;
  if (error) return <div className="ws-shell"><div className="feedback feedback-bad">{error}</div></div>;
  if (!game) return null;

  const playerCount = Object.keys(game.players).length;
  const placedCount = game.placements.length;
  const foundCount = Object.keys(game.found).length;

  // ── Join screen ──────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="ws-shell ws-center-col">
        <div className="ws-join-card">
          <h2>Tham gia Tìm từ</h2>
          <p className="muted">
            {playerCount} / {game.maxPlayers} người đã vào
          </p>
          <input
            className="ws-name-input"
            placeholder="Nhập tên của bạn"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            autoFocus
          />
          <button
            className="btn btn-primary"
            disabled={!nameInput.trim()}
            onClick={handleJoin}
          >
            Tham gia →
          </button>
        </div>
      </div>
    );
  }

  // ── Lobby ────────────────────────────────────────────────────
  if (game.status === "lobby") {
    return (
      <div className="ws-shell ws-center-col">
        <div className="ws-lobby-card">
          <h2>Phòng chờ</h2>
          <div className="ws-player-chips">
            {Object.values(game.players).map((p) => (
              <div
                key={p.name}
                className="ws-player-chip"
                style={{ background: p.color + "22", borderColor: p.color, color: p.color }}
              >
                {p.name}
              </div>
            ))}
            {playerCount === 0 && <span className="muted">Chưa có ai vào...</span>}
          </div>

          <div className="ws-link-row">
            <span className="muted ws-link-hint">Link cho học viên:</span>
            <button className="btn btn-ghost btn-sm" onClick={copyLink}>
              {copied ? "Đã copy ✓" : "Copy link"}
            </button>
          </div>

          {isCreator ? (
            <button
              className="btn btn-primary"
              disabled={playerCount === 0}
              onClick={handleStart}
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

  // ── Active / ended game ──────────────────────────────────────
  const isActive = game.status === "active";
  const urgent = isActive && timeLeft <= 10;

  return (
    <div className="ws-shell ws-game">
      {/* Top bar */}
      <div className="ws-topbar">
        <div className={`ws-timer ${urgent ? "ws-timer--urgent" : ""}`}>
          {isActive ? `${timeLeft}s` : "Hết giờ"}
        </div>
        <div className="ws-score-pill">
          {foundCount} / {placedCount} từ tìm được
        </div>
        <div className="ws-players-row">
          {Object.entries(game.players).map(([uid, p]) => {
            const pFound = Object.values(game.found).filter((f) => f.by === uid).length;
            return (
              <span key={uid} className="ws-pbadge" style={{ borderColor: p.color }}>
                <span className="ws-pdot" style={{ background: p.color }} />
                {p.name}&nbsp;<strong>{pFound}</strong>
              </span>
            );
          })}
        </div>
      </div>

      {/* Main area: board + word list */}
      <div className="ws-main">
        <WordSearchBoard
          grid={game.board}
          found={game.found}
          wordList={game.wordList}
          placements={game.placements}
          onWordFound={handleWordFound}
          active={isActive}
        />

        <div className="ws-word-list">
          <div className="ws-wl-title">
            Từ cần tìm <span className="muted">({game.wordList.length} từ)</span>
          </div>
          {game.wordList.map((word, i) => {
            const fi = game.found[word.char];
            const isPlaced = game.placements.some((p) => p.wordIndex === i);
            return (
              <div
                key={word.char}
                className={`ws-word-item ${fi ? "ws-word-item--found" : ""} ${!isPlaced && game.status === "ended" ? "ws-word-item--notfound" : ""}`}
                style={fi ? { borderLeftColor: fi.color, background: fi.color + "18" } : undefined}
              >
                <span className="ws-wi-char">{word.char}</span>
                <span className="ws-wi-pinyin">{word.pinyin}</span>
                {fi && (
                  <span className="ws-wi-finder" style={{ color: fi.color }}>
                    ✓ {fi.name}
                  </span>
                )}
                {!fi && game.status === "ended" && !isPlaced && (
                  <span className="ws-wi-decoy muted">không có trong bảng</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Teacher: manual end game */}
      {isCreator && isActive && (
        <div className="ws-teacher-controls">
          <button className="btn btn-ghost btn-sm" onClick={() => endGame(gameId!)}>
            Kết thúc sớm
          </button>
        </div>
      )}
    </div>
  );
}
