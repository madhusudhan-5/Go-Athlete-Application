import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import vendorApi from '../../services/vendorApi';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate?: string;
  status: 'active' | 'inactive';
}

export default function CustomersScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Note: This endpoint needs to be added to the backend
    // For now, we'll use bookings to derive customer data
    const { data: bookings, isLoading, refetch } = useQuery({
        queryKey: ['bookings'],
        queryFn: () => vendorApi.getBookings()
    });

    // Derive customers from bookings
    const customers: Customer[] = React.useMemo(() => {
        if (!bookings) return [];
        
        const customerMap = new Map<string, Customer>();
        
        bookings.forEach((booking: any) => {
            const customerId = booking.customerId || booking.customerEmail || booking.customerName;
            if (!customerMap.has(customerId)) {
                customerMap.set(customerId, {
                    id: customerId,
                    name: booking.customerName,
                    email: booking.customerEmail || '',
                    phone: booking.customerPhone,
                    totalBookings: 0,
                    totalSpent: 0,
                    lastBookingDate: booking.date,
                    status: 'active'
                });
            }
            
            const customer = customerMap.get(customerId)!;
            customer.totalBookings += 1;
            customer.totalSpent += booking.amount || 0;
            
            if (booking.date > (customer.lastBookingDate || '')) {
                customer.lastBookingDate = booking.date;
            }
        });
        
        return Array.from(customerMap.values());
    }, [bookings]);

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = 
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone?.includes(searchQuery);
        
        const matchesFilter = 
            filterStatus === 'all' || customer.status === filterStatus;
        
        return matchesSearch && matchesFilter;
    });

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200 p-4">
                <Text className="text-xl font-bold text-gray-900">Customers</Text>
                <Text className="text-sm text-gray-600">Manage your customer relationships</Text>
            </View>

            {/* Search and Filter */}
            <View className="bg-white border-b border-gray-200 p-4">
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
                    <MaterialIcons name="search" size={20} color="#6B7280" />
                    <TextInput
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 ml-2 text-gray-900"
                    />
                </View>

                <View className="flex-row gap-2">
                    {(['all', 'active', 'inactive'] as const).map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg ${
                                filterStatus === status ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                        >
                            <Text className={`text-sm font-medium ${
                                filterStatus === status ? 'text-white' : 'text-gray-700'
                            }`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Customer List */}
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
            >
                <View className="p-4">
                    {filteredCustomers.length === 0 ? (
                        <View className="py-8 items-center">
                            <MaterialIcons name="people-outline" size={48} color="#9CA3AF" />
                            <Text className="text-gray-500 mt-2">
                                {searchQuery ? 'No customers found' : 'No customers yet'}
                            </Text>
                        </View>
                    ) : (
                        filteredCustomers.map((customer) => (
                            <TouchableOpacity
                                key={customer.id}
                                onPress={() => router.push({
                                    pathname: '../customer-detail',
                                    params: { id: customer.id }
                                })}
                                className="bg-white rounded-lg shadow-sm p-4 mb-4"
                            >
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1">
                                        <Text className="text-lg font-semibold text-gray-900">
                                            {customer.name}
                                        </Text>
                                        <Text className="text-sm text-gray-600 mt-1">
                                            {customer.email}
                                        </Text>
                                        {customer.phone && (
                                            <Text className="text-sm text-gray-600">
                                                {customer.phone}
                                            </Text>
                                        )}
                                    </View>
                                    <View className={`px-2 py-1 rounded-full ${
                                        customer.status === 'active' 
                                            ? 'bg-green-100' 
                                            : 'bg-gray-100'
                                    }`}>
                                        <Text className={`text-xs font-medium ${
                                            customer.status === 'active' 
                                                ? 'text-green-800' 
                                                : 'text-gray-800'
                                        }`}>
                                            {customer.status}
                                        </Text>
                                    </View>
                                </View>

                                <View className="border-t border-gray-100 mt-3 pt-3 flex-row justify-between">
                                    <View>
                                        <Text className="text-xs text-gray-500">Total Bookings</Text>
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {customer.totalBookings}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="text-xs text-gray-500">Total Spent</Text>
                                        <Text className="text-sm font-semibold text-gray-900">
                                            ₹{customer.totalSpent.toFixed(0)}
                                        </Text>
                                    </View>
                                    {customer.lastBookingDate && (
                                        <View>
                                            <Text className="text-xs text-gray-500">Last Booking</Text>
                                            <Text className="text-sm font-semibold text-gray-900">
                                                {new Date(customer.lastBookingDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

