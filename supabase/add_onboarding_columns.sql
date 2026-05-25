-- Add contextual onboarding columns to user_settings table
-- These track which screens the user has completed onboarding for

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS onboarding_home BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_practice BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_study BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_kana BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_lessons BOOLEAN DEFAULT FALSE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding_home
ON user_settings(onboarding_home);

CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding_practice
ON user_settings(onboarding_practice);

CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding_study
ON user_settings(onboarding_study);

CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding_kana
ON user_settings(onboarding_kana);

CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding_lessons
ON user_settings(onboarding_lessons);

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
AND column_name LIKE 'onboarding_%'
ORDER BY column_name;
