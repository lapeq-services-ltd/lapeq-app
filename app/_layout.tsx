import { useEffect, useRef, useMemo } from "react";
import Reanimated, { useSharedValue, withTiming, withDelay, useAnimatedStyle, runOnJS, Easing as ReanimatedEasing } from "react-native-reanimated";
import { Canvas, Path as SkiaPath, Skia, Group } from "@shopify/react-native-skia";
import { LOGO_PATHS } from "@/assets/logo/logoPaths";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { useRouter, useSegments } from "expo-router";
import { useState, useRef as useReactRef } from "react";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Animated, TouchableOpacity, Text, Image, Easing, Dimensions } from "react-native";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Session } from "@supabase/supabase-js";
import { usePushToken } from "@/lib/usePushToken";
import ShakeReport from "@/components/ShakeReport"
import TermsSheet from "@/components/TermsSheet";
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
        let sub: any, responseSub: any;
        try {
            sub = Notifications.addNotificationReceivedListener(notif => {
                setNotification(notif);
                Animated.spring(translateY, {
                    toValue: 0,
                    velocity: 3,
                    tension: 2,
                    friction: 8,
                    useNativeDriver: true,
                }).start();

                setTimeout(() => {
                    Animated.timing(translateY, {
                        toValue: -150,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(() => setNotification(null));
                }, 4000);
            });

            responseSub = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data as Record<string, any> | undefined;
                if (data?.type === "request") {
                    if (data.targetId) router.push(`/requests/${data.targetId}`);
                    else router.push("/requests");
                } else if (data?.url) {
                    router.push(data.url);
                } else {
                    router.push("/notifications");
                }
            });
        } catch {}

        return () => {
            try { sub?.remove(); } catch {}
            try { responseSub?.remove(); } catch {}
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
                        const data = notification.request.content.data as Record<string, any> | undefined;
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

const { width: SW, height: SH } = Dimensions.get("window");
const CIRCLE_SIZE = 60;
const MAX_SCALE = Math.ceil(Math.sqrt(SW * SW + SH * SH) / (CIRCLE_SIZE / 2)) + 2;

const OUTLINE_VERTICAL = "M 158 141 L 228 124 C 234 123 238 126 238 132 L 236 262 C 236 268 232 271 226 272 L 150 293 C 144 294 140 291 140 285 L 141 151 C 141 145 145 142 158 141 Z";
const OUTLINE_HORIZONTAL = "M 175 323 L 319 274 C 325 272 331 273 334 278 L 366 326 C 370 332 371 333 361 335 L 209 370 C 203 371 198 372 194 365 L 170 333 C 167 329 163 327 175 323 Z";

const BASE_INDICES = new Set([
    27,28,29,30,31,32,33,34,35,36,37,38,39,41,43,45,47,49,50,52,54,55,57,58,59,61,65,67,68,69,70,73,75,76,77,78,79,80,81,82,83,84,85,86,88,89,90,91,93,94,95,97,98,99,100,102,104,105
]);

function AppSplash({ onDone }: { onDone: () => void }) {
    // === All shared values start at guaranteed initial states ===
    // drawProgress: 0 = no stroke drawn, 1 = full stroke drawn
    const drawProgress = useSharedValue(0);
    // fillOpacity: STARTS AT 0 — fills are completely invisible on first render
    const fillOpacity = useSharedValue(0);
    // strokeOpacity: STARTS AT 1 — strokes are fully visible on first render
    const strokeOpacity = useSharedValue(1);
    // logoScale: pops closer during trace, shrinks back during fill
    const logoScale = useSharedValue(1.0);
    // screenOpacity: controls the entire splash container
    const screenOpacity = useSharedValue(1.0);

    const skiaPaths = useMemo(() => {
        return LOGO_PATHS.map(p => {
            const skiaPath = Skia.Path.MakeFromSVGString(p.d);
            return { path: skiaPath, fill: p.fill };
        }).filter((p): p is { path: NonNullable<typeof p.path>; fill: string } => p.path !== null);
    }, []);

    const verticalOutline = useMemo(() => Skia.Path.MakeFromSVGString(OUTLINE_VERTICAL)!, []);
    const horizontalOutline = useMemo(() => Skia.Path.MakeFromSVGString(OUTLINE_HORIZONTAL)!, []);

    useEffect(() => {
        // PHASE 1 (0 — 2.5s): Trace the outlines. Scale pops closer simultaneously.
        logoScale.value = withTiming(1.15, { duration: 2500, easing: ReanimatedEasing.out(ReanimatedEasing.quad) });
        drawProgress.value = withTiming(1, { duration: 2500, easing: ReanimatedEasing.inOut(ReanimatedEasing.quad) }, () => {

            // PHASE 2 (2.5s — 4.2s): Gold fills fade in. Strokes fade out. Scale shrinks back.
            fillOpacity.value = withTiming(1, { duration: 1700, easing: ReanimatedEasing.out(ReanimatedEasing.quad) });
            strokeOpacity.value = withTiming(0, { duration: 800, easing: ReanimatedEasing.in(ReanimatedEasing.quad) });
            logoScale.value = withTiming(1.0, { duration: 1700, easing: ReanimatedEasing.inOut(ReanimatedEasing.quad) }, () => {

                // PHASE 3 (4.2s — 5.2s): Hold the complete gold logo — 1 second pause.
                // PHASE 4 (5.2s — 6.0s): Fade out and unmount.
                screenOpacity.value = withDelay(1000, withTiming(0, { duration: 800, easing: ReanimatedEasing.in(ReanimatedEasing.quad) }, () => {
                    runOnJS(onDone)();
                }));
            });
        });
    }, []);

    const animatedOverlayStyle = useAnimatedStyle(() => ({
        opacity: screenOpacity.value,
    }));

    const animatedLogoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
    }));

    return (
        <Reanimated.View style={[{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "#000000", alignItems: "center", justifyContent: "center",
            zIndex: 999,
        }, animatedOverlayStyle]}>
            <Reanimated.View style={animatedLogoStyle}>
                <Canvas style={{ width: 160, height: 160 }}>
                    <Group transform={[{ scale: 0.32 }]}>

                        {/* === FILLS: invisible until Phase 2 starts === */}
                        {/* Vertical panel fills */}
                        <Group opacity={fillOpacity}>
                            {skiaPaths.map((p, index) => {
                                if (BASE_INDICES.has(index)) return null;
                                return <SkiaPath key={`fv-${index}`} path={p.path} color={p.fill} />;
                            })}
                        </Group>

                        {/* Horizontal base panel fills */}
                        <Group opacity={fillOpacity}>
                            {skiaPaths.map((p, index) => {
                                if (!BASE_INDICES.has(index)) return null;
                                return <SkiaPath key={`fh-${index}`} path={p.path} color={p.fill} />;
                            })}
                        </Group>

                        {/* === STROKES: fully visible from frame 1, trace from 0→1 === */}
                        <Group opacity={strokeOpacity}>
                            {/* Vertical Outline */}
                            <SkiaPath
                                path={verticalOutline}
                                color="#E6C173"
                                style="stroke"
                                strokeWidth={2}
                                strokeCap="round"
                                strokeJoin="round"
                                start={0}
                                end={drawProgress}
                            />
                            {/* Horizontal Outline */}
                            <SkiaPath
                                path={horizontalOutline}
                                color="#E6C173"
                                style="stroke"
                                strokeWidth={2}
                                strokeCap="round"
                                strokeJoin="round"
                                start={0}
                                end={drawProgress}
                            />
                        </Group>

                    </Group>
                </Canvas>
            </Reanimated.View>
        </Reanimated.View>
    );
}


