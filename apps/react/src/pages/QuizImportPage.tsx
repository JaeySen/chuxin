import { useRef, useState } from "react";

import { getStoredJwt, getStoredSessionToken } from "../lib/api";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

interface QuizOption {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
}

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
  meta: {
    total: number;
    mcq: number;
    open: number;
    missing_answers: number;
  };
}

export function QuizImportPage({ standalone = true, courseId }: { standalone?: boolean; courseId?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedQuiz | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const jwt = getStoredJwt();
      const sessionToken = getStoredSessionToken();
      const res = await fetch(`${API}/admin/quiz/parse`, {
        method: "POST",
        body: form,
        credentials: "include",
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setSaved(null);
    upload(files[0]);
  }

  async function save() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const jwt = getStoredJwt();
      const sessionToken = getStoredSessionToken();
      const res = await fetch(`${API}/admin/quiz/save`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(jwt && { Authorization: `Bearer ${jwt}` }),
          ...(sessionToken && { "X-Session-Token": sessionToken }),
        },
        body: JSON.stringify({ quiz: result, courseId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const { slug } = await res.json();
      setSaved(slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {loading ? (
          <div className="qi-loading">
            <span className="qi-spinner" />
            Đang phân tích file…
          </div>
        ) : (
          <>
            <div className="qi-dropzone-icon">📄</div>
            <div className="qi-dropzone-label">
              Kéo thả file PDF / DOCX vào đây hoặc <span className="qi-link">chọn file</span>
            </div>
            <div className="qi-dropzone-hint">Tối đa 20 MB</div>
          </>
        )}
      </div>

      {error && <div className="qi-error">{error}</div>}

      {result && (
        <div className="qi-result">
          <div className="qi-result-header">
            <div>
              <div className="qi-result-title">{result.title}</div>
              <div className="qi-result-meta">
                {result.meta.mcq} trắc nghiệm · {result.meta.open} tự luận
                {result.meta.missing_answers > 0 && (
                  <span className="qi-warn"> · {result.meta.missing_answers} thiếu đáp án</span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {saved ? (
                <span className="qi-saved">✓ Đã lưu · {saved}</span>
              ) : (
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? "Đang lưu…" : "Lưu bài tập"}
                </button>
              )}
              <button className="btn btn-ghost" onClick={downloadJson}>
                Tải JSON
              </button>
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
                      const isCorrect = q.answer === letter;
                      return (
                        <div key={letter} className={`qi-opt${isCorrect ? " qi-opt--correct" : ""}`}>
                          <span className="qi-opt-letter">{letter}</span>
                          <span className="qi-opt-text">{text}</span>
                          {isCorrect && <span className="qi-opt-check">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.type === "mcq" && !q.answer && (
                  <div className="qi-missing">Chưa có đáp án</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
