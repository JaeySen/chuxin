-- Initial schema for self-hosted backend.
-- Mirrors Firestore collections that previously held: users, lessons, courses,
-- progress, worksheets, and game state.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Users & sessions
-- ============================================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  provider      TEXT NOT NULL DEFAULT 'password' CHECK (provider IN ('password', 'google')),
  provider_sub  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_provider_sub_uniq ON users(provider, provider_sub) WHERE provider_sub IS NOT NULL;

CREATE TABLE sessions (
  token         TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip            TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id ON sessions(user_id);

-- ============================================================================
-- Content: courses + lessons
-- ============================================================================

CREATE TABLE courses (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  color       TEXT,
  "order"     INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lessons (
  id                TEXT PRIMARY KEY,
  course_id         TEXT REFERENCES courses(id) ON DELETE SET NULL,
  "order"           INT NOT NULL DEFAULT 0,
  title             TEXT NOT NULL,
  subtitle          TEXT,
  interaction_type  TEXT NOT NULL,
  data              JSONB NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX lessons_course_order ON lessons(course_id, "order");

-- ============================================================================
-- Student progress + worksheets
-- ============================================================================

CREATE TABLE progress (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id      TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  first_seen_at  BIGINT NOT NULL,
  last_seen_at   BIGINT NOT NULL,
  attempts       INT NOT NULL DEFAULT 0,
  best_score     INT,
  last_score     INT,
  completed      BOOLEAN NOT NULL DEFAULT false,
  score_history  JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX progress_user_lastseen ON progress(user_id, last_seen_at DESC);
CREATE INDEX progress_user_completed ON progress(user_id, completed);

CREATE TABLE worksheets (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id  TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  fields     JSONB NOT NULL,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- ============================================================================
-- Games (persistence snapshots; live state lives in the WS server memory)
-- ============================================================================

CREATE TABLE bingo_games (
  id          TEXT PRIMARY KEY,
  state       JSONB NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('lobby', 'active', 'ended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE word_search_games (
  id          TEXT PRIMARY KEY,
  state       JSONB NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('lobby', 'active', 'ended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (schema_migrations is created by the migration runner, not here)
