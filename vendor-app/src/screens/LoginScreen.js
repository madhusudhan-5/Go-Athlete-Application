import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions
} from 'react-native';
import { colors, spacing, shape, elevation, typography } from '../theme';
import { authService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function LoginScreen({ navigation }) {
  const { setVendorId, setVendorType, setVendorStatus } = useVendor();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleLogin = async () => {
    if (!email || !password) {
      if (Platform.OS === 'web') {
        setErrorMessage('Please enter email and password');
      } else {
        Alert.alert('Required', 'Please enter email and password');
      }
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authService.login(email, password);
      if (response.vendor) {
        await setVendorId(response.vendor.id);
        await setVendorType(response.vendor.vendor_type || 'VENUE');
        await setVendorStatus(response.vendor.status || 'PENDING');
        
        const vendorStatus = response.vendor.status || 'PENDING';
        if (vendorStatus === 'APPROVED') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'PendingApproval' }],
          });
        }
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Invalid credentials';
      if (Platform.OS === 'web') {
        setErrorMessage(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onPressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const cardStyle = [
    styles.card,
    isWeb && width > 480 && styles.cardWeb
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.innerContainer}>
        <View style={cardStyle}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Redefining </Text>
            <Text style={styles.logoAccent}>Sports</Text>
          </View>
          <Text style={styles.title}>Vendor App</Text>
          <Text style={styles.subtitle}>Sign in to manage your business</Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input, 
                emailFocused && styles.inputFocused
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor={colors.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[
                styles.input,
                passwordFocused && styles.inputFocused
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={colors.outline}
              secureTextEntry
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={loading}
              activeOpacity={1}
            >
              <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerBtnText}>Create New Account</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>New vendor? Register to get started</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: shape.corner,
    padding: spacing.xl,
    ...elevation.level3,
  },
  cardWeb: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  logoAccent: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.secondary,
  },
  title: {
    ...typography.headline,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 1,
    borderRadius: shape.cornerSmall,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#721c24',
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: shape.corner,
    padding: spacing.md,
    ...typography.bodyLarge,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...elevation.level2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    ...typography.label,
    color: colors.onPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  dividerText: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginHorizontal: spacing.md,
  },
  registerBtn: {
    backgroundColor: colors.background,
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  registerBtnText: {
    ...typography.label,
    color: colors.secondary,
  },
  hint: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
