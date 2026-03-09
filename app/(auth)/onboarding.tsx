import { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

const { width, height } = Dimensions.get("window");

const slides = [
    {
        id: "1",
        tag: "Premium Access",
        title: "Concierge\nAt Your\nCommand",
        body: "Request any service — driving, logistics, travel, and more — through one elegant interface. Your dedicated team handles everything.",
        accent: Colors.gold,
    },
    {
        id: "2",
        tag: "Project Trust",
        title: "Your Build.\nOur Eyes\nOn It.",
        body: "Independent construction oversight with weekly photo reports, site inspections, and material verification — all delivered to your app.",
        accent: Colors.gold,
    },
    {
        id: "3",
        tag: "Always Available",
        title: "Submit.\nTrack.\nRelax.",
        body: "Every request is documented, every update is pushed to you in real time. Your concierge team is always a message away.",
        accent: Colors.gold,
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
        <SafeAreaView style={styles.container}>
            {/* Skip */}
            <View style={styles.topRow}>
                <TouchableOpacity onPress={skip}>
                    <Text style={styles.skip}>Skip</Text>
                </TouchableOpacity>
            </View>

            {/* Slides */}
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
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        {/* Visual block */}
                        <View style={styles.visual}>
                            <View style={styles.visualInner}>
                                <View style={styles.visualAccent} />
                            </View>
                            <Text style={styles.slideTag}>{item.tag}</Text>
                        </View>

                        {/* Text */}
                        <View style={styles.textBlock}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.body}>{item.body}</Text>
                        </View>
                    </View>
                )}
            />

            {/* Bottom: dots + button */}
            <View style={styles.bottom}>
                {/* Dots */}
                <View style={styles.dots}>
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                i === currentIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* CTA */}
                <TouchableOpacity style={styles.btn} onPress={goNext}>
                    <Text style={styles.btnText}>
                        {currentIndex < slides.length - 1 ? "Continue" : "Get Started"}
                    </Text>
                </TouchableOpacity>

                {currentIndex === slides.length - 1 && (
                    <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.signupRow}>
                        <Text style={styles.signupText}>
                            New here? <Text style={styles.signupLink}>Create account</Text>
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream },
    topRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 4,
    },
    skip: { fontSize: 13, color: Colors.muted },
    slide: { width, paddingHorizontal: 24 },
    visual: {
        height: height * 0.38,
        backgroundColor: "#060606",
        borderRadius: 28,
        marginTop: 8,
        marginBottom: 36,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    visualInner: {
        width: 100,
        height: 100,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: Colors.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    visualAccent: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: Colors.gold,
        opacity: 0.85,
    },
    slideTag: {
        position: "absolute",
        top: 20,
        left: 20,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 2.5,
        color: Colors.gold,
        textTransform: "uppercase",
    },
    textBlock: { paddingHorizontal: 4 },
    title: {
        fontSize: 36,
        fontWeight: "800",
        color: Colors.black,
        lineHeight: 42,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    body: {
        fontSize: 14,
        color: Colors.muted,
        lineHeight: 22,
    },
    bottom: { paddingHorizontal: 24, paddingBottom: 24 },
    dots: { flexDirection: "row", gap: 6, marginBottom: 20 },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(6,6,6,0.15)",
    },
    dotActive: {
        width: 22,
        backgroundColor: Colors.black,
    },
    btn: {
        backgroundColor: Colors.black,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
    },
    btnText: {
        color: Colors.cream,
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    signupRow: { marginTop: 16, alignItems: "center" },
    signupText: { fontSize: 13, color: Colors.muted },
    signupLink: { color: Colors.gold, fontWeight: "600" },
});
