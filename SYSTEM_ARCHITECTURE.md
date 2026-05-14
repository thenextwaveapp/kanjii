# Kanjii System Architecture

## Complete Data Flow Explanation

### Database Tables (Supabase)

#### 1. **sentences** (Shared Content Library)
```sql
- id: uuid
- japanese: "今日は暑い"
- english: "It's hot today"
- words: [{ word: "今日", furigana: "きょう", meaning: "today" }, ...]
- jlpt_level: "N5" | "N4" | "N3" | "N2" | "N1"
- domain: "Weather & seasons: Temperature"
- created_at: timestamp
```
**Purpose**: One sentence shared across ALL users. Generated once, reused forever.

#### 2. **user_progress** (What Users Have Completed)
```sql
- id: uuid
- user_id: uuid → references auth.users
- sentence_id: uuid → references sentences
- attempts: 3 (how many tries before success)
- completed_at: timestamp
- UNIQUE(user_id, sentence_id) ← user can't do same sentence twice
```
**Purpose**: Track which sentences each user has completed. Used to avoid showing the same sentence again.

#### 3. **user_kanji** (Individual Kanji Progress)
```sql
- id: uuid
- user_id: uuid
- kanji: "食" (single character)
- readings: ["しょく", "た"] (array)
- meanings: ["food", "eat"] (array)
- jlpt_level: "N5"
- seen_count: 5 (times written correctly)
- skip_count: 2 (times skipped)
- mastery: "○" | "△" | "×"
  - ○ (maru) = mastered (blue)
  - △ (sankaku) = learning (green)
  - × (batsu) = needs work (grey)
- first_seen_at: timestamp
- last_seen_at: timestamp
- UNIQUE(user_id, kanji) ← one row per kanji per user
```
**Purpose**: Track EVERY kanji a user encounters. Extract from sentence words array.

#### 4. **user_stats** (Profile Summary)
```sql
- user_id: uuid (primary key)
- total_correct: 145 (lifetime completions)
- current_streak: 7 (consecutive days)
- longest_streak: 14 (record)
- kanji_count: 87 (unique kanji seen)
- last_activity_date: "2026-05-13"
```
**Purpose**: Fast profile stats without counting rows.

---

## How Practice Mode Works

### User Flow:
```
1. User selects: N5, "Food & drink: Restaurants", 10 rounds
   ↓
2. PracticeScreen calls fetchSentence(userId, "N5", "Food & drink: Restaurants")
   ↓
3. fetchSentence logic:
   a) Query DB for sentences WHERE:
      - jlpt_level = "N5"
      - domain = "Food & drink: Restaurants"
      - sentence_id NOT IN (user's completed sentences)
      - LIMIT 20
   b) Pick random sentence from results
   c) IF NO RESULTS → Generate new sentence using LLM
   ↓
4. Show sentence card with tappable words
   ↓
5. User types Japanese text
   ↓
6. On correct match → recordCompletion()
   ↓
7. Repeat for 10 rounds
   ↓
8. Show SummaryScreen with results
```

### recordCompletion() - What Happens When User Succeeds:

```javascript
recordCompletion({
  userId: "abc-123",
  sentenceId: "sent-456",
  words: [
    { word: "ラーメン", furigana: "らーめん", meaning: "ramen" },
    { word: "食べる", furigana: "たべる", meaning: "to eat" }
  ],
  attempts: 2,
  grade: "○" // or "△" or "×"
})
```

**Three parallel operations:**

1. **Insert into user_progress**
   - Links user to sentence
   - Records attempts
   - Prevents seeing this sentence again

2. **Update user_kanji** (for EACH kanji in words)
   - Extract kanji: "食" from "食べる"
   - If first time → INSERT new row
   - If seen before → UPDATE:
     - seen_count++
     - readings = merge arrays
     - meanings = merge arrays
     - mastery = upgrade logic:
       ```
       ○ + ○ → ○ (stays mastered)
       ○ + × → × (downgrade if fail)
       △ + ○ → ○ (upgrade to mastered)
       × + △ → △ (upgrade to learning)
       ```

