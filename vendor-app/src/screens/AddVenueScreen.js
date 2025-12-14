import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Pressable } from 'react-native';
import { spacing, typography, shape, elevation } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';
import { fileUploadService } from '../services/fileUpload';
import { useToast } from '../components/Toast';

export default function AddVenueScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { vendorId } = useVendor();
  const { showSuccess, showError, showWarning } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    amenities: [],
    photos: [],
    opening_time: '06:00',
    closing_time: '22:00',
    weekday_hours: { open: '06:00', close: '22:00' },
    weekend_hours: { open: '07:00', close: '21:00' },
    closed_days: [],
  });

  const amenityOptions = [
    { id: 'parking', label: 'Parking', icon: '🅿️' },
    { id: 'changing_room', label: 'Changing Room', icon: '🚿' },
    { id: 'cafeteria', label: 'Cafeteria', icon: '☕' },
    { id: 'wifi', label: 'WiFi', icon: '📶' },
    { id: 'first_aid', label: 'First Aid', icon: '🏥' },
    { id: 'ac', label: 'Air Conditioning', icon: '❄️' },
    { id: 'lockers', label: 'Lockers', icon: '🔐' },
    { id: 'spectator', label: 'Spectator Area', icon: '👥' },
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const updateForm = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const toggleAmenity = (amenityId) => {
    if (form.amenities.includes(amenityId)) {
      updateForm('amenities', form.amenities.filter(a => a !== amenityId));
    } else {
      updateForm('amenities', [...form.amenities, amenityId]);
    }
  };

  const toggleClosedDay = (day) => {
    if (form.closed_days.includes(day)) {
      updateForm('closed_days', form.closed_days.filter(d => d !== day));
    } else {
      updateForm('closed_days', [...form.closed_days, day]);
    }
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const pickPhoto = async () => {
    if (form.photos.length >= 5) {
      showWarning('Maximum 5 photos allowed');
      return;
    }
    
    setUploadingPhoto(true);
    try {
      const result = await fileUploadService.pickImage({ allowsEditing: true, aspect: [3, 2] });
      if (!result.cancelled && result.uri) {
        updateForm('photos', [...form.photos, result.uri]);
      }
    } catch (error) {
      showError('Failed to select photo: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index) => {
    updateForm('photos', form.photos.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.name) {
          showWarning('Please enter venue name');
          return false;
        }
        break;
      case 2:
        if (!form.address || !form.city || !form.pincode) {
          showWarning('Please fill in address, city, and pincode');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const styles = createStyles(colors);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await vendorService.createVenue({
        ...form,
        vendor_id: vendorId,
        opening_time: form.weekday_hours.open,
        closing_time: form.weekday_hours.close,
      });
      
      showSuccess('Venue created successfully!');
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }, 1000);
    } catch (error) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to create venue';
      showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDesc}>Tell us about your venue</Text>
      
      <Text style={styles.label}>Venue Name *</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(v) => updateForm('name', v)}
        placeholder="e.g., Sports Arena Chennai"
      />
      
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.description}
        onChangeText={(v) => updateForm('description', v)}
        placeholder="Describe your venue, facilities, and what makes it special..."
        multiline
        numberOfLines={4}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Location</Text>
      <Text style={styles.stepDesc}>Where is your venue located?</Text>
      
      <Text style={styles.label}>Address *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.address}
        onChangeText={(v) => updateForm('address', v)}
        placeholder="Street address"
        multiline
        numberOfLines={2}
      />
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={form.city}
            onChangeText={(v) => updateForm('city', v)}
            placeholder="City"
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={form.state}
            onChangeText={(v) => updateForm('state', v)}
            placeholder="State"
          />
        </View>
      </View>
      
      <Text style={styles.label}>Pincode *</Text>
      <TextInput
        style={styles.input}
        value={form.pincode}
        onChangeText={(v) => updateForm('pincode', v)}
        placeholder="Pincode"
        keyboardType="numeric"
      />
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={form.latitude}
            onChangeText={(v) => updateForm('latitude', v)}
            placeholder="e.g., 13.0827"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={form.longitude}
            onChangeText={(v) => updateForm('longitude', v)}
            placeholder="e.g., 80.2707"
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Amenities</Text>
      <Text style={styles.stepDesc}>What facilities do you offer?</Text>
      
      <View style={styles.amenitiesGrid}>
        {amenityOptions.map((amenity) => (
          <TouchableOpacity
            key={amenity.id}
            style={[styles.amenityCard, form.amenities.includes(amenity.id) && styles.amenityCardSelected]}
            onPress={() => toggleAmenity(amenity.id)}
          >
            <Text style={styles.amenityIcon}>{amenity.icon}</Text>
            <Text style={[styles.amenityLabel, form.amenities.includes(amenity.id) && styles.amenityLabelSelected]}>
              {amenity.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.stepTitle}>Photos</Text>
      <Text style={styles.stepDesc}>Add photos of your venue (max 5)</Text>
      
      <View style={styles.photosGrid}>
        {form.photos.map((photo, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(index)}>
              <Text style={styles.removePhotoText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {form.photos.length < 5 && (
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto} disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text style={styles.addPhotoIcon}>📷</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.photoHint}>Tap to select photos from your device</Text>
    </>
  );

  const renderStep5 = () => (
    <>
      <Text style={styles.stepTitle}>Operating Hours</Text>
      <Text style={styles.stepDesc}>Set your venue's working hours</Text>
      
      <View style={styles.hoursSection}>
        <Text style={styles.hoursLabel}>Weekday Hours (Mon-Fri)</Text>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Open</Text>
            <TextInput
              style={styles.input}
              value={form.weekday_hours.open}
              onChangeText={(v) => updateForm('weekday_hours', { ...form.weekday_hours, open: v })}
              placeholder="06:00"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Close</Text>
            <TextInput
              style={styles.input}
              value={form.weekday_hours.close}
              onChangeText={(v) => updateForm('weekday_hours', { ...form.weekday_hours, close: v })}
              placeholder="22:00"
            />
          </View>
        </View>
      </View>
      
      <View style={styles.hoursSection}>
        <Text style={styles.hoursLabel}>Weekend Hours (Sat-Sun)</Text>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Open</Text>
            <TextInput
              style={styles.input}
              value={form.weekend_hours.open}
              onChangeText={(v) => updateForm('weekend_hours', { ...form.weekend_hours, open: v })}
              placeholder="07:00"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Close</Text>
            <TextInput
              style={styles.input}
              value={form.weekend_hours.close}
              onChangeText={(v) => updateForm('weekend_hours', { ...form.weekend_hours, close: v })}
              placeholder="21:00"
            />
          </View>
        </View>
      </View>
      
      <Text style={styles.hoursLabel}>Closed Days</Text>
      <View style={styles.daysRow}>
        {daysOfWeek.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayChip, form.closed_days.includes(day) && styles.dayChipSelected]}
            onPress={() => toggleClosedDay(day)}
          >
            <Text style={[styles.dayChipText, form.closed_days.includes(day) && styles.dayChipTextSelected]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderStep6 = () => (
    <>
      <Text style={styles.stepTitle}>Review</Text>
      <Text style={styles.stepDesc}>Please review your venue details</Text>
      
      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>{form.name || 'Unnamed Venue'}</Text>
        {form.description && <Text style={styles.reviewDesc}>{form.description}</Text>}
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Location</Text>
          <Text style={styles.reviewValue}>
            {form.address}, {form.city} {form.state} - {form.pincode}
          </Text>
        </View>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Amenities</Text>
          <View style={styles.reviewChips}>
            {form.amenities.map((id) => {
              const amenity = amenityOptions.find(a => a.id === id);
              return amenity ? (
                <View key={id} style={styles.reviewChip}>
                  <Text>{amenity.icon} {amenity.label}</Text>
                </View>
              ) : null;
            })}
            {form.amenities.length === 0 && <Text style={styles.reviewNone}>None selected</Text>}
          </View>
        </View>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Photos</Text>
          <Text style={styles.reviewValue}>{form.photos.length} photo(s) added</Text>
        </View>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Hours</Text>
          <Text style={styles.reviewValue}>
            Weekdays: {form.weekday_hours.open} - {form.weekday_hours.close}
          </Text>
          <Text style={styles.reviewValue}>
            Weekends: {form.weekend_hours.open} - {form.weekend_hours.close}
          </Text>
          {form.closed_days.length > 0 && (
            <Text style={styles.reviewValue}>Closed: {form.closed_days.join(', ')}</Text>
          )}
        </View>
      </View>
    </>
  );

  const stepTitles = ['Basic Info', 'Location', 'Amenities', 'Photos', 'Hours', 'Review'];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Venue</Text>
      
      <View style={styles.stepper}>
        {stepTitles.map((title, index) => (
          <View key={index} style={styles.stepIndicator}>
            <View style={[styles.stepDot, step > index && styles.stepDotCompleted, step === index + 1 && styles.stepDotActive]}>
              <Text style={styles.stepDotText}>{step > index ? '✓' : index + 1}</Text>
            </View>
            <Text style={[styles.stepName, step === index + 1 && styles.stepNameActive]}>{title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </View>

      <View style={styles.actions}>
        {step > 1 && (
          <TouchableOpacity style={styles.btnOutline} onPress={prevStep}>
            <Text style={styles.btnOutlineText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 6 ? (
          <TouchableOpacity style={styles.btn} onPress={nextStep}>
            <Text style={styles.btnText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Venue'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  stepIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.accent,
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
  },
  stepDotText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontSize: 12,
  },
  stepName: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  stepNameActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  stepTitle: {
    ...typography.titleLarge,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  stepDesc: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.labelLarge,
    color: colors.onSurface,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.bodyLarge,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityCard: {
    width: '48%',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amenityCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  amenityIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  amenityLabel: {
    ...typography.labelLarge,
    color: colors.onSurface,
    textAlign: 'center',
  },
  amenityLabelSelected: {
    color: colors.accent,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.outline,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  addPhotoIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  addPhotoText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  photoHint: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  hoursSection: {
    marginBottom: spacing.lg,
  },
  hoursLabel: {
    ...typography.titleMedium,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  dayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  dayChipSelected: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  dayChipText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  dayChipTextSelected: {
    color: colors.onPrimary,
  },
  reviewCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: spacing.md,
  },
  reviewTitle: {
    ...typography.titleLarge,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  reviewDesc: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  reviewSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  reviewLabel: {
    ...typography.labelLarge,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  reviewValue: {
    ...typography.bodyLarge,
    color: colors.onSurface,
  },
  reviewChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  reviewChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  reviewNone: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  btn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
  btnOutline: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnOutlineText: {
    ...typography.labelLarge,
    color: colors.primary,
    fontWeight: '600',
  },
});
