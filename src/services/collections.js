import { supabase } from './supabase';
import { fetchWithCache, invalidatePattern } from './cache';

/**
 * Fetch all collections with lesson counts
 */
export async function fetchCollections() {
  return fetchWithCache('collections', async () => {
  const { data: collections, error } = await supabase
    .from('collections')
    .select(`
      id,
      name,
      description,
      emoji,
      level,
      order_index
    `)
    .order('order_index');

  if (error) throw error;

  // Get lesson counts for each collection (only lessons with sentences)
  const collectionsWithCounts = await Promise.all(
    (collections || []).map(async (collection) => {
      // Get all lessons for this collection
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('collection_id', collection.id);

      if (!lessons || lessons.length === 0) {
        return {
          ...collection,
          lessonCount: 0,
        };
      }

      // Count how many of these lessons have sentences
      const lessonIds = lessons.map(l => l.id);
      const lessonsWithSentences = await Promise.all(
        lessonIds.map(async (lessonId) => {
          const { count } = await supabase
            .from('lesson_sentences')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lessonId);
          return count > 0;
        })
      );

      const populatedLessonCount = lessonsWithSentences.filter(Boolean).length;

      return {
        ...collection,
        lessonCount: populatedLessonCount,
      };
    })
  );

  // Filter out collections with no populated lessons
    return collectionsWithCounts.filter(c => c.lessonCount > 0);
  }, 10 * 60 * 1000); // Cache for 10 minutes
}

/**
 * Fetch lessons for a collection with progress
 */
