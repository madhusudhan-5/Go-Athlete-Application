import { Image, View, Animated } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from 'expo-router';


export default function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const router = useRouter();

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();

        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                router.replace('/onboarding/OnboardingScreen');
            });
        }, 1500);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <Animated.View className="flex-1 items-center justify-center bg-white" style={{ opacity: fadeAnim }}>
            <Animated.Image
                source={require("../../assets/images/go-athele-logo.png")}
                className="w-[200px] h-[200px]"
                resizeMode="contain"
                style={{ transform: [{ scale: scaleAnim }] }}
            />
        </Animated.View>
    );
}


