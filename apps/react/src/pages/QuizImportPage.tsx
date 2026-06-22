import { useRef, useState } from "react";
import { getStoredJwt, getStoredSessionToken } from "../lib/api";
import { COURSES } from "@sotam/shared";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

interface QuizOption { A?: string; B?: string; C?: string; D?: string; }

interface QuizQuestion {
  num: number;
  text: string;
  type: "mcq" | "open";
  options: QuizOption;
  answer: string | null;
}

interface ParsedQuiz {
  title: string;
  slug: string;
  source: string;
  questions: QuizQuestion[];
  meta: { total: number; mcq: number; open: number; missing_answers: number };
}

// ── Quiz player (student POV) ──────────────────────────────────────────────────

function QuizPlayer({ quiz, onClose }: { quiz: ParsedQuiz; onClose: () => void }) {
  const mcq = quiz.questions.filter((q) => q.type === "mcq");
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  const q = mcq[idx];
  const picked = q ? picks[q.num] : undefined;
  const correct = q?.answer ?? null;

  function pick(letter: string) {
    if (picks[q.num]) return; // already answered
    setPicks((p) => ({ ...p, [q.num]: letter }));
  }

  function next() {
    if (idx + 1 < mcq.length) setIdx((i) => i + 1);
    else setDone(true);
  }

  const score = mcq.filter((q) => picks[q.num] === q.answer).length;

  if (mcq.length === 0) {
    return (
      <div className="qp-shell">
        <div className="qp-empty">Bài này không có câu trắc nghiệm.</div>
        <button className="btn btn-ghost" onClick={onClose}>← Quay lại</button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / mcq.length) * 100);
    return (
      <div className="qp-shell">
        <div className="qp-result">
          <div className="qp-score">{score} / {mcq.length}</div>
          <div className="qp-pct">{pct}%</div>
          <div className="qp-result-label">
            {pct >= 80 ? "Xuất sắc! 🎉" : pct >= 60 ? "Khá tốt! 👍" : "Cần ôn luyện thêm 💪"}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => { setPicks({}); setIdx(0); setDone(false); }}>
              Làm lại
            </button>
            <button className="btn btn-ghost" onClick={onClose}>← Quay lại</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qp-shell">
      <div className="qp-top">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>← Quay lại</button>
        <span className="qp-progress">{idx + 1} / {mcq.length}</span>
      </div>

      <div className="qp-bar-track">
        <div className="qp-bar-fill" style={{ width: `${((idx) / mcq.length) * 100}%` }} />
      </div>

      <div className="qp-card">
        <div className="qp-num">Câu {q.num}</div>
        <div className="qp-text">{q.text}</div>

        <div className="qp-options">
          {(["A", "B", "C", "D"] as const).map((letter) => {
            const text = q.options[letter];
            if (!text) return null;
            const isCorrect = letter === correct;
            const isPicked = letter === picked;
            let cls = "qp-opt";
            if (picked) {
              if (isPicked && isCorrect) cls += " qp-opt--correct";
              else if (isPicked && !isCorrect) cls += " qp-opt--wrong";
              else if (isCorrect) cls += " qp-opt--reveal";
            }
            return (
              <button key={letter} className={cls} onClick={() => pick(letter)} disabled={!!picked}>
                <span className="qp-opt-letter">{letter}</span>
                <span className="qp-opt-text">{text}</span>
              </button>
            );
          })}
        </div>

        {picked && (
          <div className={`qp-feedback ${picked === correct ? "qp-feedback--correct" : "qp-feedback--wrong"}`}>
            {picked === correct ? "✓ Chính xác!" : `✗ Đáp án đúng: ${correct}`}
          </div>
        )}
      </div>

      {picked && (
        <button className="btn btn-primary qp-next" onClick={next}>
          {idx + 1 < mcq.length ? "Câu tiếp →" : "Xem kết quả"}
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function QuizImportPage({ standalone = true, courseId: propCourseId }: { standalone?: boolean; courseId?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [result, setResult]           = useState<ParsedQuiz | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [courseId, setCourseId]       = useState(propCourseId ?? COURSES[0]?.id ?? "");
  const [shared, setShared]           = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState<{ slug: string; title: string } | null>(null);
  const [playing, setPlaying]         = useState(false);

  async function upload(file: File) {
    setLoading(true); setError(null); setResult(null); setSaved(null); setCustomTitle(""); setShared(false);
    try {
      const form = new FormData();
      form.append("file", file);
      const jwt = getStoredJwt();
      const sessionToken = getStoredSessionToken();
      const res = await fetch(`${API}/admin/quiz/parse`, {
        method: "POST", body: form, credentials: "include",
        headers: {
          ...(jwt && { Authorization: `Bearer ${jwt}` }),
          ...(sessionToken && { "X-Session-Token": sessionToken }),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
    finally { setLoading(false); }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    upload(files[0]);
  }

  async function save() {
    if (!result) return;
    setSaving(true); setError(null);
    try {
      const jwt = getStoredJwt();
      const sessionToken = getStoredSessionToken();
      const res = await fetch(`${API}/admin/quiz/save`, {
        method: "POST", credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(jwt && { Authorization: `Bearer ${jwt}` }),
          ...(sessionToken && { "X-Session-Token": sessionToken }),
        },
        body: JSON.stringify({ quiz: result, courseId, customTitle: customTitle.trim() || undefined, shared }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSaved({ slug: data.slug, title: data.title });
    } catch (e) { setError(e instanceof Error ? e.message : "Lưu thất bại"); }
    finally { setSaving(false); }
  }

  function downloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${result.slug}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (playing && result) {
    return <QuizPlayer quiz={result} onClose={() => setPlaying(false)} />;
  }

  const displayTitle = customTitle.trim() || result?.title || "";

  return (
    <div className={standalone ? "qi-shell" : "qi-embedded"}>
      {standalone && (
        <>
          <h2 className="qi-title">Nhập đề thi · Quiz Import</h2>
          <p className="qi-subtitle">Tải lên file PDF hoặc DOCX để chuyển đổi thành bài tập trắc nghiệm</p>
        </>
      )}

      {/* Drop zone */}
      <div
        className={`qi-dropzone${dragging ? " qi-dropzone--active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)} />
        {loading ? (
          <div className="qi-loading"><span className="qi-spinner" />Đang phân tích file…</div>
        ) : (
          <>
            <div className="qi-dropzone-icon">📄</div>
            <div className="qi-dropzone-label">
              Kéo thả PDF / DOCX vào đây hoặc <span className="qi-link">chọn file</span>
            </div>
            <div className="qi-dropzone-hint">Tối đa 20 MB</div>
          </>
        )}
      </div>

      {error && <div className="qi-error">{error}</div>}

      {result && (
        <div className="qi-result">
          <div className="qi-result-header">
            <div style={{ flex: 1 }}>
              {/* Custom name input */}
              <input
                className="qi-name-input"
                type="text"
                placeholder={result.title}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
              {displayTitle !== result.title && (
                <div className="qi-name-from">Tên gốc: {result.title}</div>
              )}
              <div className="qi-result-meta">
                {result.meta.mcq} trắc nghiệm · {result.meta.open} tự luận
                {result.meta.missing_answers > 0 && (
                  <span className="qi-warn"> · {result.meta.missing_answers} thiếu đáp án</span>
                )}
              </div>

              {/* Course picker */}
              {!propCourseId && (
                <label className="qi-share-label" style={{ marginTop: 8 }}>
                  <span style={{ flexShrink: 0, fontWeight: 600 }}>Khoá học:</span>
                  <select
                    className="adm-select"
                    value={courseId}
                    onChange={(e) => { setCourseId(e.target.value); setSaved(null); }}
                    style={{ flex: 1 }}
                  >
                    <option value="">— Không gán —</option>
                    {COURSES.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </label>
              )}

              {/* Share toggle */}
              <label className="qi-share-label">
                <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
                Chia sẻ với tất cả giáo viên
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPlaying(true)}>
                ▶ Thử làm bài
              </button>
              {saved ? (
                <span className="qi-saved">✓ Đã lưu · {saved.title}</span>
              ) : (
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? "Đang lưu…" : "Lưu bài tập"}
                </button>
              )}
              <button className="btn btn-ghost" onClick={downloadJson}>JSON</button>
            </div>
          </div>

          <div className="qi-questions">
            {result.questions.map((q) => (
              <div key={q.num} className={`qi-q${q.type === "open" ? " qi-q--open" : ""}`}>
                <div className="qi-q-header">
                  <span className="qi-q-num">Câu {q.num}</span>
                  <span className={`qi-q-badge qi-q-badge--${q.type}`}>
                    {q.type === "mcq" ? "Trắc nghiệm" : "Tự luận"}
                  </span>
                </div>
                <div className="qi-q-text">{q.text}</div>
                {q.type === "mcq" && Object.keys(q.options).length > 0 && (
                  <div className="qi-options">
                    {(["A", "B", "C", "D"] as const).map((letter) => {
                      const text = q.options[letter];
                      if (!text) return null;
                      return (
                        <div key={letter} className={`qi-opt${q.answer === letter ? " qi-opt--correct" : ""}`}>
                          <span className="qi-opt-letter">{letter}</span>
                          <span className="qi-opt-text">{text}</span>
                          {q.answer === letter && <span className="qi-opt-check">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.type === "mcq" && !q.answer && <div className="qi-missing">Chưa có đáp án</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
