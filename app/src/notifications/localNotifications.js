import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ANDROID_CHANNELS } from '../config';
import {
  buildNotificationContent,
  NOTIFICATION_CATEGORIES,
} from './setup';

function parseDueDate(dueDate) {
  return dueDate ? new Date(dueDate) : null;
}

export async function cancelNotifications(notificationIds = []) {
  await Promise.all(
    notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
}

export async function scheduleDueReminder(task) {
  const dueDate = parseDueDate(task.dueDate);
  if (!dueDate || !task.notificationsEnabled) return [];

  const reminderTime = new Date(
    dueDate.getTime() - (task.reminderMinutesBefore || 10) * 60 * 1000
  );

  if (reminderTime.getTime() <= Date.now()) {
    return [];
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: buildNotificationContent({
      title: 'Task due soon',
      body: `"${task.title}" is due in ${task.reminderMinutesBefore} minutes.`,
      taskId: task.id,
      categoryId: NOTIFICATION_CATEGORIES.TASK_DUE,
      channelId: ANDROID_CHANNELS.TASK_REMINDERS.id,
    }),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
    },
  });

  return [id];
}

export async function scheduleOverdueReminder(task) {
  const dueDate = parseDueDate(task.dueDate);
  if (!dueDate || !task.notificationsEnabled) return [];

  if (dueDate.getTime() <= Date.now()) {
    return [];
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: buildNotificationContent({
      title: 'Task overdue',
      body: `"${task.title}" is now overdue. Tap to view details.`,
      taskId: task.id,
      categoryId: NOTIFICATION_CATEGORIES.TASK_OVERDUE,
      channelId: ANDROID_CHANNELS.TASK_REMINDERS.id,
    }),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueDate,
    },
  });

  return [id];
}

export async function scheduleDailyReminder(task) {
  if (!task.dailyReminder || !task.notificationsEnabled) return [];

  const hour = task.dailyReminderHour ?? 20;
  const minute = task.dailyReminderMinute ?? 0;

  const id = await Notifications.scheduleNotificationAsync({
    content: buildNotificationContent({
      title: 'Daily task reminder',
      body: `Time to work on "${task.title}".`,
      taskId: task.id,
      categoryId: NOTIFICATION_CATEGORIES.DAILY_REMINDER,
      channelId: ANDROID_CHANNELS.DAILY_HABITS.id,
    }),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNELS.DAILY_HABITS.id } : {}),
    },
  });

  return [id];
}

export async function scheduleAllTaskNotifications(task) {
  await cancelNotifications(task.localNotificationIds || []);

  if (!task.notificationsEnabled || task.completed) {
    return [];
  }

  const ids = [];
  ids.push(...(await scheduleDueReminder(task)));
  ids.push(...(await scheduleOverdueReminder(task)));
  ids.push(...(await scheduleDailyReminder(task)));

  return ids;
}

export async function rescheduleTaskNotifications(task) {
  const ids = await scheduleAllTaskNotifications(task);
  return ids;
}

export async function cancelTaskNotifications(task) {
  await cancelNotifications(task.localNotificationIds || []);
  return [];
}
