import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { DashboardHeader } from '../../components/dashboard/index.ts';
import { CourtRegistration } from './CourtRegistration.tsx';
import { router } from 'expo-router';

export default function CourtRegistrationScreen() {
    return <CourtRegistration onClose={() => router.back()} />;
}