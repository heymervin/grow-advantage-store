-- ============================================================
-- Admin Auth — Run this in Supabase SQL Editor
-- Moves password verification to the server side
-- ============================================================

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create admin_settings table (stores hashed password)
CREATE TABLE IF NOT EXISTS admin_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Only one row ever
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- No public read/write on admin_settings (only RPC can access)
-- Intentionally no policies — table is only accessed via the RPC function below

-- 3. Insert the default password (growadvantage2026) as a bcrypt hash
INSERT INTO admin_settings (password_hash)
VALUES (crypt('growadvantage2026', gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;

-- 4. Create RPC function to verify admin password
CREATE OR REPLACE FUNCTION verify_admin_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with table owner privileges, bypasses RLS
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash FROM admin_settings WHERE id = 1;
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;

-- 5. Grant anon access to the RPC function only
GRANT EXECUTE ON FUNCTION verify_admin_password(TEXT) TO anon;
