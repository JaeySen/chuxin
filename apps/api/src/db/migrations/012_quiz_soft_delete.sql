-- Soft-delete for quizzes: deleted exercises move to an admin-only recycle bin.
-- Non-admin endpoints must always filter WHERE deleted_at IS NULL.

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quizzes_deleted_at ON quizzes(deleted_at);
