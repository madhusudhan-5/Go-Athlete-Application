import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions, Easing } from "react-native";
import GoLogo from "../../assets/images/go.svg";
import AthleteLogo from "../../assets/images/athlete.svg";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const SplashScreen = () => {
  const goScale = useRef(new Animated.Value(2.5)).current; // Start large
  const goTranslateX = useRef(new Animated.Value(60)).current; // Centered initially
  const athleteTranslateX = useRef(new Animated.Value(80)).current;
  const athleteOpacity = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    // Fade-in background
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Animation sequence
    Animated.sequence([
      Animated.delay(2000), // Wait 2 seconds with big centered GO
      // Shrink and move GO
      Animated.parallel([
        Animated.timing(goScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(goTranslateX, {
          toValue: 48,
          duration: 600,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      // Show Athlete
      Animated.parallel([
        Animated.timing(athleteTranslateX, {
          toValue: -48,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(athleteOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTimeout(() => {
        router.replace("/onboarding/OnboardingScreen");
      }, 500);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: backgroundOpacity }]}>
      <View style={styles.row}>
        <Animated.View
          style={{
            transform: [
              { scale: goScale },
              { translateX: goTranslateX },
            ],
          }}
        >
          <GoLogo width={110} height={110} />
        </Animated.View>

        <Animated.View
          style={{
            marginLeft: 12,
            marginTop: 10,
            opacity: athleteOpacity,
            transform: [{ translateX: athleteTranslateX }],
          }}
        >
          <AthleteLogo width={width * 0.8} height={100} />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F35",
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
