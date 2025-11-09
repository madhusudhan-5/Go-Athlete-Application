import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  baseAmount: number;
  commission: number;
  netAmount: number;
  currency?: string;
}

export default function PricingSummary({ baseAmount, commission, netAmount, currency = 'INR' }: Props) {
  return (
    <View className="bg-white p-4 rounded-lg shadow-sm">
      <Text className="text-sm text-gray-600">Price breakdown</Text>
      <View className="flex-row justify-between mt-2">
        <Text className="text-gray-700">Base amount</Text>
        <Text className="font-semibold">{currency} {baseAmount}</Text>
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-gray-700">Commission</Text>
        <Text className="font-semibold text-red-600">- {currency} {commission}</Text>
      </View>
      <View className="flex-row justify-between mt-3 border-t pt-3">
        <Text className="text-gray-900 font-medium">You receive</Text>
        <Text className="text-gray-900 font-bold">{currency} {netAmount}</Text>
      </View>
    </View>
  );
}
