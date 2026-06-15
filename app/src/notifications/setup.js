import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ANDROID_CHANNELS } from '../config';

export const NOTIFICATION_CATEGORIES = {
  TASK_DUE: 'task-due',
  TASK_OVERDUE: 'task-overdue',
  DAILY_REMINDER: 'daily-reminder',
};

// Show in-app banner when a notification arrives in foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(
    ANDROID_CHANNELS.TASK_REMINDERS.id,
    {
      name: ANDROID_CHANNELS.TASK_REMINDERS.name,
      description: ANDROID_CHANNELS.TASK_REMINDERS.description,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
      sound: ANDROID_CHANNELS.TASK_REMINDERS.sound,
      enableVibrate: true,
      showBadge: true,
    }
  );

  await Notifications.setNotificationChannelAsync(
    ANDROID_CHANNELS.DAILY_HABITS.id,
    {
      name: ANDROID_CHANNELS.DAILY_HABITS.name,
      description: ANDROID_CHANNELS.DAILY_HABITS.description,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 100, 150],
      lightColor: '#16a34a',
      sound: ANDROID_CHANNELS.DAILY_HABITS.sound,
      enableVibrate: true,
      showBadge: true,
    }
  );
}

export async function getPermissionStatus() {
  const settings = await Notifications.getPermissionsAsync();
  return settings;
}

export async function requestNotificationPermissions() {
  const existing = await Notifications.getPermissionsAsync();

  if (existing.status === 'granted') {
    return existing;
  }

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
}

export function getPermissionMessage(status) {
  switch (status) {
    case 'granted':
      return 'Notifications are enabled. You will receive task reminders and updates.';
    case 'denied':
      return 'Notifications are denied. Enable them in system settings to receive reminders.';
    case 'undetermined':
      return 'Notification permission has not been requested yet.';
    default:
      return 'Notification access is restricted on this device.';
  }
}

export function subscribeToNotifications({ onReceived, onResponse }) {
  const receivedSub = Notifications.addNotificationReceivedListener(onReceived);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

export async function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}

export function buildNotificationContent({
  title,
  body,
  taskId,
  screen = 'TaskDetail',
  categoryId,
  channelId,
}) {
  return {
    title,
    body,
    sound: 'default',
    categoryIdentifier: categoryId,
    ...(Platform.OS === 'android' && channelId
      ? { channelId }
      : {}),
    data: {
      taskId,
      screen,
      categoryId,
    },
  };
}
