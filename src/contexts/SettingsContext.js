import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, saveSetting } from '../services/settings';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ textScale: 1.0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(loaded => {
      setSettings(loaded);
      setLoading(false);
    });
  }, []);

  const updateSetting = async (key, value) => {
    const updated = await saveSetting(key, value);
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
