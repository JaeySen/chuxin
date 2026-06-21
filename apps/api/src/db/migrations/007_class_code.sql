-- Add class_code (short human-readable code, unique, e.g. "HSK1-A")
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS classes_code ON classes(class_code) WHERE class_code IS NOT NULL;

-- Normalise schedule shape to { days: string[], clock_in: string, clock_out: string }
-- (existing rows keep their JSONB as-is; new rows use the new shape)
COMMENT ON COLUMN classes.schedule IS
  '{ "days": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], "clock_in": "HH:MM", "clock_out": "HH:MM" }';
