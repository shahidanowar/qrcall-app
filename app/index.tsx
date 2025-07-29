import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const [initialRoute, setInitialRoute] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                setInitialRoute('/(tabs)/home');
            } else {
                setInitialRoute('/landing');
            }
        })();
    }, []);

    if (initialRoute === null) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#018a91" />
            </View>
        );
    }

    return <Redirect href={initialRoute} />;
}
