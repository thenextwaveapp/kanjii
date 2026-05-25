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
import { fetchSentenceLists } from '../services/sentenceLists';

const ROUND_OPTIONS = [
  { key: 'all', label: 'All available', sub: 'Every sentence' },
  { key: '5', label: '5 rounds', sub: 'Quick session' },
  { key: '10', label: '10 rounds', sub: 'Standard' },
  { key: '15', label: '15 rounds', sub: 'Extended' },
  { key: '20', label: '20 rounds', sub: 'Full session' },
];

export default function RoundSelectScreen({ navigation, route }) {
  const { user } = route.params || {};
  const [rounds, setRounds] = useState('10');
  const [domain, setDomain] = useState('Any');
  const [subtopic, setSubtopic] = useState(null);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [topicOptions, setTopicOptions] = useState([]);
  const [subtopicOptions, setSubtopicOptions] = useState([]);
  const [difficultyOptions, setDifficultyOptions] = useState([]);
  const [userLists, setUserLists] = useState([]);

  // Helper function to update difficulty options based on available sentences
  const updateDifficultyOptions = (sentences) => {
    // Count sentences per JLPT level
    const levelCounts = {};
    sentences.forEach(row => {
      if (row.jlpt_level) {
        levelCounts[row.jlpt_level] = (levelCounts[row.jlpt_level] || 0) + 1;
      }
    });

    const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1'];
    const labels = {
      'N5': 'N5 — Beginner',
      'N4': 'N4 — Elementary',
      'N3': 'N3 — Intermediate',
      'N2': 'N2 — Upper-intermediate',
      'N1': 'N1 — Advanced',
    };

    // Only show levels with at least 5 sentences
    const availableLevels = Object.entries(levelCounts)
      .filter(([_, count]) => count >= 5)
      .sort(([a], [b]) => levelOrder.indexOf(a) - levelOrder.indexOf(b))
      .map(([level, count]) => ({
        key: level,
        label: labels[level] || level,
        sub: `${count} sentence${count !== 1 ? 's' : ''}`,
      }));

    const totalCount = sentences.length;
    const difficultyOpts = [
      { key: 'Mixed', label: 'Mixed', sub: `${totalCount} sentence${totalCount !== 1 ? 's' : ''}` },
      ...availableLevels,
    ];

    setDifficultyOptions(difficultyOpts);

    // Reset difficulty to Mixed if current selection isn't available
    if (difficulty !== 'Mixed' && !availableLevels.find(opt => opt.key === difficulty)) {
      setDifficulty('Mixed');
    }
  };

  // Load all topics and difficulties from DB on mount
  useEffect(() => {
    async function loadInitialData() {
      // Fetch user's sentence lists
      let lists = [];
      if (user?.id) {
        lists = await fetchSentenceLists(user.id);
        setUserLists(lists);
      }

      const { data } = await supabase
        .from('sentences')
        .select('domain, jlpt_level')
        .order('domain');

      if (data) {
        // Count sentences per domain
        const domainCounts = {};
        data.forEach(row => {
          domainCounts[row.domain] = (domainCounts[row.domain] || 0) + 1;
        });

        // Extract main topics and count total sentences (including subtopics)
        const mainTopicCounts = {};
        Object.entries(domainCounts).forEach(([domain, count]) => {
          if (domain.includes(':')) {
            const main = domain.split(':')[0].trim();
            mainTopicCounts[main] = (mainTopicCounts[main] || 0) + count;
          } else {
            mainTopicCounts[domain] = (mainTopicCounts[domain] || 0) + count;
          }
        });

        // Filter topics with at least 10 sentences
        const topics = [
          ...(lists.length > 0 ? [{ key: 'My Lists', label: 'My Lists', sub: `${lists.length} list${lists.length !== 1 ? 's' : ''}` }] : []),
          { key: 'Any', label: 'Any topic', sub: 'Surprise me' },
          ...Object.entries(mainTopicCounts)
            .filter(([_, count]) => count >= 10)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([topic, count]) => ({
              key: topic,
              label: topic,
              sub: `${count} sentence${count !== 1 ? 's' : ''}`,
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

    // Handle My Lists
    if (domain === 'My Lists') {
      const listSubtopics = userLists.map(list => ({
        key: `list:${list.id}`,
        label: list.name,
        sub: '', // We could add sentence count here later
      }));

      setSubtopicOptions(listSubtopics);
      setSubtopic(listSubtopics[0]?.key || null);

      // Set difficulty options to mixed for lists
      setDifficultyOptions([
        { key: 'Mixed', label: 'Mixed', sub: 'Any difficulty level' },
      ]);
      setDifficulty('Mixed');
      return;
    }

    async function loadSubtopics() {
      const { data } = await supabase
        .from('sentences')
        .select('domain, jlpt_level')
        .or(`domain.like.${domain}:%,domain.eq.${domain}`)
        .order('domain');

      if (data) {
        // Count sentences per domain
        const domainCounts = {};
        data.forEach(row => {
          domainCounts[row.domain] = (domainCounts[row.domain] || 0) + 1;
        });

        // Filter to only subtopics with at least 10 sentences
        const subtopics = Object.entries(domainCounts)
          .filter(([d, count]) => d.includes(':') && d.startsWith(domain) && count >= 10)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([d, count]) => ({
            key: d,
            label: d.split(': ')[1] || d,
            sub: `${count} sentence${count !== 1 ? 's' : ''}`,
          }));

        // Calculate total count for "All" option
        const totalCount = Object.values(domainCounts).reduce((sum, count) => sum + count, 0);

        // Add "All" option at the beginning if subtopics exist
        const subtopicOpts = subtopics.length > 0
          ? [{ key: domain, label: 'All', sub: `${totalCount} sentence${totalCount !== 1 ? 's' : ''}` }, ...subtopics]
          : [];

        setSubtopicOptions(subtopicOpts);

        // Reset subtopic to "All" (domain) when domain changes
        if (subtopicOpts.length > 0) {
          setSubtopic(domain);
        } else {
          setSubtopic(null);
        }

        // Update difficulty options based on selected topic
        updateDifficultyOptions(data);
      }
    }

    loadSubtopics();
  }, [domain]);

  // Update difficulty options when subtopic changes
  useEffect(() => {
    if (!subtopic && domain === 'Any') return;

    async function loadDifficultyForSubtopic() {
      const finalDomain = subtopic || domain;

      const query = finalDomain === 'Any'
        ? supabase.from('sentences').select('jlpt_level')
        : supabase.from('sentences').select('jlpt_level').eq('domain', finalDomain);

      const { data } = await query;

      if (data) {
        updateDifficultyOptions(data);
      }
    }

    loadDifficultyForSubtopic();
  }, [subtopic]);

  const showSubtopicPicker = subtopicOptions.length > 0;

  const handleDomainChange = (newDomain) => {
    setDomain(newDomain);
    setSubtopic(null); // Reset subtopic when domain changes
  };

  const start = () => {
    const finalDomain = subtopic || domain;
    const roundCount = rounds === 'all' ? 9999 : parseInt(rounds);

    // Check if a list is selected
    if (finalDomain.startsWith('list:')) {
      const listId = finalDomain.replace('list:', '');
      const list = userLists.find(l => l.id === listId);
      navigation.navigate('Practice', {
        rounds: roundCount,
        listId,
        listName: list?.name,
      });
    } else {
      navigation.navigate('Practice', {
        rounds: roundCount,
        difficulty,
        domain: finalDomain,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
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
  logo: { fontSize: 22, color: '#EFEFEF', fontWeight: '900', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  title: {
    color: '#EFEFEF', fontSize: 28, fontWeight: '900',
    letterSpacing: -0.5, marginBottom: 28,
  },
  dropdowns: { flex: 1, gap: 4 },
  startButton: {
    backgroundColor: '#E85D3A', borderRadius: 10,
    paddingVertical: 18, alignItems: 'center', marginTop: 24,
  },
  startText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});
