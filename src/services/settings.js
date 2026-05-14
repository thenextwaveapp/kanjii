import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@kanjii_settings';

const DEFAULT_SETTINGS = {
  textScale: 1.0,
  voiceGender: 'female', // 'female' or 'male'
  speechRate: 0.85, // 0.5 to 1.5
};

export async function getSettings() {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSetting(key, value) {
  try {
    const current = await getSettings();
    const updated = { ...current, [key]: value };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save setting:', e);
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
