import { Stack } from "expo-router";
import './global.css'

export default function RootLayout() {
  return <Stack>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="splash/SplashScreen" options={{ headerShown: false }} />
    <Stack.Screen name="onboarding/OnboardingScreen" options={{ headerShown: false }} />
    <Stack.Screen name="auth/login" options={{ headerShown: false }} />

  </Stack>;
}
