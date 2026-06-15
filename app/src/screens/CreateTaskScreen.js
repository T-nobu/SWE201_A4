import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import NotificationToggle from '../components/NotificationToggle';
import { createTask, setTaskNotificationIds } from '../api/tasks';
import { rescheduleTaskNotifications } from '../notifications/localNotifications';
import { useNotifications } from '../context/NotificationContext';

function getDefaultDueDate() {
  const date = new Date();
  date.setHours(date.getHours() + 2);
  date.setMinutes(0, 0, 0);
  return date;
}

function formatDateTimeInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreateTaskScreen({ navigation }) {
  const { permissionStatus, requestPermission } = useNotifications();
  const defaultDue = getDefaultDueDate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateInput, setDueDateInput] = useState(formatDateTimeInput(defaultDue));
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState('10');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [dailyHour, setDailyHour] = useState('20');
  const [dailyMinute, setDailyMinute] = useState('00');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a task title.');
      return;
    }

    if (notificationsEnabled && permissionStatus !== 'granted') {
      const settings = await requestPermission();
      if (settings.status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Enable notifications to schedule reminders for this task.'
        );
        return;
      }
    }

    setSaving(true);
    try {
      const dueDate = dueDateInput ? new Date(dueDateInput).toISOString() : null;
      const task = await createTask({
        title,
        description,
        dueDate,
        reminderMinutesBefore: Number(reminderMinutesBefore) || 10,
        notificationsEnabled,
        dailyReminder,
        dailyReminderHour: Number(dailyHour) || 20,
        dailyReminderMinute: Number(dailyMinute) || 0,
      });

      if (notificationsEnabled) {
        const ids = await rescheduleTaskNotifications(task);
        await setTaskNotificationIds(task.id, ids);
      }

      navigation.replace('TaskDetail', { taskId: task.id });
    } catch (error) {
      Alert.alert('Could not save task', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Finish assignment"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional details"
        multiline
      />

      <Text style={styles.label}>Due date & time</Text>
      <TextInput
        style={styles.input}
        value={dueDateInput}
        onChangeText={setDueDateInput}
        placeholder="YYYY-MM-DDTHH:mm"
      />
      <Text style={styles.hint}>
        Local reminder fires {reminderMinutesBefore} minutes before this time.
      </Text>

      <Text style={styles.label}>Reminder minutes before due</Text>
      <TextInput
        style={styles.input}
        value={reminderMinutesBefore}
        onChangeText={setReminderMinutesBefore}
        keyboardType="number-pad"
      />

      <NotificationToggle
        label="Enable notifications for this task"
        description="Schedules due-soon and overdue local alerts."
        value={notificationsEnabled}
        onValueChange={setNotificationsEnabled}
      />

      <View style={styles.dailyRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Daily reminder</Text>
          <Text style={styles.hint}>Repeats every day at the chosen time.</Text>
        </View>
        <Switch value={dailyReminder} onValueChange={setDailyReminder} />
      </View>

      {dailyReminder ? (
        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.label}>Hour (0-23)</Text>
            <TextInput
              style={styles.input}
              value={dailyHour}
              onChangeText={setDailyHour}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.label}>Minute</Text>
            <TextInput
              style={styles.input}
              value={dailyMinute}
              onChangeText={setDailyMinute}
              keyboardType="number-pad"
            />
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Create task'}</Text>
      </TouchableOpacity>

      {Platform.OS === 'web' ? (
        <Text style={styles.hint}>
          Web preview does not support scheduled notifications. Use Android/iOS device.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 18,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
