import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TEXT_SCALE_OPTIONS, VOICE_OPTIONS, SPEECH_RATE_OPTIONS } from '../services/settings';
import { useSettings } from '../contexts/SettingsContext';
import { speakJapanese } from '../services/tts';
import { signOut } from '../services/auth';
import {
  requestPermissions,
  scheduleDailyReminder,
  scheduleStreakRiskAlert,
  cancelAllNotifications,
  checkNotificationPermissions,
} from '../services/notifications';

export default function SettingsScreen({ navigation, user }) {
  const { settings, updateSetting } = useSettings();
  const [testingVoice, setTestingVoice] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkNotificationPermissions().then(setHasPermission);
  }, []);

  const testVoice = async () => {
    if (testingVoice) return;
    setTestingVoice(true);
    try {
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === settings.voiceGender);
      await speakJapanese('こんにちは', {
        voice: voiceConfig?.voice,
        rate: settings.speechRate,
      });
    } catch (error) {
      console.error('Voice test error:', error);
    } finally {
      setTimeout(() => setTestingVoice(false), 2000);
    }
  };

  const handleNotificationToggle = async (value) => {
    if (value) {
      // Request permissions
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive practice reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
      setHasPermission(true);

      // Schedule notifications
      await scheduleDailyReminder(settings.dailyReminderHour, settings.dailyReminderMinute);
      await scheduleStreakRiskAlert();
      await updateSetting('notificationsEnabled', true);
    } else {
      // Cancel all notifications
      await cancelAllNotifications();
      await updateSetting('notificationsEnabled', false);
    }
  };

  const handleTimeChange = async (event, selectedDate) => {
    if (event.type === 'dismissed') return;

    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();

      await updateSetting('dailyReminderHour', hour);
      await updateSetting('dailyReminderMinute', minute);

      if (settings.notificationsEnabled) {
        await scheduleDailyReminder(hour, minute);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
        </View>

        <Text style={styles.title}>Settings</Text>

        {/* Voice */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Voice</Text>

          <View style={[styles.card, styles.cardWithButton]}>
            <Text style={styles.compactLabel}>Gender</Text>
            <View style={styles.compactOptions}>
              {VOICE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.compactOption, settings.voiceGender === option.value && styles.compactOptionActive]}
                  onPress={() => updateSetting('voiceGender', option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.compactOptionText, settings.voiceGender === option.value && styles.compactOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.compactLabel}>Speed</Text>
            <View style={styles.speedOptions}>
              {SPEECH_RATE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.speedOption, settings.speechRate === option.value && styles.speedOptionActive]}
                  onPress={() => updateSetting('speechRate', option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.speedOptionText, settings.speechRate === option.value && styles.speedOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.testButtonBottomRight, testingVoice && styles.testButtonActive]}
              onPress={testVoice}
              disabled={testingVoice}
              activeOpacity={0.7}
            >
              <Text style={styles.testButtonCompactText}>
                {testingVoice ? '🔊' : '🔊'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Text Size */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Text Size</Text>

          <View style={styles.card}>
            <View style={styles.preview}>
              <Text style={[styles.previewJp, { fontSize: 18 * settings.textScale }]}>
                今日は良い天気です
              </Text>
              <Text style={[styles.previewEn, { fontSize: 13 * settings.textScale }]}>
                It's nice weather today
              </Text>
            </View>

            <View style={styles.scaleOptions}>
              {TEXT_SCALE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.scaleOption, settings.textScale === option.value && styles.scaleOptionActive]}
                  onPress={() => updateSetting('textScale', option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.scaleText, settings.textScale === option.value && styles.scaleTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>

          <View style={styles.card}>
            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Daily Reminders</Text>
                <Text style={styles.notificationDescription}>
                  Get notified to practice and protect your streak
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#333', true: '#E85D3A' }}
                thumbColor={settings.notificationsEnabled ? '#FFF' : '#888'}
              />
            </View>

            {settings.notificationsEnabled && (
              <>
                <View style={styles.divider} />
                <Text style={styles.compactLabel}>Reminder Time</Text>
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={(() => {
                      const date = new Date();
                      date.setHours(settings.dailyReminderHour);
                      date.setMinutes(settings.dailyReminderMinute);
                      return date;
                    })()}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleTimeChange}
                    textColor="#EFEFEF"
                  />
                </View>
                <Text style={styles.notificationHint}>
                  Streak risk alerts sent at 22:00 if you haven't practiced
                </Text>
              </>
            )}
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.accountEmail}>{user?.email || 'Not signed in'}</Text>
              </View>

              {user?.user_metadata?.full_name && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Name</Text>
                    <Text style={styles.accountEmail}>{user.user_metadata.full_name}</Text>
                  </View>
                </>
              )}

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.signOutButton}
                onPress={() => {
                  Alert.alert(
                    'Sign Out',
                    'Are you sure you want to sign out? Your progress is saved and will be restored when you sign back in.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await signOut();
                            // App.js will handle navigation back to splash
                          } catch (error) {
                            Alert.alert('Error', 'Failed to sign out');
                          }
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { padding: 24, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: { color: '#555', fontSize: 14 },
  logo: { fontSize: 20, color: '#EFEFEF', fontWeight: '900', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  title: {
    color: '#EFEFEF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  section: { marginBottom: 32 },
  sectionLabel: {
    color: '#555',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 16,
    position: 'relative',
  },
  cardWithButton: {
    paddingBottom: 60,
  },
  compactLabel: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compactOption: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  compactOptionActive: {
    backgroundColor: '#E85D3A',
    borderColor: '#E85D3A',
  },
  compactOptionText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  compactOptionTextActive: {
    color: '#FFF',
  },
  testButtonBottomRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonActive: {
    opacity: 0.6,
  },
  testButtonCompactText: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#1A1A1A',
    marginVertical: 12,
  },
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  speedOption: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  speedOptionActive: {
    backgroundColor: '#E85D3A',
    borderColor: '#E85D3A',
  },
  speedOptionText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  speedOptionTextActive: {
    color: '#FFF',
  },
  preview: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  previewJp: {
    color: '#EFEFEF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  previewEn: {
    color: '#666',
  },
  scaleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  scaleOptionActive: {
    backgroundColor: '#E85D3A',
  },
  scaleText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  scaleTextActive: {
    color: '#FFF',
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    color: '#EFEFEF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationDescription: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
  },
  timePickerContainer: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  notificationHint: {
    color: '#555',
    fontSize: 11,
    fontStyle: 'italic',
  },
  sectionTitle: {
    color: '#555',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
  },
  accountEmail: {
    color: '#888',
    fontSize: 14,
  },
  signOutButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: '#E85D3A',
    fontSize: 15,
    fontWeight: '600',
  },
});
