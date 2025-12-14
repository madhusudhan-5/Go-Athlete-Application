import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { colors, spacing, typography, elevation } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { useVendor } from '../context/VendorContext';

const logoImage = require('../../assets/logo.png');

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { setVendorId, setVendorStatus, setVendorType } = useVendor();
  
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const loaderProgress = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startAnimations();
    checkAuthStatus();
  }, []);

  const startAnimations = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(loaderProgress, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const checkAuthStatus = async () => {
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        await fadeOutAndNavigate('Login');
        return;
      }

      const response = await authService.checkStatus();
      const vendor = response.vendor;

      if (vendor) {
        await setVendorId(vendor.id);
        await setVendorStatus(vendor.status);
        if (vendor.vendor_type) {
          await setVendorType(vendor.vendor_type);
        }

        if (vendor.status === 'APPROVED') {
          await fadeOutAndNavigate('Main');
        } else {
          await fadeOutAndNavigate('PendingApproval');
        }
      } else {
        await fadeOutAndNavigate('Login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await fadeOutAndNavigate('Login');
    }
  };

  const fadeOutAndNavigate = (screenName) => {
    return new Promise((resolve) => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: screenName }],
        });
        resolve();
      });
    });
  };

  const loaderWidth = loaderProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            }
          ]}
        >
          <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>

        <Animated.View style={[styles.subtitleContainer, { opacity: textOpacity }]}>
          <Text style={styles.subtitle}>Vendor Portal</Text>
          <Text style={styles.tagline}>Manage your sports business</Text>
        </Animated.View>

        <Animated.View style={[styles.loaderContainer, { opacity: textOpacity }]}>
          <View style={styles.loaderTrack}>
            <Animated.View style={[styles.loaderFill, { width: loaderWidth }]} />
          </View>
          <Text style={styles.loadingText}>Loading...</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sports Facility Platform</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoImage: {
    width: 280,
    height: 100,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  subtitle: {
    ...typography.headlineMedium,
    color: colors.surface,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  tagline: {
    ...typography.bodyLarge,
    color: colors.surface + 'CC',
  },
  loaderContainer: {
    width: Math.min(width * 0.6, 240),
    alignItems: 'center',
  },
  loaderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface + '40',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  loadingText: {
    ...typography.labelMedium,
    color: colors.surface + 'AA',
    marginTop: spacing.md,
  },
  footer: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.surface + '80',
  },
  versionText: {
    ...typography.labelSmall,
    color: colors.surface + '60',
    marginTop: spacing.xs,
  },
});
