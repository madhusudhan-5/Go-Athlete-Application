import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useApi } from '../../services/api.ts';
import type { Service } from '../../services/api.ts';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SelectService() {
  const { api } = useApi();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.getServices();
      setServices(response);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      className="p-4 bg-white rounded-lg shadow-sm mb-4 mx-4 border border-gray-100"
      onPress={() => router.push({
        pathname: '/booking/SlotPicker' as const,
        params: { serviceId: item.id.toString() }
      })}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
          <Text className="text-gray-600 mt-1 text-sm">{item.description}</Text>
          <View className="flex-row items-center mt-3">
            <Ionicons name="time-outline" size={16} color="#4B5563" />
            <Text className="text-gray-500 ml-1 text-sm">{item.duration} mins</Text>
            <View className="w-1 h-1 bg-gray-400 rounded-full mx-2" />
            <Ionicons name="people-outline" size={16} color="#4B5563" />
            <Text className="text-gray-500 ml-1 text-sm">Up to {item.capacity}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-blue-600">₹{item.price}</Text>
          {item.is_active ? (
            <Text className="text-green-600 text-xs mt-1">Available</Text>
          ) : (
            <Text className="text-red-600 text-xs mt-1">Unavailable</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading services...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-sm text-gray-600">
          Select a service to check availability and make a booking
        </Text>
      </View>
      
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingVertical: 16 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-8">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4">No services available</Text>
          </View>
        }
      />
    </View>
  );
}
