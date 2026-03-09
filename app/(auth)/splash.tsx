import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

export default function SplashScreen() {
    const router = useRouter();
    const opacity = useRef(new Animated.Value(0)).current;
    const barProgress = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]).start();

        Animated.timing(barProgress, { toValue: 0.67, duration: 1800, delay: 300, useNativeDriver: false }).start();

        const t = setTimeout(() => router.replace("/(auth)/onboarding"), 2400);
        return () => clearTimeout(t);
    }, []);

    return (
        <View style={s.container}>
            {/* Radial glow */}
            <Animated.View style={[s.glow, { opacity: glowOpacity }]} />

            {/* Logo + wordmark */}
            <Animated.View style={[s.logoWrap, { opacity }]}>
                <View style={s.imgWrap}>
                    <Image
                        source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                        style={s.logoImg}
                        resizeMode="contain"
                    />
                </View>
                <Text style={s.wordmark}>LAPEQ</Text>
            </Animated.View>

            {/* Loading bar — same as preview: track + fill at 2/3 */}
            <View style={s.barTrack}>
                <Animated.View
                    style={[
                        s.barFill,
                        {
                            width: barProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0%", "100%"],
                            }),
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#060606", alignItems: "center", justifyContent: "center" },
    glow: {
        position: "absolute",
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: "rgba(201,168,76,0.22)",
        shadowColor: "#c9a84c", shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, shadowRadius: 60,
    },
    logoWrap: { alignItems: "center", zIndex: 10 },
    imgWrap: { width: 128, height: 128, alignItems: "center", justifyContent: "center" },
    logoImg: { width: 128, height: 128 },
    wordmark: { fontSize: 20, fontWeight: "800", color: "#c9a84c", letterSpacing: 8, marginTop: 12, textTransform: "uppercase" },
    barTrack: { position: "absolute", bottom: 48, width: 64, height: 1.5, borderRadius: 99, backgroundColor: "rgba(201,168,76,0.15)", overflow: "hidden" },
    barFill: { height: "100%", backgroundColor: "#c9a84c", borderRadius: 99 },
});
