-- Add sentence-level stats to user_progress
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS best_grade TEXT CHECK (best_grade IN ('○', '△', '×')),
ADD COLUMN IF NOT EXISTS practice_count INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_practiced_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing rows to set defaults
UPDATE user_progress
SET practice_count = COALESCE(attempts, 1),
    last_practiced_at = COALESCE(completed_at, NOW())
WHERE practice_count IS NULL;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_progress_last_practiced
  ON user_progress(user_id, last_practiced_at DESC);
