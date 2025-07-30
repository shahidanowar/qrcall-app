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

export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CALL_CHANNEL_ID, {
      name: 'Incoming Calls',
      importance: Notifications.AndroidImportance.MAX, // Use MAX for heads-up display
      sound: 'ringtone.wav', // Explicitly set the sound file for the channel
      vibrationPattern: [0, 500, 1000, 500, 1000, 500], // A more distinct call vibration
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
    shouldPlaySound: false, // Make the notification silent
    shouldSetBadge: true,
    shouldShowBanner: true, // For iOS
    shouldShowList: true, // For Android
  }),
});

// 1. Define the shape of our notification data
interface NotificationData {
  type: 'call' | 'cancel_call';
  roomId: string;
  callerName?: string;
}

// 2. Create a Type Guard to safely check if an object is valid NotificationData
function isNotificationData(data: any): data is NotificationData {
  return (
    data &&
    (data.type === 'call' || data.type === 'cancel_call') &&
    typeof data.roomId === 'string'
  );
}

/**
 * This function is called to set up all the global notification listeners for the app.
 * It should be called once in the root layout file.
 */
export function setupGlobalNotificationListeners() {
  // Listener for when a notification is received (app can be foreground or background)
  const receivedSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
    const data = notification.request.content.data;

    if (!isNotificationData(data)) {
      console.warn('[Notifications] Received notification with invalid data:', data);
      return;
    }

    console.log('[Notifications] Received in-app:', data);

    if (data.type === 'cancel_call') {
      // Dismiss the notification UI to stop the ringtone
      const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
      for (const presentedNotification of presentedNotifications) {
        if (isNotificationData(presentedNotification.request.content.data) && presentedNotification.request.content.data.roomId === data.roomId) {
          await Notifications.dismissNotificationAsync(presentedNotification.request.identifier);
          break;
        }
      }
    }
  });

  // Listener for when a user interacts with a notification (taps a button, etc.)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
    const data = response.notification.request.content.data;
    const { actionIdentifier } = response;

    if (!isNotificationData(data)) {
      console.warn('[Notifications] Responded to notification with invalid data:', data);
      return;
    }

    console.log(`[Notifications] User action: ${actionIdentifier} for room ${data.roomId}`);

    if (actionIdentifier === 'accept' || actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      router.push({ pathname: '/ongoing', params: { roomId: data.roomId } });
    } else if (actionIdentifier === 'decline') {
      try {
        await rejectCall(data.roomId);
        console.log(`Successfully rejected call for room ${data.roomId}`);
      } catch (error) {
        console.error('Failed to reject call via API:', error);
      }
    }
  });

  // Return a cleanup function to unsubscribe from the listeners
  return () => {
    Notifications.removeNotificationSubscription(receivedSubscription);
    Notifications.removeNotificationSubscription(responseSubscription);
  };
}
