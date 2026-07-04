import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
    Pressable,
} from "react-native";
import WelcomeModal from "@/components/WelcomeModal";
import AppTour from "@/components/AppTour";
import PromoPopup from "@/components/PromoPopup";
import Skeleton from "@/components/Skeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

let trialPopupShown = false;
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, Crown, ChevronRight, Calendar, Plane, Car, HelpCircle, MessageCircle, LayoutGrid, Plus, Headphones, ClipboardList, Sparkles, Settings, FileText, X } from "lucide-react-native";
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

type Partner = { id: string; name: string; category: string; city: string; image_url: string | null; venue_id?: string | null; body?: string | null };

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

let welcomeShownSession = false;
let trialShownSession = false;
let promoShownSession = false;

export default function HomeScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const [userName, setUserName] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [partnersLoading, setPartnersLoading] = useState(true);
    const [dbVenues, setDbVenues] = useState<{ id: string; name: string; city: string }[]>([]);
    const [picks, setPicks] = useState<any[]>([]);
    const [showTrialPopup, setShowTrialPopup] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [showPromo, setShowPromo] = useState(false);
    const [monthlyRequestsCount, setMonthlyRequestsCount] = useState(0);
    const [selectedDetailItem, setSelectedDetailItem] = useState<{
        title: string;
        body: string | null;
        image_url: string | null;
        category?: string;
        city?: string;
        tag?: string | null;
    } | null>(null);

    const triggerPromoAfterDelay = useCallback(() => {
        if (promoShownSession) return;
        setTimeout(() => {
            if (promoShownSession) return;
            promoShownSession = true;
            setShowPromo(true);
        }, 5000);
    }, []);

    const triggerTrialAfterDelay = useCallback((user: any) => {
        if (trialShownSession || promoShownSession) return;
        setTimeout(async () => {
            if (trialShownSession || promoShownSession) return;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const [{ data: profile }, { count }] = await Promise.all([
                supabase.from("profiles").select("tier").eq("id", user.id).single(),
                supabase.from("requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfMonth),
            ]);

            const needsTrial = (!profile?.tier || profile.tier === "free" || profile.tier === "Standard");
            const requestCount = count ?? 0;
            setMonthlyRequestsCount(Math.min(requestCount, 5));

            if (needsTrial && requestCount >= 3) {
                trialShownSession = true;
                setShowTrialPopup(true);
            } else {
                promoShownSession = true;
                setShowPromo(true);
            }
        }, 5000);
    }, []);
    const translateX = useRef(new Animated.Value(0)).current;
    const offsetRef = useRef(0);
    const partnerTranslateX = useRef(new Animated.Value(0)).current;

    // Quick Actions FAB
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownScale = useRef(new Animated.Value(0.85)).current;
    const dropdownOpacity = useRef(new Animated.Value(0)).current;
    const fabRotate = useRef(new Animated.Value(0)).current;

    const openDropdown = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowDropdown(true);
        dropdownScale.setValue(0.85);
        dropdownOpacity.setValue(0);
        Animated.parallel([
            Animated.spring(dropdownScale, { toValue: 1, useNativeDriver: true, tension: 280, friction: 18 }),
            Animated.timing(dropdownOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(fabRotate, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
    };

    const closeDropdown = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.timing(dropdownOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(fabRotate, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setShowDropdown(false));
    };

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
                welcomeShownSession = false;
                trialShownSession = false;
                promoShownSession = false;
            }
            await AsyncStorage.setItem("lapeq_last_user", user.id);

            // Run profile, notifications, and AsyncStorage reads all in parallel
            const [welcomeSeen, tourSeen, profileResult, notifResult, lastChatOpen] = await Promise.all([
                AsyncStorage.getItem("lapeq_welcome_seen"),
                AsyncStorage.getItem("lapeq_tour_seen"),
                supabase.from("profiles").select("full_name, tier").eq("id", user.id).single(),
                supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
                AsyncStorage.getItem(`lapeq_chat_last_open_${user.id}`),
            ]);

            if (!welcomeSeen && !welcomeShownSession) {
                welcomeShownSession = true;
                setShowWelcome(true);
            } else {
                triggerTrialAfterDelay(user);
            }

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

            // Check for admin messages newer than last time user opened chat
            if (lastChatOpen) {
                const { count } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", user.id)
                    .eq("sender_type", "admin")
                    .eq("type", "concierge")
                    .gt("created_at", lastChatOpen);
                setUnreadMessages(count ?? 0);
            } else {
                // First time — set timestamp to now so dot starts clean
                await AsyncStorage.setItem(`lapeq_chat_last_open_${user.id}`, new Date().toISOString());
                setUnreadMessages(0);
            }
            setUserId(user.id);
        });

        supabase
            .from("content")
            .select("id, title, category, city, image_url, venue_id, body, bullet_points, opening_hours")
            .eq("type", "partner")
            .eq("published", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(20)
            .then(({ data, error }) => {
                if (error) {
                    console.warn("Primary partners query failed (falling back):", error.message);
                    supabase
                        .from("content")
                        .select("id, title, category, city, image_url, body, bullet_points, opening_hours")
                        .eq("type", "partner")
                        .eq("published", true)
                        .is("deleted_at", null)
                        .order("created_at", { ascending: false })
                        .limit(20)
                        .then(({ data: fbData, error: fbError }) => {
                            if (fbError) {
                                console.error("Fallback partners query failed:", fbError.message);
                                setPartnersLoading(false);
                            } else if (fbData) {
                                const mapped = fbData.map(item => ({
                                    id: item.id,
                                    name: item.title,
                                    category: item.category ?? "restaurant",
                                    city: item.city ?? "",
                                    image_url: item.image_url,
                                    venue_id: null,
                                    body: item.body ?? null,
                                    bullet_points: item.bullet_points ?? null,
                                    opening_hours: item.opening_hours ?? null
                                }));
                                setPartners(mapped);
                                setPartnersLoading(false);
                            } else {
                                setPartnersLoading(false);
                            }
                        });
                } else if (data) {
                    const mapped = data.map(item => ({
                        id: item.id,
                        name: item.title,
                        category: item.category ?? "restaurant",
                        city: item.city ?? "",
                        image_url: item.image_url,
                        venue_id: item.venue_id,
                        body: item.body ?? null,
                        bullet_points: item.bullet_points ?? null,
                        opening_hours: item.opening_hours ?? null
                    }));
                    setPartners(mapped);
                    setPartnersLoading(false);
                } else {
                    setPartnersLoading(false);
                }
            });

        supabase
            .from("venues")
            .select("id, name, city")
            .eq("active", true)
            .is("deleted_at", null)
            .then(({ data }) => { if (data) setDbVenues(data); });

        supabase
            .from("content")
            .select("id, title, body, image_url, tag, city, category, venue_id, address, bullet_points, opening_hours")
            .eq("type", "pick")
            .eq("published", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(10)
            .then(({ data, error }) => {
                if (error) {
                    console.warn("Picks query failed, trying fallback without venue_id/address columns:", error.message);
                    supabase
                        .from("content")
                        .select("id, title, body, image_url, tag, city, category, bullet_points, opening_hours")
                        .eq("type", "pick")
                        .eq("published", true)
                        .is("deleted_at", null)
                        .order("created_at", { ascending: false })
                        .limit(10)
                        .then(({ data: fallbackData, error: fallbackError }) => {
                            if (fallbackError) {
                                console.error("Fallback picks query failed:", fallbackError.message);
                            } else if (fallbackData) {
                                setPicks(fallbackData);
                            }
                        });
                } else if (data) {
                    setPicks(data);
                }
            });
    }, []);

    // Realtime: bump badge when a new notification or admin message arrives
    useEffect(() => {
        if (!userId) return;
        const ch = supabase
            .channel(`home-notifs-${userId}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                () => setUnreadCount(prev => prev + 1)
            )
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` },
                (payload: any) => {
                    if (payload.new?.sender_type === 'admin' && payload.new?.type === 'concierge') {
                        setUnreadMessages(prev => prev + 1);
                    }
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [userId]);

    // Re-fetch unread count whenever home screen comes into focus
    useFocusEffect(useCallback(() => {
        if (!userId) return;
        // Notification badge
        supabase.from("notifications").select("*", { count: "exact", head: true })
            .eq("user_id", userId).eq("read", false)
            .then(({ count }) => setUnreadCount(count ?? 0));
        // Message dot — compare against last time user opened chat
        AsyncStorage.getItem(`lapeq_chat_last_open_${userId}`).then(async lastOpen => {
            if (lastOpen) {
                const { count } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", userId)
                    .eq("sender_type", "admin")
                    .eq("type", "concierge")
                    .gt("created_at", lastOpen);
                setUnreadMessages(count ?? 0);
            } else {
                // Initialize clean — dot starts at 0
                await AsyncStorage.setItem(`lapeq_chat_last_open_${userId}`, new Date().toISOString());
                setUnreadMessages(0);
            }
        });
    }, [userId]));

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
                        <View style={s.diasporaCta}>
                            <Text style={s.diasporaCtaText}>Get Support Now</Text>
                            <ChevronRight size={11} color={C.primary} />
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={s.quickGrid}>
                    {[
                        { label: "Lifestyle", sub: "Curated itineraries", img: require("@/assets/icons/clink.png"), route: "/(main)/experiences" as const },
                        { label: "Make a Request", sub: "Bespoke activity & travel plans", img: require("@/assets/icons/request.png"), route: "/services/lifestyle-travel" as const },
                        { label: "Elite Transit", sub: "Drive & Flights/Jets", img: require("@/assets/icons/elite.png"), route: "/services/driving" as const },
                        { label: "Customize Lapeq", sub: "Brand your experience", img: require("@/assets/icons/cobrand.png"), route: "/services/lifestyle" as const, isCustomSize: true },
                    ].map(({ label, sub, img, route, isCustomSize }) => (
                        <TouchableOpacity
                            key={label}
                            style={s.quickCard}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(route);
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={[s.quickCardIcon, isCustomSize && { width: 48, height: 48, borderRadius: 12 }]}>
                                <Image 
                                    source={img} 
                                    style={{ width: "100%", height: "100%", borderRadius: 12 }} 
                                    resizeMode={isCustomSize ? "contain" : "cover"} 
                                />
                            </View>
                            <Text style={s.quickCardLabel}>{label}</Text>
                            <Text style={s.quickCardSub}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Concierge quick-access */}
                <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 4, marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/(main)/chat", params: { mode: "concierge" } } as any)}
                        activeOpacity={0.75}
                        style={{
                            flexDirection: "row", alignItems: "center", gap: 8,
                            paddingVertical: 11, paddingHorizontal: 18,
                            borderRadius: 50,
                            borderWidth: 1,
                            borderColor: `${C.primary}40`,
                            backgroundColor: `${C.primary}0d`,
                        }}
                    >
                        <View style={{ position: "relative" }}>
                            <MessageCircle size={16} color={C.primary} />
                            {unreadMessages > 0 && (
                                <View style={{
                                    position: "absolute", top: -3, right: -3,
                                    width: 8, height: 8, borderRadius: 4,
                                    backgroundColor: C.primary,
                                    borderWidth: 1.5, borderColor: C.background,
                                }} />
                            )}
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: C.primary, fontFamily: "Jost_600SemiBold" }}>My Concierge</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/(main)/chat", params: { mode: "question" } } as any)}
                        activeOpacity={0.75}
                        style={{
                            flexDirection: "row", alignItems: "center", gap: 8,
                            paddingVertical: 11, paddingHorizontal: 18,
                            borderRadius: 50,
                            borderWidth: 1,
                            borderColor: `${C.primary}40`,
                            backgroundColor: `${C.primary}0d`,
                        }}
                    >
                        <HelpCircle size={16} color={C.primary} />
                        <Text style={{ fontSize: 13, fontWeight: "600", color: C.primary, fontFamily: "Jost_600SemiBold" }}>Ask a Question</Text>
                    </TouchableOpacity>
                </View>

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
                    <TouchableOpacity onPress={() => router.push("/partners" as any)}>
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
                                        onPress={() => {
                                            const venueId = p.venue_id || getVenueIdForCard(p.name, p.city || "");
                                            if (venueId) {
                                                router.push({ pathname: "/explore/venue-detail", params: { id: venueId } });
                                            } else if (p.body || p.image_url || p.bullet_points) {
                                                setSelectedDetailItem({
                                                    title: p.name,
                                                    body: p.body ?? null,
                                                    image_url: p.image_url,
                                                    category: p.category,
                                                    city: p.city,
                                                    bullet_points: p.bullet_points,
                                                    opening_hours: p.opening_hours
                                                });
                                            } else {
                                                router.push("/explore" as any);
                                            }
                                        }}
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
                    <Text style={s.sectionTitle}>Lapeq Picks</Text>
                    <TouchableOpacity onPress={() => router.push("/monthly-picks")}>
                        <Text style={s.viewAll}>View All →</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ height: 220, overflow: "hidden", marginBottom: 24, marginHorizontal: -20 }}>
                    {loopedPicks.length > 0 ? (
                        <Animated.View style={{ flexDirection: "row", transform: [{ translateX }], paddingLeft: 20 }}>
                            {loopedPicks.map((card, i) => {
                                const venueId = card.venue_id || getVenueIdForCard(card.title, card.city || "");
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[s.expCard, { width: CARD_WIDTH, marginRight: CARD_GAP }]}
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            if (venueId) {
                                                router.push({
                                                    pathname: "/explore/venue-detail",
                                                    params: {
                                                        id: venueId,
                                                        overrideDescription: card.body || undefined
                                                    }
                                                });
                                            } else if (card.body || card.image_url || card.bullet_points) {
                                                setSelectedDetailItem({
                                                    title: card.title,
                                                    body: card.body,
                                                    image_url: card.image_url,
                                                    category: card.category || undefined,
                                                    city: card.city || undefined,
                                                    tag: card.tag,
                                                    bullet_points: card.bullet_points,
                                                    opening_hours: card.opening_hours
                                                });
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
                                            <Text style={s.expTitle} numberOfLines={1}>{card.title}</Text>
                                            <Text style={s.expLoc}>{card.city || card.category}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
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
                        <Text style={s.trialEyebrow}>COMMUNITY PLAN</Text>
                        <Text style={s.trialTitle}>{monthlyRequestsCount} / 5 Requests Used</Text>
                        <Text style={s.trialBody}>
                            {monthlyRequestsCount >= 5
                                ? "You've reached your monthly limit on the Community plan. Upgrade to continue making requests without restrictions."
                                : `You've used ${monthlyRequestsCount} of your 5 monthly concierge requests. Upgrade to Silver, Gold or Black for unlimited access, priority service, and exclusive member benefits.`
                            }
                        </Text>
                        <TouchableOpacity
                            style={s.trialUpgradeBtn}
                            onPress={() => {
                                setShowTrialPopup(false);
                                router.push("/membership");
                                triggerPromoAfterDelay();
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={s.trialUpgradeBtnText}>Upgrade Membership</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setShowTrialPopup(false);
                                triggerPromoAfterDelay();
                            }}
                            style={{ marginTop: 14 }}
                        >
                            <Text style={s.trialSkip}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {profileLoaded && (
                <WelcomeModal
                    name={userName}
                    visible={showWelcome}
                    onClose={() => {
                        setShowWelcome(false);
                        supabase.auth.getUser().then(({ data: { user } }) => {
                            if (user) triggerTrialAfterDelay(user);
                        });
                    }}
                    onStartTour={() => {
                        setShowWelcome(false);
                        setShowTour(true);
                    }}
                />
            )}
            <AppTour
                visible={showTour}
                onFinish={() => {
                    setShowTour(false);
                    supabase.auth.getUser().then(({ data: { user } }) => {
                        if (user) triggerTrialAfterDelay(user);
                    });
                }}
            />
            <PromoPopup visible={showPromo} onClose={() => setShowPromo(false)} />

            {/* Custom Detail Popup Modal for Picks/Partners without venue linking */}
            <Modal
                visible={selectedDetailItem !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedDetailItem(null)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setSelectedDetailItem(null)} />
                    <View style={{ width: "100%", maxWidth: 400, backgroundColor: C.surface, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", position: "relative" }}>
                        
                        {/* Close button at top-right */}
                        <TouchableOpacity 
                            style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.5)", itemsAlign: "center", justifyContent: "center", alignItems: "center" }}
                            onPress={() => setSelectedDetailItem(null)}
                        >
                            <X size={16} color="#fff" />
                        </TouchableOpacity>

                        {selectedDetailItem?.image_url && (
                            <Image source={{ uri: selectedDetailItem.image_url }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
                        )}
                        <View style={{ padding: 20 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                <Text style={{ fontSize: 18, fontWeight: "700", color: C.text, flex: 1, marginRight: 8 }} numberOfLines={2}>
                                    {selectedDetailItem?.title}
                                </Text>
                                {selectedDetailItem?.category && (
                                    <Text style={{ fontSize: 11, fontWeight: "700", color: C.primary, textTransform: "uppercase" }}>
                                        {selectedDetailItem.category}
                                    </Text>
                                )}
                            </View>
                            
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                                {selectedDetailItem?.city && (
                                    <Text style={{ fontSize: 13, color: C.muted }}>
                                        📍 {selectedDetailItem.city}
                                    </Text>
                                )}
                                {selectedDetailItem?.opening_hours && (
                                    <Text style={{ fontSize: 13, color: C.primary, fontWeight: "600" }}>
                                        🕒 {selectedDetailItem.opening_hours}
                                    </Text>
                                )}
                            </View>

                            <ScrollView style={{ maxHeight: 200, marginBottom: 20 }}>
                                <Text style={{ fontSize: 13, color: C.text, lineHeight: 22 }}>
                                    {selectedDetailItem?.body || "No additional description details provided."}
                                </Text>

                                {selectedDetailItem?.bullet_points && (
                                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", paddingTop: 12 }}>
                                        {selectedDetailItem.bullet_points.split("\n").filter(b => b.trim() !== "").map((bullet, idx) => (
                                            <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                                                <Text style={{ fontSize: 13, color: C.primary, lineHeight: 20 }}>•</Text>
                                                <Text style={{ fontSize: 13, color: C.muted, lineHeight: 20, flex: 1 }}>{bullet.replace(/^[•\s*-]+/, "")}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </ScrollView>

                            <TouchableOpacity
                                style={{ width: "100%", paddingVertical: 14, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                                onPress={() => {
                                    const item = selectedDetailItem;
                                    setSelectedDetailItem(null);
                                    if (item) {
                                        const cat = (item.category || "").toLowerCase();
                                        let pType = "Bespoke Request";
                                        if (cat.includes("restaurant") || cat.includes("lounge") || cat.includes("dining")) {
                                            pType = "Private Dining";
                                        } else if (cat.includes("hotel") || cat.includes("stay") || cat.includes("accommodation")) {
                                            pType = "Stays & Accommodations";
                                        }
                                        router.push({
                                            pathname: "/services/lifestyle-travel",
                                            params: {
                                                prefillType: pType,
                                                prefillCity: item.city || undefined,
                                                prefillVenue: item.title
                                            }
                                        });
                                    }
                                }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#000", letterSpacing: 0.5 }}>Let LAPEQ Plan This For Me</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Quick Actions FAB */}
            {showDropdown && (
                <>
                    <Pressable style={s.dropdownBackdrop} onPress={closeDropdown} />
                    <Animated.View style={[s.quickDropdown, { opacity: dropdownOpacity, transform: [{ scale: dropdownScale }] }]}>
                        <Text style={s.quickDropdownHeading}>Quick Actions</Text>
                        {[
                            { icon: ClipboardList, label: "Make a Request", sub: "Bespoke plans", route: "/services/lifestyle-travel" },
                            { icon: FileText, label: "My Requests", sub: "Track bookings", route: "/requests" },
                            { icon: Settings, label: "Settings", sub: "App preferences", route: "/settings" },
                        ].map(({ icon: Icon, label, sub, route }) => (
                            <TouchableOpacity
                                key={label}
                                style={s.quickDropdownItem}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    closeDropdown();
                                    router.push(route as any);
                                }}
                            >
                                <View style={[s.quickDropdownIcon, { backgroundColor: `${C.primary}15` }]}>
                                    <Icon size={16} color={C.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[s.quickDropdownLabel, { color: C.text }]}>{label}</Text>
                                    <Text style={[s.quickDropdownSub, { color: C.muted }]}>{sub}</Text>
                                </View>
                                <ChevronRight size={12} color={C.muted} />
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </>
            )}
            <TouchableOpacity
                style={[s.fab, { backgroundColor: C.primary }]}
                onPress={showDropdown ? closeDropdown : openDropdown}
                activeOpacity={0.85}
            >
                <Animated.View style={{ transform: [{ rotate: fabRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) }] }}>
                    <Plus size={20} color={C.background} strokeWidth={2.5} />
                </Animated.View>
            </TouchableOpacity>
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
    crownBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "transparent", borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
    greetSub: { fontSize: 18, color: C.muted },
    greetName: { fontSize: 28, fontWeight: "700", color: C.text },
    quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
    diasporaCard: { height: 110, borderRadius: 18, overflow: "hidden", marginBottom: 12, flexDirection: "row", alignItems: "center" },
    diasporaImg: { ...StyleSheet.absoluteFillObject as any, width: "100%", height: "100%" },
    diasporaOverlay: { ...StyleSheet.absoluteFillObject as any, backgroundColor: "rgba(0,0,0,0.55)" },
    diasporaContent: { flex: 1, paddingLeft: 20 },
    diasporaEyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2.5, marginBottom: 4 },
    diasporaTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 3 },
    diasporaSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 6 },
    diasporaCta: { flexDirection: "row", alignItems: "center", gap: 2 },
    diasporaCtaText: { fontSize: 11, fontWeight: "700", color: C.primary, letterSpacing: 0.3 },
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
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
    },
    quickCardLabel: { fontSize: 15, fontWeight: "700", color: C.text, letterSpacing: -0.2 },
    quickCardSub: { fontSize: 12, color: C.muted },
    banner: { borderRadius: 16, backgroundColor: C.surface, padding: 20, marginBottom: 28, flexDirection: "row", alignItems: "center", gap: 16 },
    bannerIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
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
    fab: {
        position: "absolute",
        right: 16,
        bottom: 112,
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.24,
        shadowRadius: 12,
        zIndex: 35,
    },
    dropdownBackdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 20,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    quickDropdown: {
        position: "absolute",
        bottom: 176,
        right: 16,
        zIndex: 30,
        backgroundColor: theme === "dark" ? "rgba(18, 18, 18, 0.76)" : "rgba(255, 255, 255, 0.8)",
        borderRadius: 20,
        padding: 6,
        width: 210,
        borderWidth: 1,
        borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 12,
    },
    quickDropdownHeading: {
        fontSize: 10,
        fontWeight: "700",
        color: C.muted,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    quickDropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 10,
        borderRadius: 14,
    },
    quickDropdownIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    quickDropdownLabel: {
        fontSize: 13,
        fontWeight: "600",
    },
    quickDropdownSub: {
        fontSize: 10.5,
        marginTop: 1,
    },
    emptyEvents: { padding: 24, borderRadius: 16, backgroundColor: C.surface, alignItems: "center" },
    emptyEventsText: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22 },
    partnerCard: { width: 160, height: 200, borderRadius: 16, overflow: "hidden", position: "relative" },
    partnerImg: { width: "100%", height: "100%", position: "absolute" },
    partnerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    partnerBadge: { position: "absolute", top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: C.primary },
    partnerBadgeText: { fontSize: 9, fontWeight: "800", color: "#ffffff", letterSpacing: 1.5 },
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
    trialUpgradeBtnText: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
    trialSkip: { fontSize: 14, color: C.muted, fontWeight: "500" },
    featCard: { width: 160, height: 130, borderRadius: 16, overflow: "hidden", position: "relative" },
    featImg: { width: "100%", height: "100%", position: "absolute" },
    featOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.48)" },
    featContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 },
    featLabel: { fontSize: 9, fontWeight: "800", color: C.primary, letterSpacing: 2, marginBottom: 4 },
    featTitle: { fontSize: 15, fontWeight: "700", color: "#fff", lineHeight: 20 },
});

