import { supabase } from './supabase';

/**
 * Get user profile data
 * @param {string} userId - User ID
 * @returns {Object|null} Profile data or null if not found
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  try {
    console.log('Fetching profile for user:', userId);
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching profile:', error);
      throw error;
    }
    console.log('Profile data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Check if user has completed profile questionnaire
 * @param {string} userId - User ID
 * @returns {boolean} True if profile is completed
 */
export async function isProfileCompleted(userId) {
  if (!userId) return false;

  try {
    const profile = await getUserProfile(userId);
    return profile?.profile_completed === true;
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
}

/**
 * Save user profile (upsert)
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to save
 * @returns {Object|null} Saved profile or null on error
 */
export async function saveUserProfile(userId, profileData) {
  if (!userId) {
    console.warn('No user ID provided to saveUserProfile');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_profile')
      .upsert(
        {
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return null;
  }
}

/**
 * Mark profile as completed
 * @param {string} userId - User ID
 * @returns {boolean} Success status
 */
export async function completeProfile(userId) {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('user_profile')
      .upsert(
        {
          user_id: userId,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error completing profile:', error);
    return false;
  }
}
