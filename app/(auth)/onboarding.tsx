import { useState, useRef, useEffect } from "react";
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    FlatList, Image, ScrollView, Animated, Easing, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";
const MUTED = "rgba(255,255,255,0.4)";
const CARD_ACTIVE = GOLD;
const BORDER = "rgba(255,255,255,0.07)";

type Option = { id: string; label: string };
type Question = { id: string; title: string; multi: boolean; options: Option[] };
type Stage = "slides" | "questions" | "done";

const slides = [
    {
        id: "1",
        tag: "Special Offer",
        title: "Your Event\nRuns On\nLapeq.",
        body: "Planning a wedding or corporate event? On request, we customise the full Lapeq experience for your occasion and also manage your guest list. Your brand on our platform.",
        image: require("@/assets/images/app-collab.png"),
    },
    {
        id: "2",
        tag: "Premium Access",
        title: "Concierge\nAt Your\nCommand",
        body: "Request any service: driving, logistics, travel and more, through one elegant interface. Your team handles everything.",
        image: require("@/assets/images/carsabuja.jpg"),
    },
    {
        id: "3",
        tag: "Always Available",
        title: "Submit.\nTrack.\nRelax.",
        body: "Every request is documented, every update pushed in real time. Your concierge team is always a message away.",
        image: require("@/assets/images/ikoyi-bridge.jpg"),
    },
    {
        id: "4",
        tag: "Membership Benefits",
        title: "Smarter\nLifestyle\nManagement",
        body: "Unlock Silver Tier privileges: virtual concierge support, errand management, flight & airport coordination, priority event access, and partner discounts.",
        image: require("@/assets/images/onboarding-benefits.png"),
    },
    {
        id: "5",
        tag: "Elite Access",
        title: "Unmatched\nGold & Black\nPrivileges",
        body: "Upgrade to Gold or Black for a dedicated concierge manager, private jet & yacht bookings, last-minute VIP reservations, and luxury emergency support.",
        image: require("@/assets/images/onboarding-lifestyle.png"),
    },
];

const QUESTIONS: Question[] = [
    {
        id: "q1",
        title: "What matters\nmost to you?",
        multi: false,
        options: [
            { id: "a", label: "Time saving" },
            { id: "b", label: "Privacy & exclusivity" },
            { id: "c", label: "Premium experiences" },
            { id: "d", label: "Getting things done" },
        ],
    },
    {
        id: "q2",
        title: "Which services\ninterest you?",
        multi: true,
        options: [
            { id: "a", label: "Driving & Transport" },
            { id: "b", label: "Lifestyle & Travel" },
            { id: "c", label: "Event Planning" },
            { id: "d", label: "Logistics" },
            { id: "e", label: "Concierge Services" },
            { id: "f", label: "Diaspora Support" },
            { id: "g", label: "Car Hire" },
        ],
    },
    {
        id: "q3",
        title: "How do you like\nto be served?",
        multi: false,
        options: [
            { id: "a", label: "Fully hands-off, you handle everything" },
            { id: "b", label: "Keep me updated as you go" },
            { id: "c", label: "I like to stay involved" },
            { id: "d", label: "Surprise me" },
        ],
    },
    {
        id: "q4",
        title: "What best\ndescribes you?",
        multi: false,
        options: [
            { id: "a", label: "Professional / Executive" },
            { id: "b", label: "Entrepreneur" },
            { id: "c", label: "In the Diaspora" },
            { id: "d", label: "Lifestyle Seeker" },
        ],
    },
];

const CARD_W = Math.min(width * 0.68, 260);
const CARD_H = Math.round(CARD_W / 1.7);
const CARD_CYCLE = 9000;
const N_CARDS = 3;
const CARD_STAGGER = Math.round(CARD_CYCLE / N_CARDS); // cards spaced exactly CARD_W apart - flush together

const CARD_CONFIGS = [
    { delay: 0 },
    { delay: CARD_STAGGER },
    { delay: CARD_STAGGER * 2 },
];

const CARD_IMAGES = [
    require("@/assets/images/card-1.png"),
    require("@/assets/images/card-2.png"),
    require("@/assets/images/card-3.png"),
];