export async function fetchLessons(collectionId, userId) {
  const cacheKey = `lessons:${collectionId}:${userId}`;
  return fetchWithCache(cacheKey, async () => {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      name,
      description,
      order_index
    `)
    .eq('collection_id', collectionId)
    .order('order_index');

  if (error) throw error;

  // Get sentence counts and progress for each lesson
  const lessonsWithProgress = await Promise.all(
    (lessons || []).map(async (lesson) => {
      // Get sentence count
      const { count: sentenceCount } = await supabase
        .from('lesson_sentences')
        .select('*', { count: 'exact', head: true })
        .eq('lesson_id', lesson.id);

      // Get user progress
      const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('mastered_count, good_count, total_count, completed_at')
        .eq('lesson_id', lesson.id)
        .eq('user_id', userId)
        .maybeSingle();

      return {
        ...lesson,
        sentenceCount: sentenceCount || 0,
        masteredCount: progress?.mastered_count || 0,
        goodCount: progress?.good_count || 0,
        totalCount: progress?.total_count || sentenceCount || 0,
        completedAt: progress?.completed_at,
        isComplete: progress?.completed_at != null,
      };
    })
  );

    return lessonsWithProgress;
  }, 5 * 60 * 1000); // Cache for 5 minutes
}

/**
 * Fetch sentences for a lesson in order
 */
export async function fetchLessonSentences(lessonId) {
  const cacheKey = `sentences:${lessonId}`;
  return fetchWithCache(cacheKey, async () => {
  const { data, error } = await supabase
    .from('lesson_sentences')
    .select(`
      order_index,
      sentence_id,
      sentences (
        id,
        japanese,
        english,
        words,
        jlpt_level,
        domain,
        image_url
      )
    `)
    .eq('lesson_id', lessonId)
    .order('order_index');

    if (error) throw error;

    return (data || []).map(item => item.sentences);
  }, 10 * 60 * 1000); // Cache for 10 minutes (sentences don't change often)
}

/**
 * Update user progress for a lesson
 */
export async function updateLessonProgress({ userId, lessonId, sentenceResults }) {
  // Save individual sentence progress
  // Only keep the best grade for each sentence (○ > △ > ×)
  const gradeRank = { '○': 3, '△': 2, '×': 1 };

  for (const result of sentenceResults) {
    if (!result.sentence?.id) continue;

    // Check existing grade for this sentence
    const { data: existing } = await supabase
      .from('user_lesson_sentence_progress')
      .select('grade')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .eq('sentence_id', result.sentence.id)
      .maybeSingle();

    // Only update if new grade is better or doesn't exist
    const existingRank = existing?.grade ? gradeRank[existing.grade] : 0;
    const newRank = gradeRank[result.grade];

    if (newRank > existingRank) {
      const { error: sentenceError } = await supabase
        .from('user_lesson_sentence_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          sentence_id: result.sentence.id,
          grade: result.grade,
          practiced_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id,sentence_id'
        });

      if (sentenceError) {
        console.error('Error saving sentence progress:', sentenceError);
      }
    }
  }

  // Get total number of sentences in this lesson
  const { count: totalSentencesInLesson } = await supabase
    .from('lesson_sentences')
    .select('*', { count: 'exact', head: true })
    .eq('lesson_id', lessonId);

  // Get all sentence progress for this lesson
  const { data: allSentenceProgress } = await supabase
    .from('user_lesson_sentence_progress')
    .select('grade')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId);

  // Count mastered and good across ALL sentences practiced in this lesson
  const masteredCount = (allSentenceProgress || []).filter(p => p.grade === '○').length;
  const goodCount = (allSentenceProgress || []).filter(p => p.grade === '△').length;

  // Lesson is complete only when ALL sentences in the lesson have been mastered with ○
  const isComplete = masteredCount === totalSentencesInLesson;

  const { error } = await supabase
    .from('user_lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      mastered_count: masteredCount,
      good_count: goodCount,
      total_count: totalSentencesInLesson || 0,
      completed_at: isComplete ? new Date().toISOString() : null,
      last_practiced_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,lesson_id'
    });

  if (error) throw error;

  // Invalidate caches since progress changed
  invalidatePattern('lessons:'); // Invalidate all lessons caches
  invalidatePattern('progress:collection');

  return {
    masteredCount,
    goodCount,
    totalCount: totalSentencesInLesson || 0,
    isComplete,
  };
}

/**
 * Get collection progress summary
 * Percentage is calculated based on individual sentences:
 * - ○ (mastered) = 100% = 1.0 weight
 * - △ (good) = 80% = 0.8 weight
 * - × or not attempted = 0% = 0.0 weight
 */
export async function getCollectionProgress(collectionId, userId) {
  const cacheKey = `progress:collection:${collectionId}:${userId}`;
  return fetchWithCache(cacheKey, async () => {
  // Get all lessons for this collection
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('collection_id', collectionId);

  if (!lessons || lessons.length === 0) {
    return { completedLessons: 0, totalLessons: 0, percentage: 0 };
  }

  const lessonIds = lessons.map(l => l.id);

  // Get lesson counts
  const { data: lessonSentenceCounts } = await supabase
    .from('lesson_sentences')
    .select('lesson_id')
    .in('lesson_id', lessonIds);

  // Count total sentences in collection
  const totalSentences = lessonSentenceCounts ? lessonSentenceCounts.length : 0;

  if (totalSentences === 0) {
    return { completedLessons: 0, totalLessons: lessons.length, percentage: 0 };
  }

  // Get user progress for all lessons
  const { data: progressData } = await supabase
    .from('user_lesson_progress')
    .select('mastered_count, good_count, completed_at')
    .in('lesson_id', lessonIds)
    .eq('user_id', userId);

  // Calculate weighted score
  let totalScore = 0;
  let completedLessons = 0;

  (progressData || []).forEach(prog => {
    // ○ = 1.0 weight, △ = 0.8 weight
    const masteredScore = (prog.mastered_count || 0) * 1.0;
    const goodScore = (prog.good_count || 0) * 0.8;
    totalScore += masteredScore + goodScore;

    // Count completed lessons
    if (prog.completed_at) {
      completedLessons++;
    }
  });

    const percentage = Math.round((totalScore / totalSentences) * 100);

    return {
      completedLessons,
      totalLessons: lessons.length,
      percentage,
    };
  }, 3 * 60 * 1000); // Cache for 3 minutes
}
