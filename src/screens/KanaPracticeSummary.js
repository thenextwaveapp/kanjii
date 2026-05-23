import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { saveKanaPracticeResults } from '../services/kanaProgress';

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

export default function KanaPracticeSummary({ navigation, route, user }) {
  const { results = [], mode } = route.params || {};

  const perfect = results.filter((r) => r.grade === '○').length;
  const good = results.filter((r) => r.grade === '△').length;
  const skipped = results.filter((r) => r.grade === '×' || r.skipped).length;
  const streak = longestCorrectStreak(results);
  const avgTime = results.length > 0
    ? results.reduce((s, r) => s + r.timeMs, 0) / results.length
    : 0;
  const totalRounds = results.length;

  const modeLabel =
    mode === 'hiragana' ? 'Hiragana Basic' :
    mode === 'katakana' ? 'Katakana Basic' :
    mode === 'hiragana-advanced' ? 'Hiragana Advanced' :
    mode === 'katakana-advanced' ? 'Katakana Advanced' :
    'Kana Practice';

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save practice results to track progress
    if (results.length > 0 && mode && user?.id) {
      saveKanaPracticeResults(user.id, mode, results).catch(err => {
        console.error('Error saving kana practice results:', err);
      });
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Session complete</Text>
        <Text style={styles.subtitle}>
          {totalRounds} rounds · {modeLabel}
        </Text>

        {/* Top stats */}
        <View style={styles.statsRow}>
          <StatBox label="○ Perfect" value={perfect} total={totalRounds} accent color="#4A90E2" />
          <StatBox label="△ Good" value={good} total={totalRounds} color="#4CAF50" />
          <StatBox label="× Skipped" value={skipped} total={totalRounds} color="#888" />
        </View>
        <View style={styles.statsRow}>
          <StatBox label="Best streak" value={streak} />
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
                <Text style={[styles.gradeSymbol, { color: gradeColor }]}>{grade}</Text>
                <View style={styles.roundInfo}>
                  <Text style={styles.roundKana}>{r.kana}</Text>
                  <Text style={styles.roundRomaji}>{r.romaji}</Text>
                </View>
                <Text style={styles.roundTime}>{formatTime(r.timeMs)}</Text>
                <Text style={[styles.roundStatus, { color: gradeColor }]}>{gradeLabel}</Text>
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Learn')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Practice again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
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
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A', gap: 10,
  },
  gradeSymbol: {
    fontSize: 18,
    fontWeight: '700',
    width: 24,
  },
  roundInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundKana: {
    color: '#EFEFEF',
    fontSize: 20,
    fontWeight: '400',
  },
  roundRomaji: {
    color: '#666',
    fontSize: 13,
  },
  roundTime: { color: '#555', fontSize: 12 },
  roundStatus: { fontSize: 11, width: 60, textAlign: 'right', fontWeight: '600' },
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
