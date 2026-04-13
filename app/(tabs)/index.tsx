import { useEffect, useState, useMemo, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, Crown, ChevronRight, Calendar, Plane, Car, Headphones, ClipboardList } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_GAP = 12;

const ADS = [
    {
        img: require("@/assets/images/lagos-rooftop.jpg"),
        tag: "Rooftop Dining",
        title: "Zuma Restaurant",
        sub: "Abuja & Lagos",
        desc: "Japanese robata grill and sushi. Exclusive member reservations available.",
    },
    {
        img: require("@/assets/images/lagos-hotel.jpg"),
        tag: "Fine Dining",
        title: "Cilantro Restaurant",
        sub: "Abuja",
        desc: "Award-winning Mediterranean cuisine in the heart of Abuja. Members get priority seating.",
    },
    {
        img: require("@/assets/images/lagos-beach.jpg"),
        tag: "Trending Now",
        title: "Breeze Restaurant",
        sub: "Wuse 2, Abuja",
        desc: "Waterfront dining experience. Reserve your private cabana through Lapeq.",
    },
    {
        img: require("@/assets/images/lagos-restaurant.jpg"),
        tag: "Members Only",
        title: "Nola Restaurant",
        sub: "Wuse 2, Abuja",
        desc: "Upscale dining with an intimate atmosphere. Priority seating for Lapeq members.",
    },
];

// Duplicate for seamless loop
const LOOPED = [...ADS, ...ADS, ...ADS];

