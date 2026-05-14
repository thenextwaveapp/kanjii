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
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchKanji, fetchUserSentences } from '../services/progress';
import { toHiragana } from 'wanakana';
import { supabase } from '../services/supabase';
import {
  fetchSentenceLists,
  createSentenceList,
  addSentenceToList,
  removeSentenceFromList,
} from '../services/sentenceLists';
import { speakJapanese, stopSpeaking } from '../services/tts';
import { useSettings } from '../contexts/SettingsContext';
import { VOICE_OPTIONS } from '../services/settings';

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

  // Sentence lists state
  const [sentenceLists, setSentenceLists] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#E85D3A');
  const [activeListFilters, setActiveListFilters] = useState([]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) { setLoading(false); return; }
      setLoading(true);
      Promise.all([
        fetchKanji(user.id),
        fetchUserSentences(user.id),
        fetchSentenceLists(user.id),
      ]).then(([kanji, sents, lists]) => {
        setKanjiList(kanji);
        setSentences(sents);
        setSentenceLists(lists);
        setLoading(false);
      });
    }, [user?.id])
  );

  const handleCreateList = async () => {
    if (!newListName.trim() || !user?.id) return;
    try {
      const newList = await createSentenceList(user.id, newListName.trim(), newListColor);
      setSentenceLists([...sentenceLists, newList]);
      setNewListName('');
      setNewListColor('#E85D3A');
      setShowListModal(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const toggleSentenceInList = async (listId, sentenceId, isInList) => {
    try {
      if (isInList) {
        await removeSentenceFromList(listId, sentenceId);
      } else {
        await addSentenceToList(listId, sentenceId);
      }
      // Refresh sentences to update list membership
      const sents = await fetchUserSentences(user.id);
      setSentences(sents);
    } catch (error) {
      console.error('Failed to toggle sentence in list:', error);
    }
  };

  const toggleListFilter = (listId) => {
    setActiveListFilters(prev =>
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  // Search when query changes (works for both kanji and sentences)
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      const query = searchQuery.toLowerCase().trim();
      const hiraganaQuery = toHiragana(query);

      if (mode === 'kanji') {
        // Search kanji_dictionary for matches
        // 1. Search in kanji character directly
        const { data: kanjiMatches } = await supabase
          .from('kanji_dictionary')
          .select('*')
          .ilike('kanji', `%${query}%`)
          .limit(50);

        // 2. Search in meanings array
        const { data: meaningMatches } = await supabase
          .rpc('search_kanji_meanings', { search_query: query })
          .limit(200);

        // 3. Get all kanji and filter by exact reading match
        const { data: allKanji } = await supabase
          .from('kanji_dictionary')
          .select('*')
          .limit(1000);

        // Filter for exact reading matches (hiragana or romaji)
        const readingMatches = (allKanji || []).filter(k => {
          const hasExactHiraganaMatch = k.readings?.some(r =>
            r.toLowerCase() === query || r.toLowerCase() === hiraganaQuery
          );
          const hasExactRomajiMatch = k.readings_romaji?.some(r =>
            r.toLowerCase() === query
          );
          return hasExactHiraganaMatch || hasExactRomajiMatch;
        });

        // Combine and sort by relevance
        const seen = new Set();
        const allResults = [];

        // Helper to calculate relevance score (lower = better)
        const getRelevance = (k) => {
          // Get JLPT level weight (N5=10, N4=20, N3=30, N2=40, N1=50, unknown=60)
          const jlptWeight = k.jlpt_level ?
            parseInt(k.jlpt_level.replace('N', '')) * 10 : 60;

          // Base relevance by match type (multiply by 100 to prioritize over JLPT)
          let baseRelevance = 500; // default

          // Exact kanji match (highest)
          if (k.kanji === query) {
            baseRelevance = 100;
          }
          // Exact reading match
          else if (
            k.readings?.some(r =>
              r.toLowerCase() === query || r.toLowerCase() === hiraganaQuery
            ) || k.readings_romaji?.some(r => r.toLowerCase() === query)
          ) {
            baseRelevance = 200;
          }
          // Exact meaning match
          else if (k.meanings?.some(m => m.toLowerCase() === query)) {
            baseRelevance = 300;
          }
          // Meaning starts with query
          else if (k.meanings?.some(m => m.toLowerCase().startsWith(query))) {
            baseRelevance = 400;
          }

          // Combine: match type + JLPT level (e.g., exact match N5 = 100+10=110, contains N1 = 500+50=550)
          return baseRelevance + jlptWeight;
        };

        // Collect all unique results with relevance
        [...readingMatches, ...(kanjiMatches || []), ...(meaningMatches || [])].forEach(k => {
          if (!seen.has(k.kanji)) {
            seen.add(k.kanji);
            allResults.push({ ...k, relevance: getRelevance(k) });
          }
        });

        // Sort by relevance (lower number = higher priority) and limit to top 20
        let dictResults = allResults
          .sort((a, b) => a.relevance - b.relevance)
          .slice(0, 20);

        // Fetch complete data for kanji that don't have readings (from RPC results)
        const kanjiNeedingData = dictResults.filter(k => !k.readings || k.readings.length === 0).map(k => k.kanji);
        if (kanjiNeedingData.length > 0) {
          const { data: completeData } = await supabase
            .from('kanji_dictionary')
            .select('*')
            .in('kanji', kanjiNeedingData);

          const completeDataMap = new Map((completeData || []).map(d => [d.kanji, d]));

          dictResults = dictResults.map(k => {
            if (kanjiNeedingData.includes(k.kanji)) {
              const complete = completeDataMap.get(k.kanji);
              return complete ? { ...k, ...complete } : k;
            }
            return k;
          });
        }

        // Merge user progress with dictionary results
        const userKanjiMap = new Map(kanjiList.map(k => [k.kanji, k]));

        const merged = (dictResults || []).map(dictKanji => {
          const userKanji = userKanjiMap.get(dictKanji.kanji);

          // Normalize meanings to array (handle both string and array formats)
          const normalizeMeanings = (m) => {
            if (!m) return [];
            if (Array.isArray(m)) return m;
            return [m]; // Convert string to array
          };

          // Normalize and filter readings to remove null/undefined/empty values
          const normalizeReadings = (r) => {
            if (!r) return [];
            if (Array.isArray(r)) return r.filter(reading => reading && typeof reading === 'string' && reading.trim());
            if (typeof r === 'string' && r.trim()) return [r];
            return [];
          };

          const normalizedReadings = normalizeReadings(dictKanji.readings);
          const normalizedMeanings = normalizeMeanings(dictKanji.meanings);

          // Always use dictionary data from search results, merge with user data if available
          return {
            ...(userKanji || {}),
            kanji: dictKanji.kanji,
            dictReadings: normalizedReadings,
            dictMeanings: normalizedMeanings,
            // For new kanji without user data, set defaults
            seen_count: userKanji?.seen_count ?? 0,
            skip_count: userKanji?.skip_count ?? 0,
            mastery: userKanji?.mastery ?? null,
            jlpt_level: dictKanji.jlpt_level || userKanji?.jlpt_level || 'unknown',
          };
        });

        setSearchResults(merged);
      } else {
        // Search sentences by japanese or english text
        const filtered = sentences.filter(s =>
          s.japanese?.toLowerCase().includes(query) ||
          s.japanese?.includes(hiraganaQuery) ||
          s.english?.toLowerCase().includes(query)
        );
        setSearchResults(filtered);
      }

      setSearching(false);
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, kanjiList, sentences, mode]);

  // Filter kanji based on search and active tab
  const displayKanji = searchQuery.trim() ? searchResults : kanjiList;
  const filteredKanji = displayKanji.filter((k) => {
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

  // Filter sentences based on search and active list filters
  let displaySentences = searchQuery.trim() ? searchResults : sentences;

  // Apply list filters if any are active
  if (mode === 'sentences' && activeListFilters.length > 0) {
    displaySentences = displaySentences.filter(s =>
      activeListFilters.some(listId => s.listIds?.includes(listId))
    );
  }

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

      {/* Search bar - works for both tabs */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={
            mode === 'kanji'
              ? 'Search kanji, meaning, or reading...'
              : 'Search sentences...'
          }
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

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'kanji' && styles.modeBtnActive]}
          onPress={() => {
            setMode('kanji');
            setSearchQuery(''); // Clear search when switching tabs
          }}
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
          onPress={() => {
            setMode('sentences');
            setSearchQuery(''); // Clear search when switching tabs
          }}
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
          sentences={displaySentences}
          searchQuery={searchQuery}
          lists={sentenceLists}
          activeFilters={activeListFilters}
          onToggleFilter={toggleListFilter}
          onPractice={practiceSentence}
          onOpenListModal={() => setShowListModal(true)}
          onToggleSentenceInList={toggleSentenceInList}
          navigation={navigation}
        />
      )}

      {/* Create List Modal */}
      <Modal
        visible={showListModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New List</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="List name..."
              placeholderTextColor="#555"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.colorPicker}>
              {['#E85D3A', '#4A90E2', '#4CAF50', '#FFA726', '#AB47BC', '#EC407A'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newListColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => setNewListColor(color)}
                />
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowListModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleCreateList}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function KanjiView({ kanjiList, filtered, activeTab, setActiveTab, weakKanji, onDrill, navigation }) {
  const { settings } = useSettings();
  const [playingKanji, setPlayingKanji] = React.useState(null);
  const [currentSound, setCurrentSound] = React.useState(null);

  const handleReadingsPress = async (kanji, readings, e) => {
    e?.stopPropagation();

    if (!readings || readings.length === 0) return;

    // Stop current sound if playing
    if (currentSound) {
      await stopSpeaking(currentSound);
      setCurrentSound(null);
      setPlayingKanji(null);
    }

    try {
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);
      setPlayingKanji(kanji);

      // Play first 3 readings in sequence
      for (let i = 0; i < Math.min(3, readings.length); i++) {
        const reading = readings[i];
        const hiraganaReading = toHiragana(reading);

        const sound = await speakJapanese(hiraganaReading, {
          voice: voiceConfig?.voice,
          rate: settings.speechRate,
        });

        setCurrentSound(sound);

        // Wait for sound to finish
        await new Promise((resolve) => {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              resolve();
            }
          });
        });

        // Small pause between readings
        if (i < Math.min(3, readings.length) - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      setPlayingKanji(null);
      setCurrentSound(null);
    } catch (error) {
      console.error('TTS error:', error);
      setPlayingKanji(null);
      setCurrentSound(null);
    }
  };

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
                  {k.dictReadings && k.dictReadings.length > 0 && (
                    <TouchableOpacity
                      style={styles.cardReadingsContainer}
                      onPress={(e) => handleReadingsPress(k.kanji, k.dictReadings, e)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardReadingsRow}>
                        <Text style={[
                          styles.cardReadings,
                          playingKanji === k.kanji && styles.cardReadingsPlaying
                        ]}>
                          {k.dictReadings.slice(0, 3).map(r => toHiragana(r)).join('・')}
                        </Text>
                        <Text style={styles.cardSpeakerIcon}>🔊</Text>
                      </View>
                      {k.dictMeanings && k.dictMeanings.length > 0 && (
                        <Text style={styles.cardMeanings}>
                          {k.dictMeanings.slice(0, 2).join(', ')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
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
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </>
  );
}

function SentencesView({ sentences, searchQuery, lists, activeFilters, onToggleFilter, onPractice, onOpenListModal, onToggleSentenceInList, navigation }) {
  if (sentences.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'No results found' : 'No sentences yet'}
        </Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'Try a different search term'
            : 'Complete a practice round to see your sentences here'}
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* List badges or plus button */}
      <View style={styles.listBadgesContainer}>
        {lists.length === 0 ? (
          <TouchableOpacity
            style={styles.addListButton}
            onPress={onOpenListModal}
          >
            <Text style={styles.addListButtonText}>+</Text>
          </TouchableOpacity>
        ) : (
          <>
            {lists.map(list => {
              const isActive = activeFilters.includes(list.id);
              return (
                <TouchableOpacity
                  key={list.id}
                  style={[
                    styles.listBadge,
                    { backgroundColor: list.color },
                    !isActive && styles.listBadgeInactive
                  ]}
                  onPress={() => onToggleFilter(list.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.listBadgeText}>{list.name}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.addListButtonSmall}
              onPress={onOpenListModal}
            >
              <Text style={styles.addListButtonText}>+</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

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
            {s.words && s.words.length > 0 && (
              <View style={styles.kanjiChipsRow}>
                {s.words.slice(0, 4).map((w, idx) => (
                  <TouchableOpacity
                    key={`${w.word}-${idx}`}
                    style={styles.kanjiChipSmall}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      const firstKanji = w.word?.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/)?.[0];
                      if (firstKanji) {
                        navigation.navigate('KanjiDetail', { kanji: firstKanji });
                      }
                    }}
                  >
                    <Text style={styles.kanjiChipWord}>{w.word}</Text>
                    {w.furigana && (
                      <Text style={styles.kanjiChipFurigana}>{w.furigana}</Text>
                    )}
                    {w.meaning && (
                      <Text style={styles.kanjiChipMeaning}>{w.meaning}</Text>
                    )}
                  </TouchableOpacity>
                ))}
                {s.words.length > 4 && (
                  <Text style={styles.moreKanji}>+{s.words.length - 4}</Text>
                )}
              </View>
            )}

            {/* Japanese and English */}
            <Text style={styles.sentenceJapanese}>{s.japanese}</Text>
            <Text style={styles.sentenceEnglish}>{s.english}</Text>

            {/* List checkboxes */}
            {lists.length > 0 && (
              <View style={styles.sentenceListsRow}>
                {lists.map(list => {
                  const isInList = s.listIds?.includes(list.id) || false;
                  return (
                    <TouchableOpacity
                      key={list.id}
                      style={[
                        styles.listCheckbox,
                        isInList && { backgroundColor: list.color }
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        onToggleSentenceInList(list.id, s.id, isInList);
                      }}
                    >
                      <Text style={[
                        styles.listCheckboxText,
                        isInList && styles.listCheckboxTextActive
                      ]}>
                        {list.name.charAt(0)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Practice hint */}
            <View style={styles.sentenceFooter}>
              <Text style={styles.practiceHint}>Tap to practice →</Text>
            </View>
          </TouchableOpacity>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
    </>
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
    padding: 16,
  },
  kanjiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kanjiCardLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    flex: 1,
  },
  kanjiChar: {
    fontSize: 48,
    color: '#EFEFEF',
    fontWeight: '400',
    lineHeight: 48,
  },
  cardReadingsContainer: {
    gap: 3,
  },
  cardReadingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardReadings: {
    fontSize: 12,
    color: '#E85D3A',
    fontWeight: '600',
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  cardReadingsPlaying: {
    opacity: 0.6,
  },
  cardSpeakerIcon: {
    fontSize: 11,
    opacity: 0.4,
  },
  cardMeanings: {
    fontSize: 11,
    color: '#777',
    letterSpacing: 0.2,
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
  readingChip: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
    maxWidth: 120,
  },
  readingChipKanji: {
    color: '#EFEFEF',
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 2,
  },
  readingChipFurigana: {
    color: '#E85D3A',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  readingChipMeaning: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  kanjiChipWord: {
    color: '#EFEFEF',
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 2,
  },
  kanjiChipFurigana: {
    color: '#E85D3A',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kanjiChipMeaning: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
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
  listBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addListButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#E85D3A',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addListButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#E85D3A',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addListButtonText: {
    color: '#E85D3A',
    fontSize: 20,
    fontWeight: '700',
  },
  listBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listBadgeInactive: {
    opacity: 0.3,
  },
  listBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  sentenceListsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  listCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCheckboxText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listCheckboxTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#EFEFEF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#EFEFEF',
    fontSize: 16,
    marginBottom: 16,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtonCreate: {
    backgroundColor: '#E85D3A',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
