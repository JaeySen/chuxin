import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { ApiDocument } from "./DocumentsPage";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN");
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [doc, setDoc] = useState<ApiDocument | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);

  const canManage = role === "teacher" || role === "admin";

  async function load() {
    if (!id) return;
    try {
      setErr(null);
      const d = await apiFetch<ApiDocument>(`/documents/${id}`);
      setDoc(d);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  async function handleRefresh() {
    if (!id) return;
    setBusy(true); setRefreshNote(null);
    try {
      const res = await apiFetch<{ document: ApiDocument; changed: boolean; error: string | null }>(
        `/documents/${id}/refresh`, { method: "POST" });
      setDoc(res.document);
      setRefreshNote(
        res.error
          ? `Lỗi: ${res.error}`
          : res.changed
            ? "✓ Nội dung đã thay đổi — đã cập nhật."
            : "✓ Đã đồng bộ — nội dung không thay đổi.",
      );
    } catch (e: unknown) {
      setRefreshNote(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!id || !doc) return;
    if (!confirm(`Xoá tài liệu "${doc.heading}"?`)) return;
    setBusy(true);
    try {
      await apiFetch(`/documents/${id}`, { method: "DELETE" });
      navigate("/documents");
    } catch (e: unknown) {
      setRefreshNote(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  if (loading) return <div className="container" style={{ padding: 40 }}><span className="muted">Đang tải…</span></div>;
  if (!user) return <div className="container" style={{ padding: 40 }}><div className="feedback feedback-info">Vui lòng đăng nhập.</div></div>;
  if (err) return <div className="container" style={{ padding: 40 }}><div className="feedback feedback-bad">{err}</div></div>;
  if (!doc) return <div className="container" style={{ padding: 40 }}><span className="muted">Đang tải…</span></div>;

  return (
    <div className="container" style={{ padding: "20px 16px 60px" }}>
      <Link to="/documents" className="muted" style={{ textDecoration: "none" }}>← Tài liệu</Link>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 8 }}>{doc.heading}</h1>
      {doc.description && <p className="muted" style={{ fontSize: 16 }}>{doc.description}</p>}

      <div className="doc-meta-row">
        <div className="doc-meta-grid">
          <div><span className="muted">Người tạo:</span> <strong>{doc.createdByEmail ?? "—"}</strong></div>
          <div><span className="muted">Cập nhật lần cuối:</span> <strong>{fmt(doc.fetchedAt)}</strong></div>
          <div><span className="muted">Kích thước:</span> <strong>{doc.contentBytes ? `${doc.contentBytes.toLocaleString()} bytes` : "—"}</strong></div>
          <div><span className="muted">Mã nội dung (SHA-256):</span> <code className="doc-hash">{doc.contentHash?.slice(0, 12) ?? "—"}</code></div>
        </div>
        {canManage && (
          <div className="doc-meta-actions">
            <button className="btn btn-secondary btn-sm" disabled={busy} onClick={handleRefresh}>
              {busy ? "Đang tải…" : "Tải lại từ Google"}
            </button>
            <a className="btn btn-ghost btn-sm" href={doc.googleUrl} target="_blank" rel="noreferrer">
              Mở trên Google Docs
            </a>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={handleDelete}>
              Xoá
            </button>
          </div>
        )}
      </div>

      {refreshNote && (
        <div
          className={`feedback ${refreshNote.startsWith("✓") ? "feedback-ok" : "feedback-bad"}`}
          style={{ marginTop: 12 }}
        >
          {refreshNote}
        </div>
      )}

      {doc.fetchError && !refreshNote && (
        <div className="feedback feedback-bad" style={{ marginTop: 12 }}>
          ⚠ {doc.fetchError}
        </div>
      )}

      <div className="doc-embed-wrap">
        <iframe
          title={doc.heading}
          src={doc.embedUrl}
          className="doc-embed"
          allow="autoplay"
        />
      </div>
    </div>
  );
}
