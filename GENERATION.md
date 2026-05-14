# Sentence Generation System

This document explains how to generate sentences for your Kanjii content library using JLPT vocabulary lists.

## Overview

The system uses JLPT vocab lists to seed sentence generation, ensuring:
- **Variety**: Each sentence uses a different target word
- **Proper difficulty**: Sentences match JLPT level requirements
- **Topic accuracy**: Subtopics are properly respected
- **No repetition**: Different vocab words = unique sentences

## Setup

### 1. Download JLPT Vocabulary Lists

```bash
npm run download-vocab
```

This downloads N5-N1 vocab CSVs from [elzup/jlpt-word-list](https://github.com/elzup/jlpt-word-list) into the `data/` directory.

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Make sure your `.env` file has:
```
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_key_here
EXPO_PUBLIC_SUPABASE_URL=your_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## Usage

### Quick Test (5 sentences)

```bash
npm run generate:quick
```

Generates 5 N5 beginner sentences about restaurants.

### Custom Generation

```bash
# Generate 10 N3 sentences about gaming
npm run generate -- --level N3 --domain "Gaming: Gacha" --count 10

# Generate 5 sentences for each N5 domain
npm run generate -- --level N5 --all-domains --count 5

# Generate 3 sentences for each level+domain combo (WARNING: Takes hours!)
npm run generate:all
```

### Arguments

- `--level <N5|N4|N3|N2|N1>`: JLPT level
- `--all-levels`: Generate for all levels (N5 through N1)
- `--domain "Topic: Subtopic"`: Specific domain
- `--all-domains`: Generate for all 36 subtopics
- `--count <number>`: How many sentences per level+domain combo

## How It Works

1. **Vocab Selection**: Script loads JLPT vocab from CSV files
2. **Target Word**: Picks a random word from the appropriate level
3. **Prompt Generation**: Creates a prompt with:
   - Difficulty instructions (character limits, grammar complexity)
   - Domain/subtopic context
   - Target word that MUST be used
4. **API Call**: Sends prompt to Claude API
5. **Database Insert**: Saves sentence with metadata:
   - `japanese`: The Japanese text
   - `english`: English translation
   - `words`: Array of kanji/katakana words with readings
   - `jlpt_level`: N5/N4/N3/N2/N1
   - `domain`: The subtopic (e.g., "Food & drink: Restaurants")

## Available Subtopics

### Food & drink
- Restaurants
- Cooking
- Convenience stores

### Anime & manga
- Reactions
- Recommendations
- Characters

### Gaming
- Match results
- Gacha
- Grinding

### Weather & seasons
- Temperature
- Rain & snow
- Seasonal events

### Relationships
- Friends
- Dating
- Family

### Work & school
- Exams
- Colleagues
- Exhaustion

### Sports
- Watching
- Working out
- Team sports

### Travel
- Trains
- Trips
- Local exploration

### Daily life
- Morning routine
- Evening
- Random thoughts

### Shopping
- Online
- Sales
- Fashion

### Health & fitness
- Exercise
- Diet
- Sleep

### Entertainment
- Movies
- Music
- Social media

## Difficulty Guidelines

### N5 (Beginner)
- 8-12 characters max
- Very simple grammar
- Basic kanji only (日、本、人、etc.)

### N4 (Elementary)
- 12-18 characters
- Common kanji (食、飲、見、etc.)
- Simple patterns

### N3 (Intermediate)
- 18-25 characters
- Natural casual Japanese
- Less common kanji

### N2 (Upper-intermediate)
- 25-35 characters
- Complex sentences
- Compound kanji

### N1 (Advanced)
- 30-40 characters
- Native-level writing
- Advanced kanji

## Recommended Generation Strategy

For a balanced content library:

```bash
# Generate core beginner content (most users start here)
npm run generate -- --level N5 --all-domains --count 10

# Build out intermediate content
npm run generate -- --level N4 --all-domains --count 8
npm run generate -- --level N3 --all-domains --count 6

# Add advanced content
npm run generate -- --level N2 --all-domains --count 4
npm run generate -- --level N1 --all-domains --count 3
```

This gives you:
- 360 N5 sentences (10 × 36 domains)
- 288 N4 sentences (8 × 36 domains)
- 216 N3 sentences (6 × 36 domains)
- 144 N2 sentences (4 × 36 domains)
- 108 N1 sentences (3 × 36 domains)

**Total: 1,116 sentences** covering all levels and topics.

## Rate Limiting

The script includes a 1-second delay between API calls to avoid rate limits. Expect:
- 5 sentences: ~5-10 seconds
- 100 sentences: ~2-3 minutes
- 1000+ sentences: ~20-30 minutes

## Troubleshooting

### "Vocab file not found"
Run `npm run download-vocab` to download the CSV files.

### "API error: 401"
Check your `EXPO_PUBLIC_ANTHROPIC_API_KEY` in `.env`.

### "Error inserting sentence"
Check your Supabase credentials and make sure the `sentences` table exists.

### Sentences too long for N5
The prompt emphasizes short sentences, but you can adjust the character limits in `scripts/generateSentences.js` if needed.

## How App Uses Generated Sentences

When a user starts a practice session:

1. **Database Query**: Looks for sentences matching their selected difficulty + domain
2. **Fallback Generation**: If no matches found, generates on-the-fly using vocab seeding
3. **Variety**: Each generated sentence uses a different JLPT vocab word

By pre-populating the database, you:
- Reduce API costs (reuse sentences across users)
- Ensure quality (review generated content)
- Improve performance (no generation delay)
