import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  rightComponent,
}) => {
  const navigation = useNavigation();

  return (
    <View className="px-4 py-3 bg-white border-b border-gray-200">
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-xl font-bold text-gray-900">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-gray-600 mt-1">{subtitle}</Text>
          )}
        </View>
        {rightComponent && (
          <View>{rightComponent}</View>
        )}
      </View>
    </View>
  );
};