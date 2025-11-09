import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import vendorApi, { Booking } from '../../services/vendorApi';

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const queryClient = useQueryClient();

    const { data: booking, isLoading } = useQuery({
        queryKey: ['booking', id],
        queryFn: () => vendorApi.getBooking(id!),
        enabled: !!id
    });

    const cancelMutation = useMutation({
        mutationFn: (bookingId: string) => vendorApi.cancelBooking(bookingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            Alert.alert('Success', 'Booking cancelled successfully');
            router.back();
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to cancel booking');
        }
    });

    const rescheduleMutation = useMutation({
        mutationFn: ({ bookingId, newDate, newTime }: { bookingId: string; newDate: string; newTime: string }) =>
            vendorApi.rescheduleBooking(bookingId, newDate, newTime),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            Alert.alert('Success', 'Booking rescheduled successfully');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to reschedule booking');
        }
    });

    const handleCancel = () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => booking && cancelMutation.mutate(booking.id) }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <Text className="text-gray-600">Loading booking details...</Text>
            </View>
        );
    }

    if (!booking) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                <Text className="text-gray-600 mt-4">Booking not found</Text>
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
                        <Text className="text-xl font-bold text-gray-900">Booking Details</Text>
                        <Text className="text-sm text-gray-600">ID: {booking.id}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                        <Text className="text-xs font-medium capitalize">{booking.status}</Text>
                    </View>
                </View>
            </View>

            {/* Booking Information */}
            <View className="bg-white mt-4 p-4">
                <Text className="text-lg font-semibold mb-4">Booking Information</Text>
                
                <View className="space-y-3">
                    <View className="flex-row justify-between">
                        <Text className="text-gray-600">Court</Text>
                        <Text className="font-medium text-gray-900">{booking.courtName}</Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                        <Text className="text-gray-600">Date</Text>
                        <Text className="font-medium text-gray-900">
                            {new Date(booking.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                        <Text className="text-gray-600">Time</Text>
                        <Text className="font-medium text-gray-900">
                            {booking.startTime} - {booking.endTime}
                        </Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                        <Text className="text-gray-600">Customer</Text>
                        <Text className="font-medium text-gray-900">{booking.customerName}</Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                        <Text className="text-gray-600">Payment Status</Text>
                        <View className={`px-2 py-1 rounded ${getPaymentStatusColor(booking.paymentStatus || 'pending')}`}>
                            <Text className="text-xs font-medium capitalize">{booking.paymentStatus || 'Pending'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Pricing Breakdown */}
            <View className="bg-white mt-4 p-4">
                <Text className="text-lg font-semibold mb-4">Pricing Breakdown</Text>
                
                <View className="space-y-2">
                    <View className="flex-row justify-between">
                        <Text className="text-gray-600">Base Amount</Text>
                        <Text className="font-medium text-gray-900">₹{booking.baseAmount?.toFixed(2) || booking.amount.toFixed(2)}</Text>
                    </View>
                    
                    {booking.discountAmount && booking.discountAmount > 0 && (
                        <View className="flex-row justify-between">
                            <Text className="text-gray-600">Discount</Text>
                            <Text className="font-medium text-green-600">-₹{booking.discountAmount.toFixed(2)}</Text>
                        </View>
                    )}
                    
                    {booking.taxAmount && booking.taxAmount > 0 && (
                        <View className="flex-row justify-between">
                            <Text className="text-gray-600">Tax (GST)</Text>
                            <Text className="font-medium text-gray-900">₹{booking.taxAmount.toFixed(2)}</Text>
                        </View>
                    )}
                    
                    {booking.commissionAmount && booking.commissionAmount > 0 && (
                        <View className="flex-row justify-between">
                            <Text className="text-gray-600">Platform Commission</Text>
                            <Text className="font-medium text-gray-900">₹{booking.commissionAmount.toFixed(2)}</Text>
                        </View>
                    )}
                    
                    <View className="border-t border-gray-200 pt-2 mt-2">
                        <View className="flex-row justify-between">
                            <Text className="text-lg font-semibold text-gray-900">Total Amount</Text>
                            <Text className="text-lg font-bold text-indigo-600">₹{booking.totalAmount?.toFixed(2) || booking.amount.toFixed(2)}</Text>
                        </View>
                    </View>
                    
                    {booking.payoutAmount && (
                        <View className="flex-row justify-between mt-2">
                            <Text className="text-gray-600">Your Payout</Text>
                            <Text className="font-semibold text-green-600">₹{booking.payoutAmount.toFixed(2)}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Actions */}
            {booking.status !== 'cancelled' && (
                <View className="bg-white mt-4 p-4">
                    <Text className="text-lg font-semibold mb-4">Actions</Text>
                    
                    <View className="space-y-3">
                        {booking.status === 'pending' && (
                            <TouchableOpacity
                                onPress={handleCancel}
                                disabled={cancelMutation.isPending}
                                className="bg-red-600 rounded-lg p-3 flex-row items-center justify-center"
                            >
                                <MaterialIcons name="cancel" size={20} color="white" />
                                <Text className="text-white font-semibold ml-2">
                                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname: '../calendar',
                                params: { bookingId: booking.id }
                            })}
                            className="bg-indigo-600 rounded-lg p-3 flex-row items-center justify-center"
                        >
                            <MaterialIcons name="schedule" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">Reschedule</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Customer Contact */}
            <View className="bg-white mt-4 p-4 mb-4">
                <Text className="text-lg font-semibold mb-4">Customer Contact</Text>
                
                <View className="space-y-3">
                    <TouchableOpacity className="flex-row items-center">
                        <MaterialIcons name="email" size={20} color="#4B5563" />
                        <Text className="text-gray-700 ml-2">{booking.customerEmail || 'N/A'}</Text>
                    </TouchableOpacity>
                    
                    {booking.customerPhone && (
                        <TouchableOpacity className="flex-row items-center">
                            <MaterialIcons name="phone" size={20} color="#4B5563" />
                            <Text className="text-gray-700 ml-2">{booking.customerPhone}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

