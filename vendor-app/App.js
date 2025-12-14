import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

import { VendorProvider, useVendor } from './src/context/VendorContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/components/Toast';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AddVenueScreen from './src/screens/AddVenueScreen';
import AddCourtScreen from './src/screens/AddCourtScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import BookingDetailScreen from './src/screens/BookingDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SlotGeneratorScreen from './src/screens/SlotGeneratorScreen';
import PayoutsScreen from './src/screens/PayoutsScreen';
import VenueListScreen from './src/screens/VenueListScreen';
import CourtListScreen from './src/screens/CourtListScreen';
import OfferListScreen from './src/screens/OfferListScreen';
import OfferFormScreen from './src/screens/OfferFormScreen';
import CoachListScreen from './src/screens/CoachListScreen';
import ProductListScreen from './src/screens/ProductListScreen';
import MembershipListScreen from './src/screens/MembershipListScreen';
import OrderListScreen from './src/screens/OrderListScreen';
import PendingApprovalScreen from './src/screens/PendingApprovalScreen';
import SplashScreen from './src/screens/SplashScreen';
import AddCoachScreen from './src/screens/AddCoachScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import AddMembershipScreen from './src/screens/AddMembershipScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SearchScreen from './src/screens/SearchScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, colors }) {
  const iconMap = {
    Dashboard: '📊',
    Calendar: '📅',
    Bookings: '📋',
    Venues: '🏢',
    Settings: '⚙️',
    Coaches: '🏃',
    Products: '🛒',
    Orders: '📦',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{iconMap[name] || '📌'}</Text>
      <Text style={{ 
        fontSize: 10, 
        color: focused ? colors.accent : colors.onSurfaceVariant,
        marginTop: 2,
      }}>
        {name}
      </Text>
    </View>
  );
}

