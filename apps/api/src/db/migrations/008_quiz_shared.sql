-- Allow quizzes to be shared with all teachers (not just the creator).
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shared BOOLEAN NOT NULL DEFAULT false;
