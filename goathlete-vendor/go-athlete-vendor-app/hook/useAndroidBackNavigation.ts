// common/hooks/useAndroidBackNavigation.ts

import { useEffect } from "react";
import { BackHandler } from "react-native";
import { useNavigation } from "@react-navigation/native";

type UseAndroidBackNavigationProps = {
  fallbackScreen?: string; // If no history, go to this screen
};

export function useAndroidBackNavigation({ fallbackScreen }: UseAndroidBackNavigationProps = {}) {
  const navigation = useNavigation();

  useEffect(() => {
    const onBackPress = () => {
      if (navigation.canGoBack()) {
        navigation.goBack(); // 👈 Go back if possible
      } else if (fallbackScreen) {
        navigation.navigate(fallbackScreen); // 👈 Go to fallback
      }
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => subscription.remove();
  }, [navigation, fallbackScreen]);
}
