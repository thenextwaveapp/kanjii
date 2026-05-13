import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { fetchKanjiDetail } from '../services/progress';

export default function KanjiDetailScreen({ navigation, route, user }) {
  const { kanji } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchKanjiDetail(user.id, kanji).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [kanji, user?.id]);

  const kd = data?.kanjiData;
  const sentences = data?.sentences || [];

  const drillThis = () => {
    navigation.navigate('Practice', {
      rounds: 5,
      difficulty: 'Mixed',
      domain: 'Any',
      reviewKanji: [kanji],
    });
  };

  const practiceSentence = (sentence) => {
    navigation.navigate('Practice', {
      rounds: 1,
      difficulty: 'Mixed',
      domain: 'Any',
      singleSentence: sentence,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#E85D3A" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Big character */}
          <View style={styles.heroBox}>
            <Text style={styles.heroChar}>{kanji}</Text>
            {kd && (
              <View style={styles.readingsRow}>
                {(kd.readings || []).map((r) => (
                  <View key={r} style={styles.readingChip}>
                    <Text style={styles.readingChipText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
            {kd?.jlpt_level && kd.jlpt_level !== 'unknown' && (
              <View style={styles.jlptBadge}>
                <Text style={styles.jlptText}>{kd.jlpt_level}</Text>
              </View>
            )}
          </View>

          {/* Meanings */}
          {kd?.meanings?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Meanings</Text>
              <View style={styles.meaningsBox}>
                {kd.meanings.map((m, i) => (
                  <View key={i} style={styles.meaningRow}>
                    <Text style={styles.meaningIndex}>{i + 1}</Text>
                    <Text style={styles.meaningText}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats */}
          {kd && (
            <View style={styles.statsRow}>
              <StatBox label="Times written" value={kd.seen_count} accent />
              <StatBox label="Times skipped" value={kd.skip_count} />
              <StatBox
                label="Status"
                value={kd.seen_count >= 8 ? 'Mastered' : kd.seen_count > 0 ? 'Learning' : 'New'}
                raw
              />
            </View>
          )}

          {/* Drill button */}
          <TouchableOpacity style={styles.drillButton} onPress={drillThis} activeOpacity={0.85}>
            <Text style={styles.drillButtonText}>Drill this kanji</Text>
          </TouchableOpacity>

          {/* Sentences */}
          {sentences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Your sentences ({sentences.length})
              </Text>
              {sentences.map((s, i) => (
                <TouchableOpacity
                  key={s.id ?? i}
                  style={styles.sentenceCard}
                  onPress={() => practiceSentence(s)}
                  activeOpacity={0.8}
                >
                  <SentenceWithHighlight sentence={s.japanese} target={kanji} />
                  <Text style={styles.sentenceEnglish} numberOfLines={2}>{s.english}</Text>
                  <View style={styles.sentenceFooter}>
                    {s.attempts > 1 && (
                      <Text style={styles.sentenceAttempts}>{s.attempts} attempts</Text>
                    )}
                    <Text style={styles.practiceHint}>Tap to practice →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {sentences.length === 0 && kd && (
            <View style={styles.noSentences}>
              <Text style={styles.noSentencesText}>
                No completed sentences with this kanji yet.
              </Text>
            </View>
          )}

          {!kd && (
            <View style={styles.noSentences}>
              <Text style={styles.noSentencesText}>
                You haven't encountered this kanji in a completed round yet.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SentenceWithHighlight({ sentence, target }) {
  if (!sentence) return null;
  const parts = sentence.split(target);
  return (
    <Text style={styles.sentenceJapanese}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <Text style={styles.highlight}>{target}</Text>
          )}
        </React.Fragment>
      ))}
    </Text>
  );
}

function StatBox({ label, value, accent, raw }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
  },
  backText: { color: '#555', fontSize: 14 },
  logo: { fontSize: 20, color: '#EFEFEF', fontWeight: '800', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingBottom: 60 },
  heroBox: {
    alignItems: 'center', paddingVertical: 32,
    backgroundColor: '#111', borderRadius: 24, borderWidth: 1, borderColor: '#222',
    marginBottom: 24, gap: 12,
  },
  heroChar: { fontSize: 96, color: '#EFEFEF', lineHeight: 116 },
  readingsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  readingChip: {
    backgroundColor: '#1A1A1A', borderRadius: 20, borderWidth: 1, borderColor: '#333',
    paddingHorizontal: 14, paddingVertical: 5,
  },
  readingChipText: { color: '#E85D3A', fontSize: 15 },
  jlptBadge: {
    backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#333',
    paddingHorizontal: 10, paddingVertical: 3,
  },
  jlptText: { color: '#555', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  section: { marginBottom: 28 },
  sectionLabel: {
    color: '#555', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: 12,
  },
  meaningsBox: {
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  meaningRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  meaningIndex: { color: '#333', fontSize: 12, width: 16, textAlign: 'center' },
  meaningText: { color: '#EFEFEF', fontSize: 15, flex: 1 },
  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  statBox: {
    flex: 1, backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1A1A1A',
    paddingVertical: 14, alignItems: 'center', gap: 4,
  },
  statValue: { color: '#EFEFEF', fontSize: 20, fontWeight: '800' },
  statValueAccent: { color: '#E85D3A' },
  statLabel: { color: '#555', fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
  drillButton: {
    backgroundColor: '#E85D3A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 32,
  },
  drillButtonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  sentenceCard: {
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1A1A1A',
    padding: 16, marginBottom: 8, gap: 6,
  },
  sentenceJapanese: { color: '#EFEFEF', fontSize: 18, lineHeight: 28 },
  highlight: { color: '#E85D3A', fontWeight: '700' },
  sentenceEnglish: { color: '#555', fontSize: 13, lineHeight: 18 },
  sentenceFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
  },
  sentenceAttempts: { color: '#333', fontSize: 11 },
  practiceHint: { color: '#E85D3A', fontSize: 12, fontWeight: '600' },
  noSentences: { alignItems: 'center', paddingVertical: 24 },
  noSentencesText: { color: '#444', fontSize: 13, textAlign: 'center' },
});
