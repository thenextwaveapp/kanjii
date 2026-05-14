-- Collections feature schema
-- Adds curated, progressive learning paths

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📚',
  level TEXT, -- N5, N4, N3, N2, N1 (optional, for filtering)
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name)
);

-- Lessons table (collections have multiple lessons)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, order_index)
);

-- Junction table: lessons contain specific sentences in order
CREATE TABLE IF NOT EXISTS lesson_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sentence_id UUID NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lesson_id, sentence_id),
  UNIQUE(lesson_id, order_index)
);

-- User progress per lesson
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ, -- NULL = in progress, set when all sentences get ○
  mastered_count INTEGER DEFAULT 0, -- count of sentences with ○ grade
  total_count INTEGER DEFAULT 0, -- total sentences in lesson (cached for performance)
  last_practiced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_collection ON lessons(collection_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_sentences_lesson ON lesson_sentences(lesson_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_sentences_sentence ON lesson_sentences(sentence_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);

-- Sample collections for testing
INSERT INTO collections (name, description, emoji, level, order_index) VALUES
  ('Basic Travel', 'Essential phrases for traveling in Japan', '✈️', 'N5', 1),
  ('Restaurant Survival', 'Order food and navigate menus with confidence', '🍜', 'N5', 2),
  ('Making Friends', 'Start conversations and build relationships', '👥', 'N4', 3);

-- Get the collection IDs for sample lessons
DO $$
DECLARE
  travel_id UUID;
  restaurant_id UUID;
  friends_id UUID;
BEGIN
  SELECT id INTO travel_id FROM collections WHERE name = 'Basic Travel';
  SELECT id INTO restaurant_id FROM collections WHERE name = 'Restaurant Survival';
  SELECT id INTO friends_id FROM collections WHERE name = 'Making Friends';

  -- Basic Travel lessons
  INSERT INTO lessons (collection_id, name, description, order_index) VALUES
    (travel_id, 'At the Airport', 'Navigate airports and check-in', 1),
    (travel_id, 'Taking the Train', 'Buy tickets and find your platform', 2),
    (travel_id, 'Hotel Check-in', 'Check in and ask about facilities', 3);

  -- Restaurant Survival lessons
  INSERT INTO lessons (collection_id, name, description, order_index) VALUES
    (restaurant_id, 'Ordering Basics', 'Order your first meal', 1),
    (restaurant_id, 'Menu Navigation', 'Understand common menu items', 2),
    (restaurant_id, 'Paying the Bill', 'Ask for the check and pay', 3);

  -- Making Friends lessons
  INSERT INTO lessons (collection_id, name, description, order_index) VALUES
    (friends_id, 'Introductions', 'Introduce yourself naturally', 1),
    (friends_id, 'Small Talk', 'Chat about weather, hobbies, work', 2),
    (friends_id, 'Making Plans', 'Suggest activities and set times', 3);
END $$;

COMMENT ON TABLE collections IS 'Curated learning paths with progressive lessons';
COMMENT ON TABLE lessons IS 'Individual lessons within a collection';
COMMENT ON TABLE lesson_sentences IS 'Ordered sentences that make up a lesson';
COMMENT ON TABLE user_lesson_progress IS 'Tracks user completion and mastery per lesson';
