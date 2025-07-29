import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useWebRTCContext } from '../lib/WebRTCContext';

interface Params {
    name?: string;
    avatar?: string;
}

export default function IncomingCall() {
    const router = useRouter();
    const { peerJoined, rejectCall } = useWebRTCContext();

    const [callerName, setCallerName] = useState('Caller');
    const sound = useRef<Audio.Sound | null>(null);
    
    // Animation values
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const playRingtone = async () => {
            try {
                const { sound: ringtone } = await Audio.Sound.createAsync(
                    require('../assets/ringtone.mp3'),
                    { shouldPlay: true, isLooping: true }
                );
                sound.current = ringtone;
            } catch (error) {
                console.log('Error playing ringtone:', error);
            }
        };

        // Start pulse animation
        const startPulseAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(pulseAnim, {
                            toValue: 1.2,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacityAnim, {
                            toValue: 0.1,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacityAnim, {
                            toValue: 0.3,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            ).start();
        };

        playRingtone();
        startPulseAnimation();

        const timeout = setTimeout(() => {
            handleReject();
        }, 30000); // 30-second timeout

        return () => {
            clearTimeout(timeout);
            if (sound.current) {
                sound.current.stopAsync();
                sound.current.unloadAsync();
            }
        };
    }, []);

    useEffect(() => {
        // If the peer leaves (peerJoined becomes false), go back to home.
        // This also handles the case where the call is rejected by the other party.
        if (!peerJoined) {
            if (sound.current) {
                sound.current.stopAsync();
            }
            router.replace('/(tabs)/home');
        }
    }, [peerJoined, router]);

    const handleReject = () => {
        if (sound.current) {
            sound.current.stopAsync();
        }
        rejectCall(); // Notify the other peer
        router.replace('/(tabs)/home');
    };

    const handleAccept = () => {
        if (sound.current) {
            sound.current.stopAsync();
        }
        router.replace('/ongoing'); // Go to ongoing screen to connect
    };

    return (
        <View className="flex-1 items-center justify-center bg-black">
            <View className="relative mb-8">
                {/* Halo effect - outer glow with animation */}
                <Animated.View 
                    className="absolute w-44 h-44 rounded-full"
                    style={{
                        backgroundColor: '#667eea',
                        opacity: opacityAnim,
                        top: -8,
                        left: -8,
                        transform: [{ scale: pulseAnim }],
                        shadowColor: '#667eea',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 20,
                        elevation: 20,
                    }}
                />
                {/* Inner black placeholder circle */}
                <View
                    className="w-40 h-40 rounded-full"
                    style={{
                        backgroundColor: '#000000',
                        borderWidth: 4,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                />
            </View>
            <Text className="text-white text-2xl font-semibold mb-1">Incoming Call</Text>
            <Text className="text-primary text-xl font-semibold mb-12">{callerName}</Text>

            <View className="flex-row space-x-4 mt-4">
                <TouchableOpacity
                    className="flex-1 rounded-full bg-red-700 items-center justify-center py-3 px-10 mx-10"
                    onPress={handleReject}
                >
                    <Ionicons name="call-outline" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 rounded-full bg-green-700 items-center justify-center py-3 px-10 mx-10"
                    onPress={handleAccept}
                >
                    <Ionicons name="call-outline" size={28} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
