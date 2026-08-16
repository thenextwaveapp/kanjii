import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { SettingsProvider, useSettings } from './src/contexts/SettingsContext';
import HomeScreen from './src/screens/HomeScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import ModeSelectScreen from './src/screens/ModeSelectScreen';
import RoundSelectScreen from './src/screens/RoundSelectScreen';
import CollectionListScreen from './src/screens/CollectionListScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import KanaPracticeSummary from './src/screens/KanaPracticeSummary';
import StudyScreen from './src/screens/StudyScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import KanjiDetailScreen from './src/screens/KanjiDetailScreen';
import SentenceDetailScreen from './src/screens/SentenceDetailScreen';
import LearnScreen from './src/screens/LearnScreen';
import { onAuthStateChange, signInWithGoogle } from './src/services/auth';
import { supabase } from './src/services/supabase';
import { isProfileCompleted } from './src/services/profile';

const Stack = createNativeStackNavigator();

const NAVIGATION_STATE_KEY = '@navigation_state';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [initialNavigationState, setInitialNavigationState] = useState();
  const routeNameRef = useRef();

  useEffect(() => {
    const unsub = onAuthStateChange(setUser);
    return unsub;
  }, []);

  // Restore navigation state
  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
        const state = savedStateString ? JSON.parse(savedStateString) : undefined;
        setInitialNavigationState(state);
      } catch (e) {
        console.warn('Failed to restore navigation state:', e);
      } finally {
        setIsNavigationReady(true);
      }
    };

    if (!isNavigationReady) {
      restoreState();
    }
  }, [isNavigationReady]);

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

  // Loading state
  if (user === undefined) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator color="#E85D3A" size="large" />
      </View>
    );
  }

  // Not signed in - show splash
  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.landing}>
          <View style={styles.landingTop}>
            <Text style={styles.landingLogo}>
              Kanj<Text style={styles.logoAccent}>ii</Text>
            </Text>
            <Text style={styles.landingTagline}>Master Japanese, one kanji at a time</Text>
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

  // Signed in - show app
  if (!isNavigationReady) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator color="#E85D3A" size="large" />
      </View>
    );
  }

  return (
    <SettingsProvider>
      <AppNavigator user={user} initialNavigationState={initialNavigationState} />
    </SettingsProvider>
  );
}

// Wrapper component to check profile completion and route accordingly
function AppNavigator({ user, initialNavigationState }) {
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Home');
  const [navState, setNavState] = useState(initialNavigationState);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugReport, setBugReport] = useState('');

  useEffect(() => {
    async function checkProfile() {
      if (user?.id) {
        console.log('Checking profile for user:', user.id);
        const completed = await isProfileCompleted(user.id);
        console.log('Profile completed:', completed);
        const route = completed ? 'Home' : 'UserProfile';
        console.log('Setting initial route to:', route);
        setInitialRoute(route);

        // Clear navigation state if profile not completed
        // This ensures UserProfile screen shows instead of restored state
        if (!completed) {
          console.log('Clearing navigation state for profile setup');
          setNavState(undefined);
        }
      }
      setCheckingProfile(false);
    }
    checkProfile();
  }, [user?.id]);

  if (checkingProfile) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator color="#E85D3A" size="large" />
      </View>
    );
  }

  const handleBugSubmit = async () => {
    if (!bugReport.trim()) {
      Alert.alert('Error', 'Please describe the bug');
      return;
    }

    try {
      const { error } = await supabase.from('bug_reports').insert({
        user_id: user.id,
        user_email: user.email,
        description: bugReport,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert('Thanks!', 'Bug report submitted');
      setBugReport('');
      setShowBugModal(false);
    } catch (err) {
      console.error('Bug report error:', err);
      Alert.alert('Error', 'Failed to submit bug report');
    }
  };

  return (
    <>
      <NavigationContainer
      initialState={navState}
      onStateChange={(state) => {
        AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
      }}
    >
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0A' } }}
      >
        <Stack.Screen name="UserProfile">
          {(props) => <UserProfileScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} user={user} />}
        </Stack.Screen>
          <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
          <Stack.Screen
            name="RoundSelect"
            options={{
              animation: 'slide_from_bottom',
            }}
            component={RoundSelectScreen}
          />
          <Stack.Screen name="CollectionList">
            {(props) => <CollectionListScreen {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen
            name="Practice"
            options={{
              animation: 'slide_from_bottom',
            }}
          >
            {(props) => <PracticeScreen {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Summary">
            {(props) => <SummaryScreen {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen
            name="KanaPracticeSummary"
            options={{
              animation: 'slide_from_bottom',
            }}
          >
            {(props) => <KanaPracticeSummary {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Study">
            {(props) => <StudyScreen {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {(props) => <SettingsScreen {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Learn">
            {(props) => <LearnScreen {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen
            name="KanjiDetail"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 300,
            }}
          >
            {(props) => <KanjiDetailScreen {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen
            name="SentenceDetail"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          >
            {(props) => <SentenceDetailScreen {...props} user={user} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>

      {/* Floating bug report button */}
      <TouchableOpacity
        style={styles.bugButton}
        onPress={() => setShowBugModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.bugEmoji}>🐛</Text>
      </TouchableOpacity>

      {/* Bug report modal */}
      <Modal
        visible={showBugModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBugModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.bugModalOverlay}
        >
          <TouchableOpacity
            style={styles.bugModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowBugModal(false)}
          />
          <View style={styles.bugModalContent}>
            <Text style={styles.bugModalTitle}>Report a Bug</Text>
            <TextInput
              style={styles.bugInput}
              placeholder="Describe what happened..."
              placeholderTextColor="#555"
              value={bugReport}
              onChangeText={setBugReport}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.bugModalButtons}>
              <TouchableOpacity
                style={[styles.bugModalButton, styles.bugModalButtonCancel]}
                onPress={() => {
                  setBugReport('');
                  setShowBugModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.bugModalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bugModalButton, styles.bugModalButtonSubmit]}
                onPress={handleBugSubmit}
                activeOpacity={0.7}
              >
                <Text style={styles.bugModalButtonSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
    );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  landing: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 48,
  },
  landingTop: { alignItems: 'flex-start' },
  landingLogo: { fontSize: 64, color: '#EFEFEF', fontWeight: '800', letterSpacing: -2 },
  logoAccent: { color: '#E85D3A' },
  landingTagline: { color: '#555', fontSize: 16, marginTop: 8, letterSpacing: 0.3 },
  landingBottom: { gap: 12 },
  signInButton: {
    backgroundColor: '#E85D3A',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  signInButtonDisabled: { opacity: 0.5 },
  signInButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  authError: { color: '#E85D3A', fontSize: 12, textAlign: 'center' },
  bugButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bugEmoji: {
    fontSize: 28,
  },
  bugModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bugModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  bugModalContent: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  bugModalTitle: {
    color: '#EFEFEF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  bugInput: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    color: '#EFEFEF',
    fontSize: 14,
    minHeight: 120,
    marginBottom: 16,
  },
  bugModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bugModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bugModalButtonCancel: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#333',
  },
  bugModalButtonCancelText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  bugModalButtonSubmit: {
    backgroundColor: '#E85D3A',
  },
  bugModalButtonSubmitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
