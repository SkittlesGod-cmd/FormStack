ALTER TABLE formulations ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE formulations ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

CREATE TABLE IF NOT EXISTS formulation_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  formulation_id uuid REFERENCES formulations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  snapshot jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE formulation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own formulation versions"
  ON formulation_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own formulation versions"
  ON formulation_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
