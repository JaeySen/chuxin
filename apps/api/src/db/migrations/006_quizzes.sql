-- Quiz exercises created from parsed PDF/DOCX uploads.

CREATE TABLE quizzes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  source      TEXT,                                  -- original filename
  course_id   TEXT,                                  -- optional link to CourseId
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quizzes_course ON quizzes(course_id);

CREATE TABLE quiz_questions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id   UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  num       INT NOT NULL,
  text      TEXT NOT NULL,
  type      TEXT NOT NULL CHECK (type IN ('mcq', 'open')),
  options   JSONB NOT NULL DEFAULT '{}',             -- {A, B, C, D}
  answer    TEXT,
  UNIQUE (quiz_id, num)
);

CREATE INDEX quiz_questions_quiz ON quiz_questions(quiz_id);
