-- ============================================================
-- Migration: Convert TEXT user_id to UUID across all tables
-- This restores proper auth integration after dev-user workaround
-- ============================================================

-- 1. Fix user_lesson_progress
-- Drop existing data (dev data only, safe to clear)
TRUNCATE TABLE user_lesson_progress CASCADE;

ALTER TABLE user_lesson_progress
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
  ADD CONSTRAINT user_lesson_progress_user_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies
DROP POLICY IF EXISTS "user_lesson_progress_self" ON user_lesson_progress;
CREATE POLICY "user_lesson_progress_self" ON user_lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- 2. Fix user_lesson_sentence_progress
-- Drop existing data
TRUNCATE TABLE user_lesson_sentence_progress CASCADE;

ALTER TABLE user_lesson_sentence_progress
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
  ADD CONSTRAINT user_lesson_sentence_progress_user_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own lesson sentence progress" ON user_lesson_sentence_progress;
DROP POLICY IF EXISTS "Users can insert their own lesson sentence progress" ON user_lesson_sentence_progress;
DROP POLICY IF EXISTS "Users can update their own lesson sentence progress" ON user_lesson_sentence_progress;

CREATE POLICY "user_lesson_sentence_progress_self" ON user_lesson_sentence_progress
  FOR ALL USING (auth.uid() = user_id);

-- 3. Fix sentence_lists
-- Drop existing data
TRUNCATE TABLE sentence_lists CASCADE; -- Will cascade to sentence_list_items

ALTER TABLE sentence_lists
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
  ADD CONSTRAINT sentence_lists_user_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies
DROP POLICY IF EXISTS "sentence_lists_self" ON sentence_lists;
CREATE POLICY "sentence_lists_self" ON sentence_lists
  FOR ALL USING (auth.uid() = user_id);

-- 4. Fix sentence_list_items RLS
-- (sentence_id FK is fine, just need better RLS)
DROP POLICY IF EXISTS "sentence_list_items_self" ON sentence_list_items;
CREATE POLICY "sentence_list_items_self" ON sentence_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sentence_lists
      WHERE sentence_lists.id = sentence_list_items.list_id
      AND sentence_lists.user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE user_lesson_progress IS 'User progress per lesson - UUID user_id with proper auth';
COMMENT ON TABLE user_lesson_sentence_progress IS 'Per-sentence lesson tracking - UUID user_id with proper auth';
COMMENT ON TABLE sentence_lists IS 'User-created sentence collections - UUID user_id with proper auth';

-- ============================================================
-- Verification queries (uncomment to check)
-- ============================================================
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE column_name = 'user_id'
-- AND table_schema = 'public'
-- ORDER BY table_name;
