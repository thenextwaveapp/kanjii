import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import { toRomaji, toHiragana } from 'wanakana';
import { fetchKanjiDetail } from '../services/progress';
import StrokeOrder from '../components/StrokeOrder';
import { speakJapanese, stopSpeaking } from '../services/tts';
import { useSettings } from '../contexts/SettingsContext';
import { VOICE_OPTIONS } from '../services/settings';

export default function KanjiDetailScreen({ navigation, route, user }) {
  const { kanji } = route.params;
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStrokeOrder, setShowStrokeOrder] = useState(false);
  const [playingReading, setPlayingReading] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchKanjiDetail(user.id, kanji).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [kanji, user?.id]);

  const kd = data?.kanjiData;
  const sentences = data?.sentences || [];
  const exampleSentences = data?.exampleSentences || [];

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

  const handleReadingLongPress = async (reading) => {
    // Stop current sound if playing
    if (currentSound) {
      await stopSpeaking(currentSound);
      setCurrentSound(null);
      setPlayingReading(null);
    }

    try {
      setPlayingReading(reading);
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);
      const sound = await speakJapanese(reading, {
        voice: voiceConfig?.voice,
        rate: settings.speechRate,
      });

      setCurrentSound(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingReading(null);
          setCurrentSound(null);
        }
      });
    } catch (error) {
      console.error('TTS error:', error);
      setPlayingReading(null);
      setCurrentSound(null);
    }
  };

  const handleMainReadingsPress = async () => {
    if (!kd?.dictReadings || kd.dictReadings.length === 0) return;

    // Stop current sound if playing
    if (currentSound) {
      await stopSpeaking(currentSound);
      setCurrentSound(null);
      setPlayingReading(null);
    }

    try {
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);

      // Play all readings in sequence
      for (let i = 0; i < Math.min(4, kd.dictReadings.length); i++) {
        const reading = kd.dictReadings[i];
        const hiraganaReading = toHiragana(reading);

        setPlayingReading(hiraganaReading);

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
        if (i < Math.min(4, kd.dictReadings.length) - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      setPlayingReading(null);
      setCurrentSound(null);
    } catch (error) {
      console.error('TTS error:', error);
      setPlayingReading(null);
      setCurrentSound(null);
    }
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
          {/* Big character with readings flowing to the right and wrapping */}
          <View style={styles.heroBox}>
            {/* Kanji + badges */}
            <View style={styles.kanjiColumn}>
              <Text style={styles.heroChar}>{kanji}</Text>
              <View style={styles.badgesRow}>
                {kd?.jlpt_level && kd.jlpt_level !== 'unknown' && (
                  <View style={styles.jlptBadge}>
                    <Text style={styles.jlptText}>{kd.jlpt_level}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.strokeOrderButton}
                  onPress={() => setShowStrokeOrder(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.strokeOrderButtonText}>字</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dictionary readings */}
            {kd?.dictReadings && kd.dictReadings.length > 0 && kd.dictReadings.map((reading, i) => {
              const hiraganaReading = toHiragana(reading);
              return (
                <TouchableOpacity
                  key={`dict-${reading}-${i}`}
                  style={[
                    styles.readingChip,
                    playingReading === hiraganaReading && styles.readingChipPlaying
                  ]}
                  onLongPress={() => handleReadingLongPress(hiraganaReading)}
                  activeOpacity={0.7}
                  delayLongPress={100}
                >
                  <Text style={styles.readingChipKanji}>{kanji}</Text>
                  <Text style={styles.readingChipText}>{hiraganaReading}</Text>
                  <Text style={styles.readingChipRomaji}>{toRomaji(hiraganaReading)}</Text>
                  {kd.dictMeanings && kd.dictMeanings.length > 0 && (
                    <Text style={styles.readingChipMeaning} numberOfLines={2}>
                      {kd.dictMeanings.slice(0, 2).join(', ')}
                    </Text>
                  )}
                  <Text style={styles.readingChipHint}>🔊</Text>
                </TouchableOpacity>
              );
            })}

            {/* Example words */}
            {kd?.exampleWords && kd.exampleWords.length > 0 && kd.exampleWords.map((w, i) => (
              <TouchableOpacity
                key={`example-${w.word}-${i}`}
                style={[
                  styles.readingChip,
                  playingReading === w.furigana && styles.readingChipPlaying
                ]}
                onLongPress={() => handleReadingLongPress(w.furigana)}
                activeOpacity={0.7}
                delayLongPress={100}
              >
                <Text style={styles.readingChipKanji}>{w.word}</Text>
                <Text style={styles.readingChipText}>{w.furigana}</Text>
                <Text style={styles.readingChipRomaji}>{toRomaji(w.furigana)}</Text>
                {w.meaning && (
                  <Text style={styles.readingChipMeaning}>{w.meaning}</Text>
                )}
                <Text style={styles.readingChipHint}>🔊</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats */}
          {kd && (
            <View style={styles.statsRow}>
              <StatBox label="Times written" value={kd.seen_count} accent />
              <StatBox label="Times skipped" value={kd.skip_count} />
              <StatBox
                label="Mastery"
                value={kd.mastery || '×'}
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
                  <SentenceWithHighlight sentence={s.japanese} target={kanji} words={s.words} />
                  <EnglishWithHighlight english={s.english} words={s.words} target={kanji} />
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

          {/* Example Sentences */}
          {exampleSentences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Examples ({exampleSentences.length})
              </Text>
              {exampleSentences.map((s, i) => (
                <TouchableOpacity
                  key={s.id ?? i}
                  style={styles.sentenceCard}
                  onPress={() => practiceSentence(s)}
                  activeOpacity={0.8}
                >
                  <SentenceWithHighlight sentence={s.japanese} target={kanji} words={s.words} />
                  <EnglishWithHighlight english={s.english} words={s.words} target={kanji} />
                  <View style={styles.sentenceFooter}>
                    <Text style={styles.practiceHint}>Tap to practice →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {sentences.length === 0 && exampleSentences.length === 0 && kd && (
            <View style={styles.noSentences}>
              <Text style={styles.noSentencesText}>
                No sentences with this kanji found.
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

      {/* Stroke Order Modal */}
      <Modal
        visible={showStrokeOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStrokeOrder(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                <Text style={styles.modalKanji}>{kanji}</Text> Stroke Order
              </Text>
              <TouchableOpacity
                onPress={() => setShowStrokeOrder(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <StrokeOrder kanji={kanji} size={240} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SentenceWithHighlight({ sentence, target, words }) {
  if (!sentence) return null;

  // Get compound words from the words array that contain the target
  const compoundsToHighlight = (words || [])
    .filter(w => w.word && w.word.includes(target) && w.word.length > 1)
    .map(w => w.word);

  // Find positions of these compounds in the sentence
  const highlights = [];
  compoundsToHighlight.forEach(compound => {
    let pos = sentence.indexOf(compound);
    while (pos !== -1) {
      // Make sure we don't overlap with existing highlights
      const overlaps = highlights.some(h =>
        (pos >= h.index && pos < h.index + h.word.length) ||
        (pos + compound.length > h.index && pos < h.index + h.word.length)
      );
      if (!overlaps) {
        highlights.push({ word: compound, index: pos });
      }
      pos = sentence.indexOf(compound, pos + 1);
    }
  });

  // Also highlight single kanji not in compounds
  for (let i = 0; i < sentence.length; i++) {
    if (sentence[i] === target) {
      const isInCompound = highlights.some(h =>
        i >= h.index && i < h.index + h.word.length
      );
      if (!isInCompound) {
        highlights.push({ word: target, index: i });
      }
    }
  }

  // Sort by position
  highlights.sort((a, b) => a.index - b.index);

  // Build result
  let result = [];
  let lastIndex = 0;

  highlights.forEach((h, idx) => {
    if (h.index > lastIndex) {
      result.push(
        <Text key={`text-${idx}`}>{sentence.slice(lastIndex, h.index)}</Text>
      );
    }
    result.push(
      <Text key={`highlight-${idx}`} style={styles.highlight}>{h.word}</Text>
    );
    lastIndex = h.index + h.word.length;
  });

  if (lastIndex < sentence.length) {
    result.push(<Text key="text-end">{sentence.slice(lastIndex)}</Text>);
  }

  return <Text style={styles.sentenceJapanese}>{result}</Text>;
}

function EnglishWithHighlight({ english, words, target }) {
  if (!english || !words) return <Text style={styles.sentenceEnglish}>{english}</Text>;

  // Find words that contain the target kanji and get their meanings
  const meanings = words
    .filter(w => w.word && w.word.includes(target) && w.word.length > 1)
    .map(w => w.meaning?.toLowerCase())
    .filter(Boolean);

  if (meanings.length === 0) {
    return <Text style={styles.sentenceEnglish}>{english}</Text>;
  }

  // Highlight those meanings in the English text
  let result = [];
  let remaining = english.toLowerCase();
  let originalIndex = 0;

  meanings.forEach((meaning) => {
    const index = remaining.indexOf(meaning);
    if (index !== -1) {
      // Add text before
      if (index > 0) {
        result.push(
          <Text key={`before-${originalIndex}`}>
            {english.slice(originalIndex, originalIndex + index)}
          </Text>
        );
      }

      // Add highlighted meaning
      result.push(
        <Text key={`highlight-${originalIndex}`} style={styles.highlightEnglish}>
          {english.slice(originalIndex + index, originalIndex + index + meaning.length)}
        </Text>
      );

      originalIndex += index + meaning.length;
      remaining = remaining.slice(index + meaning.length);
    }
  });

  // Add remaining text
  if (originalIndex < english.length) {
    result.push(
      <Text key="end">{english.slice(originalIndex)}</Text>
    );
  }

  return <Text style={styles.sentenceEnglish}>{result.length > 0 ? result : english}</Text>;
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
    backgroundColor: '#111', borderRadius: 20, borderWidth: 1, borderColor: '#222',
    marginBottom: 20, padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
  },
  kanjiColumn: {
    gap: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  heroChar: { fontSize: 72, color: '#EFEFEF', lineHeight: 80 },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
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
    position: 'relative',
  },
  readingChipPlaying: {
    backgroundColor: '#222',
    borderColor: '#E85D3A',
  },
  readingChipKanji: {
    color: '#EFEFEF',
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 4,
  },
  readingChipText: {
    color: '#E85D3A',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  readingChipRomaji: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  readingChipMeaning: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  readingChipHint: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 9,
    opacity: 0.3,
  },
  jlptBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  jlptText: {
    color: '#E85D3A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  strokeOrderButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strokeOrderButtonText: {
    color: '#E85D3A',
    fontSize: 16,
    fontWeight: '600',
  },
  section: { marginBottom: 24 },
  sectionLabel: {
    color: '#555',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionHint: {
    color: '#444',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
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
    paddingVertical: 16, alignItems: 'center', marginBottom: 24,
  },
  drillButtonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  sentenceCard: {
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1A1A1A',
    padding: 16, marginBottom: 8, gap: 6,
  },
  sentenceJapanese: { color: '#EFEFEF', fontSize: 18, lineHeight: 28 },
  highlight: { color: '#E85D3A', fontWeight: '700' },
  sentenceEnglish: { color: '#555', fontSize: 13, lineHeight: 18 },
  highlightEnglish: { color: '#E85D3A', fontWeight: '600' },
  sentenceFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
  },
  sentenceAttempts: { color: '#333', fontSize: 11 },
  practiceHint: { color: '#666', fontSize: 12, fontWeight: '600' },
  noSentences: { alignItems: 'center', paddingVertical: 24 },
  noSentencesText: { color: '#444', fontSize: 13, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#EFEFEF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalKanji: {
    color: '#E85D3A',
    fontSize: 24,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    alignItems: 'center',
  },
});
