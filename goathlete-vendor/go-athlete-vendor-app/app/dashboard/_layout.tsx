import { Tabs, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="(tabs)"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="court-registration"
                options={{
                    presentation: 'modal',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="court-management"
                options={{
                    title: 'Manage Courts',
                }}
            />
            <Stack.Screen
                name="analytics"
                options={{
                    title: 'Analytics',
                }}
            />
            <Stack.Screen
                name="offers"
                options={{
                    title: 'Manage Offers',
                }}
            />
        </Stack>
    );
}
