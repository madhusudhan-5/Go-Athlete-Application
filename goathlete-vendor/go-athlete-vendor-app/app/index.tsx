import {
  View,
  Text,
  Animated,
  Image,
  Dimensions,
  FlatList
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import SplashScreen from "./splash/SplashScreen";
export default function Index() {
  return (
    <View
    
      className=" h-screen w-full flex items-center justify-center "
    >
      <View className=" h-full w-full flex itex-center justify-center ">
        <SplashScreen />
      </View>

    </View>
  );
}
