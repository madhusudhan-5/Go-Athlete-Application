import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import vendorApi, { Offer } from '../../services/vendorApi.ts';
import { format } from 'date-fns';

export default function Offers() {
    const queryClient = useQueryClient();
    const { data: offers, isLoading, refetch } = useQuery({
        queryKey: ['offers'],
        queryFn: () => vendorApi.getOffers()
    });

    const deleteOfferMutation = useMutation({
        mutationFn: (id: string) => vendorApi.deleteOffer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['offers'] });
        }
    });

    const getStatusColor = (status: Offer['status']) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'expired':
                return 'bg-red-100 text-red-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
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
                        <Text className="text-xl font-bold text-gray-900">Offers</Text>
                        <Text className="text-sm text-gray-600">Create and manage special offers</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('offer/new' as any)}
                        className="bg-indigo-600 px-4 py-2 rounded-lg flex-row items-center"
                    >
                        <MaterialIcons name="add" size={20} color="white" />
                        <Text className="text-white font-medium ml-1">New Offer</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="p-4">
                {offers?.map((offer) => (
                    <View key={offer.id} className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <View className="flex-row justify-between items-start mb-2">
                            <View>
                                <Text className="text-lg font-semibold text-gray-900">{offer.title}</Text>
                                <Text className="text-sm text-gray-600">{offer.description}</Text>
                            </View>
                            <View className={`px-2 py-1 rounded-full ${getStatusColor(offer.status)}`}>
                                <Text className="text-xs font-medium capitalize">{offer.status}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center mt-2">
                            <MaterialIcons name="local-offer" size={16} color="#4B5563" />
                            <Text className="text-gray-600 text-sm ml-1">
                                {offer.discountType === 'percentage' 
                                    ? `${offer.discountValue}% off`
                                    : `₹${offer.discountValue} off`}
                            </Text>
                        </View>

                        <View className="flex-row items-center mt-2">
                            <MaterialIcons name="date-range" size={16} color="#4B5563" />
                            <Text className="text-gray-600 text-sm ml-1">
                                {format(new Date(offer.startDate), 'MMM dd')} - {format(new Date(offer.endDate), 'MMM dd, yyyy')}
                            </Text>
                        </View>

                        <View className="flex-row justify-end mt-4 gap-2">
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: 'offer/[id]' as any,
                                    params: { id: offer.id }
                                })}
                                className="px-3 py-2 rounded-lg bg-gray-100"
                            >
                                <Text className="text-gray-700">Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (confirm('Are you sure you want to delete this offer?')) {
                                        deleteOfferMutation.mutate(offer.id);
                                    }
                                }}
                                className="px-3 py-2 rounded-lg bg-red-50"
                            >
                                <Text className="text-red-600">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {!isLoading && (!offers || offers.length === 0) && (
                    <View className="py-8 items-center">
                        <MaterialIcons name="local-offer" size={48} color="#9CA3AF" />
                        <Text className="text-gray-500 mt-2">No offers created yet</Text>
                        <TouchableOpacity
                            onPress={() => router.push('offer/new' as any)}
                            className="mt-4 bg-indigo-600 px-4 py-2 rounded-lg"
                        >
                            <Text className="text-white font-medium">Create Your First Offer</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}