-- Add good_count column to user_lesson_progress table
-- This tracks the number of sentences that received △ (sankaku/good) grade (80%+ accuracy)
-- Used for weighted percentage calculation: ○ = 100%, △ = 80%, × = 0%

ALTER TABLE user_lesson_progress
ADD COLUMN IF NOT EXISTS good_count INTEGER DEFAULT 0;

-- Update existing records to set good_count to 0
UPDATE user_lesson_progress
SET good_count = 0
WHERE good_count IS NULL;

-- Add comment
COMMENT ON COLUMN user_lesson_progress.good_count IS 'Number of sentences with △ (good/80%+) grade';
