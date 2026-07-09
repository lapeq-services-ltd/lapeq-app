import { useEffect, useRef, useState } from "react";
import { Text, Animated, StyleSheet, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOLD = "#c9a84c";

export default function WelcomeScreen() {
    const router = useRouter();
    const [name, setName] = useState("");
    const bg = useRef(new Animated.Value(1)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.93)).current;

    useEffect(() => {
        const run = async () => {
            // Grab first name from session metadata
            const { data: { session } } = await supabase.auth.getSession();
            const firstName =
                session?.user?.user_metadata?.first_name ||
                session?.user?.user_metadata?.preferred_name ||
                "";
            setName(firstName);

            // Fade + scale in text
            Animated.sequence([
                Animated.delay(200),
                Animated.parallel([
                    Animated.timing(textOpacity, { toValue: 1, duration: 850, useNativeDriver: true }),
                    Animated.spring(scale, { toValue: 1, friction: 10, tension: 38, useNativeDriver: true }),
                ]),
            ]).start(() => {
                // Hold 1.7s then fade entire screen out
                setTimeout(() => {
                    Animated.timing(bg, { toValue: 0, duration: 650, useNativeDriver: true }).start(async () => {
                        await AsyncStorage.setItem("lapeq_welcome_seen", "1");
                        router.replace("/(tabs)");
                    });
                }, 1700);
            });
        };

        run();
    }, []);

    return (
        <>
            <StatusBar hidden />
            <Animated.View style={[s.root, { opacity: bg }]}>
                <Animated.View style={{ alignItems: "center", opacity: textOpacity, transform: [{ scale }] }}>
                    <Text style={s.hello}>Hello,</Text>
                    <Text style={s.name}>{name || "there"}.</Text>
                </Animated.View>
            </Animated.View>
        </>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#080808",
        alignItems: "center",
        justifyContent: "center",
    },
    hello: {
        fontSize: 54,
        fontFamily: "PlayfairDisplay_400Regular_Italic",
        color: "rgba(255,255,255,0.9)",
        letterSpacing: -0.5,
        lineHeight: 64,
    },
    name: {
        fontSize: 54,
        fontFamily: "PlayfairDisplay_400Regular_Italic",
        color: GOLD,
        letterSpacing: -0.5,
        lineHeight: 64,
        marginTop: -6,
    },
});
