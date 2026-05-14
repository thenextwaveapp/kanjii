import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function ModeSelectScreen({ navigation }) {
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

        <Text style={styles.title}>Choose practice mode</Text>

        {/* Mode cards */}
        <View style={styles.modes}>
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation.navigate('CollectionList')}
            activeOpacity={0.85}
          >
            <Text style={styles.modeIcon}>📚</Text>
            <Text style={styles.modeTitle}>Collections</Text>
            <Text style={styles.modeSub}>
              Curated lessons with progressive skillsets
            </Text>
            <View style={[styles.modeBadge, styles.modeBadgeAccent]}>
              <Text style={styles.modeBadgeText}>STRUCTURED</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation.navigate('RoundSelect')}
            activeOpacity={0.85}
          >
            <Text style={styles.modeIcon}>🎯</Text>
            <Text style={styles.modeTitle}>Domain Practice</Text>
            <Text style={styles.modeSub}>
              Free practice by topic and difficulty
            </Text>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>FLEXIBLE</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { flex: 1, padding: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backText: { color: '#555', fontSize: 14 },
  logo: { fontSize: 22, color: '#EFEFEF', fontWeight: '800', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  title: {
    color: '#EFEFEF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 28,
  },
  modes: { gap: 16 },
  modeCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    padding: 28,
    gap: 8,
  },
  modeIcon: { fontSize: 32, marginBottom: 4 },
  modeTitle: {
    color: '#EFEFEF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  modeSub: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  modeBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  modeBadgeAccent: {
    backgroundColor: 'rgba(232, 93, 58, 0.1)',
    borderColor: '#E85D3A',
  },
  modeBadgeText: {
    color: '#E85D3A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
