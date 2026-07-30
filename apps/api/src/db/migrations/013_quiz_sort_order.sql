-- Manual drag-and-drop sort order for exercises inside a course's "Bài tập" tab.
-- NULL = not yet manually sorted -> callers fall back to ORDER BY created_at ASC
-- (oldest uploaded first), which is the required default sort.
-- Once a course's list is drag-reordered, every quiz in that course gets an
-- explicit sort_order so the manual order sticks.

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS sort_order INTEGER;

CREATE INDEX IF NOT EXISTS quizzes_course_sort ON quizzes(course_id, sort_order);
