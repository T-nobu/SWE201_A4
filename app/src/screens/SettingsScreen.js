import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import PermissionBanner from '../components/PermissionBanner';
import NotificationToggle from '../components/NotificationToggle';
import { useNotifications } from '../context/NotificationContext';
import { DEVICE_ID, getDeviceInfo, sendTestRemoteNotification, updateDeviceCategories } from '../api/client';

const CATEGORY_OPTIONS = [
  { id: 'reminders', label: 'Task reminders' },
  { id: 'announcements', label: 'Announcements' },
];

export default function SettingsScreen() {
  const {
    permissionStatus,
    permissionMessage,
    pushToken,
    registering,
    requestingPermission,
    requestPermission,
    registerDevice,
    subscribedCategories,
    setSubscribedCategories,
  } = useNotifications();

  const [apiKey, setApiKey] = useState('');
  const [remoteTitle, setRemoteTitle] = useState('Server update');
  const [remoteBody, setRemoteBody] = useState('Your task list was synced from the server.');
  const [sendingRemote, setSendingRemote] = useState(false);
  const [categoryState, setCategoryState] = useState(
    Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.id, subscribedCategories.includes(c.id)]))
  );

  const handleRegister = async () => {
    try {
      const token = await registerDevice();
      Alert.alert('Registered', `Push token saved on backend.\n\n${token}`);
    } catch (error) {
      Alert.alert('Registration failed', error.message);
    }
  };

  const handleCategoryToggle = async (categoryId, enabled) => {
    const next = {
      ...categoryState,
      [categoryId]: enabled,
    };
    setCategoryState(next);

    const categories = Object.entries(next)
      .filter(([, active]) => active)
      .map(([id]) => id);

    setSubscribedCategories(categories);

    if (pushToken) {
      try {
        await updateDeviceCategories(categories);
      } catch (error) {
        Alert.alert('Could not update categories', error.message);
      }
    }
  };

  const handleSendRemoteTest = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API key required', 'Enter the backend API key from backend/.env');
      return;
    }

    setSendingRemote(true);
    try {
      await sendTestRemoteNotification(apiKey.trim(), {
        target: 'device',
        deviceId: DEVICE_ID,
        title: remoteTitle,
        body: remoteBody,
        data: {
          screen: 'Home',
          categoryId: 'announcements',
        },
      });
      Alert.alert('Sent', 'Remote push notification request submitted to backend.');
    } catch (error) {
      Alert.alert('Send failed', error.message);
    } finally {
      setSendingRemote(false);
    }
  };

  const handleFetchDevice = async () => {
    try {
      const info = await getDeviceInfo();
      Alert.alert(
        'Device record',
        `Categories: ${info.categories?.join(', ') || 'none'}\nToken: ${info.expoPushToken ? 'registered' : 'missing'}`
      );
    } catch (error) {
      Alert.alert('Lookup failed', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Permission status</Text>
      <PermissionBanner
        status={permissionStatus}
        message={permissionMessage}
        onRequest={requestPermission}
        loading={requestingPermission}
      />

      <Text style={styles.sectionTitle}>Remote push registration</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Device ID</Text>
        <Text style={styles.mono}>{DEVICE_ID}</Text>

        <Text style={styles.label}>Expo push token</Text>
        <Text style={styles.mono}>{pushToken || 'Not registered yet'}</Text>

        <TouchableOpacity
          style={[styles.button, registering && styles.disabled]}
          onPress={handleRegister}
          disabled={registering}
        >
          <Text style={styles.buttonText}>
            {registering ? 'Registering…' : 'Register device with backend'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleFetchDevice}>
          <Text style={styles.linkText}>Verify backend registration</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Notification categories</Text>
      <View style={styles.card}>
        {CATEGORY_OPTIONS.map((category) => (
          <View key={category.id} style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <Switch
              value={categoryState[category.id]}
              onValueChange={(value) => handleCategoryToggle(category.id, value)}
            />
          </View>
        ))}
        <Text style={styles.hint}>
          Backend can send remote notifications to devices subscribed to a category.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Test remote notification</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Backend API key</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="From backend .env API_KEY"
          secureTextEntry
        />
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={remoteTitle} onChangeText={setRemoteTitle} />
        <Text style={styles.label}>Body</Text>
        <TextInput style={styles.input} value={remoteBody} onChangeText={setRemoteBody} />

        <TouchableOpacity
          style={[styles.button, sendingRemote && styles.disabled]}
          onPress={handleSendRemoteTest}
          disabled={sendingRemote}
        >
          <Text style={styles.buttonText}>
            {sendingRemote ? 'Sending…' : 'Send remote push to this device'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Android channels</Text>
      <View style={styles.card}>
        <NotificationToggle
          label="task-reminders (HIGH)"
          description="Due soon and overdue alerts with custom sound."
          value={true}
          disabled
        />
        <NotificationToggle
          label="daily-habits (DEFAULT)"
          description="Recurring daily reminders."
          value={true}
          disabled
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryLabel: {
    fontSize: 15,
    color: '#111827',
  },
  hint: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});
