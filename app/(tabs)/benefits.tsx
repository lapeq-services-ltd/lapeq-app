import {
    View, Text, StyleSheet, ScrollView, Platform,
    Image, TouchableOpacity, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";

const GOLD = "#c9a84c";
const { width: W, height: H } = Dimensions.get("window");
const isAndroid = Platform.OS === "android";

const STATS = [
    { value: "9.4", label: "Client Satisfaction" },
    { value: "24/7", label: "Concierge Access" },
    { value: "5", label: "Cities Active" },
    { value: "47+", label: "Projects Verified" },
    { value: "100%", label: "Discretion" },
];

const MOMENTS = [
    {
        type: "image",
        img: require("@/assets/images/lagos-restaurant.jpg"),
        label: "Fine Dining",
        sub: "Private tables. Curated menus.",
    },
    {
        type: "gradient",
        colors: ["#0a0e20", "#1a2040"] as const,
        label: "Exclusive Events",
        sub: "Sold-out shows. Private gatherings.",
    },
    {
        type: "image",
        img: require("@/assets/images/collab-img.png"),
        label: "Elite Venues",
        sub: "Spaces reserved for you.",
    },
    {
        type: "gradient",
        colors: ["#1a0a00", "#2d1500"] as const,
        label: "Private Jet Travel",
        sub: "Fly on your terms.",
    },
    {
        type: "image",
        img: require("@/assets/images/lagos-beach.jpg"),
        label: "Beach Escapes",
        sub: "Cabanas. VIP access.",
    },
];

const WHAT_WE_DO = [
    "Last-minute restaurant reservations",
    "Private jet bookings & airport VIP protocol",
    "Sold-out event tickets & exclusive access",
    "Personal styling & fashion appointments",
    "Medical concierge & specialist access",
    "Diaspora support — your eyes on the ground",
    "Investment advisorship introductions",
    "Private security arrangements",
    "Monthly complimentary experiences",
    "Relationship & proposal packages",
];

export default function BenefitsScreen() {
    const insets = useSafeAreaInsets();
    const { C, theme } = useTheme();
    const router = useRouter();
    const isDark = theme === "dark";

    return (
        <ScrollView
            style={[s.root, { backgroundColor: C.background }]}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
        >
            {/* ── HERO ─────────────────────────────────────────── */}
            <View style={s.hero}>
                <Image
                    source={require("@/assets/images/beautiful-scenery.webp")}
                    style={s.heroImg}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.72)"]}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={[s.heroContent, { paddingTop: insets.top + 20 }]}>
                    <Text style={s.heroEyebrow}>LAPEQ MEMBERSHIP</Text>
                    <Text style={s.heroHeadline}>Amazing{"\n"}Perks</Text>
                    <View style={s.heroDivider} />
                    <Text style={s.heroTagline}>All the benefits Lapeq has to offer!</Text>
                </View>
            </View>

            {/* ── STATS STRIP ──────────────────────────────────── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.statsRow}
            >
                {STATS.map((stat, i) => (
                    <LinearGradient
                        key={i}
                        colors={i % 2 === 0 ? ["#0f0c06", "#1a1508"] : ["#080c14", "#0e1520"]}
                        style={[s.statCard, { borderColor: "rgba(201,168,76,0.18)" }]}
                    >
                        <Text style={s.statValue}>{stat.value}</Text>
                        <Text style={s.statLabel}>{stat.label}</Text>
                    </LinearGradient>
                ))}
            </ScrollView>

            {/* ── THREE SOLID PILLARS ──────────────────────────── */}
            <View style={s.sectionPad}>
                <Text style={[s.sectionEyebrow, { color: C.muted }]}>OUR PILLARS</Text>
                <View style={s.pillarsRow}>
                    <LinearGradient colors={["#12080a", "#200e12"]} style={s.pillarCard}>
                        <Text style={s.pillarTitle}>Lifestyle</Text>
                        <Text style={s.pillarDesc}>Styling, wellness, grooming & personal care</Text>
                    </LinearGradient>
                    <LinearGradient colors={["#080f1a", "#0d1a2e"]} style={s.pillarCard}>
                        <Text style={s.pillarTitle}>Travel</Text>
                        <Text style={s.pillarDesc}>Jets, hotels, airport protocol & coordination</Text>
                    </LinearGradient>
                    <LinearGradient colors={["#0e0c00", "#1c1800"]} style={s.pillarCard}>
                        <Text style={s.pillarTitle}>Access</Text>
                        <Text style={s.pillarDesc}>Events, investments & elite networking</Text>
                    </LinearGradient>
                </View>
            </View>

            {/* ── BENTO GRID ───────────────────────────────────── */}
            <View style={s.sectionPad}>
                <Text style={[s.sectionEyebrow, { color: C.muted }]}>WHAT YOU ACCESS</Text>
                <View style={s.bento}>
                    {/* Tall left — real restaurant */}
                    <View style={s.bentoLeft}>
                        <Image
                            source={require("@/assets/images/lagos-rooftop.jpg")}
                            style={StyleSheet.absoluteFillObject as any}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.72)"]}
                            style={StyleSheet.absoluteFillObject as any}
                        />
                        <View style={s.bentoTextBottom}>
                            <Text style={s.bentoEyebrow}>RESERVATIONS</Text>
                            <Text style={s.bentoTitle}>Dining &{"\n"}Nightlife</Text>
                        </View>
                    </View>

                    {/* Right stacked */}
                    <View style={s.bentoRight}>
                        {/* Solid deep navy — Concierge */}
                        <LinearGradient
                            colors={["#060d1c", "#0d1830"]}
                            style={[s.bentoSmall, { marginBottom: 10, borderWidth: 1, borderColor: "rgba(201,168,76,0.18)", borderRadius: 20 }]}
                        >
                            <View style={s.bentoTextBottom}>
                                <Text style={s.bentoEyebrow}>CONCIERGE</Text>
                                <Text style={s.bentoSmallTitle}>24 / 7{"\n"}Support</Text>
                            </View>
                            <Text style={s.bentoWatermark}>24</Text>
                        </LinearGradient>

                        {/* Car image — Chauffeur */}
                        <View style={[s.bentoSmall, { borderRadius: 20, overflow: "hidden" }]}>
                            <Image
                                source={require("@/assets/images/mercedes-sedan.png")}
                                style={{ width: "100%", height: "100%", position: "absolute" }}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.78)"]}
                                style={StyleSheet.absoluteFillObject as any}
                            />
                            <View style={s.bentoTextBottom}>
                                <Text style={s.bentoEyebrow}>TRANSPORT</Text>
                                <Text style={s.bentoSmallTitle}>Chauffeur{"\n"}Service</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* ── DINING FEATURE ───────────────────────────────── */}
            <View style={s.sectionPad}>
                <Text style={[s.sectionEyebrow, { color: C.muted }]}>FINE DINING & RESERVATIONS</Text>
                <View style={s.diningCard}>
                    <Image
                        source={require("@/assets/images/lagos-restaurant.jpg")}
                        style={StyleSheet.absoluteFillObject as any}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.75)"]}
                        style={StyleSheet.absoluteFillObject as any}
                    />
                    <View style={s.diningContent}>
                        <Text style={s.diningTag}>PRIORITY SEATING</Text>
                        <Text style={s.diningTitle}>The best table,{"\n"}always waiting.</Text>
                        <Text style={s.diningDesc}>
                            Last-minute reservations at Lagos and Abuja's finest restaurants. Private dining rooms, chef's table access, and member-exclusive menus — arranged before you arrive.
                        </Text>
                    </View>
                </View>
            </View>

            {/* ── TRANSPORT STRIP ──────────────────────────────── */}
            <View style={s.sectionPad}>
                <Text style={[s.sectionEyebrow, { color: C.muted }]}>EXECUTIVE TRANSPORT</Text>
                <View style={s.carStrip}>
                    {[
                        require("@/assets/images/mercedes-sedan.png"),
                        require("@/assets/images/range-rover-suv.png"),
                        require("@/assets/images/onboarding-driving.png"),
                    ].map((img, i) => (
                        <View key={i} style={s.carCard}>
                            <Image source={img} style={s.carImg} resizeMode="cover" />
                            <LinearGradient
                                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
                                style={StyleSheet.absoluteFillObject as any}
                            />
                            <Text style={s.carLabel}>
                                {["Sedan", "SUV", "Premium"][i]}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* ── MOMENTS SCROLL ───────────────────────────────── */}
            <View style={{ marginBottom: 28 }}>
                <Text style={[s.sectionEyebrow, { color: C.muted, paddingHorizontal: 20, marginBottom: 14 }]}>
                    MOMENTS WE CREATE
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                >
                    {MOMENTS.map((m, i) => (
                        <View key={i} style={s.momentCard}>
                            {m.type === "image" ? (
                                <>
                                    <Image source={m.img} style={s.momentImg} resizeMode="cover" />
                                    <LinearGradient
                                        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.75)"]}
                                        style={StyleSheet.absoluteFillObject as any}
                                    />
                                </>
                            ) : (
                                <LinearGradient
                                    colors={m.colors as any}
                                    style={StyleSheet.absoluteFillObject as any}
                                />
                            )}
                            <View style={s.momentContent}>
                                <Text style={s.momentLabel}>{m.label}</Text>
                                <Text style={s.momentSub}>{m.sub}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>



            {/* ── DARK NUMBERED LIST ───────────────────────────── */}
            <View style={s.sectionPad}>
                <Text style={[s.sectionEyebrow, { color: C.muted }]}>WHAT WE ARRANGE</Text>
                <View style={s.darkBlock}>
                    <Text style={s.darkBlockHeadline}>Everything.{"\n"}On request.</Text>
                    {WHAT_WE_DO.map((item, i) => (
                        <View key={i} style={[s.darkBlockRow, i < WHAT_WE_DO.length - 1 && s.darkBlockBorder]}>
                            <Text style={s.darkBlockNum}>{String(i + 1).padStart(2, "0")}</Text>
                            <Text style={s.darkBlockItem}>{item}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* ── QUOTE ────────────────────────────────────────── */}
            <View style={[s.sectionPad, { marginBottom: 20 }]}>
                <View style={s.quoteBlock}>
                    <Text style={s.quoteMark}>"</Text>
                    <Text style={[s.quoteText, { color: C.text }]}>
                        Every request handled with discretion, speed, and excellence.
                    </Text>
                    <View style={s.quoteFooter}>
                        <View style={s.quoteLine} />
                        <Text style={s.quoteBy}>The Lapeq Standard</Text>
                    </View>
                </View>
            </View>

            {/* ── CTA ──────────────────────────────────────────── */}
            <View style={s.sectionPad}>
                <TouchableOpacity
                    style={s.cta}
                    onPress={() => router.push("/membership")}
                    activeOpacity={0.86}
                >
                    <View>
                        <Text style={s.ctaLabel}>READY TO JOIN?</Text>
                        <Text style={s.ctaTitle}>Explore Membership Plans</Text>
                    </View>
                    <View style={s.ctaArrow}>
                        <ChevronRight size={20} color="#0a0a0a" strokeWidth={2.5} />
                    </View>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1 },

    // Hero
    hero: { height: H * 0.48, position: "relative", marginBottom: 24 },
    heroImg: { ...StyleSheet.absoluteFillObject as any, width: "100%", height: "100%" },
    heroContent: { position: "absolute", left: 24, right: 24, bottom: 32 },
    heroEyebrow: { fontSize: 9, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 3, marginBottom: 12 },
    heroHeadline: {
        fontSize: isAndroid ? 60 : 72, fontFamily: "PlayfairDisplay_700Bold",
        color: "#fff", letterSpacing: -2, lineHeight: isAndroid ? 64 : 76, marginBottom: 16,
    },
    heroDivider: { width: 36, height: 2, backgroundColor: GOLD, borderRadius: 99, marginBottom: 12 },
    heroTagline: { fontSize: 13, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.65)", letterSpacing: 0.5 },

    // Stats
    statsRow: { paddingHorizontal: 20, gap: 10, marginBottom: 28 },
    statCard: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", minWidth: 90 },
    statValue: { fontSize: 22, fontFamily: "PlayfairDisplay_700Bold", color: GOLD, letterSpacing: -0.5 },
    statLabel: { fontSize: 9, fontFamily: "Jost_500Medium", color: "rgba(201,168,76,0.55)", letterSpacing: 0.5, marginTop: 4, textAlign: "center" },

    // Sections
    sectionPad: { paddingHorizontal: 20, marginBottom: 28 },
    sectionEyebrow: { fontSize: 9, fontFamily: "Jost_700Bold", letterSpacing: 2.5, marginBottom: 14 },

    // Bento
    bento: { flexDirection: "row", gap: 10, height: 320 },
    bentoLeft: { flex: 1.1, borderRadius: 20, overflow: "hidden", position: "relative" },
    bentoRight: { flex: 1 },
    bentoSmall: { flex: 1, overflow: "hidden", position: "relative" },
    bentoTextBottom: { position: "absolute", bottom: 16, left: 16, right: 10 },
    bentoEyebrow: { fontSize: 8, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2, marginBottom: 4 },
    bentoTitle: { fontSize: 17, fontFamily: "PlayfairDisplay_700Bold", color: "#fff", lineHeight: 22 },
    bentoSmallTitle: { fontSize: 13, fontFamily: "PlayfairDisplay_700Bold", color: "#fff", lineHeight: 17 },
    bentoWatermark: {
        position: "absolute", top: 10, right: 14,
        fontSize: 52, fontFamily: "PlayfairDisplay_700Bold",
        color: GOLD, opacity: 0.08, letterSpacing: -2,
    },

    // Dining
    diningCard: { height: 300, borderRadius: 24, overflow: "hidden", position: "relative" },
    diningContent: { position: "absolute", bottom: 28, left: 24, right: 24 },
    diningTag: { fontSize: 9, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2.5, marginBottom: 10 },
    diningTitle: {
        fontSize: isAndroid ? 26 : 32, fontFamily: "PlayfairDisplay_700Bold",
        color: "#fff", lineHeight: isAndroid ? 32 : 38, marginBottom: 10,
    },
    diningDesc: { fontSize: 13, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.65)", lineHeight: 20 },

    // Car strip
    carStrip: { flexDirection: "row", gap: 10, height: 120 },
    carCard: { flex: 1, borderRadius: 16, overflow: "hidden", position: "relative" },
    carImg: { width: "100%", height: "100%", position: "absolute" },
    carLabel: {
        position: "absolute", bottom: 10, left: 10,
        fontSize: 11, fontFamily: "Jost_700Bold", color: "#fff",
    },

    // Moments
    momentCard: { width: W * 0.52, height: 210, borderRadius: 18, overflow: "hidden", position: "relative" },
    momentImg: { ...StyleSheet.absoluteFillObject as any, width: "100%", height: "100%" },
    momentContent: { position: "absolute", bottom: 16, left: 16, right: 12 },
    momentLabel: { fontSize: 15, fontFamily: "Jost_700Bold", color: "#fff", marginBottom: 3 },
    momentSub: { fontSize: 11, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.6)" },

    // Pillars
    pillarsRow: { flexDirection: "row", gap: 10 },
    pillarCard: {
        flex: 1, borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: "rgba(201,168,76,0.12)",
        gap: 8,
    },
    pillarIcon: { fontSize: 18, color: GOLD },
    pillarTitle: { fontSize: 13, fontFamily: "Jost_700Bold", color: "#fff" },
    pillarDesc: { fontSize: 10.5, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.45)", lineHeight: 15 },

    // Dark list
    darkBlock: {
        backgroundColor: "#080808", borderRadius: 22, padding: 24,
        borderWidth: 1, borderColor: "rgba(201,168,76,0.12)",
    },
    darkBlockHeadline: {
        fontSize: 22, fontFamily: "PlayfairDisplay_400Regular_Italic",
        color: GOLD, marginBottom: 20, lineHeight: 30,
    },
    darkBlockRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 13 },
    darkBlockBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
    darkBlockNum: { fontSize: 10, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 1, width: 22, opacity: 0.6 },
    darkBlockItem: { flex: 1, fontSize: 13.5, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.8)", lineHeight: 20 },

    // Quote
    quoteBlock: { paddingHorizontal: 4 },
    quoteMark: { fontSize: 80, fontFamily: "PlayfairDisplay_700Bold", color: GOLD, lineHeight: 70, opacity: 0.55 },
    quoteText: { fontSize: isAndroid ? 17 : 20, fontFamily: "PlayfairDisplay_400Regular_Italic", lineHeight: isAndroid ? 26 : 30, marginBottom: 20 },
    quoteFooter: { flexDirection: "row", alignItems: "center", gap: 12 },
    quoteLine: { width: 32, height: 1.5, backgroundColor: GOLD, borderRadius: 99 },
    quoteBy: { fontSize: 11, fontFamily: "Jost_500Medium", color: GOLD, letterSpacing: 1.5 },

    // CTA
    cta: {
        backgroundColor: GOLD, borderRadius: 18,
        paddingVertical: 20, paddingHorizontal: 24,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    ctaLabel: { fontSize: 9, fontFamily: "Jost_700Bold", color: "rgba(10,10,10,0.5)", letterSpacing: 2, marginBottom: 4 },
    ctaTitle: { fontSize: 17, fontFamily: "Jost_700Bold", color: "#0a0a0a", letterSpacing: -0.2 },
    ctaArrow: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "rgba(10,10,10,0.12)",
        alignItems: "center", justifyContent: "center",
    },
});
