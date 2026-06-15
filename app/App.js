import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';
import ForegroundToast from './src/components/ForegroundToast';
import { setupAndroidChannels } from './src/notifications/setup';

function AppShell() {
  const { foregroundNotification, setForegroundNotification } = useNotifications();

  useEffect(() => {
    if (!foregroundNotification) return undefined;

    const timer = setTimeout(() => setForegroundNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [foregroundNotification, setForegroundNotification]);

  return (
    <>
      <AppNavigator />
      <ForegroundToast
        notification={foregroundNotification}
        onDismiss={() => setForegroundNotification(null)}
      />
      <StatusBar style="light" />
    </>
  );
}

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    setupAndroidChannels();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <NotificationProvider navigationRef={navigationRef}>
          <AppShell />
        </NotificationProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
