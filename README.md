# Kanjii

Japanese digital literacy.

Kanjii teaches you to read and write Japanese the way Japanese people actually do it — through real content, on topics you care about, using the same tools they use every day.

---

## What it teaches

There are two skills that define Japanese digital literacy in 2026: reading real Japanese as it appears in the wild, and writing Japanese phonetically through an IME and selecting the correct kanji from candidates. Every person in Japan does both of these every time they pick up their phone. No other app teaches either of them systematically. Kanjii does both, together, in a single loop.

---

## How it works

You select a collection or a domain and begin a practice session. A real Japanese sentence appears on screen. You tap kanji words to reveal furigana readings and meanings. You type the full sentence using a Japanese keyboard — kana, romaji, or speech input, whichever you prefer. If your input matches the sentence, it is logged, the kanji are recorded in your personal ledger, and the next sentence loads. If you skip, that is recorded too.

At the end of each session a summary shows new kanji encountered, time taken, and a round-by-round breakdown. You return to the collection screen, not the home dashboard, so you stay in the practice flow.

---

## The four modes

**Read & Write** — The core loop. A sentence is presented. You read it with furigana assistance and type it in full. This is the default mode.

**Listen & Write** — The sentence is hidden. You hear it spoken aloud and type what you hear. You can replay as many times as you need. The sentence is revealed after you submit. Same validation, same kanji tracking.

**Input method** — Kanjii is input-agnostic. The app validates text against text. How you produce that text — kana keyboard, romaji keyboard, or speech-to-text — is your choice and changes nothing about what is tracked or measured.

---

## Collections

Collections are curated sets of sentences built around a specific purpose. They are the fastest way to make meaningful progress on a goal.

Examples include N5 Foundation, Travel Essentials, Top 500 Words, Business Japanese, and Anime Japanese. Each collection has a completion percentage derived from the mastery state of the kanji within it. When you practice from a collection, the app sequences sentences toward your weakest kanji first.

You can work through multiple collections simultaneously. Progress in one collection counts toward all others — kanji mastery is global, not siloed.

---

## Domains

Kanjii's sentence library spans 21 domains covering the full scope of human life in Japanese — from Daily Life and Food & Drink to Technology & Internet, News & Society, and Relationships & Romance. Each domain contains multiple subdomains with sentences sourced from real Japanese content and tagged by JLPT difficulty from N5 to N1.

Domain mode gives you free control over what you practice. Select a domain, subdomain, difficulty, and number of rounds and the app draws from that slice of the library, biased toward kanji you have not yet mastered.

---

## Mastery

Every kanji you encounter is tracked in a personal kanji ledger. Mastery is calculated from how many times you have correctly typed a sentence containing that kanji, how often you have skipped it, and how recently you encountered it. Kanji move through four states — encountered, familiar, mastered — and fade if not reviewed over time.

Mastery is honest. A kanji only counts as encountered when you type it correctly. Skipped kanji are visible in your ledger as a transparent record of what you have avoided.

Your mastery state flows through everything. Collection completion percentages, domain familiarity percentages, and your JLPT horizon — the proportion of each level's kanji you have encountered — are all derived from the same underlying data.

---

## Progress

The home screen reflects where you actually are. Active collections with completion percentages. Total kanji encountered. Current and longest streak. JLPT horizon across N5 to N1.

The Study screen has two tabs. Kanji shows your full personal ledger with mastery state and filters for mastered and needs work. Sentences shows every sentence you have completed, available for re-practice at any time.

There are no points, no leagues, and no hearts. Progress in Kanjii is a record of what you have done, not a reward for showing up.

---

## Content

Kanjii's sentence library is built on real Japanese content — social media posts, articles, subtitles, and everyday digital communication. Sentences are curated, tagged by domain and JLPT level, and reflect how Japanese is actually written and read in 2026, not how it is taught in textbooks.

---

## Stack

- React Native with Expo
- Supabase — authentication, database, user progress
- Claude AI — conversational learning assistance
- Google OAuth
- expo-speech for text-to-speech
- Dark UI throughout — #0A0A0A background, #E85D3A orange accent

---

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (create `.env` file):
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   CLAUDE_API_KEY=your_claude_api_key
   ```

4. Run the app:
   ```bash
   npx expo start
   ```

5. Use the Expo Go app on your device or run on a simulator

---

## Database Setup

The Supabase schema and starter data are available in the `supabase/` directory:
- `schema.sql` — database structure
- `tokyo-starter-pack.sql` — initial sentence collection
