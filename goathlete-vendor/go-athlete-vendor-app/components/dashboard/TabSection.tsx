import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface Tab {
  id: string;
  label: string;
}

interface TabSectionProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabSection: React.FC<TabSectionProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="bg-white border-b border-gray-200"
    >
      <View className="flex-row px-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            className={`py-3 px-4 border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500'
                : 'border-transparent'
            }`}
          >
            <Text
              className={`${
                activeTab === tab.id
                  ? 'text-blue-500 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};