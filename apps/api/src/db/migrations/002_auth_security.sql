-- Security features: cross-IP detection, account locking, audit trail,
-- and admin-configurable enforcement toggle.

-- Key-value settings (single-row config, lookup by key).
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default: hard-enforce single-device + same-IP login for students.
-- Admin can toggle this to false to switch to "soft" mode (log events only).
INSERT INTO settings (key, value)
VALUES ('enforce_cross_ip_lock', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Per-user lock state. Students get locked when a cross-IP login is detected.
ALTER TABLE users ADD COLUMN locked         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN locked_at      TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN locked_reason  TEXT;

-- Auth security events for admin review.
CREATE TABLE auth_events (
  id                     BIGSERIAL PRIMARY KEY,
  user_id                UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type             TEXT NOT NULL,    -- 'cross_ip_blocked', 'soft_cross_ip', 'admin_unlock'
  attempted_ip           TEXT,
  attempted_user_agent   TEXT,
  existing_session_ip    TEXT,
  resolved               BOOLEAN NOT NULL DEFAULT false,
  resolved_at            TIMESTAMPTZ,
  resolved_by            UUID REFERENCES users(id),
  note                   TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX auth_events_unresolved ON auth_events(resolved, created_at DESC);
CREATE INDEX auth_events_user       ON auth_events(user_id, created_at DESC);
