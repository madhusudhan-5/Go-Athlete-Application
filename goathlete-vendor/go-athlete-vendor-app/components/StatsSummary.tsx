import React from 'react';
import { View, Text } from 'react-native';
import { VendorStats } from '../services/vendorService.ts';

interface StatsSummaryProps {
  stats: VendorStats;
  isLoading?: boolean;
}

export function StatsSummary({ stats, isLoading }: StatsSummaryProps) {
  if (isLoading) {
    return (
      <View className="bg-white rounded-lg p-4 mb-4">
        <Text className="text-gray-500">Loading stats...</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg p-4 mb-4">
      <Text className="text-lg font-semibold mb-3">Earnings Overview</Text>
      
      <View className="flex-row justify-between mb-4">
        <View>
          <Text className="text-xs text-gray-500">Net Earnings</Text>
          <Text className="text-xl font-bold text-green-600">₹{stats.netEarnings}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">Total Revenue</Text>
          <Text className="text-xl font-bold">₹{stats.totalRevenue}</Text>
        </View>
      </View>

      <View className="flex-row justify-between mb-4">
        <View>
          <Text className="text-xs text-gray-500">Total Commission</Text>
          <Text className="text-lg font-medium text-red-600">₹{stats.totalCommission}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">Pending Payouts</Text>
          <Text className="text-lg font-medium text-yellow-600">₹{stats.pendingPayouts}</Text>
        </View>
      </View>

      <View className="flex-row justify-between pt-3 border-t border-gray-100">
        <View>
          <Text className="text-xs text-gray-500">Total Bookings</Text>
          <Text className="text-lg font-medium">{stats.totalBookings}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">Completed</Text>
          <Text className="text-lg font-medium text-green-600">{stats.completedBookings}</Text>
        </View>
      </View>
    </View>
  );
}