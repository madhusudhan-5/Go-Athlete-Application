import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Modal } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { authService, vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';
import { useTheme } from '../context/ThemeContext';

const VENDOR_TYPE_LABELS = {
  'VENUE': 'Venue Owner',
  'COACH': 'Coach/Trainer',
  'ECOM': 'E-commerce',
  'VENUE_COACH': 'Venue + Coach',
  'ALL': 'All Services',
};

const STATUS_COLORS = {
  'PENDING': colors.warning || '#FFA000',
  'APPROVED': colors.success || '#4CAF50',
  'REJECTED': colors.error,
  'SUSPENDED': colors.error,
};

export default function SettingsScreen({ navigation, route }) {
  const { vendorId, vendorType, vendorStatus, clearVendorData } = useVendor();
  const { isDark, toggleTheme, colors: themeColors } = useTheme();
  const [payoutData, setPayoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [kycModalVisible, setKycModalVisible] = useState(false);
  
  const [notifications, setNotifications] = useState({
    newBookings: true,
    cancellations: true,
    payouts: true,
    marketing: false,
  });
  
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '••••••••1234',
    ifsc: 'HDFC0001234',
    accountName: 'Sports Arena LLP',
    bankName: 'HDFC Bank',
  });

  const [kycStatus, setKycStatus] = useState({
    pan: 'verified',
    gst: 'pending',
    address: 'verified',
    bank: 'verified',
  });

  useEffect(() => {
    loadPayoutSummary();
  }, []);

  const loadPayoutSummary = async () => {
    try {
      const response = await vendorService.getPayoutSummary(vendorId);
      setPayoutData(response.data);
    } catch (error) {
      console.error('Failed to load payout summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            await clearVendorData();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const toggleNotification = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handleKycUpload = (docType) => {
    Alert.alert(
      'Upload Document',
      `Select ${docType} document to upload`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upload', 
          onPress: () => {
            setKycStatus({ ...kycStatus, [docType.toLowerCase()]: 'pending' });
            Alert.alert('Success', 'Document uploaded successfully. Verification in progress.');
          }
        },
      ]
    );
  };

  const getKycStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return colors.success;
      case 'pending':
        return colors.accent;
      case 'rejected':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const NotificationRow = ({ label, value, onToggle }) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.outline, true: colors.accent }}
        thumbColor={value ? colors.onAccent : colors.surface}
      />
    </View>
  );

  const KycRow = ({ label, status, docType }) => (
    <View style={styles.kycRow}>
      <View style={styles.kycInfo}>
        <Text style={styles.kycLabel}>{label}</Text>
        <View style={[styles.kycBadge, { backgroundColor: getKycStatusColor(status) }]}>
          <Text style={styles.kycBadgeText}>{status}</Text>
        </View>
      </View>
      {status !== 'verified' && (
        <TouchableOpacity style={styles.uploadBtn} onPress={() => handleKycUpload(docType)}>
          <Text style={styles.uploadBtnText}>Upload</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const BankModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={bankModalVisible}
      onRequestClose={() => setBankModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Bank Details</Text>
          
          <View style={styles.bankField}>
            <Text style={styles.bankLabel}>Account Number</Text>
            <Text style={styles.bankValue}>{bankDetails.accountNumber}</Text>
          </View>
          
          <View style={styles.bankField}>
            <Text style={styles.bankLabel}>IFSC Code</Text>
            <Text style={styles.bankValue}>{bankDetails.ifsc}</Text>
          </View>
          
          <View style={styles.bankField}>
            <Text style={styles.bankLabel}>Account Name</Text>
            <Text style={styles.bankValue}>{bankDetails.accountName}</Text>
          </View>
          
          <View style={styles.bankField}>
            <Text style={styles.bankLabel}>Bank Name</Text>
            <Text style={styles.bankValue}>{bankDetails.bankName}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editBankBtn}
            onPress={() => Alert.alert('Edit Bank', 'Please contact support to update bank details.')}
          >
            <Text style={styles.editBankBtnText}>Request Update</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeBtn} onPress={() => setBankModalVisible(false)}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const KycModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={kycModalVisible}
      onRequestClose={() => setKycModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>KYC Documents</Text>
          <Text style={styles.modalSubtitle}>Upload documents for verification</Text>
          
          <KycRow label="PAN Card" status={kycStatus.pan} docType="PAN" />
          <KycRow label="GST Certificate" status={kycStatus.gst} docType="GST" />
          <KycRow label="Address Proof" status={kycStatus.address} docType="Address" />
          <KycRow label="Bank Statement" status={kycStatus.bank} docType="Bank" />
          
          <TouchableOpacity style={styles.closeBtn} onPress={() => setKycModalVisible(false)}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <BankModal />
      <KycModal />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Status</Text>
        <View style={styles.profileRow}>
          <View>
            <Text style={styles.profileLabel}>Vendor Type</Text>
            <Text style={styles.profileValue}>{VENDOR_TYPE_LABELS[vendorType] || vendorType || 'Not set'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[vendorStatus] || colors.outline }]}>
            <Text style={styles.statusBadgeText}>{vendorStatus || 'PENDING'}</Text>
          </View>
        </View>
        {vendorStatus === 'PENDING' && (
          <View style={styles.pendingNotice}>
            <Text style={styles.pendingNoticeText}>
              Your account is pending approval. You can view features but some actions may be limited.
            </Text>
          </View>
        )}
        {vendorStatus === 'SUSPENDED' && (
          <View style={[styles.pendingNotice, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.pendingNoticeText, { color: colors.error }]}>
              Your account has been suspended. Please contact support.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quick Summary</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : payoutData ? (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending Payout</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>
                ₹{payoutData.pending_payout?.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryValue}>₹{payoutData.net_earnings?.toLocaleString()}</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewPayoutsBtn}
              onPress={() => navigation.navigate('Payouts')}
            >
              <Text style={styles.viewPayoutsBtnText}>View All Payouts</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.loadingText}>No payout data</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bank Details</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => setBankModalVisible(true)}>
          <View>
            <Text style={styles.menuLabel}>{bankDetails.bankName}</Text>
            <Text style={styles.menuValue}>{bankDetails.accountNumber}</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <NotificationRow 
          label="New Bookings" 
          value={notifications.newBookings} 
          onToggle={() => toggleNotification('newBookings')} 
        />
        <NotificationRow 
          label="Cancellations" 
          value={notifications.cancellations} 
          onToggle={() => toggleNotification('cancellations')} 
        />
        <NotificationRow 
          label="Payouts" 
          value={notifications.payouts} 
          onToggle={() => toggleNotification('payouts')} 
        />
        <NotificationRow 
          label="Marketing" 
          value={notifications.marketing} 
          onToggle={() => toggleNotification('marketing')} 
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingSubtext}>
              {isDark ? 'Dark theme is enabled' : 'Light theme is enabled'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.outline, true: colors.primary + '80' }}
            thumbColor={isDark ? colors.primary : colors.surfaceVariant}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>KYC Verification</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => setKycModalVisible(true)}>
          <View>
            <Text style={styles.menuLabel}>Document Status</Text>
            <Text style={styles.menuValue}>
              {Object.values(kycStatus).filter(s => s === 'verified').length}/4 verified
            </Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Offers & Promotions</Text>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Offers')}
        >
          <View>
            <Text style={styles.menuLabel}>Manage Offers</Text>
            <Text style={styles.menuValue}>Create discounts for your customers</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Help Center</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Contact Us</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Terms & Conditions</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Privacy Policy</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
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
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileLabel: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  profileValue: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  statusBadgeText: {
    ...typography.labelMedium,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  pendingNotice: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  pendingNoticeText: {
    ...typography.bodyMedium,
    color: '#E65100',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  summaryLabel: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  summaryValue: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  viewPayoutsBtn: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  viewPayoutsBtnText: {
    ...typography.labelLarge,
    color: colors.primary,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  menuLabel: {
    ...typography.bodyLarge,
    color: colors.onSurface,
  },
  menuValue: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  menuArrow: {
    ...typography.titleLarge,
    color: colors.onSurfaceVariant,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  settingLabel: {
    ...typography.bodyLarge,
    color: colors.onSurface,
  },
  settingSubtext: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
  version: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.titleLarge,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  bankField: {
    marginBottom: spacing.md,
  },
  bankLabel: {
    ...typography.labelLarge,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  bankValue: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  editBankBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  editBankBtnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
  closeBtn: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeBtnText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  kycRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  kycInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kycLabel: {
    ...typography.bodyLarge,
    color: colors.onSurface,
  },
  kycBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  kycBadgeText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  uploadBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  uploadBtnText: {
    ...typography.labelLarge,
    color: colors.onAccent,
    fontSize: 12,
  },
});
