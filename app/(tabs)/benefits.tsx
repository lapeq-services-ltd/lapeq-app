import {
    View, Text, StyleSheet, ScrollView, Platform,
    Image, TouchableOpacity, Dimensions, Animated,
} from "react-native";
import { useEffect, useRef, useState, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, Crown, Gift, Plane, Utensils, Hotel, Shield, ArrowRight } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";

const GOLD = "#c9a84c";
const { width: W, height: H } = Dimensions.get("window");
const isAndroid = Platform.OS === "android";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ANALYTICS = [
    { label: "Privilege index", val: 98, color: GOLD },
    { label: "Access rate", val: 100, color: GOLD },
    { label: "Priority score", val: 95, color: GOLD },
];

const STATS = [
    { value: "9.4", label: "Client Satisfaction" },
    { value: "24/7", label: "Concierge Access" },
    { value: "5", label: "Cities Active" },
    { value: "47+", label: "Projects Verified" },
    { value: "100%", label: "Discretion" },
];

const REDESIGNED_PERKS = [
    {
        title: "Elite Transit",
        desc: "Private aviation, chauffeur rides & fast-track airport customs.",
        icon: Plane,
        badge: "Premium Travel",
        img: require("@/assets/images/mercedes-sedan.png"),
        route: "/services/driving" as const,
    },
    {
        title: "VIP Dining",
        desc: "Last-minute tables, private lounges & exclusive member menus.",
        icon: Utensils,
        badge: "Fine Gastronomy",
        img: require("@/assets/images/lagos-restaurant.jpg"),
        route: "/explore" as const,
    },
    {
        title: "Curated Hotels",
        desc: "Early check-ins, room upgrades & exclusive hotel benefits worldwide.",
        icon: Hotel,
        badge: "Luxury Stays",
        img: require("@/assets/images/lagos-hotel.jpg"),
        route: "/services/lifestyle-travel" as const,
    },
    {
        title: "Bespoke Care",
        desc: "24/7 butler service, private security escorts & medical concierge.",
        icon: Shield,
        badge: "Elite Protection",
        img: require("@/assets/images/exterior-luxury.jpg"),
        route: "/services/lifestyle-security" as const,
    },
];

const PARTNER_BANNERS = [
    { title: "VistaJet Partnership", sub: "Save 15% on empty leg flight bookings worldwide.", btn: "View flights", route: "/services/lifestyle-travel" as const },
    { title: "Waldorf Astoria Upgrades", sub: "Complimentary breakfast & double-tier room upgrades.", btn: "Explore hotels", route: "/services/lifestyle-travel" as const },
    { title: "Lagos VIP Beach Club", sub: "Priority cabanas, champagne welcome & zero entrance fees.", btn: "Claim entry", route: "/explore" as const },
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

const ProgressRing = ({ percentage, size = 64, strokeWidth = 5, color = GOLD }: { percentage: number; size?: number; strokeWidth?: number; color?: string }) => {
    const { C } = useTheme();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const animVal = useRef(new Animated.Value(0)).current;
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        // Reset values
        animVal.setValue(0);
        setDisplayVal(0);

        // Animate stroke dashoffset
        Animated.timing(animVal, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: false,
        }).start();

        // Animate counter text
        let start = 0;
        const end = percentage;
        const duration = 1800;
        const stepTime = Math.max(Math.floor(duration / end), 12);
        
        let timer = setInterval(() => {
            start += 1;
            if (start > end) {
                clearInterval(timer);
            } else {
                setDisplayVal(start);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [percentage]);

    const strokeDashoffset = animVal.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, circumference - (percentage / 100) * circumference],
    });

    return (
        <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
            <Svg width={size} height={size}>
                <Circle
                    stroke={C.border}
                    fill="transparent"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <AnimatedCircle
                    stroke={color}
                    fill="transparent"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={{ position: "absolute" }}>
                <Text style={{ color: C.text, fontSize: 11, fontFamily: "Jost_700Bold" }}>{displayVal}%</Text>
            </View>
        </View>
    );
};

