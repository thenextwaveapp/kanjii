-- Add romaji readings column
ALTER TABLE kanji_dictionary
ADD COLUMN IF NOT EXISTS readings_romaji TEXT[];

-- Update existing records with romaji
-- This will be populated when we re-import the data
