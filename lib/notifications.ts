import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { rejectCall } from './api';

// --- Basic Setup and Registration ---

/**
 * Sets up the default notification channel for Android.
 */
const CALL_CHANNEL_ID = 'call_channel';

async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CALL_CHANNEL_ID, {
      name: 'Incoming Calls',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500], // Custom vibration for calls
      sound: 'ringtone.wav', // IMPORTANT: Add 'ringtone.wav' to your /assets folder
      lightColor: '#FF231F7C',
      bypassDnd: true, // Override Do Not Disturb for incoming calls
    });
    console.log('[Notifications] Call notification channel set up.');
  }
}

/**
 * Registers the device for push notifications and returns the token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.error('Failed to get push token for push notification!');
    return null;
  }

  await setupNotificationChannels();

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('[Notifications] Expo Push Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

// --- Interactive Call Notifications ---

const INCOMING_CALL_CATEGORY_ID = 'call';

/**
 * Sets up interactive notification categories for incoming calls.
 */
export async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync(INCOMING_CALL_CATEGORY_ID, [
    {
      identifier: 'accept',
      buttonTitle: 'Accept',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'decline',
      buttonTitle: 'Decline',
      options: { isDestructive: true, opensAppToForeground: false },
    },
  ]);
  console.log('[Notifications] Interactive categories set up.');
}

// --- Global Notification Handlers ---

/**
 * Defines how incoming notifications are handled when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // For iOS
    shouldShowList: true, // For Android
  }),
});

/**
 * Sets up global listeners to respond to notification events.
 * This should be called once at the root of your app.
 */
export function setupGlobalNotificationListeners() {
  // Define a type for our expected notification data
  interface CallNotificationData {
    type: 'incoming_call';
    roomId: string;
    callerName: string;
  }
  // Listener for when a notification is received (foreground)
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('[Notifications] Received:', notification.request.content.title);
  });

  // Listener for when a user interacts with a notification (taps, dismisses, etc.)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
    const { actionIdentifier, notification } = response;
        const data = notification.request.content.data as unknown as CallNotificationData;

    if (data?.type !== 'incoming_call') return;

    console.log(`[Notifications] User action: ${actionIdentifier} for room ${data.roomId}`);

    if (actionIdentifier === 'accept' || actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      // Navigate to the incoming call screen
      router.replace({ pathname: '/incoming', params: { roomId: data.roomId, callerName: data.callerName } });
    } else if (actionIdentifier === 'decline') {
      try {
        await rejectCall(data.roomId);
        console.log(`Successfully rejected call for room ${data.roomId}`);
      } catch (error) {
        console.error('Failed to reject call:', error);
      }
    }
  });

  console.log('[Notifications] Global listeners attached.');

  // Return a cleanup function to be used in useEffect
  return () => {
    Notifications.removeNotificationSubscription(receivedSubscription);
    Notifications.removeNotificationSubscription(responseSubscription);
    console.log('[Notifications] Global listeners removed.');
  };
}
