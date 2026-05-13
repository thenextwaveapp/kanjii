import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getNewKanjiSince } from '../services/progress';

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

export default function SummaryScreen({ navigation, route, user }) {
  const { results = [], sessionStart, rounds, difficulty, domain = 'Any' } = route.params || {};
  const [newKanji, setNewKanji] = useState([]);

  const correct = results.filter((r) => !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const streak = longestCorrectStreak(results);
  const avgTime = results.length > 0
    ? results.reduce((s, r) => s + r.timeMs, 0) / results.length
    : 0;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (user?.id && sessionStart) {
      getNewKanjiSince(user.id, sessionStart).then(setNewKanji);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Session complete</Text>
        <Text style={styles.subtitle}>
          {rounds} rounds · {domain === 'Any' ? 'Any topic' : domain} · {difficulty}
        </Text>

        {/* Top stats */}
        <View style={styles.statsRow}>
          <StatBox label="Correct" value={correct} total={rounds} accent />
          <StatBox label="Skipped" value={skipped} total={rounds} />
          <StatBox label="Best streak" value={streak} />
          <StatBox label="Avg. time" value={formatTime(avgTime)} raw />
        </View>

        {/* Per-round breakdown */}
        <Text style={styles.sectionLabel}>Rounds</Text>
        <View style={styles.roundList}>
          {results.map((r, i) => (
            <View key={i} style={styles.roundRow}>
              <View style={[styles.roundDot, r.skipped ? styles.dotSkipped : styles.dotCorrect]} />
              <Text style={styles.roundLabel}>Round {r.round}</Text>
              <Text style={styles.roundTime}>{formatTime(r.timeMs)}</Text>
              <Text style={styles.roundStatus}>{r.skipped ? 'skipped' : 'correct'}</Text>
            </View>
          ))}
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
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace('RoundSelect')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Play again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, total, accent, raw }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>
        {raw ? value : total !== undefined ? `${value}/${total}` : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 24, paddingBottom: 60 },
  title: { color: '#EFEFEF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 16 },
  subtitle: { color: '#555', fontSize: 14, marginTop: 4, marginBottom: 28 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  statBox: {
    flex: 1, backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#222',
    paddingVertical: 14, alignItems: 'center', gap: 4,
  },
  statValue: { color: '#EFEFEF', fontSize: 18, fontWeight: '800' },
  statValueAccent: { color: '#E85D3A' },
  statLabel: { color: '#555', fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionLabel: {
    color: '#555', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
  },
  roundList: {
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#222',
    marginBottom: 32, overflow: 'hidden',
  },
  roundRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A', gap: 10,
  },
  roundDot: { width: 8, height: 8, borderRadius: 4 },
  dotCorrect: { backgroundColor: '#4CAF50' },
  dotSkipped: { backgroundColor: '#333' },
  roundLabel: { color: '#EFEFEF', fontSize: 13, flex: 1 },
  roundTime: { color: '#555', fontSize: 12 },
  roundStatus: { color: '#444', fontSize: 11, width: 50, textAlign: 'right' },
  kanjiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  newKanjiCard: {
    backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#E85D3A',
    padding: 12, width: 72, alignItems: 'center', gap: 4,
  },
  newKanjiChar: { fontSize: 26, color: '#EFEFEF' },
  newKanjiMeaning: { fontSize: 9, color: '#555', textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#E85D3A', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1, borderColor: '#222', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  secondaryButtonText: { color: '#555', fontSize: 14 },
});
