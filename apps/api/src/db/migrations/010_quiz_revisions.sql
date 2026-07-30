-- Snapshot of quiz questions taken automatically before a re-upload overwrites them.
-- Lets teachers review or restore the previous version.

CREATE TABLE quiz_revisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  replaced_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  replaced_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  -- full snapshot of quiz_questions rows as JSON array
  questions    JSONB NOT NULL,
  -- quick-look counters from the old version
  meta         JSONB NOT NULL DEFAULT '{}'  -- {total, mcq, open}
);

CREATE INDEX quiz_revisions_quiz ON quiz_revisions(quiz_id);
