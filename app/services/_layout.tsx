import { Stack } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

export default function ServicesLayout() {
    const { C } = useTheme();
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.background }, animation: "none" }}>
            <Stack.Screen name="driving" />
            <Stack.Screen name="logistics" />
            <Stack.Screen name="lifestyle-travel" />
            <Stack.Screen name="corporate-pairing" />
            <Stack.Screen name="diaspora-support" />
            <Stack.Screen name="project-trust" />
            <Stack.Screen name="tier-purchase" />
            <Stack.Screen name="ladies-concierge" />
            <Stack.Screen name="gentlemens-concierge" />
            <Stack.Screen name="request-package" />
        </Stack>
    );
}
