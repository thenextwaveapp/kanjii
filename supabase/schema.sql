-- ============================================================
-- Kanjii Database Schema
-- Run this in your Supabase SQL editor to set up all tables
-- ============================================================

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
  user_id uuid not null references auth.users on delete cascade,
  sentence_id uuid not null references sentences on delete cascade,
  attempts int not null default 1,
  completed_at timestamptz not null default now(),
  unique (user_id, sentence_id)
);

-- Kanji acquisition: one row per kanji character per user
create table if not exists user_kanji (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kanji text not null,
  readings jsonb not null default '[]',
  meanings jsonb not null default '[]',
  jlpt_level text check (jlpt_level in ('N5','N4','N3','N2','N1','unknown')),
  seen_count int not null default 0,  -- times written correctly in a completed round
  skip_count int not null default 0,  -- times the sentence containing this kanji was skipped
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, kanji)
);

-- Denormalised stats for fast profile reads
create table if not exists user_stats (
  user_id uuid primary key references auth.users on delete cascade,
  total_correct int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  kanji_count int not null default 0,
  last_activity_date date
);

-- ============================================================
-- Row-level security: users can only touch their own rows
-- ============================================================

alter table user_progress enable row level security;
alter table user_kanji enable row level security;
alter table user_stats enable row level security;

create policy "user_progress_self" on user_progress
  for all using (auth.uid() = user_id);

create policy "user_kanji_self" on user_kanji
  for all using (auth.uid() = user_id);

create policy "user_stats_self" on user_stats
  for all using (auth.uid() = user_id);

-- sentences are public read (no auth required to fetch a sentence)
alter table sentences enable row level security;
create policy "sentences_read" on sentences
  for select using (true);
create policy "sentences_insert" on sentences
  for insert with check (true);
