import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config/api';

const API_BASE = getApiBaseUrl();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  registerForPushNotifications: async () => {
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
      return { token: null, error: 'Web platform not supported' };
    }

    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return { token: null, error: 'Must use physical device' };
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return { token: null, error: 'Permission not granted' };
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      
      const token = tokenData.data;
      await AsyncStorage.setItem('push_token', token);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D96A23',
        });
      }

      return { token, error: null };
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return { token: null, error: error.message };
    }
  },

  registerTokenWithBackend: async (token) => {
    try {
      const authToken = await AsyncStorage.getItem('access_token');
      const vendorId = await AsyncStorage.getItem('vendor_id');

      if (!authToken || !vendorId) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE}/vendor/push-token/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendor_id: parseInt(vendorId),
          push_token: token,
          platform: Platform.OS,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register token');
      }

      return { success: true };
    } catch (error) {
      console.error('Error registering token with backend:', error);
      return { success: false, error: error.message };
    }
  },

  scheduleLocalNotification: async (title, body, data = {}, trigger = null) => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null,
      });
      return { id: notificationId, error: null };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return { id: null, error: error.message };
    }
  },

  cancelNotification: async (notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  cancelAllNotifications: async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getBadgeCount: async () => {
    try {
      const count = await Notifications.getBadgeCountAsync();
      return count;
    } catch (error) {
      return 0;
    }
  },

  setBadgeCount: async (count) => {
    try {
      await Notifications.setBadgeCountAsync(count);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  addNotificationReceivedListener: (callback) => {
    return Notifications.addNotificationReceivedListener(callback);
  },

  addNotificationResponseReceivedListener: (callback) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  getLastNotificationResponse: async () => {
    return await Notifications.getLastNotificationResponseAsync();
  },

  dismissAllNotifications: async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default notificationService;
