import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, Modal } from 'react-native';
import { spacing, typography, shape, elevation } from '../theme';
import { useTheme } from '../context/ThemeContext';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);
  const timeoutRefs = useRef({});

  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    timeoutRefs.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timeoutRefs.current[id];
    }, duration);
  }, []);

  const showSuccess = useCallback((message, duration) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showConfirm = useCallback((title, message, onConfirm, onCancel) => {
    setConfirmModal({ title, message, onConfirm, onCancel });
  }, []);

  const handleConfirm = () => {
    if (confirmModal?.onConfirm) {
      confirmModal.onConfirm();
    }
    setConfirmModal(null);
  };

  const handleCancel = () => {
    if (confirmModal?.onCancel) {
      confirmModal.onCancel();
    }
    setConfirmModal(null);
  };

  const removeToast = (id) => {
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showConfirm }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {confirmModal && (
        <ConfirmModal
          visible={true}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer = ({ toasts, onRemove }) => {
  const { colors } = useTheme();
  const styles = createContainerStyles(colors);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <ToastItem key={toast.id} toast={toast} index={index} onRemove={onRemove} />
      ))}
    </View>
  );
};

const ToastItem = ({ toast, index, onRemove }) => {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return { backgroundColor: colors.success, textColor: colors.onPrimary, icon: '✓' };
      case 'error':
        return { backgroundColor: colors.error, textColor: colors.onPrimary, icon: '✕' };
      case 'warning':
        return { backgroundColor: colors.warning, textColor: colors.onSecondary, icon: '!' };
      default:
        return { backgroundColor: colors.primary, textColor: colors.onPrimary, icon: 'ℹ' };
    }
  };

  const { backgroundColor, textColor, icon } = getToastConfig();
  const styles = createToastStyles(colors, backgroundColor, textColor);

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.message}>{toast.message}</Text>
      <TouchableOpacity onPress={() => onRemove(toast.id)} style={styles.closeBtn}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ConfirmModal = ({ visible, title, message, onConfirm, onCancel }) => {
  const { colors } = useTheme();
  const styles = createModalStyles(colors);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={onCancel}>
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnConfirm} onPress={onConfirm}>
              <Text style={styles.modalBtnConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createContainerStyles = (colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
});

const createToastStyles = (colors, backgroundColor, textColor) => StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: shape.corner,
    marginBottom: spacing.sm,
    minWidth: 300,
    maxWidth: Platform.OS === 'web' ? 450 : '90%',
    backgroundColor: backgroundColor,
    ...elevation.level3,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    color: textColor,
    fontSize: 14,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    color: textColor,
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  closeBtn: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  closeText: {
    color: textColor,
    opacity: 0.8,
    fontSize: 22,
    fontWeight: 'bold',
  },
});

const createModalStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay || 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: shape.cornerLarge,
    padding: spacing.xl,
    width: Platform.OS === 'web' ? 400 : '85%',
    maxWidth: 400,
    ...elevation.level4,
  },
  modalTitle: {
    ...typography.titleLarge,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  modalMessage: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalBtnCancel: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: shape.corner,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: 'transparent',
  },
  modalBtnCancelText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  modalBtnConfirm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: shape.corner,
    backgroundColor: colors.primary,
  },
  modalBtnConfirmText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '600',
  },
});

export default { ToastProvider, useToast };
