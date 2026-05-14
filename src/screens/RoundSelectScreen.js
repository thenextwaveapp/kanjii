import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import DropdownPicker from '../components/DropdownPicker';
import { supabase } from '../services/supabase';

const ROUND_OPTIONS = [
  { key: '5', label: '5 rounds', sub: 'Quick session' },
  { key: '10', label: '10 rounds', sub: 'Standard' },
  { key: '15', label: '15 rounds', sub: 'Extended' },
  { key: '20', label: '20 rounds', sub: 'Full session' },
];

export default function RoundSelectScreen({ navigation }) {
  const [rounds, setRounds] = useState('10');
  const [domain, setDomain] = useState('Any');
  const [subtopic, setSubtopic] = useState(null);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [topicOptions, setTopicOptions] = useState([]);
  const [subtopicOptions, setSubtopicOptions] = useState([]);
  const [difficultyOptions, setDifficultyOptions] = useState([]);

  // Load all topics and difficulties from DB on mount
  useEffect(() => {
    async function loadInitialData() {
      const { data } = await supabase
        .from('sentences')
        .select('domain, jlpt_level')
        .order('domain');

      if (data) {
        // Extract topics
        const allDomains = [...new Set(data.map(row => row.domain))];
        const mainTopics = new Set();
        allDomains.forEach(d => {
          if (d.includes(':')) {
            const main = d.split(':')[0].trim();
            mainTopics.add(main);
          } else {
            mainTopics.add(d);
          }
        });

        const topics = [
          { key: 'Any', label: 'Any topic', sub: 'Surprise me' },
          ...Array.from(mainTopics).sort().map(topic => ({
            key: topic,
            label: topic,
            sub: 'Choose subtopic',
          })),
        ];

        setTopicOptions(topics);

        // Extract unique difficulty levels
        const levels = [...new Set(data.map(row => row.jlpt_level).filter(Boolean))];
        const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1'];
        const sortedLevels = levels.sort((a, b) =>
          levelOrder.indexOf(a) - levelOrder.indexOf(b)
        );

        const difficultyOpts = [
          { key: 'Mixed', label: 'Mixed', sub: 'Any difficulty level' },
          ...sortedLevels.map(level => {
            const labels = {
              'N5': 'N5 — Beginner',
              'N4': 'N4 — Elementary',
              'N3': 'N3 — Intermediate',
              'N2': 'N2 — Upper-intermediate',
              'N1': 'N1 — Advanced',
            };
            const subs = {
              'N5': 'Basic kanji, short sentences',
              'N4': 'Common kanji and grammar',
              'N3': 'Natural casual Japanese',
              'N2': 'Complex sentences, compound kanji',
              'N1': 'Native-level writing',
            };
            return {
              key: level,
              label: labels[level] || level,
              sub: subs[level] || '',
            };
          }),
        ];

        setDifficultyOptions(difficultyOpts);
      }
    }

    loadInitialData();
  }, []);

  // Load subtopics when domain changes
  useEffect(() => {
    if (domain === 'Any') {
      setSubtopicOptions([]);
      setSubtopic(null);
      return;
    }

    async function loadSubtopics() {
      const { data } = await supabase
        .from('sentences')
        .select('domain')
        .or(`domain.like.${domain}:%,domain.eq.${domain}`)
        .order('domain');

      if (data) {
        const uniqueDomains = [...new Set(data.map(row => row.domain))];

        // Filter to only subtopics (contains ":")
        const subtopics = uniqueDomains
          .filter(d => d.includes(':') && d.startsWith(domain))
          .map(d => ({
            key: d,
            label: d.split(': ')[1] || d,
            sub: '',
          }));

        // Add "All" option at the beginning if subtopics exist
        const subtopicOpts = subtopics.length > 0
          ? [{ key: domain, label: 'All', sub: 'Any subtopic' }, ...subtopics]
          : [];

        setSubtopicOptions(subtopicOpts);

        // Reset subtopic to "All" (domain) when domain changes
        if (subtopicOpts.length > 0) {
          setSubtopic(domain);
        } else {
          setSubtopic(null);
        }
      }
    }

    loadSubtopics();
  }, [domain]);

  const showSubtopicPicker = subtopicOptions.length > 0;

  const handleDomainChange = (newDomain) => {
    setDomain(newDomain);
    setSubtopic(null); // Reset subtopic when domain changes
  };

  const start = () => {
    const finalDomain = subtopic || domain;

    navigation.navigate('Practice', {
      rounds: parseInt(rounds),
      difficulty,
      domain: finalDomain,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.popToTop()}>
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
            options={topicOptions}
            onChange={handleDomainChange}
          />
          {showSubtopicPicker && (
            <DropdownPicker
              label="Subtopic"
              value={subtopic}
              options={subtopicOptions}
              onChange={setSubtopic}
            />
          )}

          {difficultyOptions.length > 0 && (
            <DropdownPicker
              label="Difficulty"
              value={difficulty}
              options={difficultyOptions}
              onChange={setDifficulty}
            />
          )}
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
