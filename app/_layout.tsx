import { Stack, router } from "expo-router";
import './global.css';
import React, { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { WebRTCProvider, useWebRTCContext } from '../lib/WebRTCContext';
import { FIXED_ROOM_ID } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupGlobalNotificationListeners, setupNotificationCategories, setupNotificationChannels } from '../lib/notifications';
import * as Notifications from 'expo-notifications';

function AppLayout() {
  const { isConnected, joinRoom, peerJoined } = useWebRTCContext();
  const [userId, setUserId] = useState<string | null>(null);
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Failed to get user ID:', error);
      }
    };
    getUserId();
  }, []);



  useEffect(() => {
    if (peerJoined) {
      router.replace('/incoming');
    }
  }, [peerJoined]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="landing" options={{ headerShown: false }} />
      <Stack.Screen name="incoming" options={{ headerShown: false }} />
      <Stack.Screen name="ongoing" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // --- SETUP PHASE ---
    // 1. Create notification channels (Android only)
    if (Platform.OS === 'android') {
      setupNotificationChannels();
    }
    // 2. Set up interactive actions (Accept/Decline)
    setupNotificationCategories();

    // 3. Set up listeners for incoming notifications WHEN THE APP IS ALREADY RUNNING
    const cleanupListeners = setupGlobalNotificationListeners();

    // --- LAUNCH HANDLING PHASE ---
    // 4. Check if the app was launched by a notification tap (when app was killed)
    const handleLaunchNotification = async () => {
      const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastNotificationResponse) {
        const { actionIdentifier, notification } = lastNotificationResponse;
        const data = notification.request.content.data as any;
        const { roomId } = data;

        console.log('[Launch] App opened by notification. Action:', actionIdentifier);

        if (actionIdentifier === 'accept' || actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          router.push({ pathname: '/ongoing', params: { roomId } });
        } else if (actionIdentifier === 'decline') {
          // We need a way to reject the call here. Let's add a helper.
          // This is a simplified version. Ideally, you'd have a shared API client.
          fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/reject-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId }),
          }).catch(err => console.error('[Launch] Failed to reject call:', err));
        }
      }
    };

    handleLaunchNotification();

    // Cleanup function to remove listeners on unmount
    return () => {
      cleanupListeners();
    };
  }, []);

  return (
    <WebRTCProvider>
      <AppLayout />
    </WebRTCProvider>
  );
}
