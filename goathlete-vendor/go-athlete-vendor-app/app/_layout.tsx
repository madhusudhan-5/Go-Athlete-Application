import { Stack } from "expo-router";
import '../polyfill';
import './global.css';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="/" options={{ headerShown: false }} />
      <Stack.Screen name="/splash/SplashScreen" options={{ headerShown: false }} />
      <Stack.Screen name="/onboarding/OnboardingScreen" options={{ headerShown: false }} />
      <Stack.Screen name="/auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="/auth/signup" options={{ headerShown: false }} />
      <Stack.Screen name="/booking/SelectService" options={{ title: 'Select Service' }} />
      <Stack.Screen name="/booking/SlotPicker" options={{ title: 'Choose Time Slot' }} />
      <Stack.Screen name="/booking/PaymentScreen" options={{ title: 'Payment' }} />
      <Stack.Screen name="/booking/Success" options={{ title: 'Booking Confirmed', headerShown: false }} />
      <Stack.Screen name="/dashboard" options={{ headerShown: false }} />
    </Stack>
  );
}
