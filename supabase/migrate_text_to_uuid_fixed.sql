-- ============================================================
-- Migration: Convert TEXT user_id to UUID across all tables
-- This restores proper auth integration after dev-user workaround
-- ============================================================

-- STEP 1: Drop all RLS policies first (they depend on the column)
-- ============================================================

-- Drop user_lesson_progress policies
DROP POLICY IF EXISTS "user_lesson_progress_self" ON user_lesson_progress;

-- Drop user_lesson_sentence_progress policies
DROP POLICY IF EXISTS "Users can view their own lesson sentence progress" ON user_lesson_sentence_progress;
DROP POLICY IF EXISTS "Users can insert their own lesson sentence progress" ON user_lesson_sentence_progress;
DROP POLICY IF EXISTS "Users can update their own lesson sentence progress" ON user_lesson_sentence_progress;
DROP POLICY IF EXISTS "user_lesson_sentence_progress_self" ON user_lesson_sentence_progress;

-- Drop sentence_lists policies
DROP POLICY IF EXISTS "sentence_lists_self" ON sentence_lists;

-- Drop sentence_list_items policies
DROP POLICY IF EXISTS "sentence_list_items_self" ON sentence_list_items;


-- STEP 2: Clear dev data and alter column types
-- ============================================================

-- Fix user_lesson_progress
TRUNCATE TABLE user_lesson_progress CASCADE;

ALTER TABLE user_lesson_progress
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

ALTER TABLE user_lesson_progress
  ADD CONSTRAINT user_lesson_progress_user_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix user_lesson_sentence_progress
TRUNCATE TABLE user_lesson_sentence_progress CASCADE;

ALTER TABLE user_lesson_sentence_progress
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

ALTER TABLE user_lesson_sentence_progress
  ADD CONSTRAINT user_lesson_sentence_progress_user_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix sentence_lists (will cascade to sentence_list_items)
TRUNCATE TABLE sentence_lists CASCADE;

ALTER TABLE sentence_lists
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

ALTER TABLE sentence_lists
  ADD CONSTRAINT sentence_lists_user_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- STEP 3: Recreate RLS policies
-- ============================================================

-- user_lesson_progress policy
CREATE POLICY "user_lesson_progress_self" ON user_lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- user_lesson_sentence_progress policy
CREATE POLICY "user_lesson_sentence_progress_self" ON user_lesson_sentence_progress
  FOR ALL USING (auth.uid() = user_id);

-- sentence_lists policy
CREATE POLICY "sentence_lists_self" ON sentence_lists
  FOR ALL USING (auth.uid() = user_id);

-- sentence_list_items policy (checks ownership via parent list)
CREATE POLICY "sentence_list_items_self" ON sentence_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sentence_lists
      WHERE sentence_lists.id = sentence_list_items.list_id
      AND sentence_lists.user_id = auth.uid()
    )
  );


-- STEP 4: Add comments
-- ============================================================

COMMENT ON TABLE user_lesson_progress IS 'User progress per lesson - UUID user_id with proper auth';
COMMENT ON TABLE user_lesson_sentence_progress IS 'Per-sentence lesson tracking - UUID user_id with proper auth';
COMMENT ON TABLE sentence_lists IS 'User-created sentence collections - UUID user_id with proper auth';


-- STEP 5: Verification
-- ============================================================
-- Uncomment to verify all user_id columns are now UUID:

-- SELECT table_name, column_name, data_type, udt_name
-- FROM information_schema.columns
-- WHERE column_name = 'user_id'
-- AND table_schema = 'public'
-- ORDER BY table_name;
