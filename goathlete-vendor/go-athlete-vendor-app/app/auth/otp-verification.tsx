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
  Dimensions,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';

const { width, height } = Dimensions.get('window');

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
    justifyContent: 'center',
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: SCREEN_BACKGROUND_COLOR,
  },
  cardContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A1F35',
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    width: '100%',
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    backgroundColor: '#FAFAFA',
  },
  otpInputFocused: {
    borderColor: '#0A1F35',
    backgroundColor: '#ffffff',
    shadowColor: '#0A1F35',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verifyBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0A1F35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  resendBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendBtnText: {
    fontSize: 14,
    color: '#0A1F35',
    fontWeight: '600',
  },
  timerText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
});

export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  
  const inputRefs = useRef<TextInput[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Set status bar style
  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(SCREEN_BACKGROUND_COLOR, true);
      StatusBar.setTranslucent(false);
    }
  }, []);

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleOtpChange = useCallback((value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleVerifyOtp = useCallback(async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    
    try {
      const data = await apiService.verifyOTP(email, otpString);
      
      // Store token and user data
      apiService.setToken(data.access_token);
      console.log('Authentication successful:', data);
      
      if (data.is_new_user) {
        // Navigate to onboarding or profile setup
        router.replace('/onboarding');
      } else {
        // Navigate to dashboard
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [otp, email, router]);

  const handleResendOtp = useCallback(async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    
    try {
      await apiService.sendOTP(email);
      
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your email');
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [canResend, email]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaProvider>
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
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={handleBack}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>

                {/* OTP Verification Card */}
                <Animated.View
                  style={[
                    styles.cardContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    <Ionicons name="mail" size={40} color="#0A1F35" />
                  </View>

                  {/* Title */}
                  <Text style={styles.titleText}>Verify Your Email</Text>
                  <Text style={styles.subtitleText}>
                    We've sent a 6-digit verification code to
                  </Text>
                  <Text style={styles.emailText}>{email}</Text>

                  {/* OTP Input Fields */}
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          if (ref) inputRefs.current[index] = ref;
                        }}
                        style={[
                          styles.otpInput,
                          digit ? styles.otpInputFocused : null,
                        ]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        keyboardType="numeric"
                        maxLength={1}
                        autoFocus={index === 0}
                        selectTextOnFocus
                        textContentType="oneTimeCode"
                      />
                    ))}
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    style={styles.verifyBtn}
                    activeOpacity={0.8}
                    disabled={isLoading || otp.join('').length !== 6}
                  >
                    <LinearGradient
                      colors={['#0A1F35', '#1a3a5c']}
                      style={styles.verifyBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <Ionicons name="refresh" size={20} color="#ffffff" />
                          <Text style={styles.verifyBtnText}>Verifying...</Text>
                        </View>
                      ) : (
                        <Text style={styles.verifyBtnText}>Verify OTP</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Resend OTP */}
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code?</Text>
                    {canResend ? (
                      <TouchableOpacity
                        style={styles.resendBtn}
                        onPress={handleResendOtp}
                        disabled={isLoading}
                      >
                        <Text style={styles.resendBtnText}>Resend</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.timerText}>
                        Resend in {timer}s
                      </Text>
                    )}
                  </View>
                </Animated.View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
