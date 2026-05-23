import { supabase } from './supabase';

// Total counts for each kana set
const KANA_TOTALS = {
  'hiragana': 46,
  'katakana': 46,
  'hiragana-advanced': 58,
  'katakana-advanced': 58,
};

/**
 * Get kana progress data from database
 * Returns an object like:
 * {
 *   hiragana: { 'あ': true, 'い': true, ... },
 *   katakana: { 'ア': false, ... },
 *   ...
 * }
 * where true means the character has been mastered (○ grade at least once)
 */
export async function getKanaProgress(userId) {
  if (!userId) {
    return {
      hiragana: {},
      katakana: {},
      'hiragana-advanced': {},
      'katakana-advanced': {},
    };
  }

  try {
    const { data, error } = await supabase
      .from('user_kana_progress')
      .select('mode, kana, mastered')
      .eq('user_id', userId);

    if (error) throw error;

    // Transform flat array into nested object structure
    const progress = {
      hiragana: {},
      katakana: {},
      'hiragana-advanced': {},
      'katakana-advanced': {},
    };

    (data || []).forEach(item => {
      if (progress[item.mode]) {
        progress[item.mode][item.kana] = item.mastered;
      }
    });

    return progress;
  } catch (error) {
    console.error('Error loading kana progress:', error);
    return {
      hiragana: {},
      katakana: {},
      'hiragana-advanced': {},
      'katakana-advanced': {},
    };
  }
}

/**
 * Save practice results and update progress
 * @param {string} userId - User ID
 * @param {string} mode - 'hiragana', 'katakana', etc.
 * @param {Array} results - Array of practice results with { kana, grade, ... }
 */
export async function saveKanaPracticeResults(userId, mode, results) {
  if (!userId) {
    console.warn('No user ID provided to saveKanaPracticeResults');
    return;
  }

  try {
    const upsertData = results.map(result => ({
      user_id: userId,
      mode,
      kana: result.kana,
      mastered: result.grade === '○',
      practice_count: 1, // Will be incremented via SQL
      last_practiced_at: new Date().toISOString(),
      first_mastered_at: result.grade === '○' ? new Date().toISOString() : null,
    }));

    // Upsert each result
    for (const data of upsertData) {
      const { error } = await supabase
        .from('user_kana_progress')
        .upsert(
          data,
          {
            onConflict: 'user_id,mode,kana',
            // On conflict, only update if new result is better or increment practice count
            ignoreDuplicates: false,
          }
        );

      if (error) {
        console.error('Error saving kana progress:', error);
      }
    }

    // Update user_stats with kana counts
    await updateKanaStats(userId);

    return await getKanaProgress(userId);
  } catch (error) {
    console.error('Error saving kana practice results:', error);
  }
}

/**
 * Update user_stats with current kana mastery counts
 */
async function updateKanaStats(userId) {
  try {
    // Count total mastered kana across all modes
    const { count } = await supabase
      .from('user_kana_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('mastered', true);

    const today = new Date().toISOString().slice(0, 10);

    // Update or insert user_stats
    const { error } = await supabase
      .from('user_stats')
      .upsert(
        {
          user_id: userId,
          kana_mastered: count || 0,
          last_kana_practice_date: today,
          last_activity_date: today,
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('Error updating kana stats:', error);
    }
  } catch (error) {
    console.error('Error in updateKanaStats:', error);
  }
}

/**
 * Calculate progress statistics for a specific mode
 * @param {string} userId - User ID
 * @param {string} mode - 'hiragana', 'katakana', etc.
 * @returns {Object} { mastered: number, total: number, percentage: number }
 */
export async function getKanaStats(userId, mode) {
  if (!userId) {
    return { mastered: 0, total: KANA_TOTALS[mode] || 0, percentage: 0 };
  }

  try {
    const { count } = await supabase
      .from('user_kana_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('mode', mode)
      .eq('mastered', true);

    const mastered = count || 0;
    const total = KANA_TOTALS[mode] || 0;
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return { mastered, total, percentage };
  } catch (error) {
    console.error('Error calculating kana stats:', error);
    return { mastered: 0, total: KANA_TOTALS[mode] || 0, percentage: 0 };
  }
}

/**
 * Get combined stats for basic hiragana and katakana
 */
export async function getBasicKanaStats(userId) {
  const hiraganaStats = await getKanaStats(userId, 'hiragana');
  const katakanaStats = await getKanaStats(userId, 'katakana');

  return {
    hiragana: hiraganaStats,
    katakana: katakanaStats,
  };
}

/**
 * Get combined stats for advanced hiragana and katakana
 */
export async function getAdvancedKanaStats(userId) {
  const hiraganaStats = await getKanaStats(userId, 'hiragana-advanced');
  const katakanaStats = await getKanaStats(userId, 'katakana-advanced');

  return {
    'hiragana-advanced': hiraganaStats,
    'katakana-advanced': katakanaStats,
  };
}

/**
 * Reset all kana progress for a user (for testing/debugging)
 */
export async function resetKanaProgress(userId) {
  if (!userId) return;

  try {
    const { error } = await supabase
      .from('user_kana_progress')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error resetting kana progress:', error);
  }
}
