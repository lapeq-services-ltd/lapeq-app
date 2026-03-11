import { useState, useRef } from "react";
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    FlatList, Animated, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

const { width, height } = Dimensions.get("window");
const GOLD = "#C9A84C";
const DARK = "#060606";

const slides = [
    {
        id: "1",
        tag: "Premium Access",
        title: "Concierge\nAt Your\nCommand",
        body: "Request any service — driving, logistics, travel and more — through one elegant interface. Your team handles everything.",
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
            {/* Top bar */}
            <View style={s.topRow}>
                {currentIndex > 0 ? (
                    <TouchableOpacity onPress={goBack} style={s.backBtn}>
                        <ChevronLeft size={22} color={DARK} />
                    </TouchableOpacity>
                ) : (
                    <View style={s.logoMark}>
                        <Text style={s.logoText}>L</Text>
                    </View>
                )}
                <TouchableOpacity onPress={skip}>
                    <Text style={s.skip}>Skip</Text>
                </TouchableOpacity>
            </View>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                renderItem={({ item }) => (
                    <View style={s.slide}>
                        {/* Photo */}
                        <View style={s.imageWrap}>
                            <Image source={item.image} style={s.image} resizeMode="cover" />
                            {/* Overlay gradient effect with views */}
                            <View style={s.imageOverlay} />
                            <Text style={s.slideTag}>{item.tag}</Text>
                        </View>

                        {/* Text */}
                        <View style={s.textBlock}>
                            <Text style={s.title}>{item.title}</Text>
                            <Text style={s.body}>{item.body}</Text>
                        </View>
                    </View>
                )}
            />

            {/* Bottom */}
            <View style={s.bottom}>
                <View style={s.dots}>
                    {slides.map((_, i) => (
                        <View key={i} style={[s.dot, i === currentIndex && s.dotActive]} />
                    ))}
                </View>

                <TouchableOpacity style={s.btn} onPress={goNext}>
                    <Text style={s.btnText}>
                        {currentIndex < slides.length - 1 ? "Continue" : "Get Started →"}
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
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.07)", alignItems: "center", justifyContent: "center" },
    logoMark: { width: 32, height: 32, borderRadius: 8, backgroundColor: DARK, alignItems: "center", justifyContent: "center" },
    logoText: { color: GOLD, fontSize: 16, fontWeight: "800" },
    skip: { fontSize: 13, color: "#888", fontWeight: "500" },

    slide: { width, paddingHorizontal: 24 },

    imageWrap: {
        height: height * 0.4,
        borderRadius: 28,
        marginTop: 8, marginBottom: 32,
        overflow: "hidden",
        position: "relative",
    },
    image: { width: "100%", height: "100%", position: "absolute" },
    imageOverlay: {
        position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
        backgroundColor: "rgba(6,6,6,0.45)",
    },
    slideTag: {
        position: "absolute", top: 20, left: 20,
        fontSize: 9, fontWeight: "800", letterSpacing: 2.5, color: GOLD,
        textTransform: "uppercase",
        backgroundColor: "rgba(6,6,6,0.5)",
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
    },

    textBlock: { paddingHorizontal: 4 },
    title: { fontSize: 34, fontWeight: "800", color: DARK, lineHeight: 40, marginBottom: 14, letterSpacing: -0.5 },
    body: { fontSize: 14, color: "#888", lineHeight: 22 },

    bottom: { paddingHorizontal: 24, paddingBottom: 24 },
    dots: { flexDirection: "row", gap: 6, marginBottom: 20 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(6,6,6,0.15)" },
    dotActive: { width: 22, backgroundColor: DARK },

    btn: { backgroundColor: DARK, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
    btnText: { color: GOLD, fontSize: 15, fontWeight: "700", letterSpacing: 0.4 },

    signupRow: { marginTop: 16, alignItems: "center" },
    signupText: { fontSize: 13, color: "#888" },
    signupLink: { color: GOLD, fontWeight: "600" },
});
