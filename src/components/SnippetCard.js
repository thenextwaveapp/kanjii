import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { toRomaji } from 'wanakana';
import { speakJapanese, stopSpeaking } from '../services/tts';
import { useSettings } from '../contexts/SettingsContext';
import { VOICE_OPTIONS } from '../services/settings';

export default function SnippetCard({ snippet, onViewDetail, sentenceLists = [], onSaveToList, sentenceListIds = [], autoPlaying = false, navigation }) {
  const { settings } = useSettings();
  const [revealed, setRevealed] = useState({});
  const [speaking, setSpeaking] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const isInAnyList = sentenceListIds.length > 0;

  // Get the color of the first list this sentence is in
  const activeListColor = isInAnyList
    ? sentenceLists.find(list => sentenceListIds.includes(list.id))?.color
    : null;

  if (!snippet) return null;

  const { japanese, english, words, best_grade, practice_count, last_practiced_at } = snippet;

  // Format last practiced time
  const formatLastPracticed = (timestamp) => {
    if (!timestamp) return null;
    const now = new Date();
    const practiced = new Date(timestamp);
    const diffMs = now - practiced;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const speak = async () => {
    if (speaking && currentSound) {
      try {
        await stopSpeaking(currentSound);
      } catch (e) {
        console.log('Error stopping sound:', e);
      }
      setCurrentSound(null);
      setSpeaking(false);
      return;
    }

    // Safety timeout to prevent stuck state
    const safetyTimeout = setTimeout(() => {
      console.log('⚠️ Manual TTS safety timeout - clearing speaking state');
      setSpeaking(false);
      setCurrentSound(null);
    }, 8000); // 8 seconds max

    try {
      setSpeaking(true);
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);
      const sound = await speakJapanese(japanese, {
        voice: voiceConfig?.voice,
        rate: settings.speechRate,
      });

      clearTimeout(safetyTimeout);
      setCurrentSound(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setSpeaking(false);
          setCurrentSound(null);
        }
      });
    } catch (error) {
      console.error('Speech error:', error);
      clearTimeout(safetyTimeout);
      setSpeaking(false);
      setCurrentSound(null);
    }
  };

  // Build a map of word → { furigana, meaning }
  const wordMap = {};
  (words || []).forEach((w) => {
    wordMap[w.word] = { furigana: w.furigana, meaning: w.meaning };
  });

  // Debug: log the wordMap
  console.log('WordMap:', wordMap);
  console.log('Japanese text:', japanese);

  // Split japanese text into tappable segments
  // We try to match known words, falling back to character-by-character
  const segments = tokenise(japanese, wordMap);
  console.log('Segments:', segments);

  const toggleWord = (word) => {
    console.log('Tapped word:', word);
    console.log('Word info:', wordMap[word]);
    setRevealed((prev) => ({ ...prev, [word]: !prev[word] }));
  };

  const handleKanjiTap = (kanji) => {
    if (navigation) {
      navigation.navigate('KanjiDetail', { kanji });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, (speaking || autoPlaying) && styles.cardPlaying]}
      onLongPress={speak}
      activeOpacity={1}
      delayLongPress={300}
    >
      {/* Hold indicator */}
      <View style={styles.holdIndicator}>
        <Text style={[styles.holdText, (speaking || autoPlaying) && styles.holdTextActive]}>
          {speaking || autoPlaying ? '🔊 Playing' : 'Hold to speak'}
        </Text>
      </View>

      {/* Top right buttons - save to list and detail */}
      <View style={styles.topRightInfo}>
        {onSaveToList && sentenceLists.length > 0 && (
          <TouchableOpacity
            style={[
              styles.iconButton,
              isInAnyList && styles.iconButtonSaved,
              isInAnyList && activeListColor && { backgroundColor: activeListColor, borderColor: activeListColor }
            ]}
            onPress={() => setShowSaveModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.iconButtonText, isInAnyList && styles.iconButtonTextSaved]}>
              {isInAnyList ? '✓' : '+'}
            </Text>
          </TouchableOpacity>
        )}

        {onViewDetail && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onViewDetail}
            activeOpacity={0.7}
          >
            <Text style={styles.detailIcon}>···</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom right buttons */}
      <View style={styles.topRightButtons}>
        <TouchableOpacity
          style={[styles.iconButton, showTranslation && styles.iconButtonActive]}
          onPress={() => setShowTranslation((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={[styles.iconButtonText, showTranslation && styles.iconButtonTextActive]}>訳</Text>
        </TouchableOpacity>
      </View>

      {/* Save to list modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <TouchableOpacity
          style={styles.saveModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSaveModal(false)}
        >
          <View style={styles.saveModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.saveModalTitle}>Add to list</Text>
            <ScrollView style={styles.saveModalScroll}>
              {sentenceLists.map(list => {
                const isInList = sentenceListIds.includes(list.id);
                return (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.saveListOption,
                      { borderLeftColor: list.color },
                      isInList && styles.saveListOptionActive
                    ]}
                    onPress={() => {
                      onSaveToList?.(list.id, isInList);
                      if (!isInList) setShowSaveModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveListName}>{list.name}</Text>
                    {isInList && <Text style={styles.saveListCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

        {/* Practice Stats */}
        {best_grade && practice_count && (
          <View style={styles.statsHeader}>
            <Text style={[styles.statsText, { fontSize: 13 * settings.textScale }]}>
              {best_grade} {practice_count}x
            </Text>
            {last_practiced_at && (
              <Text style={[styles.lastPracticedText, { fontSize: 11 * settings.textScale }]}>
                {formatLastPracticed(last_practiced_at)}
              </Text>
            )}
          </View>
        )}

      {/* Japanese text with tappable words - modular paired layout */}
      <View style={styles.wordsGrid}>
        {segments.map((seg, i) => {
          const info = wordMap[seg.text];
          const isRevealed = revealed[seg.text];
          // Only make words with kanji or katakana tappable (pure hiragana doesn't need furigana)
          const hasKanjiOrKatakana = /[\u4E00-\u9FFF\u3400-\u4DBF\u30A0-\u30FF]/.test(seg.text);
          const isTappable = info && hasKanjiOrKatakana;

          return (
            <TouchableOpacity
              key={i}
              onPress={() => isTappable && toggleWord(seg.text)}
              style={styles.wordModule}
              activeOpacity={isTappable ? 0.7 : 1}
              disabled={!isTappable}
            >
              {/* Furigana */}
              {isRevealed && isTappable && (
                <Text style={[styles.furiganaAligned, { fontSize: 11 * settings.textScale }]}>
                  {info.furigana}
                </Text>
              )}

              {/* Japanese word */}
              <Text style={[
                isTappable ? styles.kanjiText : styles.plainText,
                isRevealed && isTappable && styles.kanjiHighlighted,
                { fontSize: 26 * settings.textScale }
              ]}>
                {seg.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Word breakdown translation */}
      {showTranslation && (
        <>
          <View style={styles.divider} />
          <View style={styles.translationContainer}>
            {/* Word cards */}
            <View style={styles.wordCardsGrid}>
              {(words || []).map((word, index) => {
                const firstKanji = word.word?.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/)?.[0];
                const reading = word.furigana || word.word;
                const wordRomaji = toRomaji(reading);

                return (
                  <TouchableOpacity
                    key={`${word.word}-${index}`}
                    onPress={() => firstKanji && handleKanjiTap(firstKanji)}
                    disabled={!firstKanji}
                    activeOpacity={0.7}
                  >
                    <View style={styles.wordCard}>
                      <Text style={[styles.wordText, { fontSize: 22 * settings.textScale }]}>
                        {word.word}
                      </Text>
                      {word.furigana && (
                        <Text style={[styles.wordFurigana, { fontSize: 12 * settings.textScale }]}>
                          {word.furigana}
                        </Text>
                      )}
                      {wordRomaji && (
                        <Text style={[styles.wordRomaji, { fontSize: 10 * settings.textScale }]}>
                          {wordRomaji}
                        </Text>
                      )}
                      {word.meaning && (
                        <Text style={[styles.wordMeaning, { fontSize: 11 * settings.textScale }]}>
                          {word.meaning}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* English translation */}
            <Text style={[styles.englishText, { fontSize: 15 * settings.textScale, lineHeight: 22 * settings.textScale }]}>
              {english}
            </Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

function isKatakanaChar(ch) {
  return ch >= '\u30A0' && ch <= '\u30FF';
}

// Tokeniser: matches known words (kanji/katakana from wordMap) first,
// then detects bare katakana sequences as tappable, rest as plain text.
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

const ROW_H = 40; // fixed height every character occupies — nothing ever shifts

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111111',
    borderRadius: 10,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222222',
    width: '100%',
    position: 'relative',
  },
  cardPlaying: {
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  holdIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  holdText: {
    fontSize: 10,
    color: '#444',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  holdTextActive: {
    color: '#4A90E2',
  },
  topRightInfo: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  topRightButtons: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#E85D3A',
    borderColor: '#E85D3A',
  },
  iconButtonText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  iconButtonTextActive: {
    color: '#FFF',
  },
  iconButtonSaved: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  iconButtonTextSaved: {
    color: '#FFF',
  },
  detailIcon: {
    fontSize: 15,
    color: '#AAA',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  statsText: {
    fontSize: 13,
    color: '#E85D3A',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  lastPracticedText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 4,
    paddingBottom: 16,
    gap: 0,
  },
  wordsGridSpaced: {
    gap: 16,
  },
  wordModule: {
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 8,
    position: 'relative',
  },
  plainText: {
    fontSize: 26,
    color: '#EFEFEF',
    fontWeight: '400',
    letterSpacing: 1,
  },
  kanjiText: {
    fontSize: 26,
    color: '#EFEFEF',
    fontWeight: '400',
    letterSpacing: 1,
    marginBottom: 4,
  },
  kanjiHighlighted: {
    color: '#E85D3A',
  },
  furiganaAligned: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    fontSize: 11,
    color: '#E85D3A',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  meaningAligned: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Word breakdown translation
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginVertical: 12,
  },
  translationContainer: {
    paddingBottom: 20,
    gap: 16,
  },
  wordCardsGrid: {
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
  wordRomaji: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
  },
  wordMeaning: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  englishText: {
    fontSize: 15,
    color: '#888888',
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Save modal
  saveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  saveModalContent: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveModalTitle: {
    color: '#EFEFEF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  saveModalScroll: {
    maxHeight: 300,
  },
  saveListOption: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveListOptionActive: {
    backgroundColor: '#222',
  },
  saveListName: {
    color: '#EFEFEF',
    fontSize: 15,
    fontWeight: '600',
  },
  saveListCheck: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '700',
  },
});