function RootContent() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(true);
    const { theme, C } = useTheme();
    const router = useRouter();

    usePushToken(session?.user?.id ?? null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                router.replace("/(auth)/reset-password" as any);
                return;
            }
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);


    // Handle auth deep links (magic links, password reset, email confirmation)
    useEffect(() => {
        const handleAuthUrl = async (url: string) => {
            if (!url.includes("#")) return;
            const hash = url.split("#")[1];
            const params: Record<string, string> = {};
            hash.split("&").forEach(part => {
                const [k, v] = part.split("=");
                if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
            });
            const { access_token, refresh_token } = params;
            if (!access_token || !refresh_token) return;
            await supabase.auth.setSession({ access_token, refresh_token });
        };

        Linking.getInitialURL().then(url => { if (url) handleAuthUrl(url); });
        const sub = Linking.addEventListener("url", ({ url }) => handleAuthUrl(url));
        return () => sub.remove();
    }, []);

    useProtectedRoute(session, loading);

    if (showSplash) {
        return <AppSplash onDone={() => setShowSplash(false)} />;
    }

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
            <ShakeReport />
            <TermsSheet />
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
                <Stack.Screen name="explore/experiences" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="journal" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="monthly-picks" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="settings/notification-prefs" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="settings/privacy" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="settings/help" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="settings/about" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="settings/personal-info" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="settings/payment-methods" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="settings/app-guide" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
                <Stack.Screen name="settings/report" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
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
