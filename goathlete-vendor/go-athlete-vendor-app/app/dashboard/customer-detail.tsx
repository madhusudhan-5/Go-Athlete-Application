import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import vendorApi from '../../services/vendorApi';

export default function CustomerDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    // Get all bookings for this customer
    const { data: bookings, isLoading } = useQuery({
        queryKey: ['bookings', id],
        queryFn: () => vendorApi.getBookings()
    });

    const customerBookings = React.useMemo(() => {
        if (!bookings) return [];
        return bookings.filter((booking: any) => {
            const customerId = booking.customerId || booking.customerEmail || booking.customerName;
            return customerId === id;
        });
    }, [bookings, id]);

    const customer = React.useMemo(() => {
        if (customerBookings.length === 0) return null;
        const firstBooking = customerBookings[0];
        return {
            name: firstBooking.customerName,
            email: firstBooking.customerEmail || '',
            phone: firstBooking.customerPhone
        };
    }, [customerBookings]);

    const totalSpent = customerBookings.reduce((sum: number, booking: any) => sum + (booking.amount || 0), 0);
    const totalBookings = customerBookings.length;

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <Text className="text-gray-600">Loading customer details...</Text>
            </View>
        );
    }

    if (!customer) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                <Text className="text-gray-600 mt-4">Customer not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-indigo-600 px-4 py-2 rounded-lg">
                    <Text className="text-white">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200 p-4">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-xl font-bold text-gray-900">{customer.name}</Text>
                        <Text className="text-sm text-gray-600">{customer.email}</Text>
                    </View>
                </View>
            </View>

            {/* Stats */}
            <View className="bg-white mt-4 p-4">
                <View className="flex-row justify-between">
                    <View className="flex-1 items-center">
                        <Text className="text-2xl font-bold text-gray-900">{totalBookings}</Text>
                        <Text className="text-sm text-gray-600">Total Bookings</Text>
                    </View>
                    <View className="flex-1 items-center border-l border-gray-200">
                        <Text className="text-2xl font-bold text-indigo-600">₹{totalSpent.toFixed(0)}</Text>
                        <Text className="text-sm text-gray-600">Total Spent</Text>
                    </View>
                </View>
            </View>

            {/* Contact Info */}
            <View className="bg-white mt-4 p-4">
                <Text className="text-lg font-semibold mb-4">Contact Information</Text>
                <View className="space-y-3">
                    <View className="flex-row items-center">
                        <MaterialIcons name="email" size={20} color="#4B5563" />
                        <Text className="text-gray-700 ml-2">{customer.email}</Text>
                    </View>
                    {customer.phone && (
                        <View className="flex-row items-center">
                            <MaterialIcons name="phone" size={20} color="#4B5563" />
                            <Text className="text-gray-700 ml-2">{customer.phone}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Booking History */}
            <View className="bg-white mt-4 p-4 mb-4">
                <Text className="text-lg font-semibold mb-4">Booking History</Text>
                {customerBookings.length === 0 ? (
                    <Text className="text-gray-500 text-center py-4">No bookings yet</Text>
                ) : (
                    customerBookings.map((booking: any) => (
                        <TouchableOpacity
                            key={booking.id}
                            onPress={() => router.push({
                                pathname: '../booking-detail',
                                params: { id: booking.id }
                            })}
                            className="border-b border-gray-100 py-3"
                        >
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1">
                                    <Text className="font-semibold text-gray-900">{booking.courtName}</Text>
                                    <Text className="text-sm text-gray-600 mt-1">
                                        {new Date(booking.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                    <Text className="text-sm text-gray-600">
                                        {booking.startTime} - {booking.endTime}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="font-semibold text-gray-900">₹{booking.amount.toFixed(0)}</Text>
                                    <View className={`px-2 py-1 rounded-full mt-1 ${
                                        booking.status === 'confirmed' ? 'bg-green-100' :
                                        booking.status === 'cancelled' ? 'bg-red-100' :
                                        'bg-yellow-100'
                                    }`}>
                                        <Text className={`text-xs font-medium ${
                                            booking.status === 'confirmed' ? 'text-green-800' :
                                            booking.status === 'cancelled' ? 'text-red-800' :
                                            'text-yellow-800'
                                        }`}>
                                            {booking.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

