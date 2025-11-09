import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

// Note: Membership API endpoints need to be added to backend
// This is a placeholder implementation
export default function MembershipsScreen() {
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'expired'>('all');

    // Placeholder data - replace with actual API call when backend is ready
    const memberships = [
        {
            id: '1',
            customerName: 'John Doe',
            planName: 'Monthly Unlimited',
            sessionsRemaining: 8,
            totalSessions: 10,
            startDate: '2024-01-01',
            endDate: '2024-02-01',
            status: 'active',
            price: 2000
        },
        {
            id: '2',
            customerName: 'Jane Smith',
            planName: 'Credit Pack',
            creditsRemaining: 5,
            totalCredits: 10,
            startDate: '2024-01-15',
            endDate: '2024-04-15',
            status: 'active',
            price: 1500
        }
    ];

    const filteredMemberships = memberships.filter(m => {
        if (selectedFilter === 'all') return true;
        return m.status === selectedFilter;
    });

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200 p-4">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-xl font-bold text-gray-900">Memberships</Text>
                        <Text className="text-sm text-gray-600">Manage customer memberships</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('../membership-create')}
                        className="bg-indigo-600 px-4 py-2 rounded-lg flex-row items-center"
                    >
                        <MaterialIcons name="add" size={20} color="white" />
                        <Text className="text-white font-medium ml-1">Create Plan</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filters */}
            <View className="bg-white border-b border-gray-200 p-4">
                <View className="flex-row gap-2">
                    {(['all', 'active', 'expired'] as const).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => setSelectedFilter(filter)}
                            className={`px-4 py-2 rounded-lg ${
                                selectedFilter === filter ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                        >
                            <Text className={`text-sm font-medium ${
                                selectedFilter === filter ? 'text-white' : 'text-gray-700'
                            }`}>
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Membership Plans List */}
            <ScrollView className="flex-1">
                <View className="p-4">
                    <Text className="text-lg font-semibold mb-4">Active Plans</Text>
                    {filteredMemberships.length === 0 ? (
                        <View className="py-8 items-center">
                            <MaterialIcons name="card-membership" size={48} color="#9CA3AF" />
                            <Text className="text-gray-500 mt-2">No memberships found</Text>
                        </View>
                    ) : (
                        filteredMemberships.map((membership) => (
                            <TouchableOpacity
                                key={membership.id}
                                onPress={() => router.push({
                                    pathname: '../membership-detail',
                                    params: { id: membership.id }
                                })}
                                className="bg-white rounded-lg shadow-sm p-4 mb-4"
                            >
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1">
                                        <Text className="text-lg font-semibold text-gray-900">
                                            {membership.customerName}
                                        </Text>
                                        <Text className="text-sm text-gray-600 mt-1">
                                            {membership.planName}
                                        </Text>
                                    </View>
                                    <View className={`px-2 py-1 rounded-full ${
                                        membership.status === 'active' 
                                            ? 'bg-green-100' 
                                            : 'bg-gray-100'
                                    }`}>
                                        <Text className={`text-xs font-medium ${
                                            membership.status === 'active' 
                                                ? 'text-green-800' 
                                                : 'text-gray-800'
                                        }`}>
                                            {membership.status}
                                        </Text>
                                    </View>
                                </View>

                                <View className="border-t border-gray-100 mt-3 pt-3">
                                    {membership.sessionsRemaining !== undefined ? (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-sm text-gray-600">Sessions</Text>
                                            <Text className="text-sm font-semibold text-gray-900">
                                                {membership.sessionsRemaining} / {membership.totalSessions}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-sm text-gray-600">Credits</Text>
                                            <Text className="text-sm font-semibold text-gray-900">
                                                {membership.creditsRemaining} / {membership.totalCredits}
                                            </Text>
                                        </View>
                                    )}
                                    
                                    <View className="flex-row justify-between items-center mt-2">
                                        <Text className="text-sm text-gray-600">Valid Until</Text>
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {new Date(membership.endDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Create Membership Plan Section */}
                <View className="p-4">
                    <Text className="text-lg font-semibold mb-4">Membership Plans</Text>
                    <View className="bg-white rounded-lg shadow-sm p-4">
                        <Text className="text-gray-600 mb-4">
                            Create membership plans to offer customers flexible booking options
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('../membership-create')}
                            className="bg-indigo-600 rounded-lg p-3 flex-row items-center justify-center"
                        >
                            <MaterialIcons name="add-circle-outline" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">Create New Plan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

