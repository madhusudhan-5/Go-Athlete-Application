import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind/styled';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    type: 'up' | 'down';
    value: string;
  };
  onPress?: () => void;
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend,
  onPress,
}) => {
  return (
    <StyledTouchableOpacity
      onPress={onPress}
      className="bg-white p-4 rounded-xl shadow-sm flex-1 min-w-[150px]"
    >
      <StyledView className="flex-row justify-between items-start mb-2">
        <StyledText className="text-gray-600 text-sm font-medium">
          {title}
        </StyledText>
        {icon && <StyledView>{icon}</StyledView>}
      </StyledView>
      
      <StyledText className="text-2xl font-bold text-gray-900 mb-1">
        {value}
      </StyledText>
      
      {trend && (
        <StyledView 
          className={`flex-row items-center ${
            trend.type === 'up' ? 'bg-green-50' : 'bg-red-50'
          } px-2 py-1 rounded-full self-start`}
        >
          <StyledText
            className={`text-xs ${
              trend.type === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.type === 'up' ? '↑' : '↓'} {trend.value}
          </StyledText>
        </StyledView>
      )}
    </StyledTouchableOpacity>
  );
};