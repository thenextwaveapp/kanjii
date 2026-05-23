import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, saveSetting } from '../services/settings';
import { supabase } from '../services/supabase';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  textScale: 1.0,
  voiceGender: 'female',
  speechRate: 0.85,
  notificationsEnabled: false,
  dailyReminderHour: 19,
  dailyReminderMinute: 0,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get initial user and settings
    const initSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        if (user?.id) {
          const loaded = await getSettings(user.id);
          setSettings(loaded);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.error('Error initializing settings:', error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    initSettings();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);

      if (newUserId) {
        // User signed in - load their settings
        const loaded = await getSettings(newUserId);
        setSettings(loaded);
      } else {
        // User signed out - reset to defaults
        setSettings(DEFAULT_SETTINGS);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateSetting = async (key, value) => {
    if (!userId) {
      console.warn('Cannot update settings: no user signed in');
      return;
    }

    const updated = await saveSetting(userId, key, value);
    if (updated) setSettings(updated);
  };

  if (loading) return null;

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

// Helper to scale text sizes
export function scaleText(baseSize, textScale) {
  return baseSize * textScale;
}
