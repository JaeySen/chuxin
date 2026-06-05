import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

export interface ApiDocument {
  id: string;
  heading: string;
  description: string | null;
  googleUrl: string;
  docId: string;
  embedUrl: string;
  contentHash: string | null;
  contentBytes: number | null;
  fetchedAt: string | null;
  fetchError: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "vừa xong";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

function previewThumbUrl(docId: string) {
  return `https://docs.google.com/document/d/${docId}/export?format=png&page=1`;
}

export function DocumentsPage() {
  const { role } = useAuth();
  const [docs, setDocs] = useState<ApiDocument[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canCreate = role === "teacher" || role === "admin";

  async function refresh() {
    try {
      setErr(null);
      // Public endpoint — no auth token needed, but apiFetch sends it if available
      const res = await fetch(`${API_BASE}/documents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDocs(await res.json() as ApiDocument[]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0 }}>Thư viện tài liệu</h1>
      <p className="muted">Bộ sưu tập học liệu của lớp — mở từ Google Docs.</p>

      {canCreate && <CreateForm onCreated={refresh} />}

      {err && <div className="feedback feedback-bad" style={{ marginTop: 12 }}>{err}</div>}
      {!docs && !err && <div className="muted" style={{ marginTop: 20 }}>Đang tải…</div>}
      {docs && docs.length === 0 && (
        <div className="feedback feedback-info" style={{ marginTop: 20 }}>
          Chưa có tài liệu nào. {canCreate ? "Hãy tạo bài đầu tiên ở trên." : "Quay lại sau khi giáo viên thêm tài liệu."}
        </div>
      )}

      <div className="doc-grid">
        {docs?.map((d) => (
          <Link key={d.id} to={`/thu-vien/${d.id}`} className="doc-card-v2">
            {/* Preview image — blurred bottom half */}
            <div className="doc-card-preview">
              <img
                src={previewThumbUrl(d.docId)}
                alt=""
                className="doc-card-preview-img"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div className="doc-card-preview-fade" />
              <div className="doc-card-preview-icon">📄</div>
            </div>

            {/* Body */}
            <div className="doc-card-v2-body">
              <h3>{d.heading}</h3>
              {d.description && <p className="doc-card-desc">{d.description}</p>}
              <div className="doc-card-meta">
                {d.createdByName && (
                  <span className="doc-card-author">✍ {d.createdByName}</span>
                )}
                <span>· {fmtRelative(d.fetchedAt)}</span>
              </div>
              {d.fetchError && (
                <div className="doc-card-warn">⚠ {d.fetchError}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setOk(false);
    try {
      await apiFetch("/documents", {
        method: "POST",
        body: JSON.stringify({
          heading: heading.trim(),
          description: description.trim() || undefined,
          googleUrl: googleUrl.trim(),
        }),
      });
      setHeading(""); setDescription(""); setGoogleUrl("");
      setOk(true);
      onCreated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  return (
    <form className="doc-create-card" onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Tạo tài liệu mới</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        Đặt quyền truy cập Google Docs là <strong>Anyone with the link</strong> trước khi dán URL.
      </p>
      <div className="doc-form-row">
        <label>
          <span>Tiêu đề</span>
          <input value={heading} onChange={(e) => setHeading(e.target.value)} required maxLength={200} />
        </label>
        <label>
          <span>Mô tả ngắn (tuỳ chọn)</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>
        <label>
          <span>Google Docs URL</span>
          <input
            type="url"
            value={googleUrl}
            onChange={(e) => setGoogleUrl(e.target.value)}
            placeholder="https://docs.google.com/document/d/..."
            required
          />
        </label>
      </div>
      {err && <div className="feedback feedback-bad">{err}</div>}
      {ok && <div className="feedback feedback-ok">Đã tạo tài liệu.</div>}
      <button type="submit" className="btn btn-primary" disabled={busy || !heading.trim() || !googleUrl.trim()}>
        {busy ? "Đang tạo…" : "Tạo tài liệu"}
      </button>
    </form>
  );
}
