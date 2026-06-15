import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NotificationToggle from '../components/NotificationToggle';
import {
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  setTaskNotificationIds,
} from '../api/tasks';
import {
  rescheduleTaskNotifications,
  cancelTaskNotifications,
} from '../notifications/localNotifications';
import { useNotifications } from '../context/NotificationContext';

function formatDateTime(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString();
}

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId, fromNotification } = route.params;
  const { permissionStatus, requestPermission } = useNotifications();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadTask = useCallback(async () => {
    setLoading(true);
    const data = await getTaskById(taskId);
    setTask(data);
    setLoading(false);

    if (!data) {
      Alert.alert('Task not found', 'This task may have been deleted.');
      navigation.goBack();
    }
  }, [taskId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadTask();
    }, [loadTask])
  );

  const applyNotificationChange = async (nextTask) => {
    if (!nextTask.notificationsEnabled || nextTask.completed) {
      await cancelTaskNotifications(nextTask);
      await setTaskNotificationIds(nextTask.id, []);
      return;
    }

    if (permissionStatus !== 'granted') {
      const settings = await requestPermission();
      if (settings.status !== 'granted') {
        throw new Error('Notification permission is required.');
      }
    }

    const ids = await rescheduleTaskNotifications(nextTask);
    await setTaskNotificationIds(nextTask.id, ids);
  };

  const handleToggleNotifications = async (enabled) => {
    if (!task) return;
    setUpdating(true);
    try {
      const updated = await updateTask(task.id, { notificationsEnabled: enabled });
      await applyNotificationChange(updated);
      setTask({ ...updated, localNotificationIds: enabled ? updated.localNotificationIds : [] });
    } catch (error) {
      Alert.alert('Update failed', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    setUpdating(true);
    try {
      const updated = await toggleTaskComplete(task.id);
      if (updated.completed) {
        await cancelTaskNotifications(updated);
        await setTaskNotificationIds(updated.id, []);
      } else if (updated.notificationsEnabled) {
        const ids = await rescheduleTaskNotifications(updated);
        await setTaskNotificationIds(updated.id, ids);
        updated.localNotificationIds = ids;
      }
      setTask(updated);
    } catch (error) {
      Alert.alert('Update failed', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleReschedule = async () => {
    if (!task) return;
    setUpdating(true);
    try {
      const ids = await rescheduleTaskNotifications(task);
      await setTaskNotificationIds(task.id, ids);
      setTask({ ...task, localNotificationIds: ids });
      Alert.alert('Scheduled', `${ids.length} local notification(s) scheduled.`);
    } catch (error) {
      Alert.alert('Scheduling failed', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete task', 'This will cancel all scheduled reminders.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelTaskNotifications(task);
          await deleteTask(task.id);
          navigation.navigate('Home');
        },
      },
    ]);
  };

  if (loading || !task) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading task…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {fromNotification ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Opened from notification tap</Text>
        </View>
      ) : null}

      <Text style={styles.title}>{task.title}</Text>
      {task.description ? <Text style={styles.description}>{task.description}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Due date</Text>
        <Text style={styles.cardValue}>{formatDateTime(task.dueDate)}</Text>
        <Text style={styles.cardLabel}>Reminder offset</Text>
        <Text style={styles.cardValue}>{task.reminderMinutesBefore} minutes before</Text>
        <Text style={styles.cardLabel}>Scheduled local IDs</Text>
        <Text style={styles.cardValue}>
          {(task.localNotificationIds || []).length} active
        </Text>
      </View>

      <NotificationToggle
        label="Notifications for this task"
        description="Turn off to cancel all scheduled local reminders."
        value={task.notificationsEnabled}
        onValueChange={handleToggleNotifications}
        disabled={updating}
      />

      <TouchableOpacity
        style={[styles.button, updating && styles.disabled]}
        onPress={handleToggleComplete}
        disabled={updating}
      >
        <Text style={styles.buttonText}>
          {task.completed ? 'Mark incomplete' : 'Mark complete'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, updating && styles.disabled]}
        onPress={handleReschedule}
        disabled={updating}
      >
        <Text style={styles.secondaryButtonText}>Reschedule local notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete task</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  bannerText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    marginTop: 8,
    color: '#4b5563',
    lineHeight: 22,
  },
  card: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  cardValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
