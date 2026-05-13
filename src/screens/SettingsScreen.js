import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { signOut } from '../services/auth';

export default function SettingsScreen({ navigation, user }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
        </View>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Signed in as</Text>
          <Text style={styles.rowValue} numberOfLines={1}>{user?.email || '—'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Coming soon</Text>
        {['Daily goal', 'Notifications', 'JLPT target level', 'Reset progress'].map((item) => (
          <View key={item} style={styles.row}>
            <Text style={styles.rowLabel}>{item}</Text>
            <Text style={styles.rowValueMuted}>—</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
        <Text style={styles.version}>Kanjii · v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backText: { color: '#555', fontSize: 14 },
  logo: { fontSize: 20, color: '#EFEFEF', fontWeight: '800', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  title: { color: '#EFEFEF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  section: { marginBottom: 32, paddingHorizontal: 24 },
  sectionLabel: {
    color: '#555', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1A1A1A',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8,
  },
  rowLabel: { color: '#EFEFEF', fontSize: 14 },
  rowValue: { color: '#555', fontSize: 13, maxWidth: 180 },
  rowValueMuted: { color: '#333', fontSize: 13 },
  footer: { position: 'absolute', bottom: 48, left: 24, right: 24, alignItems: 'center', gap: 16 },
  signOutButton: {
    width: '100%', borderWidth: 1, borderColor: '#222', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  signOutText: { color: '#555', fontSize: 14 },
  version: { color: '#2A2A2A', fontSize: 12 },
});
