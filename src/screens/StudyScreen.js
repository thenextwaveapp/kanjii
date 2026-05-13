import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchKanji, fetchUserSentences } from '../services/progress';

const KANJI_TABS = ['All', 'Needs work', 'Mastered'];
const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/g;

function extractKanjiChars(text) {
  return [...new Set((text || '').match(KANJI_RE) || [])];
}

function masteryLevel(k) {
  if (k.seen_count === 0) return 'unseen';
  if (k.seen_count >= 8) return 'mastered';
  return 'learning';
}

export default function StudyScreen({ navigation, user }) {
  const [mode, setMode] = useState('kanji'); // 'kanji' | 'sentences'
  const [kanjiList, setKanjiList] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) { setLoading(false); return; }
      setLoading(true);
      Promise.all([
        fetchKanji(user.id),
        fetchUserSentences(user.id),
      ]).then(([kanji, sents]) => {
        setKanjiList(kanji);
        setSentences(sents);
        setLoading(false);
      });
    }, [user?.id])
  );

  const filteredKanji = kanjiList.filter((k) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Needs work') return k.skip_count > k.seen_count || k.seen_count < 3;
    if (activeTab === 'Mastered') return k.seen_count >= 8;
    return true;
  });

  const weakKanji = kanjiList
    .filter((k) => k.skip_count > 0 || k.seen_count < 3)
    .sort((a, b) => (b.skip_count - b.seen_count) - (a.skip_count - a.seen_count))
    .slice(0, 5)
    .map((k) => k.kanji);

  const startDrill = () => {
    navigation.navigate('Practice', {
      rounds: Math.min(weakKanji.length > 0 ? 10 : 5, 10),
      difficulty: 'Mixed',
      domain: 'Any',
      reviewKanji: weakKanji,
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'kanji' && styles.modeBtnActive]}
          onPress={() => setMode('kanji')}
        >
          <Text style={[styles.modeBtnText, mode === 'kanji' && styles.modeBtnTextActive]}>
            Kanji
          </Text>
          {kanjiList.length > 0 && (
            <View style={[styles.modeBadge, mode === 'kanji' && styles.modeBadgeActive]}>
              <Text style={[styles.modeBadgeText, mode === 'kanji' && styles.modeBadgeTextActive]}>
                {kanjiList.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'sentences' && styles.modeBtnActive]}
          onPress={() => setMode('sentences')}
        >
          <Text style={[styles.modeBtnText, mode === 'sentences' && styles.modeBtnTextActive]}>
            Sentences
          </Text>
          {sentences.length > 0 && (
            <View style={[styles.modeBadge, mode === 'sentences' && styles.modeBadgeActive]}>
              <Text style={[styles.modeBadgeText, mode === 'sentences' && styles.modeBadgeTextActive]}>
                {sentences.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#E85D3A" /></View>
      ) : mode === 'kanji' ? (
        <KanjiView
          kanjiList={kanjiList}
          filtered={filteredKanji}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          weakKanji={weakKanji}
          onDrill={startDrill}
          navigation={navigation}
        />
      ) : (
        <SentencesView
          sentences={sentences}
          onPractice={practiceSentence}
          navigation={navigation}
        />
      )}
    </SafeAreaView>
  );
}

function KanjiView({ kanjiList, filtered, activeTab, setActiveTab, weakKanji, onDrill, navigation }) {
  return (
    <>
      {/* Sub-tabs */}
      <View style={styles.tabs}>
        {KANJI_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Drill button on Needs work */}
      {activeTab === 'Needs work' && weakKanji.length > 0 && (
        <TouchableOpacity style={styles.drillButton} onPress={onDrill} activeOpacity={0.85}>
          <Text style={styles.drillButtonText}>Drill weak kanji →</Text>
        </TouchableOpacity>
      )}

      {filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            {kanjiList.length === 0 ? 'No kanji yet' : 'Nothing here'}
          </Text>
          <Text style={styles.emptyText}>
            {kanjiList.length === 0
              ? 'Complete a practice session to start collecting kanji'
              : 'No kanji match this filter'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(k) => k.kanji}
          contentContainerStyle={styles.list}
          renderItem={({ item: k }) => (
            <TouchableOpacity
              style={styles.kanjiCard}
              onPress={() => navigation.navigate('KanjiDetail', { kanji: k.kanji })}
              activeOpacity={0.8}
            >
              <View style={styles.kanjiCardLeft}>
                <Text style={styles.kanjiChar}>{k.kanji}</Text>
                {k.readings?.[0] && (
                  <Text style={styles.reading}>{k.readings[0]}</Text>
                )}
              </View>
              <View style={styles.kanjiCardMiddle}>
                <Text style={styles.meaning} numberOfLines={2}>
                  {k.meanings?.[0] || '—'}
                </Text>
                {k.meanings?.length > 1 && (
                  <Text style={styles.moreMeanings}>+{k.meanings.length - 1} more</Text>
                )}
              </View>
              <View style={styles.kanjiCardRight}>
                <StatPill value={k.seen_count} label="written" color="#4CAF50" />
                <StatPill value={k.skip_count} label="skipped" color="#555" />
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </>
  );
}

function SentencesView({ sentences, onPractice, navigation }) {
  if (sentences.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No sentences yet</Text>
        <Text style={styles.emptyText}>
          Complete a practice round to see your sentences here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sentences}
      keyExtractor={(s, i) => s.id ?? String(i)}
      contentContainerStyle={styles.list}
      renderItem={({ item: s }) => {
        const kanjiChars = extractKanjiChars(s.japanese);
        const firstTry = s.attempts === 1;
        return (
          <TouchableOpacity
            style={[styles.sentenceCard, firstTry && styles.sentenceCardFirstTry]}
            onPress={() => onPractice(s)}
            activeOpacity={0.8}
          >
            {/* Attempt badge */}
            <View style={styles.sentenceTop}>
              {firstTry ? (
                <View style={styles.firstTryBadge}>
                  <Text style={styles.firstTryText}>First try</Text>
                </View>
              ) : (
                <View style={styles.attemptsBadge}>
                  <Text style={styles.attemptsText}>{s.attempts}× attempts</Text>
                </View>
              )}
            </View>

            <Text style={styles.sentenceJapanese}>{s.japanese}</Text>
            <Text style={styles.sentenceEnglish} numberOfLines={2}>{s.english}</Text>

            {/* Kanji chips */}
            {kanjiChars.length > 0 && (
              <View style={styles.kanjiChips}>
                {kanjiChars.map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    style={styles.kanjiChip}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      navigation.navigate('KanjiDetail', { kanji: ch });
                    }}
                  >
                    <Text style={styles.kanjiChipText}>{ch}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.practiceHint}>Tap to practice →</Text>
          </TouchableOpacity>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

function StatPill({ value, label, color }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
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
  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#222',
    backgroundColor: '#111',
  },
  modeBtnActive: { borderColor: '#E85D3A', backgroundColor: '#1A0A06' },
  modeBtnText: { color: '#555', fontSize: 14, fontWeight: '600' },
  modeBtnTextActive: { color: '#E85D3A' },
  modeBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  modeBadgeActive: { backgroundColor: '#E85D3A' },
  modeBadgeText: { color: '#555', fontSize: 10, fontWeight: '700' },
  modeBadgeTextActive: { color: '#fff' },
  tabs: {
    flexDirection: 'row', paddingHorizontal: 24, gap: 8,
    marginTop: 12, marginBottom: 4,
  },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#222',
  },
  tabActive: { backgroundColor: '#1A1A1A', borderColor: '#E85D3A' },
  tabText: { color: '#555', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#E85D3A' },
  drillButton: {
    marginHorizontal: 24, marginTop: 12, marginBottom: 4,
    backgroundColor: '#E85D3A', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  drillButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { color: '#EFEFEF', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#555', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  list: { padding: 16 },
  separator: { height: 8 },
  kanjiCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1A1A1A',
    padding: 16, gap: 12,
  },
  kanjiCardLeft: { alignItems: 'center', width: 48 },
  kanjiChar: { fontSize: 32, color: '#EFEFEF' },
  reading: { fontSize: 10, color: '#E85D3A', marginTop: 2 },
  kanjiCardMiddle: { flex: 1 },
  meaning: { color: '#EFEFEF', fontSize: 14, fontWeight: '500' },
  moreMeanings: { color: '#444', fontSize: 11, marginTop: 2 },
  kanjiCardRight: { gap: 6, alignItems: 'flex-end' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillValue: { fontSize: 14, fontWeight: '700' },
  pillLabel: { fontSize: 10, color: '#444' },
  sentenceCard: {
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1A1A1A',
    padding: 16, gap: 8,
  },
  sentenceCardFirstTry: { borderColor: '#1E3320' },
  sentenceTop: { flexDirection: 'row' },
  firstTryBadge: {
    backgroundColor: '#1E3320', borderRadius: 6, borderWidth: 1, borderColor: '#2D5030',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  firstTryText: { color: '#4CAF50', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  attemptsBadge: {
    backgroundColor: '#1A1A1A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  attemptsText: { color: '#444', fontSize: 10, fontWeight: '600' },
  sentenceJapanese: { color: '#EFEFEF', fontSize: 19, lineHeight: 28 },
  sentenceEnglish: { color: '#555', fontSize: 13, lineHeight: 18 },
  kanjiChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  kanjiChip: {
    backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#333',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  kanjiChipText: { color: '#E85D3A', fontSize: 16, fontWeight: '600' },
  practiceHint: { color: '#E85D3A', fontSize: 12, fontWeight: '600', marginTop: 2 },
});
