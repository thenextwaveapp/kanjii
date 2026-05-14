# Kanjii (漢字)

A Japanese learning app that teaches **digital literacy** by training users to read and type real Japanese sentences using an IME (Input Method Editor), mirroring how native speakers actually use Japanese daily.

## What Makes Kanjii Different

Unlike traditional kanji apps focused on flashcards and rote memorization, Kanjii teaches you to:
- **Read** Japanese sentences in context with interactive kanji assistance
- **Type** complete sentences using your phone's Japanese keyboard
- **Listen** to natural speech and transcribe what you hear
- **Master** kanji through spaced repetition with intelligent grading

This approach develops practical skills for consuming Japanese content on digital devices—reading articles, social media, messaging, and more.

---

## Features

### Core Learning Modes
- **Collections**: Curated lesson paths (N5 Foundation, Travel Essentials, Business Japanese, etc.)
- **Domain Practice**: Free-form practice across 21+ topics (Daily Life, Food & Drink, Technology, News, etc.)
- **Weak Kanji Drills**: Targeted practice for struggling kanji
- **Sentence Re-practice**: Revisit and retry previously completed sentences

### Intelligent Learning System
- **Smart Grading**: Levenshtein distance-based validation that tolerates minor typos
  - ○ (Perfect): 100% match → blue celebration with animated hanamaru
  - △ (Good): ≥80% match → green acknowledgment
  - × (Wrong): <80% match → try again
- **Mastery Tracking**: Three-state system (○ Mastered / △ Learning / × Not Learned)
- **Adaptive Difficulty**: Progress through JLPT levels (N5 → N1) as you improve
- **Streak System**: Daily practice tracking with longest streak records

### Study Tools
- **Kanji Ledger**: Searchable personal dictionary with stats for every kanji encountered
  - Search by kanji, meaning, reading (hiragana/katakana), or romaji
  - Filter by mastery state (All / Needs Work / Mastered)
- **Kanji Detail Pages**:
  - Meanings and readings with text-to-speech
  - Animated stroke order visualization
  - Example sentences featuring the kanji
  - Personal stats (seen count, skip count, mastery state)
- **Sentence History**: Browse last 60 completed sentences with quick re-practice

### Interactive Practice
- **Tap-to-Reveal**: Tap any kanji in a sentence to see furigana and meaning
- **Text-to-Speech**: Natural Neural2 voices with adjustable speed
- **English/Romaji Toggle**: Switch between translation and romanization
- **Haptic Feedback**: Physical confirmation on correct/incorrect answers

### Progress Dashboard
- Current streak and longest streak
- Total kanji encountered
- Total correct answers
- JLPT Horizon: Visual breakdown of N5-N1 kanji mastery

---

## Tech Stack

**Frontend**
- React Native 0.81.5 with Expo 54.0.0
- Navigation: React Navigation (native-stack)
- UI: React Native built-in components + custom styled components
- Animations: React Native Animated API
- SVG: react-native-svg for stroke order rendering

**Backend**
- Supabase (PostgreSQL, Auth, Row-Level Security)
- Google Cloud Text-to-Speech API (Neural2 voices)

**Key Libraries**
- `wanakana`: Kana ↔ romaji conversion and romanization
- `expo-haptics`: Success/error haptic feedback
- `@react-native-async-storage`: Persistent user settings
- `expo-av`: Audio playback for TTS

