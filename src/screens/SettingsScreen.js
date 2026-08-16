import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TEXT_SCALE_OPTIONS, VOICE_OPTIONS, SPEECH_RATE_OPTIONS } from '../services/settings';
import { useSettings } from '../contexts/SettingsContext';
import { speakJapanese } from '../services/tts';
import { signOut } from '../services/auth';
import {
  requestPermissions,
  scheduleDailyReminders,
  scheduleStreakRiskAlert,
  cancelAllNotifications,
  checkNotificationPermissions,
} from '../services/notifications';

export default function SettingsScreen({ navigation, user }) {
  const { settings, updateSetting } = useSettings();
  const [hasPermission, setHasPermission] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(null); // null or reminder index (1, 2, 3)
  const sliderRef = useRef(null);
  const voiceTestTimeout = useRef(null);

  useEffect(() => {
    checkNotificationPermissions().then(setHasPermission);
  }, []);

  const testVoice = async (voiceValue, rateValue) => {
    try {
      const voiceConfig = VOICE_OPTIONS.find(v => v.value === (voiceValue || settings.voiceGender));
      await speakJapanese('こんにちは', {
        voice: voiceConfig?.voice,
        rate: rateValue || settings.speechRate,
      });
    } catch (error) {
      console.error('Voice test error:', error);
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
      await scheduleReminders();
      await scheduleStreakRiskAlert();
      await updateSetting('notificationsEnabled', true);
    } else {
      // Cancel all notifications
      await cancelAllNotifications();
      await updateSetting('notificationsEnabled', false);
    }
  };

  const scheduleReminders = async () => {
    const count = settings.dailyReminderCount || 1;
    const reminders = [];

    for (let i = 1; i <= count; i++) {
      reminders.push({
        hour: settings[`dailyReminder${i}Hour`],
        minute: settings[`dailyReminder${i}Minute`],
      });
    }

    await scheduleDailyReminders(reminders);
  };

  const handleTimeChange = async (reminderIndex, event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(null);
      return;
    }

    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();

      await updateSetting(`dailyReminder${reminderIndex}Hour`, hour);
      await updateSetting(`dailyReminder${reminderIndex}Minute`, minute);

      if (settings.notificationsEnabled) {
        await scheduleReminders();
      }
    }
  };

  const formatTime = (hour, minute) => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleReminderCountChange = async (count) => {
    await updateSetting('dailyReminderCount', count);
    if (settings.notificationsEnabled) {
      await scheduleReminders();
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

          <View style={styles.card}>
            <Text style={styles.compactLabel}>Gender</Text>
            <View style={styles.compactOptions}>
              {VOICE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.compactOption, settings.voiceGender === option.value && styles.compactOptionActive]}
                  onPress={() => {
                    updateSetting('voiceGender', option.value);
                    testVoice(option.value, settings.speechRate);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.compactOptionText, settings.voiceGender === option.value && styles.compactOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.compactLabel}>
              Speed {settings.speechRate.toFixed(2)}x
            </Text>
            <View
              ref={sliderRef}
              style={styles.sliderContainer}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                sliderRef.current?.measure((x, y, width, height, pageX, pageY) => {
                  const touchX = e.nativeEvent.pageX - pageX;
                  const percentage = Math.max(0, Math.min(1, touchX / width));
                  const value = 0.5 + percentage * 1.0; // 0.5 to 1.5
                  updateSetting('speechRate', value);
                });
              }}
              onResponderMove={(e) => {
                sliderRef.current?.measure((x, y, width, height, pageX, pageY) => {
                  const touchX = e.nativeEvent.pageX - pageX;
                  const percentage = Math.max(0, Math.min(1, touchX / width));
                  const value = 0.5 + percentage * 1.0; // 0.5 to 1.5
                  updateSetting('speechRate', value);

                  // Debounce voice test
                  if (voiceTestTimeout.current) {
                    clearTimeout(voiceTestTimeout.current);
                  }
                  voiceTestTimeout.current = setTimeout(() => {
                    testVoice(settings.voiceGender, value);
                  }, 500);
                });
              }}
            >
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    { width: `${((settings.speechRate - 0.5) / 1.0) * 100}%` }
                  ]}
                />
              </View>
              <View
                style={[
                  styles.sliderThumb,
                  { left: `${((settings.speechRate - 0.5) / 1.0) * 100}%` }
                ]}
              />
            </View>
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
                <Text style={styles.compactLabel}>Daily Reminders</Text>
                <View style={styles.reminderCountOptions}>
                  {[1, 2, 3].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.reminderCountOption,
                        settings.dailyReminderCount === count && styles.reminderCountOptionActive,
                      ]}
                      onPress={() => handleReminderCountChange(count)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.reminderCountText,
                          settings.dailyReminderCount === count && styles.reminderCountTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.divider} />
                <View style={styles.timesList}>
                  {Array.from({ length: settings.dailyReminderCount || 1 }, (_, i) => i + 1).map((index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.timeItem}
                      onPress={() => setShowTimePicker(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timeLabel}>
                        {settings.dailyReminderCount > 1 ? `${index}.` : 'Time'}
                      </Text>
                      <Text style={styles.timeValue}>
                        {formatTime(
                          settings[`dailyReminder${index}Hour`] || 19,
                          settings[`dailyReminder${index}Minute`] || 0
                        )}
                      </Text>
                    </TouchableOpacity>
                  ))}
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

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowTimePicker(null)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {settings.dailyReminderCount > 1
                  ? `Reminder ${showTimePicker}`
                  : 'Reminder Time'}
              </Text>
              <TouchableOpacity onPress={() => setShowTimePicker(null)}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const date = new Date();
                  date.setHours(settings[`dailyReminder${showTimePicker}Hour`] || 19);
                  date.setMinutes(settings[`dailyReminder${showTimePicker}Minute`] || 0);
                  return date;
                })()}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, selectedDate) => handleTimeChange(showTimePicker, event, selectedDate)}
                textColor="#EFEFEF"
              />
            )}
          </View>
        </View>
      </Modal>
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
  reminderCountOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reminderCountOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#222',
  },
  reminderCountOptionActive: {
    backgroundColor: '#E85D3A',
    borderColor: '#E85D3A',
  },
  reminderCountText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  reminderCountTextActive: {
    color: '#FFF',
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
  timesList: {
    gap: 8,
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  timeLabel: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
  },
  timeValue: {
    color: '#E85D3A',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalTitle: {
    color: '#EFEFEF',
    fontSize: 17,
    fontWeight: '600',
  },
  modalDone: {
    color: '#E85D3A',
    fontSize: 16,
    fontWeight: '600',
  },
  sliderContainer: {
    height: 40,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#E85D3A',
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E85D3A',
    marginLeft: -10,
    top: 10,
  },
});
