import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const GOOGLE_TTS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;

let currentSound = null;

/**
 * Generate high-quality Japanese audio using Google Cloud TTS
 * Uses Neural2 voices for natural-sounding speech
 */
export async function speakJapanese(text, options = {}) {
  console.log('🎤 [TTS] Starting speakJapanese:', { text, options });
  try {
    // Stop any currently playing sound
    if (currentSound) {
      console.log('🎤 [TTS] Stopping current sound...');
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch (e) {
        console.log('🎤 [TTS] Error stopping sound:', e.message);
      }
      currentSound = null;
      console.log('🎤 [TTS] Current sound stopped');
    }

    // Check API key
    if (!GOOGLE_TTS_API_KEY) {
      throw new Error('Google TTS API key not configured');
    }

    // Set audio mode for playback
    console.log('🎤 [TTS] Setting audio mode...');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    console.log('🎤 [TTS] Audio mode set');

    const {
      voice = 'ja-JP-Neural2-B', // Female voice (B, C, D available)
      rate = 0.85,
      pitch = 0,
    } = options;

    // Call Google Cloud TTS API with timeout
    console.log('🎤 [TTS] Calling Google TTS API...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    console.log('🎤 [TTS] API response received:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🎤 [TTS] API error response:', errorText);
      throw new Error(`TTS API error: ${response.status}`);
    }

    console.log('🎤 [TTS] Parsing JSON...');
    const data = await response.json();
    const audioContent = data.audioContent;
    console.log('🎤 [TTS] Audio content received, length:', audioContent?.length);

    if (!audioContent) {
      throw new Error('No audio content in API response');
    }

    // Save base64 audio to temp file
    const tempFile = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
    console.log('🎤 [TTS] Writing to file:', tempFile);
    await FileSystem.writeAsStringAsync(tempFile, audioContent, {
      encoding: 'base64',
    });
    console.log('🎤 [TTS] File written');

    // Play the audio from file
    console.log('🎤 [TTS] Creating audio sound...');

    // Create sound and play it
    const { sound } = await Audio.Sound.createAsync(
      { uri: tempFile },
      { shouldPlay: true } // Auto-play immediately
    );
    console.log('🎤 [TTS] Sound created and playing');

    currentSound = sound;

    // Wait for playback to actually start
    const status = await sound.getStatusAsync();
    console.log('🎤 [TTS] Playback status:', status);

    console.log('🎤 [TTS] ✅ speakJapanese complete');
    return sound;
  } catch (error) {
    console.error('🎤 [TTS] ❌ Error:', error);
    // Clean up on error
    if (currentSound) {
      try {
        await currentSound.unloadAsync();
      } catch (e) {
        // Ignore cleanup errors
      }
      currentSound = null;
    }
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
