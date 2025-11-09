import { useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const useCustomAnimations = () => {
  // Fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Scale animation
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Slide animation
  const slideAnim = useRef(new Animated.Value(-100)).current;
  
  // Rotate animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = (duration = 300) => {
    return new Promise((resolve) => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        easing: Easing.ease,
      }).start(resolve);
    });
  };

  const fadeOut = (duration = 300) => {
    return new Promise((resolve) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
        easing: Easing.ease,
      }).start(resolve);
    });
  };

  const scaleIn = (duration = 300) => {
    return new Promise((resolve) => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }).start(resolve);
    });
  };

  const slideIn = (duration = 300) => {
    return new Promise((resolve) => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start(resolve);
    });
  };

  const rotate = (duration = 1000) => {
    return new Promise((resolve) => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      ).start(resolve);
    });
  };

  const shake = (value: Animated.Value) => {
    return new Promise((resolve) => {
      Animated.sequence([
        Animated.timing(value, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(resolve);
    });
  };

  return {
    animations: {
      fadeAnim,
      scaleAnim,
      slideAnim,
      rotateAnim,
    },
    actions: {
      fadeIn,
      fadeOut,
      scaleIn,
      slideIn,
      rotate,
      shake,
    },
  };
};