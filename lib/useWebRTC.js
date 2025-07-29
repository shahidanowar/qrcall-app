import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import io from 'socket.io-client';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';

const SERVER_URL = 'https://visionai.site';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

export default function useWebRTC({ onRoomFull, onJoined, onLeave, onCallRejected, onIncoming, onPeerJoined }) {
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [localStream, setLocalStream] = useState(/** @type {MediaStream | null} */(null));
  const [remoteStream, setRemoteStream] = useState(/** @type {MediaStream | null} */(null));
  const [lastOffer, setLastOffer] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const peerIdRef = useRef(null);
  const queuedIceCandidates = useRef([]);

  // Get local media stream
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (isMounted) setLocalStream(stream);
      } catch (err) {
        Alert.alert('Media Error', 'Could not access camera/microphone.');
      }
    })();
    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup signaling
  useEffect(() => {
    if (!socketRef.current) {
      // Use both polling and websocket so the client can connect in restrictive networks
      socketRef.current = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        forceNew: true,            // create dedicated connection instance
        timeout: 10000,            // 10-second connection timeout
      });

      socketRef.current.io.on('error', (err) => {
        console.warn(`[Socket] connection error: ${err.message}`, { type: err.type, description: err.description });
      });

      socketRef.current.on('connect', () => setIsConnected(true));
      socketRef.current.on('disconnect', () => setIsConnected(false));
      socketRef.current.on('joined-room', (id) => {
        setJoinedRoom(true);
        setRoomId(id);
        if (onJoined) onJoined(id);
        console.log('[Socket] joined-room', id);
        // Only set up peer connection and wait for offer; do NOT create offer here.
      });
      socketRef.current.on('room-full', () => {
        setJoinedRoom(false);
        if (onRoomFull) onRoomFull();
      });
      socketRef.current.on('peer-joined', (pid) => {
        console.log('[Socket] peer-joined', pid);
        peerIdRef.current = pid;
        if (onPeerJoined) onPeerJoined(pid);
        // DO NOT create peer connection here. Wait for user to accept.
      });
      socketRef.current.on('peer-left', (peerId) => {
        console.log('[Socket] peer-left', peerId);
        if (peerIdRef.current === peerId) {
          console.log('[WebRTC] Peer left, closing connection');
          onLeave();
          closePeerConnection();
        }
      });
      socketRef.current.on('call-rejected', () => {
        if (onCallRejected) onCallRejected();
        setRemoteStream(null);
        closePeerConnection();
        if (onLeave) onLeave();
      });

      socketRef.current.on('signal', async ({ from, data }) => {
        console.log('[Socket] signal', { from, data });
        if (data.sdp) {
          console.log('[WebRTC] Received SDP', data.sdp.type);
          if (data.sdp.type === 'offer') {
            setLastOffer(data.sdp);
          }
          await handleRemoteSDP(data.sdp);
        } else if (data.candidate) {
          console.log('[WebRTC] Received ICE candidate');
          await handleRemoteICE(data.candidate);
        }
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]);

  const closePeerConnection = useCallback(() => {
    console.log('[WebRTC] Closing peer connection');
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    peerIdRef.current = null; // Reset peer ID
    setRemoteStream(null); // Reset remote stream
  }, []);

  // Peer connection helpers
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('[WebRTC] Sending ICE candidate');
        socketRef.current.emit('signal', { to: peerIdRef.current, data: { candidate: event.candidate } });
      }
    };
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        console.log('[WebRTC] Received remote track');
      }
    };
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
    };
    return pc;
  }, [localStream]);

  const handleRemoteICE = useCallback(async (candidate) => {
    if (pcRef.current && pcRef.current.remoteDescription) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC] Failed to add ICE candidate', err);
      }
    } else {
      // Queue candidate if remote description is not set yet
      queuedIceCandidates.current.push(candidate);
    }
  }, []);

  const processQueuedIceCandidates = useCallback(async () => {
    while (queuedIceCandidates.current.length > 0) {
      const candidate = queuedIceCandidates.current.shift();
      await handleRemoteICE(candidate);
    }
  }, [handleRemoteICE]);

  const handleRemoteSDP = useCallback(async (sdp) => {
    if (!pcRef.current) {
      createPeerConnection();
    }
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    await processQueuedIceCandidates(); // Process any queued candidates

    if (sdp.type === 'offer') {
      if (onIncoming) onIncoming();
    }
  }, [createPeerConnection, onIncoming, processQueuedIceCandidates]);

  const joinRoom = useCallback((id) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', id);
      setRoomId(id);
    }
  }, []);

  const hangupCall = useCallback(() => {
    console.log('[WebRTC] Hanging up call in room', roomId);
    if (socketRef.current && roomId) {
      // Emit 'hangup-call' to notify the other peer, but stay in the room.
      socketRef.current.emit('hangup-call', roomId);
    }
    // Manually trigger cleanup since we won't get a 'peer-left' for ourselves
    if (onLeave) onLeave();
    closePeerConnection();
  }, [roomId, onLeave, closePeerConnection]);

  const acceptCall = useCallback(async () => {
    console.log('[WebRTC] Accepting call');
    if (!pcRef.current || !peerIdRef.current) {
      console.error('[WebRTC] Cannot accept call, no peer connection or peer ID.');
      return;
    }
    try {
      // The offer is already set by handleRemoteSDP, so we just create the answer.
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socketRef.current.emit('signal', { to: peerIdRef.current, data: { sdp: answer } });
      setLastOffer(null); // Clear the offer once it's been handled
    } catch (error) {
      console.error('[WebRTC] Error creating answer:', error);
    }
  }, [pcRef, peerIdRef, socketRef, setLastOffer]);

  const rejectCall = useCallback(() => {
    socketRef.current.emit('reject-call', roomId);
    closePeerConnection();
    if (onLeave) onLeave();
  }, [roomId, closePeerConnection, onLeave]);

  const makeCall = useCallback(async () => {
    console.log('[WebRTC] Making offer');
    if (!peerIdRef.current) {
      console.warn('[WebRTC] No peer to call.');
      return;
    }
    if (!pcRef.current) {
      createPeerConnection();
    }
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socketRef.current.emit('signal', { to: peerIdRef.current, data: { sdp: offer } });
  }, [createPeerConnection]);

  return {
    isConnected,
    joinedRoom,
    joinRoom,
    hangupCall,
    localStream,
    remoteStream,
    rejectCall,
    makeCall,
    acceptCall,
    lastOffer,
  };
}
