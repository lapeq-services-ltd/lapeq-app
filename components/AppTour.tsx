import { useRef, useState, useMemo, useEffect } from "react";
import type { RefObject } from "react";
import {
    View, Text, Modal, TouchableOpacity, StyleSheet,
    Dimensions, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sparkles, Bell, Crown, MapPin, MessageCircle, Star, Search, Calendar, User, ClipboardList } from "lucide-react-native";

const { width: SW, height: SH } = Dimensions.get("window");
const GOLD = "#c9a84c";
const OVERLAY = "rgba(0,0,0,0.86)";

// Tab bar constants (must match FloatingTabBar in app/(tabs)/_layout.tsx)
const BAR_MARGIN = 32;
const BAR_PADDING = 8;
const ACTIVE_BAR_W = SW - BAR_MARGIN * 2 - BAR_PADDING * 2;
const CELL_W = ACTIVE_BAR_W / 5;
const TAB_H = 58;

type TargetKey = "bell" | "avatar" | "grid" | "concierge" | "fab";

interface Spotlight { x: number; y: number; w: number; h: number; radius: number; }
interface Step {
    title: string;
    body: string;
    icon: any;
    spotlight: Spotlight | null;
    targetKey?: TargetKey;
    // Small illustrative chip shown inside the tooltip — used for steps that
    // describe something inside a closed drawer/menu, where there's no real
    // on-screen element left to spotlight.
    preview?: { icon: any; label: string };
}

interface Props {
    visible: boolean;
    onFinish: () => void;
    // Live refs to the actual on-screen elements — measured in-window so the
    // spotlight always lands on the real element instead of a guessed pixel
    // offset that drifts every time the home screen layout changes.
    targetRefs?: Partial<Record<TargetKey, RefObject<View | null>>>;
}

