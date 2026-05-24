import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getNewKanjiSince } from '../services/progress';
import { fetchLessons } from '../services/collections';

function formatTime(ms) {
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function longestCorrectStreak(results) {
  let max = 0, current = 0;
  for (const r of results) {
    if (!r.skipped) { current++; max = Math.max(max, current); }
    else current = 0;
  }
  return max;
}

function getGradeColor(grade) {
  if (grade === '○') return '#4A90E2'; // Blue for perfect
  if (grade === '△') return '#4CAF50'; // Green for good
  if (grade === '×') return '#888'; // Grey for wrong/skip
  return '#444'; // Default
}

function getGradeLabel(grade) {
  if (grade === '○') return 'perfect';
  if (grade === '△') return 'good';
  if (grade === '×') return 'skipped';
  return 'unknown';
}

export default function SummaryScreen({ navigation, route, user }) {
  const {
    results = [],
    sessionStart,
    rounds,
    difficulty,
    domain = 'Any',
    isLesson = false,
    lessonId = null,
    lessonName = null,
    collectionName = null,
    collectionId = null,
  } = route.params || {};
  const [newKanji, setNewKanji] = useState([]);
  const [nextLesson, setNextLesson] = useState(null);

  const allPerfect = results.every(r => r.grade === '○');
  const isComplete = results.length === rounds && (!isLesson || allPerfect);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const perfect = results.filter((r) => r.grade === '○').length;
  const good = results.filter((r) => r.grade === '△').length;
  const skipped = results.filter((r) => r.grade === '×' || r.skipped).length;
  const streak = longestCorrectStreak(results);
  const totalTime = results.reduce((s, r) => s + r.timeMs, 0);
  const avgTime = results.length > 0 ? totalTime / results.length : 0;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    if (user?.id && sessionStart) {
      getNewKanjiSince(user.id, sessionStart).then(setNewKanji);
    }

    // Fetch next lesson if this was a completed lesson
    if (isLesson && isComplete && collectionId && user?.id) {
      fetchLessons(collectionId, user.id).then(lessons => {
        const currentIndex = lessons.findIndex(l => l.id === lessonId);
        if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
          const next = lessons[currentIndex + 1];
          // Check if next lesson is unlocked (current lesson should now be complete)
          setNextLesson(next);
        }
      }).catch(e => {
        console.error('Failed to fetch next lesson:', e);
      });
    }
  }, []);

  return (
    <View style={[styles.container, allPerfect && styles.containerPerfect]}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            {isLesson && isComplete ? (
              <>
                <Text style={styles.title}>
                  {allPerfect ? '🎉 Perfect! Lesson complete!' : '✓ Lesson complete!'}
                </Text>
                <Text style={styles.subtitle}>
                  {collectionName} · {lessonName}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>Session complete</Text>
                <Text style={styles.subtitle}>
                  {rounds} rounds · {domain === 'Any' ? 'Any topic' : domain} · {difficulty}
                </Text>
              </>
            )}
          </Animated.View>

        {/* Top stats */}
        <View style={styles.statsRow}>
          <StatBox label="○ Perfect" value={perfect} total={rounds} accent color="#4A90E2" />
          <StatBox label="△ Good" value={good} total={rounds} color="#4CAF50" />
          <StatBox label="× Skipped" value={skipped} total={rounds} color="#888" />
        </View>
        <View style={styles.statsRow}>
          <StatBox label="Best streak" value={streak} />
          <StatBox label="Total time" value={formatTime(totalTime)} raw />
          <StatBox label="Avg. time" value={formatTime(avgTime)} raw />
        </View>

        {/* Per-round breakdown */}
        <Text style={styles.sectionLabel}>Rounds</Text>
        <View style={styles.roundList}>
          {results.map((r, i) => {
            const grade = r.grade || (r.skipped ? '×' : '○');
            const gradeColor = getGradeColor(grade);
            const gradeLabel = getGradeLabel(grade);

            return (
              <View key={i} style={styles.roundRow}>
                <View style={styles.roundHeader}>
                  <Text style={[styles.gradeSymbol, { color: gradeColor }]}>{grade}</Text>
                  <Text style={styles.roundLabel}>Round {r.round}</Text>
                  <Text style={styles.roundTime}>{formatTime(r.timeMs)}</Text>
                  <Text style={[styles.roundStatus, { color: gradeColor }]}>{gradeLabel}</Text>
                </View>
                {r.sentence && (
                  <View style={styles.roundContent}>
                    <Text style={styles.sentenceText}>{r.sentence.japanese}</Text>
                    <Text style={styles.sentenceTranslation}>{r.sentence.english}</Text>
                    {grade === '△' && r.userInput && (
                      <View style={styles.correctionBox}>
                        <Text style={styles.correctionLabel}>You typed:</Text>
                        <Text style={styles.userInputText}>{r.userInput}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* New kanji encountered */}
        {newKanji.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>New kanji this session</Text>
            <View style={styles.kanjiRow}>
              {newKanji.map((k) => (
                <View key={k.kanji} style={styles.newKanjiCard}>
                  <Text style={styles.newKanjiChar}>{k.kanji}</Text>
                  {k.meanings?.[0] && (
                    <Text style={styles.newKanjiMeaning} numberOfLines={1}>{k.meanings[0]}</Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Actions */}
        {nextLesson && isLesson && isComplete ? (
          <TouchableOpacity
            style={styles.nextLessonButton}
            onPress={() => {
              navigation.replace('Practice', {
                lessonId: nextLesson.id,
                lessonName: nextLesson.name,
                collectionName,
                collectionId,
              });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.nextLessonButtonText}>Continue to Next Lesson →</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={nextLesson && isLesson && isComplete ? styles.secondaryButton : styles.primaryButton}
          onPress={() => {
            if (isLesson && lessonId) {
              navigation.replace('Practice', {
                lessonId,
                lessonName,
                collectionName,
                collectionId,
              });
            } else {
              navigation.replace('RoundSelect');
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={nextLesson && isLesson && isComplete ? styles.secondaryButtonText : styles.primaryButtonText}>
            Play again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.reset({
            index: 1,
            routes: [{ name: 'Home' }, { name: 'CollectionList' }],
          })}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Back to Lessons</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

function StatBox({ label, value, total, accent, raw, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, accent && styles.statValueAccent, color && { color }]}>
        {raw ? value : total !== undefined ? `${value}/${total}` : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  containerPerfect: { backgroundColor: '#0D1117' },
  safe: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  title: { color: '#EFEFEF', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 16 },
  subtitle: { color: '#555', fontSize: 14, marginTop: 4, marginBottom: 28 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  statBox: {
    flex: 1, backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#222',
    paddingVertical: 14, alignItems: 'center', gap: 4,
  },
  statValue: { color: '#EFEFEF', fontSize: 18, fontWeight: '900' },
  statValueAccent: { color: '#E85D3A' },
  statLabel: { color: '#555', fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionLabel: {
    color: '#555', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
  },
  roundList: {
    backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#222',
    marginBottom: 32, overflow: 'hidden',
  },
  roundRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  gradeSymbol: {
    fontSize: 18,
    fontWeight: '700',
    width: 24,
  },
  roundLabel: { color: '#EFEFEF', fontSize: 13, flex: 1 },
  roundTime: { color: '#555', fontSize: 12 },
  roundStatus: { fontSize: 11, width: 60, textAlign: 'right', fontWeight: '600' },
  roundContent: {
    paddingLeft: 34,
    gap: 4,
  },
  sentenceText: {
    color: '#EFEFEF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  sentenceTranslation: {
    color: '#888',
    fontSize: 12,
    lineHeight: 16,
  },
  correctionBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  correctionLabel: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  userInputText: {
    color: '#EFEFEF',
    fontSize: 13,
  },
  kanjiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  newKanjiCard: {
    backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#E85D3A',
    padding: 12, width: 72, alignItems: 'center', gap: 4,
  },
  newKanjiChar: { fontSize: 26, color: '#EFEFEF' },
  newKanjiMeaning: { fontSize: 9, color: '#555', textAlign: 'center' },
  nextLessonButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextLessonButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryButton: {
    backgroundColor: '#E85D3A', borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1, borderColor: '#222', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  secondaryButtonText: { color: '#555', fontSize: 14 },
});
