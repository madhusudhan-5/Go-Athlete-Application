import React from 'react';
import { View, Text as RNText, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { DashboardCard } from '../../components/dashboard/DashboardCard.tsx';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader.tsx';
const Text = RNText;

interface DashboardData {
  todayBookings: number;
  tomorrowBookings: number;
  totalEarnings: number;
  activeOffers: number;
}

interface QuickLink {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}

type RootStackParamList = {
  CourtRegistration: undefined;
  CourtManagement: undefined;
  Analytics: undefined;
  OfferManagement: undefined;
};

type AppNavigationProp = any;

export const VendorDashboard = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const navigation = useNavigation<AppNavigationProp>();
  
  const { data: dashboardData, refetch } = useQuery<DashboardData>({
    queryKey: ['vendorDashboard'],
    queryFn: async () => {
      // TODO: Implement API call
      return {
        todayBookings: 12,
        tomorrowBookings: 8,
        totalEarnings: 2500,
        activeOffers: 3
      };
    }
  });

  const quickLinks: QuickLink[] = [
    {
      title: 'Add Court',
      icon: 'add-business',
      onPress: () => navigation.navigate('CourtRegistration')
    },
    {
      title: 'Manage Courts',
      icon: 'sports-tennis',
      onPress: () => navigation.navigate('CourtManagement')
    },
    {
      title: 'View Analytics',
      icon: 'analytics',
      onPress: () => navigation.navigate('Analytics')
    },
    {
      title: 'Manage Offers',
      icon: 'local-offer',
      onPress: () => navigation.navigate('OfferManagement')
    }
  ];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refetch} />
      }
    >
      <DashboardHeader 
        title="Vendor Dashboard"
        subtitle="Welcome back!"
      />

      {/* Stats Cards */}
      <View className="flex-row flex-wrap p-4 gap-4">
        <DashboardCard
          title="Today's Bookings"
          value={dashboardData?.todayBookings || 0}
          icon={<MaterialIcons name="today" size={24} color="#4B5563" />}
        />
        <DashboardCard
          title="Tomorrow's Bookings"
          value={dashboardData?.tomorrowBookings || 0}
          icon={<MaterialIcons name="event" size={24} color="#4B5563" />}
        />
        <DashboardCard
          title="Total Earnings"
          value={`₹${dashboardData?.totalEarnings || 0}`}
          icon={<MaterialIcons name="account-balance-wallet" size={24} color="#4B5563" />}
        />
        <DashboardCard
          title="Active Offers"
          value={dashboardData?.activeOffers || 0}
          icon={<MaterialIcons name="local-offer" size={24} color="#4B5563" />}
        />
      </View>

      {/* Quick Links */}
      <View className="p-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-semibold mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-4">
            {quickLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                className="flex-1 min-w-[140px] items-center bg-gray-50 p-4 rounded-lg"
                onPress={link.onPress}
              >
                <MaterialIcons name={link.icon} size={28} color="#4F46E5" />
                <Text className="mt-2 text-sm font-medium text-gray-700">
                  {link.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};