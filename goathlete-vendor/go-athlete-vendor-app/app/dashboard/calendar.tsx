import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import vendorApi, { Booking, Court } from '../../services/vendorApi';

type ViewMode = 'day' | 'week';

export default function CalendarScreen() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [selectedCourt, setSelectedCourt] = useState<string | null>(null);

    const { data: courts, isLoading: courtsLoading } = useQuery({
        queryKey: ['courts'],
        queryFn: () => vendorApi.getCourts()
    });

    const { data: bookings, isLoading: bookingsLoading, refetch } = useQuery({
        queryKey: ['bookings', selectedDate.toISOString().split('T')[0], selectedCourt],
        queryFn: () => vendorApi.getBookings({
            date: selectedDate.toISOString().split('T')[0],
            court_id: selectedCourt || undefined
        })
    });

    const getWeekDates = () => {
        const dates: Date[] = [];
        const startOfWeek = new Date(selectedDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        startOfWeek.setDate(diff);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const getTimeSlots = () => {
        const slots: string[] = [];
        for (let hour = 6; hour < 24; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    const getBookingsForSlot = (date: Date, timeSlot: string) => {
        if (!bookings) return [];
        const dateStr = date.toISOString().split('T')[0];
        return bookings.filter(booking => {
            const bookingDate = booking.date.split('T')[0];
            const bookingStart = booking.startTime.split(':').slice(0, 2).join(':');
            return bookingDate === dateStr && bookingStart === timeSlot;
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        }
        setSelectedDate(newDate);
    };

    const timeSlots = getTimeSlots();
    const weekDates = viewMode === 'week' ? getWeekDates() : [selectedDate];

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200 p-4">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold text-gray-900">Calendar</Text>
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => setViewMode('day')}
                            className={`px-3 py-1 rounded-lg ${viewMode === 'day' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <Text className={`text-sm font-medium ${viewMode === 'day' ? 'text-white' : 'text-gray-700'}`}>
                                Day
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('week')}
                            className={`px-3 py-1 rounded-lg ${viewMode === 'week' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <Text className={`text-sm font-medium ${viewMode === 'week' ? 'text-white' : 'text-gray-700'}`}>
                                Week
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Date Navigation */}
                <View className="flex-row justify-between items-center">
                    <TouchableOpacity onPress={() => navigateDate('prev')}>
                        <MaterialIcons name="chevron-left" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold text-gray-900">
                        {viewMode === 'day' 
                            ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                            : `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        }
                    </Text>
                    <TouchableOpacity onPress={() => navigateDate('next')}>
                        <MaterialIcons name="chevron-right" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                </View>

                {/* Court Filter */}
                {courts && courts.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
                        <TouchableOpacity
                            onPress={() => setSelectedCourt(null)}
                            className={`px-4 py-2 rounded-full mr-2 ${selectedCourt === null ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <Text className={`text-sm font-medium ${selectedCourt === null ? 'text-white' : 'text-gray-700'}`}>
                                All Courts
                            </Text>
                        </TouchableOpacity>
                        {courts.map((court) => (
                            <TouchableOpacity
                                key={court.id}
                                onPress={() => setSelectedCourt(court.id)}
                                className={`px-4 py-2 rounded-full mr-2 ${selectedCourt === court.id ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <Text className={`text-sm font-medium ${selectedCourt === court.id ? 'text-white' : 'text-gray-700'}`}>
                                    {court.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Calendar Grid */}
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={bookingsLoading} onRefresh={refetch} />
                }
            >
                {/* Time slots and dates grid */}
                <View className="flex-row">
                    {/* Time column */}
                    <View className="w-16 border-r border-gray-200">
                        {timeSlots.map((slot, index) => (
                            <View key={index} className="h-16 border-b border-gray-100 justify-center items-center">
                                <Text className="text-xs text-gray-500">{slot}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Date columns */}
                    <ScrollView horizontal className="flex-1">
                        {weekDates.map((date, dateIndex) => (
                            <View key={dateIndex} className="w-32 border-r border-gray-200">
                                {/* Date header */}
                                <View className={`h-12 border-b border-gray-200 justify-center items-center ${isToday(date) ? 'bg-indigo-50' : 'bg-white'}`}>
                                    <Text className={`text-xs font-medium ${isToday(date) ? 'text-indigo-600' : 'text-gray-700'}`}>
                                        {formatDate(date)}
                                    </Text>
                                </View>

                                {/* Time slots for this date */}
                                {timeSlots.map((slot, slotIndex) => {
                                    const slotBookings = getBookingsForSlot(date, slot);
                                    return (
                                        <TouchableOpacity
                                            key={slotIndex}
                                            onPress={() => {
                                                if (slotBookings.length > 0) {
                                                    router.push({
                                                        pathname: '../booking-detail',
                                                        params: { id: slotBookings[0].id }
                                                    });
                                                }
                                            }}
                                            className={`h-16 border-b border-gray-100 ${slotBookings.length > 0 ? 'bg-indigo-50' : ''}`}
                                        >
                                            {slotBookings.length > 0 && (
                                                <View className="p-1">
                                                    <View className="bg-indigo-600 rounded px-1 py-0.5">
                                                        <Text className="text-xs text-white font-medium" numberOfLines={1}>
                                                            {slotBookings[0].courtName}
                                                        </Text>
                                                        <Text className="text-xs text-indigo-100" numberOfLines={1}>
                                                            {slotBookings[0].customerName}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            {/* Quick Actions */}
            <View className="bg-white border-t border-gray-200 p-4">
                <TouchableOpacity
                    onPress={() => router.push('../court-registration')}
                    className="bg-indigo-600 rounded-lg p-3 flex-row items-center justify-center"
                >
                    <MaterialIcons name="add" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Add New Slot</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

