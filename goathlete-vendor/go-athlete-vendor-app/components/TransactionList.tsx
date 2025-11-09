import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { format } from 'date-fns';
import { VendorTransaction } from '../services/vendorService.ts';

interface TransactionListProps {
  transactions: VendorTransaction[];
  isLoading?: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-gray-500">Loading transactions...</Text>
      </View>
    );
  }

  if (!transactions.length) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-gray-500">No transactions found</Text>
      </View>
    );
  }

  const renderTransaction = ({ item }: { item: VendorTransaction }) => (
    <View className="bg-white rounded-lg mb-3 p-4">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="font-medium">{item.customerName}</Text>
        <Text 
          className={
            item.status === 'COMPLETED' ? 'text-green-600' : 
            item.status === 'PENDING' ? 'text-yellow-600' : 
            'text-red-600'
          }
        >
          {item.status}
        </Text>
      </View>

      <Text className="text-sm text-gray-500 mb-2">
        {format(new Date(item.createdAt), 'PPp')}
      </Text>

      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-xs text-gray-500">Total</Text>
          <Text className="font-medium">₹{item.amount}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">Commission</Text>
          <Text className="font-medium text-red-600">-₹{item.commission}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">Net</Text>
          <Text className="font-medium text-green-600">₹{item.netAmount}</Text>
        </View>
      </View>

      <View className="mt-2 pt-2 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          {item.serviceType} • {item.paymentMethod === 'ONLINE' ? '💳 Paid via Razorpay' : '💰 Cash'}
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={transactions}
      renderItem={renderTransaction}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}