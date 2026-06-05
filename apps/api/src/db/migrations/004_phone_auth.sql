-- Add phone-number login support and auth-feature toggles.

-- Phone number on users (unique, nullable — existing rows stay untouched).
ALTER TABLE users ADD COLUMN phone TEXT;
CREATE UNIQUE INDEX users_phone_uniq ON users(phone) WHERE phone IS NOT NULL;

-- Seed new auth-feature settings (all default to the existing behaviour).
INSERT INTO settings (key, value) VALUES
  ('allow_signup',        'false'::jsonb),  -- hide "Tạo tài khoản" by default; admin creates accounts
  ('disable_email_login', 'false'::jsonb),  -- when true: hide email field, require phone
  ('allow_phone_login',   'true'::jsonb)    -- show phone-number login option
ON CONFLICT (key) DO NOTHING;