export default function BenefitsScreen() {
    const insets = useSafeAreaInsets();
    const { C, theme } = useTheme();
    const router = useRouter();

    // Auto-playing partner banners state
    const [partnerIndex, setPartnerIndex] = useState(0);
    const bannerFadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const interval = setInterval(() => {
            Animated.timing(bannerFadeAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }).start(() => {
                setPartnerIndex((prev) => (prev + 1) % PARTNER_BANNERS.length);
                Animated.timing(bannerFadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    return (
        <ScrollView
            style={[s.root, { backgroundColor: C.background }]}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
        >
            {/* ── STATIC HERO BANNER (As requested: "former banner") ─────────────────────── */}
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

            {/* Wavy Scalloped Separator (Mockup 3 Style) */}
            <View style={s.wavyContainer}>
                <Svg width="100%" height="20" viewBox="0 0 1440 100" preserveAspectRatio="none" style={s.wavySvg}>
                    <Path
                        d="M0,50 C120,80 240,80 360,50 C480,20 600,20 720,50 C840,80 960,80 1080,50 C1200,20 1320,20 1440,50 L1440,100 L0,100 Z"
                        fill={C.background}
                    />
                </Svg>
            </View>

            {/* ── MEMBERSHIP METRICS & ANALYTICS (Mockup 4 Style) ────────────────────── */}
            <View style={s.sectionPad}>
                <View style={s.metricsCard}>
                    <View style={{ marginBottom: 16 }}>
                        <Text style={s.metricsHeader}>Lapeq Privileges</Text>
                        <Text style={s.metricsSub}>Live telemetry of your membership coverage</Text>
                    </View>
                    <View style={s.metricsRow}>
                        {ANALYTICS.map((metric, i) => (
                            <View key={i} style={s.metricItem}>
                                <ProgressRing percentage={metric.val} color={metric.color} size={56} strokeWidth={4.5} />
                                <Text style={s.metricLabel}>{metric.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* ── STATS STRIP (Moved under Privileges as requested) ──────────────────────────────────── */}
            <View style={{ marginBottom: 28 }}>
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
            </View>

            {/* ── REDESIGNED PERKS GRID (Interspersed layout as requested) ────────── */}
            <View style={s.sectionPad}>
                <View style={s.gridHeader}>
                    <Text style={s.sectionEyebrow}>BEST-IN-CLASS PERKS</Text>
                    <Text style={s.sectionTitle}>Amazing Perks</Text>
                </View>
                
                {/* Row 1: Elite Transit & VIP Dining */}
                <View style={[s.perksGrid, { marginBottom: 16 }]}>
                    {[REDESIGNED_PERKS[0], REDESIGNED_PERKS[1]].map((perk, i) => {
                        const Icon = perk.icon;
                        return (
                            <TouchableOpacity 
                                key={i} 
                                style={s.perkCard} 
                                activeOpacity={0.88}
                                onPress={() => router.push(perk.route)}
                            >
                                <Image source={perk.img} style={s.perkCardBg} resizeMode="cover" />
                                <LinearGradient
                                    colors={["rgba(10,10,10,0.4)", "rgba(6,6,6,0.92)"]}
                                    style={StyleSheet.absoluteFillObject}
                                />
                                <View style={s.perkCardContent}>
                                    <View style={s.perkHeaderRow}>
                                        <View style={s.perkIconCircle}>
                                            <Icon size={18} color={GOLD} />
                                        </View>
                                        <View style={s.arrowPill}>
                                            <ArrowRight size={12} color="#000" strokeWidth={2.5} />
                                        </View>
                                    </View>
                                    
                                    <View>
                                        <Text style={s.perkCardTag}>{perk.badge}</Text>
                                        <Text style={s.perkCardTitle}>{perk.title}</Text>
                                        <Text style={s.perkCardDesc} numberOfLines={2}>{perk.desc}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── PARTNERSHIP BANNER (Placed in the middle as requested) ─────────── */}
                <View style={{ marginBottom: 16 }}>
                    <Animated.View style={[s.partnerBanner, { opacity: bannerFadeAnim }]}>
                        <Image
                            source={require("@/assets/images/banner_megaphone.png")}
                            style={StyleSheet.absoluteFillObject as any}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={["rgba(10,10,10,0.3)", "rgba(6,6,6,0.92)"]}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={s.bannerContent}>
                            <View style={s.limitedTag}>
                                <Text style={s.limitedText}>PARTNERSHIP OFFER</Text>
                            </View>
                            <Text style={s.bannerTitle}>{PARTNER_BANNERS[partnerIndex].title}</Text>
                            <Text style={s.bannerSub}>{PARTNER_BANNERS[partnerIndex].sub}</Text>
                            <TouchableOpacity 
                                style={s.bannerBtn} 
                                activeOpacity={0.8}
                                onPress={() => router.push(PARTNER_BANNERS[partnerIndex].route)}
                            >
                                <Text style={s.bannerBtnText}>{PARTNER_BANNERS[partnerIndex].btn}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>

                {/* Row 2: Curated Hotels & Bespoke Care */}
                <View style={s.perksGrid}>
                    {[REDESIGNED_PERKS[2], REDESIGNED_PERKS[3]].map((perk, i) => {
                        const Icon = perk.icon;
                        return (
                            <TouchableOpacity 
                                key={i} 
                                style={s.perkCard} 
                                activeOpacity={0.88}
                                onPress={() => router.push(perk.route)}
                            >
                                <Image source={perk.img} style={s.perkCardBg} resizeMode="cover" />
                                <LinearGradient
                                    colors={["rgba(10,10,10,0.4)", "rgba(6,6,6,0.92)"]}
                                    style={StyleSheet.absoluteFillObject}
                                />
                                <View style={s.perkCardContent}>
                                    <View style={s.perkHeaderRow}>
                                        <View style={s.perkIconCircle}>
                                            <Icon size={18} color={GOLD} />
                                        </View>
                                        <View style={s.arrowPill}>
                                            <ArrowRight size={12} color="#000" strokeWidth={2.5} />
                                        </View>
                                    </View>
                                    
                                    <View>
                                        <Text style={s.perkCardTag}>{perk.badge}</Text>
                                        <Text style={s.perkCardTitle}>{perk.title}</Text>
                                        <Text style={s.perkCardDesc} numberOfLines={2}>{perk.desc}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* ── DARK NUMBERED LIST ───────────────────────────────────────────── */}
            <View style={s.sectionPad}>
                <Text style={s.sectionEyebrow}>WHAT WE ARRANGE</Text>
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

            {/* ── CTA Redesign ─────────────────────────────────────────────────── */}
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

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1 },

    // Static Hero (Restored)
    hero: { height: H * 0.44, position: "relative", marginBottom: 24 },
    heroImg: { ...StyleSheet.absoluteFillObject as any, width: "100%", height: "100%" },
    heroContent: { position: "absolute", left: 24, right: 24, bottom: 32 },
    heroEyebrow: { fontSize: 9, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 3, marginBottom: 12 },
    heroHeadline: {
        fontSize: isAndroid ? 52 : 64, fontFamily: "PlayfairDisplay_700Bold",
        color: "#fff", letterSpacing: -2, lineHeight: isAndroid ? 56 : 68, marginBottom: 16,
    },
    heroDivider: { width: 36, height: 2, backgroundColor: GOLD, borderRadius: 99, marginBottom: 12 },
    heroTagline: { fontSize: 13, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.65)", letterSpacing: 0.5 },

    // Wave separator
    wavyContainer: { width: W, height: 20, marginTop: -20, zIndex: 10, overflow: "hidden" },
    wavySvg: { width: "100%", height: 20 },

    // Metrics panel (Mockup 4 style)
    metricsCard: {
        backgroundColor: theme === "dark" ? "rgba(201,168,76,0.03)" : C.surface,
        borderRadius: 24, padding: 20,
        borderWidth: 1.2,
        borderColor: theme === "dark" ? "rgba(201,168,76,0.12)" : C.border,
    },
    metricsHeader: { fontSize: 18, fontFamily: "PlayfairDisplay_700Bold", color: GOLD },
    metricsSub: { fontSize: 12, fontFamily: "Jost_400Regular", color: C.muted, marginTop: 2 },
    metricsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginTop: 8 },
    metricItem: { alignItems: "center", gap: 10 },
    metricLabel: { fontSize: 10, fontFamily: "Jost_700Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 1 },

    // Section standards
    sectionPad: { paddingHorizontal: 20, marginBottom: 28 },
    gridHeader: { marginBottom: 16 },
    sectionEyebrow: { fontSize: 9, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2.5, marginBottom: 6 },
    sectionTitle: { fontSize: 26, fontFamily: "PlayfairDisplay_700Bold", color: C.text, letterSpacing: -0.5 },

    // 2x2 perks grid (Mockup 1 style)
    perksGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    perkCard: {
        width: (W - 40 - 12) / 2, height: 190, borderRadius: 24,
        overflow: "hidden", position: "relative", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    },
    perkCardBg: { width: "100%", height: "100%", position: "absolute" },
    perkCardContent: { flex: 1, padding: 14, justifyContent: "space-between" },
    perkHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    perkIconCircle: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: "rgba(201,168,76,0.12)",
        alignItems: "center", justifyContent: "center",
        borderWidth: 1, borderColor: "rgba(201,168,76,0.25)"
    },
    arrowPill: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center",
    },
    perkCardTag: { fontSize: 8, fontFamily: "Jost_700Bold", color: GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
    perkCardTitle: { fontSize: 15, fontFamily: "Jost_700Bold", color: "#fff", marginBottom: 4 },
    perkCardDesc: { fontSize: 11, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.5)", lineHeight: 15 },

    // Partner banners (Mockup 2 style)
    partnerBanner: {
        borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(201,168,76,0.15)",
        shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
    },
    bannerContent: { padding: 24 },
    limitedTag: {
        alignSelf: "flex-start", backgroundColor: "rgba(201,168,76,0.12)",
        paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginBottom: 12,
    },
    limitedText: { fontSize: 8, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 1.5 },
    bannerTitle: { fontSize: 20, fontFamily: "PlayfairDisplay_700Bold", color: "#fff", marginBottom: 6 },
    bannerSub: { fontSize: 12, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.6)", lineHeight: 18, marginBottom: 16 },
    bannerBtn: {
        alignSelf: "flex-start", backgroundColor: "#fff",
        paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12,
    },
    bannerBtnText: { color: "#000", fontSize: 11, fontFamily: "Jost_700Bold" },

    // Stats
    statsRow: { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
    statCard: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", minWidth: 90 },
    statValue: { fontSize: 22, fontFamily: "PlayfairDisplay_700Bold", color: GOLD, letterSpacing: -0.5 },
    statLabel: { fontSize: 9, fontFamily: "Jost_500Medium", color: "rgba(201,168,76,0.55)", letterSpacing: 0.5, marginTop: 4, textAlign: "center" },

    // Dark block (What we arrange)
    darkBlock: {
        backgroundColor: "#080808", borderRadius: 24, padding: 24,
        borderWidth: 1.2, borderColor: "rgba(201,168,76,0.12)",
    },
    darkBlockHeadline: { fontSize: 22, fontFamily: "PlayfairDisplay_400Regular_Italic", color: GOLD, marginBottom: 20, lineHeight: 30 },
    darkBlockRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 13 },
    darkBlockBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
    darkBlockNum: { fontSize: 10, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 1, width: 22, opacity: 0.6 },
    darkBlockItem: { flex: 1, fontSize: 13.5, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.8)", lineHeight: 20 },

    // CTA
    cta: {
        backgroundColor: GOLD, borderRadius: 20,
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
