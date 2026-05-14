import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { TEXT_SCALE_OPTIONS, VOICE_OPTIONS, SPEECH_RATE_OPTIONS } from '../services/settings';
import { useSettings } from '../contexts/SettingsContext';
import { speakJapanese } from '../services/tts';

export default function SettingsScreen({ navigation }) {
  const { settings, updateSetting } = useSettings();
  const [testingVoice, setTestingVoice] = useState(false);

  const testVoice = async () => {
    if (testingVoice) return;
    setTestingVoice(true);
    try {
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);
      await speakJapanese('こんにちは', {
        voice: voiceConfig?.voice,
        rate: settings.speechRate,
      });
    } catch (error) {
      console.error('Voice test error:', error);
    } finally {
      setTimeout(() => setTestingVoice(false), 2000);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
        </View>

        <Text style={styles.title}>Settings</Text>

        {/* Voice */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Voice</Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Voice Gender</Text>
            <View style={styles.options}>
              {VOICE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, settings.voiceGender === option.value && styles.optionActive]}
                  onPress={() => updateSetting('voiceGender', option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, settings.voiceGender === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.cardLabel, { marginTop: 16 }]}>Speech Rate</Text>
            <View style={styles.options}>
              {SPEECH_RATE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, settings.speechRate === option.value && styles.optionActive]}
                  onPress={() => updateSetting('speechRate', option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, settings.speechRate === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.testButton, testingVoice && styles.testButtonActive]}
              onPress={testVoice}
              disabled={testingVoice}
              activeOpacity={0.7}
            >
              <Text style={styles.testButtonText}>
                {testingVoice ? '🔊 Playing...' : '🔊 Test Voice'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Text Size */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Text Size</Text>

          <View style={styles.card}>
            <View style={styles.preview}>
              <Text style={[styles.previewJp, { fontSize: 18 * settings.textScale }]}>
                今日は良い天気です
              </Text>
              <Text style={[styles.previewEn, { fontSize: 13 * settings.textScale }]}>
                It's nice weather today
              </Text>
            </View>

            <View style={styles.scaleOptions}>
              {TEXT_SCALE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.scaleOption, settings.textScale === option.value && styles.scaleOptionActive]}
                  onPress={() => updateSetting('textScale', option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.scaleText, settings.textScale === option.value && styles.scaleTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { padding: 24, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: { color: '#555', fontSize: 14 },
  logo: { fontSize: 20, color: '#EFEFEF', fontWeight: '800', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  title: {
    color: '#EFEFEF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  section: { marginBottom: 32 },
  sectionLabel: {
    color: '#555',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 20,
  },
  cardLabel: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  options: {
    gap: 8,
  },
  option: {
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionActive: {
    backgroundColor: '#E85D3A',
    borderColor: '#E85D3A',
  },
  optionText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#FFF',
  },
  testButton: {
    marginTop: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 12,
  },
  testButtonActive: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#E85D3A',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  preview: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  previewJp: {
    color: '#EFEFEF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  previewEn: {
    color: '#666',
  },
  scaleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  scaleOptionActive: {
    backgroundColor: '#E85D3A',
  },
  scaleText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  scaleTextActive: {
    color: '#FFF',
  },
});
