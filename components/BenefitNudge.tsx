import { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { Crown, Zap, Clock, Shield, Star, Users, Gift, CheckCircle, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MUTED = "rgba(10,10,10,0.55)";
const isAndroid = Platform.OS === "android";
const STORAGE_KEY = "lapeq_nudge_v2";
const AUTO_DISMISS_MS = 5500;
const MAX_PER_DAY = 5;
const MIN_GAP_MS = 30 * 60 * 1000; // 30 min between nudges

const BENEFITS = [
    { icon: Crown,       title: "Exclusive Access",  body: "Venues and experiences not open to the public." },
    { icon: Zap,         title: "Priority Always",   body: "Your requests jump the queue, every time."      },
    { icon: Clock,       title: "24/7 Concierge",    body: "A real person available any hour, any day."     },
    { icon: Shield,      title: "Fully Vetted",       body: "Every partner personally assessed by Lapeq."   },
    { icon: Star,        title: "Curated For You",   body: "Built around your taste, not an algorithm."     },
    { icon: Users,       title: "Private Bookings",  body: "Entire venues reserved just for you."           },
    { icon: Gift,        title: "Member Perks",      body: "Surprise upgrades and exclusive member deals."  },
    { icon: CheckCircle, title: "End-to-End",        body: "From idea to execution, Lapeq handles it all."  },
];

export default function BenefitNudge() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const slideY = useRef(new Animated.Value(-140)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const benefit = useRef(BENEFITS[Math.floor(Math.random() * BENEFITS.length)]).current;
    const Icon = benefit.icon;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const today = new Date().toDateString();
        const now = Date.now();

        // compute current week key (matches PromoPopup logic)
        const d = new Date();
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        const thisWeek = `${d.getFullYear()}-W${week}`;

        Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem("lapeq_promo_week"),
        ]).then(([nudgeRaw, promoWeek]) => {
            let stored: any = null;
            try { stored = nudgeRaw ? JSON.parse(nudgeRaw) : null; } catch { stored = null; }
            const count = stored?.date === today ? (stored.count ?? 0) : 0;
            const lastShown = stored?.lastShown ?? 0;

            if (count >= MAX_PER_DAY) return;
            if (now - lastShown < MIN_GAP_MS) return;

            // If promo popup hasn't shown this week yet, wait until after it clears (7s trigger + buffer)
            const promoPending = promoWeek !== thisWeek;
            const baseDelay = promoPending ? 18000 : 3000;
            const delay = baseDelay + Math.random() * 7000;

            const t = setTimeout(() => {
                AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                    date: today,
                    count: count + 1,
                    lastShown: Date.now(),
                }));
                setVisible(true);
            }, delay);
            return () => clearTimeout(t);
        });
    }, []);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideY, { toValue: 0, friction: 10, tension: 60, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();
            timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [visible]);

    const dismiss = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        Animated.parallel([
            Animated.timing(slideY, { toValue: -140, duration: 300, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(() => setVisible(false));
    };

    if (!visible) return null;

    return (
        <Animated.View style={[
            s.wrap,
            { top: insets.top + (isAndroid ? 10 : 12), opacity, transform: [{ translateY: slideY }] },
        ]}>
            <View style={s.card}>
                <View style={s.left}>
                    <View style={s.iconWrap}>
                        <Icon size={16} color="#0a0a0a" strokeWidth={2} />
                    </View>
                    <View style={s.textBlock}>
                        <Text style={s.title}>{benefit.title}</Text>
                        <Text style={s.body}>{benefit.body}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={dismiss}
                    style={s.closeBtn}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                    <X size={14} color={MUTED} />
                </TouchableOpacity>
            </View>
            <View style={s.timerBar}>
                <Animated.View style={s.timerFill} />
            </View>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    wrap: {
        position: "absolute",
        left: 16,
        right: 16,
        zIndex: 9000,
    },
    card: {
        backgroundColor: "#c9a84c",
        borderRadius: 16,
        paddingHorizontal: isAndroid ? 14 : 16,
        paddingVertical: isAndroid ? 12 : 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#c9a84c",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        gap: isAndroid ? 10 : 12,
        flex: 1,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.12)",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    textBlock: { flex: 1, gap: 2 },
    title: {
        fontSize: isAndroid ? 13 : 14,
        fontFamily: "Jost_700Bold",
        color: "#0a0a0a",
    },
    body: {
        fontSize: isAndroid ? 11 : 12,
        fontFamily: "Jost_400Regular",
        color: "rgba(10,10,10,0.65)",
        lineHeight: isAndroid ? 16 : 17,
    },
    closeBtn: { paddingLeft: 10, flexShrink: 0 },
    timerBar: {
        height: 2,
        backgroundColor: "rgba(0,0,0,0.12)",
        borderRadius: 99,
        marginTop: 4,
        overflow: "hidden",
    },
    timerFill: {
        height: "100%",
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.25)",
        borderRadius: 99,
    },
});
