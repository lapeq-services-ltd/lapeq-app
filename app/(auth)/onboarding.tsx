import { useState, useRef } from "react";
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    FlatList, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";
const MUTED = "rgba(255,255,255,0.4)";

const slides = [
    {
        id: "1",
        tag: "Premium Access",
        title: "Concierge\nAt Your\nCommand",
        body: "Request any service, driving, logistics, travel and more through one elegant interface. Your team handles everything.",
        image: require("@/assets/images/onboarding-driving.png"),
    },
    {
        id: "2",
        tag: "Project Trust",
        title: "Your Build.\nOur Eyes\nOn It.",
        body: "Independent construction oversight with weekly photo reports, site inspections, and material verification.",
        image: require("@/assets/images/onboarding-trust.png"),
    },
    {
        id: "3",
        tag: "Always Available",
        title: "Submit.\nTrack.\nRelax.",
        body: "Every request is documented, every update pushed to you in real time. Your concierge team is always a message away.",
        image: require("@/assets/images/onboarding-lifestyle.png"),
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const goNext = () => {
        if (currentIndex < slides.length - 1) {
            const next = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
            setCurrentIndex(next);
        } else {
            router.replace("/(auth)/login");
        }
    };

    const goBack = () => {
        if (currentIndex > 0) {
            const prev = currentIndex - 1;
            flatListRef.current?.scrollToIndex({ index: prev, animated: true });
            setCurrentIndex(prev);
        }
    };

    const skip = () => router.replace("/(auth)/login");

    return (
        <SafeAreaView style={s.container}>
            <View style={s.topRow}>
                {currentIndex > 0 ? (
                    <TouchableOpacity onPress={goBack} style={s.backBtn}>
                        <ChevronLeft size={22} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <Image
                        source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                        style={s.topLogo}
                        resizeMode="contain"
                    />
                )}
                <TouchableOpacity onPress={skip}>
                    <Text style={s.skip}>Skip</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={slides}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={true}
                onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(idx);
                }}
                renderItem={({ item }) => (
                    <View style={s.slide}>
                        <View style={s.imageWrap}>
                            <Image source={item.image} style={s.image} resizeMode="cover" />
                            <Text style={s.slideTag}>{item.tag}</Text>
                        </View>

                        <View style={s.textBlock}>
                            <Text style={s.title}>{item.title}</Text>
                            <Text style={s.body}>{item.body}</Text>
                        </View>
                    </View>
                )}
            />

            <View style={s.bottom}>
                <View style={s.dots}>
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            style={[s.dot, i === currentIndex && s.dotActive]}
                        />
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
    container: { flex: 1, backgroundColor: DARK },
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
    topLogo: { width: 36, height: 36 },
    skip: { fontSize: 13, fontWeight: "500", color: MUTED },

    slide: { width, paddingHorizontal: 24 },
    imageWrap: {
        height: height * 0.42,
        borderRadius: 28,
        marginTop: 8, marginBottom: 32,
        overflow: "hidden",
    },
    image: { width: "100%", height: "100%" },
    slideTag: {
        position: "absolute", top: 20, left: 20,
        fontSize: 9, fontWeight: "800", letterSpacing: 2.5,
        textTransform: "uppercase",
        color: GOLD,
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
    },

    textBlock: { paddingHorizontal: 4 },
    title: { fontSize: 34, fontWeight: "800", lineHeight: 40, marginBottom: 14, letterSpacing: -0.5, color: "#fff" },
    body: { fontSize: 14, lineHeight: 22, color: MUTED },

    bottom: { paddingHorizontal: 24, paddingBottom: 24 },
    dots: { flexDirection: "row", gap: 6, marginBottom: 20 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)" },
    dotActive: { width: 22, backgroundColor: GOLD },

    btn: { borderRadius: 16, paddingVertical: 16, alignItems: "center", backgroundColor: GOLD },
    btnText: { fontSize: 15, fontWeight: "700", letterSpacing: 0.4, color: DARK },

    signupRow: { marginTop: 16, alignItems: "center" },
    signupText: { fontSize: 13, color: MUTED },
    signupLink: { fontWeight: "600", color: GOLD },
});