---

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Google Cloud account (for Text-to-Speech API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kanjii.git
   cd kanjii
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key
   ```

4. **Set up Supabase database**

   Run the following SQL files in your Supabase SQL Editor in this order:

   ```bash
   # 1. Core schema
   supabase/schema.sql

   # 2. Create kanji dictionary table
   supabase/create_kanji_dictionary_table.sql

   # 3. Add romaji column
   supabase/add_romaji_column.sql

   # 4. Populate kanji dictionary (run all parts in order)
   supabase/kanji_dictionary_part*.sql

   # 5. Create search functions (REQUIRED for search to work)
   supabase/search_kanji_function.sql
   supabase/search_kanji_readings.sql

   # 6. Set up collections
   supabase/add_collections.sql
   supabase/populate_starter_collections.sql

   # 7. Add mastery column (if not already in schema)
   supabase/add_mastery_column.sql
   ```

   **Note**: The `search_kanji_readings` function is required for romaji/hiragana search to work properly.

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

---

## Database Schema

### Core Tables

**`sentences`** - Shared sentence library
- `japanese` (text): Full sentence in kanji/kana
- `english` (text): English translation
- `words` (JSONB): Array of {word, furigana, meaning} objects
- `difficulty` (int): 1-5 scale
- `jlpt_level` (text): N5/N4/N3/N2/N1
- `domain` (text): Topic or "Topic: Subtopic"

**`user_progress`** - User completion tracking
- `user_id` → auth.users
- `sentence_id` → sentences
- `attempts` (int): Number of times attempted
- `completed_at` (timestamptz): When first completed

**`user_kanji`** - Personal kanji ledger
- `user_id` → auth.users
- `kanji` (text): Single character
- `readings` (JSONB): Array of kana readings
- `meanings` (JSONB): Array of English meanings
- `jlpt_level` (text): Lowest level encountered (N5 < N4 < N3 < N2 < N1)
- `seen_count` (int): Correct completions
- `skip_count` (int): Skipped sentences
- `mastery` (text): ○/△/× state
- `first_seen_at`, `last_seen_at` (timestamptz)

**`user_stats`** - Denormalized performance cache
- `total_correct` (int): Cumulative correct rounds
- `current_streak` (int): Days in a row
- `longest_streak` (int): Max streak ever
- `kanji_count` (int): Unique kanji with seen_count > 0
- `last_activity_date` (date)

**`collections` / `lessons` / `lesson_sentences`** - Curated learning paths
- Collections contain ordered lessons
- Lessons contain ordered sentences
- `user_lesson_progress` tracks mastery per lesson

**`kanji_dictionary`** - Dictionary lookup
- `meanings` (TEXT[]): English definitions
- `readings` (TEXT[]): Hiragana/katakana readings
- `readings_romaji` (TEXT[]): Romaji readings
- `stroke_paths` (JSONB): SVG path data for animations

---

## Architecture

### Navigation Flow
```
Home
├── ModeSelect
│   ├── CollectionList → LessonList → Practice → Summary
│   └── RoundSelect → Practice → Summary
├── Study (Kanji tab + Sentences tab)
│   └── KanjiDetail
└── Settings
```

### Services Layer
- **progress.js**: Kanji mastery engine, stats tracking
- **sentences.js**: Sentence queries (random, targeted, completed)
- **collections.js**: Collection/lesson management
- **kanjiDictionary.js**: Dictionary lookups
- **tts.js**: Google Cloud TTS integration
- **settings.js**: User preferences (AsyncStorage)

### Key Components
- **SnippetCard**: Interactive sentence display with tap-to-reveal
- **TypingInput**: Grading engine with animations
- **CircularProgress**: SVG progress rings
- **StrokeOrder**: Animated kanji stroke rendering
- **DropdownPicker**: Styled selection component

---

## Mastery System

### Grading Logic
```
Levenshtein Similarity:
  1.0    → ○ (Perfect)
  ≥0.8   → △ (Good)
  <0.8   → × (Wrong, no grade recorded)
```

### Mastery State Transitions
```
Initial → ○ (first correct)
○ + ○ → ○ (stays mastered)
○ + △ → △ (slight downgrade)
○ + × → × (needs practice)
△ + ○ → ○ (upgrade)
△ + △ → △ (learning)
× + ○ → ○ (mastered)
× + △ → △ (improving)
```

### Skip Behavior
- Increments `skip_count` only
- Does NOT increment `seen_count`
- Sets mastery to × (grey)
- Sentence becomes "weak" for drill targeting

---

## Practice Modes Explained

### 1. Collections (Structured Learning)
- Curated progressions like "N5 Foundation" or "Travel Essentials"
- Each collection has multiple lessons
- Sentences within lessons are **ordered** (no randomization)
- Complete lesson = all sentences get ○
- Progress tracked with circular indicators

### 2. Domain Practice (Free Exploration)
- Choose topic (Food & Drink, Technology, Travel, etc.)
- Optional subtopic filtering
- Random sentences from uncompleted pool
- Filter by JLPT level (Mixed, N5, N4, N3, N2, N1)
- Configure rounds: 5, 10, 15, or 20

### 3. Weak Kanji Drills
- Automatically identifies top 5 weak kanji:
  - `skip_count > 0` OR `seen_count < 3`
  - Sorted by (skip_count - seen_count) ratio
- Fetches random sentences containing those kanji
- Targeted practice to improve struggling areas

### 4. Sentence Re-practice
- Tap any sentence in Study → Sentences tab
- Single-sentence practice session
- Useful for perfecting previously "good" (△) answers

---

## Search Functionality

The **Study → Kanji** tab features intelligent search:

### Supported Queries
- **Kanji character**: 車
- **English meaning**: car, vehicle
- **Hiragana reading**: くるま
- **Katakana reading**: シャ
- **Romaji reading**: kuruma, sha

### How It Works
1. Searches kanji column for exact match
2. Calls `search_kanji_meanings()` RPC for meaning matches
3. Calls `search_kanji_readings()` RPC with:
   - Original query (romaji)
   - Hiragana-converted query (via wanakana)
4. Combines results, removes duplicates
5. Merges user progress data (seen/skip counts, mastery)

**Example**: Type "kuruma" → converts to "くるま" → finds 車 with both searches

**Note**: Make sure the `search_kanji_readings` function is created in your database (see Setup section).

---

## Text-to-Speech

Powered by Google Cloud Neural2 voices:
- **Female**: ja-JP-Neural2-B
- **Male**: ja-JP-Neural2-C

### Features
- Natural, human-like pronunciation
- Adjustable playback speed (0.5x - 2.0x)
- MP3 caching to FileSystem (reduces API calls)
- Plays in iOS silent mode
- Configurable in Settings

---

## Development Scripts

```bash
# Start development server
npm start

# Start on specific platform
npm run ios
npm run android
npm run web

# Generate sentences (requires Claude API key)
npm run generate

# Clear cache and restart
npm start -- --clear
```

---

## Project Structure

```
kanjii/
├── App.js                      # Root navigation setup
├── src/
│   ├── screens/                # 12 screen components
│   │   ├── HomeScreen.js
│   │   ├── ModeSelectScreen.js
│   │   ├── RoundSelectScreen.js
│   │   ├── CollectionListScreen.js
│   │   ├── LessonListScreen.js
│   │   ├── PracticeScreen.js
│   │   ├── SummaryScreen.js
│   │   ├── StudyScreen.js
│   │   ├── KanjiDetailScreen.js
│   │   └── SettingsScreen.js
│   ├── components/             # Reusable UI components
│   │   ├── SnippetCard.js
│   │   ├── TypingInput.js
│   │   ├── DropdownPicker.js
│   │   ├── CircularProgress.js
│   │   └── StrokeOrder.js
│   ├── services/               # Backend integration
│   │   ├── supabase.js
│   │   ├── progress.js
│   │   ├── sentences.js
│   │   ├── collections.js
│   │   ├── kanjiDictionary.js
│   │   ├── tts.js
│   │   └── settings.js
│   └── contexts/               # React Context providers
│       └── SettingsContext.js
├── supabase/                   # Database migrations
│   ├── schema.sql
│   ├── kanji_dictionary_part*.sql
│   ├── search_*.sql
│   └── add_*.sql
├── scripts/                    # Utility scripts
└── data/                       # Static data files
```

---

## Contributing

This is a personal learning project. If you'd like to contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - feel free to use this code for your own projects.

---

## Troubleshooting

### Search not working
Make sure you've created the `search_kanji_readings` function in your Supabase database:
```sql
CREATE OR REPLACE FUNCTION search_kanji_readings(search_query TEXT)
RETURNS TABLE (kanji TEXT, meanings TEXT[], readings TEXT[]) AS $$
BEGIN
  RETURN QUERY
  SELECT k.kanji, k.meanings, k.readings
  FROM kanji_dictionary k
  WHERE EXISTS (
    SELECT 1 FROM unnest(k.readings) r
    WHERE r ILIKE '%' || search_query || '%'
  ) OR EXISTS (
    SELECT 1 FROM unnest(k.readings_romaji) r
    WHERE r ILIKE '%' || search_query || '%'
  )
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
```

### TTS not working
Verify your Google Cloud API key is set correctly in `.env` and that the Text-to-Speech API is enabled in your Google Cloud project.

### Database connection issues
Check that your Supabase URL and anon key are correct in `.env`. The format should be:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Roadmap

### Planned Features
- [ ] Voice input practice (speech-to-text)
- [ ] Custom vocabulary lists
- [ ] Spaced repetition scheduling (SRS)
- [ ] Offline mode
- [ ] Achievement system
- [ ] Social features (share progress, compete with friends)
- [ ] More collections (Anime & Manga, Academic Japanese, etc.)
- [ ] Kanji writing practice with stroke recognition
- [ ] Grammar explanations
- [ ] Sentence breakdowns with word-by-word analysis

---

## Acknowledgments

- Kanji data sourced from [KanjiVG](https://kanjivg.tagaini.net/) and [KANJIDIC](http://www.edrdg.org/wiki/index.php/KANJIDIC_Project)
- Sentence generation powered by Claude AI
- Icons from @expo/vector-icons
- Japanese IME libraries: wanakana

---

## Support

For questions, issues, or feature requests, please open an issue on GitHub.

Happy learning! 頑張って！(ganbatte - do your best!)
