import { useEffect, useMemo } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Animated, TouchableOpacity, Text, DeviceEventEmitter, Modal } from "react-native";
import { Car, Calendar, CalendarX, Crown, MessageCircle, Bell, X as XIcon } from "lucide-react-native";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Session } from "@supabase/supabase-js";
import { usePushToken } from "@/lib/usePushToken";
import ShakeReport from "@/components/ShakeReport"
import TermsSheet from "@/components/TermsSheet";
import LapeqToast from "@/components/LapeqToast";
import ErrorBoundary from "@/components/ErrorBoundary";
import { View } from "react-native";
import Skeleton from "@/components/Skeleton";
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

    useEffect(() => {
        if (loading) return;
        const inAuthGroup = segments[0] === "(auth)";
        if (!session && !inAuthGroup) {
            router.replace("/(auth)/onboarding");
        } else if (session && inAuthGroup) {
            // Check if this user has seen the welcome screen yet
            AsyncStorage.getItem("lapeq_welcome_seen").then(seen => {
                if (!seen) {
                    router.replace("/welcome" as any);
                } else {
                    router.replace("/(tabs)");
                }
            });
        }
    }, [session, loading, segments]);
}

const GOLD = "#c9a84c";
const NOTIF_URGENT_TYPES = ["trip_status", "itinerary_cancelled"];
const NOTIF_TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
    chauffeur_assigned: { icon: Car, color: "#a78bfa" },
    trip_status: { icon: Car, color: GOLD },
    itinerary_cancelled: { icon: CalendarX, color: "#ef5350" },
    itinerary: { icon: Calendar, color: "#c084fc" },
    welcome: { icon: Crown, color: GOLD },
    chat: { icon: MessageCircle, color: GOLD },
};

