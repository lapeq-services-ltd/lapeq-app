import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AuthLayout() {
    return (
        <>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
                <Stack.Screen name="splash" />
                <Stack.Screen name="onboarding" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="register" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="forgot-password" options={{ animation: "slide_from_right" }} />
            </Stack>
        </>
    );
}
