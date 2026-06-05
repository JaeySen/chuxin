-- Giáo vụ portal: staff/assistant roles, classes, enrollments, homework, check-ins.

-- ── New roles ──────────────────────────────────────────────────────────────────
-- Extend the role column check to include 'staff' and 'assistant'.
-- (existing 'student', 'teacher', 'admin' rows are untouched)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('student', 'teacher', 'admin', 'staff', 'assistant'));

-- ── Classes ───────────────────────────────────────────────────────────────────
CREATE TABLE classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                   -- e.g. "HSK 1 – Thứ 2/4/6 19h30"
  course_id     TEXT NOT NULL,                   -- references shared CourseId enum (text)
  teacher_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  schedule      JSONB,                           -- [{day:"Mon",start:"19:30",end:"21:00"}]
  start_date    DATE,
  end_date      DATE,
  status        TEXT NOT NULL DEFAULT 'active'   -- 'active' | 'completed' | 'cancelled'
                CHECK (status IN ('active', 'completed', 'cancelled')),
  max_students  INT DEFAULT 30,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX classes_teacher   ON classes(teacher_id);
CREATE INDEX classes_status    ON classes(status);
CREATE INDEX classes_course    ON classes(course_id);

-- ── Class sessions (individual meeting dates) ─────────────────────────────────
CREATE TABLE class_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date  DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  topic         TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX class_sessions_class ON class_sessions(class_id, session_date);

-- ── Enrollments ───────────────────────────────────────────────────────────────
CREATE TABLE enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'dropped', 'completed')),
  notes         TEXT,
  UNIQUE (class_id, student_id)
);
CREATE INDEX enrollments_class   ON enrollments(class_id);
CREATE INDEX enrollments_student ON enrollments(student_id);

-- ── Check-ins (per session, per student) ──────────────────────────────────────
CREATE TABLE checkins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'present'
                CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note          TEXT,
  marked_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  marked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);
CREATE INDEX checkins_session ON checkins(session_id);
CREATE INDEX checkins_student ON checkins(student_id);

-- ── Teaching materials ────────────────────────────────────────────────────────
CREATE TABLE materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'lesson'
                CHECK (type IN ('lesson', 'homework', 'reference', 'announcement')),
  google_url    TEXT,                            -- Google Docs/Slides/Sheets link
  description   TEXT,
  due_date      TIMESTAMPTZ,                     -- for homework
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX materials_class   ON materials(class_id);
CREATE INDEX materials_session ON materials(session_id);
CREATE INDEX materials_type    ON materials(type);

-- ── Homework submissions ──────────────────────────────────────────────────────
CREATE TABLE homework_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id   UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_url    TEXT,                            -- student's submitted doc link
  note          TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted', 'reviewed', 'needs_revision')),
  score         NUMERIC(5,2),
  feedback      TEXT,                            -- assistant/teacher feedback text
  reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  UNIQUE (material_id, student_id)
);
CREATE INDEX hw_submissions_material ON homework_submissions(material_id);
CREATE INDEX hw_submissions_student  ON homework_submissions(student_id);
CREATE INDEX hw_submissions_status   ON homework_submissions(status);

-- ── Student profile (extends users) ──────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_name   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_phone  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notes         TEXT;      -- staff notes