function NotificationBanner() {
    const { theme, C } = useTheme();
    const router = useRouter();
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const scale = useReactRef(new Animated.Value(0.85)).current;
    const opacity = useReactRef(new Animated.Value(0)).current;
    const dismissTimer = useReactRef<ReturnType<typeof setTimeout> | null>(null);

    const animateOut = (cb?: () => void) => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        Animated.parallel([
            Animated.timing(scale, { toValue: 0.9, duration: 180, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => { setNotification(null); cb?.(); });
    };

    useEffect(() => {
        let sub: any, responseSub: any;
        try {
            sub = Notifications.addNotificationReceivedListener(notif => {
                setNotification(notif);
                scale.setValue(0.85);
                opacity.setValue(0);
                Animated.parallel([
                    Animated.spring(scale, { toValue: 1, tension: 220, friction: 16, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                ]).start();

                // Urgent types (trip status, itinerary cancelled) stay up until the
                // member acknowledges them — everything else auto-dismisses.
                const notifData = notif.request.content.data as Record<string, any> | undefined;
                if (!NOTIF_URGENT_TYPES.includes(notifData?.type)) {
                    if (dismissTimer.current) clearTimeout(dismissTimer.current);
                    dismissTimer.current = setTimeout(() => animateOut(), 5000);
                }
            });

            responseSub = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data as Record<string, any> | undefined;
                const reqId = data?.target_id || data?.targetId || data?.request_id || data?.requestId;
                const notifType = data?.type || data?.notification_type;
                const notifId = data?.notif_id || data?.notifId;

                if (notifType === "chauffeur_assigned" || notifType === "trip_status") {
                    router.push("/(main)/coordination");
                } else if (notifType === "itinerary") {
                    if (notifId) router.push({ pathname: "/itinerary-view", params: { notifId } } as any);
                    else router.push("/(main)/notifications");
                } else if (notifType === "request" || notifType === "receipt" || notifType === "itinerary_cancelled") {
                    if (reqId) router.push(`/requests/${reqId}`);
                    else router.push("/requests");
                } else if (notifType === "chat") {
                    router.push({ pathname: "/(main)/chat", params: { mode: "concierge" } } as any);
                } else if (data?.url) {
                    router.push(data.url);
                } else {
                    router.push("/(main)/notifications");
                }
            });
        } catch {}

        return () => {
            try { sub?.remove(); } catch {}
            try { responseSub?.remove(); } catch {}
            if (dismissTimer.current) clearTimeout(dismissTimer.current);
        };
    }, []);

    if (!notification) return null;

    const title = notification.request.content.title;
    const body = notification.request.content.body;
    const data = notification.request.content.data as Record<string, any> | undefined;
    const notifType: string = data?.type || data?.notification_type || "general";
    const isUrgent = NOTIF_URGENT_TYPES.includes(notifType);
    const cfg = NOTIF_TYPE_CONFIG[notifType] ?? { icon: Bell, color: GOLD };
    const Icon = cfg.icon;

    const goToTarget = () => {
        const reqId = data?.target_id || data?.targetId || data?.request_id || data?.requestId;
        const notifId = data?.notif_id || data?.notifId;

        if (notifType === "chauffeur_assigned" || notifType === "trip_status") {
            router.push("/(main)/coordination");
        } else if (notifType === "itinerary") {
            if (notifId) router.push({ pathname: "/itinerary-view", params: { notifId } } as any);
            else router.push("/(main)/notifications");
        } else if (notifType === "request" || notifType === "receipt" || notifType === "itinerary_cancelled") {
            if (reqId) router.push(`/requests/${reqId}`);
            else router.push("/requests");
        } else if (notifType === "chat") {
            router.push({ pathname: "/(main)/chat", params: { mode: "concierge" } } as any);
        } else if (data?.url) {
            router.push(data.url);
        } else {
            router.push("/(main)/notifications");
        }
    };

    return (
        <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => { if (!isUrgent) animateOut(); }}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => { if (!isUrgent) animateOut(); }}
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 28 }}
            >
                <Animated.View
                    style={{
                        width: "100%",
                        maxWidth: 380,
                        backgroundColor: theme === "dark" ? "#161616" : "#fff",
                        borderRadius: 24,
                        padding: 26,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 12 },
                        shadowOpacity: 0.35,
                        shadowRadius: 30,
                        elevation: 16,
                        transform: [{ scale }],
                        opacity,
                    }}
                >
                    {!isUrgent && (
                        <TouchableOpacity
                            onPress={() => animateOut()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ position: "absolute", top: 16, right: 16 }}
                        >
                            <XIcon size={18} color={C.muted} />
                        </TouchableOpacity>
                    )}

                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${cfg.color}18`, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                        <Icon size={26} color={cfg.color} />
                    </View>

                    {title && <Text style={{ fontFamily: "PlayfairDisplay_700Bold", fontSize: 19, color: C.text, textAlign: "center", marginBottom: 8 }}>{title}</Text>}
                    {body && <Text style={{ fontFamily: "Jost_400Regular", fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 21, marginBottom: 22 }}>{body}</Text>}

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => animateOut(goToTarget)}
                        style={{ backgroundColor: cfg.color, borderRadius: 14, paddingVertical: 14, width: "100%", alignItems: "center" }}
                    >
                        <Text style={{ fontFamily: "Jost_700Bold", fontSize: 14, color: "#0a0a0a" }}>
                            {isUrgent ? "View Details" : "View"}
                        </Text>
                    </TouchableOpacity>

                    {!isUrgent && (
                        <TouchableOpacity onPress={() => animateOut()} style={{ marginTop: 12 }}>
                            <Text style={{ fontFamily: "Jost_400Regular", fontSize: 13, color: C.muted }}>Dismiss</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}


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
    const [tierPopup, setTierPopup] = useState<{ name: string; accent: string; perks: string[] } | null>(null);
    const popupScale = useReactRef(new Animated.Value(0.85)).current;
    const popupOpacity = useReactRef(new Animated.Value(0)).current;
    const { theme, C } = useTheme();
    const router = useRouter();

    usePushToken(session?.user?.id ?? null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                // Refresh token invalid or expired — clear stored session so the user
                // is sent back to the auth flow rather than seeing a crash loop.
                supabase.auth.signOut().finally(() => {
                    setSession(null);
                    setLoading(false);
                });
            } else {
                setSession(session);
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                router.replace("/(auth)/reset-password" as any);
                return;
            }
            if (event === "TOKEN_REFRESHED") {
                setSession(session);
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

    const TIER_META: Record<string, { accent: string; perks: string[] }> = {
        silver: { accent: "#a8b8cc", perks: ["Virtual concierge support", "Curated itinerary planning", "Airport & flight coordination", "Access to luxury hotels & apartments", "Access to sold-out event tickets"] },
        gold:   { accent: "#c9a84c", perks: ["Dedicated concierge manager", "Private jet access & bookings", "Last minute reservations", "Elite networking access", "Lapeq Privé", "Investment advisorship"] },
        black:  { accent: "#e8e8e8", perks: ["Priority fast-track on all requests", "Private security attached", "Medical concierge, priority specialist", "Dedicated concierge (extended hours)", "VIP fashion events & summits"] },
    };

    const showTierPopup = (tierId: string) => {
        const meta = TIER_META[tierId];
        if (!meta) return;
        setTierPopup({ name: tierId.charAt(0).toUpperCase() + tierId.slice(1), accent: meta.accent, perks: meta.perks });
        Animated.parallel([
            Animated.spring(popupScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
            Animated.timing(popupOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
    };

    // Show tier popup when "Welcome to Lapeq X" push arrives in foreground (most reliable path)
    useEffect(() => {
        let sub: any;
        try {
            sub = Notifications.addNotificationReceivedListener(notif => {
                const data = notif.request.content.data as Record<string, any> | undefined;
                if (data?.type === 'welcome') {
                    const title = notif.request.content.title ?? '';
                    const match = title.match(/Welcome to Lapeq (\w+)/i);
                    if (match) showTierPopup(match[1].toLowerCase());
                }
            });
        } catch {}
        return () => { try { sub?.remove(); } catch {} };
    }, []);

    useEffect(() => {
        if (!session?.user?.id) return;
        const channel = supabase
            .channel(`tier-watch-${session.user.id}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` }, (payload: any) => {
                console.log("[tier-watch] change received:", payload.old?.tier, "->", payload.new?.tier);
                const newTier = payload.new?.tier?.toLowerCase();
                const oldTier = payload.old?.tier?.toLowerCase();
                if (newTier && newTier !== oldTier && newTier !== "free" && newTier !== "standard") {
                    showTierPopup(newTier);
                    // DB trigger inserts a notification ~instant after — give it a moment then refresh badge
                    setTimeout(() => DeviceEventEmitter.emit("notifications:refresh"), 400);
                }
            })
            .subscribe((status) => console.log("[tier-watch] subscription status:", status));
        return () => { supabase.removeChannel(channel); };
    }, [session?.user?.id]);

    const userIdRef = useReactRef<string | null>(null);

    useEffect(() => {
        if (!session?.user?.id) return;
        userIdRef.current = session.user.id;
    }, [session?.user?.id]);

    // Cold-start: if the app was killed and launched via a notification tap,
    // addNotificationResponseReceivedListener misses it — useLastNotificationResponse catches it.
    const lastNotifResponse = Notifications.useLastNotificationResponse();
    const coldStartHandled = useReactRef(false);
    useEffect(() => {
        if (loading || showSplash || coldStartHandled.current || !lastNotifResponse) return;
        coldStartHandled.current = true;
        const data = lastNotifResponse.notification.request.content.data as Record<string, any> | undefined;
        const reqId = data?.target_id || data?.targetId || data?.request_id || data?.requestId;
        const notifType = data?.type || data?.notification_type;
        const notifId = data?.notif_id || data?.notifId;

        if (notifType === "chauffeur_assigned" || notifType === "trip_status") {
            router.push("/(main)/coordination");
        } else if (notifType === "itinerary") {
            if (notifId) router.push({ pathname: "/itinerary-view", params: { notifId } } as any);
            else router.push("/(main)/notifications");
        } else if (notifType === "request" || notifType === "receipt" || notifType === "itinerary_cancelled") {
            if (reqId) router.push(`/requests/${reqId}`);
            else router.push("/requests");
        } else if (notifType === "chat") {
            router.push({ pathname: "/(main)/chat", params: { mode: "concierge" } } as any);
        } else if (data?.url) {
            router.push(data.url);
        }
    }, [loading, showSplash, lastNotifResponse]);

    return (
        <View style={{ flex: 1, backgroundColor: C.background }}>
            <StatusBar style={theme === "dark" ? "light" : "dark"} />
            <NotificationBanner />
            <ShakeReport />
            <TermsSheet />
            <LapeqToast />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.background }, animation: "slide_from_right" }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="welcome" options={{ headerShown: false, animation: "none", gestureEnabled: false }} />
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
                <Stack.Screen name="settings/change-password" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
            </Stack>
            {/* Skeleton home screen while session is loading */}
            {loading && (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0a0a0a", zIndex: 997, paddingTop: 64, paddingHorizontal: 20 }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                        <View style={{ flex: 1, gap: 8 }}>
                            <Skeleton width={72} height={9} borderRadius={5} style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
                            <Skeleton width={180} height={20} borderRadius={6} style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
                        </View>
                        <Skeleton width={40} height={40} borderRadius={20} style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
                    </View>
                    {/* Hero card */}
                    <Skeleton width="100%" height={172} borderRadius={20} style={{ marginBottom: 16, backgroundColor: "rgba(255,255,255,0.06)" }} />
                    {/* 2×2 service grid */}
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                        <Skeleton width="48%" height={128} borderRadius={16} style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                        <Skeleton width="48%" height={128} borderRadius={16} style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                    </View>
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                        <Skeleton width="48%" height={128} borderRadius={16} style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                        <Skeleton width="48%" height={128} borderRadius={16} style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                    </View>
                    {/* Section label */}
                    <Skeleton width={110} height={11} borderRadius={5} style={{ marginBottom: 14, backgroundColor: "rgba(255,255,255,0.07)" }} />
                    {/* Horizontal partner cards */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <Skeleton width={150} height={190} borderRadius={16} style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                        <Skeleton width={150} height={190} borderRadius={16} style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                        <Skeleton width={150} height={190} borderRadius={16} style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                    </View>
                </View>
            )}
            {/* Splash overlay — always on top; stack renders underneath so navigation fires before it fades */}
            {showSplash && <AppSplash onDone={() => setShowSplash(false)} />}

            {/* Membership upgrade popup */}
            {tierPopup && (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 999, paddingHorizontal: 24 }}>
                    <Animated.View style={{ width: "100%", opacity: popupOpacity, transform: [{ scale: popupScale }], backgroundColor: "#111", borderRadius: 28, padding: 28, borderWidth: 1, borderColor: `${tierPopup.accent}30` }}>
                        <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 3, color: tierPopup.accent, marginBottom: 10 }}>LAPEQ {tierPopup.name.toUpperCase()}</Text>
                        <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 6 }}>You're in.</Text>
                        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 24, lineHeight: 20 }}>Your membership is active. Here's what you now have access to.</Text>

                        <View style={{ gap: 12, marginBottom: 28 }}>
                            {tierPopup.perks.map((perk, i) => (
                                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                                    <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: `${tierPopup.accent}24`, alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                                        <Text style={{ fontSize: 9, color: tierPopup.accent, fontWeight: "900" }}>✓</Text>
                                    </View>
                                    <Text style={{ flex: 1, fontSize: 13.5, color: "rgba(255,255,255,0.8)", lineHeight: 20 }}>{perk}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={{ backgroundColor: tierPopup.accent, borderRadius: 16, paddingVertical: 16, alignItems: "center" }}
                            onPress={() => {
                                Animated.parallel([
                                    Animated.timing(popupOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
                                    Animated.timing(popupScale, { toValue: 0.85, duration: 150, useNativeDriver: true }),
                                ]).start(() => {
                                    setTierPopup(null);
                                    popupScale.setValue(0.85);
                                    popupOpacity.setValue(0);
                                });
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={{ fontSize: 15, fontWeight: "800", color: "#0a0a0a" }}>Start Exploring</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </View>
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

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <ThemeProvider>
            <ErrorBoundary>
                <RootContent />
            </ErrorBoundary>
        </ThemeProvider>
    );
}
