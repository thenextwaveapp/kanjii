import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E85D3A',
    });
  }

  return true;
}

export async function scheduleDailyReminder(hour = 19, minute = 0) {
  try {
    // Cancel existing daily reminder
    await cancelNotificationsByTag('daily-reminder');

    // Schedule new daily reminder
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-reminder',
      content: {
        title: '📚 Time to practice Japanese!',
        body: 'Keep your streak going with a quick practice session.',
        data: { type: 'daily-reminder' },
      },
      trigger: {
        type: 'daily',
        hour,
        minute,
        repeats: true,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to schedule daily reminder:', error);
    return false;
  }
}

export async function scheduleStreakRiskAlert() {
  try {
    // Cancel existing streak risk notification
    await cancelNotificationsByTag('streak-risk');

    // Schedule for 10 PM (22:00) if they haven't practiced yet
    await Notifications.scheduleNotificationAsync({
      identifier: 'streak-risk',
      content: {
        title: '🔥 Don\'t break your streak!',
        body: 'You haven\'t practiced today. A quick session keeps your streak alive.',
        data: { type: 'streak-risk' },
      },
      trigger: {
        type: 'daily',
        hour: 22,
        minute: 0,
        repeats: true,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to schedule streak risk alert:', error);
    return false;
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
    return false;
  }
}

async function cancelNotificationsByTag(tag) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(
      n => n.identifier === tag || n.content?.data?.type === tag
    );

    for (const notification of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.error(`Failed to cancel notifications with tag ${tag}:`, error);
  }
}

export async function checkNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
