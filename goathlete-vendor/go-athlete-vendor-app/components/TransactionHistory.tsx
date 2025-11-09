import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { format } from 'date-fns';

export interface Transaction {
  id: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  paymentMethod: 'ONLINE' | 'OFFLINE';
  customerName: string;
  createdAt: string;
  serviceType: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading: boolean;
}

export default function TransactionHistory({ transactions, loading }: TransactionHistoryProps) {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View className="bg-white p-4 rounded-lg mb-2">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-medium">{item.customerName}</Text>
        <Text className={`${item.status === 'COMPLETED' ? 'text-green-600' : item.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'} font-medium`}>
          {item.status}
        </Text>
      </View>
      
      <View className="mb-2">
        <Text className="text-gray-600 text-sm">{item.serviceType}</Text>
        <Text className="text-gray-600 text-sm">{format(new Date(item.createdAt), 'PPp')}</Text>
      </View>

      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-gray-600 text-sm">Amount</Text>
          <Text className="font-medium">₹{item.amount}</Text>
        </View>
        <View>
          <Text className="text-gray-600 text-sm">Commission</Text>
          <Text className="font-medium text-red-600">-₹{item.commission}</Text>
        </View>
        <View>
          <Text className="text-gray-600 text-sm">Net</Text>
          <Text className="font-medium text-green-600">₹{item.netAmount}</Text>
        </View>
      </View>

      <View className="mt-2 pt-2 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          {item.paymentMethod === 'ONLINE' ? '💳 Paid via Razorpay' : '💰 Cash at Venue'}
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={transactions}
      renderItem={renderTransaction}
      keyExtractor={item => item.id}
      contentContainerClassName="py-2"
      ListEmptyComponent={
        <View className="p-4 items-center">
          <Text className="text-gray-500">No transactions found</Text>
        </View>
      }
    />
  );
}