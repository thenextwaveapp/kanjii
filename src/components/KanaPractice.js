import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Hiragana chart (basic 46)
const HIRAGANA_BASIC = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',
};

// Katakana chart (basic 46)
const KATAKANA_BASIC = {
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
};

// Hiragana Advanced (dakuon, handakuon, yōon)
const HIRAGANA_ADVANCED = {
  // Dakuon
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  // Handakuon
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  // Yōon
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
};

// Katakana Advanced (dakuon, handakuon, yōon)
const KATAKANA_ADVANCED = {
  // Dakuon
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  // Handakuon
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
  // Yōon
  'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
  'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
  'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
  'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
  'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
  'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
  'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
  'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
  'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
  'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
};

const KANA_SETS = {
  'hiragana': HIRAGANA_BASIC,
  'katakana': KATAKANA_BASIC,
  'hiragana-advanced': HIRAGANA_ADVANCED,
  'katakana-advanced': KATAKANA_ADVANCED,
};

export default function KanaPractice({ onClose }) {
  const [mode, setMode] = useState(null); // null | 'hiragana' | 'katakana' | 'hiragana-advanced' | 'katakana-advanced'
  const [currentKana, setCurrentKana] = useState('');
  const [correctRomaji, setCorrectRomaji] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState(''); // 'correct' | 'wrong' | ''
  const [remainingKana, setRemainingKana] = useState([]);

  const inputRef = useRef(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Initialize practice mode
  const startPractice = (selectedMode) => {
    setMode(selectedMode);
    const kanaMap = KANA_SETS[selectedMode];
    const kanaList = Object.keys(kanaMap);
    const shuffled = [...kanaList].sort(() => Math.random() - 0.5);
    setRemainingKana(shuffled);
    loadNextKana(shuffled, kanaMap);
    setScore(0);
    setTotal(0);
  };

  const loadNextKana = (kanaList, kanaMap) => {
    if (kanaList.length === 0) {
      // Practice complete
      setCurrentKana('');
      return;
    }
    const nextKana = kanaList[0];
    setCurrentKana(nextKana);
    setCorrectRomaji(kanaMap[nextKana]);
    setUserInput('');
    setFeedback('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = () => {
    const kanaMap = KANA_SETS[mode];
    const input = userInput.toLowerCase().trim();
    const correct = correctRomaji.toLowerCase();

    // Also accept common alternatives
    const alternatives = {
      'shi': ['si'],
      'chi': ['ti'],
      'tsu': ['tu'],
      'fu': ['hu'],
      'n': ['nn'],
    };

    const isCorrect =
      input === correct ||
      (alternatives[correct] && alternatives[correct].includes(input));

    setTotal(total + 1);

    if (isCorrect) {
      setScore(score + 1);
      setFeedback('correct');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Flash green
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      // Move to next after delay
      setTimeout(() => {
        const newRemaining = remainingKana.slice(1);
        setRemainingKana(newRemaining);
        if (newRemaining.length === 0) {
          // Practice complete
          setCurrentKana('');
        } else {
          loadNextKana(newRemaining, kanaMap);
        }
      }, 800);
    } else {
      setFeedback('wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Flash red
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      // Clear input and try again
      setTimeout(() => {
        setUserInput('');
        setFeedback('');
        inputRef.current?.focus();
      }, 1000);
    }
  };

  const flashColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: feedback === 'correct'
      ? ['#0A0A0A', '#4CAF50']
      : ['#0A0A0A', '#E85D3A'],
  });

  // Mode selection screen
  if (!mode) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kana Practice</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.modeContainer}>
          <Text style={styles.modeTitle}>Choose a practice mode</Text>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => startPractice('hiragana')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeKana}>あ</Text>
            <Text style={styles.modeLabel}>Hiragana Basic</Text>
            <Text style={styles.modeDescription}>46 basic characters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => startPractice('katakana')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeKana}>ア</Text>
            <Text style={styles.modeLabel}>Katakana Basic</Text>
            <Text style={styles.modeDescription}>46 basic characters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => startPractice('hiragana-advanced')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeKana}>ぎゃ</Text>
            <Text style={styles.modeLabel}>Hiragana Advanced</Text>
            <Text style={styles.modeDescription}>Dakuon, handakuon & yōon (58 chars)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => startPractice('katakana-advanced')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeKana}>ギャ</Text>
            <Text style={styles.modeLabel}>Katakana Advanced</Text>
            <Text style={styles.modeDescription}>Dakuon, handakuon & yōon (58 chars)</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Practice complete screen
  if (!currentKana) {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete!</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsEmoji}>
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚'}
          </Text>
          <Text style={styles.resultsScore}>
            {score} / {total}
          </Text>
          <Text style={styles.resultsPercentage}>{percentage}%</Text>
          <Text style={styles.resultsMessage}>
            {percentage >= 80
              ? 'Excellent work!'
              : percentage >= 60
              ? 'Good job! Keep practicing.'
              : 'Keep going, you\'ll get there!'}
          </Text>

          <TouchableOpacity
            style={styles.restartButton}
            onPress={() => startPractice(mode)}
          >
            <Text style={styles.restartButtonText}>Practice Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.changeButton} onPress={() => setMode(null)}>
            <Text style={styles.changeButtonText}>Change Mode</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Practice screen
  return (
    <Animated.View style={[styles.safe, { backgroundColor: flashColor }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'hiragana' ? 'Hiragana Basic' :
             mode === 'katakana' ? 'Katakana Basic' :
             mode === 'hiragana-advanced' ? 'Hiragana Advanced' :
             'Katakana Advanced'}
          </Text>
          <Text style={styles.scoreText}>
            {score}/{total}
          </Text>
        </View>

        <View style={styles.practiceContainer}>
          <Text style={styles.instruction}>Type the romaji</Text>

          <View style={styles.kanaDisplay}>
            <Text style={styles.kanaChar}>{currentKana}</Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    ((Object.keys(KANA_SETS[mode]).length - remainingKana.length) /
                      Object.keys(KANA_SETS[mode]).length) *
                    100
                  }%`,
                },
              ]}
            />
          </View>

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={userInput}
            onChangeText={setUserInput}
            onSubmitEditing={handleSubmit}
            placeholder="Type here..."
            placeholderTextColor="#444"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />

          {feedback && (
            <Text
              style={[
                styles.feedbackText,
                feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
              ]}
            >
              {feedback === 'correct' ? '○ Correct!' : `× Try again (${correctRomaji})`}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.submitButton, !userInput && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!userInput}
          >
            <Text style={styles.submitButtonText}>Check</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={() => {
            const kanaMap = KANA_SETS[mode];
            const newRemaining = remainingKana.slice(1);
            setRemainingKana(newRemaining);
            setTotal(total + 1);
            if (newRemaining.length === 0) {
              setCurrentKana('');
            } else {
              loadNextKana(newRemaining, kanaMap);
            }
          }}>
            <Text style={styles.skipButtonText}>Skip →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  closeText: {
    color: '#555',
    fontSize: 24,
    fontWeight: '300',
    width: 40,
  },
  headerTitle: {
    color: '#EFEFEF',
    fontSize: 18,
    fontWeight: '700',
  },
  scoreText: {
    color: '#E85D3A',
    fontSize: 15,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },

  // Mode selection
  modeContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  modeTitle: {
    color: '#EFEFEF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  modeCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  modeKana: {
    fontSize: 64,
    color: '#E85D3A',
    marginBottom: 16,
  },
  modeLabel: {
    color: '#EFEFEF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  modeDescription: {
    color: '#666',
    fontSize: 14,
  },

  // Practice
  practiceContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  instruction: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  kanaDisplay: {
    alignItems: 'center',
    marginBottom: 40,
  },
  kanaChar: {
    fontSize: 120,
    color: '#EFEFEF',
    fontWeight: '300',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    marginBottom: 40,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#E85D3A',
    borderRadius: 2,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    fontSize: 24,
    color: '#EFEFEF',
    textAlign: 'center',
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  feedbackCorrect: {
    color: '#4CAF50',
  },
  feedbackWrong: {
    color: '#E85D3A',
  },
  submitButton: {
    backgroundColor: '#E85D3A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#222',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#555',
    fontSize: 14,
  },

  // Results
  resultsContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  resultsScore: {
    color: '#EFEFEF',
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
  },
  resultsPercentage: {
    color: '#E85D3A',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  resultsMessage: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  restartButton: {
    backgroundColor: '#E85D3A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  restartButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  changeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  changeButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
