import { useEffect, useRef, useState } from "react";

export function useTimer() {
  const [sec, setSec] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    const i = setInterval(() => setSec(Math.floor((Date.now() - start.current) / 1000)), 500);
    return () => clearInterval(i);
  }, []);
  return {
    sec,
    label: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`,
    elapsed: () => Math.floor((Date.now() - start.current) / 1000),
  };
}

export function ScoreStrip({
  idx,
  total,
  correct,
  wrong,
  timeLabel,
}: {
  idx: number;
  total: number;
  correct: number;
  wrong: number;
  timeLabel: string;
}) {
  return (
    <div className="score-strip">
      <span className="pill">{idx} / {total}</span>
      <span className="pill pill-correct">✓ {correct}</span>
      <span className="pill pill-wrong">✗ {wrong}</span>
      <span className="pill pill-warm">⏱ {timeLabel}</span>
    </div>
  );
}

export function Summary({
  score,
  total,
  durationSec,
  onRetry,
}: {
  score: number;
  total: number;
  durationSec: number;
  onRetry: () => void;
}) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  return (
    <div className="summary-card">
      <h2>Hoàn thành! 🎉</h2>
      <div className="summary-score">{score} / {total}</div>
      <div className="muted">
        Điểm: {pct}% · Thời gian: {Math.floor(durationSec / 60)}m {durationSec % 60}s
      </div>
      <div className="row gap" style={{ justifyContent: "center", marginTop: 24 }}>
        <button className="btn btn-primary" onClick={onRetry}>Làm lại</button>
        <a className="btn btn-ghost" href="/">Về trang chính</a>
      </div>
    </div>
  );
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AudioButton({ url, label = "▶︎ Nghe" }: { url: string; label?: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  return (
    <>
      <audio ref={ref} src={url} preload="auto" />
      <button
        className="btn btn-audio"
        onClick={() => {
          if (!ref.current) return;
          ref.current.currentTime = 0;
          ref.current.play().catch(() => {});
        }}
      >
        {label}
      </button>
    </>
  );
}
