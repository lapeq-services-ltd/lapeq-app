import { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { CheckCircle2, HeartOff } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

type Props = {
    visible: boolean;
    message: string;
    type?: "save" | "unsave";
};

export default function Toast({ visible, message, type = "save" }: Props) {
    const { C } = useTheme();
    const translateY = useRef(new Animated.Value(-80)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
                Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, { toValue: -80, duration: 220, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    return (
        <Animated.View style={[styles.container, { backgroundColor: C.text, opacity, transform: [{ translateY }] }]}>
            {type === "save"
                ? <CheckCircle2 size={16} color={C.background} strokeWidth={2.5} />
                : <HeartOff size={16} color={C.background} strokeWidth={2} />
            }
            <Text style={[styles.text, { color: C.background }]}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 56,
        left: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 14,
        zIndex: 999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
    },
    text: {
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
    },
});
