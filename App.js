import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import RoundSelectScreen from './src/screens/RoundSelectScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import StudyScreen from './src/screens/StudyScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import KanjiDetailScreen from './src/screens/KanjiDetailScreen';
import { onAuthStateChange, signInWithGoogle } from './src/services/auth';
import { supabase } from './src/services/supabase';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(undefined);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChange(setUser);
    return unsub;
  }, []);

  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      if (!url) return;
      const parsed = new URL(url);
      const code = parsed.searchParams.get('code');
      const hashParams = new URLSearchParams(parsed.hash.replace('#', ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) console.warn('Deep link auth error:', error.message);
      } else if (accessToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) console.warn('Deep link session error:', error.message);
      }
    };

    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const session = await signInWithGoogle();
      if (session?.user) setUser(session.user);
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setSigningIn(false);
    }
  };

  if (user === undefined) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator color="#E85D3A" size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.landing}>
          <View style={styles.landingTop}>
            <Text style={styles.landingLogo}>
              Kanj<Text style={styles.logoAccent}>ii</Text>
            </Text>
            <Text style={styles.landingTagline}>Learn kanji through real Japanese</Text>
          </View>

          <View style={styles.landingBottom}>
            <TouchableOpacity
              style={[styles.signInButton, signingIn && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              disabled={signingIn}
              activeOpacity={0.8}
            >
              <Text style={styles.signInButtonText}>
                {signingIn ? 'Opening...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
            {authError && <Text style={styles.authError}>{authError}</Text>}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0A' } }}
      >
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="RoundSelect" component={RoundSelectScreen} />
        <Stack.Screen name="Practice">
          {(props) => <PracticeScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Summary">
          {(props) => <SummaryScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Study">
          {(props) => <StudyScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {(props) => <SettingsScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="KanjiDetail">
          {(props) => <KanjiDetailScreen {...props} user={user} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  landing: {
    flex: 1, paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 80, paddingBottom: 48,
  },
  landingTop: { alignItems: 'flex-start' },
  landingLogo: { fontSize: 64, color: '#EFEFEF', fontWeight: '800', letterSpacing: -2 },
  logoAccent: { color: '#E85D3A' },
  landingTagline: { color: '#555', fontSize: 16, marginTop: 8, letterSpacing: 0.3 },
  landingBottom: { gap: 12 },
  signInButton: {
    backgroundColor: '#E85D3A', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  signInButtonDisabled: { opacity: 0.5 },
  signInButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  authError: { color: '#E85D3A', fontSize: 12, textAlign: 'center' },
});
