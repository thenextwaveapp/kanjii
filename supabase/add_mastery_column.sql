-- ============================================================
-- Migration: Add mastery column to user_kanji table
-- Run this in your Supabase SQL editor
-- ============================================================

-- Add mastery column to track kanji mastery level
-- ○ (maru) = mastered (blue)
-- △ (sankaku) = learning (green)
-- × (batsu) = not learned (grey)
alter table user_kanji
add column if not exists mastery text check (mastery in ('○', '△', '×'));

-- Set default mastery based on existing data
-- Update existing rows: if seen_count > 0, set to ○, else if skip_count > 0, set to ×
update user_kanji
set mastery = case
  when seen_count >= 8 then '○'
  when seen_count >= 3 then '△'
  when skip_count > 0 then '×'
  else '×'
end
where mastery is null;
