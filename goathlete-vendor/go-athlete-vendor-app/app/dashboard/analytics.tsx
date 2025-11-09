import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import vendorApi from '../../services/vendorApi.ts';
import { format, subDays } from 'date-fns';
import { ANALYTICS_CONFIG } from '../../config/index.ts';

const { width } = Dimensions.get('window');

type DateRange = '7days' | '30days' | '90days';
type MetricType = 'bookings' | 'revenue';

export default function Analytics() {
    const [dateRange, setDateRange] = React.useState<DateRange>('30days');
    const [metricType, setMetricType] = React.useState<MetricType>('bookings');

    const getDaysFromRange = (range: DateRange) => {
        switch (range) {
            case '7days':
                return 7;
            case '90days':
                return 90;
            default:
                return 30;
        }
    };

    const { data: analyticsData } = useQuery({
        queryKey: ['analytics', metricType, dateRange],
        queryFn: async () => {
            const days = getDaysFromRange(dateRange);
            const endDate = new Date();
            const startDate = subDays(endDate, days);

            if (metricType === 'bookings') {
                return vendorApi.getBookingAnalytics({
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    endDate: format(endDate, 'yyyy-MM-dd'),
                    groupBy: dateRange === '90days' ? 'week' : 'day'
                });
            } else {
                return vendorApi.getRevenueAnalytics({
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    endDate: format(endDate, 'yyyy-MM-dd'),
                    groupBy: dateRange === '90days' ? 'week' : 'day'
                });
            }
        }
    });

    const dateRangeOptions: { label: string; value: DateRange }[] = [
        { label: '7 Days', value: '7days' },
        { label: '30 Days', value: '30days' },
        { label: '90 Days', value: '90days' }
    ];

    const metricOptions: { label: string; value: MetricType }[] = [
        { label: 'Bookings', value: 'bookings' },
        { label: 'Revenue', value: 'revenue' }
    ];

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-900">Analytics</Text>
                <Text className="text-sm text-gray-600">Track your business performance</Text>
            </View>

            {/* Metric Type Selector */}
            <View className="p-4">
                <View className="flex-row bg-gray-100 rounded-lg p-1">
                    {metricOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => setMetricType(option.value)}
                            className={`flex-1 py-2 px-4 rounded-md ${
                                metricType === option.value ? 'bg-white shadow-sm' : ''
                            }`}
                        >
                            <Text
                                className={`text-center font-medium ${
                                    metricType === option.value ? 'text-indigo-600' : 'text-gray-600'
                                }`}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Date Range Selector */}
            <View className="px-4 mb-4">
                <View className="flex-row gap-2">
                    {dateRangeOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => setDateRange(option.value)}
                            className={`py-1 px-3 rounded-full ${
                                dateRange === option.value
                                    ? 'bg-indigo-600'
                                    : 'bg-gray-100'
                            }`}
                        >
                            <Text
                                className={`text-sm font-medium ${
                                    dateRange === option.value ? 'text-white' : 'text-gray-600'
                                }`}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Chart */}
            <View className="bg-white p-4 mx-4 rounded-lg shadow-sm">
                <VictoryChart
                    width={width - 40}
                    height={300}
                    theme={VictoryTheme.material}
                    domainPadding={{ x: 20 }}
                >
                    <VictoryAxis
                        tickFormat={(x: any) => format(new Date(x), 'MMM dd')}
                        style={{
                            tickLabels: { fontSize: 10, padding: 5 }
                        }}
                    />
                    <VictoryAxis
                        dependentAxis
                        tickFormat={(y: any) => (metricType === 'revenue' ? `₹${y}` : y)}
                        style={{
                            tickLabels: { fontSize: 10, padding: 5 }
                        }}
                    />
                    <VictoryLine
                        data={analyticsData?.data || []}
                        x="date"
                        y="value"
                        style={{
                            data: { stroke: ANALYTICS_CONFIG.chartColors.primary }
                        }}
                    />
                </VictoryChart>
            </View>

            {/* Summary Cards */}
            <View className="flex-row flex-wrap p-4 gap-4">
                <View className="flex-1 bg-white p-4 rounded-lg shadow-sm">
                    <Text className="text-sm text-gray-600">Total {metricType === 'bookings' ? 'Bookings' : 'Revenue'}</Text>
                    <Text className="text-xl font-bold text-gray-900 mt-1">
                        {metricType === 'revenue' ? `₹${analyticsData?.total || 0}` : analyticsData?.total || 0}
                    </Text>
                </View>

                <View className="flex-1 bg-white p-4 rounded-lg shadow-sm">
                    <Text className="text-sm text-gray-600">Average per Day</Text>
                    <Text className="text-xl font-bold text-gray-900 mt-1">
                        {metricType === 'revenue' ? `₹${analyticsData?.average || 0}` : analyticsData?.average || 0}
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}