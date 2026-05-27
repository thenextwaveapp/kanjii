import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  InputAccessoryView,
  Platform,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const INPUT_ACCESSORY_ID = 'kanjii-input';

// Calculate similarity between two strings (0-1, where 1 is identical)
function calculateSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1;

  // Levenshtein distance
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  const distance = matrix[len2][len1];
  return 1 - (distance / maxLen);
}

export default function TypingInput({ target, onMatch, onAttempt, onFocus }) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('idle'); // idle | perfect | good | wrong
  const [grade, setGrade] = useState(null); // ○ | △ | ×
  const inputRef = useRef(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const burstAnim = useRef(new Animated.Value(0)).current;
  const hanamaruScale = useRef(new Animated.Value(0)).current;

  // Reset when target changes (new round)
  useEffect(() => {
    setValue('');
    setStatus('idle');
    setGrade(null);
    burstAnim.setValue(0);
    hanamaruScale.setValue(0);
  }, [target]);

  const flashRed = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const animateBurst = () => {
    burstAnim.setValue(1);
    Animated.timing(burstAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const animateHanamaru = () => {
    hanamaruScale.setValue(0);
    Animated.sequence([
      Animated.spring(hanamaruScale, {
        toValue: 1.2,
        friction: 3,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(hanamaruScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleChange = (text) => {
    setValue(text);
  };

  const handleCheck = () => {
    const stripEmoji = (s) => s.replace(/\p{Emoji}/gu, '').trim();
    const stripPunctuation = (s) => s.replace(/[.,!?;:、。！？；：]/g, '').trim();
    const normalised = stripPunctuation(stripEmoji(value));
    const targetNorm = stripPunctuation(stripEmoji(target));

    const similarity = calculateSimilarity(normalised, targetNorm);

    let calculatedGrade;
    let newStatus;

    if (similarity === 1) {
      // Perfect match → Hanamaru → ○ (blue)
      calculatedGrade = '○';
      newStatus = 'perfect';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateBurst();
      animateHanamaru();
    } else if (similarity >= 0.8) {
      // Good attempt → △ (green)
      calculatedGrade = '△';
      newStatus = 'good';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateBurst();
    } else {
      // Wrong → × (grey)
      calculatedGrade = '×';
      newStatus = 'wrong';
      flashRed();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onAttempt?.();
      // Don't call onMatch for wrong answers
      return;
    }

    setStatus(newStatus);
    setGrade(calculatedGrade);
    Keyboard.dismiss();

    setTimeout(() => {
      const userInput = value; // Capture before clearing
      setValue('');
      setStatus('idle');
      setGrade(null);
      onMatch(calculatedGrade, userInput);
    }, 1200);
  };

  const borderColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#333333', '#E85D3A'],
  });

  let borderColorFinal = borderColor;
  if (status === 'perfect') borderColorFinal = '#4A90E2'; // Blue
  else if (status === 'good') borderColorFinal = '#4CAF50'; // Green
  else if (status === 'wrong') borderColorFinal = '#888'; // Grey

  const burstOpacity = burstAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const burstScale = burstAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2],
  });

  let buttonText = 'Check';
  if (status === 'perfect') buttonText = '○ Perfect!';
  else if (status === 'good') buttonText = '△ Good!';
  else if (status === 'wrong') buttonText = '× Try again';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Type or use keyboard voice input</Text>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
      >
        <Animated.View style={[styles.inputWrapper, { borderColor: borderColorFinal }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={handleChange}
            multiline
            placeholder="Type in Japanese..."
            placeholderTextColor="#444"
            keyboardType="default"
            textContentType="none"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            showSoftInputOnFocus={true}
            onFocus={onFocus}
            lang="ja"
            inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
          />

          {/* Burst animation overlay */}
          {(status === 'perfect' || status === 'good') && (
            <Animated.View
              style={[
                styles.burstOverlay,
                {
                  opacity: burstOpacity,
                  transform: [{ scale: burstScale }],
                },
              ]}
            >
              <View style={[styles.burstCircle, status === 'perfect' ? styles.burstBlue : styles.burstGreen]} />
            </Animated.View>
          )}

          {/* Hanamaru for perfect answers */}
          {status === 'perfect' && (
            <Animated.View
              style={[
                styles.hanamaruContainer,
                {
                  transform: [{ scale: hanamaruScale }],
                },
              ]}
            >
              <Text style={styles.hanamaru}>💮</Text>
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={styles.accessory}>
            <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.accessoryButton}>
              <Text style={styles.accessoryText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      <TouchableOpacity
        style={[styles.button, value.length === 0 && styles.buttonDisabled]}
        onPress={handleCheck}
        disabled={value.length === 0}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginTop: 24 },
  label: {
    fontSize: 11, color: '#555', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: '#111111',
    borderWidth: 1.5,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 22,
    color: '#EFEFEF',
    minHeight: 80,
    lineHeight: 32,
    letterSpacing: 1,
  },
  burstOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  burstCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  burstBlue: {
    backgroundColor: '#4A90E2',
  },
  burstGreen: {
    backgroundColor: '#4CAF50',
  },
  hanamaruContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  hanamaru: {
    position: 'absolute',
    fontSize: 50,
    opacity: 0.9,
  },
  hanamaruCircle: {
    position: 'absolute',
    fontSize: 40,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  button: {
    marginTop: 14, backgroundColor: '#E85D3A',
    borderRadius: 8, paddingVertical: 14, alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#222' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  accessory: {
    backgroundColor: '#1A1A1A', borderTopWidth: 1, borderTopColor: '#2A2A2A',
    paddingHorizontal: 16, paddingVertical: 10, alignItems: 'flex-end',
  },
  accessoryButton: { paddingHorizontal: 12, paddingVertical: 4 },
  accessoryText: { color: '#E85D3A', fontSize: 16, fontWeight: '600' },
});
