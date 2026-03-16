import { useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { useRouter, useSegments } from "expo-router";
import { useState } from "react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Session } from "@supabase/supabase-js";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import {
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
    Jost_800ExtraBold,
} from "@expo-google-fonts/jost";

SplashScreen.preventAutoHideAsync();

function useProtectedRoute(session: Session | null, loading: boolean) {
    const segments = useSegments();
    const router = useRouter();
    const hiddenRef = useRef(false);

    useEffect(() => {
        if (loading) return;
        const inAuthGroup = segments[0] === "(auth)";
        if (!session && !inAuthGroup) {
            router.replace("/(auth)/splash");
        } else if (session && inAuthGroup) {
            router.replace("/(tabs)");
        }

        if (!hiddenRef.current) {
            hiddenRef.current = true;
            setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 100);
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
                <Stack.Screen name="(main)" />
                <Stack.Screen name="services" />
                <Stack.Screen name="requests/[id]" />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        PlayfairDisplay_400Regular,
        PlayfairDisplay_400Regular_Italic,
        PlayfairDisplay_700Bold,
        Jost_300Light,
        Jost_400Regular,
        Jost_500Medium,
        Jost_600SemiBold,
        Jost_700Bold,
        Jost_800ExtraBold,
    });

    if (!fontsLoaded) return null;

    return (
        <ThemeProvider>
            <RootContent />
        </ThemeProvider>
    );
}
