import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

export default function NotificationToggle({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
        thumbColor={value ? '#2563eb' : '#f9fafb'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
});
