import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Image, ActivityIndicator, Pressable, Platform } from 'react-native';
import { spacing, typography, shape, elevation } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';
import { useToast } from '../components/Toast';
import { fileUploadService } from '../services/fileUpload';

export default function AddCourtScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { vendorId } = useVendor();
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState({
    venue: null,
    name: '',
    court_type: 'badminton',
    hourly_rate: '',
    capacity: '4',
    slot_duration: '60',
    has_lights: true,
    equipment: [],
    photos: [],
    weekly_availability: {
      Mon: { available: true, open: '06:00', close: '22:00' },
      Tue: { available: true, open: '06:00', close: '22:00' },
      Wed: { available: true, open: '06:00', close: '22:00' },
      Thu: { available: true, open: '06:00', close: '22:00' },
      Fri: { available: true, open: '06:00', close: '22:00' },
      Sat: { available: true, open: '07:00', close: '21:00' },
      Sun: { available: true, open: '07:00', close: '21:00' },
    },
  });

  const sportTypes = [
    { value: 'badminton', label: 'Badminton', icon: '🏸' },
    { value: 'tennis', label: 'Tennis', icon: '🎾' },
    { value: 'basketball', label: 'Basketball', icon: '🏀' },
    { value: 'football', label: 'Football', icon: '⚽' },
    { value: 'cricket', label: 'Cricket', icon: '🏏' },
    { value: 'squash', label: 'Squash', icon: '🎯' },
    { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
    { value: 'table_tennis', label: 'Table Tennis', icon: '🏓' },
    { value: 'swimming', label: 'Swimming', icon: '🏊' },
    { value: 'gym', label: 'Gym', icon: '🏋️' },
  ];

  const equipmentOptions = [
    'Rackets', 'Balls', 'Nets', 'Shoes', 'Gloves', 'Helmets', 'Pads', 'Mats', 'Towels', 'Bottles'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      const response = await vendorService.getVenues(vendorId);
      const venueList = response.data.results || response.data || [];
      setVenues(venueList);
      if (venueList.length > 0) {
        setForm({ ...form, venue: venueList[0].id });
      }
    } catch (error) {
      console.error('Failed to load venues:', error);
    }
  };

  const updateForm = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const toggleEquipment = (item) => {
    if (form.equipment.includes(item)) {
      updateForm('equipment', form.equipment.filter(e => e !== item));
    } else {
      updateForm('equipment', [...form.equipment, item]);
    }
  };

  const toggleDayAvailability = (day) => {
    updateForm('weekly_availability', {
      ...form.weekly_availability,
      [day]: {
        ...form.weekly_availability[day],
        available: !form.weekly_availability[day].available,
      },
    });
  };

  const updateDayHours = (day, field, value) => {
    updateForm('weekly_availability', {
      ...form.weekly_availability,
      [day]: {
        ...form.weekly_availability[day],
        [field]: value,
      },
    });
  };

  const pickPhoto = async () => {
    if (form.photos.length >= 5) {
      showWarning('Maximum 5 photos allowed');
      return;
    }
    
    setUploadingPhoto(true);
    try {
      const result = await fileUploadService.pickImage({ allowsEditing: true, aspect: [4, 3] });
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

  const handleSubmit = async () => {
    if (!form.name || !form.hourly_rate) {
      showWarning('Please fill in court name and hourly rate');
      return;
    }

    if (!form.venue) {
      showWarning('Please select a venue for this court');
      return;
    }

    setLoading(true);
    try {
      await vendorService.createCourt({
        ...form,
        vendor: vendorId,
        hourly_rate: parseFloat(form.hourly_rate),
        slot_duration: parseInt(form.slot_duration),
        capacity: parseInt(form.capacity),
      });
      showSuccess('Court created successfully!');
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }, 1000);
    } catch (error) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to create court';
      showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Court</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Venue</Text>
        {venues.length === 0 ? (
          <TouchableOpacity style={styles.noVenueBtn} onPress={() => navigation.navigate('AddVenue')}>
            <Text style={styles.noVenueText}>No venues found. Tap to add one first.</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.venueScroll}>
            {venues.map((venue) => (
              <Pressable
                key={venue.id}
                style={[styles.venueCard, form.venue === venue.id && styles.venueCardSelected]}
                onPress={() => updateForm('venue', venue.id)}
              >
                <Text style={[styles.venueCardText, form.venue === venue.id && styles.venueCardTextSelected]}>
                  {venue.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Court Details</Text>
        
        <Text style={styles.label}>Court Name *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => updateForm('name', v)}
          placeholder="e.g., Court A, Premium Court"
          placeholderTextColor={colors.outline}
        />

        <Text style={styles.label}>Sport Type</Text>
        <View style={styles.sportGrid}>
          {sportTypes.map((type) => (
            <Pressable
              key={type.value}
              style={[styles.sportCard, form.court_type === type.value && styles.sportCardSelected]}
              onPress={() => updateForm('court_type', type.value)}
            >
              <Text style={styles.sportIcon}>{type.icon}</Text>
              <Text style={[styles.sportLabel, form.court_type === type.value && styles.sportLabelSelected]}>
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Hourly Rate (₹) *</Text>
            <TextInput
              style={styles.input}
              value={form.hourly_rate}
              onChangeText={(v) => updateForm('hourly_rate', v)}
              placeholder="500"
              placeholderTextColor={colors.outline}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Capacity</Text>
            <TextInput
              style={styles.input}
              value={form.capacity}
              onChangeText={(v) => updateForm('capacity', v)}
              placeholder="4"
              placeholderTextColor={colors.outline}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Slot Duration (min)</Text>
            <TextInput
              style={styles.input}
              value={form.slot_duration}
              onChangeText={(v) => updateForm('slot_duration', v)}
              placeholder="60"
              placeholderTextColor={colors.outline}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.halfInput, styles.switchRow]}>
            <Text style={styles.label}>Lights Available</Text>
            <Switch
              value={form.has_lights}
              onValueChange={(v) => updateForm('has_lights', v)}
              trackColor={{ false: colors.outline, true: colors.success }}
              thumbColor={form.has_lights ? colors.onPrimary : colors.surface}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Court Photos</Text>
        <Text style={styles.photoHint}>Add up to 5 photos of your court (optional)</Text>
        
        <View style={styles.photosGrid}>
          {form.photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(index)}>
                <Text style={styles.removePhotoText}>×</Text>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Equipment Available</Text>
        <View style={styles.equipmentGrid}>
          {equipmentOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.equipmentChip, form.equipment.includes(item) && styles.equipmentChipSelected]}
              onPress={() => toggleEquipment(item)}
            >
              <Text style={[styles.equipmentText, form.equipment.includes(item) && styles.equipmentTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Weekly Availability</Text>
        {daysOfWeek.map((day) => (
          <View key={day} style={styles.dayRow}>
            <TouchableOpacity
              style={[styles.dayToggle, form.weekly_availability[day].available && styles.dayToggleActive]}
              onPress={() => toggleDayAvailability(day)}
            >
              <Text style={[styles.dayName, form.weekly_availability[day].available && styles.dayNameActive]}>
                {day}
              </Text>
            </TouchableOpacity>
            {form.weekly_availability[day].available ? (
              <View style={styles.dayHours}>
                <TextInput
                  style={styles.timeInput}
                  value={form.weekly_availability[day].open}
                  onChangeText={(v) => updateDayHours(day, 'open', v)}
                  placeholder="06:00"
                  placeholderTextColor={colors.outline}
                />
                <Text style={styles.timeSeparator}>to</Text>
                <TextInput
                  style={styles.timeInput}
                  value={form.weekly_availability[day].close}
                  onChangeText={(v) => updateDayHours(day, 'close', v)}
                  placeholder="22:00"
                  placeholderTextColor={colors.outline}
                />
              </View>
            ) : (
              <Text style={styles.closedText}>Closed</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.goBack()}>
          <Text style={styles.btnOutlineText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled]} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.btnText}>Create Court</Text>
          )}
        </TouchableOpacity>
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
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: shape.cornerLarge,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...elevation.level1,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelLarge,
    color: colors.onSurface,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: shape.corner,
    padding: spacing.md,
    ...typography.bodyLarge,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  noVenueBtn: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.lg,
    borderRadius: shape.corner,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
  },
  noVenueText: {
    ...typography.bodyMedium,
    color: colors.secondary,
    textAlign: 'center',
  },
  venueScroll: {
    marginTop: spacing.xs,
  },
  venueCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: shape.corner,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceVariant,
  },
  venueCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  venueCardText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  venueCardTextSelected: {
    color: colors.onPrimary,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sportCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: shape.corner,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sportCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.cardHighlight || colors.surface,
  },
  sportIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  sportLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  sportLabelSelected: {
    color: colors.secondary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: shape.corner,
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
    color: colors.onError,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: shape.corner,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
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
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  photoHint: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  equipmentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: shape.cornerFull,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceVariant,
  },
  equipmentChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  equipmentText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  equipmentTextSelected: {
    color: colors.onSecondary,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider || colors.outlineVariant,
  },
  dayToggle: {
    width: 50,
    paddingVertical: spacing.sm,
    borderRadius: shape.cornerSmall,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dayToggleActive: {
    backgroundColor: colors.success,
  },
  dayName: {
    ...typography.labelLarge,
    color: colors.onSurfaceVariant,
  },
  dayNameActive: {
    color: colors.onPrimary,
  },
  dayHours: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: shape.cornerSmall,
    padding: spacing.sm,
    ...typography.bodyMedium,
    color: colors.onSurface,
    textAlign: 'center',
  },
  timeSeparator: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginHorizontal: spacing.sm,
  },
  closedText: {
    ...typography.bodyMedium,
    color: colors.error,
    flex: 1,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  btn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...elevation.level1,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  btnOutline: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnOutlineText: {
    ...typography.labelLarge,
    color: colors.primary,
    fontWeight: '600',
  },
});
