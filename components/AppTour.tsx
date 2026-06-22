import { useRef, useState } from "react";
import {
    View, Text, Modal, TouchableOpacity, StyleSheet,
    Dimensions, Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Home, Search, Calendar, User, Car, MessageCircle, ClipboardList } from "lucide-react-native";

const { width: SW, height: SH } = Dimensions.get("window");
const GOLD = "#c9a84c";
const OVERLAY = "rgba(0,0,0,0.82)";
const PAD = 10;

interface Spotlight {
    x: number;
    y: number;
    w: number;
    h: number;
    radius: number;
}

interface Step {
    title: string;
    body: string;
    icon: any;
    spotlight: Spotlight | null;
}

const TAB_Y = SH - 90;
const TAB_H = 65;
const TAB_W = SW / 4;

const STEPS: Step[] = [
    {
        title: "Welcome to Lapeq",
        body: "Let's take 30 seconds to show you how to get the most out of your membership.",
        icon: Home,
        spotlight: null,
    },
    {
        title: "Request Services",
        body: "Tap any service card to request chauffeur rides, events, travel arrangements, lifestyle support, and more.",
        icon: Car,
        spotlight: { x: PAD, y: 160, w: SW - PAD * 2, h: SH * 0.48, radius: 20 },
    },
    {
        title: "Explore",
        body: "Discover curated venues, restaurants, lounges, and experiences in your city - all handpicked for Lapeq members.",
        icon: Search,
        spotlight: { x: TAB_W * 1, y: TAB_Y, w: TAB_W, h: TAB_H, radius: 12 },
    },
    {
        title: "Events",
        body: "Browse and book exclusive events. From private dinners to VIP experiences - your concierge handles everything.",
        icon: Calendar,
        spotlight: { x: TAB_W * 2, y: TAB_Y, w: TAB_W, h: TAB_H, radius: 12 },
    },
    {
        title: "Profile & Membership",
        body: "View your membership tier, manage your personal info, preferences, and settings from your profile.",
        icon: User,
        spotlight: { x: TAB_W * 3, y: TAB_Y, w: TAB_W, h: TAB_H, radius: 12 },
    },
    {
        title: "Your Concierge",
        body: "Tap the 24/7 Concierge row to speak directly with your personal concierge - available any time for anything you need.",
        icon: MessageCircle,
        spotlight: { x: PAD, y: SH * 0.60, w: SW - PAD * 2, h: 90, radius: 16 },
    },
    {
        title: "Track Your Requests",
        body: "Tap 'My Requests' from the services grid to track every request you submit in real time.",
        icon: ClipboardList,
        spotlight: { x: SW / 2 + PAD / 2, y: SH * 0.52, w: SW / 2 - PAD * 1.5, h: SH * 0.12, radius: 16 },
    },
];

interface Props {
    visible: boolean;
    onFinish: () => void;
}

export default function AppTour({ visible, onFinish }: Props) {
    const [step, setStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const goTo = (next: number) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setStep(next);
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
    };

    const finish = async () => {
        await AsyncStorage.setItem("lapeq_tour_seen", "1");
        setStep(0);
        onFinish();
    };

    const sp = current.spotlight;

    // Tooltip position: tab bar steps → top of screen; content steps → below spotlight; no spotlight → center
    let tooltipTop: number;
    if (!sp) {
        tooltipTop = SH * 0.3;
    } else if (sp.y > SH * 0.55) {
        tooltipTop = 110;
    } else {
        tooltipTop = Math.min(sp.y + sp.h + 20, SH - 320);
    }

    const Icon = current.icon;
    const r = sp?.radius ?? 12;

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {sp ? (
                    <>
                        {/* 4-rect overlay */}
                        <View style={[s.overlay, { top: 0, left: 0, right: 0, height: sp.y }]} />
                        <View style={[s.overlay, { top: sp.y + sp.h, left: 0, right: 0, bottom: 0 }]} />
                        <View style={[s.overlay, { top: sp.y, left: 0, width: sp.x, height: sp.h }]} />
                        <View style={[s.overlay, { top: sp.y, left: sp.x + sp.w, right: 0, height: sp.h }]} />

                        {/* Corner patches to round the hole */}
                        <View style={{ position: "absolute", top: sp.y, left: sp.x, width: r, height: r, backgroundColor: OVERLAY, borderBottomRightRadius: r }} />
                        <View style={{ position: "absolute", top: sp.y, left: sp.x + sp.w - r, width: r, height: r, backgroundColor: OVERLAY, borderBottomLeftRadius: r }} />
                        <View style={{ position: "absolute", top: sp.y + sp.h - r, left: sp.x, width: r, height: r, backgroundColor: OVERLAY, borderTopRightRadius: r }} />
                        <View style={{ position: "absolute", top: sp.y + sp.h - r, left: sp.x + sp.w - r, width: r, height: r, backgroundColor: OVERLAY, borderTopLeftRadius: r }} />

                        {/* Glow ring */}
                        <View
                            pointerEvents="none"
                            style={{
                                position: "absolute",
                                top: sp.y - 2,
                                left: sp.x - 2,
                                width: sp.w + 4,
                                height: sp.h + 4,
                                borderRadius: r + 2,
                                borderWidth: 2,
                                borderColor: GOLD,
                                shadowColor: GOLD,
                                shadowOpacity: 0.7,
                                shadowRadius: 12,
                                shadowOffset: { width: 0, height: 0 },
                            }}
                        />
                    </>
                ) : (
                    <View style={[s.overlay, StyleSheet.absoluteFill]} />
                )}

                {/* Tooltip card */}
                <Animated.View style={[s.tooltip, { top: tooltipTop, opacity: fadeAnim }]}>
                    <View style={s.iconCircle}>
                        <Icon size={20} color={GOLD} />
                    </View>
                    <Text style={s.stepTitle}>{current.title}</Text>
                    <Text style={s.stepBody}>{current.body}</Text>

                    <View style={s.dotsRow}>
                        {STEPS.map((_, i) => (
                            <View key={i} style={[s.dot, i === step && s.dotActive]} />
                        ))}
                    </View>

                    <View style={s.btnRow}>
                        <TouchableOpacity style={s.skipBtn} onPress={finish}>
                            <Text style={s.skipText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.nextBtn} onPress={() => isLast ? finish() : goTo(step + 1)}>
                            <Text style={s.nextText}>{isLast ? "Done" : "Next →"}</Text>
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
        borderColor: "rgba(201,168,76,0.2)",
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 20,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(201,168,76,0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    stepTitle: { fontSize: 18, fontFamily: "Jost_700Bold", color: "#fff", marginBottom: 8 },
    stepBody: { fontSize: 14, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.55)", lineHeight: 22, marginBottom: 20 },
    dotsRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" },
    dotActive: { backgroundColor: GOLD, width: 18, borderRadius: 3 },
    btnRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    skipBtn: { paddingVertical: 10, paddingHorizontal: 4 },
    skipText: { fontSize: 14, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.3)" },
    nextBtn: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
    nextText: { color: "#0a0a0a", fontSize: 14, fontFamily: "Jost_700Bold" },
});
