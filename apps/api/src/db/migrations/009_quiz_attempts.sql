-- Per-student quiz attempt tracking with per-question reaction times.

CREATE TABLE quiz_attempts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  last_question_num INT NOT NULL DEFAULT 0,   -- num of the last MCQ question shown; 0 = not started
  score             INT NOT NULL DEFAULT 0,
  total_mcq         INT NOT NULL DEFAULT 0
);
CREATE INDEX quiz_attempts_quiz     ON quiz_attempts(quiz_id);
CREATE INDEX quiz_attempts_student  ON quiz_attempts(student_id, quiz_id);

CREATE TABLE quiz_attempt_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_num    INT NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct      BOOLEAN NOT NULL DEFAULT false,
  reaction_ms     INT,                        -- ms from question display to selection; null if resumed mid-question
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_num)
);
CREATE INDEX quiz_attempt_answers_attempt ON quiz_attempt_answers(attempt_id);
