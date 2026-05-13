import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import SnippetCard from '../components/SnippetCard';
import TypingInput from '../components/TypingInput';
import { fetchSentence, fetchTargetedSentence } from '../services/sentences';
import { recordCompletion, recordSkip } from '../services/progress';

export default function PracticeScreen({ navigation, route, user }) {
  const {
    rounds = 10,
    difficulty = 'Mixed',
    domain = 'Any',
    reviewKanji = null,   // string[] — drill mode, targeted sentences
    singleSentence = null, // sentence object — one-round re-practice from Study
  } = route?.params || {};

  const totalRounds = singleSentence ? 1 : rounds;
  const isDrill = !!reviewKanji && reviewKanji.length > 0;
  const isSingle = !!singleSentence;

  const [sentence, setSentence] = useState(isSingle ? singleSentence : null);
  const [loading, setLoading] = useState(!isSingle);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [done, setDone] = useState(false);

  const sessionStart = useRef(new Date().toISOString());
  const roundResults = useRef([]);
  const roundStart = useRef(Date.now());
  const scrollRef = useRef(null);

  const loadSentence = async () => {
    setLoading(true);
    setError(null);
    setSentence(null);
    setAttempts(0);
    roundStart.current = Date.now();
    try {
      const data = isDrill
        ? await fetchTargetedSentence(reviewKanji)
        : await fetchSentence(user?.id, difficulty, domain);
      setSentence(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSingle) loadSentence();
    else roundStart.current = Date.now();
  }, []);

  const finishSession = (results) => {
    if (isSingle) {
      navigation.goBack();
      return;
    }
    navigation.replace('Summary', {
      results,
      sessionStart: sessionStart.current,
      rounds: totalRounds,
      difficulty: isDrill ? 'Drill' : difficulty,
      domain: isDrill ? 'Weak kanji' : domain,
    });
  };

  const handleMatch = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const elapsed = Date.now() - roundStart.current;
    roundResults.current.push({ round: currentRound, skipped: false, timeMs: elapsed, sentence });

    if (user?.id) {
      await recordCompletion({
        userId: user.id,
        sentenceId: sentence?.id,
        words: sentence?.words,
        attempts: attempts + 1,
      });
    }

    if (currentRound >= totalRounds) {
      setDone(true);
      finishSession(roundResults.current);
    } else {
      setCurrentRound((r) => r + 1);
      loadSentence();
    }
  };

  const handleSkip = async () => {
    const elapsed = Date.now() - roundStart.current;
    roundResults.current.push({ round: currentRound, skipped: true, timeMs: elapsed, sentence });

    if (user?.id && sentence?.words) {
      await recordSkip({ userId: user.id, words: sentence.words });
    }

    if (currentRound >= totalRounds) {
      setDone(true);
      finishSession(roundResults.current);
    } else {
      setCurrentRound((r) => r + 1);
      loadSentence();
    }
  };

  const progress = currentRound / totalRounds;

  const headerLabel = isSingle
    ? 'Re-practice'
    : isDrill
    ? `Drill · ${currentRound}/${totalRounds}`
    : `${currentRound} / ${totalRounds}`;

  const badgeLabel = isSingle
    ? 'Single round'
    : isDrill
    ? 'Weak kanji'
    : `${difficulty}${domain !== 'Any' ? ` · ${domain}` : ''}`;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.roundText}>{headerLabel}</Text>
        <View style={styles.diffBadge}>
          <Text style={styles.diffText}>{badgeLabel}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#E85D3A" size="large" />
              <Text style={styles.loadingText}>
                {isDrill ? 'Finding weak kanji...' : 'Loading...'}
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadSentence}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {sentence && !loading && !done && (
            <>
              <Text style={styles.instruction}>Tap words to reveal, then type</Text>
              <SnippetCard snippet={sentence} />
              <TypingInput
                target={sentence.japanese}
                onMatch={handleMatch}
                onAttempt={() => setAttempts((a) => a + 1)}
                onFocus={() =>
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
                }
              />
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
                <Text style={styles.skipText}>Skip →</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backText: { color: '#555', fontSize: 18, padding: 4 },
  roundText: { color: '#EFEFEF', fontSize: 15, fontWeight: '700' },
  diffBadge: {
    backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#333',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  diffText: { color: '#E85D3A', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  progressTrack: { height: 2, backgroundColor: '#1A1A1A', marginHorizontal: 20, borderRadius: 1 },
  progressFill: { height: 2, backgroundColor: '#E85D3A', borderRadius: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  instruction: { fontSize: 12, color: '#444', letterSpacing: 1.5, marginBottom: 16, textAlign: 'center' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  loadingText: { color: '#555', fontSize: 14, letterSpacing: 1 },
  errorContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  errorTitle: { color: '#E85D3A', fontSize: 18, fontWeight: '700' },
  errorMessage: { color: '#555', fontSize: 13, textAlign: 'center' },
  retryButton: {
    backgroundColor: '#1A1A1A', borderRadius: 8, paddingHorizontal: 20,
    paddingVertical: 10, borderWidth: 1, borderColor: '#333',
  },
  retryText: { color: '#EFEFEF', fontSize: 14 },
  skipButton: { marginTop: 20, alignItems: 'center', paddingVertical: 8 },
  skipText: { color: '#333', fontSize: 13, letterSpacing: 1 },
});