3. **Update user_stats**
   - total_correct++
   - kanji_count = count distinct kanji
   - Update streak (consecutive days)

### recordSkip() - What Happens When User Skips:

```javascript
recordSkip({
  userId: "abc-123",
  words: [{ word: "難しい", ... }]
})
```

- Extract kanji: "難"
- Update user_kanji: skip_count++, mastery = "×"
- Does NOT increment seen_count
- Does NOT record in user_progress (can see again)

---

## How Study Mode Works

### Kanji Tab:
```
1. Fetch all user_kanji for user
   ↓
2. Filter by tab:
   - "All" → show everything
   - "Needs work" → mastery = "×" or "△" or null
   - "Mastered" → mastery = "○"
   ↓
3. Display cards with:
   - Kanji character: "食"
   - Reading: "しょく"
   - Meaning: "food"
   - Stats: seen_count, skip_count
   - Mastery badge: ○/△/×
   ↓
4. Tap → KanjiDetailScreen
```

### Drill Mode (Weak Kanji):
```
1. Find weak kanji:
   - Filter: skip_count > 0 OR seen_count < 3
   - Sort by: (skip_count - seen_count) DESC
   - Take top 5
   ↓
2. Generate targeted sentences:
   - Call fetchTargetedSentence(focusKanji: ["食", "飲", "..."])
   - LLM generates sentence containing these kanji
   ↓
3. Practice session with these sentences
```

### Sentences Tab:
```
1. Fetch user_progress with joined sentences
   ↓
2. Show completed sentences with:
   - Japanese + English
   - Attempts badge (1× = "First try", 3× = "3× attempts")
   - Kanji chips (tappable)
   - "Tap to practice →" button
   ↓
3. Tap sentence → Re-practice (single round mode)
4. Tap kanji chip → KanjiDetailScreen
```

---

## LLM Integration (Claude API)

### When LLM is Used:

**1. No DB Sentences Match** (Fallback)
```javascript
// User wants N5 + "Gaming: Gacha" but no sentences in DB
↓
fetchSentence() → calls generateSnippet()
↓
LLM generates NEW sentence
↓
INSERT into sentences table
↓
Return to user
```

**2. Bulk Generation Script** (Pre-population)
```bash
npm run generate -- --level N5 --domain "Gaming: Gacha" --count 10
↓
For each of 10 iterations:
  1. Pick random N5 vocab word from n5.csv
  2. Call generateSnippet(N5, domain, targetWord)
  3. LLM generates sentence using that word
  4. INSERT into sentences table
```

### generateSnippet() - What the LLM Does:

**Input:**
```javascript
generateSnippet(
  difficulty: "N5",
  domain: "Gaming: Gacha",
  focusKanji: [],
  targetWord: {
    expression: "勝つ",
    reading: "かつ",
    meaning: "to win"
  }
)
```

**Prompt to Claude:**
```
Generate a short, authentic Japanese social media snippet.

Rules:
- CRITICAL: Keep it VERY short (8-12 characters total). Single simple sentence only.
- Use only N5-level vocabulary and simple grammar. Basic kanji only.
- No formal/textbook Japanese
- No emojis
- Topic: gacha pulls, getting lucky or unlucky, salt, or celebrating rare drops
- IMPORTANT: The sentence MUST naturally include this word: 勝つ (かつ) meaning "to win"
- Return ONLY valid JSON

{
  "japanese": "the Japanese text",
  "english": "natural English translation",
  "words": [
    { "word": "勝つ", "furigana": "かつ", "meaning": "to win" }
  ]
}
```

**LLM Response:**
```json
{
  "japanese": "ガチャで勝った",
  "english": "I won at gacha",
  "words": [
    { "word": "ガチャ", "furigana": "がちゃ", "meaning": "gacha" },
    { "word": "勝つ", "furigana": "かつ", "meaning": "to win" }
  ]
}
```

---

## Vocab Seeding System

### Why Vocab Seeding?

**Without seeding:**
- Same level + domain = repetitive sentences
- "今日は暑い" appears often
- No systematic vocabulary coverage

**With vocab seeding:**
- Each sentence targets a specific JLPT word
- Different word = different sentence
- Guaranteed variety

