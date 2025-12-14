import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { spacing, typography, shape, elevation } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';
import { useToast } from '../components/Toast';
import { fileUploadService } from '../services/fileUpload';

export default function AddCoachScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { vendorId } = useVendor();
  const { showSuccess, showError, showWarning } = useToast();
  const editCoach = route.params?.coach;
  const isEditMode = !!editCoach;

  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [formData, setFormData] = useState({
    name: editCoach?.name || '',
    email: editCoach?.email || '',
    phone: editCoach?.phone || '',
    bio: editCoach?.bio || '',
    experience_years: editCoach?.experience_years?.toString() || '0',
    hourly_rate: editCoach?.hourly_rate?.toString() || '500',
    specializations: editCoach?.specializations?.join(', ') || '',
    certifications: editCoach?.certifications?.join(', ') || '',
    certificate_files: editCoach?.certificate_files || [],
    videos: editCoach?.videos || [],
    delivery_modes: editCoach?.delivery_modes || ['VENUE'],
    venue: editCoach?.venue || null,
  });

  const styles = createStyles(colors);

  const loadVenues = useCallback(async () => {
    if (!vendorId) return;
    try {
      const response = await vendorService.getVenues(vendorId);
      setVenues(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to load venues:', error);
    }
  }, [vendorId]);

  useFocusEffect(
    useCallback(() => {
      loadVenues();
    }, [loadVenues])
  );

  const pickCertificate = async () => {
    if (formData.certificate_files.length >= 5) {
      showWarning('Maximum 5 certificates allowed');
      return;
    }
    
    setUploadingCert(true);
    try {
      const result = await fileUploadService.pickDocument({
        type: ['application/pdf', 'image/*'],
      });
      if (!result.cancelled && result.uri) {
        setFormData({ 
          ...formData, 
          certificate_files: [...formData.certificate_files, { uri: result.uri, name: result.name || 'Certificate' }] 
        });
      }
    } catch (error) {
      showError('Failed to select certificate: ' + error.message);
    } finally {
      setUploadingCert(false);
    }
  };

  const removeCertificate = (index) => {
    setFormData({ 
      ...formData, 
      certificate_files: formData.certificate_files.filter((_, i) => i !== index) 
    });
  };

  const pickVideo = async () => {
    if (formData.videos.length >= 5) {
      showWarning('Maximum 5 videos allowed');
      return;
    }
    
    setUploadingVideo(true);
    try {
      const result = await fileUploadService.pickVideo();
      if (!result.cancelled && result.uri) {
        setFormData({ 
          ...formData, 
          videos: [...formData.videos, { uri: result.uri, name: result.name || 'Video' }] 
        });
      }
    } catch (error) {
      showError('Failed to select video: ' + error.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeVideo = (index) => {
    setFormData({ 
      ...formData, 
      videos: formData.videos.filter((_, i) => i !== index) 
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showWarning('Coach name is required');
      return;
    }
    if (!formData.email.trim()) {
      showWarning('Email is required');
      return;
    }
    if (!formData.phone.trim()) {
      showWarning('Phone is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        vendor: vendorId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        experience_years: parseInt(formData.experience_years) || 0,
        hourly_rate: parseFloat(formData.hourly_rate) || 500,
        specializations: formData.specializations.split(',').map(s => s.trim()).filter(Boolean),
        certifications: formData.certifications.split(',').map(s => s.trim()).filter(Boolean),
        certificate_files: formData.certificate_files.map(f => typeof f === 'string' ? f : f.uri),
        videos: formData.videos.map(v => typeof v === 'string' ? v : v.uri),
        delivery_modes: formData.delivery_modes,
        venue: formData.venue,
      };

      if (isEditMode) {
        await vendorService.updateCoach(editCoach.id, payload);
        showSuccess('Coach updated successfully!');
      } else {
        await vendorService.createCoach(payload);
        showSuccess('Coach created successfully!');
      }

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }, 1000);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to save coach';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const deliveryModes = [
    { value: 'VENUE', label: 'At Venue' },
    { value: 'CUSTOMER_LOCATION', label: 'At Customer Location' },
    { value: 'ONLINE', label: 'Online/Virtual' },
  ];

  const getFileName = (file) => {
    if (typeof file === 'string') {
      const parts = file.split('/');
      return parts[parts.length - 1] || 'File';
    }
    return file.name || 'File';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Coach Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter coach name"
            placeholderTextColor={colors.outline}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="coach@example.com"
            placeholderTextColor={colors.outline}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="+91 9876543210"
            placeholderTextColor={colors.outline}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Details</Text>

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Brief description about the coach"
            placeholderTextColor={colors.outline}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Experience (Years)</Text>
          <TextInput
            style={styles.input}
            value={formData.experience_years}
            onChangeText={(text) => setFormData({ ...formData, experience_years: text })}
            placeholder="0"
            placeholderTextColor={colors.outline}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Hourly Rate (INR)</Text>
          <TextInput
            style={styles.input}
            value={formData.hourly_rate}
            onChangeText={(text) => setFormData({ ...formData, hourly_rate: text })}
            placeholder="500"
            placeholderTextColor={colors.outline}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Specializations (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.specializations}
            onChangeText={(text) => setFormData({ ...formData, specializations: text })}
            placeholder="Cricket, Batting, Bowling"
            placeholderTextColor={colors.outline}
          />

          <Text style={styles.label}>Certifications (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.certifications}
            onChangeText={(text) => setFormData({ ...formData, certifications: text })}
            placeholder="Level 1 Coach, CPR Certified"
            placeholderTextColor={colors.outline}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certificate Files</Text>
          <Text style={styles.helperText}>Upload up to 5 certificate documents (PDF or images)</Text>
          
          <View style={styles.fileList}>
            {formData.certificate_files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileIcon}>📄</Text>
                <Text style={styles.fileName} numberOfLines={1}>{getFileName(file)}</Text>
                <TouchableOpacity 
                  style={styles.removeFileBtn}
                  onPress={() => removeCertificate(index)}
                >
                  <Text style={styles.removeFileBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {formData.certificate_files.length < 5 && (
              <TouchableOpacity 
                style={styles.addFileBtn}
                onPress={pickCertificate}
                disabled={uploadingCert}
              >
                {uploadingCert ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <Text style={styles.addFileIcon}>📎</Text>
                    <Text style={styles.addFileText}>Add Certificate</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Showcase Videos</Text>
          <Text style={styles.helperText}>Upload up to 5 coaching videos to showcase your skills</Text>
          
          <View style={styles.fileList}>
            {formData.videos.map((video, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileIcon}>🎬</Text>
                <Text style={styles.fileName} numberOfLines={1}>{getFileName(video)}</Text>
                <TouchableOpacity 
                  style={styles.removeFileBtn}
                  onPress={() => removeVideo(index)}
                >
                  <Text style={styles.removeFileBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {formData.videos.length < 5 && (
              <TouchableOpacity 
                style={styles.addFileBtn}
                onPress={pickVideo}
                disabled={uploadingVideo}
              >
                {uploadingVideo ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <Text style={styles.addFileIcon}>🎥</Text>
                    <Text style={styles.addFileText}>Add Video</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Modes</Text>
          <Text style={styles.helperText}>Select all modes this coach supports</Text>
          <View style={styles.chipContainer}>
            {deliveryModes.map((mode) => {
              const isSelected = formData.delivery_modes.includes(mode.value);
              return (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      setFormData({ 
                        ...formData, 
                        delivery_modes: formData.delivery_modes.filter(m => m !== mode.value) 
                      });
                    } else {
                      setFormData({ 
                        ...formData, 
                        delivery_modes: [...formData.delivery_modes, mode.value] 
                      });
                    }
                  }}
                >
                  <Text style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected
                  ]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {formData.delivery_modes.includes('VENUE') && venues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Venue</Text>
            <View style={styles.chipContainer}>
              {venues.map((venue) => (
                <TouchableOpacity
                  key={venue.id}
                  style={[
                    styles.chip,
                    formData.venue === venue.id && styles.chipSelected
                  ]}
                  onPress={() => setFormData({ ...formData, venue: venue.id })}
                >
                  <Text style={[
                    styles.chipText,
                    formData.venue === venue.id && styles.chipTextSelected
                  ]}>
                    {venue.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : (isEditMode ? 'Update Coach' : 'Add Coach')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: shape.corner,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...elevation.level1,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: shape.cornerSmall,
    padding: spacing.md,
    ...typography.bodyLarge,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fileList: {
    gap: spacing.sm,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: shape.cornerSmall,
    gap: spacing.sm,
  },
  fileIcon: {
    fontSize: 20,
  },
  fileName: {
    ...typography.bodyMedium,
    color: colors.onSurface,
    flex: 1,
  },
  removeFileBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeFileBtnText: {
    color: colors.onError || '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  addFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: shape.cornerSmall,
    borderWidth: 2,
    borderColor: colors.outline,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  addFileIcon: {
    fontSize: 20,
  },
  addFileText: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: shape.cornerFull,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...elevation.level2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    ...typography.labelLarge,
    color: colors.onSurfaceVariant,
  },
});
