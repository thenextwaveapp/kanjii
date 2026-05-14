import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { toRomaji } from 'wanakana';
import { speakJapanese, stopSpeaking } from '../services/tts';
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

export default function SnippetCard({ snippet }) {
  const { settings } = useSettings();
  const [revealed, setRevealed] = useState({});
  const [speaking, setSpeaking] = useState(false);
  const [showRomaji, setShowRomaji] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);

  if (!snippet) return null;

  const { japanese, english, words } = snippet;

  const speak = async () => {
    if (speaking && currentSound) {
      await stopSpeaking(currentSound);
      setCurrentSound(null);
      setSpeaking(false);
      return;
    }

    try {
      setSpeaking(true);
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);
      const sound = await speakJapanese(japanese, {
        voice: voiceConfig?.voice,
        rate: settings.speechRate,
      });

      setCurrentSound(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setSpeaking(false);
          setCurrentSound(null);
        }
      });
    } catch (error) {
      console.error('Speech error:', error);
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

  // Build romaji: substitute furigana for kanji words, convert kana to Hepburn, add spaces
  const romaji = tokenise(japanese, wordMap)
    .map((seg) => {
      const reading = wordMap[seg.text]?.furigana ?? seg.text;
      return toHepburn(reading);
    })
    .join(' ')
    .replace(/\s+([。、！？.,!?])/g, '$1')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

  // Split japanese text into tappable segments
  // We try to match known words, falling back to character-by-character
  const segments = tokenise(japanese, wordMap);
  console.log('Segments:', segments);

  const toggleWord = (word) => {
    console.log('Tapped word:', word);
    console.log('Word info:', wordMap[word]);
    setRevealed((prev) => ({ ...prev, [word]: !prev[word] }));
  };

  return (
    <View style={styles.card}>
      {/* Japanese text with tappable words */}
      <View style={styles.japaneseContainer}>
        {segments.map((seg, i) => {
          const info = wordMap[seg.text];
          const isRevealed = revealed[seg.text];

          if (!info) {
            // Non-kanji segment — just render
            return (
              <Text key={i} style={styles.plainText}>
                {seg.text}
              </Text>
            );
          }

          return (
            <TouchableOpacity
              key={i}
              onPress={() => toggleWord(seg.text)}
              style={[styles.wordWrapper, isRevealed && styles.wordWrapperActive]}
              activeOpacity={0.7}
            >
              {isRevealed && (
                <Text style={styles.furigana}>{info.furigana}</Text>
              )}
              <Text style={[styles.kanjiText, isRevealed && styles.kanjiHighlighted]}>
                {seg.text}
              </Text>
              {isRevealed && (
                <View style={styles.meaningBubble}>
                  <Text style={styles.meaningText}>{info.meaning}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* English / Romaji toggle */}
      <View style={styles.divider} />
      <View style={styles.bottomRow}>
        <TouchableOpacity
          onPress={() => setShowRomaji((v) => !v)}
          activeOpacity={0.7}
          style={styles.translationToggle}
        >
          {showRomaji ? (
            <Text style={styles.romajiText}>{romaji}</Text>
          ) : (
            <Text style={styles.englishText}>{english}</Text>
          )}
          <Text style={styles.toggleHint}>{showRomaji ? 'EN' : 'RO'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={speak} style={styles.speakButton} activeOpacity={0.7}>
          <Text style={[styles.speakIcon, speaking && styles.speakIconActive]}>
            {speaking ? '⏹' : '🔊'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222222',
    width: '100%',
  },
  japaneseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
    rowGap: 28,
  },
  plainText: {
    fontSize: 26,
    color: '#EFEFEF',
    fontWeight: '400',
    height: ROW_H,
    lineHeight: ROW_H,
    letterSpacing: 1,
  },
  wordWrapper: {
    height: ROW_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
    zIndex: 1,
    elevation: 1,
  },
  wordWrapperActive: {
    zIndex: 100,
    elevation: 100,
  },
  furigana: {
    position: 'absolute',
    top: -13,
    fontSize: 11,
    color: '#E85D3A',
    letterSpacing: 0.5,
    zIndex: 10,
  },
  kanjiText: {
    fontSize: 26,
    color: '#EFEFEF',
    fontWeight: '400',
    lineHeight: ROW_H,
    letterSpacing: 1,
  },
  kanjiHighlighted: {
    color: '#E85D3A',
  },
  meaningBubble: {
    position: 'absolute',
    top: ROW_H - 2,
    backgroundColor: '#E85D3A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 60,
    zIndex: 10,
    elevation: 10,
  },
  meaningText: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginVertical: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  translationToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  englishText: {
    flex: 1,
    fontSize: 15,
    color: '#888888',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  romajiText: {
    flex: 1,
    fontSize: 15,
    color: '#E85D3A',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  toggleHint: {
    fontSize: 10,
    color: '#444',
    fontWeight: '700',
    letterSpacing: 1,
  },
  speakButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakIcon: { fontSize: 16 },
  speakIconActive: { opacity: 0.6 },
});
