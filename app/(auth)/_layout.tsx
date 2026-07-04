import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AuthLayout() {
    return (
        <>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: "none", contentStyle: { backgroundColor: "#000000" } }}>
                <Stack.Screen name="onboarding" options={{ animation: "none" }} />
                <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="register" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="forgot-password" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="reset-password" options={{ animation: "slide_from_right" }} />
            </Stack>
        </>
    );
}

