import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getPermissionStatus,
  getPermissionMessage,
  requestNotificationPermissions,
  subscribeToNotifications,
  getLastNotificationResponse,
} from '../notifications/setup';
import { registerForPushNotifications } from '../notifications/pushNotifications';
import { registerPushToken } from '../api/client';

const NotificationContext = createContext(null);

export function NotificationProvider({ children, navigationRef }) {
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [permissionMessage, setPermissionMessage] = useState('');
  const [pushToken, setPushToken] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [foregroundNotification, setForegroundNotification] = useState(null);
  const [lastTappedNotification, setLastTappedNotification] = useState(null);
  const [subscribedCategories, setSubscribedCategories] = useState(['reminders']);

  const refreshPermission = useCallback(async () => {
    const settings = await getPermissionStatus();
    setPermissionStatus(settings.status);
    setPermissionMessage(getPermissionMessage(settings.status));
    return settings;
  }, []);

  const navigateFromNotification = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data;
      if (!navigationRef?.current || !data) return;

      if (data.taskId) {
        navigationRef.current.navigate('TaskDetail', {
          taskId: data.taskId,
          fromNotification: true,
        });
        return;
      }

      if (data.screen === 'Home') {
        navigationRef.current.navigate('Home');
      }
    },
    [navigationRef]
  );

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications({
      onReceived: (notification) => {
        setForegroundNotification(notification);
      },
      onResponse: (response) => {
        setLastTappedNotification(response);
        navigateFromNotification(response);
      },
    });

    getLastNotificationResponse().then((response) => {
      if (response) {
        setLastTappedNotification(response);
        navigateFromNotification(response);
      }
    });

    return unsubscribe;
  }, [navigateFromNotification]);

  const requestPermission = useCallback(async () => {
    setRequestingPermission(true);
    try {
      const settings = await requestNotificationPermissions();
      setPermissionStatus(settings.status);
      setPermissionMessage(getPermissionMessage(settings.status));
      return settings;
    } finally {
      setRequestingPermission(false);
    }
  }, []);

  const registerDevice = useCallback(async () => {
    setRegistering(true);
    try {
      const token = await registerForPushNotifications();
      setPushToken(token);
      await registerPushToken(token, subscribedCategories);
      await refreshPermission();
      return token;
    } finally {
      setRegistering(false);
    }
  }, [subscribedCategories, refreshPermission]);

  const value = useMemo(
    () => ({
      permissionStatus,
      permissionMessage,
      pushToken,
      registering,
      requestingPermission,
      foregroundNotification,
      lastTappedNotification,
      subscribedCategories,
      setSubscribedCategories,
      setForegroundNotification,
      refreshPermission,
      requestPermission,
      registerDevice,
    }),
    [
      permissionStatus,
      permissionMessage,
      pushToken,
      registering,
      requestingPermission,
      foregroundNotification,
      lastTappedNotification,
      subscribedCategories,
      refreshPermission,
      requestPermission,
      registerDevice,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
