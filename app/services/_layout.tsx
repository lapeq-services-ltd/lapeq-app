import { Stack } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

export default function ServicesLayout() {
    const { C } = useTheme();
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.background }, animation: "slide_from_right" }}>
            <Stack.Screen name="driving" />
            <Stack.Screen name="logistics" />
            <Stack.Screen name="lifestyle-travel" />
            <Stack.Screen name="lifestyle" />
            <Stack.Screen name="lifestyle-request" />
            <Stack.Screen name="lifestyle-legal" />
            <Stack.Screen name="lifestyle-gifts" />
            <Stack.Screen name="lifestyle-recreation" />
            <Stack.Screen name="lifestyle-medical" />
            <Stack.Screen name="lifestyle-property" />
            <Stack.Screen name="lifestyle-finance" />
            <Stack.Screen name="lifestyle-photography" />
            <Stack.Screen name="lifestyle-family" />
            <Stack.Screen name="corporate-pairing" />
            <Stack.Screen name="diaspora-support" />
            <Stack.Screen name="project-trust" />
            <Stack.Screen name="tier-purchase" />
            <Stack.Screen name="ladies-concierge" />
            <Stack.Screen name="gentlemens-concierge" />
            <Stack.Screen name="request-package" />
            <Stack.Screen name="experiences" />
        </Stack>
    );
}
