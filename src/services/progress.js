import { supabase } from './supabase';

const KANJI_REGEX = /[\u4E00-\u9FFF\u3400-\u4DBF]/g;

function extractKanjiChars(words) {
  const map = {};
  for (const w of words || []) {
    const chars = w.word.match(KANJI_REGEX) || [];
    for (const ch of chars) {
      if (!map[ch]) map[ch] = { readings: [], meanings: [] };
      if (w.furigana && !map[ch].readings.includes(w.furigana)) map[ch].readings.push(w.furigana);
      if (w.meaning && !map[ch].meanings.includes(w.meaning)) map[ch].meanings.push(w.meaning);
    }
  }
  return map;
}

// Record a correctly completed round — kanji seen_count increments
export async function recordCompletion({ userId, sentenceId, words, attempts }) {
  const points = attempts <= 1 ? 10 : 5;
  const today = new Date().toISOString().slice(0, 10);

  await Promise.all([
    sentenceId ? upsertProgress(userId, sentenceId, attempts) : Promise.resolve(),
    updateKanjiSeen(userId, words),
    upsertStats(userId, points, today),
  ]);
}

// Record a skipped round — kanji skip_count increments, NOT seen_count
export async function recordSkip({ userId, words }) {
  const kanjiMap = extractKanjiChars(words);
  for (const [kanji, { readings, meanings }] of Object.entries(kanjiMap)) {
    const { data: existing } = await supabase
      .from('user_kanji')
      .select('id, skip_count, readings, meanings')
      .eq('user_id', userId)
      .eq('kanji', kanji)
      .single();

    if (existing) {
      await supabase
        .from('user_kanji')
        .update({ skip_count: existing.skip_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('user_kanji').insert({
        user_id: userId,
        kanji,
        readings,
        meanings,
        jlpt_level: 'unknown',
        seen_count: 0,
        skip_count: 1,
      });
    }
  }
}

// Returns list of kanji that are NEW this session (first_seen_at is today)
export async function getNewKanjiSince(userId, isoTimestamp) {
  const { data } = await supabase
    .from('user_kanji')
    .select('kanji, meanings, readings')
    .eq('user_id', userId)
    .gte('first_seen_at', isoTimestamp);
  return data || [];
}

async function upsertProgress(userId, sentenceId, attempts) {
  await supabase.from('user_progress').upsert(
    { user_id: userId, sentence_id: sentenceId, attempts, completed_at: new Date().toISOString() },
    { onConflict: 'user_id,sentence_id' }
  );
}

async function updateKanjiSeen(userId, words) {
  const kanjiMap = extractKanjiChars(words);
  for (const [kanji, { readings, meanings }] of Object.entries(kanjiMap)) {
    const { data: existing } = await supabase
      .from('user_kanji')
      .select('id, seen_count, readings, meanings')
      .eq('user_id', userId)
      .eq('kanji', kanji)
      .single();

    if (existing) {
      const mergedReadings = [...new Set([...(existing.readings || []), ...readings])];
      const mergedMeanings = [...new Set([...(existing.meanings || []), ...meanings])];
      await supabase.from('user_kanji').update({
        seen_count: existing.seen_count + 1,
        readings: mergedReadings,
        meanings: mergedMeanings,
        last_seen_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('user_kanji').insert({
        user_id: userId,
        kanji,
        readings,
        meanings,
        jlpt_level: 'unknown',
        seen_count: 1,
        skip_count: 0,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      });
    }
  }
}

async function upsertStats(userId, points, today) {
  const [{ data: existing }, { count: kanjiCount }] = await Promise.all([
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    supabase.from('user_kanji').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gt('seen_count', 0),
  ]);

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const totalKanji = kanjiCount ?? 0;

  if (!existing) {
    await supabase.from('user_stats').insert({
      user_id: userId,
      total_correct: 1,
      current_streak: 1,
      longest_streak: 1,
      kanji_count: totalKanji,
      last_activity_date: today,
    });
    return;
  }

  let newStreak = existing.current_streak;
  if (existing.last_activity_date === yesterday) newStreak += 1;
  else if (existing.last_activity_date !== today) newStreak = 1;

  await supabase.from('user_stats').update({
    total_correct: existing.total_correct + 1,
    current_streak: newStreak,
    longest_streak: Math.max(existing.longest_streak, newStreak),
    kanji_count: totalKanji,
    last_activity_date: today,
  }).eq('user_id', userId);
}

export async function fetchKanjiDetail(userId, kanji) {
  const [{ data: kanjiData }, { data: sentenceRows }] = await Promise.all([
    supabase.from('user_kanji').select('*').eq('user_id', userId).eq('kanji', kanji).single(),
    supabase.from('user_progress').select('attempts, completed_at, sentences(*)').eq('user_id', userId),
  ]);

  const sentences = (sentenceRows || [])
    .map((r) => ({ ...r.sentences, attempts: r.attempts, completed_at: r.completed_at }))
    .filter((s) => s?.japanese?.includes(kanji));

  return { kanjiData: kanjiData || null, sentences };
}

export async function fetchUserSentences(userId) {
  const { data } = await supabase
    .from('user_progress')
    .select('attempts, completed_at, sentences(*)')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(60);
  return (data || [])
    .map((row) => ({ ...row.sentences, attempts: row.attempts, completed_at: row.completed_at }))
    .filter((s) => s?.id);
}

export async function fetchStats(userId) {
  const { data } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
  return data;
}

export async function fetchKanji(userId) {
  const { data } = await supabase
    .from('user_kanji')
    .select('*')
    .eq('user_id', userId)
    .order('seen_count', { ascending: false });
  return data || [];
}
