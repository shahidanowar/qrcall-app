import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

interface CarDetails {
    make: string;
    model: string;
    year: string;
    color: string;
    licensePlate: string;
    qrPlacement: string;
    lastUsed: string;
    isActive: boolean;
    images: string[];
}

const history = () => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [carDetails, setCarDetails] = useState<CarDetails | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [color, setColor] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [qrPlacement, setQrPlacement] = useState('Dashboard');
    const [images, setImages] = useState<string[]>([]);
    const [isImageViewerVisible, setImageViewerVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const qrPlacements = ['Windshield', 'Rear Window', 'Hood', 'Door', 'Decklid'];

    // Load car details from AsyncStorage
    useEffect(() => {
        loadCarDetails();
    }, []);

    const loadCarDetails = async () => {
        try {
            const savedCarDetails = await AsyncStorage.getItem('carDetails');
            if (savedCarDetails) {
                const car = JSON.parse(savedCarDetails);
                setCarDetails(car);
                // Populate form fields
                setMake(car.make);
                setModel(car.model);
                setYear(car.year);
                setColor(car.color);
                setLicensePlate(car.licensePlate);
                setQrPlacement(car.qrPlacement);
                setImages(car.images || []);
            }
        } catch (error) {
            console.error('Error loading car details:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveCarDetails = async () => {
        if (!make.trim() || !model.trim() || !year.trim() || !licensePlate.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            const newCarDetails: CarDetails = {
                make: make.trim(),
                model: model.trim(),
                year: year.trim(),
                color: color.trim(),
                licensePlate: licensePlate.trim().toUpperCase(),
                qrPlacement,
                lastUsed: carDetails?.lastUsed || 'Never',
                isActive: true,
                images: images
            };

            await AsyncStorage.setItem('carDetails', JSON.stringify(newCarDetails));
            setCarDetails(newCarDetails);
            setShowEditModal(false);
            Alert.alert('Success', 'Car details saved successfully!');
        } catch (error) {
            console.error('Error saving car details:', error);
            Alert.alert('Error', 'Failed to save car details');
        }
    };

    const deleteCarDetails = async () => {
        Alert.alert(
            'Delete Car Details',
            'Are you sure you want to delete all car details? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('carDetails');
                            setCarDetails(null);
                            // Reset form fields
                            setMake('');
                            setModel('');
                            setYear('');
                            setColor('');
                            setLicensePlate('');
                            setQrPlacement('Dashboard');
                            setImages([]);
                            Alert.alert('Success', 'Car details deleted successfully!');
                        } catch (error) {
                            console.error('Error deleting car details:', error);
                            Alert.alert('Error', 'Failed to delete car details');
                        }
                    }
                }
            ]
        );
    };

    const pickImage = async () => {
        if (images.length >= 3) {
            Alert.alert('Maximum images reached', 'You can only add up to 3 images.');
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const openImageViewer = (uri: string) => {
        setSelectedImage(uri);
        setImageViewerVisible(true);
    };

    const closeImageViewer = () => {
        setImageViewerVisible(false);
        setSelectedImage(null);
    };

    const openEditModal = (car: CarDetails | null) => {
        if (car) {
            setMake(car.make);
            setModel(car.model);
            setYear(car.year);
            setColor(car.color || '');
            setLicensePlate(car.licensePlate);
            setQrPlacement(car.qrPlacement);
            setImages(car.images || []);
        } else {
            // Reset fields for new entry
            setMake('');
            setModel('');
            setYear('');
            setColor('');
            setLicensePlate('');
            setQrPlacement('Dashboard');
            setImages([]);
        }
        setShowEditModal(true);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-[#d5e0e0] items-center justify-center">
                <Text className="text-gray-600 text-lg">Loading...</Text>
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="dark-content" />
            <View className="flex-1 bg-[#d5e0e0]">
            

                {carDetails ? (
                    <ScrollView className="flex-1 mb-16 pt-4" showsVerticalScrollIndicator={false}>
                        {/* Car Details Card */}
                        <View className="bg-white rounded-xl p-6 mx-4 mb-4">
                            <View className="flex-row items-center mb-4">
                                <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mr-4">
                                    <Ionicons name="car" size={32} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xl font-bold text-gray-800">
                                         {carDetails.make} {carDetails.model} - {carDetails.year}
                                    </Text>
                                    <Text className="text-gray-500 text-base">{carDetails.licensePlate}</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => deleteCarDetails()}
                                    className="bg-red-100 p-2 rounded-full"
                                >
                                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => openEditModal(carDetails)}
                                    className="bg-teal-600 ml-3 p-2 rounded-full"
                                >
                                    <Ionicons name="pencil" size={20} color="white" />
                                </TouchableOpacity>
                            </View>

                            {carDetails.images && carDetails.images.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
                                    {carDetails.images.map((img, index) => (
                                        <TouchableOpacity key={index} onPress={() => openImageViewer(img)}>
                                            <Image 
                                                source={{ uri: img }}
                                                className="w-24 h-24 rounded-lg mr-2"
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            <View className="border-t border-gray-200 pt-4 mt-4">
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-gray-600">Color:</Text>
                                    <Text className="font-medium text-gray-800">{carDetails.color || 'Not specified'}</Text>
                                </View>
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-gray-600">QR Placement:</Text>
                                    <Text className="font-medium text-gray-800">{carDetails.qrPlacement}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-600">Last Used:</Text>
                                    <Text className="font-medium text-gray-800">{carDetails.lastUsed}</Text>
                                </View>
                            </View>
                        </View>


                    </ScrollView>
                ) : (
                    <View className="flex-1 items-center justify-center px-6">
                        <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-6">
                            <Ionicons name="car-outline" size={48} color="#9ca3af" />
                        </View>
                        <Text className="text-xl font-semibold text-primary mb-2">No Car Details</Text>
                        <Text className="text-gray-500 text-center mb-8">
                            Add your car details to track QR code placement and call history
                        </Text>
                        <TouchableOpacity 
                            onPress={() => openEditModal(null)}
                            className="bg-teal-600 rounded-xl p-4 items-center"
                        >
                            <Text className="text-white font-semibold text-base">Add Car Details</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Edit Car Modal */}
                <Modal
                    visible={showEditModal}
                    transparent={true}
                    animationType="slide"
                >
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
                            <View className="flex-row items-center justify-between mb-6">
                                <Text className="text-xl font-bold text-gray-800">
                                    {carDetails ? 'Edit Car Details' : 'Add Car Details'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                    <Ionicons name="close" size={24} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-gray-700 font-medium mb-2">Make *</Text>
                                        <TextInput
                                            className="bg-gray-100 rounded-xl p-4 text-base"
                                            placeholder=" Toyota, Honda, BMW"
                                            placeholderTextColor="gray"
                                            value={make}
                                            onChangeText={setMake}
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-700 font-medium mb-2">Model *</Text>
                                        <TextInput
                                            className="bg-gray-100 rounded-xl p-4 text-base"
                                            placeholder=" Camry, Civic, X3"
                                            placeholderTextColor="gray"
                                            value={model}
                                            onChangeText={setModel}
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-700 font-medium mb-2">Year *</Text>
                                        <TextInput
                                            className="bg-gray-100 rounded-xl p-4 text-base"
                                            placeholder=" 2020"
                                            placeholderTextColor="gray"
                                            value={year}
                                            onChangeText={setYear}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-700 font-medium mb-2">Color</Text>
                                        <TextInput
                                            className="bg-gray-100 rounded-xl p-4 text-base"
                                            placeholder=" White, Black, Silver"
                                            placeholderTextColor="gray"
                                            value={color}
                                            onChangeText={setColor}
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-700 font-medium mb-2">License Plate *</Text>
                                        <TextInput
                                            className="bg-gray-100 rounded-xl p-4 text-base"
                                            placeholder=" ABC-1234"
                                            placeholderTextColor="gray"
                                            value={licensePlate}
                                            onChangeText={setLicensePlate}
                                            autoCapitalize="characters"
                                        />
                                    </View>

                                    {/* Image Picker */}
                                    <View>
                                        <Text className="text-gray-700 font-medium mb-3">Car Images (Max 3)</Text>
                                        <View className="flex-row flex-wrap items-center">
                                            {images.map((uri, index) => (
                                                <View key={index} className="mr-2 mb-2">
                                                    <TouchableOpacity onPress={() => openImageViewer(uri)}>
                                                        <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => removeImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                                                    >
                                                        <Ionicons name="close" size={14} color="white" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                            {images.length < 3 && (
                                                <TouchableOpacity
                                                    onPress={pickImage}
                                                    className="w-20 h-20 rounded-lg bg-gray-200 items-center justify-center"
                                                >
                                                    <Ionicons name="add" size={32} color="#6b7280" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>

                                    <View>
                                        <Text className="text-gray-700 font-medium mb-3">QR Code Placement:</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View className="flex-row">
                                                {qrPlacements.map((placement) => (
                                                    <TouchableOpacity
                                                        key={placement}
                                                        className={`px-4 py-3 rounded-xl mr-3 ${
                                                            qrPlacement === placement ? 'bg-teal-600' : 'bg-gray-100'
                                                        }`}
                                                        onPress={() => setQrPlacement(placement)}
                                                    >
                                                        <Text className={`font-medium ${
                                                            qrPlacement === placement ? 'text-white' : 'text-gray-700'
                                                        }`}>
                                                            {placement}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={saveCarDetails}
                                    className="bg-teal-600 rounded-xl p-4 items-center mt-6"
                                >
                                    <Text className="text-white font-semibold text-base">
                                        {carDetails ? 'Update Car Details' : 'Save Car Details'}
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isImageViewerVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={closeImageViewer}
                >
                    <View className="flex-1 justify-center items-center bg-black/80">
                        <TouchableOpacity
                            className="absolute top-12 right-5 z-10 bg-gray-600/50 rounded-full p-1"
                            onPress={closeImageViewer}
                        >
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                className="w-full h-1/2"
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </Modal>
            </View>
        </>
    );
};

export default history;