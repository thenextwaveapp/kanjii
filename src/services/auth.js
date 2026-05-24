import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import { clearCache } from './cache';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  // Use universal link for iOS, custom scheme for Android
  const redirectUrl = Linking.createURL('auth');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data?.url) throw error || new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type === 'success' && result.url) {
    const url = new URL(result.url);

    // PKCE flow: code in query params
    const code = url.searchParams.get('code');
    if (code) {
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) throw sessionError;
    } else {
      // Implicit flow: tokens in hash fragment
      const hashParams = new URLSearchParams(url.hash.replace('#', ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      }
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function signOut() {
  await supabase.auth.signOut();
  clearCache(); // Clear all cached data on sign out
}

export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}