export default function AppTour({ visible, onFinish, targetRefs }: Props) {
    const [step, setStep] = useState(0);
    const [measured, setMeasured] = useState<Partial<Record<TargetKey, Spotlight>>>({});
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!visible || !targetRefs) return;
        const id = requestAnimationFrame(() => {
            (Object.keys(targetRefs) as TargetKey[]).forEach((key) => {
                const ref = targetRefs[key];
                ref?.current?.measureInWindow((x, y, width, height) => {
                    if (width > 0 && height > 0) {
                        const radius = key === "grid" ? 20 : key === "concierge" ? 22 : key === "fab" ? width / 2 : Math.min(width, height) / 2;
                        setMeasured(prev => ({ ...prev, [key]: { x, y, w: width, h: height, radius } }));
                    }
                });
            });
        });
        return () => cancelAnimationFrame(id);
    }, [visible, targetRefs]);

    const STEPS: Step[] = useMemo(() => {
        // Header buttons sit inside SafeAreaView + paddingTop: 8
        const headerBtnY = insets.top + 8;

        // Fallback estimates used only until the real ref measurement lands
        // (or if a ref fails to measure) — kept rough on purpose since the
        // live measurement is the source of truth for these steps.
        const cTop = insets.top + 64;
        const gridY = cTop + 182;
        const gridH = 244;
        const conciergeY = gridY + gridH + 32;
        const conciergeH = 44;

        // Tab bar floats at Math.max(insets.bottom, 36) from the bottom — see FloatingTabBar
        const tabBarBottom = Math.max(insets.bottom, 36);
        const tabY = SH - tabBarBottom - TAB_H;

        return [
            {
                title: "Welcome to Lapeq",
                body: "Your personal concierge, always on. Let us take 30 seconds to walk you through what's waiting for you.",
                icon: Sparkles,
                spotlight: null,
            },
            {
                title: "Your Notifications",
                body: "Stay updated. Tap the bell to see new messages, itineraries, and updates from your concierge.",
                icon: Bell,
                spotlight: { x: SW - 108, y: headerBtnY, w: 44, h: 44, radius: 22 },
                targetKey: "bell",
            },
            {
                title: "Your Account",
                body: "Tap your profile photo to open your account menu.",
                icon: User,
                spotlight: { x: SW - 52, y: headerBtnY + 6, w: 32, h: 32, radius: 16 },
                targetKey: "avatar",
            },
            {
                title: "Your Membership",
                body: "Once the menu is open, tap Membership to view your tier, upgrade, and unlock exclusive perks.",
                icon: Crown,
                spotlight: null,
                preview: { icon: Crown, label: "Membership" },
            },
            {
                title: "Request Any Service",
                body: "Chauffeur rides, travel itineraries, events, lifestyle support and more, all from your home screen.",
                icon: MapPin,
                spotlight: { x: 16, y: gridY, w: SW - 32, h: gridH, radius: 20 },
                targetKey: "grid",
            },
            {
                title: "Your Concierge",
                body: "One tap to reach your personal concierge, available 24/7 for requests, questions, or anything you need.",
                icon: MessageCircle,
                spotlight: { x: 20, y: conciergeY, w: SW - 40, h: conciergeH, radius: 22 },
                targetKey: "concierge",
            },
            {
                title: "Member Benefits",
                body: "Exclusive perks, dining privileges, travel upgrades, and VIP rewards, all unlocked by your tier.",
                icon: Star,
                spotlight: { x: BAR_MARGIN + BAR_PADDING + CELL_W, y: tabY, w: CELL_W, h: TAB_H, radius: 16 },
            },
            {
                title: "Explore Lagos & Abuja",
                body: "Handpicked restaurants, lounges, hotels, and experiences curated specifically for Lapeq members.",
                icon: Search,
                spotlight: { x: BAR_MARGIN + BAR_PADDING + CELL_W * 2, y: tabY, w: CELL_W, h: TAB_H, radius: 16 },
            },
            {
                title: "Private Events",
                body: "Exclusive dinners, cultural experiences, and VIP events. Your concierge handles every detail.",
                icon: Calendar,
                spotlight: { x: BAR_MARGIN + BAR_PADDING + CELL_W * 3, y: tabY, w: CELL_W, h: TAB_H, radius: 16 },
            },
            {
                title: "Your Profile",
                body: "View your membership, update personal details, and manage your Lapeq preferences.",
                icon: User,
                spotlight: { x: BAR_MARGIN + BAR_PADDING + CELL_W * 4, y: tabY, w: CELL_W, h: TAB_H, radius: 16 },
            },
            {
                title: "Quick Actions",
                body: "The (+) button is always here. Tap to make a request, track bookings, or jump to settings instantly.",
                icon: ClipboardList,
                spotlight: { x: SW - 66, y: SH - 162, w: 50, h: 50, radius: 25 },
                targetKey: "fab",
            },
        ];
    }, [insets.top, insets.bottom]);

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const goTo = (next: number) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
            setStep(next);
            Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        });
    };

    const finish = async () => {
        await AsyncStorage.setItem("lapeq_tour_seen", "1");
        setStep(0);
        onFinish();
    };

    const sp = (current.targetKey && measured[current.targetKey]) || current.spotlight;
    const r = sp?.radius ?? 12;

    // Position tooltip: header spotlights → below; bottom half → top; middle → below spotlight
    let tooltipTop: number;
    if (!sp) {
        tooltipTop = SH * 0.28;
    } else if (sp.y < insets.top + 120) {
        // Header area — put tooltip below the header
        tooltipTop = insets.top + 90;
    } else if (sp.y > SH * 0.5) {
        // Bottom half — put tooltip near top
        tooltipTop = insets.top + 80;
    } else {
        tooltipTop = Math.min(sp.y + sp.h + 20, SH - 360);
    }

    const Icon = current.icon;

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {sp ? (
                    <>
                        {/* 4-rect mask with hole */}
                        <View style={[s.overlay, { top: 0, left: 0, right: 0, height: sp.y }]} />
                        <View style={[s.overlay, { top: sp.y + sp.h, left: 0, right: 0, bottom: 0 }]} />
                        <View style={[s.overlay, { top: sp.y, left: 0, width: sp.x, height: sp.h }]} />
                        <View style={[s.overlay, { top: sp.y, left: sp.x + sp.w, right: 0, height: sp.h }]} />

                        {/* Gold spotlight border */}
                        <View
                            pointerEvents="none"
                            style={{
                                position: "absolute",
                                top: sp.y - 4, left: sp.x - 4,
                                width: sp.w + 8, height: sp.h + 8,
                                borderRadius: r + 4,
                                borderWidth: 2,
                                borderColor: GOLD,
                            }}
                        />
                    </>
                ) : (
                    <View style={[s.overlay, StyleSheet.absoluteFill]} />
                )}

                {/* Tooltip card */}
                <Animated.View style={[s.tooltip, { top: tooltipTop, opacity: fadeAnim }]}>
                    <View style={s.tooltipHeader}>
                        <View style={s.iconCircle}>
                            <Icon size={18} color={GOLD} />
                        </View>
                        <Text style={s.counter}>{step + 1} / {STEPS.length}</Text>
                    </View>

                    <Text style={s.title}>{current.title}</Text>
                    <Text style={s.body}>{current.body}</Text>

                    {current.preview && (
                        <View style={s.previewRow}>
                            <current.preview.icon size={16} color={GOLD} />
                            <Text style={s.previewText}>{current.preview.label}</Text>
                        </View>
                    )}

                    <View style={s.stepsRow}>
                        {STEPS.map((_, i) => (
                            <View key={i} style={[s.stepBox, i === step && s.stepBoxActive]} />
                        ))}
                    </View>

                    <View style={s.btnRow}>
                        <TouchableOpacity style={s.skipBtn} onPress={finish}>
                            <Text style={s.skipText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.nextBtn} onPress={() => isLast ? finish() : goTo(step + 1)}>
                            <Text style={s.nextText}>{isLast ? "Let's go" : "Next →"}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { position: "absolute", backgroundColor: OVERLAY },
    tooltip: {
        position: "absolute",
        left: 20,
        right: 20,
        backgroundColor: "#111",
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.18)",
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 20,
    },
    tooltipHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(201,168,76,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    counter: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 },
    title: { fontSize: 19, fontFamily: "Jost_700Bold", color: "#fff", marginBottom: 10 },
    body: { fontSize: 14, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.55)", lineHeight: 23, marginBottom: 28 },
    previewRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        alignSelf: "flex-start",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.35)",
        backgroundColor: "rgba(201,168,76,0.12)",
        marginTop: -12,
        marginBottom: 24,
    },
    previewText: { fontSize: 14, fontFamily: "Jost_700Bold", color: GOLD },
    stepsRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
    stepBox: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)" },
    stepBoxActive: { width: 18, backgroundColor: GOLD },
    btnRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    skipBtn: { paddingVertical: 10, paddingHorizontal: 4 },
    skipText: { fontSize: 14, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.28)" },
    nextBtn: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 26 },
    nextText: { color: "#0a0a0a", fontSize: 14, fontFamily: "Jost_700Bold" },
});
