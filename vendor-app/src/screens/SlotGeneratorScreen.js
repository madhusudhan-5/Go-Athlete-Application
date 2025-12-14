import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function SlotGeneratorScreen({ navigation, route }) {
  const { vendorId } = useVendor();
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewSlots, setPreviewSlots] = useState([]);
  const [form, setForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    start_time: '06:00',
    end_time: '22:00',
    slot_duration: '60',
  });

  useEffect(() => {
    loadCourts();
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    setForm(f => ({ ...f, end_date: nextWeek.toISOString().split('T')[0] }));
  }, []);

  const loadCourts = async () => {
    try {
      const response = await vendorService.getCourts(vendorId);
      const courtList = response.data.results || response.data || [];
      setCourts(courtList);
      if (courtList.length > 0) {
        setSelectedCourt(courtList[0]);
      }
    } catch (error) {
      console.error('Failed to load courts:', error);
    }
  };

  const updateForm = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const generatePreview = async () => {
    if (!selectedCourt) {
      Alert.alert('Required', 'Please select a court');
      return;
    }

    setLoading(true);
    try {
      const response = await vendorService.generateSlotsRange({
        court_id: selectedCourt.id,
        start_date: form.start_date,
        end_date: form.end_date,
        slot_minutes: parseInt(form.slot_duration),
        start_time: form.start_time,
        end_time: form.end_time,
        save: false
      });
      
      const slotsData = response.data.slots || [];
      const uniqueSlots = [];
      const seenTimes = new Set();
      
      slotsData.forEach(slot => {
        const timeKey = `${slot.start_time}-${slot.end_time}`;
        if (!seenTimes.has(timeKey)) {
          seenTimes.add(timeKey);
          uniqueSlots.push({
            start_time: slot.start_time,
            end_time: slot.end_time,
            court_name: selectedCourt.name,
            rate: slot.price || selectedCourt.base_price,
          });
        }
      });
      
      setPreviewSlots(uniqueSlots);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      const startTime = form.start_time.split(':');
      const endTime = form.end_time.split(':');
      const duration = parseInt(form.slot_duration);
      
      const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
      const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
      
      const slots = [];
      let current = startMinutes;
      
      while (current + duration <= endMinutes) {
        const slotStart = `${Math.floor(current / 60).toString().padStart(2, '0')}:${(current % 60).toString().padStart(2, '0')}`;
        const slotEnd = `${Math.floor((current + duration) / 60).toString().padStart(2, '0')}:${((current + duration) % 60).toString().padStart(2, '0')}`;
        
        slots.push({
          start_time: slotStart,
          end_time: slotEnd,
          court_name: selectedCourt.name,
          rate: selectedCourt.base_price * (duration / 60),
        });
        
        current += duration;
      }
      
      setPreviewSlots(slots);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (previewSlots.length === 0) {
      Alert.alert('No Slots', 'Please generate a preview first');
      return;
    }

    setLoading(true);
    try {
      const response = await vendorService.saveSlots({
        court_id: selectedCourt.id,
        start_date: form.start_date,
        end_date: form.end_date,
        slot_minutes: parseInt(form.slot_duration),
        start_time: form.start_time,
        end_time: form.end_time,
      });
      
      const slotsCreated = response.data.slots_created || previewSlots.length;
      Alert.alert(
        'Success',
        `${slotsCreated} slots saved for ${selectedCourt.name} from ${form.start_date} to ${form.end_date}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to save slots:', error);
      Alert.alert('Error', 'Failed to save slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const renderSlot = ({ item, index }) => (
    <View style={styles.slotCard}>
      <Text style={styles.slotNumber}>#{index + 1}</Text>
      <Text style={styles.slotTime}>{formatTime(item.start_time)} - {formatTime(item.end_time)}</Text>
      <Text style={styles.slotRate}>₹{item.rate}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Slot Generator</Text>
      <Text style={styles.subtitle}>Configure time slots for your courts</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Court</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {courts.map((court) => (
            <TouchableOpacity
              key={court.id}
              style={[styles.courtChip, selectedCourt?.id === court.id && styles.courtChipSelected]}
              onPress={() => setSelectedCourt(court)}
            >
              <Text style={[styles.courtChipText, selectedCourt?.id === court.id && styles.courtChipTextSelected]}>
                {court.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Date Range</Text>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={form.start_date}
              onChangeText={(v) => updateForm('start_date', v)}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              value={form.end_date}
              onChangeText={(v) => updateForm('end_date', v)}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Time Settings</Text>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              value={form.start_time}
              onChangeText={(v) => updateForm('start_time', v)}
              placeholder="06:00"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>End Time</Text>
            <TextInput
              style={styles.input}
              value={form.end_time}
              onChangeText={(v) => updateForm('end_time', v)}
              placeholder="22:00"
            />
          </View>
        </View>
        
        <Text style={styles.label}>Slot Duration (minutes)</Text>
        <View style={styles.durationRow}>
          {['30', '45', '60', '90', '120'].map((dur) => (
            <TouchableOpacity
              key={dur}
              style={[styles.durationChip, form.slot_duration === dur && styles.durationChipSelected]}
              onPress={() => updateForm('slot_duration', dur)}
            >
              <Text style={[styles.durationText, form.slot_duration === dur && styles.durationTextSelected]}>
                {dur} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.previewBtn} onPress={generatePreview}>
        <Text style={styles.previewBtnText}>Generate Preview</Text>
      </TouchableOpacity>

      {previewSlots.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preview ({previewSlots.length} slots per day)</Text>
          <FlatList
            data={previewSlots}
            renderItem={renderSlot}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            columnWrapperStyle={styles.slotRow}
            scrollEnabled={false}
          />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.goBack()}>
          <Text style={styles.btnOutlineText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, previewSlots.length === 0 && styles.btnDisabled]} 
          onPress={handleSave} 
          disabled={loading || previewSlots.length === 0}
        >
          <Text style={styles.btnText}>{loading ? 'Saving...' : 'Save Slots'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  courtChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  courtChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  courtChipText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  courtChipTextSelected: {
    color: colors.onPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
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
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  durationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  durationChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  durationText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  durationTextSelected: {
    color: colors.onAccent,
  },
  previewBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewBtnText: {
    ...typography.labelLarge,
    color: colors.onAccent,
  },
  slotRow: {
    justifyContent: 'space-between',
  },
  slotCard: {
    width: '48%',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotNumber: {
    ...typography.labelLarge,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  slotTime: {
    ...typography.bodyMedium,
    color: colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  slotRate: {
    ...typography.labelLarge,
    color: colors.accent,
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
  btnDisabled: {
    opacity: 0.5,
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
  },
});
