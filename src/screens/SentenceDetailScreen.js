import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { toRomaji } from 'wanakana';
import { speakJapanese, stopSpeaking } from '../services/tts';
import { supabase } from '../services/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { VOICE_OPTIONS } from '../services/settings';

function toHepburn(kana) {
  let r = toRomaji(kana)
    // Particles
    .replace(/\bha\b/g, 'wa')
    .replace(/\bhe\b/g, 'e')
    // n before vowels/y gets apostrophe
    .replace(/n([aeiouāīūēōy])/g, "n'$1")
    // Long vowels → macrons
    .replace(/ou/g, 'ō')
    .replace(/oo/g, 'ō')
    .replace(/uu/g, 'ū')
    .replace(/aa/g, 'ā')
    .replace(/ee/g, 'ē')
    .replace(/ii/g, 'ii'); // ii stays as ii in Hepburn
  return r;
}

function isKatakanaChar(ch) {
  return ch >= '\u30A0' && ch <= '\u30FF';
}

function tokenise(text, wordMap) {
  const words = Object.keys(wordMap).sort((a, b) => b.length - a.length);
  const segments = [];
  let remaining = text;

  while (remaining.length > 0) {
    let matched = false;

    // 1. Try to match a known word from the API
    for (const word of words) {
      if (remaining.startsWith(word)) {
        segments.push({ text: word, isWord: true });
        remaining = remaining.slice(word.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // 2. Detect a katakana run not already in wordMap
      if (isKatakanaChar(remaining[0])) {
        let kataStr = '';
        let i = 0;
        while (i < remaining.length && isKatakanaChar(remaining[i])) {
          kataStr += remaining[i];
          i++;
        }
        segments.push({ text: kataStr, isWord: true });
        remaining = remaining.slice(kataStr.length);
      } else {
        // 3. Plain character — merge with previous plain segment
        const last = segments[segments.length - 1];
        if (last && !last.isWord) {
          last.text += remaining[0];
        } else {
          segments.push({ text: remaining[0], isWord: false });
        }
        remaining = remaining.slice(1);
      }
    }
  }

  return segments;
}

export default function SentenceDetailScreen({ navigation, route, user }) {
  const { sentence: initialSentence } = route.params;
  const { settings } = useSettings();
  const [sentence, setSentence] = useState(initialSentence);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [playingWord, setPlayingWord] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user?.id || !sentence?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('user_progress')
        .select('attempts, completed_at, best_grade, practice_count, last_practiced_at')
        .eq('user_id', user.id)
        .eq('sentence_id', sentence.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats(data);
    } catch (error) {
      console.error('Error loading sentence stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);
      await speakJapanese(sentence.japanese, {
        voice: voiceConfig?.voice,
        rate: settings.speechRate,
      });
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setPlaying(false);
    }
  };

  const handlePractice = () => {
    navigation.navigate('Practice', {
      rounds: 1,
      difficulty: 'Mixed',
      domain: 'Any',
      singleSentence: sentence,
    });
  };

  const handleKanjiTap = (kanji) => {
    navigation.push('KanjiDetail', { kanji });
  };

  const handleWordSpeak = async (word) => {
    if (playingWord === word.word) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlayingWord(word.word);

    try {
      // Use furigana for pronunciation if available, otherwise use the word itself
      const textToSpeak = word.furigana || word.word;
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);
      await speakJapanese(textToSpeak, {
        voice: voiceConfig?.voice,
        rate: settings.speechRate,
      });
    } catch (error) {
      console.error('Word TTS error:', error);
    } finally {
      setPlayingWord(null);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === '○') return '#4A90E2';
    if (grade === '△') return '#4CAF50';
    return '#888';
  };

  // Generate romaji
  const wordMap = {};
  (sentence.words || []).forEach((w) => {
    wordMap[w.word] = { furigana: w.furigana, meaning: w.meaning };
  });

  const romaji = tokenise(sentence.japanese, wordMap)
    .map((seg) => {
      const reading = wordMap[seg.text]?.furigana ?? seg.text;
      return toHepburn(reading);
    })
    .join(' ')
    .replace(/\s+([。、！？.,!?])/g, '$1')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Main sentence card */}
        <View style={styles.heroBox}>
          <View style={styles.sentenceRow}>
            <Text style={styles.sentenceJapanese}>{sentence.japanese}</Text>
            <TouchableOpacity
              style={styles.speakerButton}
              onPress={handleSpeak}
              disabled={playing}
            >
              <Text style={[styles.speakerIcon, playing && styles.speakerPlaying]}>
                🔊
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sentenceRomaji}>{romaji}</Text>
          <Text style={styles.sentenceEnglish}>{sentence.english}</Text>

          {/* Metadata */}
          <View style={styles.metaRow}>
            {sentence.jlpt_level && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{sentence.jlpt_level}</Text>
              </View>
            )}
            {sentence.domain && (
              <View style={[styles.metaBadge, styles.metaBadgeSecondary]}>
                <Text style={styles.metaBadgeTextSecondary}>{sentence.domain}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#E85D3A" />
          </View>
        ) : stats ? (
          <View style={styles.statsBox}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>YOUR GRADE</Text>
              <Text style={[styles.statGrade, { color: getGradeColor(stats.best_grade) }]}>
                {stats.best_grade}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>PRACTICED</Text>
              <Text style={styles.statValue}>{stats.practice_count || 1}</Text>
            </View>
            {stats.completed_at && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>LAST PRACTICED</Text>
                  <Text style={styles.statValueSmall}>
                    {new Date(stats.completed_at).toLocaleDateString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.emptyStats}>
            <Text style={styles.emptyStatsText}>Not practiced yet</Text>
          </View>
        )}

        {/* Word breakdown */}
        {sentence.words && sentence.words.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WORD BREAKDOWN</Text>
            <View style={styles.wordsGrid}>
              {sentence.words.map((word, index) => {
                const firstKanji = word.word?.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/)?.[0];
                const isPlaying = playingWord === word.word;
                return (
                  <TouchableOpacity
                    key={`${word.word}-${index}`}
                    style={[styles.wordCard, isPlaying && styles.wordCardPlaying]}
                    onPress={() => firstKanji && handleKanjiTap(firstKanji)}
                    onLongPress={() => handleWordSpeak(word)}
                    disabled={!firstKanji && !word.word}
                  >
                    <Text style={styles.wordText}>{word.word}</Text>
                    {word.furigana && (
                      <Text style={styles.wordFurigana}>{word.furigana}</Text>
                    )}
                    {word.meaning && (
                      <Text style={styles.wordMeaning}>{word.meaning}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Practice button */}
        <TouchableOpacity
          style={styles.practiceButton}
          onPress={handlePractice}
          activeOpacity={0.85}
        >
          <Text style={styles.practiceButtonText}>
            {stats ? 'Practice again' : 'Practice this sentence'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backText: {
    color: '#555',
    fontSize: 14,
  },
  logo: {
    fontSize: 20,
    color: '#EFEFEF',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#E85D3A',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  heroBox: {
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    padding: 24,
    marginBottom: 16,
  },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sentenceJapanese: {
    flex: 1,
    color: '#EFEFEF',
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '400',
  },
  speakerButton: {
    padding: 8,
    marginLeft: 12,
  },
  speakerIcon: {
    fontSize: 24,
  },
  speakerPlaying: {
    opacity: 0.5,
  },
  sentenceRomaji: {
    color: '#666',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sentenceEnglish: {
    color: '#888',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    backgroundColor: '#E85D3A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  metaBadgeSecondary: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  metaBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metaBadgeTextSecondary: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingBox: {
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statsBox: {
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    padding: 20,
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#555',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statGrade: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statValue: {
    color: '#EFEFEF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statValueSmall: {
    color: '#EFEFEF',
    fontSize: 13,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#222',
    marginHorizontal: 8,
  },
  emptyStats: {
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStatsText: {
    color: '#555',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wordCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    minWidth: 100,
    gap: 4,
  },
  wordCardPlaying: {
    borderColor: '#E85D3A',
    backgroundColor: '#1A1A1A',
  },
  wordText: {
    color: '#EFEFEF',
    fontSize: 22,
    fontWeight: '400',
  },
  wordFurigana: {
    color: '#E85D3A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wordMeaning: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  practiceButton: {
    backgroundColor: '#E85D3A',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  practiceButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
