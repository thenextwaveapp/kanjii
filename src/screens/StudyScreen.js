import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchKanji, fetchUserSentences } from '../services/progress';
import { toRomaji, toHiragana } from 'wanakana';
import { supabase } from '../services/supabase';

const KANJI_TABS = ['All', 'Needs work', 'Mastered'];
const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/g;

function extractKanjiChars(text) {
  return [...new Set((text || '').match(KANJI_RE) || [])];
}

function getMasteryColor(mastery) {
  if (mastery === '○') return '#4A90E2'; // Blue for mastered
  if (mastery === '△') return '#4CAF50'; // Green for learning
  if (mastery === '×') return '#888'; // Grey for not learned
  return '#444'; // Default grey if no mastery set
}

export default function StudyScreen({ navigation, user }) {
  const [mode, setMode] = useState('kanji'); // 'kanji' | 'sentences'
  const [kanjiList, setKanjiList] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

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

  // Search database when query changes
  useEffect(() => {
    const searchDatabase = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      const query = searchQuery.toLowerCase();
      const hiraganaQuery = toHiragana(query);

      // Search kanji_dictionary for matches
      // 1. Search in kanji character directly
      const { data: kanjiMatches } = await supabase
        .from('kanji_dictionary')
        .select('kanji, meanings, readings')
        .ilike('kanji', `%${query}%`)
        .limit(50);

      // 2. Search in meanings array
      const { data: meaningMatches } = await supabase
        .rpc('search_kanji_meanings', { search_query: query })
        .limit(50);

      // 3. Search in readings with both original query AND hiragana version
      // This handles both romaji in DB ('kuruma') and hiragana ('くるま')
      const searches = [query];
      if (hiraganaQuery !== query) {
        searches.push(hiraganaQuery);
      }

      const readingResults = await Promise.all(
        searches.map(q =>
          supabase
            .rpc('search_kanji_readings', { search_query: q })
            .limit(50)
        )
      );

      const readingMatches = readingResults.flatMap(r => r.data || []);

      // Combine all results (remove duplicates)
      const seen = new Set();
      const dictResults = [];

      [...(kanjiMatches || []), ...(meaningMatches || []), ...(readingMatches || [])].forEach(k => {
        if (!seen.has(k.kanji)) {
          seen.add(k.kanji);
          dictResults.push(k);
        }
      });

      // Merge user progress with dictionary results
      const userKanjiMap = new Map(kanjiList.map(k => [k.kanji, k]));

      const merged = (dictResults || []).map(dictKanji => {
        const userKanji = userKanjiMap.get(dictKanji.kanji);
        if (userKanji) {
          // User has this kanji - use their data
          return userKanji;
        } else {
          // New kanji - use dictionary data with default values
          return {
            kanji: dictKanji.kanji,
            meanings: dictKanji.meanings || [],
            readings: dictKanji.readings || [],
            seen_count: 0,
            skip_count: 0,
            mastery: null,
            jlpt_level: 'unknown',
          };
        }
      });

      setSearchResults(merged);
      setSearching(false);
    };

    const debounce = setTimeout(searchDatabase, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, kanjiList]);

  // Use search results if searching, otherwise filter user's kanji
  const displayList = searchQuery.trim() ? searchResults : kanjiList;

  const filteredKanji = displayList.filter((k) => {
    // Skip tab filter when searching (show all results)
    if (searchQuery.trim()) return true;

    // Apply tab filter for user's kanji
    if (activeTab === 'Needs work' && !(k.mastery === '×' || k.mastery === '△' || !k.mastery)) {
      return false;
    }
    if (activeTab === 'Mastered' && k.mastery !== '○') {
      return false;
    }

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

      {/* Search bar */}
      {mode === 'kanji' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search kanji, meaning, or reading..."
            placeholderTextColor="#555"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.searchClear}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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

      {(loading || searching) ? (
        <View style={styles.center}>
          <ActivityIndicator color="#E85D3A" />
          {searching && <Text style={styles.searchingText}>Searching...</Text>}
        </View>
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
              <View style={styles.kanjiCardTop}>
                <View style={styles.kanjiCardLeft}>
                  <Text style={styles.kanjiChar}>{k.kanji}</Text>
                </View>
                <View style={styles.kanjiCardRight}>
                  {k.jlpt_level && k.jlpt_level !== 'unknown' && (
                    <View style={styles.jlptBadge}>
                      <Text style={styles.jlptText}>{k.jlpt_level}</Text>
                    </View>
                  )}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{k.seen_count}</Text>
                      <Text style={styles.statLabel}>✓</Text>
                    </View>
                    <View style={styles.statDividerSmall} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{k.skip_count}</Text>
                      <Text style={styles.statLabel}>⊘</Text>
                    </View>
                  </View>
                  {k.mastery && (
                    <Text style={[styles.masterySymbol, { color: getMasteryColor(k.mastery) }]}>
                      {k.mastery}
                    </Text>
                  )}
                </View>
              </View>

              {/* Readings */}
              {k.readings?.length > 0 && (
                <View style={styles.readingsRow}>
                  {k.readings.slice(0, 4).map((reading, idx) => (
                    <View key={idx} style={styles.readingPill}>
                      <Text style={styles.readingText}>{reading}</Text>
                    </View>
                  ))}
                  {k.readings.length > 4 && (
                    <Text style={styles.moreReadings}>+{k.readings.length - 4}</Text>
                  )}
                </View>
              )}

              {/* Meanings */}
              <View style={styles.meaningsContainer}>
                <Text style={styles.meanings} numberOfLines={2}>
                  {k.meanings?.slice(0, 3).join(', ') || '—'}
                </Text>
                {k.meanings?.length > 3 && (
                  <Text style={styles.moreMeanings}> +{k.meanings.length - 3}</Text>
                )}
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
        return (
          <TouchableOpacity
            style={styles.sentenceCard}
            onPress={() => onPractice(s)}
            activeOpacity={0.8}
          >
            {/* Kanji chips */}
            {kanjiChars.length > 0 && (
              <View style={styles.kanjiChipsRow}>
                {kanjiChars.slice(0, 6).map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    style={styles.kanjiChipSmall}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      navigation.navigate('KanjiDetail', { kanji: ch });
                    }}
                  >
                    <Text style={styles.kanjiChipTextSmall}>{ch}</Text>
                  </TouchableOpacity>
                ))}
                {kanjiChars.length > 6 && (
                  <Text style={styles.moreKanji}>+{kanjiChars.length - 6}</Text>
                )}
              </View>
            )}

            {/* Japanese and English */}
            <Text style={styles.sentenceJapanese}>{s.japanese}</Text>
            <Text style={styles.sentenceEnglish}>{s.english}</Text>

            {/* Practice hint */}
            <View style={styles.sentenceFooter}>
              <Text style={styles.practiceHint}>Tap to practice →</Text>
            </View>
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
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#EFEFEF',
    fontSize: 15,
  },
  searchClear: {
    position: 'absolute',
    right: 32,
    top: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: {
    color: '#555',
    fontSize: 16,
  },
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
  searchingText: { color: '#555', fontSize: 13, marginTop: 8 },
  emptyTitle: { color: '#EFEFEF', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#555', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  list: { padding: 16 },
  separator: { height: 8 },
  kanjiCard: {
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 14,
    gap: 10,
  },
  kanjiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kanjiCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kanjiChar: {
    fontSize: 40,
    color: '#EFEFEF',
    fontWeight: '400',
    lineHeight: 40,
  },
  kanjiCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  jlptBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  jlptText: {
    color: '#E85D3A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    color: '#EFEFEF',
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    color: '#555',
    fontSize: 11,
  },
  statDividerSmall: {
    width: 1,
    height: 12,
    backgroundColor: '#333',
  },
  masterySymbol: {
    fontSize: 22,
    fontWeight: '700',
  },
  readingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
  },
  readingPill: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readingText: {
    color: '#E85D3A',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  moreReadings: {
    color: '#555',
    fontSize: 10,
    fontWeight: '600',
  },
  meaningsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  meanings: {
    color: '#AAA',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  moreMeanings: {
    color: '#555',
    fontSize: 11,
    fontWeight: '600',
  },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillValue: { fontSize: 14, fontWeight: '700' },
  pillLabel: { fontSize: 10, color: '#444' },
  sentenceCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 18,
    gap: 12,
  },
  kanjiChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  kanjiChipSmall: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kanjiChipTextSmall: {
    color: '#E85D3A',
    fontSize: 14,
    fontWeight: '600',
  },
  moreKanji: {
    color: '#555',
    fontSize: 11,
    fontWeight: '600',
  },
  sentenceJapanese: {
    color: '#EFEFEF',
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '400',
  },
  sentenceEnglish: {
    color: '#888',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  sentenceFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  practiceHint: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
});
