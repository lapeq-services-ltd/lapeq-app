import { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Image, Dimensions } from "react-native";
import { X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

// NOTE: Convert mod1/mod2/mod3 to .webp or .avif before production to reduce bundle size
const MODALS = [
    { image: require("@/assets/modal/mod1.png"), cta: "Explore Services", route: "/services/lifestyle-travel" },
    { image: require("@/assets/modal/mod2.png"), cta: "View Membership", route: "/(main)/membership" },
    { image: require("@/assets/modal/mod3.png"), cta: "Get Started", route: "/services/lifestyle-travel" },
];

const { width: SW } = Dimensions.get("window");
const CARD_WIDTH = SW - 80;
const IMAGE_HEIGHT = CARD_WIDTH * 1.05;

export default function PromoPopup({ visible: propVisible, onClose }: { visible?: boolean; onClose?: () => void }) {
    const router = useRouter();
    const [visible, setVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0.88)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const modal = useRef(MODALS[Math.floor(Math.random() * MODALS.length)]).current;

    useEffect(() => {
        if (propVisible !== undefined) {
            setVisible(propVisible);
        }
    }, [propVisible]);

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0.88);
            opacityAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            setVisible(false);
            if (onClose) onClose();
        });
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
            <Animated.View style={[s.backdrop, { opacity: opacityAnim }]}>
                <Animated.View style={[s.wrapper, { transform: [{ scale: scaleAnim }] }]}>

                    {/* Image floats directly */}
                    <Image
                        source={modal.image}
                        style={s.image}
                        resizeMode="contain"
                    />

                    {/* CTA */}
                    <TouchableOpacity
                        activeOpacity={0.88}
                        style={{ width: "100%" }}
                        onPress={() => { dismiss(); setTimeout(() => router.push(modal.route as any), 280); }}
                    >
                        <LinearGradient
                            colors={["#bfa15f", "#f3e5ab", "#aa7c11"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={s.ctaBtn}
                        >
                            <Text style={s.ctaText}>{modal.cta}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={dismiss} style={s.dismissBtn} hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}>
                        <Text style={s.dismissText}>Not right now</Text>
                    </TouchableOpacity>

                    {/* Close button outside/below card */}
                    <TouchableOpacity onPress={dismiss} style={s.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <View style={s.closeCircle}>
                            <X size={16} color="#fff" strokeWidth={2.5} />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.82)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    wrapper: {
        width: CARD_WIDTH,
        alignItems: "center",
        gap: 16,
    },
    image: {
        width: "100%",
        height: IMAGE_HEIGHT,
        borderRadius: 20,
    },
    ctaBtn: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    ctaText: {
        fontSize: 13,
        fontFamily: "Jost_700Bold",
        color: "#000",
        letterSpacing: 0.4,
    },
    dismissBtn: {
        alignItems: "center",
        paddingVertical: 2,
    },
    dismissText: {
        fontSize: 11,
        fontFamily: "Jost_400Regular",
        color: "rgba(255,255,255,0.35)",
    },
    closeBtn: {
        alignItems: "center",
    },
    closeCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
});
