import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchStats } from '../services/progress';
import FallingCharacters from '../components/FallingCharacters';

export default function HomeScreen({ navigation, user }) {
  const [stats, setStats] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchStats(user.id).then(setStats);
    }, [user?.id])
  );

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.heroSection}>
        <FallingCharacters count={16} areaHeight={140} />
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
            <Text style={styles.greeting}>Good{greeting()}, {name}</Text>
            {stats?.current_streak > 0 && (
              <Text style={styles.streakLine}>{stats.current_streak} day streak 🔥</Text>
            )}
          </View>
          <View style={styles.topActions}>
            {user?.user_metadata?.avatar_url ? (
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatar} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.avatarInitial}>{name[0].toUpperCase()}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Stats row */}
      {stats && (
        <View style={styles.statsRow}>
          <MiniStat label="Kanji" value={stats.kanji_count ?? 0} />
          <View style={styles.statDivider} />
          <MiniStat label="Correct" value={stats.total_correct ?? 0} />
          <View style={styles.statDivider} />
          <MiniStat label="Best streak" value={stats.longest_streak ?? 0} />
        </View>
      )}

      {/* Main actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryCard}
          onPress={() => navigation.navigate('ModeSelect')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryCardIcon}>✏️</Text>
          <Text style={styles.primaryCardTitle}>Practice</Text>
          <Text style={styles.primaryCardSub}>Type Japanese sentences to earn kanji</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => navigation.navigate('Study')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryCardIcon}>漢</Text>
          <Text style={styles.secondaryCardTitle}>Study</Text>
          <Text style={styles.secondaryCardSub}>Review your kanji collection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => navigation.navigate('Learn')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryCardIcon}>📚</Text>
          <Text style={styles.secondaryCardTitle}>Basics</Text>
          <Text style={styles.secondaryCardSub}>Learn hiragana, katakana & how Japanese works</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MiniStat({ label, value }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return ' morning';
  if (h < 18) return ' afternoon';
  return ' evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  logo: { fontSize: 26, color: '#EFEFEF', fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  logoAccent: { color: '#E85D3A' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  iconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#E85D3A', fontSize: 18, fontWeight: '700' },
  greeting: { color: '#888', fontSize: 13 },
  streakLine: { color: '#E85D3A', fontSize: 12, marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 8 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    paddingVertical: 16,
    marginBottom: 32,
  },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatValue: { color: '#EFEFEF', fontSize: 22, fontWeight: '700' },
  miniStatLabel: { color: '#555', fontSize: 11, letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#222', marginVertical: 4 },
  actions: { paddingHorizontal: 24, gap: 14 },
  primaryCard: {
    backgroundColor: '#E85D3A',
    borderRadius: 20,
    padding: 28,
    gap: 6,
  },
  primaryCardIcon: { fontSize: 28 },
  primaryCardTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  primaryCardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  secondaryCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    padding: 28,
    gap: 6,
  },
  secondaryCardIcon: { fontSize: 28, color: '#E85D3A' },
  secondaryCardTitle: { color: '#EFEFEF', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  secondaryCardSub: { color: '#555', fontSize: 13 },
});
