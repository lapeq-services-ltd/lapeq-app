import { useEffect, useRef } from "react";
import { View, Text, Modal, Animated, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOLD = "#c9a84c";

interface Props {
    name: string;
    visible: boolean;
    onClose: () => void;
    onStartTour: () => void;
}

export default function WelcomeModal({ name, visible, onClose, onStartTour }: Props) {
    const bg = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.94)).current;

    useEffect(() => {
        if (!visible) return;
        // Reset
        bg.setValue(0);
        textOpacity.setValue(0);
        scale.setValue(0.94);

        // 1. Fade in background
        Animated.timing(bg, { toValue: 1, duration: 500, useNativeDriver: true }).start();

        // 2. Fade + scale in text after a beat
        Animated.sequence([
            Animated.delay(350),
            Animated.parallel([
                Animated.timing(textOpacity, { toValue: 1, duration: 850, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, friction: 10, tension: 40, useNativeDriver: true }),
            ]),
        ]).start(() => {
            // 3. Hold 1.7s then fade everything out
            setTimeout(() => {
                Animated.timing(bg, { toValue: 0, duration: 750, useNativeDriver: true }).start(async () => {
                    await AsyncStorage.setItem("lapeq_welcome_seen", "1");
                    onClose();
                });
            }, 1700);
        });
    }, [visible]);

    if (!visible) return null;

    const displayName = name.split(" ")[0] || name;

    return (
        <Modal visible transparent animationType="none" statusBarTranslucent>
            <Animated.View style={[s.root, { opacity: bg }]}>
                <Animated.View style={[s.content, { opacity: textOpacity, transform: [{ scale }] }]}>
                    <Text style={s.hello}>Hello,</Text>
                    <Text style={s.name}>{displayName}.</Text>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#080808",
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        alignItems: "center",
    },
    hello: {
        fontSize: 54,
        fontFamily: "PlayfairDisplay_400Regular_Italic",
        color: "rgba(255,255,255,0.9)",
        letterSpacing: -0.5,
        lineHeight: 62,
    },
    name: {
        fontSize: 54,
        fontFamily: "PlayfairDisplay_400Regular_Italic",
        color: GOLD,
        letterSpacing: -0.5,
        lineHeight: 62,
        marginTop: -4,
    },
});
