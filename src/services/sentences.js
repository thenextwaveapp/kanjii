import { supabase } from './supabase';

// Fetch sentence from database only
export async function fetchSentence(userId, difficulty = 'Mixed', domain = 'Any') {
  // Get user's completed sentences
  const { data: doneRows } = await supabase
    .from('user_progress')
    .select('sentence_id')
    .eq('user_id', userId);

  const doneIds = (doneRows || []).map((r) => r.sentence_id);

  // Query for available sentences
  let query = supabase
    .from('sentences')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (doneIds.length > 0) {
    query = query.not('id', 'in', `(${doneIds.join(',')})`);
  }
  if (difficulty !== 'Mixed') {
    query = query.eq('jlpt_level', difficulty);
  }
  if (domain !== 'Any') {
    // Match exact domain OR any subtopic under it (domain starts with "Topic:")
    query = query.or(`domain.eq.${domain},domain.like.${domain}:%`);
  }

  const { data: rows } = await query;

  // Return random sentence or null if none available
  if (rows && rows.length > 0) {
    return rows[Math.floor(Math.random() * rows.length)];
  }

  return null;
}

// Targeted drill for weak kanji
export async function fetchTargetedSentence(focusKanji = []) {
  if (!focusKanji || focusKanji.length === 0) return null;

  // Build query to find sentences containing any of the focus kanji
  const kanji = focusKanji[0]; // Get first kanji
  const { data: rows } = await supabase
    .from('sentences')
    .select('*')
    .ilike('japanese', `%${kanji}%`)
    .limit(100);

  if (!rows || rows.length === 0) return null;

  // Return random sentence from matches
  return rows[Math.floor(Math.random() * rows.length)];
}
