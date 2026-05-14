import { supabase } from './supabase';

/**
 * Fetch kanji definition from the dictionary
 * @param {string} kanji - Single kanji character
 * @returns {Promise<{kanji: string, meaning: string, readings: string[], strokePaths: array} | null>}
 */
export async function fetchKanjiDefinition(kanji) {
  const { data, error } = await supabase
    .from('kanji_dictionary')
    .select('*')
    .eq('kanji', kanji)
    .single();

  if (error || !data) {
    console.warn(`Kanji not found in dictionary: ${kanji}`);
    return null;
  }

  return {
    kanji: data.kanji,
    meanings: data.meanings || [],
    readings: data.readings || [],
    strokePaths: data.stroke_paths || [],
  };
}

/**
 * Fetch multiple kanji definitions at once
 * @param {string[]} kanjiChars - Array of kanji characters
 * @returns {Promise<Map<string, {meaning: string, readings: string[]}>>}
 */
export async function fetchKanjiDefinitions(kanjiChars) {
  if (!kanjiChars || kanjiChars.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('kanji_dictionary')
    .select('kanji, meanings, readings')
    .in('kanji', kanjiChars);

  if (error) {
    console.error('Error fetching kanji definitions:', error);
    return new Map();
  }

  const map = new Map();
  (data || []).forEach(k => {
    map.set(k.kanji, {
      meanings: k.meanings || [],
      readings: k.readings || [],
    });
  });

  return map;
}
