import { useCallback } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export const useAccessibility = () => {
  const announceForAccessibility = useCallback((message: string) => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // On Android, we need to check if screen reader is enabled
      AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
        if (enabled) {
          AccessibilityInfo.announceForAccessibility(message);
        }
      });
    }
  }, []);

  const getAccessibilityConfig = useCallback((config: {
    label?: string;
    hint?: string;
    role?: 'button' | 'header' | 'link' | 'search' | 'image' | 'text' | 'adjustable';
    state?: {
      disabled?: boolean;
      selected?: boolean;
      checked?: boolean;
      busy?: boolean;
      expanded?: boolean;
    };
  }) => {
    const { label, hint, role, state } = config;

    if (Platform.OS === 'ios') {
      return {
        accessible: true,
        accessibilityLabel: label,
        accessibilityHint: hint,
        accessibilityRole: role,
        accessibilityState: state,
      };
    }

    return {
      accessible: true,
      accessibilityLabel: [label, hint].filter(Boolean).join(', '),
      accessibilityRole: role,
      accessibilityState: state,
    };
  }, []);

  const getButtonAccessibility = useCallback((config: {
    label: string;
    hint?: string;
    disabled?: boolean;
  }) => {
    return getAccessibilityConfig({
      label: config.label,
      hint: config.hint,
      role: 'button',
      state: {
        disabled: config.disabled,
      },
    });
  }, [getAccessibilityConfig]);

  const getHeadingAccessibility = useCallback((config: {
    label: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  }) => {
    const { label, level = 1 } = config;
    
    if (Platform.OS === 'ios') {
      return {
        accessible: true,
        accessibilityLabel: label,
        accessibilityRole: 'header',
        accessibilityTraits: ['header'],
      };
    }

    return {
      accessible: true,
      accessibilityLabel: `Heading level ${level}, ${label}`,
      accessibilityRole: 'header',
    };
  }, []);

  const getInputAccessibility = useCallback((config: {
    label: string;
    hint?: string;
    error?: string;
    value?: string;
  }) => {
    const { label, hint, error, value } = config;
    
    let accessibilityLabel = label;
    if (error) {
      accessibilityLabel += `, Error: ${error}`;
    }
    if (value) {
      accessibilityLabel += `, Current value: ${value}`;
    }

    return {
      accessible: true,
      accessibilityLabel,
      accessibilityHint: hint,
      accessibilityRole: 'adjustable',
    };
  }, []);

  return {
    announceForAccessibility,
    getAccessibilityConfig,
    getButtonAccessibility,
    getHeadingAccessibility,
    getInputAccessibility,
  };
};