import { supabase } from './supabase';
import { fetchKanjiDefinitions } from './kanjiDictionary';

const KANJI_REGEX = /[\u4E00-\u9FFF\u3400-\u4DBF]/g;

function extractKanjiChars(words) {
  const map = {};
  for (const w of words || []) {
    const chars = w.word.match(KANJI_REGEX) || [];
    for (const ch of chars) {
      if (!map[ch]) map[ch] = { wordMeanings: [] };
      // Collect word meanings as context
      if (w.meaning && !map[ch].wordMeanings.includes(w.meaning)) {
        map[ch].wordMeanings.push(w.meaning);
      }
    }
  }
  return map;
}

// Record a correctly completed round — kanji seen_count increments
export async function recordCompletion({ userId, sentenceId, words, attempts, grade, jlptLevel = null }) {
  const points = attempts <= 1 ? 10 : 5;
  const today = new Date().toISOString().slice(0, 10);

  await Promise.all([
    sentenceId ? upsertProgress(userId, sentenceId, attempts, grade) : Promise.resolve(),
    updateKanjiSeen(userId, words, grade, jlptLevel),
    upsertStats(userId, points, today),
  ]);
}

// Record a skipped round — kanji skip_count increments, NOT seen_count
export async function recordSkip({ userId, words, jlptLevel = null }) {
  const kanjiMap = extractKanjiChars(words);
  const kanjiChars = Object.keys(kanjiMap);
  const kanjiDefs = await fetchKanjiDefinitions(kanjiChars);

  for (const kanji of kanjiChars) {
    const def = kanjiDefs.get(kanji);
    if (!def) {
      console.warn(`Skipping kanji without dictionary entry: ${kanji}`);
      continue;
    }

    const wordMeanings = kanjiMap[kanji].wordMeanings;

    const { data: existing } = await supabase
      .from('user_kanji')
      .select('id, skip_count, readings, meanings, mastery, jlpt_level')
      .eq('user_id', userId)
      .eq('kanji', kanji)
      .single();

    if (existing) {
      // Update level if we have one and existing is unknown
      let updatedLevel = existing.jlpt_level;
      if (jlptLevel && (!existing.jlpt_level || existing.jlpt_level === 'unknown')) {
        updatedLevel = jlptLevel;
      }

      // Merge word meanings (dictionary meaning stays first)
      const existingMeanings = existing.meanings || [];
      const newWordMeanings = wordMeanings.filter(m => !existingMeanings.includes(m));
      const mergedMeanings = [...existingMeanings, ...newWordMeanings];

      await supabase
        .from('user_kanji')
        .update({
          skip_count: existing.skip_count + 1,
          meanings: mergedMeanings,
          mastery: '×', // Skip = × (batsu, grey)
          jlpt_level: updatedLevel,
        })
        .eq('id', existing.id);
    } else {
      // Dictionary meanings first, then word meanings
      const meanings = [...def.meanings, ...wordMeanings];

      await supabase.from('user_kanji').insert({
        user_id: userId,
        kanji,
        readings: def.readings,
        meanings,
        jlpt_level: jlptLevel || 'unknown',
        seen_count: 0,
        skip_count: 1,
        mastery: '×', // Skip = × (batsu, grey)
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

async function upsertProgress(userId, sentenceId, attempts, grade) {
  // Fetch existing progress to determine best grade
  const { data: existing } = await supabase
    .from('user_progress')
    .select('best_grade, practice_count')
    .eq('user_id', userId)
    .eq('sentence_id', sentenceId)
    .single();

  let bestGrade = grade;
  let practiceCount = 1;

  if (existing) {
    practiceCount = (existing.practice_count || 0) + 1;

    // Determine best grade: ○ > △ > ×
    if (existing.best_grade === '○' || grade === '○') {
      bestGrade = '○';
    } else if (existing.best_grade === '△' || grade === '△') {
      bestGrade = '△';
    } else {
      bestGrade = '×';
    }
  }

  await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      sentence_id: sentenceId,
      attempts,
      completed_at: new Date().toISOString(),
      best_grade: bestGrade,
      practice_count: practiceCount,
      last_practiced_at: new Date().toISOString()
    },
    { onConflict: 'user_id,sentence_id' }
  );
}

async function updateKanjiSeen(userId, words, grade, jlptLevel = null) {
  const kanjiMap = extractKanjiChars(words);
  const kanjiChars = Object.keys(kanjiMap);
  const kanjiDefs = await fetchKanjiDefinitions(kanjiChars);

  for (const kanji of kanjiChars) {
    const def = kanjiDefs.get(kanji);
    if (!def) {
      console.warn(`Skipping kanji without dictionary entry: ${kanji}`);
      continue;
    }

    const wordMeanings = kanjiMap[kanji].wordMeanings;

    const { data: existing } = await supabase
      .from('user_kanji')
      .select('id, seen_count, readings, meanings, mastery, jlpt_level')
      .eq('user_id', userId)
      .eq('kanji', kanji)
      .single();

    // Determine new mastery level
    let newMastery = grade;
    if (existing?.mastery) {
      // Upgrade logic:
      // ○ always stays ○ (unless you get × on it, then downgrade)
      // △ can upgrade to ○
      // × can upgrade to △ or ○
      if (existing.mastery === '○' && grade === '○') {
        newMastery = '○';
      } else if (existing.mastery === '○' && grade !== '○') {
        newMastery = grade; // Downgrade if performance drops
      } else if (grade === '○') {
        newMastery = '○'; // Always upgrade to ○ if you get it
      } else if (existing.mastery === '×' && grade === '△') {
        newMastery = '△'; // Upgrade from × to △
      } else if (existing.mastery === '△' && grade === '×') {
        newMastery = '△'; // Keep △ even if you get × once
      } else {
        newMastery = grade; // Default to current grade
      }
    }

    if (existing) {
      // Update JLPT level if we have one and it's lower (more basic) than existing
      let updatedLevel = existing.jlpt_level;
      if (jlptLevel && (!existing.jlpt_level || existing.jlpt_level === 'unknown')) {
        updatedLevel = jlptLevel;
      } else if (jlptLevel && existing.jlpt_level) {
        // Keep the lower (more basic) level: N5 < N4 < N3 < N2 < N1
        const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
        const currentIdx = levels.indexOf(existing.jlpt_level);
        const newIdx = levels.indexOf(jlptLevel);
        if (newIdx >= 0 && (currentIdx < 0 || newIdx < currentIdx)) {
          updatedLevel = jlptLevel;
        }
      }

      // Merge word meanings (keep existing meanings, add new ones)
      const existingMeanings = existing.meanings || [];
      const newWordMeanings = wordMeanings.filter(m => !existingMeanings.includes(m));
      const mergedMeanings = [...existingMeanings, ...newWordMeanings];

      await supabase.from('user_kanji').update({
        seen_count: existing.seen_count + 1,
        meanings: mergedMeanings,
        mastery: newMastery,
        jlpt_level: updatedLevel,
        last_seen_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      // Dictionary meanings first, then word meanings
      const meanings = [...def.meanings, ...wordMeanings];

      await supabase.from('user_kanji').insert({
        user_id: userId,
        kanji,
        readings: def.readings,
        meanings,
        jlpt_level: jlptLevel || 'unknown',
        seen_count: 1,
        skip_count: 0,
        mastery: newMastery,
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
  const [{ data: kanjiData }, { data: dictData }, { data: sentenceRows }, { data: exampleSentences }] = await Promise.all([
    supabase.from('user_kanji').select('*').eq('user_id', userId).eq('kanji', kanji).single(),
    supabase.from('kanji_dictionary').select('*').eq('kanji', kanji).single(),
    supabase.from('user_progress').select('attempts, completed_at, sentences(*)').eq('user_id', userId),
    supabase.from('sentences').select('*').ilike('japanese', `%${kanji}%`).limit(10),
  ]);

  // Merge user progress with dictionary data
  let mergedData = null;
  if (kanjiData) {
    // User has practiced this kanji - use their data
    mergedData = {
      ...kanjiData,
      // Always include dictionary readings/meanings separately
      dictReadings: dictData?.readings || [],
      dictMeanings: dictData?.meanings || [],
    };
  } else if (dictData) {
    // New kanji - use dictionary data with default stats
    mergedData = {
      kanji: dictData.kanji,
      meanings: dictData.meanings || [],
      readings: dictData.readings || [],
      dictReadings: dictData.readings || [],
      dictMeanings: dictData.meanings || [],
      jlpt_level: 'unknown',
      seen_count: 0,
      skip_count: 0,
      mastery: null,
    };
  }

  const userSentences = (sentenceRows || [])
    .map((r) => ({ ...r.sentences, attempts: r.attempts, completed_at: r.completed_at }))
    .filter((s) => s?.japanese?.includes(kanji));

  // Extract unique words containing this kanji
  const wordsSet = new Set();
  const exampleWords = [];

  // First from user sentences
  userSentences.forEach(s => {
    (s.words || []).forEach(w => {
      if (w.word?.includes(kanji) && !wordsSet.has(w.word)) {
        wordsSet.add(w.word);
        exampleWords.push({
          word: w.word,
          furigana: w.furigana,
          meaning: w.meaning
        });
      }
    });
  });

  // Then from example sentences if needed
  if (exampleWords.length < 5) {
    (exampleSentences || []).forEach(s => {
      (s.words || []).forEach(w => {
        if (w.word?.includes(kanji) && !wordsSet.has(w.word) && exampleWords.length < 10) {
          wordsSet.add(w.word);
          exampleWords.push({
            word: w.word,
            furigana: w.furigana,
            meaning: w.meaning
          });
        }
      });
    });
  }

  // Add example words to merged data
  if (mergedData) {
    mergedData.exampleWords = exampleWords.slice(0, 10);
  }

  return {
    kanjiData: mergedData,
    sentences: userSentences,
    exampleSentences: (exampleSentences || []).filter(s => !userSentences.find(us => us.id === s.id))
  };
}

export async function fetchUserSentences(userId) {
  const { data } = await supabase
    .from('user_progress')
    .select('attempts, completed_at, best_grade, practice_count, last_practiced_at, sentences(*)')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(60);

  const sentences = (data || [])
    .map((row) => ({
      ...row.sentences,
      attempts: row.attempts,
      completed_at: row.completed_at,
      best_grade: row.best_grade,
      practice_count: row.practice_count,
      last_practiced_at: row.last_practiced_at
    }))
    .filter((s) => s?.id);

  // Fetch list membership for all sentences
  if (sentences.length > 0) {
    const sentenceIds = sentences.map(s => s.id);
    const { data: listItems } = await supabase
      .from('sentence_list_items')
      .select('sentence_id, list_id')
      .in('sentence_id', sentenceIds);

    // Add listIds to each sentence
    sentences.forEach(s => {
      s.listIds = (listItems || [])
        .filter(item => item.sentence_id === s.id)
        .map(item => item.list_id);
    });
  }

  return sentences;
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

  if (!data || data.length === 0) return [];

  // Fetch example words and dictionary data for each kanji
  const kanjiList = data.map(k => k.kanji);

  // Fetch sentences
  const { data: sentences } = await supabase.from('sentences').select('words').limit(500);

  // Fetch dictionary data in chunks to avoid .in() limits
  const chunkSize = 100;
  const dictDataChunks = [];
  for (let i = 0; i < kanjiList.length; i += chunkSize) {
    const chunk = kanjiList.slice(i, i + chunkSize);
    const { data: chunkData } = await supabase
      .from('kanji_dictionary')
      .select('kanji, readings, meanings')
      .in('kanji', chunk);
    if (chunkData) {
      dictDataChunks.push(...chunkData);
    }
  }

  // Build a map of kanji -> dictionary data
  const dictMap = new Map(dictDataChunks.map(d => [d.kanji, d]));

  // Build a map of kanji -> example words
  const exampleWordsMap = {};

  kanjiList.forEach(kanji => {
    exampleWordsMap[kanji] = [];
    const wordsSet = new Set();

    (sentences || []).forEach(s => {
      (s.words || []).forEach(w => {
        if (w.word?.includes(kanji) &&
            !wordsSet.has(w.word) &&
            exampleWordsMap[kanji].length < 3) {
          wordsSet.add(w.word);
          exampleWordsMap[kanji].push({
            word: w.word,
            furigana: w.furigana,
            meaning: w.meaning
          });
        }
      });
    });
  });

  // Add exampleWords and dictionary data to each kanji
  return data.map(k => {
    const dict = dictMap.get(k.kanji);
    // Filter out null/undefined/empty readings
    const readings = dict?.readings || [];
    const filteredReadings = Array.isArray(readings)
      ? readings.filter(r => r && typeof r === 'string' && r.trim())
      : [];
    const meanings = dict?.meanings || [];
    const filteredMeanings = Array.isArray(meanings)
      ? meanings.filter(m => m && typeof m === 'string' && m.trim())
      : [];

    return {
      ...k,
      exampleWords: exampleWordsMap[k.kanji] || [],
      dictReadings: filteredReadings,
      dictMeanings: filteredMeanings
    };
  });
}
