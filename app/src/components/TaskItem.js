import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function formatDueDate(dueDate) {
  if (!dueDate) return 'No due date';
  const date = new Date(dueDate);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TaskItem({ task, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={[styles.title, task.completed && styles.completed]}>
          {task.title}
        </Text>
        <View
          style={[
            styles.badge,
            task.notificationsEnabled ? styles.enabled : styles.disabled,
          ]}
        >
          <Text style={styles.badgeText}>
            {task.notificationsEnabled ? 'Alerts on' : 'Alerts off'}
          </Text>
        </View>
      </View>
      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}
      <Text style={styles.meta}>{formatDueDate(task.dueDate)}</Text>
      {task.dailyReminder ? (
        <Text style={styles.meta}>
          Daily at {String(task.dailyReminderHour).padStart(2, '0')}:
          {String(task.dailyReminderMinute).padStart(2, '0')}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  description: {
    marginTop: 6,
    color: '#4b5563',
    fontSize: 14,
  },
  meta: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 13,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  enabled: {
    backgroundColor: '#dbeafe',
  },
  disabled: {
    backgroundColor: '#f3f4f6',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
});
