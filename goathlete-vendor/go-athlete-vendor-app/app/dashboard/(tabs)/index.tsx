import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import vendorApi from '../../../services/vendorApi.ts';
import { CACHE_CONFIG } from '../../../config/index.ts';

export default function DashboardScreen() {
    const [refreshing, setRefreshing] = React.useState(false);
    
    const { data: dashboardData, isLoading, refetch } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: () => vendorApi.getDashboardStats(),
        staleTime: CACHE_CONFIG.dashboardStats
    });

    const quickLinks = [
        {
            title: 'Add Court',
            icon: 'add-business',
            onPress: () => router.push('../court-registration')
        },
        {
            title: 'Manage Courts',
            icon: 'sports-tennis',
            onPress: () => router.push('../court-management')
        },
        {
            title: 'View Analytics',
            icon: 'analytics',
            onPress: () => router.push('../analytics')
        },
        {
            title: 'Manage Offers',
            icon: 'local-offer',
            onPress: () => router.push('../offers')
        }
    ] as const;

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View className="bg-white p-4 border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-900">Vendor Dashboard</Text>
                <Text className="text-sm text-gray-600">Welcome back!</Text>
            </View>

            {/* Stats Cards */}
            <View className="flex-row flex-wrap p-4 gap-4">
                <View className="flex-1 min-w-[150px] bg-white p-4 rounded-xl shadow-sm">
                    <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-gray-600 text-sm font-medium">Today's Bookings</Text>
                        <MaterialIcons name="today" size={24} color="#4B5563" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">{dashboardData?.today_bookings ?? 0}</Text>
                </View>

                <View className="flex-1 min-w-[150px] bg-white p-4 rounded-xl shadow-sm">
                    <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-gray-600 text-sm font-medium">Today's Earnings</Text>
                        <MaterialIcons name="account-balance-wallet" size={24} color="#4B5563" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">₹{dashboardData?.today_earnings?.toFixed(0) ?? 0}</Text>
                </View>

                <View className="flex-1 min-w-[150px] bg-white p-4 rounded-xl shadow-sm">
                    <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-gray-600 text-sm font-medium">Pending Payout</Text>
                        <MaterialIcons name="pending" size={24} color="#4B5563" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">₹{dashboardData?.pending_payout?.toFixed(0) ?? 0}</Text>
                </View>

                <View className="flex-1 min-w-[150px] bg-white p-4 rounded-xl shadow-sm">
                    <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-gray-600 text-sm font-medium">Active Offers</Text>
                        <MaterialIcons name="local-offer" size={24} color="#4B5563" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">{dashboardData?.active_offers_count ?? 0}</Text>
                </View>
            </View>

            {/* Quick Links */}
            <View className="p-4">
                <View className="bg-white rounded-xl p-4 shadow-sm">
                    <Text className="text-lg font-semibold mb-4">Quick Actions</Text>
                    <View className="flex-row flex-wrap gap-4">
                        {quickLinks.map((link, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={link.onPress}
                                className="flex-col items-center justify-center w-[calc(50%-8px)] bg-gray-50 p-4 rounded-lg"
                            >
                                <MaterialIcons name={link.icon as any} size={28} color="#4F46E5" />
                                <Text className="mt-2 text-sm font-medium text-gray-700">
                                    {link.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}