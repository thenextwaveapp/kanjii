/**
 * Unified TTS visual styles and animations
 * Use these consistently across all screens for TTS feedback
 */

import { StyleSheet, Animated } from 'react-native';

// TTS Playing color - always use blue
export const TTS_COLOR = '#4A90E2';
export const TTS_BG_COLOR = 'rgba(74, 144, 226, 0.05)';
export const TTS_BG_COLOR_DARKER = 'rgba(74, 144, 226, 0.1)';

/**
 * Styles for large cards (sentences, main content)
 * Use with "🔊 Playing" text indicator
 */
export const ttsLargeCardStyles = StyleSheet.create({
  playing: {
    borderColor: TTS_COLOR,
    backgroundColor: TTS_BG_COLOR,
  },
  playingText: {
    color: TTS_COLOR,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  holdText: {
    fontSize: 10,
    color: '#444',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

/**
 * Styles for small chips/buttons (words, readings, kana)
 * Use with pulsing border animation
 */
export const ttsSmallChipStyles = StyleSheet.create({
  playing: {
    borderColor: TTS_COLOR,
    backgroundColor: TTS_BG_COLOR_DARKER,
  },
});

/**
 * Create a pulsing animation for TTS playback
 * Use with Animated.View for small chips
 *
 * @param {Animated.Value} animValue - Animated value (0-1)
 * @returns {object} - Style object for animated border
 */
export function createPulseAnimation(animValue) {
  return {
    borderColor: animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [TTS_COLOR, 'rgba(74, 144, 226, 0.3)', TTS_COLOR],
    }),
    shadowColor: TTS_COLOR,
    shadowOpacity: animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.6, 0.3],
    }),
    shadowRadius: animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [4, 8, 4],
    }),
    elevation: animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [2, 4, 2],
    }),
  };
}

/**
 * Start pulse animation
 * Call this when TTS starts playing for small chips
 *
 * @param {Animated.Value} animValue - Animated value to animate
 * @returns {Animated.CompositeAnimation} - Animation instance
 */
export function startPulseAnimation(animValue) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(animValue, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }),
    ])
  );
}

/**
 * Stop pulse animation
 * Call this when TTS stops
 *
 * @param {Animated.CompositeAnimation} animation - Animation instance
 * @param {Animated.Value} animValue - Animated value to reset
 */
export function stopPulseAnimation(animation, animValue) {
  animation?.stop();
  animValue.setValue(0);
}
