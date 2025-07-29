import React from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Redirect } from 'expo-router';

const WelcomeScreen = () => {
    const router = useRouter();

    return (
        <>
            <StatusBar barStyle="dark-content" />

            <View className="flex-1 bg-white">
                {/* Header Section */}
                <View className="px-8 py-12 items-center">
                    <Image
                        source={require('../assets/images/logo.png')}
                        className="w-40 h-40 mb-4 mt-4 border-2 border-primary rounded-lg"

                    />
                    <Text className="text-secondary text-center tracking-widest text-lg font-bold">
                        Get Your QR Now
                    </Text>
                </View>

                {/* Body Section */}
                <View className="flex-1 bg-primary rounded-t-3xl px-8 pt-12">
                    <View className="mb-12">
                        <Text className="text-3xl font-bold text-white mb-4">
                            Welcome
                        </Text>
                        <Text className="text-white text-base leading-6">
                            <Text className="font-bold">Ringr</Text> is a smart calling app that lets others call you by simply scanning your QR code, keeping your personal number private while ensuring fast, secure, and seamless communication.

                        </Text>
                    </View>

                    <View className="space-y-4">
                        <TouchableOpacity
                            className="bg-primary py-4 rounded-2xl active:scale-95 border-white border-2 shadow-lg shadow-amber-50 android:elevation-8"
                            onPress={() => router.push('/register')}
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                Sign Up
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-secondary  py-4 rounded-2xl active:scale-95 mt-4 shadow-lg shadow-amber-50 android:elevation-8"
                            onPress={() => router.push('/login')}
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                Log In
                            </Text>
                        </TouchableOpacity>


                    </View>
                </View>
            </View>
        </>
    );
};

export default WelcomeScreen;

