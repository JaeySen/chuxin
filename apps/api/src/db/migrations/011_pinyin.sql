-- Add meta JSONB to quiz_questions for storing per-character pinyin
-- Structure: { "text_pairs": [["汉","hàn"],["字","zì"]], "options_pairs": {"A":[...],...} }

ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS quiz_questions_meta ON quiz_questions USING gin(meta);
