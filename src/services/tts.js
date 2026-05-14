import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const GOOGLE_TTS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;

let currentSound = null;

/**
 * Generate high-quality Japanese audio using Google Cloud TTS
 * Uses Neural2 voices for natural-sounding speech
 */
export async function speakJapanese(text, options = {}) {
  try {
    // Stop any currently playing sound
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }

    // Set audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    const {
      voice = 'ja-JP-Neural2-B', // Female voice (B, C, D available)
      rate = 0.85,
      pitch = 0,
    } = options;

    // Call Google Cloud TTS API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'ja-JP',
            name: voice,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: rate,
            pitch: pitch,
            effectsProfileId: ['headphone-class-device'],
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;

    // Save base64 audio to temp file
    const tempFile = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(tempFile, audioContent, {
      encoding: 'base64',
    });

    // Play the audio from file
    const { sound } = await Audio.Sound.createAsync(
      { uri: tempFile },
      { shouldPlay: true }
    );

    currentSound = sound;
    return sound;
  } catch (error) {
    console.error('TTS error:', error);
    throw error;
  }
}

/**
 * Stop currently playing sound
 */
export async function stopSpeaking() {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
}
