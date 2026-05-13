import { supabase } from './supabase';
import { generateSnippet } from './claude';

// Targeted drill — generate a sentence Claude must weave the given kanji into
export async function fetchTargetedSentence(focusKanji = []) {
  const snippet = await generateSnippet('Mixed', 'Any', focusKanji);
  const { data: inserted, error } = await supabase
    .from('sentences')
    .insert({
      japanese: snippet.japanese,
      english: snippet.english,
      words: snippet.words,
      jlpt_level: null,
      domain: null,
    })
    .select()
    .single();

  if (error) return { ...snippet, id: null };
  return inserted;
}

export async function fetchSentence(userId, difficulty = 'Mixed', domain = 'Any') {
  const { data: doneRows } = await supabase
    .from('user_progress')
    .select('sentence_id')
    .eq('user_id', userId);

  const doneIds = (doneRows || []).map((r) => r.sentence_id);

  let query = supabase.from('sentences').select('*').order('created_at', { ascending: false }).limit(20);
  if (doneIds.length > 0) {
    query = query.not('id', 'in', `(${doneIds.join(',')})`);
  }
  if (difficulty !== 'Mixed') query = query.eq('jlpt_level', difficulty);
  if (domain !== 'Any') query = query.eq('domain', domain);

  const { data: rows } = await query;

  if (rows && rows.length > 0) return rows[Math.floor(Math.random() * rows.length)];

  // Fall back to Claude
  const snippet = await generateSnippet(difficulty, domain);
  const { data: inserted, error } = await supabase
    .from('sentences')
    .insert({
      japanese: snippet.japanese,
      english: snippet.english,
      words: snippet.words,
      jlpt_level: difficulty !== 'Mixed' ? difficulty : null,
      domain: domain !== 'Any' ? domain : null,
    })
    .select()
    .single();

  if (error) return { ...snippet, id: null };
  return inserted;
}
