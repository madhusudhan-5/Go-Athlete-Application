import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CourtRegistrationProps {
  onClose: () => void;
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  hourlyRate: string;
}

export const CourtRegistration: React.FC<CourtRegistrationProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [courtData, setCourtData] = React.useState({
    name: '',
    type: '',
    description: '',
    images: [] as string[],
    hourlyRate: '',
    slots: [] as TimeSlot[]
  });

  const [currentSlot, setCurrentSlot] = React.useState<TimeSlot>({
    day: 'Monday',
    startTime: '',
    endTime: '',
    hourlyRate: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setCourtData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri]
      }));
    }
  };

  const addTimeSlot = () => {
    if (currentSlot.startTime && currentSlot.endTime && currentSlot.hourlyRate) {
      setCourtData(prev => ({
        ...prev,
        slots: [...prev.slots, currentSlot]
      }));
      setCurrentSlot({
        day: 'Monday',
        startTime: '',
        endTime: '',
        hourlyRate: ''
      });
    }
  };

  const registerCourtMutation = useMutation({
    mutationFn: async (data: any) => {
      const vendorApi = (await import('../../services/vendorApi')).default;
      // First create venue if needed, then create court
      const venueData = {
        name: data.venueName || 'My Venue',
        description: data.venueDescription || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0
      };
      
      // Create or get venue
      const venues = await vendorApi.getVenues();
      let venueId = venues[0]?.id;
      if (!venueId) {
        const venue = await vendorApi.createVenue(venueData);
        venueId = venue.id;
      }
      
      // Create court
      const courtData = {
        venue_id: venueId,
        name: data.name,
        type: data.type,
        description: data.description,
        hourly_rate: parseFloat(data.hourlyRate) || 0,
        capacity: data.capacity || 4,
        images: data.images
      };
      
      const court = await vendorApi.createCourt(courtData);
      
      // Set availability if slots are provided
      if (data.slots && data.slots.length > 0) {
        const availabilities = data.slots.map((slot: TimeSlot) => ({
          day_of_week: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime,
          hourly_rate: parseFloat(slot.hourlyRate) || parseFloat(data.hourlyRate) || 0
        }));
        await vendorApi.setCourtAvailability(court.id, availabilities);
      }
      
      return court;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to register court:', error);
      alert(error.message || 'Failed to register court');
    }
  });

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold">Register New Court</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Basic Details */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Court Name</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            value={courtData.name}
            onChangeText={(text) => setCourtData(prev => ({ ...prev, name: text }))}
            placeholder="Enter court name"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Court Type</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            value={courtData.type}
            onChangeText={(text) => setCourtData(prev => ({ ...prev, type: text }))}
            placeholder="e.g., Tennis, Basketball, etc."
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            value={courtData.description}
            onChangeText={(text) => setCourtData(prev => ({ ...prev, description: text }))}
            placeholder="Describe your court"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Image Upload */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Court Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4">
              {courtData.images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  className="w-24 h-24 rounded-lg"
                />
              ))}
              <TouchableOpacity
                onPress={pickImage}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
              >
                <MaterialIcons name="add-photo-alternate" size={32} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Time Slots</Text>
          
          <View className="bg-gray-50 p-4 rounded-lg mb-4">
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Day</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-white"
                  value={currentSlot.day}
                  onChangeText={(text) => setCurrentSlot(prev => ({ ...prev, day: text }))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Start Time</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-white"
                  value={currentSlot.startTime}
                  onChangeText={(text) => setCurrentSlot(prev => ({ ...prev, startTime: text }))}
                  placeholder="HH:MM"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">End Time</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-white"
                  value={currentSlot.endTime}
                  onChangeText={(text) => setCurrentSlot(prev => ({ ...prev, endTime: text }))}
                  placeholder="HH:MM"
                />
              </View>
            </View>
            
            <View className="mb-4">
              <Text className="text-xs text-gray-500 mb-1">Hourly Rate (₹)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-white"
                value={currentSlot.hourlyRate}
                onChangeText={(text) => setCurrentSlot(prev => ({ ...prev, hourlyRate: text }))}
                keyboardType="numeric"
                placeholder="Enter rate"
              />
            </View>

            <TouchableOpacity
              onPress={addTimeSlot}
              className="bg-blue-500 p-3 rounded-lg items-center"
            >
              <Text className="text-white font-medium">Add Time Slot</Text>
            </TouchableOpacity>
          </View>

          {/* Display added slots */}
          {courtData.slots.map((slot, index) => (
            <View key={index} className="bg-gray-100 p-3 rounded-lg mb-2 flex-row justify-between">
              <Text>{slot.day} ({slot.startTime}-{slot.endTime})</Text>
              <Text>₹{slot.hourlyRate}/hr</Text>
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={() => registerCourtMutation.mutate(courtData as any)}
          className="bg-indigo-600 p-4 rounded-lg items-center"
        >
          <Text className="text-white font-semibold">Register Court</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};