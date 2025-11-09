import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useBooking from '../../hooks/useBooking.ts';
import { Ionicons } from '@expo/vector-icons';

const PAYMENT_METHODS = [
  {
    id: 'ONLINE',
    name: 'Online Payment',
    icon: 'card-outline',
    description: 'Pay securely with credit/debit card',
  },
  {
    id: 'WALLET',
    name: 'Wallet',
    icon: 'wallet-outline',
    description: 'Pay using your Go-Athlete wallet',
  },
  {
    id: 'OFFLINE',
    name: 'Pay at Venue',
    icon: 'cash-outline',
    description: 'Pay in cash at the venue',
  },
] as const;

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
  }>();
  const router = useRouter();
  const { createBooking, loading, error } = useBooking();
  const [selectedMethod, setSelectedMethod] = useState<typeof PAYMENT_METHODS[number]['id']>('ONLINE');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handlePayment = async () => {
    if (!customerName || !customerPhone) {
      Alert.alert('Required Fields', 'Please enter customer name and phone number');
      return;
    }

    try {
      const booking = await createBooking({
        serviceId: Number(params.serviceId),
        date: params.date,
        timeSlot: `${params.startTime}-${params.endTime}`,
        numberOfPeople: 1,
        paymentMethod: selectedMethod,
      });
      
      router.push({
        pathname: '/booking/Success' as const,
        params: {
          serviceId: params.serviceId,
          bookingDate: params.date,
          timeSlot: `${params.startTime}-${params.endTime}`,
        },
      });
    } catch (err) {
      Alert.alert('Payment Error', err instanceof Error ? err.message : 'Unable to complete booking');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Booking Summary */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Booking Summary</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Date</Text>
              <Text className="font-medium">
                {new Date(params.date).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Time</Text>
              <Text className="font-medium">
                {params.startTime} - {params.endTime}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-lg font-semibold mb-4">Customer Details</Text>
          <View className="space-y-4">
            <View>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Customer Name"
                className="bg-gray-50 p-3 rounded-lg"
              />
            </View>
            <View>
              <TextInput
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Customer Phone"
                keyboardType="phone-pad"
                className="bg-gray-50 p-3 rounded-lg"
              />
            </View>
            <View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional Notes (Optional)"
                multiline
                numberOfLines={3}
                className="bg-gray-50 p-3 rounded-lg"
              />
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View className="bg-white p-4">
          <Text className="text-lg font-semibold mb-4">Select Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => setSelectedMethod(method.id)}
              className={`
                flex-row items-center p-4 rounded-lg mb-3 border
                ${selectedMethod === method.id 
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
                }
              `}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={selectedMethod === method.id ? '#3B82F6' : '#6B7280'}
              />
              <View className="ml-3 flex-1">
                <Text className={`font-medium ${
                  selectedMethod === method.id ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {method.name}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {method.description}
                </Text>
              </View>
              <View className={`
                w-6 h-6 rounded-full border-2 items-center justify-center
                ${selectedMethod === method.id
                  ? 'border-blue-500'
                  : 'border-gray-300'
                }
              `}>
                {selectedMethod === method.id && (
                  <View className="w-3 h-3 rounded-full bg-blue-500" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {error && (
          <View className="m-4 p-4 bg-red-50 rounded-lg">
            <Text className="text-red-600">{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Confirm Button */}
      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handlePayment}
          disabled={loading || !customerName || !customerPhone}
          className={`
            p-4 rounded-lg
            ${loading || !customerName || !customerPhone ? 'bg-gray-300' : 'bg-blue-500'}
          `}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">
              Confirm Booking
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
