import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { speakJapanese } from '../services/tts';
import { useSettings } from '../contexts/SettingsContext';
import { VOICE_OPTIONS } from '../services/settings';

// Basic kana (清音 - seion)
const HIRAGANA_BASIC = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', null, 'ゆ', null, 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', null, null, null, 'を'],
  ['ん', null, null, null, null],
];

const KATAKANA_BASIC = [
  ['ア', 'イ', 'ウ', 'エ', 'オ'],
  ['カ', 'キ', 'ク', 'ケ', 'コ'],
  ['サ', 'シ', 'ス', 'セ', 'ソ'],
  ['タ', 'チ', 'ツ', 'テ', 'ト'],
  ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  ['マ', 'ミ', 'ム', 'メ', 'モ'],
  ['ヤ', null, 'ユ', null, 'ヨ'],
  ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  ['ワ', null, null, null, 'ヲ'],
  ['ン', null, null, null, null],
];

const ROMAJI_BASIC = [
  ['a', 'i', 'u', 'e', 'o'],
  ['ka', 'ki', 'ku', 'ke', 'ko'],
  ['sa', 'shi', 'su', 'se', 'so'],
  ['ta', 'chi', 'tsu', 'te', 'to'],
  ['na', 'ni', 'nu', 'ne', 'no'],
  ['ha', 'hi', 'fu', 'he', 'ho'],
  ['ma', 'mi', 'mu', 'me', 'mo'],
  ['ya', null, 'yu', null, 'yo'],
  ['ra', 'ri', 'ru', 're', 'ro'],
  ['wa', null, null, null, 'wo'],
  ['n', null, null, null, null],
];

const BASIC_ROW_LABELS = ['', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'n'];

// Dakuon (濁音 - voiced) and Handakuon (半濁音 - semi-voiced)
const HIRAGANA_DAKUON = [
  ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  ['だ', 'ぢ', 'づ', 'で', 'ど'],
  ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
];

const KATAKANA_DAKUON = [
  ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'],
  ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'],
  ['ダ', 'ヂ', 'ヅ', 'デ', 'ド'],
  ['バ', 'ビ', 'ブ', 'ベ', 'ボ'],
  ['パ', 'ピ', 'プ', 'ペ', 'ポ'],
];

const ROMAJI_DAKUON = [
  ['ga', 'gi', 'gu', 'ge', 'go'],
  ['za', 'ji', 'zu', 'ze', 'zo'],
  ['da', 'ji', 'zu', 'de', 'do'],
  ['ba', 'bi', 'bu', 'be', 'bo'],
  ['pa', 'pi', 'pu', 'pe', 'po'],
];

const DAKUON_ROW_LABELS = ['g', 'z', 'd', 'b', 'p'];

// Yōon (拗音 - combination sounds)
const HIRAGANA_YOUON = [
  ['きゃ', 'きゅ', 'きょ'],
  ['しゃ', 'しゅ', 'しょ'],
  ['ちゃ', 'ちゅ', 'ちょ'],
  ['にゃ', 'にゅ', 'にょ'],
  ['ひゃ', 'ひゅ', 'ひょ'],
  ['みゃ', 'みゅ', 'みょ'],
  ['りゃ', 'りゅ', 'りょ'],
  ['ぎゃ', 'ぎゅ', 'ぎょ'],
  ['じゃ', 'じゅ', 'じょ'],
  ['びゃ', 'びゅ', 'びょ'],
  ['ぴゃ', 'ぴゅ', 'ぴょ'],
];

const KATAKANA_YOUON = [
  ['キャ', 'キュ', 'キョ'],
  ['シャ', 'シュ', 'ショ'],
  ['チャ', 'チュ', 'チョ'],
  ['ニャ', 'ニュ', 'ニョ'],
  ['ヒャ', 'ヒュ', 'ヒョ'],
  ['ミャ', 'ミュ', 'ミョ'],
  ['リャ', 'リュ', 'リョ'],
  ['ギャ', 'ギュ', 'ギョ'],
  ['ジャ', 'ジュ', 'ジョ'],
  ['ビャ', 'ビュ', 'ビョ'],
  ['ピャ', 'ピュ', 'ピョ'],
];

const ROMAJI_YOUON = [
  ['kya', 'kyu', 'kyo'],
  ['sha', 'shu', 'sho'],
  ['cha', 'chu', 'cho'],
  ['nya', 'nyu', 'nyo'],
  ['hya', 'hyu', 'hyo'],
  ['mya', 'myu', 'myo'],
  ['rya', 'ryu', 'ryo'],
  ['gya', 'gyu', 'gyo'],
  ['ja', 'ju', 'jo'],
  ['bya', 'byu', 'byo'],
  ['pya', 'pyu', 'pyo'],
];

const YOUON_ROW_LABELS = ['ky', 'sh', 'ch', 'ny', 'hy', 'my', 'ry', 'gy', 'j', 'by', 'py'];

const COLUMN_HEADERS = ['a', 'i', 'u', 'e', 'o'];
const YOUON_HEADERS = ['ya', 'yu', 'yo'];

