import { useEffect, useRef, useState } from "react";
import { View, Text, Modal, TouchableOpacity, Animated, Image, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Crown, Car, Compass, MessageCircle } from "lucide-react-native";

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";

const FEATURES = [
    { icon: Car, label: "Book premium services - chauffeur, events, travel & more" },
    { icon: Compass, label: "Discover curated venues and experiences in your city" },
    { icon: MessageCircle, label: "Your personal concierge is available 24/7 via chat" },
];

interface Props {
    name: string;
    visible: boolean;
    onClose: () => void;
    onStartTour: () => void;
}

export default function WelcomeModal({ name, visible, onClose, onStartTour }: Props) {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const dismiss = async (startTour = false) => {
        await AsyncStorage.setItem("lapeq_welcome_seen", "1");
        Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 0.92, duration: 220, useNativeDriver: true }),
        ]).start(() => {
            if (startTour) onStartTour();
            else onClose();
        });
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none">
            <View style={s.overlay}>
                <Animated.View style={[s.card, { opacity, transform: [{ scale }] }]}>
                    <View style={s.logoRow}>
                        <Image
                            source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={s.logo}
                            resizeMode="contain"
                        />
                        <View style={s.crownWrap}>
                            <Crown size={14} color={GOLD} />
                        </View>
                    </View>

                    <Text style={s.title}>Welcome{name ? `, ${name}` : ""}.</Text>
                    <Text style={s.subtitle}>
                        You now have access to Lapeq - your private concierge for premium living in Nigeria.
                    </Text>

                    <View style={s.divider} />

                    {FEATURES.map(({ icon: Icon, label }, i) => (
                        <View key={i} style={s.featureRow}>
                            <View style={s.iconBox}>
                                <Icon size={16} color={GOLD} />
                            </View>
                            <Text style={s.featureText}>{label}</Text>
                        </View>
                    ))}

                    <TouchableOpacity style={s.primaryBtn} onPress={() => dismiss(true)} activeOpacity={0.85}>
                        <Text style={s.primaryBtnText}>Take a Quick Tour</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.skipBtn} onPress={() => dismiss(false)} activeOpacity={0.7}>
                        <Text style={s.skipText}>Explore on my own</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.75)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    card: {
        width: "100%",
        backgroundColor: "#111",
        borderRadius: 28,
        padding: 32,
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.25)",
        alignItems: "center",
    },
    logoRow: { position: "relative", marginBottom: 20 },
    logo: { width: 64, height: 64 },
    crownWrap: {
        position: "absolute",
        top: -6,
        right: -10,
        backgroundColor: "#1a1a1a",
        borderRadius: 10,
        padding: 4,
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.3)",
    },
    title: {
        fontSize: 26,
        fontFamily: "PlayfairDisplay_700Bold",
        color: "#fff",
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        fontFamily: "Jost_400Regular",
        color: "rgba(255,255,255,0.5)",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 24,
    },
    divider: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginBottom: 20 },
    featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 14, width: "100%" },
    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(201,168,76,0.1)",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    featureText: {
        flex: 1,
        fontSize: 13,
        fontFamily: "Jost_400Regular",
        color: "rgba(255,255,255,0.65)",
        lineHeight: 20,
        paddingTop: 7,
    },
    primaryBtn: {
        width: "100%",
        backgroundColor: GOLD,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 24,
        marginBottom: 12,
    },
    primaryBtnText: { color: DARK, fontSize: 15, fontFamily: "Jost_700Bold" },
    skipBtn: { paddingVertical: 8 },
    skipText: { color: "rgba(255,255,255,0.35)", fontSize: 13, fontFamily: "Jost_400Regular" },
});
