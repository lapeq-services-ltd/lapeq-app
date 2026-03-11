import { useState, useRef } from "react";
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    FlatList, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Crown, MapPin, Clock } from "lucide-react-native";

const { width, height } = Dimensions.get("window");
const GOLD = "#C9A84C";
const DARK = "#060606";

const slides = [
    {
        id: "1",
        tag: "Premium Access",
        title: "Concierge\nAt Your\nCommand",
        body: "Request any service — driving, logistics, travel, and more — through one elegant interface. Your team handles everything.",
        Icon: Crown,
        lines: [
            { top: "18%", left: "10%", width: "30%", opacity: 0.25 },
            { top: "32%", left: "10%", width: "55%", opacity: 0.5 },
            { top: "46%", left: "10%", width: "40%", opacity: 0.3 },
        ],
        dotGrid: true,
    },
    {
        id: "2",
        tag: "Project Trust",
        title: "Your Build.\nOur Eyes\nOn It.",
        body: "Independent construction oversight with weekly photo reports, site inspections, and material verification.",
        Icon: MapPin,
        lines: [
            { top: "20%", left: "10%", width: "50%", opacity: 0.3 },
            { top: "38%", left: "10%", width: "70%", opacity: 0.5 },
            { top: "55%", left: "10%", width: "35%", opacity: 0.2 },
        ],
        dotGrid: false,
    },
    {
        id: "3",
        tag: "Always Available",
        title: "Submit.\nTrack.\nRelax.",
        body: "Every request is documented, every update is pushed to you in real time. Your concierge team is always a message away.",
        Icon: Clock,
        lines: [
            { top: "15%", left: "10%", width: "45%", opacity: 0.2 },
            { top: "30%", left: "10%", width: "60%", opacity: 0.45 },
            { top: "50%", left: "10%", width: "30%", opacity: 0.3 },
        ],
        dotGrid: true,
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const goNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            router.replace("/(auth)/login");
        }
    };

    const skip = () => router.replace("/(auth)/login");

    return (
        <SafeAreaView style={s.container}>
            <View style={s.topRow}>
                <View style={s.logoMark}>
                    <Text style={s.logoText}>L</Text>
                </View>
                <TouchableOpacity onPress={skip}>
                    <Text style={s.skip}>Skip</Text>
                </TouchableOpacity>
            </View>

            <Animated.FlatList
                ref={flatListRef}
                data={slides}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                renderItem={({ item }) => {
                    const Icon = item.Icon;
                    return (
                        <View style={s.slide}>
                            {/* Premium Visual Block */}
                            <View style={s.visual}>
                                {/* Background grid dots */}
                                {item.dotGrid && (
                                    <View style={s.dotGrid}>
                                        {Array.from({ length: 80 }).map((_, i) => (
                                            <View key={i} style={s.dotCell} />
                                        ))}
                                    </View>
                                )}

                                {/* Horizontal abstract lines */}
                                {item.lines.map((line, i) => (
                                    <View
                                        key={i}
                                        style={[s.abstractLine, {
                                            top: line.top,
                                            left: line.left,
                                            width: line.width,
                                            opacity: line.opacity,
                                        }]}
                                    />
                                ))}

                                {/* Diagonal gold accent */}
                                <View style={s.diagonalAccent} />

                                {/* Central icon circle */}
                                <View style={s.iconRing}>
                                    <View style={s.iconInner}>
                                        <Icon size={32} color={GOLD} strokeWidth={1.5} />
                                    </View>
                                </View>

                                {/* Tag */}
                                <Text style={s.slideTag}>{item.tag}</Text>

                                {/* Corner bracket decorations */}
                                <View style={[s.corner, s.cornerTL]} />
                                <View style={[s.corner, s.cornerBR]} />
                            </View>

                            {/* Text */}
                            <View style={s.textBlock}>
                                <Text style={s.title}>{item.title}</Text>
                                <Text style={s.body}>{item.body}</Text>
                            </View>
                        </View>
                    );
                }}
            />

            <View style={s.bottom}>
                <View style={s.dots}>
                    {slides.map((_, i) => (
                        <View key={i} style={[s.dot, i === currentIndex && s.dotActive]} />
                    ))}
                </View>

                <TouchableOpacity style={s.btn} onPress={goNext}>
                    <Text style={s.btnText}>
                        {currentIndex < slides.length - 1 ? "Continue" : "Get Started"}
                    </Text>
                </TouchableOpacity>

                {currentIndex === slides.length - 1 && (
                    <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={s.signupRow}>
                        <Text style={s.signupText}>
                            New here? <Text style={s.signupLink}>Create account</Text>
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F4EE" },
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
    logoMark: { width: 32, height: 32, borderRadius: 8, backgroundColor: DARK, alignItems: "center", justifyContent: "center" },
    logoText: { color: GOLD, fontSize: 16, fontWeight: "800" },
    skip: { fontSize: 13, color: "#888", fontWeight: "500" },

    slide: { width, paddingHorizontal: 24 },

    visual: {
        height: height * 0.38,
        backgroundColor: DARK,
        borderRadius: 28,
        marginTop: 8, marginBottom: 36,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },

    // dot grid background
    dotGrid: {
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        flexDirection: "row", flexWrap: "wrap", padding: 24, gap: 18,
    },
    dotCell: { width: 2, height: 2, borderRadius: 1, backgroundColor: "rgba(201,168,76,0.15)" },

    // abstract lines
    abstractLine: { position: "absolute", height: 1, backgroundColor: GOLD },

    // diagonal accent stripe
    diagonalAccent: {
        position: "absolute", bottom: -30, right: -30,
        width: 120, height: 120, borderRadius: 20,
        borderWidth: 1, borderColor: `${GOLD}30`,
        transform: [{ rotate: "45deg" }],
    },

    // central icon
    iconRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: `${GOLD}40`, alignItems: "center", justifyContent: "center" },
    iconInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${GOLD}15`, alignItems: "center", justifyContent: "center" },

    // corner brackets
    corner: { position: "absolute", width: 20, height: 20, borderColor: GOLD },
    cornerTL: { top: 20, left: 20, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
    cornerBR: { bottom: 20, right: 20, borderBottomWidth: 1.5, borderRightWidth: 1.5 },

    slideTag: { position: "absolute", top: 20, right: 20, fontSize: 9, fontWeight: "700", letterSpacing: 2.5, color: GOLD, textTransform: "uppercase" },

    textBlock: { paddingHorizontal: 4 },
    title: { fontSize: 36, fontWeight: "800", color: DARK, lineHeight: 42, marginBottom: 16, letterSpacing: -0.5 },
    body: { fontSize: 14, color: "#888", lineHeight: 22 },

    bottom: { paddingHorizontal: 24, paddingBottom: 24 },
    dots: { flexDirection: "row", gap: 6, marginBottom: 20 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(6,6,6,0.15)" },
    dotActive: { width: 22, backgroundColor: DARK },

    btn: { backgroundColor: DARK, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
    btnText: { color: GOLD, fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },

    signupRow: { marginTop: 16, alignItems: "center" },
    signupText: { fontSize: 13, color: "#888" },
    signupLink: { color: GOLD, fontWeight: "600" },
});
