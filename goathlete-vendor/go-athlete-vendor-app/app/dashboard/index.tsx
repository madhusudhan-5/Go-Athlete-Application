import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { DashboardHeader, DashboardCard } from '../../components/dashboard/index.ts';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
    const [refreshing, setRefreshing] = React.useState(false);
    const router = useRouter();
    
    const dashboardData = {
        todayBookings: 12,
        tomorrowBookings: 8,
        totalEarnings: 2500,
        activeOffers: 3
    };

    const quickLinks = [
        {
            title: 'Add Court',
            icon: 'add-business',
            onPress: () => router.push('/dashboard/court-registration')
        },
        {
            title: 'Manage Courts',
            icon: 'sports-tennis',
            onPress: () => router.push('/dashboard/court-management')
        },
        {
            title: 'View Analytics',
            icon: 'analytics',
            onPress: () => router.push('/dashboard/analytics')
        },
        {
            title: 'Manage Offers',
            icon: 'local-offer',
            onPress: () => router.push('/dashboard/offers')
        }
    ];

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        // TODO: Implement refresh logic
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <DashboardHeader 
                title="Vendor Dashboard"
                subtitle="Welcome back!"
            />

            {/* Stats Cards */}
            <View className="flex-row flex-wrap p-4 gap-4">
                <DashboardCard
                    title="Today's Bookings"
                    value={dashboardData.todayBookings}
                    icon={<MaterialIcons name="today" size={24} color="#4B5563" />}
                />
                <DashboardCard
                    title="Tomorrow's Bookings"
                    value={dashboardData.tomorrowBookings}
                    icon={<MaterialIcons name="event" size={24} color="#4B5563" />}
                />
                <DashboardCard
                    title="Total Earnings"
                    value={`₹${dashboardData.totalEarnings}`}
                    icon={<MaterialIcons name="account-balance-wallet" size={24} color="#4B5563" />}
                />
                <DashboardCard
                    title="Active Offers"
                    value={dashboardData.activeOffers}
                    icon={<MaterialIcons name="local-offer" size={24} color="#4B5563" />}
                />
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