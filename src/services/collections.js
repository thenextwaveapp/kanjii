import { supabase } from './supabase';

/**
 * Fetch all collections with lesson counts
 */
export async function fetchCollections() {
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

  // Get lesson counts for each collection
  const collectionsWithCounts = await Promise.all(
    (collections || []).map(async (collection) => {
      const { count: lessonCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collection.id);

      return {
        ...collection,
        lessonCount: lessonCount || 0,
      };
    })
  );

  return collectionsWithCounts;
}

/**
 * Fetch lessons for a collection with progress
 */
export async function fetchLessons(collectionId, userId) {
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
        .select('mastered_count, total_count, completed_at')
        .eq('lesson_id', lesson.id)
        .eq('user_id', userId)
        .maybeSingle();

      return {
        ...lesson,
        sentenceCount: sentenceCount || 0,
        masteredCount: progress?.mastered_count || 0,
        totalCount: progress?.total_count || sentenceCount || 0,
        completedAt: progress?.completed_at,
        isComplete: progress?.completed_at != null,
      };
    })
  );

  return lessonsWithProgress;
}

/**
 * Fetch sentences for a lesson in order
 */
export async function fetchLessonSentences(lessonId) {
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
        domain
      )
    `)
    .eq('lesson_id', lessonId)
    .order('order_index');

  if (error) throw error;

  return (data || []).map(item => item.sentences);
}

/**
 * Update user progress for a lesson
 */
export async function updateLessonProgress({ userId, lessonId, sentenceResults }) {
  // Count how many got ○ (maru)
  const masteredCount = sentenceResults.filter(r => r.grade === '○').length;
  const totalCount = sentenceResults.length;
  const isComplete = masteredCount === totalCount;

  const { error } = await supabase
    .from('user_lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      mastered_count: masteredCount,
      total_count: totalCount,
      completed_at: isComplete ? new Date().toISOString() : null,
      last_practiced_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,lesson_id'
    });

  if (error) throw error;

  return {
    masteredCount,
    totalCount,
    isComplete,
  };
}

/**
 * Get collection progress summary
 */
export async function getCollectionProgress(collectionId, userId) {
  // Get all lessons for this collection
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('collection_id', collectionId);

  if (!lessons || lessons.length === 0) {
    return { completedLessons: 0, totalLessons: 0, percentage: 0 };
  }

  const lessonIds = lessons.map(l => l.id);

  // Get completed lessons
  const { data: progress } = await supabase
    .from('user_lesson_progress')
    .select('completed_at')
    .in('lesson_id', lessonIds)
    .eq('user_id', userId)
    .not('completed_at', 'is', null);

  const completedLessons = (progress || []).length;
  const totalLessons = lessons.length;
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    completedLessons,
    totalLessons,
    percentage,
  };
}
