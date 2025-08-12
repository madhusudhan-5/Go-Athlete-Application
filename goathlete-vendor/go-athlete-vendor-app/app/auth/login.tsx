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
import { Video, ResizeMode } from 'expo-av';

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

  // Animation refs for video fade/slide
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.spring(translateAnim, {
      toValue: 0,
      friction: 5,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, []);

  // Google Auth
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
              <View className="flex-col justify-start h-full items-center px-4 pt-4">

                {/* Sports Video with Animation */}
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: translateAnim }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 5,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  <Video
                    source={{
                      uri: 'https://videos.pexels.com/video-files/2290072/2290072-hd_1920_1080_24fps.mp4',
                    }}
                    style={{
                      width: 320,
                      height: 180,
                    }}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    shouldPlay
                    isMuted
                  />
                </Animated.View>

                {/* Welcome Text */}
                <View className="flex-col mb-6 mt-6">
                  <Text className="text-[28px] font-bold text-center text-black">
                    Welcome Back
                  </Text>
                  <Text className="text-[15px] text-center text-gray-600">
                    Sign in to access your account
                  </Text>
                </View>

                {/* Email Input */}
                <View className="flex-row items-center bg-gray-200 rounded-lg mb-4 px-4 w-[90%] h-[50px]">
                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ flex: 1, paddingVertical: 0 }}
                  />
                  <Ionicons name="mail-outline" size={22} color="gray" />
                </View>

                {/* Send OTP Button */}
                {!showOtp && (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    className="bg-blue-500 w-[300px] h-[45px] items-center justify-center rounded-lg mb-4"
                  >
                    <Text className="text-white font-semibold">Send OTP</Text>
                  </TouchableOpacity>
                )}

                {/* OTP Input */}
                {showOtp && (
                  <>
                    <View className="flex-row items-center bg-gray-200 rounded-lg mb-4 px-4 w-[90%] h-[50px]">
                      <TextInput
                        placeholder="Enter OTP"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                        style={{ flex: 1, paddingVertical: 0 }}
                      />
                      <Ionicons name="key-outline" size={22} color="gray" />
                    </View>

                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      className="bg-green-500 w-[300px] h-[45px] items-center justify-center rounded-lg mb-4"
                    >
                      <Text className="text-white font-semibold">Verify OTP</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* OR Divider */}
                <View className="flex-row items-center my-2 w-[80%]">
                  <View className="flex-1 h-[1px] bg-gray-400" />
                  <Text className="mx-2 text-gray-500">OR</Text>
                  <View className="flex-1 h-[1px] bg-gray-400" />
                </View>

                {/* Social Login Row */}
                <View className="flex-row gap-4 mt-2">
                  {/* Google */}
                  <TouchableOpacity
                    onPress={() => promptAsync()}
                    disabled={!request}
                    className="bg-white p-3 rounded-full border border-gray-300"
                  >
                    {/* Google logo with default colors */}
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

                  {/* Apple */}
                  {Platform.OS === 'ios' && (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={50}
                      style={{ width: 50, height: 50 }}
                      onPress={async () => {
                        try {
                          const credential = await AppleAuthentication.signInAsync({
                            requestedScopes: [
                              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                              AppleAuthentication.AppleAuthenticationScope.EMAIL,
                            ],
                          });
                          console.log('Apple Auth:', credential);
                          router.replace('/dashboard');
                        } catch (e) {
                          if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code !== 'ERR_CANCELED') {
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
