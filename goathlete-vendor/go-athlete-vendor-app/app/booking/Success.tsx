import { View, Text, TouchableOpacity, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Success() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    serviceId: string;
    bookingDate: string;
    timeSlot: string;
  }>();

  const onShare = async () => {
    try {
      await Share.share({
        message: `Booking confirmed at Go-Athlete!\n\nDate: ${new Date(params.bookingDate).toLocaleDateString()}\nTime: ${params.timeSlot}\nBooking ID: ${params.serviceId}`,
      });
    } catch (err) {
      // ignore
    }
  };

  const handleDone = () => {
    router.push('/dashboard');
  };

  return (
    <View className="flex-1 bg-gray-50 justify-between">
      {/* Success Content */}
      <View className="flex-1 items-center justify-center px-4">
        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
        </View>

        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Booking Confirmed!
        </Text>
        
        <Text className="text-gray-600 text-center mb-8">
          Your booking has been successfully confirmed. We look forward to serving you!
        </Text>

        <View className="bg-white p-4 rounded-lg w-full mb-6">
          <Text className="text-lg font-semibold mb-4">Booking Details</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Date</Text>
              <Text className="font-medium">
                {new Date(params.bookingDate).toLocaleDateString()}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Time</Text>
              <Text className="font-medium">{params.timeSlot}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Booking ID</Text>
              <Text className="font-medium">{params.serviceId}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={onShare}
          className="bg-blue-50 p-4 rounded-lg w-full flex-row items-center justify-center"
        >
          <Ionicons name="share-outline" size={20} color="#1D4ED8" />
          <Text className="text-blue-700 font-medium ml-2">
            Share Booking Details
          </Text>
        </TouchableOpacity>
      </View>

      {/* Done Button */}
      <View className="p-4">
        <TouchableOpacity
          onPress={handleDone}
          className="bg-blue-500 p-4 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">
            Back to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
