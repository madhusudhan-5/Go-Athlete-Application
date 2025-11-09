import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import vendorApi, { Court } from '../../services/vendorApi.ts';

export default function CourtManagement() {
    const { data: courts, isLoading, refetch } = useQuery({
        queryKey: ['courts'],
        queryFn: () => vendorApi.getCourts()
    });

    const getStatusColor = (status: Court['status']) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <ScrollView 
            className="flex-1 bg-gray-50"
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
        >
            <View className="p-4 bg-white border-b border-gray-200">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-xl font-bold text-gray-900">Courts</Text>
                        <Text className="text-sm text-gray-600">Manage your courts and schedules</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('../court-registration')}
                        className="bg-indigo-600 px-4 py-2 rounded-lg flex-row items-center"
                    >
                        <MaterialIcons name="add" size={20} color="white" />
                        <Text className="text-white font-medium ml-1">Add Court</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="p-4">
                {courts?.map((court) => (
                    <TouchableOpacity
                        key={court.id}
                        onPress={() => router.push({
                            pathname: '../court-management/[id]',
                            params: { id: court.id }
                        })}
                        className="bg-white rounded-lg shadow-sm p-4 mb-4"
                    >
                        <View className="flex-row justify-between items-start mb-2">
                            <View>
                                <Text className="text-lg font-semibold text-gray-900">{court.name}</Text>
                                <Text className="text-sm text-gray-600">{court.type}</Text>
                            </View>
                            <View className={`px-2 py-1 rounded-full ${getStatusColor(court.status)}`}>
                                <Text className="text-xs font-medium capitalize">{court.status}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center mt-2">
                            <MaterialIcons name="payments" size={16} color="#4B5563" />
                            <Text className="text-gray-600 text-sm ml-1">
                                ₹{court.hourlyRate}/hour
                            </Text>
                        </View>

                        <View className="border-t border-gray-100 mt-3 pt-3">
                            <Text className="text-xs text-gray-500 mb-1">Available Slots</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {court.slots.slice(0, 3).map((slot, index) => (
                                    <Text key={index} className="text-xs text-gray-600">
                                        {slot.day} ({slot.startTime}-{slot.endTime})
                                    </Text>
                                ))}
                                {court.slots.length > 3 && (
                                    <Text className="text-xs text-indigo-600">
                                        +{court.slots.length - 3} more
                                    </Text>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                {!isLoading && (!courts || courts.length === 0) && (
                    <View className="py-8 items-center">
                        <MaterialIcons name="sports-tennis" size={48} color="#9CA3AF" />
                        <Text className="text-gray-500 mt-2">No courts added yet</Text>
                        <TouchableOpacity
                            onPress={() => router.push('../court-registration')}
                            className="mt-4 bg-indigo-600 px-4 py-2 rounded-lg"
                        >
                            <Text className="text-white font-medium">Add Your First Court</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}