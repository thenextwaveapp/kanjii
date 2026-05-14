-- Create kanji_dictionary table
CREATE TABLE IF NOT EXISTS kanji_dictionary (
  kanji TEXT PRIMARY KEY,
  meanings TEXT[] NOT NULL,
  readings TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kanji_dictionary ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "kanji_dictionary_read" ON kanji_dictionary
  FOR SELECT USING (true);