export default function KanaTable({ onClose }) {
  const [mode, setMode] = useState('hiragana'); // 'hiragana' | 'katakana'
  const [playing, setPlaying] = useState(null);
  const { settings } = useSettings();

  const basicTable = mode === 'hiragana' ? HIRAGANA_BASIC : KATAKANA_BASIC;
  const dakuonTable = mode === 'hiragana' ? HIRAGANA_DAKUON : KATAKANA_DAKUON;
  const youonTable = mode === 'hiragana' ? HIRAGANA_YOUON : KATAKANA_YOUON;

  const playKana = async (kana) => {
    if (!kana || playing === kana) return;
    setPlaying(kana);

    try {
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);
      const sound = await speakJapanese(kana, {
        voice: voiceConfig?.voice,
        rate: settings.speechRate,
      });

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlaying(null);
        }
      });
    } catch (error) {
      console.error('TTS error:', error);
      setPlaying(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kana Study</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'hiragana' && styles.tabActive]}
          onPress={() => setMode('hiragana')}
        >
          <Text style={[styles.tabText, mode === 'hiragana' && styles.tabTextActive]}>
            Hiragana
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'katakana' && styles.tabActive]}
          onPress={() => setMode('katakana')}
        >
          <Text style={[styles.tabText, mode === 'katakana' && styles.tabTextActive]}>
            Katakana
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instruction}>Tap any character to hear it</Text>

        {/* Basic Table (清音 Seion) */}
        <Text style={styles.sectionTitle}>Basic (清音)</Text>
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={styles.labelCell} />
            {COLUMN_HEADERS.map((header, i) => (
              <View key={i} style={styles.headerCell}>
                <Text style={styles.headerText}>{header}</Text>
              </View>
            ))}
          </View>

          {basicTable.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>{BASIC_ROW_LABELS[rowIndex]}</Text>
              </View>

              {row.map((kana, colIndex) => (
                <View key={colIndex} style={styles.cell}>
                  {kana ? (
                    <TouchableOpacity
                      style={[
                        styles.kanaButton,
                        playing === kana && styles.kanaButtonActive,
                      ]}
                      onPress={() => playKana(kana)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.kanaText}>{kana}</Text>
                      <Text style={styles.romajiText}>
                        {ROMAJI_BASIC[rowIndex][colIndex]}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.emptyCell} />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Dakuon/Handakuon Table */}
        <Text style={styles.sectionTitle}>Dakuon (濁音) & Handakuon (半濁音)</Text>
        <Text style={styles.sectionDescription}>
          Voiced sounds with ゛ and semi-voiced with ゜
        </Text>
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={styles.labelCell} />
            {COLUMN_HEADERS.map((header, i) => (
              <View key={i} style={styles.headerCell}>
                <Text style={styles.headerText}>{header}</Text>
              </View>
            ))}
          </View>

          {dakuonTable.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>{DAKUON_ROW_LABELS[rowIndex]}</Text>
              </View>

              {row.map((kana, colIndex) => (
                <View key={colIndex} style={styles.cell}>
                  <TouchableOpacity
                    style={[
                      styles.kanaButton,
                      playing === kana && styles.kanaButtonActive,
                    ]}
                    onPress={() => playKana(kana)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.kanaText}>{kana}</Text>
                    <Text style={styles.romajiText}>
                      {ROMAJI_DAKUON[rowIndex][colIndex]}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Yōon Table */}
        <Text style={styles.sectionTitle}>Yōon (拗音)</Text>
        <Text style={styles.sectionDescription}>
          Combination sounds with small や/ゆ/よ
        </Text>
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={styles.labelCell} />
            {YOUON_HEADERS.map((header, i) => (
              <View key={i} style={styles.headerCell}>
                <Text style={styles.headerText}>{header}</Text>
              </View>
            ))}
          </View>

          {youonTable.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>{YOUON_ROW_LABELS[rowIndex]}</Text>
              </View>

              {row.map((kana, colIndex) => (
                <View key={colIndex} style={styles.cell}>
                  <TouchableOpacity
                    style={[
                      styles.kanaButton,
                      playing === kana && styles.kanaButtonActive,
                    ]}
                    onPress={() => playKana(kana)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.kanaText}>{kana}</Text>
                    <Text style={styles.romajiText}>
                      {ROMAJI_YOUON[rowIndex][colIndex]}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Special Notes */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Special Characters</Text>

          <View style={styles.noteItem}>
            <Text style={styles.noteLabel}>Sokuon (促音)</Text>
            <Text style={styles.noteText}>
              Small っ/ッ doubles the next consonant:{'\n'}
              がっこう (gakkou) = school
            </Text>
          </View>

          <View style={styles.noteItem}>
            <Text style={styles.noteLabel}>Long Vowels</Text>
            <Text style={styles.noteText}>
              Extended sounds using extra vowels:{'\n'}
              おかあさん (okaasan) = mother{'\n'}
              せんせい (sensei) = teacher
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {mode === 'hiragana'
              ? 'Hiragana is used for native Japanese words and grammar.'
              : 'Katakana is used for foreign loanwords and emphasis.'}
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  closeText: {
    color: '#555',
    fontSize: 24,
    fontWeight: '300',
    width: 40,
  },
  headerTitle: {
    color: '#EFEFEF',
    fontSize: 18,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#E85D3A',
    borderColor: '#E85D3A',
  },
  tabText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  instruction: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  sectionTitle: {
    color: '#EFEFEF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 32,
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  tableContainer: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  labelCell: {
    width: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  headerCell: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#E85D3A',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  kanaButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  kanaButtonActive: {
    backgroundColor: '#E85D3A',
    borderColor: '#E85D3A',
  },
  emptyCell: {
    flex: 1,
  },
  kanaText: {
    color: '#EFEFEF',
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 2,
  },
  romajiText: {
    color: '#666',
    fontSize: 9,
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  footerText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  notesContainer: {
    marginTop: 32,
    marginBottom: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  notesTitle: {
    color: '#EFEFEF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  noteItem: {
    marginBottom: 16,
  },
  noteLabel: {
    color: '#E85D3A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  noteText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 20,
  },
});
