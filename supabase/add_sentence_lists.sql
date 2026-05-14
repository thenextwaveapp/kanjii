-- User-created sentence lists
CREATE TABLE IF NOT EXISTS sentence_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#E85D3A',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for sentences in lists
CREATE TABLE IF NOT EXISTS sentence_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES sentence_lists ON DELETE CASCADE,
  sentence_id UUID NOT NULL REFERENCES sentences ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, sentence_id)
);

-- Enable RLS
ALTER TABLE sentence_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_list_items ENABLE ROW LEVEL SECURITY;

-- Policies (simplified for dev - in production use proper auth)
CREATE POLICY "sentence_lists_self" ON sentence_lists
  FOR ALL USING (true);

CREATE POLICY "sentence_list_items_self" ON sentence_list_items
  FOR ALL USING (true);
