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

      <View style={styles.container}>
        {/* Structured Path */}
        <TouchableOpacity
          style={styles.section}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CollectionList')}
        >
          <View style={styles.sectionContent}>
            <View style={styles.labelRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>STRUCTURED</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>
              Follow{'\n'}the path
            </Text>
            <Text style={styles.sectionDescription}>
              Curated collections designed for progressive mastery
            </Text>
          </View>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Free Practice */}
        <TouchableOpacity
          style={styles.section}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('RoundSelect', { user })}
        >
          <View style={styles.sectionContent}>
            <View style={styles.labelRow}>
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={[styles.badgeText, styles.badgeTextSecondary]}>FREESTYLE</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>
              Choose{'\n'}your topic
            </Text>
            <Text style={styles.sectionDescription}>
              Any subject, any level, any number of rounds
            </Text>
          </View>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
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
    paddingBottom: 20,
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  sectionContent: {
    flex: 1,
    gap: 16,
  },
  labelRow: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#E85D3A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  badgeSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  badgeTextSecondary: {
    color: '#666',
  },
  sectionTitle: {
    color: '#EFEFEF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 40,
  },
  sectionDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    maxWidth: 280,
  },
  arrow: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  arrowText: {
    color: '#E85D3A',
    fontSize: 32,
    fontWeight: '300',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1A1A1A',
  },
  dividerText: {
    color: '#333',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
