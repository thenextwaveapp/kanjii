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

        <Text style={styles.title}>Practice</Text>
        <Text style={styles.subtitle}>Choose your learning path</Text>

        {/* Mode cards */}
        <View style={styles.modes}>
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation.navigate('CollectionList')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconContainer, styles.iconContainerAccent]}>
              <Text style={styles.modeIcon}>📚</Text>
            </View>
            <Text style={styles.modeTitle}>Structured Lessons</Text>
            <Text style={styles.modeSub}>
              Follow curated paths designed for progressive mastery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation.navigate('RoundSelect')}
            activeOpacity={0.85}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.modeIcon}>🎯</Text>
            </View>
            <Text style={styles.modeTitle}>Topic Practice</Text>
            <Text style={styles.modeSub}>
              Choose any topic and difficulty level you want
            </Text>
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
    marginBottom: 16,
  },
  backText: { color: '#555', fontSize: 14 },
  logo: { fontSize: 22, color: '#EFEFEF', fontWeight: '800', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  title: {
    color: '#EFEFEF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    color: '#666',
    fontSize: 15,
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  modes: {
    gap: 20,
    flex: 1,
  },
  modeCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#222',
    padding: 24,
    position: 'relative',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerAccent: {
    backgroundColor: '#E85D3A',
  },
  modeIcon: {
    fontSize: 28,
  },
  modeTitle: {
    color: '#EFEFEF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  modeSub: {
    color: '#888',
    fontSize: 14,
    lineHeight: 21,
  },
});
