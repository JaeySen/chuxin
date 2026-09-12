import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { COURSES, type CourseId } from "@sotam/shared";
import { Shell } from "../components/Shell";
import {
  apiFetch, adminFetch, buildTryQuizUrl,
  type GvSubmission, type GvMaterial, type SavedQuiz, type ParsedQuiz,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";

type CourseTab = "all" | CourseId;

const HOLD_TO_DRAG_MS = 2000;

// Six-dot grip icon for the drag handle (replaces the old "⠿" braille glyph).
function DragHandleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <circle cx="4" cy="3" r="1.3" /><circle cx="10" cy="3" r="1.3" />
      <circle cx="4" cy="7" r="1.3" /><circle cx="10" cy="7" r="1.3" />
      <circle cx="4" cy="11" r="1.3" /><circle cx="10" cy="11" r="1.3" />
    </svg>
  );
}

// Upload → parse (server-side PDF/DOCX → questions) → review → save quiz exercises,
// then browse/try/delete existing ones. Mirrors the teacher app's Quiz Import flow
// but scoped to giaovu's own auth headers via adminFetch. Courses are shown as
// browser-style tabs (default "Tất cả khoá học"); uploading opens a modal so the
// list stays uncluttered, and per-course ordering can be dragged to sort.
function QuizExercisesCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<CourseTab>("all");
  const [view, setView]           = useState<"list" | "grid">("list");
  const [quizzes, setQuizzes]     = useState<SavedQuiz[]>([]);
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState<string | null>(null);

  // Upload modal
  const [showUpload, setShowUpload]         = useState(false);
  const [uploadCourseId, setUploadCourseId] = useState<CourseId>(COURSES[0]?.id ?? "han1");
  const [dragging, setDragging]   = useState(false);
  const [parsing, setParsing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [preview, setPreview]     = useState<ParsedQuiz | null>(null);
  const [customTitle, setCustomTitle] = useState("");

  // Inline rename
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editTitle, setEditTitle]     = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);

  // Drag-to-reorder (per-course only — server ordering is scoped to a course).
  // The handle requires a 2s press-and-hold before it "arms" (becomes draggable),
  // so an accidental tap/click on the handle never yanks a row out of place.
  const [dragId, setDragId]         = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reorderErr, setReorderErr] = useState<string | null>(null);
  const [armedId, setArmedId]       = useState<string | null>(null);
  const [holdingId, setHoldingId]   = useState<string | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canReorder = activeTab !== "all";

  function clearHoldTimer() {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  }
  function startHold(id: string) {
    if (!canReorder) return;
    setHoldingId(id);
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => { setArmedId(id); setHoldingId(null); }, HOLD_TO_DRAG_MS);
  }
  function cancelHold() {
    clearHoldTimer();
    setHoldingId(null);
  }
  function disarm() {
    clearHoldTimer();
    setHoldingId(null);
    setArmedId(null);
  }

  // Delete confirmation (custom modal — no browser confirm())
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const deleteTarget = deleteId ? quizzes.find((q) => q.id === deleteId) ?? null : null;

  // Row action menu (mobile kebab dropdown)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  async function loadQuizzes(tab: CourseTab) {
    setLoading(true); setErr(null);
    try {
      const qs = tab === "all" ? "" : `?courseId=${encodeURIComponent(tab)}`;
      setQuizzes(await adminFetch<SavedQuiz[]>(`/admin/quiz${qs}`));
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadQuizzes(activeTab); }, [activeTab]);

  function openUpload() {
    setUploadCourseId(activeTab === "all" ? (COURSES[0]?.id ?? "han1") : activeTab);
    setUploadErr(null); setPreview(null); setCustomTitle(""); setDragging(false);
    setShowUpload(true);
  }

  function closeUpload() {
    if (parsing || saving) return;
    setShowUpload(false); setPreview(null); setCustomTitle(""); setUploadErr(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadErr(null); setPreview(null); setCustomTitle("");
    setParsing(true);
    const form = new FormData();
    form.append("file", file);
    adminFetch<ParsedQuiz>("/admin/quiz/parse", { method: "POST", body: form })
      .then(setPreview)
      .catch((e: unknown) => setUploadErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setParsing(false));
  }

  async function save() {
    if (!preview) return;
    setSaving(true); setUploadErr(null);
    try {
      await adminFetch("/admin/quiz/save", {
        method: "POST",
        body: JSON.stringify({ quiz: preview, courseId: uploadCourseId, customTitle: customTitle.trim() || undefined }),
      });
      setShowUpload(false); setPreview(null); setCustomTitle("");
      if (inputRef.current) inputRef.current.value = "";
      setActiveTab(uploadCourseId); // jump to the course the new quiz landed in
      await loadQuizzes(uploadCourseId);
    } catch (e: unknown) { setUploadErr(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  }

  useEffect(() => {
    if (editingId) setTimeout(() => editRef.current?.focus(), 50);
  }, [editingId]);

  function startEdit(q: SavedQuiz) {
    setEditingId(q.id); setEditTitle(q.title);
  }

  async function saveTitle(id: string) {
    if (!editTitle.trim()) return;
    setSavingTitle(true);
    try {
      const { title } = await adminFetch<{ id: string; title: string }>(`/admin/quiz/${id}/title`, {
        method: "PATCH",
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      setQuizzes((qs) => qs.map((q) => q.id === id ? { ...q, title } : q));
      setEditingId(null);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSavingTitle(false); }
  }

  function remove(id: string) { setDeleteId(id); setDeleteErr(null); }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true); setDeleteErr(null);
    try {
      await adminFetch(`/admin/quiz/${deleteId}`, { method: "DELETE" });
      setQuizzes((qs) => qs.filter((q) => q.id !== deleteId));
      setDeleteId(null);
    } catch (e: unknown) { setDeleteErr(e instanceof Error ? e.message : String(e)); }
    finally { setDeleting(false); }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    if (armedId !== id) { e.preventDefault(); return; }
    setDragId(id); setReorderErr(null);
  }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== dragOverId) setDragOverId(id);
  }
  function handleDrop(targetId: string) {
    disarm();
    if (!canReorder || !dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const fromIdx = quizzes.findIndex((q) => q.id === dragId);
    const toIdx = quizzes.findIndex((q) => q.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDragId(null); setDragOverId(null); return; }
    const next = [...quizzes];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setQuizzes(next);
    setDragId(null); setDragOverId(null);
    adminFetch("/admin/quiz/reorder", {
      method: "POST",
      body: JSON.stringify({ courseId: activeTab, quizIds: next.map((q) => q.id) }),
    }).catch(() => setReorderErr("Không lưu được thứ tự mới. Vui lòng thử lại."));
  }
  function handleDragEnd() { setDragId(null); setDragOverId(null); disarm(); }

  const courseTitle = (cid: string | null) => COURSES.find((c) => c.id === cid)?.title ?? cid ?? "—";

  const rowCls = (id: string) =>
    dragId === id ? "gv-row--dragging" : dragOverId === id && dragId !== id ? "gv-row--dragover" : undefined;

  return (
    <div className="gv-card" style={{ marginTop: 16 }}>
      <div className="gv-card-title">Bài tập trắc nghiệm (quiz)</div>

      {/* Course tabs — browser-tab style; "Tất cả khoá học" is the default */}
      <div className="gv-course-tabs">
        <button
          className={`gv-course-tab${activeTab === "all" ? " gv-course-tab--active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          Tất cả khoá học
        </button>
        {COURSES.map((c) => (
          <button key={c.id}
            className={`gv-course-tab${activeTab === c.id ? " gv-course-tab--active" : ""}`}
            onClick={() => setActiveTab(c.id)}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="gv-toolbar">
        <div className="gv-view-toggle">
          <button type="button" title="Xem dạng danh sách"
            className={`gv-view-btn${view === "list" ? " gv-view-btn--active" : ""}`}
            onClick={() => setView("list")}>☰</button>
          <button type="button" title="Xem dạng lưới"
            className={`gv-view-btn${view === "grid" ? " gv-view-btn--active" : ""}`}
            onClick={() => setView("grid")}>▦</button>
        </div>
        <button className="btn btn-sm btn-primary" onClick={openUpload}>+ Tải lên bài tập</button>
      </div>

      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}
      {reorderErr && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{reorderErr}</div>}

      {loading ? (
        <div className="muted" style={{ fontSize: 14 }}>Đang tải…</div>
      ) : quizzes.length === 0 ? (
        <div className="feedback feedback-info">
          Chưa có bài tập nào{activeTab !== "all" ? ` cho ${courseTitle(activeTab)}` : ""}.
          Bấm <strong>+ Tải lên bài tập</strong> để thêm từ PDF/DOCX.
        </div>
      ) : view === "list" ? (
        <div className="gv-table-wrap">
          <table className="gv-table">
            <thead>
              <tr>
                {canReorder && <th></th>}
                <th>Tiêu đề</th>
                {activeTab === "all" && <th>Khoá học</th>}
                <th>Số câu</th><th>Người tạo</th><th>Ngày tạo</th><th></th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id} className={rowCls(q.id)}
                  draggable={armedId === q.id}
                  onDragStart={(e) => handleDragStart(e, q.id)}
                  onDragOver={(e) => handleDragOver(e, q.id)}
                  onDrop={() => handleDrop(q.id)}
                  onDragEnd={handleDragEnd}
                >
                  {canReorder && (
                    <td style={{ width: 24 }}>
                      <span
                        className={`cp-quiz-drag${holdingId === q.id ? " cp-quiz-drag--holding" : ""}${armedId === q.id ? " cp-quiz-drag--armed" : ""}`}
                        title="Giữ 2 giây để kéo sắp xếp lại"
                        onPointerDown={() => startHold(q.id)}
                        onPointerUp={cancelHold}
                        onPointerLeave={cancelHold}
                        onPointerCancel={cancelHold}
                      >
                        <DragHandleIcon />
                      </span>
                    </td>
                  )}
                  <td style={{ fontWeight: 600 }}>
                    {editingId === q.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          ref={editRef}
                          className="gv-field"
                          style={{ padding: "4px 8px", fontSize: 13 }}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveTitle(q.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <button className="btn btn-sm btn-primary" onClick={() => saveTitle(q.id)} disabled={savingTitle}>
                          {savingTitle ? "…" : "Lưu"}
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>Hủy</button>
                      </div>
                    ) : (
                      <span onClick={() => startEdit(q)} className="gv-title-edit" title="Bấm để đổi tên">
                        {q.title}
                      </span>
                    )}
                  </td>
                  {activeTab === "all" && <td className="muted">{courseTitle(q.course_id)}</td>}
                  <td className="muted">{q.total} ({q.mcq} TN, {q.open} TL)</td>
                  <td className="muted">{q.created_by_name ?? "—"}</td>
                  <td className="muted">{new Date(q.created_at).toLocaleDateString("vi-VN")}</td>
                  <td className="gv-row-actions-cell">
                    <div className="gv-row-actions">
                      <a className="btn btn-sm btn-secondary" href={buildTryQuizUrl(q.id)} target="_blank" rel="noreferrer">
                        Thử làm
                      </a>
                      <button className="btn btn-sm btn-ghost" onClick={() => startEdit(q)}>Đổi tên</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(q.id)}>Xoá</button>
                    </div>
                    <div className="gv-row-menu">
                      <button
                        type="button"
                        className="gv-row-menu-btn"
                        aria-label="Thao tác"
                        aria-expanded={menuOpenId === q.id}
                        onClick={() => setMenuOpenId((cur) => (cur === q.id ? null : q.id))}
                      >
                        ⋮
                      </button>
                      {menuOpenId === q.id && (
                        <>
                          <div className="gv-row-menu-overlay" onClick={() => setMenuOpenId(null)} />
                          <div className="gv-row-menu-dropdown" role="menu">
                            <a
                              className="gv-row-menu-item"
                              href={buildTryQuizUrl(q.id)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setMenuOpenId(null)}
                            >
                              Thử làm
                            </a>
                            <button
                              type="button"
                              className="gv-row-menu-item"
                              onClick={() => { setMenuOpenId(null); startEdit(q); }}
                            >
                              Đổi tên
                            </button>
                            <button
                              type="button"
                              className="gv-row-menu-item gv-row-menu-item-danger"
                              onClick={() => { setMenuOpenId(null); remove(q.id); }}
                            >
                              Xoá
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cp-quiz-grid">
          {quizzes.map((q) => (
            <div key={q.id}
              className={`cp-quiz-card${dragId === q.id ? " cp-quiz-card--dragging" : ""}${dragOverId === q.id && dragId !== q.id ? " cp-quiz-card--dragover" : ""}`}
              draggable={armedId === q.id}
              onDragStart={(e) => handleDragStart(e, q.id)}
              onDragOver={(e) => handleDragOver(e, q.id)}
              onDrop={() => handleDrop(q.id)}
              onDragEnd={handleDragEnd}
            >
              {canReorder && (
                <span
                  className={`cp-quiz-drag${holdingId === q.id ? " cp-quiz-drag--holding" : ""}${armedId === q.id ? " cp-quiz-drag--armed" : ""}`}
                  title="Giữ 2 giây để kéo sắp xếp lại"
                  onPointerDown={() => startHold(q.id)}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onPointerCancel={cancelHold}
                >
                  <DragHandleIcon />
                </span>
              )}
              <div className="cp-quiz-body">
                {editingId === q.id ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={editRef}
                      className="gv-field"
                      style={{ padding: "4px 8px", fontSize: 13 }}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTitle(q.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button className="btn btn-sm btn-primary" onClick={() => saveTitle(q.id)} disabled={savingTitle}>
                      {savingTitle ? "…" : "Lưu"}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>Hủy</button>
                  </div>
                ) : (
                  <div className="cp-quiz-title gv-title-edit" onClick={() => startEdit(q)} title="Bấm để đổi tên">
                    {q.title}
                  </div>
                )}
                <div className="cp-quiz-meta">
                  {activeTab === "all" && <span>{courseTitle(q.course_id)}</span>}
                  {q.mcq > 0 && <span>{q.mcq} trắc nghiệm</span>}
                  {q.open > 0 && <span>{q.open} tự luận</span>}
                  {q.created_by_name && <span>{q.created_by_name}</span>}
                  <span>{new Date(q.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                {q.source && <div className="cp-quiz-source">{q.source}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <a className="btn btn-sm btn-secondary" href={buildTryQuizUrl(q.id)} target="_blank" rel="noreferrer">Thử làm</a>
                <button className="btn btn-sm btn-danger" onClick={() => remove(q.id)}>Xoá</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="ru-overlay" onClick={closeUpload}>
          <div className="ru-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ru-header">
              <div>
                <div className="ru-title">Tải lên bài tập</div>
                <div className="ru-subtitle">Tải PDF/DOCX, hệ thống tự nhận diện câu hỏi để bạn xem lại trước khi lưu.</div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={closeUpload}>✕</button>
            </div>

            <div style={{ padding: "16px 20px 0" }}>
              <div className="gv-field" style={{ maxWidth: 280 }}>
                <label>Khoá học</label>
                <select value={uploadCourseId} onChange={(e) => setUploadCourseId(e.target.value as CourseId)}>
                  {COURSES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>

            {uploadErr && <div className="feedback feedback-bad" style={{ margin: "12px 20px 0" }}>{uploadErr}</div>}

            {!preview && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                className={`ru-dropzone${dragging ? " ru-dropzone--active" : ""}`}
              >
                <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: "none" }}
                  onChange={(e) => handleFiles(e.target.files)} />
                {parsing
                  ? <div className="ru-loading">Đang xử lý…</div>
                  : <>
                      <span className="ru-drop-label">Kéo thả hoặc bấm để tải lên file PDF / DOCX</span>
                      <span className="ru-drop-hint">Hỗ trợ .pdf, .docx</span>
                    </>
                }
              </div>
            )}

            {preview && (
              <div style={{ padding: "16px 20px 20px" }}>
                <div className="gv-field" style={{ marginBottom: 10 }}>
                  <label>Tên bài tập</label>
                  <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={preview.title} />
                </div>
                <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                  {preview.meta.total} câu ({preview.meta.mcq} trắc nghiệm, {preview.meta.open} tự luận)
                  {preview.meta.missing_answers > 0 && <span style={{ color: "var(--c-red-dark)" }}> · {preview.meta.missing_answers} câu thiếu đáp án</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-sm btn-primary" disabled={saving} onClick={save}>
                    {saving ? "Đang lưu…" : "Lưu bài tập"}
                  </button>
                  <button className="btn btn-sm btn-ghost" disabled={saving}
                    onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ""; }}>
                    Chọn file khác
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteId && (
        <div className="ru-overlay" onClick={() => !deleting && setDeleteId(null)}>
          <div className="ru-modal gv-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ru-header">
              <div>
                <div className="ru-title">Xoá bài tập?</div>
                <div className="ru-subtitle">
                  {deleteTarget ? <>"{deleteTarget.title}" sẽ được chuyển vào thùng rác — có thể khôi phục trong 2 tuần.</>
                    : "Bài tập sẽ được chuyển vào thùng rác — có thể khôi phục trong 2 tuần."}
                </div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => setDeleteId(null)} disabled={deleting}>✕</button>
            </div>
            {deleteErr && <div className="feedback feedback-bad" style={{ margin: "12px 20px 0" }}>{deleteErr}</div>}
            <div style={{ display: "flex", gap: 8, padding: "16px 20px 20px", justifyContent: "flex-end" }}>
              <button className="btn btn-sm btn-ghost" disabled={deleting} onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="btn btn-sm btn-danger" disabled={deleting} onClick={confirmDelete}>
                {deleting ? "Đang xoá…" : "Xoá bài tập"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Used when navigated to /homework/:materialId
export function HomeworkDetailPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const { user } = useAuth();
  const [material, setMaterial]       = useState<GvMaterial | null>(null);
  const [submissions, setSubmissions] = useState<GvSubmission[]>([]);
  const [err, setErr]                 = useState<string | null>(null);
  const [saving, setSaving]           = useState<string | null>(null);
  const [scoreInput, setScoreInput]   = useState<Record<string, string>>({});
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});

  const canReview = user?.role === "assistant" || user?.role === "teacher" || user?.role === "admin";

  async function load() {
    if (!materialId) return;
    try {
      setErr(null);
      const subs = await apiFetch<GvSubmission[]>(`/materials/${materialId}/submissions`);
      setSubmissions(subs);
      const init: Record<string, string> = {};
      subs.forEach((s) => {
        init[s.id] = s.score != null ? String(s.score) : "";
        setFeedbackInput((prev) => ({ ...prev, [s.id]: s.feedback ?? "" }));
      });
      setScoreInput(init);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  useEffect(() => { load(); }, [materialId]);

  async function review(subId: string, status: "reviewed" | "needs_revision") {
    setSaving(subId);
    try {
      const score = parseFloat(scoreInput[subId] ?? "");
      await apiFetch(`/submissions/${subId}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          score: isNaN(score) ? undefined : score,
          feedback: feedbackInput[subId] || undefined,
        }),
      });
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(null); }
  }

  const pending   = submissions.filter((s) => s.status === "submitted");
  const reviewed  = submissions.filter((s) => s.status !== "submitted");

  const statusBadge = (s: GvSubmission["status"]) => (
    <span className={`gv-badge gv-badge-${s}`}>
      {s === "submitted" ? "Chờ chấm" : s === "reviewed" ? "Đã chấm" : "Cần sửa"}
    </span>
  );

  return (
    <Shell title="Chấm bài tập">
      <div className="gv-page-header">
        <div>
          <Link to="/homework" className="muted" style={{ fontSize: 13, textDecoration: "none" }}>← Danh sách bài tập</Link>
          <h1 style={{ marginTop: 4 }}>{material?.title ?? "Chấm bài tập"}</h1>
        </div>
      </div>

      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}

      {/* Pending */}
      <div className="gv-card">
        <div className="gv-card-title">Chờ chấm ({pending.length})</div>
        {pending.length === 0
          ? <div className="muted" style={{ fontSize: 14 }}>Không có bài nào chờ chấm.</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pending.map((s) => (
                <div key={s.id} style={{ background: "#fffbf0", border: "1px solid var(--c-border)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <div>
                      <strong>{s.student_name}</strong>
                      <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>{s.student_email}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {statusBadge(s.status)}
                      <span className="muted" style={{ fontSize: 12 }}>
                        {new Date(s.submitted_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {s.google_url && (
                    <a href={s.google_url} target="_blank" rel="noreferrer"
                      className="btn btn-sm btn-secondary" style={{ marginBottom: 10 }}>
                      📄 Xem bài nộp
                    </a>
                  )}
                  {s.note && <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>"{s.note}"</div>}

                  {canReview && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <div className="gv-field" style={{ minWidth: 80 }}>
                        <label>Điểm (0–100)</label>
                        <input type="number" min={0} max={100}
                          value={scoreInput[s.id] ?? ""}
                          onChange={(e) => setScoreInput((p) => ({ ...p, [s.id]: e.target.value }))}
                          style={{ width: 80, padding: "6px 10px", border: "1.5px solid var(--c-divider)", borderRadius: 8, fontSize: 14 }}
                        />
                      </div>
                      <div className="gv-field" style={{ flex: 1, minWidth: 200 }}>
                        <label>Nhận xét</label>
                        <input
                          value={feedbackInput[s.id] ?? ""}
                          onChange={(e) => setFeedbackInput((p) => ({ ...p, [s.id]: e.target.value }))}
                          placeholder="Nhận xét cho học viên…"
                          style={{ padding: "6px 10px", border: "1.5px solid var(--c-divider)", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}
                        />
                      </div>
                      <button className="btn btn-sm btn-primary" disabled={saving === s.id}
                        onClick={() => review(s.id, "reviewed")}>
                        {saving === s.id ? "Đang lưu…" : "✓ Đã chấm"}
                      </button>
                      <button className="btn btn-sm btn-danger" disabled={saving === s.id}
                        onClick={() => review(s.id, "needs_revision")}>
                        Cần sửa
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
        }
      </div>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div className="gv-card" style={{ marginTop: 16 }}>
          <div className="gv-card-title">Đã chấm ({reviewed.length})</div>
          <div className="gv-table-wrap">
            <table className="gv-table">
              <thead><tr>
                <th>Học viên</th><th>Trạng thái</th><th>Điểm</th><th>Nhận xét</th><th>Người chấm</th>
              </tr></thead>
              <tbody>
                {reviewed.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.student_name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{s.student_email}</div>
                    </td>
                    <td>{statusBadge(s.status)}</td>
                    <td>{s.score != null ? s.score : "—"}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{s.feedback ?? "—"}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{s.reviewer_name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
}

// /homework list — shows all homework materials across classes accessible to user
export function HomeworkListPage() {
  const [items, setItems] = useState<(GvMaterial & { class_name?: string })[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ id: string; name: string }[]>("/classes").then(async (classes) => {
      const all: (GvMaterial & { class_name?: string })[] = [];
      await Promise.all(classes.map(async (c) => {
        const mats = await apiFetch<GvMaterial[]>(`/classes/${c.id}/materials`);
        mats.filter((m) => m.type === "homework").forEach((m) => {
          all.push({ ...m, class_name: c.name });
        });
      }));
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(all);
    }).catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <Shell title="Bài tập">
      <div className="gv-page-header"><h1>Bài tập</h1></div>
      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}
      {items.length > 0 && (
        <div className="gv-card">
          <div className="gv-table-wrap">
            <table className="gv-table">
              <thead><tr><th>Tiêu đề</th><th>Lớp</th><th>Hạn nộp</th><th>Ngày tạo</th><th>Người tạo</th><th></th></tr></thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>
                      {m.google_url
                        ? <a href={m.google_url} target="_blank" rel="noreferrer" style={{ color: "var(--c-red-dark)" }}>{m.title}</a>
                        : m.title}
                    </td>
                    <td className="muted">{m.class_name ?? "—"}</td>
                    <td>{m.due_date ? new Date(m.due_date).toLocaleString("vi-VN") : <span className="muted">—</span>}</td>
                    <td className="muted">
                      {new Date(m.created_at).toLocaleDateString("vi-VN")}{" "}
                      {new Date(m.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="muted">{m.created_by_name ?? "—"}</td>
                    <td><Link to={`/homework/${m.id}`} className="btn btn-sm btn-secondary">Chấm bài</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QuizExercisesCard />
    </Shell>
  );
}
