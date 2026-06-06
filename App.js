import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Battery from 'expo-battery';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/services/database';
import { registerBackgroundTask } from './src/services/backgroundTask';
import { Colors } from './src/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    initDatabase();
    registerBackgroundTask();
    const batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      if (batteryLevel < 0.15) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Low Battery ⚠️',
            body: 'Charge your device to avoid losing activity data.',
          },
          trigger: null,
        });
      }
    });
    return () => batterySubscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={Colors.primary} />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
