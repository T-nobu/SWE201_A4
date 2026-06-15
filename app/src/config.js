export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const DEVICE_ID =
  process.env.EXPO_PUBLIC_DEVICE_ID || `device-${Date.now()}`;

export const ANDROID_CHANNELS = {
  TASK_REMINDERS: {
    id: 'task-reminders',
    name: 'Task Reminders',
    importance: 'HIGH',
    description: 'Due date and overdue alerts for your tasks',
    sound: 'default',
  },
  DAILY_HABITS: {
    id: 'daily-habits',
    name: 'Daily Habit Reminders',
    importance: 'DEFAULT',
    description: 'Recurring daily reminders at a set time',
    sound: 'default',
  },
};
