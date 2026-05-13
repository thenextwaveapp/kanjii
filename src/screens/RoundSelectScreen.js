import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import DropdownPicker from '../components/DropdownPicker';

const ROUND_OPTIONS = [
  { key: '5', label: '5 rounds', sub: 'Quick session' },
  { key: '10', label: '10 rounds', sub: 'Standard' },
  { key: '15', label: '15 rounds', sub: 'Extended' },
  { key: '20', label: '20 rounds', sub: 'Full session' },
];

const DOMAIN_OPTIONS = [
  { key: 'Any', label: 'Any topic', sub: 'Surprise me' },
  { key: 'Food & drink', label: 'Food & drink', sub: 'Restaurants, cooking, コンビニ' },
  { key: 'Anime & manga', label: 'Anime & manga', sub: 'Reactions, recommendations, episode talk' },
  { key: 'Gaming', label: 'Gaming', sub: 'Match results, gacha, grinding' },
  { key: 'Weather & seasons', label: 'Weather & seasons', sub: 'Temperature, nature, seasons' },
  { key: 'Relationships', label: 'Relationships', sub: 'Friends, family, drama' },
  { key: 'Work & school', label: 'Work & school', sub: 'Exams, colleagues, Monday complaints' },
  { key: 'Sports', label: 'Sports', sub: 'Match reactions, working out' },
  { key: 'Travel', label: 'Travel', sub: 'Trains, trips, sightseeing' },
  { key: 'Daily life', label: 'Daily life', sub: 'Waking up, food, random observations' },
];

const DIFFICULTY_OPTIONS = [
  { key: 'Mixed', label: 'Mixed', sub: 'Any difficulty level' },
  { key: 'N5', label: 'N5 — Beginner', sub: 'Basic kanji, short sentences' },
  { key: 'N4', label: 'N4 — Elementary', sub: 'Common kanji and grammar' },
  { key: 'N3', label: 'N3 — Intermediate', sub: 'Natural casual Japanese' },
  { key: 'N2', label: 'N2 — Upper-intermediate', sub: 'Complex sentences, compound kanji' },
  { key: 'N1', label: 'N1 — Advanced', sub: 'Native-level writing' },
];

export default function RoundSelectScreen({ navigation }) {
  const [rounds, setRounds] = useState('10');
  const [domain, setDomain] = useState('Any');
  const [difficulty, setDifficulty] = useState('Mixed');

  const start = () => {
    navigation.navigate('Practice', {
      rounds: parseInt(rounds),
      difficulty,
      domain,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
        </View>

        <Text style={styles.title}>Set up session</Text>

        {/* Dropdowns */}
        <View style={styles.dropdowns}>
          <DropdownPicker
            label="Rounds"
            value={rounds}
            options={ROUND_OPTIONS}
            onChange={setRounds}
          />
          <DropdownPicker
            label="Topic"
            value={domain}
            options={DOMAIN_OPTIONS}
            onChange={setDomain}
          />
          <DropdownPicker
            label="Difficulty"
            value={difficulty}
            options={DIFFICULTY_OPTIONS}
            onChange={setDifficulty}
          />
        </View>

        <TouchableOpacity style={styles.startButton} onPress={start} activeOpacity={0.85}>
          <Text style={styles.startText}>Start</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 32,
  },
  backText: { color: '#555', fontSize: 14 },
  logo: { fontSize: 22, color: '#EFEFEF', fontWeight: '800', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  title: {
    color: '#EFEFEF', fontSize: 28, fontWeight: '800',
    letterSpacing: -0.5, marginBottom: 28,
  },
  dropdowns: { flex: 1, gap: 4 },
  startButton: {
    backgroundColor: '#E85D3A', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', marginTop: 24,
  },
  startText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});
