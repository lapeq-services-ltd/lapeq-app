import { useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { useRouter, useSegments } from "expo-router";
import { useState, useRef as useReactRef } from "react";
import * as Notifications from "expo-notifications";
import { Animated, TouchableOpacity, Text } from "react-native";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Session } from "@supabase/supabase-js";
import { usePushToken } from "@/lib/usePushToken";
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

function NotificationBanner() {
    const { theme, C } = useTheme();
    const router = useRouter();
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const translateY = useReactRef(new Animated.Value(-150)).current;

    useEffect(() => {
        const sub = Notifications.addNotificationReceivedListener(notif => {
            setNotification(notif);
            Animated.spring(translateY, {
                toValue: 0,
                velocity: 3,
                tension: 2,
                friction: 8,
                useNativeDriver: true,
            }).start();

            // Auto-hide after 4 seconds
            setTimeout(() => {
                Animated.timing(translateY, {
                    toValue: -150,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => setNotification(null));
            }, 4000);
        });
        
        const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.type === "request") {
                if (data.targetId) router.push(`/requests/${data.targetId}`);
                else router.push("/requests");
            } else if (data?.url) {
                router.push(data.url);
            } else {
                router.push("/notifications");
            }
        });

        return () => {
            sub.remove();
            responseSub.remove();
        };
    }, []);

    if (!notification) return null;

    const title = notification.request.content.title;
    const body = notification.request.content.body;

    return (
        <Animated.View
            style={{
                position: "absolute",
                top: 50,
                left: 16,
                right: 16,
                zIndex: 9999,
                transform: [{ translateY }],
            }}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    Animated.timing(translateY, { toValue: -150, duration: 200, useNativeDriver: true }).start(() => {
                        const data = notification.request.content.data;
                        if (data?.type === "request" || data?.type === "receipt") {
                            if (data.targetId) router.push(`/requests/${data.targetId}`);
                            else router.push("/requests");
                        } else if (data?.url) {
                            router.push(data.url);
                        } else {
                            router.push("/notifications");
                        }
                        setNotification(null);
                    });
                }}
                style={{
                    backgroundColor: theme === "dark" ? "#1a1a1a" : "#fff",
                    borderRadius: 16,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 5,
                    borderWidth: 1,
                    borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                }}
            >
                {title && <Text style={{ fontFamily: "Jost_600SemiBold", fontSize: 16, color: C.text, marginBottom: 4 }}>{title}</Text>}
                {body && <Text style={{ fontFamily: "Jost_400Regular", fontSize: 14, color: C.muted }}>{body}</Text>}
            </TouchableOpacity>
        </Animated.View>
    );
}

function RootContent() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme, C } = useTheme();

    usePushToken(session?.user?.id ?? null);

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
            <NotificationBanner />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.background }, animation: "fade" }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(main)" />
                <Stack.Screen name="services" />
                <Stack.Screen name="requests/index" options={{ gestureEnabled: true }} />
                <Stack.Screen name="requests/[id]" options={{ gestureEnabled: true }} />
                <Stack.Screen name="explore/venues" options={{ gestureEnabled: true }} />
                <Stack.Screen name="explore/venue-detail" options={{ gestureEnabled: true }} />
                <Stack.Screen name="explore/saved-places" options={{ gestureEnabled: true }} />
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
