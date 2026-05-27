-- Run this in the Supabase SQL editor to create the waitlist table.

CREATE TABLE IF NOT EXISTS waitlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  company     TEXT        NOT NULL,
  role        TEXT        NOT NULL,
  brand_count TEXT        NOT NULL,
  source      TEXT        NOT NULL
);

-- Allow anyone to insert (public waitlist), deny reads without auth.
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert on waitlist"
  ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Optional: allow authenticated admin reads
-- CREATE POLICY "Admins can read waitlist"
--   ON waitlist FOR SELECT
--   USING (auth.role() = 'authenticated');