export default function OnboardingScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);

    const [slideIndex, setSlideIndex] = useState(0);
    const [stage, setStage] = useState<Stage>("slides");
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [typeText, setTypeText] = useState("");

    const swipeHintOpacity = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const t = setTimeout(() => {
            Animated.timing(swipeHintOpacity, { toValue: 0, duration: 700, useNativeDriver: true }).start();
        }, 2000);
        return () => clearTimeout(t);
    }, []);

    // Done screen animation values
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const subtitleOp = useRef(new Animated.Value(0)).current;
    const btnOp = useRef(new Animated.Value(0)).current;
    const cursorOp = useRef(new Animated.Value(1)).current;
    const cardAnims = useRef(CARD_CONFIGS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        if (stage !== "done") return;

        setTypeText("");
        logoScale.setValue(0.8);
        logoOpacity.setValue(0);
        subtitleOp.setValue(0);
        btnOp.setValue(0);
        cursorOp.setValue(1);
        cardAnims.forEach(a => a.setValue(0));

        const loops: Animated.CompositeAnimation[] = [];
        const timers: number[] = [];

        // Cards loop continuously, staggered
        CARD_CONFIGS.forEach((cfg, i) => {
            const t = setTimeout(() => {
                const loop = Animated.loop(
                    Animated.sequence([
                        Animated.timing(cardAnims[i], {
                            toValue: 1,
                            duration: CARD_CYCLE,
                            easing: Easing.linear,
                            useNativeDriver: true,
                        }),
                        Animated.timing(cardAnims[i], { toValue: 0, duration: 0, useNativeDriver: true }),
                    ])
                );
                loops.push(loop);
                loop.start();
            }, cfg.delay) as unknown as number;
            timers.push(t);
        });

        // Logo fades and scales in
        Animated.parallel([
            Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        ]).start();

        // Blinking cursor
        const cursorLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(cursorOp, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.timing(cursorOp, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        );
        cursorLoop.start();
        loops.push(cursorLoop);

        // Typewriter
        const FULL = "Lapeq got you covered.";
        let charIdx = 0;
        const typeStart = setTimeout(() => {
            const iv = setInterval(() => {
                charIdx++;
                setTypeText(FULL.slice(0, charIdx));
                if (charIdx >= FULL.length) {
                    clearInterval(iv);
                    cursorLoop.stop();
                    Animated.timing(cursorOp, { toValue: 0, duration: 200, useNativeDriver: true }).start();
                    const t1 = setTimeout(() =>
                        Animated.timing(subtitleOp, { toValue: 1, duration: 600, useNativeDriver: true }).start()
                        , 300) as unknown as number;
                    const t2 = setTimeout(() =>
                        Animated.timing(btnOp, { toValue: 1, duration: 500, useNativeDriver: true }).start()
                        , 900) as unknown as number;
                    timers.push(t1, t2);
                }
            }, 80);
            timers.push(iv as any);
        }, 900) as unknown as number;
        timers.push(typeStart);

        return () => {
            timers.forEach(id => { clearTimeout(id); clearInterval(id); });
            loops.forEach(l => l.stop());
        };
    }, [stage]);

    // ─── Slide navigation ───────────────────────────────────────────────────
    const goNextSlide = () => {
        if (slideIndex < slides.length - 1) {
            const next = slideIndex + 1;
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
            setSlideIndex(next);
        } else {
            setStage("questions");
            setQIndex(0);
        }
    };

    const goBackSlide = () => {
        if (slideIndex > 0) {
            const prev = slideIndex - 1;
            flatListRef.current?.scrollToIndex({ index: prev, animated: true });
            setSlideIndex(prev);
        }
    };

    const skip = () => { setStage("questions"); setQIndex(0); };

    const skipQuestions = async () => {
        await AsyncStorage.setItem("onboarding_done", "1");
        await AsyncStorage.setItem("onboarding_answers", JSON.stringify(answers));
        setStage("done");
    };

    // ─── Question navigation ─────────────────────────────────────────────────
    const currentQ = QUESTIONS[qIndex];
    const selected = answers[currentQ?.id] ?? [];

    const toggle = (optId: string) => {
        const q = QUESTIONS[qIndex];
        setAnswers(prev => {
            const cur = prev[q.id] ?? [];
            if (q.multi) {
                return { ...prev, [q.id]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] };
            } else {
                return { ...prev, [q.id]: [optId] };
            }
        });
    };

    const goNextQ = async () => {
        if (qIndex < QUESTIONS.length - 1) {
            setQIndex(q => q + 1);
        } else {
            await AsyncStorage.setItem("onboarding_done", "1");
            await AsyncStorage.setItem("onboarding_answers", JSON.stringify(answers));
            setStage("done");
        }
    };

    const goBackQ = () => {
        if (qIndex === 0) {
            setStage("slides");
            setSlideIndex(slides.length - 1);
        } else {
            setQIndex(q => q - 1);
        }
    };

    const canContinueQ = selected.length > 0;

    // ─── Done screen ─────────────────────────────────────────────────────────
    if (stage === "done") {
        const TOP_H = height * 0.50;
        return (
            <View style={s.doneContainer}>
                {/* Top half - single row of cards gliding left to right */}
                <View style={{ height: TOP_H, overflow: "hidden", backgroundColor: "#0D0D0D" }}>
                    {CARD_CONFIGS.map((cfg, i) => {
                        const tx = cardAnims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [-(CARD_W + 20), -(CARD_W + 20) + N_CARDS * CARD_W],
                        });
                        return (
                            <Animated.Image
                                key={i}
                                source={CARD_IMAGES[i % CARD_IMAGES.length]}
                                style={{
                                    position: "absolute",
                                    top: (TOP_H - CARD_H) / 2,
                                    left: 0,
                                    width: CARD_W,
                                    height: CARD_H,
                                    transform: [{ translateX: tx }],
                                }}
                                resizeMode="contain"
                            />
                        );
                    })}
                </View>

                {/* Bottom panel - curved top edge, solid fill */}
                <View style={s.doneBottomPanel}>
                    <Animated.Image
                        source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                        style={[s.doneLogoImg, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
                        resizeMode="contain"
                    />

                    <View style={{ flex: 1 }} />

                    <View style={s.doneTextBlock}>
                        <View style={s.doneTypeRow}>
                            <Text style={s.doneTypeGold}>
                                {typeText.slice(0, Math.min(typeText.length, 5))}
                            </Text>
                            {typeText.length > 5 && (
                                <Text style={s.doneTypeWhite}>{typeText.slice(5)}</Text>
                            )}
                            <Animated.Text style={[s.doneCursor, { opacity: cursorOp }]}>|</Animated.Text>
                        </View>
                        <Animated.Text style={[s.doneSubtitle, { opacity: subtitleOp }]}>
                            Everything you need, curated and{"\n"}handled exactly how you like it.
                        </Animated.Text>
                    </View>

                    <Animated.View style={[s.doneActions, { opacity: btnOp }]}>
                        <TouchableOpacity style={s.btn} onPress={() => router.replace("/(auth)/register")}>
                            <Text style={s.btnText}>Create Your Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={s.loginRow}>
                            <Text style={s.loginText}>Already a member? <Text style={s.loginLink}>Sign in</Text></Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        );
    }

    // ─── Questions ───────────────────────────────────────────────────────────
    if (stage === "questions") {
        const q = QUESTIONS[qIndex];
        const sel = answers[q.id] ?? [];
        const progress = (qIndex + 1) / QUESTIONS.length;

        return (
            <SafeAreaView style={s.container}>
                <View style={s.topRow}>
                    <TouchableOpacity onPress={goBackQ} style={s.backBtn}>
                        <ChevronLeft size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={skipQuestions}>
                        <Text style={s.skip}>Skip</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
                </View>

                <ScrollView contentContainerStyle={s.qScroll} showsVerticalScrollIndicator={false}>
                    <Text style={s.qStep}>{qIndex + 1} of {QUESTIONS.length}</Text>
                    <Text style={s.qTitle}>{q.title}</Text>
                    {q.multi && <Text style={s.qHint}>Select all that apply</Text>}

                    <View style={s.optionsWrap}>
                        {q.options.map(opt => {
                            const active = sel.includes(opt.id);
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[s.option, active && s.optionActive]}
                                    onPress={() => toggle(opt.id)}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[s.optionText, active && s.optionTextActive]}>
                                        {opt.label}
                                    </Text>
                                    {active && (
                                        <View style={s.checkCircle}>
                                            <Text style={s.checkMark}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                <View style={s.bottom}>
                    <TouchableOpacity
                        style={[s.btn, !canContinueQ && s.btnDisabled]}
                        onPress={canContinueQ ? goNextQ : undefined}
                        activeOpacity={canContinueQ ? 0.85 : 1}
                    >
                        <Text style={s.btnText}>
                            {qIndex < QUESTIONS.length - 1 ? "Continue" : "Finish"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Slides ──────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={s.container}>
            <View style={s.topRow}>
                {slideIndex > 0 ? (
                    <TouchableOpacity onPress={goBackSlide} style={s.backBtn}>
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
                initialScrollIndex={slideIndex}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                onScroll={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                    if (idx !== slideIndex) {
                        setSlideIndex(idx);
                    }
                }}
                scrollEventThrottle={16}
                renderItem={({ item }) => {
                    const isIllustration = item.id === "5";
                    return (
                        <View style={s.slide}>
                            <View style={[
                                s.imageWrap,
                                isIllustration && { backgroundColor: "#000000", justifyContent: "center", alignItems: "center" }
                            ]}>
                                <Image
                                    source={item.image}
                                    style={[
                                        s.image,
                                        isIllustration && { width: "75%", height: "75%" }
                                    ]}
                                    resizeMode={isIllustration ? "contain" : "cover"}
                                />
                                <Text style={s.slideTag}>{item.tag}</Text>
                            </View>
                            <View style={s.textBlock}>
                                <Text style={s.title}>{item.title}</Text>
                                <Text style={s.body}>{item.body}</Text>
                            </View>
                        </View>
                    );
                }}
            />

            {slideIndex === 0 && (
                <Animated.View style={[s.swipeHint, { opacity: swipeHintOpacity }]}>
                    <ChevronRight size={13} color={GOLD} strokeWidth={2.5} />
                    <Text style={s.swipeHintText}>swipe to explore</Text>
                    <ChevronRight size={13} color={GOLD} strokeWidth={2.5} />
                </Animated.View>
            )}

            <View style={s.bottom}>
                <View style={s.dots}>
                    {slides.map((_, i) => (
                        <View key={i} style={[s.dot, i === slideIndex && s.dotActive]} />
                    ))}
                </View>

                <TouchableOpacity style={s.btn} onPress={goNextSlide}>
                    <Text style={s.btnText}>
                        {slideIndex < slides.length - 1 ? "Continue" : "Get Started"}
                    </Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK },

    topRow: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center", justifyContent: "center",
    },
    topLogo: { width: 36, height: 36 },
    skip: { fontSize: 13, fontWeight: "500", color: MUTED },

    swipeHint: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 6, paddingVertical: 6,
    },
    swipeHintText: { fontSize: 11, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: GOLD },

    slide: { width, paddingHorizontal: 24 },
    imageWrap: {
        height: height * 0.42, borderRadius: 28,
        marginTop: 8, marginBottom: 32, overflow: "hidden",
    },
    image: { width: "100%", height: "100%" },
    slideTag: {
        position: "absolute", top: 20, left: 20,
        fontSize: 9, fontWeight: "800", letterSpacing: 2.5,
        textTransform: "uppercase", color: GOLD,
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
    btnDisabled: { opacity: 0.35 },
    btnText: { fontSize: 15, fontWeight: "700", letterSpacing: 0.4, color: DARK },
    loginRow: { marginTop: 16, alignItems: "center" },
    loginText: { fontSize: 13, color: MUTED },
    loginLink: { fontWeight: "600", color: GOLD },

    progressTrack: {
        height: 2, backgroundColor: "rgba(255,255,255,0.07)",
        marginHorizontal: 24, marginBottom: 4, borderRadius: 1,
    },
    progressFill: { height: 2, backgroundColor: GOLD, borderRadius: 1 },

    qScroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    qStep: { fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 12 },
    qTitle: { fontSize: 32, fontWeight: "800", lineHeight: 38, letterSpacing: -0.5, color: "#fff", marginBottom: 8 },
    qHint: { fontSize: 12, color: MUTED, marginBottom: 24 },
    optionsWrap: { gap: 10, marginTop: 8 },
    option: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16,
        borderWidth: 1, borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.03)",
    },
    optionActive: { borderColor: GOLD, backgroundColor: CARD_ACTIVE },
    optionText: { fontSize: 14, fontWeight: "500", color: MUTED, flex: 1 },
    optionTextActive: { color: DARK, fontWeight: "700" },
    checkCircle: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: DARK, alignItems: "center", justifyContent: "center",
        marginLeft: 8,
    },
    checkMark: { color: GOLD, fontSize: 13, fontWeight: "900", lineHeight: 15 },

    // Done screen
    doneContainer: { flex: 1, backgroundColor: "#0D0D0D" },
    doneBottomPanel: {
        flex: 1,
        backgroundColor: "#111111",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        marginTop: -40,
        paddingHorizontal: 28,
        paddingBottom: 36,
    },
    doneLogoImg: {
        width: 56,
        height: 56,
        alignSelf: "center",
        marginTop: -28,
        marginBottom: 4,
    },
    doneTextBlock: {
        marginBottom: 28,
    },
    doneTypeRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        flexWrap: "wrap",
        marginBottom: 14,
    },
    doneTypeGold: {
        fontSize: Platform.OS === "android" ? 36 : 46,
        fontWeight: "800",
        color: GOLD,
        letterSpacing: -1.5,
        lineHeight: Platform.OS === "android" ? 42 : 52,
    },
    doneTypeWhite: {
        fontSize: Platform.OS === "android" ? 36 : 46,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: -1.5,
        lineHeight: Platform.OS === "android" ? 42 : 52,
    },
    doneCursor: {
        fontSize: Platform.OS === "android" ? 32 : 42,
        fontWeight: "300",
        color: GOLD,
        lineHeight: Platform.OS === "android" ? 42 : 52,
        marginLeft: 2,
    },
    doneSubtitle: {
        fontSize: 15,
        lineHeight: 24,
        color: MUTED,
    },
    doneActions: {
        gap: 16,
    },
});
