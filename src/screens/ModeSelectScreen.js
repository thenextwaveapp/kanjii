import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function ModeSelectScreen({ navigation, route }) {
  const { user } = route.params || {};
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Choose your{'\n'}practice mode</Text>
        <Text style={styles.pageSubtitle}>Two paths to mastery</Text>
      </View>

      <View style={styles.container}>
        {/* Structured Lessons Card */}
        <TouchableOpacity
          style={[styles.card, styles.cardPrimary]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CollectionList')}
        >
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>RECOMMENDED</Text>
          </View>

          {/* Visual hint: connected path */}
          <View style={styles.pathVisual}>
            <View style={[styles.pathDot, styles.pathDotActive]} />
            <View style={styles.pathLine} />
            <View style={[styles.pathDot, styles.pathDotActive]} />
            <View style={styles.pathLine} />
            <View style={styles.pathDot} />
          </View>

          <Text style={styles.cardTitle}>Structured Lessons</Text>
          <Text style={styles.cardDescription}>
            Follow curated collections from N5 to N1. Progressive curriculum designed for steady mastery.
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.cardHint}>📚 Guided learning path</Text>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Freestyle Practice Card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RoundSelect', { user })}
        >
          {/* Visual hint: flexible grid */}
          <View style={styles.gridVisual}>
            <View style={styles.gridDot} />
            <View style={styles.gridDot} />
            <View style={styles.gridDot} />
            <View style={styles.gridDot} />
            <View style={styles.gridDot} />
            <View style={styles.gridDot} />
          </View>

          <Text style={styles.cardTitle}>Freestyle Practice</Text>
          <Text style={styles.cardDescription}>
            Pick any topic, level, and round count. Perfect for drilling weak kanji or exploring new domains.
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.cardHint}>🎯 Custom sessions</Text>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backText: {
    color: '#555',
    fontSize: 14,
  },
  logo: {
    fontSize: 22,
    color: '#EFEFEF',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#E85D3A',
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    color: '#EFEFEF',
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 0.3,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    padding: 24,
    gap: 16,
    position: 'relative',
  },
  cardPrimary: {
    borderColor: '#E85D3A',
    borderWidth: 2,
  },
  cardBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#E85D3A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  // Path visual for structured lessons
  pathVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  pathDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  pathDotActive: {
    backgroundColor: '#E85D3A',
    borderColor: '#E85D3A',
  },
  pathLine: {
    width: 20,
    height: 2,
    backgroundColor: '#333',
  },
  // Grid visual for freestyle
  gridVisual: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: 60,
    marginTop: 8,
  },
  gridDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 24,
    color: '#EFEFEF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardHint: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  cardArrow: {
    fontSize: 24,
    color: '#E85D3A',
    fontWeight: '300',
  },
});
