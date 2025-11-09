import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../services/api.ts';
import { format, addMinutes, addDays } from 'date-fns';

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
};

export default function SlotPicker() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const { api } = useApi();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    loadTimeSlots();
  }, [selectedDate]);

  const loadTimeSlots = async () => {
    setLoading(true);
    try {
      // Simulated API response
      const now = new Date();
      const generatedSlots = Array.from({ length: 12 }).map((_, i) => {
        const start = addMinutes(now, 60 * (i + 1));
        const end = addMinutes(start, 60);
        return {
          id: `${i}`,
          startTime: format(start, 'HH:mm'),
          endTime: format(end, 'HH:mm'),
          available: Math.random() > 0.3,
        };
      });
      setSlots(generatedSlots);
    } catch (error) {
      console.error('Failed to load time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextDates = (days: number = 7) => {
    return Array.from({ length: days }, (_, i) => addDays(new Date(), i));
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEE, MMM d');
  };

  const handleContinue = () => {
    if (!selectedSlot) return;
    router.push({
      pathname: '/booking/PaymentScreen' as const,
      params: {
        serviceId,
        date: selectedDate.toISOString(),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      },
    });
  };

  const renderSlot = (slot: TimeSlot) => (
    <TouchableOpacity
      key={slot.id}
      onPress={() => slot.available && setSelectedSlot(slot)}
      disabled={!slot.available}
      className={`
        w-[48%] p-4 rounded-lg mb-3
        ${!slot.available ? 'bg-gray-100' : 
          selectedSlot?.id === slot.id ? 'bg-blue-500' : 
          'bg-white border border-gray-200'
        }
      `}
    >
      <Text className={`
        text-center font-medium
        ${!slot.available ? 'text-gray-400' :
          selectedSlot?.id === slot.id ? 'text-white' :
          'text-gray-700'
        }
      `}>
        {`${slot.startTime} - ${slot.endTime}`}
      </Text>
      {!slot.available && (
        <Text className="text-gray-400 text-xs text-center mt-1">
          Unavailable
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Date Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3 bg-white border-b border-gray-200"
      >
        {getNextDates().map((date, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedDate(date)}
            className={`
              px-4 py-2 rounded-full mr-2
              ${date.toDateString() === selectedDate.toDateString() ?
                'bg-blue-500' : 'bg-gray-100'
              }
            `}
          >
            <Text className={
              date.toDateString() === selectedDate.toDateString() ?
                'text-white font-medium' : 'text-gray-700 font-medium'
            }>
              {formatDate(date)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Time Slots */}
      <ScrollView className="flex-1 p-4">
        {loading ? (
          <View className="flex-1 justify-center items-center py-8">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-4">Loading available slots...</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {slots.map(renderSlot)}
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedSlot}
          className={`
            p-4 rounded-lg
            ${selectedSlot ? 'bg-blue-500' : 'bg-gray-300'}
          `}
        >
          <Text className="text-white text-center font-semibold">
            Continue to Payment
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
