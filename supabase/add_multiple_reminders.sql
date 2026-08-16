-- Add support for up to 3 daily reminders
-- Replace single reminder fields with flexible multi-reminder system

-- Add new columns for multiple reminders
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS daily_reminder_count INTEGER DEFAULT 1 CHECK (daily_reminder_count >= 1 AND daily_reminder_count <= 3),
ADD COLUMN IF NOT EXISTS daily_reminder_1_hour INTEGER DEFAULT 19 CHECK (daily_reminder_1_hour >= 0 AND daily_reminder_1_hour <= 23),
ADD COLUMN IF NOT EXISTS daily_reminder_1_minute INTEGER DEFAULT 0 CHECK (daily_reminder_1_minute >= 0 AND daily_reminder_1_minute <= 59),
ADD COLUMN IF NOT EXISTS daily_reminder_2_hour INTEGER DEFAULT 13 CHECK (daily_reminder_2_hour >= 0 AND daily_reminder_2_hour <= 23),
ADD COLUMN IF NOT EXISTS daily_reminder_2_minute INTEGER DEFAULT 0 CHECK (daily_reminder_2_minute >= 0 AND daily_reminder_2_minute <= 59),
ADD COLUMN IF NOT EXISTS daily_reminder_3_hour INTEGER DEFAULT 9 CHECK (daily_reminder_3_hour >= 0 AND daily_reminder_3_hour <= 23),
ADD COLUMN IF NOT EXISTS daily_reminder_3_minute INTEGER DEFAULT 0 CHECK (daily_reminder_3_minute >= 0 AND daily_reminder_3_minute <= 59);

-- Migrate existing single reminder data to reminder 1 (if the old columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'daily_reminder_hour'
  ) THEN
    UPDATE user_settings
    SET daily_reminder_1_hour = COALESCE(daily_reminder_hour, 19),
        daily_reminder_1_minute = COALESCE(daily_reminder_minute, 0)
    WHERE daily_reminder_1_hour IS NULL OR daily_reminder_1_minute IS NULL;
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN user_settings.daily_reminder_count IS 'Number of daily reminders (1-3)';
COMMENT ON COLUMN user_settings.daily_reminder_1_hour IS 'First daily reminder hour (0-23)';
COMMENT ON COLUMN user_settings.daily_reminder_1_minute IS 'First daily reminder minute (0-59)';
COMMENT ON COLUMN user_settings.daily_reminder_2_hour IS 'Second daily reminder hour (0-23)';
COMMENT ON COLUMN user_settings.daily_reminder_2_minute IS 'Second daily reminder minute (0-59)';
COMMENT ON COLUMN user_settings.daily_reminder_3_hour IS 'Third daily reminder hour (0-23)';
COMMENT ON COLUMN user_settings.daily_reminder_3_minute IS 'Third daily reminder minute (0-59)';

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
AND column_name LIKE 'daily_reminder%'
ORDER BY column_name;
