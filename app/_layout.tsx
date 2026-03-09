import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { useRouter, useSegments } from "expo-router";
import { useState } from "react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Session } from "@supabase/supabase-js";
import { View, ActivityIndicator } from "react-native";

// Protect routes: redirect unauthenticated users to auth
function useProtectedRoute(session: Session | null, loading: boolean) {
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        const inAuthGroup = segments[0] === "(auth)";
        if (!session && !inAuthGroup) {
            router.replace("/(auth)/splash");
        } else if (session && inAuthGroup) {
            router.replace("/(tabs)");
        }
    }, [session, loading, segments]);
}

function RootContent() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme, C } = useTheme();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useProtectedRoute(session, loading);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.background }}>
                <ActivityIndicator color={C.primary} />
            </View>
        );
    }

    return (
        <>
            <StatusBar style={theme === "dark" ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="services" />
                <Stack.Screen name="requests/[id]" />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <RootContent />
        </ThemeProvider>
    );
}
