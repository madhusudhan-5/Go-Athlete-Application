import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Animated,
  Alert,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, { G, Path } from 'react-native-svg';
import { apiService } from '../../services/api';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  webClientId: 'YOUR_WEB_CLIENT_ID',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
};

// Set your desired background color here:
const SCREEN_BACKGROUND_COLOR = 'rgb(250, 235, 215)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BACKGROUND_COLOR,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: SCREEN_BACKGROUND_COLOR,
  },
  mainView: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: SCREEN_BACKGROUND_COLOR,
  },
  // Logo animates in from the left edge with fade effect.
  logoAnimated: {
    marginBottom: 20,
    borderRadius: 40,
    // The animation (in the component) should combine translateX (from -width to 0) and opacity (from 0 to 1)
    // No static shadow here; shadow is on the image itself for 3D effect.
  },
  logoContainer: {
    width: 250,
    height: 250,
    borderRadius: 20,
    overflow: 'visible', // allow shadow to show outside
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    // Blue box shadow with more depth, no blur
    shadowColor: '#DA6F2B', // blue
    shadowOffset: { width: -20, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 40, // for Android, higher for more depth, less blur
  },
  logoSide: {
    // This can be omitted or used for a subtle edge highlight if desired.
    display: 'none',
  },
  logoLeft: {
    display: 'none',
  },
  logoRight: {
    display: 'none',
  },
  logoImage: {
    width: 250,
    height: 250,
    borderRadius: 20,
    resizeMode: 'cover',
    // Blue box shadow with more depth, no blur
    shadowColor: '#DA6F2B', // blue
    shadowOffset: { width: 20, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 40, // for Android, higher for more depth, less blur
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#222',
  },
  subtitleText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    color: '#636363',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    borderColor: '#000000',
    borderWidth:1,
    marginBottom: 14,
    paddingHorizontal: 12,
    width: '100%',
    height: 50,
  },
  textInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    color: '#222',
  },
  otpInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
  },
  sendOtpBtn: {
    backgroundColor: "#0A1F35",
    width: '100%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  sendOtpText: {
    color: "#fff",
    fontWeight: 'bold',
    fontSize: 16,
  },
  verifyOtpBtn: {
    backgroundColor: "#34a853",
    width: '100%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  verifyOtpText: {
    color: "#fff",
    fontWeight: 'bold',
    fontSize: 16,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: '80%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCC',
  },
  orText: {
    marginHorizontal: 7,
    color: '#AAA',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 10,
  },
  googleBtn: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  appleBtn: {
    width: 50,
    height: 50,
  },
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const router = useRouter();

  // Animation refs for sports logo and header
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Set status bar style to dark-content for black icons on both iOS and Android
  useEffect(() => {
    // This will set the status bar icons to black for the entire journey
    // If you use react-navigation, you may want to set this globally in your navigation container
    // but for this screen and all children, this is sufficient
    StatusBar.setBarStyle('dark-content', true);
    if (Platform.OS === 'android') {
      // On Android, set background color to match your screen for best effect
      StatusBar.setBackgroundColor(SCREEN_BACKGROUND_COLOR, true);
      StatusBar.setTranslucent(false);
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest(GOOGLE_CLIENT_IDS);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleAuth(response.authentication);
    }
  }, [response]);

  const handleGoogleAuth = useCallback(async (authData: any) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${authData.accessToken}`
      );
      const userInfo = await userInfoResponse.json();

      // Send to backend for authentication
      const data = await apiService.socialLogin({
        email: userInfo.email,
        name: userInfo.name,
        provider_id: userInfo.id,
        auth_provider: 'google',
      });

      // Store token and user data
      apiService.setToken(data.access_token);
      console.log('Google authentication successful:', data);
      
      if (data.is_new_user) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'Failed to authenticate with Google');
    }
  }, [router]);

  const handleAppleAuth = useCallback(async (credential: any) => {
    try {
      const fullName = credential.fullName;
      const name = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : null;

      // Send to backend for authentication
      const data = await apiService.socialLogin({
        email: credential.email,
        name: name,
        provider_id: credential.user,
        auth_provider: 'apple',
      });

      // Store token and user data
      apiService.setToken(data.access_token);
      console.log('Apple authentication successful:', data);
      
      if (data.is_new_user) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Apple auth error:', error);
      Alert.alert('Error', 'Failed to authenticate with Apple');
    }
  }, [router]);

  const handleSendOtp = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Please enter your email');
      return;
    }
    
    try {
      await apiService.sendOTP(email.trim());
      setShowOtp(true);
      Alert.alert('OTP Sent', 'Please check your email for the verification code');
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    }
  }, [email]);

  const handleVerifyOtp = useCallback(() => {
    if (otp.length === 6) {
      // Navigate to OTP verification screen with email parameter
      router.push({
        pathname: '/auth/otp-verification',
        params: { email: email.trim().toLowerCase() }
      });
    } else {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
    }
  }, [otp, email, router]);

  return (
    <SafeAreaProvider>
      {/* StatusBar component for correct style on all platforms */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={SCREEN_BACKGROUND_COLOR}
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: SCREEN_BACKGROUND_COLOR }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              style={{ backgroundColor: SCREEN_BACKGROUND_COLOR }}
            >
              <View style={styles.mainView}>
                {/* Animated Sports Logo */}
                <Animated.View
                  style={[
                    styles.logoAnimated,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <View style={styles.logoContainer}>
                    <View style={[styles.logoSide, styles.logoLeft]} />
                    <Image
                      source={require('../../assets/images/loginimage.png')}
                      style={styles.logoImage}
                    />
                    <View style={[styles.logoSide, styles.logoRight]} />
                  </View>
                </Animated.View>

                {/* Welcome Text */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                  <Text style={styles.welcomeText}>Welcome Back</Text>
                  <Text style={styles.subtitleText}>Sign in to access your account</Text>
                </Animated.View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                  <Ionicons name="mail-outline" size={22} color="#888" />
                </View>

                {/* Send OTP Button */}
                {!showOtp && (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    style={styles.sendOtpBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sendOtpText}>Send OTP</Text>
                  </TouchableOpacity>
                )}

                {/* OTP Input */}
                {showOtp && (
                  <>
                    <View style={styles.inputContainer}>
                      <TextInput
                        placeholder="Enter OTP"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                        style={styles.otpInput}
                        autoFocus
                        autoComplete="one-time-code"
                        textContentType="oneTimeCode"
                      />
                      <Ionicons name="key-outline" size={22} color="#888" />
                    </View>
                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      style={styles.verifyOtpBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.verifyOtpText}>Verify OTP</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* OR Divider */}
                <View style={styles.orDivider}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Social Login Row */}
                <View style={styles.socialRow}>
                  {/* Google Login */}
                  <TouchableOpacity
                    onPress={() => promptAsync()}
                    disabled={!request}
                    style={styles.googleBtn}
                    activeOpacity={0.8}
                  >
                    <View style={styles.googleIcon}>
                      <Svg width={24} height={24} viewBox="0 0 24 24">
                        <G>
                          <Path
                            d="M21.6 12.227c0-.818-.073-1.604-.209-2.364H12v4.482h5.352a4.58 4.58 0 01-1.983 3.008v2.497h3.204c1.874-1.728 2.957-4.277 2.957-7.623z"
                            fill="#4285F4"
                          />
                          <Path
                            d="M12 22c2.7 0 4.968-.893 6.624-2.423l-3.204-2.497c-.889.597-2.023.951-3.42.951-2.63 0-4.857-1.775-5.656-4.162H3.02v2.615A9.997 9.997 0 0012 22z"
                            fill="#34A853"
                          />
                          <Path
                            d="M6.344 13.869A5.996 5.996 0 016 12c0-.648.111-1.276.312-1.869V7.516H3.02A9.997 9.997 0 002 12c0 1.648.396 3.207 1.02 4.484l3.324-2.615z"
                            fill="#FBBC05"
                          />
                          <Path
                            d="M12 6.578c1.473 0 2.793.507 3.834 1.504l2.875-2.875C16.968 3.893 14.7 3 12 3A9.997 9.997 0 003.02 7.516l3.324 2.615C7.143 8.353 9.37 6.578 12 6.578z"
                            fill="#EA4335"
                          />
                        </G>
                      </Svg>
                    </View>
                  </TouchableOpacity>

                  {/* Apple Login (iOS only) */}
                  {Platform.OS === 'ios' && (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={30}
                      style={styles.appleBtn}
                      onPress={async () => {
                        try {
                          const credential = await AppleAuthentication.signInAsync({
                            requestedScopes: [
                              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                              AppleAuthentication.AppleAuthenticationScope.EMAIL,
                            ],
                          });
                          
                          if (credential.email) {
                            await handleAppleAuth(credential);
                          }
                        } catch (e) {
                          if (
                            typeof e === 'object' &&
                            e !== null &&
                            'code' in e &&
                            e.code !== 'ERR_CANCELED'
                          ) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to authenticate with Apple');
                          }
                        }
                      }}
                    />
                  )}
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
