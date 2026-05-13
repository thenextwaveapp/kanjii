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

const INPUT_ACCESSORY_ID = 'kanjii-input';

export default function TypingInput({ target, onMatch, onAttempt, onFocus }) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('idle'); // idle | correct
  const inputRef = useRef(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Reset when target changes (new round)
  useEffect(() => {
    setValue('');
    setStatus('idle');
  }, [target]);

  const flashRed = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const handleChange = (text) => {
    setValue(text);
  };

  const handleCheck = () => {
    const stripEmoji = (s) => s.replace(/\p{Emoji}/gu, '').trim();
    const normalised = stripEmoji(value);
    if (normalised === stripEmoji(target)) {
      setStatus('correct');
      Keyboard.dismiss();
      setTimeout(() => {
        setValue('');
        setStatus('idle');
        onMatch();
      }, 600);
    } else {
      flashRed();
      onAttempt?.();
    }
  };

  const borderColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#333333', '#E85D3A'],
  });

  const correctBorder = status === 'correct' ? '#4CAF50' : undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Type the snippet</Text>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
      >
        <Animated.View style={[styles.inputWrapper, { borderColor: correctBorder || borderColor }]}>
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
        <Text style={styles.buttonText}>
          {status === 'correct' ? '✓ Correct!' : 'Check'}
        </Text>
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
    borderRadius: 12,
  },
  input: {
    padding: 16,
    fontSize: 22,
    color: '#EFEFEF',
    minHeight: 80,
    lineHeight: 32,
    letterSpacing: 1,
  },
  button: {
    marginTop: 14, backgroundColor: '#E85D3A',
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
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
