import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface OTPInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
}

export default function OTPInput({
  length = 6,
  onComplete,
  autoFocus = true,
}: OTPInputProps) {
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (code.length === length && onComplete) {
      onComplete(code);
    }
  }, [code, length, onComplete]);

  useFocusEffect(
    React.useCallback(() => {
      if (autoFocus) {
        inputRefs.current[0]?.focus();
      }
      return () => {
        Keyboard.dismiss();
      };
    }, [autoFocus])
  );

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTextChange = (text: string, index: number) => {
    const newCode = code.split('');
    newCode[index] = text;
    const newValue = newCode.join('');
    setCode(newValue);

    // Auto advance to next input
    if (text.length === 1 && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && index > 0 && !code[index]) {
      inputRefs.current[index - 1]?.focus();
      const newCode = code.slice(0, -1);
      setCode(newCode);
    }
  };

  const handleFocus = (index: number) => {
    setIsFocused(true);
    if (index > code.length) {
      inputRefs.current[code.length]?.focus();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: shakeAnimation }] },
      ]}
    >
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <View
            key={index}
            style={[
              styles.inputContainer,
              isFocused && code[index] === undefined && index === code.length && styles.focused,
              code[index] && styles.filled,
            ]}
          >
            <TextInput
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={[
                styles.input,
                Platform.OS === 'web' && styles.webInput,
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={code[index] || ''}
              onChangeText={(text) => handleTextChange(text, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              onFocus={() => handleFocus(index)}
              onBlur={() => setIsFocused(false)}
              accessibilityLabel={`OTP digit ${index + 1} of ${length}`}
              accessibilityHint="Enter a single digit"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
            />
          </View>
        ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: 45,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  input: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    color: '#333',
  },
  webInput: {
    // 'outline' is a web-only CSS property and not part of React Native styles; remove to satisfy TypeScript.
  },
  focused: {
    borderColor: '#007AFF',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filled: {
    backgroundColor: '#E8F0FE',
    borderColor: '#007AFF',
  },
});