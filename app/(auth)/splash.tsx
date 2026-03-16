import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";

export default function SplashScreen() {
    const router = useRouter();
    const opacity = useRef(new Animated.Value(0)).current;
    const barProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
        Animated.timing(barProgress, { toValue: 0.67, duration: 1800, delay: 300, useNativeDriver: false }).start();

        const t = setTimeout(() => router.replace("/(auth)/onboarding"), 2400);
        return () => clearTimeout(t);
    }, []);

    return (
        <View style={s.container}>
            <Animated.View style={[s.logoWrap, { opacity }]}>
                <Image
                    source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                    style={s.logoImg}
                    resizeMode="contain"
                />
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
            </Animated.View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK, alignItems: "center", justifyContent: "center" },
    logoWrap: { alignItems: "center" },
    logoImg: { width: 128, height: 128, marginBottom: 28 },
    barTrack: { width: 80, height: 2, borderRadius: 99, backgroundColor: "rgba(201,168,76,0.15)", overflow: "hidden" },
    barFill: { height: "100%", backgroundColor: GOLD, borderRadius: 99 },
});
