import { supabase } from './supabase';

/**
 * Get a smart sentence for Quick Play mode
 * - Calculates user's average difficulty from completed sentences
 * - Selects from curated content (lessons/collections) only
 * - Progressive difficulty matching user's current ability
 * - Pattern: Review(avg) → Review(easy) → New → Review(hard) → Challenge → repeat
 */
export async function getQuickPlaySentence(userId, recentSentenceIds = [], currentRound = 1) {
  try {
    // 1. Calculate user's current difficulty level (average of completed sentences)
    const userLevel = await calculateUserDifficultyLevel(userId);

    // 2. Determine sentence type based on pattern (cycles within session)
    const sentenceType = await determineSentenceType(userId, currentRound);

    // 3. Find a sentence matching the type and difficulty
    const sentence = await findProgressiveSentence(userId, userLevel, sentenceType, recentSentenceIds);

    return sentence;
  } catch (error) {
    console.error('Error getting quick play sentence:', error);
    throw error;
  }
}

/**
 * Calculate user's current difficulty level based on completed sentences
 * Returns average difficulty_score of all sentences they've completed
 */
async function calculateUserDifficultyLevel(userId) {
  // Get average difficulty_score from completed sentences
  const { data, error } = await supabase
    .from('user_progress')
    .select('sentence_id')
    .eq('user_id', userId);

  if (error || !data || data.length === 0) {
    // New user - start at beginner level (difficulty 1-2)
    return 1.5;
  }

  // Get difficulty scores for all completed sentences
  const sentenceIds = data.map(p => p.sentence_id);
  const { data: sentences, error: sentenceError } = await supabase
    .from('sentences')
    .select('difficulty_score')
    .in('id', sentenceIds)
    .not('difficulty_score', 'is', null);

  if (sentenceError || !sentences || sentences.length === 0) {
    // Fallback if no difficulty scores available
    return 1.5;
  }

  // Calculate average difficulty
  const totalDifficulty = sentences.reduce((sum, s) => sum + Number(s.difficulty_score), 0);
  const avgDifficulty = totalDifficulty / sentences.length;

  return avgDifficulty;
}

/**
 * Determine sentence type based on pattern:
 * 1st: review_average, 2nd: review_easy, 3rd: new, 4th: review_hard, 5th: challenge
 * Returns: 'review_average' | 'review_easy' | 'new' | 'review_hard' | 'challenge'
 * Uses currentRound to cycle through pattern within the session
 */
async function determineSentenceType(userId, currentRound = 1) {
  // Use current round to determine position in the 5-sentence pattern
  // This cycles through the pattern within the session (1→2→3→4→5→1→2...)
  const position = ((currentRound - 1) % 5) + 1;

  switch (position) {
    case 1: return 'review_average';
    case 2: return 'review_easy';
    case 3: return 'new';
    case 4: return 'review_hard';
    case 5: return 'challenge';
    default: return 'new';
  }
}

/**
 * Find a sentence matching difficulty from curated content (lessons/collections)
 * Sentence types (2-3x wider ranges for better variety):
 * - review_average: completed, closest to current level (±1.5)
 * - review_easy: completed, below current level (-3.0 to -0.5)
 * - new: uncompleted, around current level (±2.0)
 * - review_hard: completed, above current level (+0.5 to +2.5)
 * - challenge: uncompleted, harder than current level (+0.5 to +3.5)
 */
