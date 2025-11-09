import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-4">
      {icon && <View className="mb-4">{icon}</View>}
      
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        {title}
      </Text>
      
      <Text className="text-gray-600 text-center mb-6">
        {message}
      </Text>
      
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};