### How Vocab Files Work:

**data/n5.csv** (718 words):
```csv
expression,reading,meaning,tags
食べる,たべる,"to eat",JLPT_N5
飲む,のむ,"to drink",JLPT_N5
見る,みる,"to see",JLPT_N5
```

**Generation script:**
```javascript
1. Load n5.csv → 718 words
   ↓
2. For count=10:
   - Pick random word[0]: "食べる"
   - Generate sentence using "食べる"
   - Pick random word[1]: "飲む"
   - Generate sentence using "飲む"
   - ... (10 different words = 10 unique sentences)
```

**App fallback:**
```javascript
// When no DB sentences exist
↓
getRandomWord("N5") → "食べる"
↓
generateSnippet(N5, domain, [], targetWord: "食べる")
↓
Sentence naturally uses "食べる"
```

---

## Summary: Complete User Journey

### First Time User:
```
1. Opens app → sees Home screen
2. Taps "Start practicing"
3. Selects: N5, "Food & drink: Restaurants", 10 rounds
4. App queries DB for N5 + Restaurant sentences
5. IF empty DB → Generate 10 sentences on-the-fly (uses vocab seeding)
6. Shows sentence: "ラーメンを食べる" (8 chars, N5-appropriate)
7. User taps words to reveal meanings
8. User types: "らーめんをたべる"
9. Match! → recordCompletion():
   - Insert user_progress (completed this sentence)
   - Insert user_kanji: ラ(skip), ー(skip), メ(skip), 食(insert), べ(skip), る(skip)
     → Only "食" is kanji, so insert with seen_count=1, mastery="○"
   - Update user_stats: total_correct=1, streak=1, kanji_count=1
10. Next round... (repeat 10 times)
11. Summary screen: "10/10 completed! 5 new kanji learned"
12. User goes to Study tab
13. Sees "食" in kanji list with ○ badge
14. Sees completed sentence in sentences list
```

### Returning User with Populated DB:
```
1. Starts practice: N5, Restaurants
2. Query DB → 50 sentences available
3. Filter out already completed sentences
4. Random pick from remaining
5. No LLM call needed (reuse existing content)
6. Faster, cheaper, consistent
```

---

## Key Design Decisions

### Why shared sentences table?
- One sentence benefits ALL users
- Reduce API costs
- Pre-vet quality
- Consistent difficulty

### Why track each kanji separately?
- Granular progress tracking
- Identify weak kanji for drill mode
- Show mastery progression (×→△→○)
- Personalized learning path

### Why vocab seeding?
- Systematic vocabulary coverage
- Guaranteed variety
- JLPT-aligned learning
- No repetitive content

### Why subtopic filtering?
- User engagement (choose what they care about)
- Relevant context
- Better retention
- More fun!

---

## File Reference

```
Backend (Supabase):
├── sentences (shared)
├── user_progress (completed sentences)
├── user_kanji (individual kanji tracking)
└── user_stats (profile summary)

Frontend (React Native):
├── PracticeScreen.js → fetchSentence() → practice rounds
├── StudyScreen.js → fetchKanji() → kanji list & drill
├── SummaryScreen.js → shows results
└── KanjiDetailScreen.js → fetchKanjiDetail() → kanji info

Services:
├── sentences.js → fetchSentence(), fetchTargetedSentence()
├── claude.js → generateSnippet() → LLM API
├── progress.js → recordCompletion(), recordSkip(), fetchKanji()
├── vocab.js → getRandomWord() → CSV parser (app)
└── supabase.js → DB client

Generation:
├── data/n5-n1.csv → JLPT vocab (7,972 words)
├── scripts/vocab-node.js → CSV parser (Node)
└── scripts/generateSentences.js → bulk populate DB
```

---

## Performance Characteristics

**With pre-populated DB (recommended):**
- Practice session start: <500ms (DB query)
- No API costs per user
- Predictable content quality

**Without pre-populated DB (fallback):**
- Practice session start: 2-5 seconds (LLM generation)
- API costs per sentence
- Variable content quality

**Recommended: Pre-generate 1000+ sentences using bulk script.**
