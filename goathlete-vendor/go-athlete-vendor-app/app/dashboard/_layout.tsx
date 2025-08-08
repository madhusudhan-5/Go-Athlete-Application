import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";


// Component for Dashboard Tab Layout
export default function DashboardLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#000",
                tabBarLabelStyle: { fontSize: 12 },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <Ionicons name="home" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <Ionicons name="person" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <Ionicons name="settings" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
