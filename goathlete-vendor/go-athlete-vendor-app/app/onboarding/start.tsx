import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import useApi from '../../services/api.ts';

interface BusinessType {
  id: 'VENUE' | 'COACH' | 'ECOMMERCE';
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  description: string;
}

interface BusinessTypeCardProps {
  type: BusinessType;
  onSelect: (id: BusinessType['id']) => void;
  isSelected: boolean;
}

const businessTypes: BusinessType[] = [
  {
    id: 'VENUE',
    title: 'Sports Venue',
    icon: 'stadium',
    description: 'For sports facilities, courts, and training centers',
  },
  {
    id: 'COACH',
    title: 'Sports Coach',
    icon: 'sports',
    description: 'For individual coaches and trainers',
  },
  {
    id: 'ECOMMERCE',
    title: 'Sports Equipment Store',
    icon: 'store',
    description: 'For sports equipment and merchandise sellers',
  },
];

interface BusinessType {
  id: 'VENUE' | 'COACH' | 'ECOMMERCE';
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  description: string;
}

interface BusinessTypeCardProps {
  type: BusinessType;
  onSelect: (id: BusinessType['id']) => void;
  isSelected: boolean;
}

const BusinessTypeCard: React.FC<BusinessTypeCardProps> = ({ type, onSelect, isSelected }) => (
  <TouchableOpacity
    style={[
      styles.card,
      isSelected && styles.selectedCard,
    ]}
    onPress={() => onSelect(type.id)}
  >
    <MaterialIcons
      name={type.icon}
      size={40}
      color={isSelected ? '#FFF' : '#000'}
    />
    <Text style={[
      styles.cardTitle,
      isSelected && styles.selectedText
    ]}>
      {type.title}
    </Text>
    <Text style={[
      styles.cardDescription,
      isSelected && styles.selectedText
    ]}>
      {type.description}
    </Text>
  </TouchableOpacity>
);

export default function OnboardingStart() {
  const [selectedType, setSelectedType] = useState<BusinessType['id'] | null>(null);
  const [loading, setLoading] = useState(false);
  const { api } = useApi();

  const handleContinue = async () => {
    if (!selectedType) return;

    setLoading(true);
    try {
      const response = await api.post('/onboarding/start/', {
        vendor_type: selectedType,
      });
      
      if (response.data) {
        router.push('/auth/onboarding/legal-details' as any);
      }
    } catch (error) {
      console.error('Error starting onboarding:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.title}>Welcome to Go-Athlete</Text>
        <Text style={styles.subtitle}>
          Let's get started with your business profile
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          Select your business type
        </Text>
        
        {businessTypes.map((type) => (
          <BusinessTypeCard
            key={type.id}
            type={type}
            onSelect={(id) => setSelectedType(id)}
            isSelected={selectedType === type.id}
          />
        ))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedType && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!selectedType || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  logo: {
    width: 120,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    backgroundColor: '#007AFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#FFF',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});