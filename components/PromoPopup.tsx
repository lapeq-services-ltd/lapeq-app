import { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Modal } from "react-native";
import { X, Tag } from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";
const MUTED = "rgba(255,255,255,0.38)";
const isAndroid = Platform.OS === "android";
const STORAGE_KEY = "lapeq_promo_week";

const PROMOS = [
    {
        tag: "THIS WEEK",
        title: "Private Dining Upgrade",
        body: "Book a private dining experience through Lapeq this week and receive a complimentary welcome drink for your party.",
        cta: "Book Now",
        route: "/services/lifestyle-travel",
    },
    {
        tag: "MEMBERS ONLY",
        title: "Priority Airport Protocol",
        body: "VIP airport meet-and-greet with dedicated porter and lounge access, exclusively available to Lapeq members.",
        cta: "Request Now",
        route: "/services/lifestyle-travel",
    },
    {
        tag: "LIMITED TIME",
        title: "Complimentary Styling Session",
        body: "Request a Ladies or Gentlemen's Concierge service this week and receive a complimentary personal styling consultation.",
        cta: "Learn More",
        route: "/services/ladies-concierge",
    },
];

export default function PromoPopup() {
    const router = useRouter();
    const [visible, setVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0.92)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const promo = useRef(PROMOS[Math.floor(Math.random() * PROMOS.length)]).current;

    useEffect(() => {
        const thisWeek = getWeekKey();
        AsyncStorage.getItem(STORAGE_KEY).then(stored => {
            if (stored !== thisWeek) {
                const timer = setTimeout(() => {
                    AsyncStorage.setItem(STORAGE_KEY, thisWeek);
                    setVisible(true);
                }, 7000);
                return () => clearTimeout(timer);
            }
        });
    }, []);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.92, duration: 220, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setVisible(false));
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
            <Animated.View style={[s.backdrop, { opacity: opacityAnim }]}>
                <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>

                    <TouchableOpacity onPress={dismiss} style={s.closeBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <X size={16} color={MUTED} />
                    </TouchableOpacity>

                    {/* Gold accent line */}
                    <View style={s.accentLine} />

                    <View style={s.tagRow}>
                        <Tag size={11} color={GOLD} />
                        <Text style={s.tag}>{promo.tag}</Text>
                    </View>

                    <Text style={s.title}>{promo.title}</Text>
                    <Text style={s.body}>{promo.body}</Text>

                    <View style={s.actions}>
                        <TouchableOpacity
                            style={s.primaryBtn}
                            onPress={() => { dismiss(); setTimeout(() => router.push(promo.route as any), 300); }}
                            activeOpacity={0.85}
                        >
                            <Text style={s.primaryBtnText}>{promo.cta}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={dismiss} style={s.skipBtn}>
                            <Text style={s.skipText}>Maybe later</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

function getWeekKey() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week}`;
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 28,
    },
    card: {
        width: "100%",
        backgroundColor: "#111",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.2)",
        padding: isAndroid ? 24 : 28,
        overflow: "hidden",
    },
    closeBtn: {
        position: "absolute",
        top: 16,
        right: 16,
    },
    accentLine: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: GOLD,
        opacity: 0.6,
    },
    tagRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: isAndroid ? 14 : 18,
        marginTop: isAndroid ? 8 : 10,
    },
    tag: {
        fontSize: 10,
        fontFamily: "Jost_700Bold",
        color: GOLD,
        letterSpacing: 2,
    },
    title: {
        fontSize: isAndroid ? 20 : 23,
        fontFamily: "PlayfairDisplay_700Bold",
        color: "#fff",
        marginBottom: isAndroid ? 10 : 12,
        lineHeight: isAndroid ? 27 : 31,
    },
    body: {
        fontSize: isAndroid ? 13 : 14,
        fontFamily: "Jost_400Regular",
        color: MUTED,
        lineHeight: isAndroid ? 21 : 23,
        marginBottom: isAndroid ? 22 : 26,
    },
    actions: {
        gap: isAndroid ? 10 : 12,
    },
    primaryBtn: {
        backgroundColor: GOLD,
        borderRadius: 14,
        paddingVertical: isAndroid ? 13 : 16,
        alignItems: "center",
    },
    primaryBtnText: {
        fontSize: isAndroid ? 14 : 15,
        fontFamily: "Jost_700Bold",
        color: DARK,
        letterSpacing: 0.4,
    },
    skipBtn: {
        alignItems: "center",
        paddingVertical: 6,
    },
    skipText: {
        fontSize: 13,
        fontFamily: "Jost_400Regular",
        color: MUTED,
    },
});
