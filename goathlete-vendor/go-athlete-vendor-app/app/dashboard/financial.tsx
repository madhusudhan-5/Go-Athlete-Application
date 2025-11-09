import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import vendorApi from '../../services/vendorApi';

type Period = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export default function FinancialScreen() {
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('MONTHLY');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const { data: financialData, isLoading, refetch } = useQuery({
        queryKey: ['financialSummary', selectedPeriod, dateRange],
        queryFn: () => vendorApi.getFinancialSummary({
            period: selectedPeriod,
            start_date: dateRange.start,
            end_date: dateRange.end
        })
    });

    const { data: revenueData } = useQuery({
        queryKey: ['revenueAnalytics', dateRange],
        queryFn: () => vendorApi.getRevenueAnalytics({
            start_date: dateRange.start,
            end_date: dateRange.end,
            groupby: selectedPeriod === 'DAILY' ? 'daily' : selectedPeriod === 'WEEKLY' ? 'weekly' : 'monthly'
        })
    });

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
        >
            {/* Header */}
            <View className="bg-white border-b border-gray-200 p-4">
                <Text className="text-xl font-bold text-gray-900">Financial Summary</Text>
                <Text className="text-sm text-gray-600">Track your earnings and payouts</Text>
            </View>

            {/* Period Selector */}
            <View className="bg-white border-b border-gray-200 p-4">
                <View className="flex-row gap-2">
                    {(['DAILY', 'WEEKLY', 'MONTHLY'] as Period[]).map((period) => (
                        <TouchableOpacity
                            key={period}
                            onPress={() => setSelectedPeriod(period)}
                            className={`px-4 py-2 rounded-lg ${
                                selectedPeriod === period ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                        >
                            <Text className={`text-sm font-medium ${
                                selectedPeriod === period ? 'text-white' : 'text-gray-700'
                            }`}>
                                {period}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Summary Cards */}
            <View className="p-4">
                <View className="flex-row flex-wrap gap-4 mb-4">
                    <View className="flex-1 min-w-[150px] bg-white p-4 rounded-xl shadow-sm">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-gray-600 text-sm font-medium">Total Revenue</Text>
                            <MaterialIcons name="account-balance-wallet" size={24} color="#4B5563" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900">
                            ₹{financialData?.total_revenue?.toFixed(0) || 0}
                        </Text>
                    </View>

                    <View className="flex-1 min-w-[150px] bg-white p-4 rounded-xl shadow-sm">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-gray-600 text-sm font-medium">Total Payout</Text>
                            <MaterialIcons name="payments" size={24} color="#4B5563" />
                        </View>
                        <Text className="text-2xl font-bold text-green-600">
                            ₹{financialData?.total_payout?.toFixed(0) || 0}
                        </Text>
                    </View>

                    <View className="flex-1 min-w-[150px] bg-white p-4 rounded-xl shadow-sm">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-gray-600 text-sm font-medium">Commission</Text>
                            <MaterialIcons name="percent" size={24} color="#4B5563" />
                        </View>
                        <Text className="text-2xl font-bold text-orange-600">
                            ₹{financialData?.total_commission?.toFixed(0) || 0}
                        </Text>
                    </View>

                    <View className="flex-1 min-w-[150px] bg-white p-4 rounded-xl shadow-sm">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-gray-600 text-sm font-medium">Pending</Text>
                            <MaterialIcons name="pending" size={24} color="#4B5563" />
                        </View>
                        <Text className="text-2xl font-bold text-yellow-600">
                            ₹{financialData?.pending_payout?.toFixed(0) || 0}
                        </Text>
                    </View>
                </View>

                {/* Breakdown */}
                <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
                    <Text className="text-lg font-semibold mb-4">Revenue Breakdown</Text>
                    <View className="space-y-3">
                        <View className="flex-row justify-between">
                            <Text className="text-gray-600">Gross Revenue</Text>
                            <Text className="font-semibold text-gray-900">
                                ₹{financialData?.gross_revenue?.toFixed(2) || '0.00'}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-600">Discounts</Text>
                            <Text className="font-semibold text-red-600">
                                -₹{financialData?.total_discounts?.toFixed(2) || '0.00'}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-600">Tax Collected</Text>
                            <Text className="font-semibold text-gray-900">
                                ₹{financialData?.total_tax?.toFixed(2) || '0.00'}
                            </Text>
                        </View>
                        <View className="border-t border-gray-200 pt-3 mt-2">
                            <View className="flex-row justify-between">
                                <Text className="text-lg font-semibold text-gray-900">Net Revenue</Text>
                                <Text className="text-lg font-bold text-indigo-600">
                                    ₹{financialData?.net_revenue?.toFixed(2) || '0.00'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Payout Schedule */}
                <View className="bg-white rounded-xl shadow-sm p-4 mb-4">
                    <Text className="text-lg font-semibold mb-4">Payout Schedule</Text>
                    <View className="space-y-3">
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="font-medium text-gray-900">Next Payout</Text>
                                <Text className="text-sm text-gray-600">
                                    {financialData?.next_payout_date 
                                        ? new Date(financialData.next_payout_date).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })
                                        : 'N/A'
                                    }
                                </Text>
                            </View>
                            <Text className="text-lg font-bold text-green-600">
                                ₹{financialData?.next_payout_amount?.toFixed(0) || 0}
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="font-medium text-gray-900">Payout Frequency</Text>
                                <Text className="text-sm text-gray-600">
                                    {financialData?.payout_frequency || 'Monthly'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View className="bg-white rounded-xl shadow-sm p-4">
                    <Text className="text-lg font-semibold mb-4">Recent Transactions</Text>
                    {financialData?.recent_transactions?.length > 0 ? (
                        financialData.recent_transactions.map((transaction: any, index: number) => (
                            <View key={index} className="border-b border-gray-100 py-3">
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1">
                                        <Text className="font-medium text-gray-900">
                                            {transaction.description || 'Booking Payment'}
                                        </Text>
                                        <Text className="text-sm text-gray-600 mt-1">
                                            {new Date(transaction.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className={`font-semibold ${
                                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(0)}
                                        </Text>
                                        <Text className="text-xs text-gray-500 mt-1">
                                            {transaction.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text className="text-gray-500 text-center py-4">No recent transactions</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

