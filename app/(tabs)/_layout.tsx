import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
    const router = useRouter();

    // LOG OUT
    const handleLogout = async () => {
        try {
            // remove all stored auth-related keys and user data
            await AsyncStorage.multiRemove(['token', 'user', 'authToken', 'userStats', 'qrGenerated']);
            router.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error logging out');
        }
    };


    const HeaderRight = () => (
        <TouchableOpacity onPress={handleLogout} className="mr-4">
            <View className="flex-row items-center">
                <Ionicons name="log-out-outline" size={20} color="#018a91" className="mr-2" />
                <Text className="text-[#018a91] font-semibold text-sm">Logout</Text>
            </View>
        </TouchableOpacity>
    );


    const HeaderBackground = () => (
        <View className="flex-1 bg-white" />
    );



    const getScreenOptions = (title: string, showLogo = false) => ({
        title,
        headerTitleAlign: 'left' as const,
        headerTintColor: '#018a91',
        headerRight: HeaderRight,
        headerBackground: HeaderBackground,
        headerTitle: showLogo ? () => (
            <View className="flex-row items-center">
                <Image
                    source={require('../../assets/images/logo.png')}
                    className="w-6 h-6 mb-4 mt-4 rounded-lg"
                    contentFit="contain"
                />

                <Text className="text-[#018a91] font-semibold text-lg">{title}</Text>
            </View>
        ) : undefined,
        headerTitleStyle: !showLogo ? {
            fontWeight: '600' as const,
            fontSize: 18,
            color: '#018a91',
        } : undefined,
        headerShadowVisible: false,
    });

    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: '#018a91',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderTopWidth: 0,
                    height: 65,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 15,
                    shadowColor: '#018a91',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                    marginBottom: 8,
                },
                tabBarIconStyle: {
                    marginTop: 8,
                },
                tabBarIcon: ({ color, size, focused }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'history') {
                        iconName = focused ? 'car' : 'car-outline';
                    } else if (route.name === 'profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tabs.Screen
                name="home"
                options={getScreenOptions(' Home', true)}
            />

            <Tabs.Screen
                name="history"
                options={getScreenOptions(' Car Details', true)}
            />

            <Tabs.Screen
                name="profile"
                options={getScreenOptions(' Profile', true)}
            />

        </Tabs>
    );
}