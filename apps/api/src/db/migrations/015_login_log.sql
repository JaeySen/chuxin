-- Records every successful login for admin visibility, and supports
-- configurable max concurrent sessions per user (setting "max_concurrent_logins").
CREATE TABLE login_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX login_log_user_id ON login_log(user_id, created_at DESC);
CREATE INDEX login_log_created_at ON login_log(created_at DESC);
