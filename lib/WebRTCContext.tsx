import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import useWebRTC from './useWebRTC';
import { router, usePathname } from 'expo-router';
import { FIXED_ROOM_ID } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Since useWebRTC is a JS file, we define the return type here
export interface UseWebRTCReturn {
  joinRoom: (id: string) => void;
  hangupCall: () => void;
  isConnected: boolean;
  joinedRoom: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  rejectCall: () => void;
  makeCall: () => Promise<void>;
  acceptCall: () => Promise<void>;
  lastOffer: any; // RTCSessionDescriptionInit from react-native-webrtc
  callDuration: number;
}

/** Shape of the context value */
interface Ctx extends UseWebRTCReturn {
  joinFixedRoom: () => void;
  peerJoined: boolean;
}

const WebRTCContext = createContext<Ctx | null>(null);

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const webrtc = useWebRTC({
    onPeerJoined: useCallback((peerId: string) => {
      console.log('[Context] Peer joined:', peerId);
      setPeerJoined(true);
    }, []),
    onLeave: useCallback(async () => {
      console.log('[Context] Left room');
      setPeerJoined(false);

      // Update stats when call ends
      const duration = callDurationRef.current;
      if (duration > 0) {
        try {
          const statsStr = await AsyncStorage.getItem('userStats');
          let currentStats: any = JSON.parse(statsStr || '{}');

          const newTotalCalls = (currentStats.totalCalls || 0) + 1;
          const newTotalDuration = (currentStats.totalCallDurationSeconds || 0) + duration;
          const newAvgSeconds = newTotalCalls > 0 ? newTotalDuration / newTotalCalls : 0;

          const formatAvgDuration = (seconds: number) => {
            if (isNaN(seconds) || seconds === 0) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.round(seconds % 60).toString().padStart(2, '0');
            return `${mins}:${secs}`;
          };

          const updatedStats = {
            ...currentStats,
            totalCalls: newTotalCalls,
            callsToday: (currentStats.callsToday || 0) + 1,
            lastCallTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            totalCallDurationSeconds: newTotalDuration,
            avgCallDuration: formatAvgDuration(newAvgSeconds)
          };

          await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
        } catch (error) {
          console.error('Failed to update call stats onLeave:', error);
        }
      }

      if (router) {
        router.navigate('/(tabs)/home');
      }
    }, [router]),
    onCallRejected: useCallback(() => {
      console.log('[Context] Call rejected');
      setPeerJoined(false);
      if (pathname === '/incoming' || pathname === '/ongoing') {
        router.navigate('/(tabs)/home');
      }
    }, [pathname, router]),
    onRoomFull: () => {},
    onJoined: () => {},
    onIncoming: () => {},
  });
  const [peerJoined, setPeerJoined] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const callDurationRef = React.useRef(callDuration);

  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (webrtc.remoteStream) {
      // Start timer when a peer is connected
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000) as unknown as NodeJS.Timeout;
    } else {
      // Reset duration if call ends or was never started
      setCallDuration(0);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [webrtc.remoteStream]);

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

  const joinRoom = useCallback((roomId: string) => {
    if (webrtc.isConnected) {
      webrtc.joinRoom(roomId);
    }
  }, [webrtc.isConnected, webrtc.joinRoom]);

  /** Join the single hard‑coded room once the socket is connected */
  const joinFixedRoom = () => {
    if (webrtc.isConnected && userId) {
      joinRoom(FIXED_ROOM_ID(userId));
    }
  };

  const value: Ctx = { ...webrtc, joinRoom, joinFixedRoom, peerJoined, callDuration };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

/** Convenience hook */
export const useWebRTCContext = () => {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error("Wrap your tree with <WebRTCProvider>");
  return ctx;
};
