import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { login, savePushToken } from '../lib/api';
import { registerForPushNotificationsAsync } from '../lib/notifications';

const LoginScreen = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const { email, password } = formData;

        if (!email.trim()) {
            alert('Please enter your email address');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return false;
        }

        if (!password) {
            alert('Please enter your password');
            return false;
        }

        return true;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const res = await login(formData.email, formData.password);
            if (res.success) {
                await AsyncStorage.setItem('token', res.token);
                await AsyncStorage.setItem('user', JSON.stringify(res.user));

                // --- Register for Push Notifications ---
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken) {
                    try {
                        await savePushToken(res.user.id, pushToken);
                        console.log('Push token saved successfully.');
                    } catch (tokenError) {
                        console.error('Failed to save push token:', tokenError);
                        // Non-critical error, so we don't block the user
                        Alert.alert('Warning', 'Could not register for notifications. You may not receive call alerts.');
                    }
                }

                router.replace('/(tabs)/profile');
            } else {
                Alert.alert('Login Failed', res.message || 'Invalid credentials');
            }
        } catch (err) {
            Alert.alert('Login Failed', 'Network or server error');
        } finally {
            setLoading(false);
        }
    };


    const navigateToRegister = () => {
        router.push('/register');
    };

    const handleForgotPassword = () => {
        // Navigate to forgot password screen or show modal
        alert('Forgot password functionality to be implemented');
    };
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#018a91" />
            <View className="flex-1 bg-primary">
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4 pt-12">
                    <TouchableOpacity onPress={() => router.back()} className="p-2">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                        <View className="flex-1">
                            <View className="px-8 mb-8">
                                <Text className="text-3xl font-bold text-white mb-2">
                                    Welcome Back
                                </Text>
                                <Text className="text-white text-base">
                                    Sign in to your account
                                </Text>
                            </View>

                            <View className="bg-white rounded-t-3xl flex-1 px-8 py-8">
                                {/* Email Input */}
                                <View className="mb-6">
                                    <Text className="text-secondary mb-2 font-medium">
                                        Email Address
                                    </Text>
                                    <TextInput
                                        className="bg-gray-100 px-4 py-4 rounded-2xl text-gray-800 text-base"
                                        placeholder="Enter your email"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.email}
                                        onChangeText={(value) => handleInputChange('email', value)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                {/* Password Input */}
                                <View className="mb-4">
                                    <Text className="text-secondary mb-2 font-medium">
                                        Password
                                    </Text>
                                    <View className="bg-gray-100 rounded-2xl flex-row items-center px-4">
                                        <TextInput
                                            className="flex-1 py-4 text-gray-800 text-base"
                                            placeholder="Enter your password"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.password}
                                            onChangeText={(value) => handleInputChange('password', value)}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            className="p-2"
                                        >
                                            <Ionicons
                                                name={showPassword ? "eye-off" : "eye"}
                                                size={20}
                                                color="#666"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Remember Me & Forgot Password */}
                                <View className="flex-row justify-between items-center mb-8">


                                    <TouchableOpacity onPress={handleForgotPassword}>
                                        <Text className="text-primary font-medium text-sm">
                                            Forgot Password?
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Login Button */}
                                <TouchableOpacity
                                    className={`py-4 rounded-2xl mb-6 ${
                                        !loading && formData.email && formData.password
                                            ? 'bg-secondary'
                                            : 'bg-gray-400'
                                    }`}
                                    onPress={handleLogin}
                                    disabled={loading || !formData.email || !formData.password}
                                >
                                    <Text className="text-white text-center font-semibold text-lg">
                                        {loading ? 'Signing In...' : 'Sign In'}
                                    </Text>
                                </TouchableOpacity>



                                {/* Register Link */}
                                <View className="flex-row justify-center items-center mb-4">
                                    <Text className="text-gray-600 text-base">
                                        Don't have an account?{' '}
                                    </Text>
                                    <TouchableOpacity onPress={navigateToRegister}>
                                        <Text className="text-primary font-semibold text-base">
                                            Sign Up
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="mt-auto">
                                        {/* Divider */}
                                        <View className="flex-row items-center mb-6 ">
                                            <View className="flex-1 h-px bg-gray-300" />

                                        </View>
                                        {/* Terms and Conditions */}
                                        <Text className="text-gray-500 text-sm text-center leading-5">
                                            By signing in, you agree to our{' '}
                                            <Text className="text-primary">Terms of Service</Text> and{' '}
                                            <Text className="text-primary">Privacy Policy</Text>.
                                        </Text>
                                </View>

                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </>
    );
};

export default LoginScreen;