-- "Tài liệu" blog feature — teachers post Google Docs links, students browse them.

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heading       TEXT NOT NULL,
  description   TEXT,                                 -- optional short summary shown in the grid
  google_url    TEXT NOT NULL,
  doc_id        TEXT NOT NULL,                        -- extracted Google document id
  content_hash  TEXT,                                 -- sha256 of last fetched plain-text export
  content_bytes INT,                                  -- bytes of last fetched content
  fetched_at    TIMESTAMPTZ,                          -- when content was last successfully fetched
  fetch_error   TEXT,                                 -- last fetch error (null on success)
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX documents_created_at ON documents(created_at DESC);
