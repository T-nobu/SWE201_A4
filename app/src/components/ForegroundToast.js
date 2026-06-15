import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ForegroundToast({ notification, onDismiss }) {
  if (!notification) return null;

  const { title, body } = notification.request.content;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
      <Text style={styles.dismiss} onPress={onDismiss}>
        Dismiss
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  body: {
    color: '#dbeafe',
    marginTop: 4,
    fontSize: 13,
  },
  dismiss: {
    color: '#93c5fd',
    fontWeight: '600',
    fontSize: 13,
  },
});
