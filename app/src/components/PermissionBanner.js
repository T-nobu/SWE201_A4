import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG = {
  granted: { label: 'Granted', color: '#16a34a', bg: '#dcfce7' },
  denied: { label: 'Denied', color: '#dc2626', bg: '#fee2e2' },
  undetermined: { label: 'Not requested', color: '#ca8a04', bg: '#fef9c3' },
  default: { label: 'Restricted', color: '#6b7280', bg: '#f3f4f6' },
};

export default function PermissionBanner({ status, message, onRequest, loading }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.default;

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={styles.badgeText}>{config.label}</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
      {status !== 'granted' && onRequest ? (
        <Text
          style={[styles.action, loading && styles.disabled]}
          onPress={loading ? undefined : onRequest}
        >
          {loading ? 'Requesting…' : 'Request permission'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  row: {
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  message: {
    color: '#1f2937',
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
});