export default function HomeScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const [userName, setUserName] = useState("");
    const [hasUnread, setHasUnread] = useState(false);
    const translateX = useRef(new Animated.Value(0)).current;
    const offsetRef = useRef(0);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            // Always pull from the profiles table so preferred_name is respected
            const { data: profile } = await supabase
                .from("profiles")
                .select("preferred_name, full_name")
                .eq("id", user.id)
                .single();
            const name =
                profile?.preferred_name ||
                profile?.full_name?.split(" ")[0] ||
                user.email?.split("@")[0] ||
                "there";
            setUserName(name);

            const { count } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("read", false);
            setHasUnread((count ?? 0) > 0);
        });
    }, []);

    useEffect(() => {
        const TOTAL = ADS.length * (CARD_WIDTH + CARD_GAP);
        const loop = () => {
            Animated.timing(translateX, {
                toValue: -(offsetRef.current + TOTAL),
                duration: TOTAL * 18,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    offsetRef.current = 0;
                    translateX.setValue(0);
                    loop();
                }
            });
        };
        loop();
        return () => translateX.stopAnimation();
    }, []);

    const darkBadgeColor = theme === "dark" ? C.background : C.primary;

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Image
                        source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                        style={s.logoImg}
                        resizeMode="contain"
                    />
                    <Text style={s.headerTitle}>Lapeq</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notifications")}>
                        <Bell size={24} color={C.text} />
                        {hasUnread && <View style={s.notifDot} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={s.crownBtn} onPress={() => router.push("/membership")}>
                        <Crown size={24} color={C.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
                <View style={{ marginBottom: 20 }}>
                    <Text style={s.greetSub}>{(() => { const h = new Date().getHours(); return h < 12 ? "Good morning," : h < 17 ? "Good afternoon," : "Good evening,"; })()}</Text>
                    <Text style={s.greetName}>{userName || " "}</Text>
                </View>

                <View style={s.quickGrid}>
                    {[
                        { label: "Experiences", sub: "Curated itineraries", Icon: Calendar, route: "/experiences" as const },
                        { label: "Travel", sub: "Flights & stays", Icon: Plane, route: "/services/lifestyle-travel" as const },
                        { label: "Chauffeur", sub: "Private driving", Icon: Car, route: "/services/driving" as const },
                        { label: "My Requests", sub: "Track & manage", Icon: ClipboardList, route: "/requests" as const },
                    ].map(({ label, sub, Icon, route }) => (
                        <TouchableOpacity key={label} style={s.quickCard} onPress={() => router.push(route)} activeOpacity={0.8}>
                            <View style={s.quickCardIcon}>
                                <Icon size={22} color={C.primary} />
                            </View>
                            <Text style={s.quickCardLabel}>{label}</Text>
                            <Text style={s.quickCardSub}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={[s.banner, theme === "dark" && { backgroundColor: C.primary }]} onPress={() => router.push("/chat")}>
                    <View style={s.bannerIcon}>
                        <Headphones size={28} color={theme === "dark" ? C.background : C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.bannerTitle, theme === "dark" && { color: C.background }]}>24/7 Concierge Available</Text>
                        <Text style={[s.bannerSub, theme === "dark" && { color: `${C.background}99` }]}>Your dedicated concierge is a message away</Text>
                    </View>
                    <ChevronRight size={24} color={theme === "dark" ? `${C.background}66` : C.muted} />
                </TouchableOpacity>

                {/* Featured swipe row */}
                <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>Featured</Text>
                </View>
                <View style={{ marginHorizontal: -20, marginBottom: 28 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                        {[
                            { label: "FOR HER", title: "Ladies\nConcierge", img: require("@/assets/images/onboarding-lifestyle.png"), route: "/services/ladies-concierge" },
                            { label: "FOR HIM", title: "Gentlemen's\nConcierge", img: require("@/assets/images/onboarding-driving.png"), route: "/services/gentlemens-concierge" },
                            { label: "EDITORIAL", title: "The LAPEQ\nJournal", img: require("@/assets/images/lagos-rooftop.jpg"), route: "/journal" },
                        ].map((item) => (
                            <TouchableOpacity key={item.label} style={s.featCard} onPress={() => router.push(item.route as any)} activeOpacity={0.88}>
                                <Image source={item.img} style={s.featImg} resizeMode="cover" />
                                <View style={s.featOverlay} />
                                <View style={s.featContent}>
                                    <Text style={s.featLabel}>{item.label}</Text>
                                    <Text style={s.featTitle}>{item.title}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>Monthly Picks</Text>
                    <TouchableOpacity onPress={() => router.push("/monthly-picks")}>
                        <Text style={s.viewAll}>View All →</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ height: 220, overflow: "hidden", marginBottom: 24, marginHorizontal: -20 }}>
                    <Animated.View style={{ flexDirection: "row", transform: [{ translateX }], paddingLeft: 20 }}>
                        {LOOPED.map((card, i) => (
                            <TouchableOpacity key={i} style={[s.expCard, { width: CARD_WIDTH, marginRight: CARD_GAP }]} activeOpacity={0.9}>
                                <View style={s.expImgWrap}>
                                    <Image source={card.img} style={s.expImg} resizeMode="cover" />
                                    <View style={s.expBadge}>
                                        <Text style={[s.expBadgeText, { color: darkBadgeColor }]}>{card.tag}</Text>
                                    </View>
                                </View>
                                <View style={{ padding: 10 }}>
                                    <Text style={s.expTitle}>{card.title}</Text>
                                    <Text style={s.expLoc}>{card.sub}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </View>

                <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>Upcoming Events</Text>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/events")}>
                        <Text style={s.viewAll}>View all</Text>
                    </TouchableOpacity>
                </View>
                <View style={s.emptyEvents}>
                    <Text style={s.emptyEventsText}>Events will appear here when announced. Check back soon.</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    logoImg: { width: 36, height: 36 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text, letterSpacing: -0.3 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    notifDot: { position: "absolute", top: 4, right: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary, borderWidth: 2, borderColor: C.background },
    crownBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${C.primary}18`, borderWidth: 1, borderColor: C.primary, alignItems: "center", justifyContent: "center" },
    greetSub: { fontSize: 18, color: C.muted },
    greetName: { fontSize: 28, fontWeight: "700", color: C.text },
    quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
    quickCard: {
        width: (SCREEN_WIDTH - 40 - 12) / 2,
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 14,
        gap: 8,
    },
    quickCardIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: `${C.primary}15`,
        alignItems: "center",
        justifyContent: "center",
    },
    quickCardLabel: { fontSize: 15, fontWeight: "700", color: C.text, letterSpacing: -0.2 },
    quickCardSub: { fontSize: 12, color: C.muted },
    banner: { borderRadius: 16, backgroundColor: C.surface, padding: 20, marginBottom: 28, flexDirection: "row", alignItems: "center", gap: 16 },
    bannerIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: `${C.primary}33`, alignItems: "center", justifyContent: "center" },
    bannerTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    bannerSub: { fontSize: 13, color: `${C.text}99` },
    sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: C.text },
    viewAll: { fontSize: 14, color: C.primary, fontWeight: "500" },
    expCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", backgroundColor: C.surface },
    expImgWrap: { height: 140, position: "relative" },
    expImg: { width: "100%", height: "100%" },
    expBadge: { position: "absolute", top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: C.text },
    expBadgeText: { fontSize: 12, fontWeight: "600" },
    expTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    expLoc: { fontSize: 13, color: C.muted, marginTop: 4 },
    expDesc: { fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 18 },
    emptyEvents: { padding: 24, borderRadius: 16, backgroundColor: C.surface, alignItems: "center" },
    emptyEventsText: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22 },
    featCard: { width: 160, height: 130, borderRadius: 16, overflow: "hidden", position: "relative" },
    featImg: { width: "100%", height: "100%", position: "absolute" },
    featOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.48)" },
    featContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 },
    featLabel: { fontSize: 9, fontWeight: "800", color: C.primary, letterSpacing: 2, marginBottom: 4 },
    featTitle: { fontSize: 15, fontWeight: "700", color: "#fff", lineHeight: 20 },
});
