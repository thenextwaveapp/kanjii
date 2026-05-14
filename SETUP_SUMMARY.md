# Kanjii Sentence Generation - Setup Complete ✓

## What Was Built

### 1. JLPT Vocabulary Integration
- **Downloaded vocab lists**: 7,972 words across N5-N1
  - N5 (Beginner): 718 words
  - N4 (Elementary): 668 words
  - N3 (Intermediate): 2,139 words
  - N2 (Upper-intermediate): 1,748 words
  - N1 (Advanced): 2,699 words

### 2. Vocab Service (`src/services/vocab.js`)
- Parses JLPT CSV files
- Returns random words by level
- Used by app for real-time generation

### 3. Updated Sentence Generator (`src/services/claude.js`)
- Added all 36 subtopics with specific instructions
- Tightened difficulty levels (especially N5: 8-12 chars)
- Added target word parameter for vocab seeding
- Each sentence now uses a specific JLPT word

### 4. Updated Sentence Fetcher (`src/services/sentences.js`)
- Now uses vocab seeding when generating fallback sentences
- Ensures variety by using different target words

### 5. Bulk Generation Script (`scripts/generateSentences.js`)
- Command-line tool for populating database
- Supports filtering by level, domain, count
- Rate-limited API calls (1 sec delay)
- Progress tracking with success/fail counts

### 6. Node Vocab Service (`scripts/vocab-node.js`)
- Node.js version of vocab parser
- Used by generation script
- Caches vocab for performance

## Quick Start

### Test the system (5 sentences):
```bash
npm run generate:quick
```

### Generate starter content (360 sentences, ~6 minutes):
```bash
npm run generate -- --level N5 --all-domains --count 10
```

### Build full library (1,116 sentences, ~20 minutes):
```bash
npm run generate -- --level N5 --all-domains --count 10
npm run generate -- --level N4 --all-domains --count 8
npm run generate -- --level N3 --all-domains --count 6
npm run generate -- --level N2 --all-domains --count 4
npm run generate -- --level N1 --all-domains --count 3
```

## How It Ensures Variety

### Before (Problem):
- Same difficulty + domain = similar sentences
- "今日は暑い" repeated often
- No variety seed

### After (Solution):
- Each sentence targets a specific JLPT vocab word
- N5 + Restaurants + word "食べる" → "ラーメンを食べる"
- N5 + Restaurants + word "美味しい" → "パスタが美味しい"
- Different target words = guaranteed unique sentences

## Benefits

1. **No Repetition**: Each sentence uses a different vocab word
2. **Proper Difficulty**: JLPT vocab ensures level-appropriate words
3. **Topic Accuracy**: All 36 subtopics properly mapped
4. **Beginner-Friendly**: N5 sentences are VERY short (8-12 chars)
5. **Scalable**: Can generate thousands of sentences systematically

## File Structure

```
kanjii/
├── data/                          # JLPT vocab CSVs
│   ├── n5.csv (718 words)
│   ├── n4.csv (668 words)
│   ├── n3.csv (2,139 words)
│   ├── n2.csv (1,748 words)
│   └── n1.csv (2,699 words)
├── scripts/
│   ├── generateSentences.js      # Bulk generation CLI
│   └── vocab-node.js             # Node vocab parser
├── src/services/
│   ├── vocab.js                  # React Native vocab service
│   ├── claude.js                 # Updated with subtopics + target words
│   └── sentences.js              # Updated with vocab seeding
├── GENERATION.md                 # Full documentation
└── SETUP_SUMMARY.md             # This file

```

## Next Steps

1. **Test generation**: `npm run generate:quick`
2. **Review output**: Check Supabase `sentences` table
3. **Generate more**: Use custom commands for specific levels/domains
4. **Monitor**: Check sentence lengths match N5/N4 limits

## Troubleshooting

- **"Vocab file not found"**: Run `npm run download-vocab`
- **API errors**: Check `.env` has `EXPO_PUBLIC_ANTHROPIC_API_KEY`
- **Database errors**: Verify Supabase credentials and table exists
- **Sentences too long**: Adjust limits in `scripts/generateSentences.js`

## Key Changes Summary

| Component | Change | Impact |
|-----------|--------|--------|
| `claude.js` | Added 36 subtopics | Subtopic filtering now works |
| `claude.js` | Tightened N5/N4 limits | Beginner sentences are shorter |
| `claude.js` | Added targetWord param | Enables vocab seeding |
| `sentences.js` | Import vocab service | Real-time generation uses vocab |
| New: `vocab.js` | Parse JLPT CSVs | Provides vocab words to app |
| New: `generateSentences.js` | Bulk generation | Populate database efficiently |
| New: `vocab-node.js` | Node vocab parser | Used by generation script |

Everything is ready to generate your content library! 🚀
