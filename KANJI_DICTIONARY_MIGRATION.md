# Kanji Dictionary Migration

## What Changed

We've fixed the kanji meanings system to use proper kanji definitions instead of collecting word meanings.

### Before
- Kanji meanings were extracted from words containing that kanji
- Example: 食 would collect "breakfast", "to eat", "meal" from words like 朝食, 食べる, 食事
- This gave word-level meanings, not kanji-level meanings

### After
- Kanji meanings come from a proper dictionary (2,136 常用漢字)
- Example: 食 → "eat, food"
- Clean, single canonical meaning per kanji
- Proper readings (on-yomi and kun-yomi) from the dictionary

## Database Changes

### New Table: `kanji_dictionary`
```sql
CREATE TABLE kanji_dictionary (
  kanji TEXT PRIMARY KEY,
  meaning TEXT NOT NULL,
  readings TEXT[] NOT NULL,
  stroke_paths JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Contains 2,136 kanji with proper definitions.

### Modified: `user_kanji` table
No schema changes, but the data now comes from `kanji_dictionary`:
- `meanings` array now contains the canonical meaning from dictionary
- `readings` array contains proper on-yomi/kun-yomi readings
- Existing records will keep their old data until user encounters the kanji again

## Code Changes

### New Files
1. **`src/services/kanjiDictionary.js`** - Service to fetch kanji definitions from dictionary table
2. **`scripts/import_kanji_dictionary.js`** - Script to convert JSON → SQL
3. **`supabase/kanji_dictionary.sql`** - Generated SQL file with 2,136 kanji inserts

### Modified Files
1. **`src/services/progress.js`** - Updated to fetch meanings from dictionary instead of extracting from words

## Setup Instructions

1. **Import the dictionary to Supabase:**
   - Open your Supabase SQL editor
   - Copy the contents of `supabase/kanji_dictionary.sql`
   - Run it to create the table and insert all 2,136 kanji

2. **Test it:**
   - Complete a practice session
   - Check the Study page - kanji should now have proper meanings
   - New kanji will automatically use dictionary definitions

## Data Source

- **Dictionary:** nihongo-master/data/dictionary-character-data.json
- **Kanji set:** 常用漢字 (jōyō kanji) - 2,136 characters
- **Format:** [kanji, meaning, readings, stroke_paths]

## Benefits

✅ Proper kanji meanings instead of word meanings
✅ Clean, single meaning per kanji
✅ Proper readings (on-yomi/kun-yomi)
✅ 2,136 standard kanji covered
✅ Stroke order data available (for future use)
✅ No more duplicate/confusing meanings

## Future Improvements

- Could use stroke_paths from dictionary for offline stroke order display
- Could add JLPT level data from dictionary to kanji_dictionary table
- Could add radical/component data
- Could migrate existing user_kanji records to use dictionary data
