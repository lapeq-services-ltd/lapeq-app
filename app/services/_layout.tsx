import { Stack } from "expo-router";

export default function ServicesLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="driving" />
            <Stack.Screen name="logistics" />
            <Stack.Screen name="lifestyle-travel" />
            <Stack.Screen name="corporate-pairing" />
            <Stack.Screen name="diaspora-support" />
            <Stack.Screen name="project-trust" />
        </Stack>
    );
}