function VenueOwnerTabs() {
  const { colors, isDark } = useTheme();
  
  const tabScreenOptions = ({ route }) => ({
    tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} colors={colors} />,
    tabBarShowLabel: false,
    tabBarStyle: {
      backgroundColor: colors.tabBar,
      borderTopWidth: 0,
      height: 60,
      paddingTop: 8,
    },
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: colors.onPrimary,
    headerTitleStyle: { fontWeight: '600' },
  });

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Venues" component={VenueListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function CoachOnlyTabs() {
  const { colors } = useTheme();
  
  const tabScreenOptions = ({ route }) => ({
    tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} colors={colors} />,
    tabBarShowLabel: false,
    tabBarStyle: {
      backgroundColor: colors.tabBar,
      borderTopWidth: 0,
      height: 60,
      paddingTop: 8,
    },
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: colors.onPrimary,
    headerTitleStyle: { fontWeight: '600' },
  });

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Coaches" component={CoachListScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function EcomOnlyTabs() {
  const { colors } = useTheme();
  
  const tabScreenOptions = ({ route }) => ({
    tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} colors={colors} />,
    tabBarShowLabel: false,
    tabBarStyle: {
      backgroundColor: colors.tabBar,
      borderTopWidth: 0,
      height: 60,
      paddingTop: 8,
    },
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: colors.onPrimary,
    headerTitleStyle: { fontWeight: '600' },
  });

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductListScreen} />
      <Tab.Screen name="Orders" component={OrderListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function VenueCoachTabs() {
  const { colors } = useTheme();
  
  const tabScreenOptions = ({ route }) => ({
    tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} colors={colors} />,
    tabBarShowLabel: false,
    tabBarStyle: {
      backgroundColor: colors.tabBar,
      borderTopWidth: 0,
      height: 60,
      paddingTop: 8,
    },
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: colors.onPrimary,
    headerTitleStyle: { fontWeight: '600' },
  });

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Venues" component={VenueListScreen} />
      <Tab.Screen name="Coaches" component={CoachListScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AllServicesTabs() {
  const { colors } = useTheme();
  
  const tabScreenOptions = ({ route }) => ({
    tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} colors={colors} />,
    tabBarShowLabel: false,
    tabBarStyle: {
      backgroundColor: colors.tabBar,
      borderTopWidth: 0,
      height: 60,
      paddingTop: 8,
    },
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: colors.onPrimary,
    headerTitleStyle: { fontWeight: '600' },
  });

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Venues" component={VenueListScreen} />
      <Tab.Screen name="Products" component={ProductListScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function MainTabs() {
  const { vendorType, vendorStatus, isLoading } = useVendor();
  const { colors } = useTheme();
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>Loading...</Text>
      </View>
    );
  }
  
  switch (vendorType) {
    case 'COACH':
      return <CoachOnlyTabs />;
    case 'ECOM':
      return <EcomOnlyTabs />;
    case 'VENUE_COACH':
      return <VenueCoachTabs />;
    case 'ALL':
      return <AllServicesTabs />;
    case 'VENUE':
    default:
      return <VenueOwnerTabs />;
  }
}

function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { vendorStatus, isLoading: vendorLoading } = useVendor();
  
  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.outline,
      notification: colors.error,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900',
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PendingApproval" 
          component={PendingApprovalScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Main" 
          component={MainTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen name="AddVenue" component={AddVenueScreen} options={{ title: 'Add Venue' }} />
        <Stack.Screen name="EditVenue" component={AddVenueScreen} options={{ title: 'Edit Venue' }} />
        <Stack.Screen name="AddCourt" component={AddCourtScreen} options={{ title: 'Add Court' }} />
        <Stack.Screen name="EditCourt" component={AddCourtScreen} options={{ title: 'Edit Court' }} />
        <Stack.Screen name="CourtList" component={CourtListScreen} options={{ title: 'Courts' }} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
        <Stack.Screen name="SlotGenerator" component={SlotGeneratorScreen} options={{ title: 'Slot Generator' }} />
        <Stack.Screen name="Payouts" component={PayoutsScreen} options={{ title: 'Payouts' }} />
        <Stack.Screen name="Offers" component={OfferListScreen} options={{ title: 'Offers' }} />
        <Stack.Screen name="AddOffer" component={OfferFormScreen} options={{ title: 'Add Offer' }} />
        <Stack.Screen name="EditOffer" component={OfferFormScreen} options={{ title: 'Edit Offer' }} />
        <Stack.Screen name="Coaches" component={CoachListScreen} options={{ title: 'Coaches' }} />
        <Stack.Screen name="Products" component={ProductListScreen} options={{ title: 'Products' }} />
        <Stack.Screen name="Orders" component={OrderListScreen} options={{ title: 'Orders' }} />
        <Stack.Screen name="Memberships" component={MembershipListScreen} options={{ title: 'Memberships' }} />
        <Stack.Screen name="AddCoach" component={AddCoachScreen} options={{ title: 'Add Coach' }} />
        <Stack.Screen name="EditCoach" component={AddCoachScreen} options={{ title: 'Edit Coach' }} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add Product' }} />
        <Stack.Screen name="EditProduct" component={AddProductScreen} options={{ title: 'Edit Product' }} />
        <Stack.Screen name="AddMembership" component={AddMembershipScreen} options={{ title: 'Add Membership' }} />
        <Stack.Screen name="EditMembership" component={AddMembershipScreen} options={{ title: 'Edit Membership' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search', headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppWithTheme() {
  const { colors, isDark, isLoading: themeLoading } = useTheme();
  
  const paperTheme = isDark ? {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      surface: colors.surface,
      surfaceVariant: colors.surfaceVariant,
      onSurface: colors.onSurface,
      onSurfaceVariant: colors.onSurfaceVariant,
      error: colors.error,
    },
  } : {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      surface: colors.surface,
      surfaceVariant: colors.surfaceVariant,
      onSurface: colors.onSurface,
      onSurfaceVariant: colors.onSurfaceVariant,
      error: colors.error,
    },
  };

  if (themeLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F7' }}>
        <ActivityIndicator size="large" color="#0A1F35" />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <VendorProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </VendorProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppWithTheme />
    </ThemeProvider>
  );
}