async function findProgressiveSentence(userId, userLevel, sentenceType, recentSentenceIds = []) {
  // Get completed sentence IDs
  const { data: completed } = await supabase
    .from('user_progress')
    .select('sentence_id')
    .eq('user_id', userId);

  const completedIds = completed ? completed.map(c => c.sentence_id) : [];

  // Determine if we're pulling from completed or new sentences
  const isReview = sentenceType === 'review_average' || sentenceType === 'review_easy' || sentenceType === 'review_hard';

  // Calculate difficulty range based on sentence type (2-3x wider for variety)
  let minDifficulty, maxDifficulty;

  switch (sentenceType) {
    case 'review_average':
      // Sentences closest to your average level
      minDifficulty = Math.max(1, userLevel - 1.5);
      maxDifficulty = userLevel + 1.5;
      break;
    case 'review_easy':
      // Easier sentences you've already done
      minDifficulty = Math.max(1, userLevel - 3.0);
      maxDifficulty = Math.max(1, userLevel - 0.5);
      break;
    case 'review_hard':
      // Harder sentences you've already done
      minDifficulty = userLevel + 0.5;
      maxDifficulty = userLevel + 2.5;
      break;
    case 'challenge':
      // New, harder sentences
      minDifficulty = userLevel + 0.5;
      maxDifficulty = userLevel + 3.5;
      break;
    case 'new':
    default:
      // New sentences around current level
      minDifficulty = Math.max(1, userLevel - 2.0);
      maxDifficulty = userLevel + 2.0;
      break;
  }

  // Query sentences directly with JOIN-like approach
  // Get sentences from lessons that match difficulty range
  const { data: lessonSentenceData, error: lessonError } = await supabase
    .from('lesson_sentences')
    .select(`
      sentence_id,
      sentences!inner (
        id,
        japanese,
        english,
        words,
        difficulty_score,
        domain,
        jlpt_level
      )
    `)
    .gte('sentences.difficulty_score', minDifficulty)
    .lte('sentences.difficulty_score', maxDifficulty)
    .not('sentences.difficulty_score', 'is', null)
    .limit(200);

  if (lessonError) {
    console.error('Lesson sentences query error:', lessonError);
    throw lessonError;
  }

  console.log(`[QuickPlay] Type: ${sentenceType}, Range: ${minDifficulty.toFixed(2)}-${maxDifficulty.toFixed(2)}`);
  console.log(`[QuickPlay] Query returned ${lessonSentenceData?.length || 0} lesson sentences`);
  console.log(`[QuickPlay] Completed IDs: ${completedIds.length}, Recent IDs: ${recentSentenceIds.length}`);

  // Transform the nested structure to flat sentence objects
  const allSentences = (lessonSentenceData || []).map(ls => ls.sentences).filter(s => s);
  console.log(`[QuickPlay] After transform: ${allSentences.length} sentences`);

  // Filter based on sentence type
  let sentences;
  if (isReview) {
    // For reviews: only include completed sentences
    sentences = allSentences.filter(s => completedIds.includes(s.id));
    console.log(`[QuickPlay] Review filter: ${sentences.length} completed sentences in range`);
  } else {
    // For new/challenge: only include uncompleted sentences
    sentences = allSentences.filter(s => !completedIds.includes(s.id));
    console.log(`[QuickPlay] New filter: ${sentences.length} UNcompleted sentences in range`);
  }

  // Filter out recently shown sentences (must have 2+ sentences in between)
  if (recentSentenceIds.length > 0) {
    const beforeRecent = sentences.length;
    sentences = sentences.filter(s => !recentSentenceIds.includes(s.id));
    console.log(`[QuickPlay] Recent filter: ${beforeRecent} → ${sentences.length} (removed ${beforeRecent - sentences.length})`);
  }

  if (!sentences || sentences.length === 0) {
    console.log(`[QuickPlay] ⚠️  No sentences found! Hitting fallback...`);
    // Fallback strategy based on sentence type
    if (isReview) {
      // If looking for review but none found, fall back to new sentence
      console.log(`[QuickPlay] Fallback: review → new`);
      return findProgressiveSentence(userId, userLevel, 'new', recentSentenceIds);
    }

    if (sentenceType === 'challenge') {
      // If no challenge sentences, try regular new
      console.log(`[QuickPlay] Fallback: challenge → new`);
      return findProgressiveSentence(userId, userLevel, 'new', recentSentenceIds);
    }

    // Ultimate fallback: any lesson sentence with lowest difficulty (new only)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('lesson_sentences')
      .select(`
        sentence_id,
        sentences!inner (
          id,
          japanese,
          english,
          words,
          difficulty_score,
          domain,
          jlpt_level
        )
      `)
      .not('sentences.difficulty_score', 'is', null)
      .order('sentences.difficulty_score', { ascending: true })
      .limit(50);

    if (fallbackError) {
      throw fallbackError;
    }

    const fallbackSentences = (fallbackData || [])
      .map(ls => ls.sentences)
      .filter(s => s && !completedIds.includes(s.id));

    if (fallbackSentences.length > 0) {
      return fallbackSentences[Math.floor(Math.random() * fallbackSentences.length)];
    }

    throw new Error('No sentences available with difficulty scores');
  }

  // Pick random sentence from candidates
  const selected = sentences[Math.floor(Math.random() * sentences.length)];
  console.log(`[QuickPlay] ✓ Selected: "${selected.japanese}" (difficulty: ${selected.difficulty_score})`);
  return selected;
}
