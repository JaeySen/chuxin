-- Tracks how many questions a student left unanswered (timed out twice / gave
-- up on) when finishing a quiz attempt. Powers "played N times / last effort"
-- statistics surfaced to both teachers and students.

ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS unanswered_count INTEGER NOT NULL DEFAULT 0;
