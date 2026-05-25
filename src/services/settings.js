import { supabase } from './supabase';

const DEFAULT_SETTINGS = {
  textScale: 1.0,
  voiceGender: 'female', // 'female' or 'male'
  speechRate: 0.85, // 0.5 to 1.5
  notificationsEnabled: false,
  dailyReminderHour: 19, // 7 PM
  dailyReminderMinute: 0,
  onboardingHome: false,
  onboardingPractice: false,
  onboardingStudy: false,
  onboardingKana: false,
  onboardingLessons: false,
};

/**
 * Get user settings from database
 * Returns default settings if user not found or on error
 */
export async function getSettings(userId) {
  if (!userId) {
    return DEFAULT_SETTINGS;
  }

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // No settings yet - create with defaults
      const { data: created } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          ...DEFAULT_SETTINGS,
        })
        .select()
        .single();

      return created || DEFAULT_SETTINGS;
    }

    // Map database columns to camelCase
    return {
      textScale: data.text_scale,
      voiceGender: data.voice_gender,
      speechRate: data.speech_rate,
      notificationsEnabled: data.notifications_enabled,
      dailyReminderHour: data.daily_reminder_hour,
      dailyReminderMinute: data.daily_reminder_minute,
      onboardingHome: data.onboarding_home ?? false,
      onboardingPractice: data.onboarding_practice ?? false,
      onboardingStudy: data.onboarding_study ?? false,
      onboardingKana: data.onboarding_kana ?? false,
      onboardingLessons: data.onboarding_lessons ?? false,
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save a single setting to database
 * @param {string} userId - User ID
 * @param {string} key - Setting key in camelCase (e.g., 'textScale')
 * @param {any} value - Setting value
 * @returns {Object} Updated settings object
 */
export async function saveSetting(userId, key, value) {
  if (!userId) {
    console.warn('No user ID provided to saveSetting');
    return null;
  }

  try {
    // Map camelCase keys to snake_case database columns
    const columnMap = {
      textScale: 'text_scale',
      voiceGender: 'voice_gender',
      speechRate: 'speech_rate',
      notificationsEnabled: 'notifications_enabled',
      dailyReminderHour: 'daily_reminder_hour',
      dailyReminderMinute: 'daily_reminder_minute',
      onboardingHome: 'onboarding_home',
      onboardingPractice: 'onboarding_practice',
      onboardingStudy: 'onboarding_study',
      onboardingKana: 'onboarding_kana',
      onboardingLessons: 'onboarding_lessons',
    };

    const dbColumn = columnMap[key];
    if (!dbColumn) {
      console.error('Unknown setting key:', key);
      return null;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          [dbColumn]: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      );

    if (error) throw error;

    // Return updated settings
    return await getSettings(userId);
  } catch (error) {
    console.error('Error saving setting:', error);
    return null;
  }
}

export const TEXT_SCALE_OPTIONS = [
  { label: 'Small', value: 0.85 },
  { label: 'Default', value: 1.0 },
  { label: 'Medium', value: 1.15 },
  { label: 'Large', value: 1.3 },
  { label: 'XL', value: 1.5 },
];

export const VOICE_OPTIONS = [
  { label: 'Female (Natural)', value: 'female', voice: 'ja-JP-Neural2-B' },
  { label: 'Male (Natural)', value: 'male', voice: 'ja-JP-Neural2-C' },
  { label: 'Male (Deep)', value: 'male-deep', voice: 'ja-JP-Neural2-D' },
];

export const SPEECH_RATE_OPTIONS = [
  { label: 'Very Slow', value: 0.5 },
  { label: 'Slow', value: 0.7 },
  { label: 'Normal', value: 0.85 },
  { label: 'Fast', value: 1.0 },
  { label: 'Very Fast', value: 1.2 },
];
