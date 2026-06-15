import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = '@taskreminder:tasks';

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function getTasks() {
  const raw = await AsyncStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getTaskById(taskId) {
  const tasks = await getTasks();
  return tasks.find((task) => task.id === taskId) || null;
}

export async function saveTasks(tasks) {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function createTask(taskData) {
  const tasks = await getTasks();
  const task = {
    id: generateId(),
    title: taskData.title.trim(),
    description: taskData.description?.trim() || '',
    dueDate: taskData.dueDate || null,
    reminderMinutesBefore: taskData.reminderMinutesBefore ?? 10,
    notificationsEnabled: taskData.notificationsEnabled ?? true,
    dailyReminder: taskData.dailyReminder ?? false,
    dailyReminderHour: taskData.dailyReminderHour ?? 20,
    dailyReminderMinute: taskData.dailyReminderMinute ?? 0,
    category: taskData.category || 'general',
    completed: false,
    createdAt: new Date().toISOString(),
    localNotificationIds: [],
  };

  tasks.unshift(task);
  await saveTasks(tasks);
  return task;
}

export async function updateTask(taskId, updates) {
  const tasks = await getTasks();
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return null;

  tasks[index] = { ...tasks[index], ...updates, id: taskId };
  await saveTasks(tasks);
  return tasks[index];
}

export async function deleteTask(taskId) {
  const tasks = await getTasks();
  const filtered = tasks.filter((task) => task.id !== taskId);
  await saveTasks(filtered);
  return filtered;
}

export async function toggleTaskComplete(taskId) {
  const tasks = await getTasks();
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return null;

  tasks[index].completed = !tasks[index].completed;
  await saveTasks(tasks);
  return tasks[index];
}

export async function setTaskNotificationIds(taskId, notificationIds) {
  return updateTask(taskId, { localNotificationIds: notificationIds });
}
