import { Platform } from "react-native";

export const API_CONFIG = {
  PRODUCTION_URL: process.env.EXPO_PUBLIC_API_URL || "https://api.goathlete.in",

  DEVELOPMENT_URL: "http://localhost:5000",
  ANDROID_EMULATOR_URL: "http://10.0.2.2:5000",

  API_PATH: "/api",
};

export const getApiBaseUrl = () => {
  // Android Emulator
  if (Platform.OS === "android" && !process.env.EAS_BUILD) {
    return `${API_CONFIG.ANDROID_EMULATOR_URL}${API_CONFIG.API_PATH}`;
  }

  // Web
  if (Platform.OS === "web") {
    return `${API_CONFIG.PRODUCTION_URL}${API_CONFIG.API_PATH}`;
  }

  // iOS + Android DEVICE (not emulator)
  return `${API_CONFIG.PRODUCTION_URL}${API_CONFIG.API_PATH}`;
};

export default API_CONFIG;
