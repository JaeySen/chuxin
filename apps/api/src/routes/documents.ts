import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { query } from "../db/index.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { extractDocId, fetchDocContent, previewUrl } from "../services/documents.js";

interface DocumentRow {
  id: string;
  heading: string;
  description: string | null;
  google_url: string;
  doc_id: string;
  content_hash: string | null;
  content_bytes: number | null;
  fetched_at: Date | null;
  fetch_error: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ApiDocument {
  id: string;
  heading: string;
  description: string | null;
  googleUrl: string;
  docId: string;
  embedUrl: string;
  contentHash: string | null;
  contentBytes: number | null;
  fetchedAt: Date | null;
  fetchError: string | null;
  createdByEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toApi(row: DocumentRow & { created_by_email?: string | null }): ApiDocument {
  return {
    id: row.id,
    heading: row.heading,
    description: row.description,
    googleUrl: row.google_url,
    docId: row.doc_id,
    embedUrl: previewUrl(row.doc_id),
    contentHash: row.content_hash,
    contentBytes: row.content_bytes,
    fetchedAt: row.fetched_at,
    fetchError: row.fetch_error,
    createdByEmail: row.created_by_email ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CreateBody = z.object({
  heading: z.string().min(1).max(200),
  googleUrl: z.string().url(),
  description: z.string().max(500).optional(),
});

async function runFetch(docId: string, documentId: string): Promise<{ hash: string | null; bytes: number | null; error: string | null }> {
  const result = await fetchDocContent(docId);
  if (result.ok) {
    await query(
      `UPDATE documents SET content_hash = $1, content_bytes = $2, fetched_at = now(),
         fetch_error = NULL, updated_at = now()
       WHERE id = $3`,
      [result.hash!, result.bytes!, documentId],
    );
    return { hash: result.hash!, bytes: result.bytes!, error: null };
  } else {
    await query(
      `UPDATE documents SET fetch_error = $1, updated_at = now() WHERE id = $2`,
      [result.error ?? "unknown error", documentId],
    );
    return { hash: null, bytes: null, error: result.error ?? "unknown error" };
  }
}

export async function documentRoutes(app: FastifyInstance) {
  // All endpoints require authentication — tài liệu is gated like lessons.
  app.addHook("preHandler", authenticate);

  app.get("/", async () => {
    const { rows } = await query<DocumentRow & { created_by_email: string | null }>(
      `SELECT d.*, u.email AS created_by_email
         FROM documents d
         LEFT JOIN users u ON u.id = d.created_by
         ORDER BY d.created_at DESC`,
    );
    return rows.map(toApi);
  });

  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const { rows } = await query<DocumentRow & { created_by_email: string | null }>(
      `SELECT d.*, u.email AS created_by_email
         FROM documents d
         LEFT JOIN users u ON u.id = d.created_by
         WHERE d.id = $1`,
      [req.params.id],
    );
    if (!rows[0]) return reply.status(404).send({ error: "Document not found" });
    return reply.send(toApi(rows[0]));
  });

  app.post(
    "/",
    { preHandler: [requireRole("teacher", "admin")] },
    async (req, reply) => {
      const parsed = CreateBody.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: "Invalid body", details: parsed.error.format() });

      const docId = extractDocId(parsed.data.googleUrl);
      if (!docId) {
        return reply.status(400).send({
          error: "INVALID_URL",
          message: "Không nhận diện được Google Docs URL. URL phải có dạng https://docs.google.com/document/d/<id>/...",
        });
      }

      const { rows } = await query<DocumentRow>(
        `INSERT INTO documents (heading, description, google_url, doc_id, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [parsed.data.heading, parsed.data.description ?? null, parsed.data.googleUrl, docId, req.user.uid],
      );
      const doc = rows[0];

      // Best-effort initial fetch — don't fail the create if Google is unreachable
      await runFetch(docId, doc.id);

      const { rows: refreshed } = await query<DocumentRow & { created_by_email: string | null }>(
        `SELECT d.*, u.email AS created_by_email
           FROM documents d
           LEFT JOIN users u ON u.id = d.created_by
           WHERE d.id = $1`,
        [doc.id],
      );
      return reply.send(toApi(refreshed[0]));
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/refresh",
    { preHandler: [requireRole("teacher", "admin")] },
    async (req, reply) => {
      const { rows } = await query<DocumentRow>(`SELECT * FROM documents WHERE id = $1`, [req.params.id]);
      const doc = rows[0];
      if (!doc) return reply.status(404).send({ error: "Document not found" });

      const before = doc.content_hash;
      const result = await runFetch(doc.doc_id, doc.id);

      const { rows: refreshed } = await query<DocumentRow & { created_by_email: string | null }>(
        `SELECT d.*, u.email AS created_by_email
           FROM documents d
           LEFT JOIN users u ON u.id = d.created_by
           WHERE d.id = $1`,
        [doc.id],
      );

      return reply.send({
        document: toApi(refreshed[0]),
        changed: !!result.hash && result.hash !== before,
        error: result.error,
      });
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [requireRole("teacher", "admin")] },
    async (req, reply) => {
      const { rowCount } = await query(`DELETE FROM documents WHERE id = $1`, [req.params.id]);
      if (!rowCount) return reply.status(404).send({ error: "Document not found" });
      return reply.send({ ok: true });
    },
  );
}

// Suppress unused-warning for FastifyReply if needed in some configs
void (null as unknown as FastifyReply);
