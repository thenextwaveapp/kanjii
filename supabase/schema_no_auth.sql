-- ============================================================
-- Kanjii Database Schema (No Auth Version)
-- Run this in your Supabase SQL editor to set up all tables
-- ============================================================

-- Drop existing tables if you want a fresh start
drop table if exists user_progress cascade;
drop table if exists user_kanji cascade;
drop table if exists user_stats cascade;
drop table if exists sentences cascade;

-- Sentence library (populated by Claude, reused across all users)
create table if not exists sentences (
  id uuid primary key default gen_random_uuid(),
  japanese text not null,
  english text not null,
  words jsonb not null default '[]',
  difficulty int not null default 1,
  jlpt_level text check (jlpt_level in ('N5','N4','N3','N2','N1')),
  domain text,
  created_at timestamptz not null default now()
);

-- One row per sentence a user has completed
create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,  -- Simple text ID, no auth constraint
  sentence_id uuid not null references sentences on delete cascade,
  attempts int not null default 1,
  completed_at timestamptz not null default now(),
  unique (user_id, sentence_id)
);

-- Kanji acquisition: one row per kanji character per user
create table if not exists user_kanji (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,  -- Simple text ID, no auth constraint
  kanji text not null,
  readings jsonb not null default '[]',
  meanings jsonb not null default '[]',
  jlpt_level text check (jlpt_level in ('N5','N4','N3','N2','N1','unknown')),
  seen_count int not null default 0,  -- times written correctly in a completed round
  skip_count int not null default 0,  -- times the sentence containing this kanji was skipped
  mastery text check (mastery in ('○', '△', '×')),  -- ○=mastered(blue) △=learning(green) ×=not-learned(grey)
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, kanji)
);

-- Denormalised stats for fast profile reads
create table if not exists user_stats (
  user_id text primary key,  -- Simple text ID, no auth constraint
  total_correct int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  kanji_count int not null default 0,
  last_activity_date date
);

-- ============================================================
-- Row-level security: DISABLED (no auth)
-- All queries are allowed
-- ============================================================

alter table user_progress enable row level security;
alter table user_kanji enable row level security;
alter table user_stats enable row level security;
alter table sentences enable row level security;

-- Allow all operations for everyone (since no auth)
create policy "allow_all_user_progress" on user_progress
  for all using (true) with check (true);

create policy "allow_all_user_kanji" on user_kanji
  for all using (true) with check (true);

create policy "allow_all_user_stats" on user_stats
  for all using (true) with check (true);

create policy "allow_all_sentences" on sentences
  for all using (true) with check (true);

-- ============================================================
-- Indexes for performance
-- ============================================================

create index if not exists idx_user_progress_user_id on user_progress(user_id);
create index if not exists idx_user_kanji_user_id on user_kanji(user_id);
create index if not exists idx_user_kanji_mastery on user_kanji(mastery);
create index if not exists idx_sentences_difficulty on sentences(difficulty);
create index if not exists idx_sentences_jlpt on sentences(jlpt_level);
