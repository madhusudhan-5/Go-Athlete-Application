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
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native'; // Add this package if missing

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, { G, Path } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const router = useRouter();

  // Animation refs for sports logo and header
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6,
      tension: 50,
    }).start();
  }, []);

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: 'YOUR_WEB_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      router.replace('/dashboard');
    }
  }, [response, router]);

  const handleSendOtp = () => {
    if (!email) {
      Alert.alert('Please enter your email');
      return;
    }
    console.log('OTP sent to:', email);
    setShowOtp(true);
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      router.replace('/dashboard');
    } else {
      Alert.alert('Invalid OTP');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ flexDirection: 'column', justifyContent: 'flex-start', height: '100%', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40 }}>
                {/* Animated Sports Logo */}
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    marginBottom: 20,
                    borderRadius: 40,
                    elevation: 8,
                  }}
                >
                  <LottieView
                    source={require('../../assets/lottie/football-loader.json')} // Place Lottie JSON here
                    autoPlay
                    loop
                    style={{ width: 110, height: 110 }}
                  />
                </Animated.View>

                {/* Welcome Text */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                  <Text style={{ fontSize: 30, fontWeight: 'bold', textAlign: 'center', color: '#222' }}>
                    Welcome Back
                  </Text>
                  <Text style={{ fontSize: 15, textAlign: 'center', marginBottom: 28, color: '#636363' }}>
                    Sign in to access your account
                  </Text>
                </Animated.View>

                {/* Email Input */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F2F2F2',
                  borderRadius: 16,
                  marginBottom: 14,
                  paddingHorizontal: 12,
                  width: '100%',
                  height: 50,
                }}>
                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ flex: 1, paddingVertical: 0, fontSize: 16 }}
                  />
                  <Ionicons name="mail-outline" size={22} color="#888" />
                </View>

                {/* Send OTP Button */}
                {!showOtp && (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    style={{
                      backgroundColor: "#1877f2",
                      width: '100%',
                      height: 45,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 12,
                      marginBottom: 15,
                      elevation: 3,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: 'bold', fontSize: 16 }}>Send OTP</Text>
                  </TouchableOpacity>
                )}

                {/* OTP Input */}
                {showOtp && (
                  <>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F2F2F2',
                      borderRadius: 16,
                      marginBottom: 14,
                      paddingHorizontal: 12,
                      width: '100%',
                      height: 50,
                    }}>
                      <TextInput
                        placeholder="Enter OTP"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                        style={{ flex: 1, paddingVertical: 0, fontSize: 16 }}
                      />
                      <Ionicons name="key-outline" size={22} color="#888" />
                    </View>
                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      style={{
                        backgroundColor: "#34a853",
                        width: '100%',
                        height: 45,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 12,
                        marginBottom: 15,
                        elevation: 3,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: 'bold', fontSize: 16 }}>Verify OTP</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* OR Divider */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, width: '80%' }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#CCC' }} />
                  <Text style={{ marginHorizontal: 7, color: '#AAA' }}>OR</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#CCC' }} />
                </View>

                {/* Social Login Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 10 }}>
                  {/* Google Login */}
                  <TouchableOpacity
                    onPress={() => promptAsync()}
                    disabled={!request}
                    style={{
                      backgroundColor: '#fff',
                      padding: 12,
                      borderRadius: 30,
                      borderWidth: 1,
                      borderColor: '#eee',
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 2,
                    }}
                  >
                    <View style={{ width: 24, height: 24 }}>
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
                      style={{ width: 50, height: 50 }}
                      onPress={async () => {
                        try {
                          const credential = await AppleAuthentication.signInAsync({
                            requestedScopes: [
                              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                              AppleAuthentication.AppleAuthenticationScope.EMAIL,
                            ],
                          });
                          router.replace('/dashboard');
                        } catch (e) {
                          if (
                            typeof e === 'object' &&
                            e !== null &&
                            'code' in e &&
                            (e).code !== 'ERR_CANCELED'
                          ) {
                            console.error(e);
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
