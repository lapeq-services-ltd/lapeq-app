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
    Modal,
} from "react-native";
import WelcomeModal from "@/components/WelcomeModal";
import AppTour from "@/components/AppTour";
import BenefitNudge from "@/components/BenefitNudge";
import PromoPopup from "@/components/PromoPopup";
import Skeleton from "@/components/Skeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";

let trialPopupShown = false;
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, Crown, ChevronRight, Calendar, Plane, Car, Headphones, LayoutGrid } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_GAP = 12;

const PARTNER_IMGS: Record<string, any> = {
    restaurant: require("@/assets/images/lagos-restaurant.jpg"),
    lounge: require("@/assets/images/lagos-rooftop.jpg"),
    club: require("@/assets/images/lagos-beach.jpg"),
    hotel: require("@/assets/images/lagos-hotel.jpg"),
    spa: require("@/assets/images/lagos-restaurant.jpg"),
};

type Partner = { id: string; name: string; category: string; city: string; image_url: string | null };

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
    const [unreadCount, setUnreadCount] = useState(0);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [partnersLoading, setPartnersLoading] = useState(true);
    const [dbVenues, setDbVenues] = useState<{ id: string; name: string; city: string }[]>([]);
    const [picks, setPicks] = useState<any[]>([]);
    const [showTrialPopup, setShowTrialPopup] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const translateX = useRef(new Animated.Value(0)).current;
    const offsetRef = useRef(0);
    const partnerTranslateX = useRef(new Animated.Value(0)).current;
    
    const loopedPicks = useMemo(() =>
        picks.length > 0 ? [...picks, ...picks, ...picks] : [],
        [picks]
    );

    useEffect(() => {
        AsyncStorage.getItem("lapeq_start_tour").then(val => {
            if (val === "1") {
                AsyncStorage.removeItem("lapeq_start_tour");
                setTimeout(() => setShowTour(true), 600);
            }
        });
    }, []);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;

            // Show cached name immediately while fetching fresh data
            AsyncStorage.getItem("lapeq_cached_name").then(cached => {
                if (cached) setUserName(cached);
            });

            // Handle user switching
            const lastUser = await AsyncStorage.getItem("lapeq_last_user");
            if (lastUser && lastUser !== user.id) {
                await AsyncStorage.multiRemove(["lapeq_welcome_seen", "lapeq_tour_seen", "lapeq_cached_name"]);
            }
            await AsyncStorage.setItem("lapeq_last_user", user.id);

            // Run profile, notifications, and AsyncStorage reads all in parallel
            const [welcomeSeen, tourSeen, profileResult, notifResult] = await Promise.all([
                AsyncStorage.getItem("lapeq_welcome_seen"),
                AsyncStorage.getItem("lapeq_tour_seen"),
                supabase.from("profiles").select("full_name, tier").eq("id", user.id).single(),
                supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
            ]);

            if (!welcomeSeen) setShowWelcome(true);

            if (!profileResult.data) {
                const meta2 = user.user_metadata ?? {};
                await supabase.from("profiles").upsert({
                    id: user.id,
                    full_name: meta2.full_name || (meta2.first_name ? `${meta2.first_name} ${meta2.last_name ?? ""}`.trim() : "") || meta2.name || null,
                }, { onConflict: "id" });
            }

            const meta = user.user_metadata ?? {};
            const name =
                profileResult.data?.full_name?.split(" ")[0] ||
                meta.full_name?.split(" ")[0] ||
                meta.first_name ||
                meta.name?.split(" ")[0] ||
                "";
            setUserName(name);
            if (name) AsyncStorage.setItem("lapeq_cached_name", name);
            setProfileLoaded(true);

            setUnreadCount(notifResult.count ?? 0);

            if (
                !trialPopupShown &&
                (!profileResult.data?.tier || profileResult.data.tier === "free") &&
                tourSeen === "1" &&
                welcomeSeen === "1"
            ) {
                trialPopupShown = true;
                setTimeout(() => setShowTrialPopup(true), 1500);
            }
        });

        supabase
            .from("venues")
            .select("id, name, category, city, image_url")
            .eq("active", true)
            .is("deleted_at", null)
            .limit(20)
            .then(({ data }) => { setPartners(data ?? []); setPartnersLoading(false); });

        supabase
            .from("venues")
            .select("id, name, city")
            .eq("active", true)
            .is("deleted_at", null)
            .then(({ data }) => { if (data) setDbVenues(data); });

        supabase
            .from("content")
            .select("id, title, body, image_url, tag, city, category")
            .eq("type", "pick")
            .eq("published", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(10)
            .then(({ data }) => {
                if (data) setPicks(data);
            });
    }, []);

    const loopedPartners = useMemo(() =>
        partners.length > 0 ? [...partners, ...partners, ...partners] : [],
        [partners]
    );

    const getVenueIdForCard = (title: string, sub: string) => {
        const cleanedTitle = title.replace(/\s+restaurant/gi, "").replace(/\s+grill/gi, "").trim().toLowerCase();
        const lowerSub = sub.toLowerCase();
        
        let matches = dbVenues.filter(v => {
            const vName = v.name.toLowerCase();
            return vName.includes(cleanedTitle) || cleanedTitle.includes(vName);
        });

        if (matches.length > 0) {
            const cityMatch = matches.find(v => lowerSub.includes(v.city.toLowerCase()));
            if (cityMatch) return cityMatch.id;
            return matches[0].id;
        }
        return null;
    };

    useEffect(() => {
        if (partners.length === 0) return;
        const PARTNER_TOTAL = partners.length * (160 + 12);
        const loop = () => {
            partnerTranslateX.setValue(-PARTNER_TOTAL);
            Animated.timing(partnerTranslateX, {
                toValue: 0,
                duration: PARTNER_TOTAL * 18,
                useNativeDriver: true,
            }).start(({ finished }) => { if (finished) loop(); });
        };
        loop();
        return () => partnerTranslateX.stopAnimation();
    }, [partners.length]);

    useEffect(() => {
        if (picks.length === 0) return;
        const TOTAL = picks.length * (CARD_WIDTH + CARD_GAP);
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
    }, [picks.length]);

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
                        {unreadCount > 0 && (
                            <View style={s.notifBadge}>
                                <Text style={s.notifBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={s.crownBtn} onPress={() => router.push("/membership")}>
                        <Crown size={24} color={C.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
                <View style={{ marginBottom: 20 }}>
                    <Text style={s.greetSub}>{(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" + (userName ? "," : ".") : h < 17 ? "Good afternoon" + (userName ? "," : ".") : "Good evening" + (userName ? "," : "."); })()}</Text>
                    {userName ? <Text style={s.greetName}>{userName}</Text> : null}
                </View>

                <TouchableOpacity style={s.diasporaCard} onPress={() => router.push("/services/diaspora-support" as any)} activeOpacity={0.88}>
                    <Image source={require("@/assets/images/lagos-hotel.jpg")} style={s.diasporaImg} resizeMode="cover" />
                    <View style={s.diasporaOverlay} />
                    <View style={s.diasporaContent}>
                        <Text style={s.diasporaEyebrow}>GLOBAL SERVICE</Text>
                        <Text style={s.diasporaTitle}>Diaspora Support</Text>
                        <Text style={s.diasporaSub}>On-ground support for Nigerians abroad</Text>
                    </View>
                    <ChevronRight size={20} color="rgba(255,255,255,0.7)" style={{ marginRight: 16 }} />
                </TouchableOpacity>

                <View style={s.quickGrid}>
                    {[
                        { label: "Experiences", sub: "Curated itineraries", Icon: Calendar, route: "/(main)/experiences" as const },
                        { label: "Personalized Plan", sub: "Activity Ideas/Reccomendations", Icon: Plane, route: "/services/lifestyle-travel" as const },
                        { label: "Chauffeur", sub: "Private driving", Icon: Car, route: "/services/driving" as const },
                        { label: "Lifestyle", sub: "All services", Icon: LayoutGrid, route: "/services/lifestyle" as const },
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
                            { label: "FOR HER", title: "Ladies\nConcierge", img: require("@/assets/images/queens.jpg"), route: "/services/ladies-concierge" },
                            { label: "FOR HIM", title: "Gentlemens\nConcierge", img: require("@/assets/images/gents (1).jpg"), route: "/services/gentlemens-concierge" },
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

                {/* Partners carousel */}
                <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>Our Partners</Text>
                    <TouchableOpacity onPress={() => router.push("/explore" as any)}>
                        <Text style={s.viewAll}>See all →</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ marginHorizontal: -20, marginBottom: 28 }}>
                    {partnersLoading ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }} scrollEnabled={false}>
                            {[1, 2, 3].map(i => <Skeleton key={i} width={160} height={200} borderRadius={16} />)}
                        </ScrollView>
                    ) : loopedPartners.length > 0 ? (
                        <View style={{ height: 200, overflow: "hidden" }}>
                            <Animated.View style={{ flexDirection: "row", transform: [{ translateX: partnerTranslateX }], paddingLeft: 20 }}>
                                {loopedPartners.map((p, i) => (
                                    <TouchableOpacity
                                        key={`${p.id}-${i}`}
                                        style={[s.partnerCard, { marginRight: 12 }]}
                                        onPress={() => router.push({ pathname: "/explore/venue-detail", params: { id: p.id } })}
                                        activeOpacity={0.88}
                                    >
                                        <Image
                                            source={p.image_url ? { uri: p.image_url } : (PARTNER_IMGS[p.category] ?? PARTNER_IMGS.restaurant)}
                                            style={s.partnerImg}
                                            resizeMode="cover"
                                        />
                                        <View style={s.partnerOverlay} />
                                        <View style={s.partnerContent}>
                                            <Text style={s.partnerName} numberOfLines={1}>{p.name}</Text>
                                            <Text style={s.partnerCity}>{p.city}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </Animated.View>
                        </View>
                    ) : null}
                </View>

                <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>Monthly Picks</Text>
                    <TouchableOpacity onPress={() => router.push("/monthly-picks")}>
                        <Text style={s.viewAll}>View All →</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ height: 220, overflow: "hidden", marginBottom: 24, marginHorizontal: -20 }}>
                    {loopedPicks.length > 0 ? (
                        <Animated.View style={{ flexDirection: "row", transform: [{ translateX }], paddingLeft: 20 }}>
                            {loopedPicks.map((card, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[s.expCard, { width: CARD_WIDTH, marginRight: CARD_GAP }]}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        const venueId = getVenueIdForCard(card.title, card.city || "");
                                        if (venueId) {
                                            router.push({ pathname: "/explore/venue-detail", params: { id: venueId } });
                                        } else {
                                            router.push("/explore" as any);
                                        }
                                    }}
                                >
                                    <View style={s.expImgWrap}>
                                        <Image
                                            source={card.image_url ? { uri: card.image_url } : require("@/assets/images/lagos-rooftop.jpg")}
                                            style={s.expImg}
                                            resizeMode="cover"
                                        />
                                        {card.tag && (
                                            <View style={s.expBadge}>
                                                <Text style={[s.expBadgeText, { color: darkBadgeColor }]}>{card.tag}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={{ padding: 10 }}>
                                        <Text style={s.expTitle}>{card.title}</Text>
                                        <Text style={s.expLoc}>{card.city || card.category}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </Animated.View>
                    ) : (
                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: C.muted, fontSize: 13 }}>No recommendations this month.</Text>
                        </View>
                    )}
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

            {/* Free trial popup */}
            <Modal visible={showTrialPopup} transparent animationType="fade">
                <View style={s.trialOverlay}>
                    <View style={s.trialBox}>
                        <Image
                            source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={s.trialLogo}
                            resizeMode="contain"
                        />
                        <Text style={s.trialEyebrow}>FREE PLAN</Text>
                        <Text style={s.trialTitle}>4 Requests This Month</Text>
                        <Text style={s.trialBody}>
                            You have 4 concierge requests available on your free plan. Upgrade to Gold or Black for unlimited access, priority service, and exclusive member benefits.
                        </Text>
                        <TouchableOpacity
                            style={s.trialUpgradeBtn}
                            onPress={() => { setShowTrialPopup(false); router.push("/membership"); }}
                            activeOpacity={0.85}
                        >
                            <Text style={s.trialUpgradeBtnText}>Upgrade Membership</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowTrialPopup(false)} style={{ marginTop: 14 }}>
                            <Text style={s.trialSkip}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {profileLoaded && (
                <WelcomeModal
                    name={userName}
                    visible={showWelcome}
                    onClose={() => setShowWelcome(false)}
                    onStartTour={() => {
                        setShowWelcome(false);
                        setShowTour(true);
                    }}
                />
            )}
            <AppTour visible={showTour} onFinish={() => setShowTour(false)} />
            <BenefitNudge />
            <PromoPopup />
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    logoImg: { width: 36, height: 36 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text, letterSpacing: -0.3 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    notifBadge: { 
        position: "absolute", 
        top: -4, 
        right: -4, 
        minWidth: 18, 
        height: 18, 
        borderRadius: 9, 
        backgroundColor: C.red, 
        alignItems: "center", 
        justifyContent: "center", 
        paddingHorizontal: 4, 
        borderWidth: 1.5, 
        borderColor: C.background 
    },
    notifBadgeText: { 
        color: "#ffffff", 
        fontSize: 9, 
        fontWeight: "800", 
        textAlign: "center" 
    },
    crownBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${C.primary}18`, borderWidth: 1, borderColor: C.primary, alignItems: "center", justifyContent: "center" },
    greetSub: { fontSize: 18, color: C.muted },
    greetName: { fontSize: 28, fontWeight: "700", color: C.text },
    quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
    diasporaCard: { height: 110, borderRadius: 18, overflow: "hidden", marginBottom: 12, flexDirection: "row", alignItems: "center" },
    diasporaImg: { ...StyleSheet.absoluteFillObject as any, width: "100%", height: "100%" },
    diasporaOverlay: { ...StyleSheet.absoluteFillObject as any, backgroundColor: "rgba(0,0,0,0.55)" },
    diasporaContent: { flex: 1, paddingLeft: 20 },
    diasporaEyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2.5, marginBottom: 4 },
    diasporaTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 3 },
    diasporaSub: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
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
    partnerCard: { width: 160, height: 200, borderRadius: 16, overflow: "hidden", position: "relative" },
    partnerImg: { width: "100%", height: "100%", position: "absolute" },
    partnerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    partnerBadge: { position: "absolute", top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: C.primary },
    partnerBadgeText: { fontSize: 9, fontWeight: "800", color: "#0a0a0a", letterSpacing: 1.5 },
    partnerContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 },
    partnerName: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 2 },
    partnerCity: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
    trialOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 24 },
    trialBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 28, alignItems: "center", borderWidth: 1, borderColor: C.primary },
    trialLogo: { width: 52, height: 52, marginBottom: 16 },
    trialEyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2.5, marginBottom: 8 },
    trialTitle: { fontSize: 22, fontWeight: "700", color: C.text, marginBottom: 12, textAlign: "center" },
    trialBody: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 24 },
    trialUpgradeBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: C.primary, alignItems: "center" },
    trialUpgradeBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0a0a" },
    trialSkip: { fontSize: 14, color: C.muted, fontWeight: "500" },
    featCard: { width: 160, height: 130, borderRadius: 16, overflow: "hidden", position: "relative" },
    featImg: { width: "100%", height: "100%", position: "absolute" },
    featOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.48)" },
    featContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 },
    featLabel: { fontSize: 9, fontWeight: "800", color: C.primary, letterSpacing: 2, marginBottom: 4 },
    featTitle: { fontSize: 15, fontWeight: "700", color: "#fff", lineHeight: 20 },
});
