-- Create user_profile table for collecting onboarding questionnaire data
-- This data is for analytics and understanding users, not for app personalization

CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Question 1: Experience Level (Required)
  experience_level TEXT CHECK (experience_level IN (
    'complete_beginner',
    'know_kana',
    'know_some_kanji',
    'intermediate',
    'advanced'
  )),

  -- Question 2: Learning Goal (Required)
  learning_goal TEXT CHECK (learning_goal IN (
    'travel',
    'work',
    'entertainment',
    'heritage',
    'academic',
    'general'
  )),

  -- Question 3: Study Commitment (Optional)
  study_commitment TEXT CHECK (study_commitment IN (
    'less_than_15',
    '15_plus',
    '30_plus',
    '1_hour_plus',
    '2_hours_plus'
  )),

  -- Question 4: Previous Study (Optional)
  previous_study TEXT CHECK (previous_study IN (
    'never',
    'self_taught',
    'classes',
    'lived_in_japan',
    'native'
  )),

  -- Question 5: Referral Source (Optional)
  referral_source TEXT CHECK (referral_source IN (
    'social_media',
    'friend',
    'app_store',
    'article',
    'other'
  )),

  -- Metadata
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one profile per user
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profile
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON user_profile
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profile
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_completed ON user_profile(profile_completed);
CREATE INDEX IF NOT EXISTS idx_user_profile_experience ON user_profile(experience_level);
CREATE INDEX IF NOT EXISTS idx_user_profile_goal ON user_profile(learning_goal);

-- Verify table was created
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profile'
ORDER BY ordinal_position;
