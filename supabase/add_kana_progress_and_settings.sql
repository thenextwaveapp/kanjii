-- ============================================================
-- Add kana progress and user settings to database
-- Replaces AsyncStorage with server-side storage for sync
-- ============================================================

-- 1. Kana Progress Table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_kana_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('hiragana', 'katakana', 'hiragana-advanced', 'katakana-advanced')),
  kana TEXT NOT NULL,
  mastered BOOLEAN NOT NULL DEFAULT false,
  practice_count INT DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  first_mastered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mode, kana)
);

CREATE INDEX idx_user_kana_progress_user ON user_kana_progress(user_id);
CREATE INDEX idx_user_kana_progress_mode ON user_kana_progress(user_id, mode);

-- RLS for kana progress
ALTER TABLE user_kana_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_kana_progress_self" ON user_kana_progress
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE user_kana_progress IS 'User progress for hiragana/katakana characters';


-- 2. User Settings Table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  text_scale DECIMAL DEFAULT 1.0,
  voice_gender TEXT DEFAULT 'female' CHECK (voice_gender IN ('female', 'male', 'male-deep')),
  speech_rate DECIMAL DEFAULT 0.85,
  notifications_enabled BOOLEAN DEFAULT false,
  daily_reminder_hour INT DEFAULT 19 CHECK (daily_reminder_hour BETWEEN 0 AND 23),
  daily_reminder_minute INT DEFAULT 0 CHECK (daily_reminder_minute BETWEEN 0 AND 59),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_self" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE user_settings IS 'User preferences and app settings - synced across devices';


-- 3. Expand user_stats with comprehensive metrics
-- ============================================================
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS sentences_mastered INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessons_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collections_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kana_mastered INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_practice_time_seconds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_kana_practice_date DATE;

COMMENT ON COLUMN user_stats.sentences_mastered IS 'Count of sentences with ○ or △ grade';
COMMENT ON COLUMN user_stats.lessons_completed IS 'Count of lessons marked complete';
COMMENT ON COLUMN user_stats.collections_completed IS 'Count of collections with all lessons complete';
COMMENT ON COLUMN user_stats.kana_mastered IS 'Count of kana characters mastered (all modes combined)';
COMMENT ON COLUMN user_stats.total_practice_time_seconds IS 'Total time spent practicing (estimated)';
COMMENT ON COLUMN user_stats.last_kana_practice_date IS 'Last date user practiced kana (for streak calculation)';


-- 4. Add indexes for better query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_progress_best_grade ON user_progress(user_id, best_grade);
CREATE INDEX IF NOT EXISTS idx_user_kanji_mastery ON user_kanji(user_id, mastery);


-- ============================================================
-- Verification
-- ============================================================
-- SELECT
--   table_name,
--   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
-- FROM information_schema.tables t
-- WHERE table_schema = 'public'
-- AND table_name IN ('user_kana_progress', 'user_settings', 'user_stats')
-- ORDER BY table_name;
