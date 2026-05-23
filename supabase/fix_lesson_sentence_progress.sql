-- Drop the incorrectly created table
DROP TABLE IF EXISTS user_lesson_sentence_progress CASCADE;

-- Recreate with correct schema (user_id as TEXT, not UUID)
CREATE TABLE user_lesson_sentence_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sentence_id UUID NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  grade TEXT NOT NULL CHECK (grade IN ('○', '△', '×')),
  practiced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id, sentence_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_lesson_sentence_progress_user_lesson
  ON user_lesson_sentence_progress(user_id, lesson_id);

CREATE INDEX idx_user_lesson_sentence_progress_sentence
  ON user_lesson_sentence_progress(sentence_id);

-- RLS policies
ALTER TABLE user_lesson_sentence_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson sentence progress"
  ON user_lesson_sentence_progress
  FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = 'dev-user');

CREATE POLICY "Users can insert their own lesson sentence progress"
  ON user_lesson_sentence_progress
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = 'dev-user');

CREATE POLICY "Users can update their own lesson sentence progress"
  ON user_lesson_sentence_progress
  FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = 'dev-user');
