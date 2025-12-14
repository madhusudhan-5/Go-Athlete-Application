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
  useWindowDimensions,
  ScrollView
} from 'react-native';
import { colors, spacing, shape, elevation, typography } from '../theme';
import { authService } from '../services/api';
import { useVendor } from '../context/VendorContext';

const VENDOR_TYPES = [
  { value: 'VENUE', label: 'Venue Owner', icon: '🏟️' },
  { value: 'COACH', label: 'Coach / Trainer', icon: '🏃' },
  { value: 'ECOM', label: 'E-commerce', icon: '🛒' },
  { value: 'VENUE_COACH', label: 'Venue + Coach', icon: '🏟️🏃' },
  { value: 'ALL', label: 'All Services', icon: '⭐' },
];

export default function RegisterScreen({ navigation }) {
  const { setVendorId, setVendorType, setVendorStatus } = useVendor();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  
  const [formData, setFormData] = useState({
    owner_name: '',
    business_name: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
    vendor_type: 'VENUE',
    address: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const buttonScale = useRef(new Animated.Value(1)).current;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.owner_name.trim()) newErrors.owner_name = 'Owner name is required';
    if (!formData.business_name.trim()) newErrors.business_name = 'Business name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (formData.phone.length < 10) newErrors.phone = 'Invalid phone number';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await authService.register(formData);
      if (response.vendor) {
        await setVendorId(response.vendor.id);
        await setVendorType(response.vendor.vendor_type || 'VENUE');
        await setVendorStatus(response.vendor.status || 'PENDING');
      }
      
      if (Platform.OS === 'web') {
        setSuccessMessage(response.message || 'Registration successful!');
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }, 1500);
      } else {
        Alert.alert('Success', response.message || 'Registration successful!', [
          { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }) }
        ]);
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
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

  const cardStyle = [styles.card, isWeb && width > 480 && styles.cardWeb];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={cardStyle}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🏸</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register as a vendor partner</Text>

          <Text style={styles.sectionTitle}>Business Type</Text>
          <View style={styles.typeGrid}>
            {VENDOR_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  formData.vendor_type === type.value && styles.typeCardActive
                ]}
                onPress={() => updateField('vendor_type', type.value)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.typeLabel,
                  formData.vendor_type === type.value && styles.typeLabelActive
                ]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Owner Name *</Text>
            <TextInput
              style={[styles.input, errors.owner_name && styles.inputError]}
              value={formData.owner_name}
              onChangeText={(v) => updateField('owner_name', v)}
              placeholder="Enter owner name"
              placeholderTextColor={colors.outline}
            />
            {errors.owner_name && <Text style={styles.errorText}>{errors.owner_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={[styles.input, errors.business_name && styles.inputError]}
              value={formData.business_name}
              onChangeText={(v) => updateField('business_name', v)}
              placeholder="Enter business name"
              placeholderTextColor={colors.outline}
            />
            {errors.business_name && <Text style={styles.errorText}>{errors.business_name}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(v) => updateField('phone', v)}
                placeholder="+91XXXXXXXXXX"
                placeholderTextColor={colors.outline}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(v) => updateField('city', v)}
                placeholder="City"
                placeholderTextColor={colors.outline}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              placeholder="Enter email"
              placeholderTextColor={colors.outline}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              placeholder="Create password"
              placeholderTextColor={colors.outline}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={[styles.input, errors.confirm_password && styles.inputError]}
              value={formData.confirm_password}
              onChangeText={(v) => updateField('confirm_password', v)}
              placeholder="Confirm password"
              placeholderTextColor={colors.outline}
              secureTextEntry
            />
            {errors.confirm_password && <Text style={styles.errorText}>{errors.confirm_password}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={formData.address}
              onChangeText={(v) => updateField('address', v)}
              placeholder="Business address"
              placeholderTextColor={colors.outline}
              multiline
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.note}>
            ID proofs (PAN/Aadhaar) and license documents can be uploaded after registration.
          </Text>

          {successMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
              <Text style={styles.redirectText}>Redirecting to dashboard...</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={loading}
              activeOpacity={1}
            >
              <Text style={styles.btnText}>{loading ? 'Registering...' : 'Register'}</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity 
            style={styles.linkBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkAccent}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: {
    fontSize: 36,
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
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  typeCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: shape.corner,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeLabel: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
  },
  typeLabelActive: {
    color: colors.onPrimary,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
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
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.labelSmall,
    color: colors.error,
    marginTop: spacing.xs,
  },
  note: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  btn: {
    backgroundColor: colors.secondary,
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
    ...elevation.level2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    ...typography.label,
    color: colors.onPrimary,
  },
  linkBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  linkAccent: {
    color: colors.secondary,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: shape.corner,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successText: {
    ...typography.body,
    color: '#2E7D32',
    fontWeight: '600',
  },
  redirectText: {
    ...typography.labelSmall,
    color: '#66BB6A',
    marginTop: spacing.xs,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: shape.corner,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  errorBannerText: {
    ...typography.body,
    color: '#C62828',
  },
});
