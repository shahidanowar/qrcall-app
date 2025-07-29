import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../lib/api';

const RegisterScreen = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const { fullName, email, password, confirmPassword } = formData;

        if (!fullName.trim()) {
            alert('Please enter your full name');
            return false;
        }

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
            alert('Please enter a password');
            return false;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return false;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const res = await register(formData.fullName, formData.email, formData.password);
            setLoading(false);
            if (res.success) {
                Alert.alert('Registration successful!');
                router.replace('/login');
            } else {
                Alert.alert('Registration failed', res.message || 'Could not register');
            }
        } catch (err) {
            setLoading(false);
            Alert.alert('Registration failed', 'Network or server error');
        }
    };

    const navigateToLogin = () => {
        router.push('/login');
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
                                    Create Account
                                </Text>
                                <Text className="text-white text-base">
                                    Sign up to get started
                                </Text>
                            </View>

                            <View className="bg-white rounded-t-3xl flex-1 px-8 py-8">
                                {/* Full Name Input */}
                                <View className="mb-6">
                                    <Text className="text-secondary mb-2 font-medium">
                                        Full Name
                                    </Text>
                                    <TextInput
                                        className="bg-gray-100 px-4 py-4 rounded-2xl text-gray-800 text-base"
                                        placeholder="Enter your full name"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.fullName}
                                        onChangeText={(value) => handleInputChange('fullName', value)}
                                        autoCapitalize="words"
                                    />
                                </View>

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
                                <View className="mb-6">
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

                                {/* Confirm Password Input */}
                                <View className="mb-6">
                                    <Text className="text-secondary mb-2 font-medium">
                                        Confirm Password
                                    </Text>
                                    <View className="bg-gray-100 rounded-2xl flex-row items-center px-4">
                                        <TextInput
                                            className="flex-1 py-4 text-gray-800 text-base"
                                            placeholder="Confirm your password"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.confirmPassword}
                                            onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                            secureTextEntry={!showConfirmPassword}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="p-2"
                                        >
                                            <Ionicons
                                                name={showConfirmPassword ? "eye-off" : "eye"}
                                                size={20}
                                                color="#666"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Register Button */}
                                <TouchableOpacity
                                    className={`py-4 rounded-2xl mb-6 ${
                                        !loading && formData.fullName && formData.email && formData.password && formData.confirmPassword
                                            ? 'bg-secondary'
                                            : 'bg-gray-400'
                                    }`}
                                    onPress={handleRegister}
                                    disabled={loading || !formData.fullName || !formData.email || !formData.password || !formData.confirmPassword}
                                >
                                    <Text className="text-white text-center font-semibold text-lg">
                                        {loading ? 'Creating Account...' : 'Create Account'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Login Link */}
                                <View className="flex-row justify-center items-center mb-8">
                                    <Text className="text-gray-600 text-base">
                                        Already have an account?{' '}
                                    </Text>
                                    <TouchableOpacity onPress={navigateToLogin}>
                                        <Text className="text-primary font-semibold text-base">
                                            Sign In
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="mt-auto">
                                        <View className="flex-row items-center mb-6 ">
                                            <View className="flex-1 h-px bg-gray-300" />

                                        </View>
                                        {/* Terms and Conditions */}
                                        <Text className="text-gray-500 text-sm text-center leading-5">
                                            By creating an account, you agree to our{' '}
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

export default RegisterScreen;