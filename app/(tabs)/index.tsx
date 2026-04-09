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
import { Bell, Crown, ChevronRight, Bookmark, Calendar, Plane, Car, Headphones } from "lucide-react-native";
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
    const s = useMemo(() => getStyles(C), [C]);
    const [userName, setUserName] = useState("");
    const [hasUnread, setHasUnread] = useState(false);
    const translateX = useRef(new Animated.Value(0)).current;
    const offsetRef = useRef(0);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            // Try metadata first, then profiles table, then email prefix
            const metaName = user?.user_metadata?.full_name?.split(" ")[0];
            if (metaName) {
                setUserName(metaName);
            } else {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", user.id)
                    .single();
                const name = profile?.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "there";
                setUserName(name);
            }
            if (user) {
                const { count } = await supabase
                    .from("notifications")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", user.id)
                    .eq("read", false);
                setHasUnread((count ?? 0) > 0);
            }
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
                    <Text style={s.greetSub}>Good evening,</Text>
                    <Text style={s.greetName}>{userName || " "}</Text>
                </View>

                <View style={s.quickActions}>
                    {[
                        { label: "Experiences", Icon: Calendar, route: "/trip-planner" as const },
                        { label: "Travel", Icon: Plane, route: "/services/lifestyle-travel" as const },
                        { label: "Chauffeur", Icon: Car, route: "/services/driving" as const },
                        { label: "Concierge", Icon: Headphones, route: "/services/concierge-request" as const },
                    ].map(({ label, Icon, route }) => (
                        <TouchableOpacity key={label} style={s.quickBtn} onPress={() => router.push(route)}>
                            <View style={s.quickIcon}>
                                <Icon size={24} color={C.primary} />
                            </View>
                            <Text style={s.quickLabel}>{label}</Text>
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

                <Text style={[s.sectionTitle, { marginBottom: 16 }]}>Curated For You</Text>
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
                    <Text style={s.viewAll}>View all</Text>
                </View>
                <View style={{ gap: 10 }}>
                    {[
                        { img: require("@/assets/images/lagos-rooftop.jpg"), title: "An Elevated Evening", sub: "Mar 15 – Victoria Island", badge: "Members Only", count: "42 confirmed" },
                        { img: require("@/assets/images/lagos-beach.jpg"), title: "Curated Beach Gathering", sub: "Mar 22 – Elegushi, Lekki", badge: "Gold & Black", count: "28 confirmed" },
                    ].map((ev) => (
                        <TouchableOpacity key={ev.title} style={s.eventRow} onPress={() => router.push("/event-details")}>
                            <Image source={ev.img} style={s.eventThumb} resizeMode="cover" />
                            <View style={{ flex: 1 }}>
                                <Text style={s.eventTitle}>{ev.title}</Text>
                                <Text style={s.eventSub}>{ev.sub}</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                                    <View style={s.eventBadge}>
                                        <Text style={s.eventBadgeText}>{ev.badge}</Text>
                                    </View>
                                    <Text style={s.eventCount}>{ev.count}</Text>
                                </View>
                            </View>
                            <Bookmark size={24} color={C.muted} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    logoImg: { width: 36, height: 36 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text, letterSpacing: -0.3 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    notifDot: { position: "absolute", top: 4, right: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary, borderWidth: 2, borderColor: C.card },
    crownBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${C.primary}18`, borderWidth: 1, borderColor: C.primary, alignItems: "center", justifyContent: "center" },
    greetSub: { fontSize: 18, color: C.muted },
    greetName: { fontSize: 28, fontWeight: "700", color: C.text },
    quickActions: { flexDirection: "row", gap: 12, marginBottom: 28 },
    quickBtn: { flex: 1, alignItems: "center", gap: 8, padding: 16, borderRadius: 16, backgroundColor: C.surface },
    quickIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
    quickLabel: { fontSize: 11, fontWeight: "600", color: C.text, textAlign: "center" },
    banner: { borderRadius: 16, backgroundColor: C.surface, padding: 20, marginBottom: 28, flexDirection: "row", alignItems: "center", gap: 16 },
    bannerIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: `${C.primary}33`, alignItems: "center", justifyContent: "center" },
    bannerTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    bannerSub: { fontSize: 13, color: `${C.text}99` },
    sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: C.text },
    viewAll: { fontSize: 14, color: C.primary, fontWeight: "500" },
    expCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    expImgWrap: { height: 140, position: "relative" },
    expImg: { width: "100%", height: "100%" },
    expBadge: { position: "absolute", top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: `${C.text}ee` },
    expBadgeText: { fontSize: 12, fontWeight: "600" },
    expTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    expLoc: { fontSize: 13, color: C.muted, marginTop: 4 },
    expDesc: { fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 18 },
    eventRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    eventThumb: { width: 72, height: 72, borderRadius: 12 },
    eventTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    eventSub: { fontSize: 13, color: C.muted, marginTop: 4 },
    eventBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: `${C.primary}18` },
    eventBadgeText: { fontSize: 11, fontWeight: "600", color: C.primary },
    eventCount: { fontSize: 12, color: C.muted },
});
