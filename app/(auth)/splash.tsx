import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

export default function SplashScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const opacity = useRef(new Animated.Value(0)).current;
    const barProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();

        Animated.timing(barProgress, { toValue: 0.67, duration: 1800, delay: 300, useNativeDriver: false }).start();

        const t = setTimeout(() => router.replace("/(auth)/onboarding"), 2400);
        return () => clearTimeout(t);
    }, []);

    return (
        <View style={[s.container, { backgroundColor: C.background }]}>
            <Animated.View style={[s.logoWrap, { opacity }]}>
                <View style={s.imgWrap}>
                    <Image
                        source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                        style={s.logoImg}
                        resizeMode="contain"
                    />
                </View>
            </Animated.View>

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
    container: { flex: 1, alignItems: "center", justifyContent: "center" },
    logoWrap: { alignItems: "center", zIndex: 10 },
    imgWrap: { width: 128, height: 128, alignItems: "center", justifyContent: "center" },
    logoImg: { width: 128, height: 128 },
    barTrack: { position: "absolute", bottom: 48, width: 64, height: 1.5, borderRadius: 99, backgroundColor: "rgba(201,168,76,0.15)", overflow: "hidden" },
    barFill: { height: "100%", backgroundColor: "#c9a84c", borderRadius: 99 },
});
