import { useEffect, useRef, useState } from "react";
import { Animated, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { _registerToastHandler } from "@/lib/toast";
import { CheckCircle2, XCircle, Info, X } from "lucide-react-native";

type ToastType = "error" | "success" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

const ACCENT: Record<ToastType, string> = {
    error: "#ef4444",
    success: "#10b981",
    info: "#c9a84c",
};

export default function LapeqToast() {
    const [toast, setToast] = useState<Toast | null>(null);
    const slideY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        _registerToastHandler((message, type) => {
            if (timer.current) clearTimeout(timer.current);

            setToast({ id: Date.now(), message, type });
            slideY.setValue(80);
            opacity.setValue(0);

            Animated.parallel([
                Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 260, friction: 22 }),
                Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
            ]).start();

            timer.current = setTimeout(dismiss, 4000);
        });
    }, []);

    const dismiss = () => {
        if (timer.current) clearTimeout(timer.current);
        Animated.parallel([
            Animated.timing(slideY, { toValue: 80, duration: 220, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => setToast(null));
    };

    if (!toast) return null;

    const accent = ACCENT[toast.type];
    const Icon = toast.type === "error" ? XCircle : toast.type === "success" ? CheckCircle2 : Info;

    return (
        <Animated.View style={[s.wrap, { transform: [{ translateY: slideY }], opacity }]}>
            <View style={[s.card, { borderLeftColor: accent }]}>
                <Icon size={20} color={accent} style={{ flexShrink: 0 }} />
                <Text style={s.msg} numberOfLines={4}>{toast.message}</Text>
                <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    wrap: {
        position: "absolute",
        bottom: 108,
        left: 16,
        right: 16,
        zIndex: 9999,
    },
    card: {
        backgroundColor: "#181818",
        borderRadius: 16,
        borderLeftWidth: 3,
        paddingVertical: 14,
        paddingRight: 14,
        paddingLeft: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 14,
    },
    msg: {
        flex: 1,
        fontSize: 14,
        color: "#fff",
        fontFamily: "Jost_400Regular",
        lineHeight: 21,
    },
});
