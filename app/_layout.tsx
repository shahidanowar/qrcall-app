import { Stack, router } from "expo-router";
import './global.css';
import React, { useEffect, useState, useRef } from 'react';
import { WebRTCProvider, useWebRTCContext } from '../lib/WebRTCContext';
import { FIXED_ROOM_ID } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupGlobalNotificationListeners, setupNotificationCategories } from '../lib/notifications';
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
    if (isConnected && userId && !hasJoinedRoom.current) {
      joinRoom(FIXED_ROOM_ID(userId));
      hasJoinedRoom.current = true;
    }
  }, [isConnected, joinRoom, userId]);

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
    // Sets up interactive actions (Accept/Decline)
    setupNotificationCategories();

    // Sets up listeners for incoming notifications
    const cleanupListeners = setupGlobalNotificationListeners();

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
