import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../../lib/api';
import {
    ScrollView,
    StatusBar,
    Text,
    View,
    Image,
    ActivityIndicator,
} from 'react-native';

interface UserStats {
    totalCalls: number;
    callsToday: number;
    avgCallDuration: string;
    lastCallTime: string;
    totalCallDurationSeconds: number;
}

const Profile = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userStats, setUserStats] = useState<UserStats>({
        totalCalls: 0,
        callsToday: 0,
        avgCallDuration: '0:00',
        lastCallTime: 'Never',
        totalCallDurationSeconds: 0
    });


    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const res = await getProfile(user.id);
                    if (res.success) {
                        setProfile(res.user);
                    } else {
                        setError(res.message || 'Profile not found');
                    }
                    
                    // Load user stats from AsyncStorage
                    await loadUserStats();
                } else {
                    setError('User not logged in');
                }
            } catch (err) {
                setError('Failed to fetch profile');
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const loadUserStats = async () => {
        try {
            const statsStr = await AsyncStorage.getItem('userStats');
            if (statsStr) {
                setUserStats(JSON.parse(statsStr));
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    };





    if (loading) {
        return (
            <View className="flex-1 bg-[#d5e0e0] items-center justify-center">
                <ActivityIndicator size="large" color="#018a91" />
                <Text className="text-gray-600 mt-4">Loading profile...</Text>
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="dark-content" />
            <View className="flex-1 bg-[#d5e0e0]">
                

                <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false}>
                    {error ? (
                        <View className="bg-white rounded-xl p-6 mx-4 items-center">
                            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                            <Text className="text-red-500 mt-4 text-center">{error}</Text>
                        </View>
                    ) : profile ? (
                        <>
                            {/* Profile Card */}
                            <View className="bg-white rounded-xl p-6 mx-4 mb-4 items-center">
                                {profile.avatar ? (
                                    <Image 
                                        source={{ uri: profile.avatar }} 
                                        className="w-24 h-24 rounded-full mb-4" 
                                    />
                                ) : (
                                    <View className="w-24 h-24 bg-teal-100 rounded-full items-center justify-center mb-4">
                                        <Ionicons name="person" size={48} color="#0d9488" />
                                    </View>
                                )}
                                <Text className="text-2xl font-bold text-primary mb-1">{profile.name}</Text>
                                <Text className="text-gray-500 text-base mb-2">{profile.email}</Text>
                                <Text className="text-gray-400 text-sm mt-1">Joined: {new Date(profile.created_at).toLocaleDateString()}</Text>
                            </View>

                            {/* Stats Card */}
                            <View className="bg-white rounded-xl p-6 mx-4 mb-4">
                                <Text className="text-lg font-semibold text-primary mb-4">Call Statistics</Text>
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-gray-600">Total Calls:</Text>
                                    <Text className="font-semibold text-primary">{userStats.totalCalls}</Text>
                                </View>
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-gray-600">Calls Today:</Text>
                                    <Text className="font-semibold text-primary">{userStats.callsToday}</Text>
                                </View>
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-gray-600">Avg Duration:</Text>
                                    <Text className="font-semibold text-primary">{userStats.avgCallDuration}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-600">Last Call:</Text>
                                    <Text className="font-semibold text-primary">{userStats.lastCallTime}</Text>
                                </View>
                            </View>




                        </>
                    ) : (
                        <View className="bg-white rounded-xl p-6 mx-4 items-center">
                            <Ionicons name="person-outline" size={48} color="#9ca3af" />
                            <Text className="text-gray-500 mt-4">Profile not found</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </>
    );
};

export default Profile;
