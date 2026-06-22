import { useMemo, useCallback, useState, useRef } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Pressable, Animated
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Settings, Crown, ArrowRight, Clock, Plus, MapPin, Heart, Bookmark, Headphones, ClipboardList, Car, Plane, BookOpen, Info } from "lucide-react-native";
import Skeleton from "@/components/Skeleton";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

type RecentRequest = {
    id: string;
    service_type: string;
    status: string;
    created_at: string;
    reference: string | null;
};

type SavedVenue = {
    id: string;
    name: string;
    category: string;
    city: string;
    image_url: string | null;
};

const SERVICE_LABELS: Record<string, string> = {
    "lifestyle-travel": "Hospitality & Travel",
    "concierge": "Concierge Request",
    "concierge-request": "Concierge Request",
    "driving": "Chauffeur Service",
    "logistics": "Logistics",
    "corporate-pairing": "Corporate Pairing",
    "diaspora-support": "Diaspora Support",
    "project-trust": "Project Supervision",
    "ladies-concierge": "Ladies Concierge",
    "gentlemens-concierge": "Gentlemen's Concierge",
    "tier-purchase": "Membership Upgrade",
    "lifestyle-request": "Bespoke Request",
};

const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    active: "#10b981",
    completed: "#6b7280",
    cancelled: "#ef4444",
};

const JOURNAL_ARTICLES = [
    { category: "Lifestyle", readTime: "6 min", date: "Feb 2026", title: "The Insider's Guide to Abuja's Most Exclusive Venues", img: require("@/assets/images/lagos-rooftop.jpg"), route: "/journal" },
    { category: "Travel", readTime: "5 min", date: "Mar 2026", title: "Lagos to London: How LAPEQ Members Travel Differently", img: require("@/assets/images/lagos-hotel.jpg"), route: "/journal" },
    { category: "Dining", readTime: "4 min", date: "Mar 2026", title: "Port Harcourt's Best Kept Dining Secrets", img: require("@/assets/images/lagos-restaurant.jpg"), route: "/journal" },
    { category: "Hospitality", readTime: "7 min", date: "Apr 2026", title: "Nigeria's Finest Hotel Suites - Reviewed by Our Team", img: require("@/assets/images/lagos-beach.jpg"), route: "/journal" },
];

const PLACEHOLDER_IMAGES: Record<string, any> = {
    restaurant: require("@/assets/images/lagos-restaurant.jpg"),
    lounge: require("@/assets/images/lagos-rooftop.jpg"),
    club: require("@/assets/images/lagos-beach.jpg"),
    hotel: require("@/assets/images/lagos-hotel.jpg"),
    spa: require("@/assets/images/lagos-restaurant.jpg"),
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ProfileScreen() {
    const router = useRouter();
    const { theme, toggleTheme, C } = useTheme();
    const [userName, setUserName] = useState("");
    const [userLocation, setUserLocation] = useState("");
    const [userCountry, setUserCountry] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [tier, setTier] = useState("Standard");
    const [activeTab, setActiveTab] = useState<"requests" | "saved" | "journal">("requests");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownScale = useRef(new Animated.Value(0.85)).current;
    const dropdownOpacity = useRef(new Animated.Value(0)).current;

    const openDropdown = () => {
        setShowDropdown(true);
        dropdownScale.setValue(0.85);
        dropdownOpacity.setValue(0);
        Animated.parallel([
            Animated.spring(dropdownScale, { toValue: 1, useNativeDriver: true, tension: 280, friction: 18 }),
            Animated.timing(dropdownOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start();
    };

    const closeDropdown = () => setShowDropdown(false);

    const [requestCount, setRequestCount] = useState<number | null>(null);
    const [savedCount, setSavedCount] = useState<number | null>(null);
    const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    const [savedVenues, setSavedVenues] = useState<SavedVenue[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [savedLoaded, setSavedLoaded] = useState(false);

    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    useFocusEffect(
        useCallback(() => {
            loadStats(requestCount === null);
            loadSaved(true);
        }, [requestCount])
    );

    const loadStats = async (showSpinner = false) => {
        if (showSpinner) setLoadingStats(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoadingStats(false); return; }

        const [reqResult, favResult, recentResult, profileResult] = await Promise.all([
            supabase.from("requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "cancelled"),
            supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
            supabase.from("requests").select("id, service_type, status, created_at, reference").eq("user_id", user.id).neq("status", "cancelled").order("created_at", { ascending: false }).limit(10),
            supabase.from("profiles").select("tier, full_name, preferred_name, region, country, avatar_url").eq("id", user.id).single(),
        ]);

        setRequestCount(reqResult.count ?? 0);
        setSavedCount(favResult.count ?? 0);
        if (recentResult.data) setRecentRequests(recentResult.data);
        const meta = user.user_metadata ?? {};
        const metaFullName = meta.full_name || 
            (meta.first_name ? `${meta.first_name} ${meta.last_name ?? ""}`.trim() : "") ||
            meta.name || "";
        if (profileResult.data) {
            const p = profileResult.data;
            setTier(p.tier || "Standard");
            const displayName = p.full_name || metaFullName;
            setUserName(displayName);
            setUserLocation(p.region || meta.region || "");
            setUserCountry(p.country || meta.country || "");
            if (p.avatar_url) {
                const path = `${user.id}/avatar.jpg`;
                const { data: signed } = await supabase.storage
                    .from("avatars")
                    .createSignedUrl(path, 60 * 60 * 24 * 365);
                setImageUri(signed?.signedUrl ?? p.avatar_url);
            }
        } else {
            setUserName(metaFullName);
        }
        setLoadingStats(false);
    };

    const loadSaved = useCallback(async (force = false) => {
        if (savedLoaded && !force) return;
        setLoadingSaved(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoadingSaved(false); return; }

        const { data } = await supabase
            .from("favorites")
            .select("venue_id, venues(id, name, category, city, image_url)")
            .eq("user_id", user.id);

        if (data) {
            const venues = data.map((row: any) => row.venues).filter(Boolean);
            setSavedVenues(venues);
        }
        setLoadingSaved(false);
        setSavedLoaded(true);
    }, [savedLoaded]);

    const handleTabChange = (tab: "requests" | "saved" | "journal") => {
        setActiveTab(tab);
        if (tab === "saved") loadSaved();
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Profile</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/settings/about" as any)}>
                        <Info size={16} color={C.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/settings")}>
                        <Settings size={16} color={C.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.plusBtn} onPress={openDropdown}>
                        <Plus size={18} color="#0a0a0a" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
                {/* Profile row */}
                <View style={s.profileRow}>
                    <View style={s.avatar}>
                        <Image
                            source={imageUri ? { uri: imageUri } : require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={s.avatarImg}
                            resizeMode="cover"
                            onError={() => setImageUri(null)}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        {loadingStats && !userName
                            ? <Skeleton width={140} height={22} borderRadius={6} style={{ marginBottom: 6 }} />
                            : <Text style={s.name}>{userName}</Text>}
                        {(userLocation || userCountry) && (
                            <Text style={s.location}>{[userLocation, userCountry].filter(Boolean).join(", ")}</Text>
                        )}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                            <Crown size={14} color={C.primary} />
                            <Text style={s.tier}>{tier} Member</Text>
                        </View>
                    </View>
                </View>

                {/* Membership card */}
                <View style={s.memberCard}>
                    <View style={s.cardGlowCircle} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View>
                            <Text style={s.cardSub}>Lapeq {tier}</Text>
                            <Text style={s.cardYear}>Since 2025</Text>
                        </View>
                        <Crown size={20} color="#000000" />
                    </View>
                </View>

                {/* Stats */}
                <View style={s.stats}>
                    <View style={s.statBox}>
                        {loadingStats
                            ? <Skeleton width={40} height={28} borderRadius={6} />
                            : <Text style={s.statVal}>{requestCount ?? 0}</Text>}
                        <Text style={s.statLabel}>Requests</Text>
                    </View>
                    <View style={s.statBox}>
                        {loadingStats
                            ? <Skeleton width={40} height={28} borderRadius={6} />
                            : <Text style={s.statVal}>{savedCount ?? 0}</Text>}
                        <Text style={s.statLabel}>Saved</Text>
                    </View>
                </View>

                {/* Tab switcher */}
                <View style={s.tabRow}>
                    <TouchableOpacity style={[s.tab, activeTab === "requests" && s.tabActive]} onPress={() => handleTabChange("requests")}>
                        <Clock size={16} color={activeTab === "requests" ? C.primary : C.muted} />
                        <Text style={[s.tabText, activeTab === "requests" && s.tabTextActive]}>Requests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.tab, activeTab === "saved" && s.tabActive]} onPress={() => handleTabChange("saved")}>
                        <Bookmark size={16} color={activeTab === "saved" ? C.primary : C.muted} />
                        <Text style={[s.tabText, activeTab === "saved" && s.tabTextActive]}>Saved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.tab, activeTab === "journal" && s.tabActive]} onPress={() => handleTabChange("journal")}>
                        <BookOpen size={16} color={activeTab === "journal" ? C.primary : C.muted} />
                        <Text style={[s.tabText, activeTab === "journal" && s.tabTextActive]}>Journal</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab content - Requests */}
                {activeTab === "requests" && (
                    loadingStats ? (
                        <View style={s.emptyTab}>
                            <ActivityIndicator color={C.primary} />
                        </View>
                    ) : recentRequests.length === 0 ? (
                        <View style={s.emptyTab}>
                            <Text style={s.emptyTabText}>No requests yet.{"\n"}Start by booking a service.</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {recentRequests.map((req) => (
                                <TouchableOpacity
                                    key={req.id}
                                    style={s.expRow}
                                    onPress={() => router.push({ pathname: "/requests/[id]", params: { id: req.id } })}
                                >
                                    <View style={[s.expIcon, { backgroundColor: `${C.primary}18` }]}>
                                        <Clock size={18} color={C.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.expLabel}>{SERVICE_LABELS[req.service_type] ?? req.service_type}</Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                                            <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[req.status] ?? C.muted }]} />
                                            <Text style={s.expSub}>
                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                {req.reference ? `  ·  ${req.reference}` : ""}
                                                {"  ·  "}{formatDate(req.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                    <ArrowRight size={16} color={C.muted} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )
                )}

                {/* Tab content - Journal */}
                {activeTab === "journal" && (
                    <View>
                        <View style={s.articleGrid}>
                            {JOURNAL_ARTICLES.map((article, i) => (
                                <TouchableOpacity key={i} style={s.articleCard} onPress={() => router.push(article.route as any)} activeOpacity={0.85}>
                                    <Image source={article.img} style={s.articleCardImg} resizeMode="cover" />
                                    <View style={s.articleCardOverlay} />
                                    <View style={s.articleCardContent}>
                                        <Text style={s.articleCardCategory}>{article.category}</Text>
                                        <Text style={s.articleCardTitle} numberOfLines={3}>{article.title}</Text>
                                        <Text style={s.articleCardMeta}>{article.readTime} · {article.date}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={s.articleViewAll} onPress={() => router.push("/journal")}>
                            <Text style={s.articleViewAllText}>View all articles →</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Tab content - Saved */}
                {activeTab === "saved" && (
                    loadingSaved ? (
                        <View style={s.emptyTab}>
                            <ActivityIndicator color={C.primary} />
                        </View>
                    ) : savedVenues.length === 0 ? (
                        <View style={s.emptyTab}>
                            <Text style={s.emptyTabText}>No saved places yet.{"\n"}Tap the heart on any venue.</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {savedVenues.map((venue) => {
                                const imgSrc = venue.image_url
                                    ? { uri: venue.image_url }
                                    : PLACEHOLDER_IMAGES[venue.category] ?? PLACEHOLDER_IMAGES.restaurant;
                                return (
                                    <TouchableOpacity
                                        key={venue.id}
                                        style={s.venueRow}
                                        onPress={() => router.push({ pathname: "/explore/venue-detail", params: { id: venue.id } })}
                                    >
                                        <Image source={imgSrc} style={s.venueImg} resizeMode="cover" />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.venueName}>{venue.name}</Text>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                                                <MapPin size={11} color={C.muted} />
                                                <Text style={s.venueCity}>{venue.city}</Text>
                                                <Text style={s.venueDot}>·</Text>
                                                <Text style={s.venueCategory}>{venue.category.charAt(0).toUpperCase() + venue.category.slice(1)}</Text>
                                            </View>
                                        </View>
                                        <Heart size={16} color={C.primary} fill={C.primary} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )
                )}
            </ScrollView>
            {/* + Dropdown */}
            {showDropdown && (
                <>
                    <Pressable style={s.dropdownBackdrop} onPress={closeDropdown} />
                    <Animated.View style={[s.dropdown, { opacity: dropdownOpacity, transform: [{ scale: dropdownScale }] }]}>
                        <Text style={s.dropdownHeading}>Quick Actions</Text>
                        {[
                            { icon: Headphones, label: "Contact My Concierge", sub: "Chat with your concierge", route: "/chat" },
                            { icon: ClipboardList, label: "My Requests", sub: "Track and manage bookings", route: "/requests" },
                            { icon: Car, label: "Book a Chauffeur", sub: "Private driving service", route: "/services/driving" },
                            { icon: Plane, label: "Plan a Trip", sub: "Flights & hotel arrangements", route: "/services/lifestyle-travel" },
                        ].map(({ icon: Icon, label, sub, route }) => (
                            <TouchableOpacity
                                key={label}
                                style={s.dropdownItem}
                                onPress={() => { closeDropdown(); router.push(route as any); }}
                            >
                                <View style={s.dropdownIcon}>
                                    <Icon size={18} color={C.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.dropdownLabel}>{label}</Text>
                                    <Text style={s.dropdownSub}>{sub}</Text>
                                </View>
                                <ArrowRight size={14} color={C.muted} />
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </>
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    plusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
    profileRow: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 24 },
    avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: C.primary, overflow: "hidden", backgroundColor: C.surface },
    avatarImg: { width: "100%", height: "100%" },
    name: { fontSize: 20, fontWeight: "700", color: C.text },
    location: { fontSize: 14, color: C.muted, marginTop: 4 },
    tier: { fontSize: 13, fontWeight: "600", color: C.primary },
    memberCard: { borderRadius: 16, padding: 20, marginBottom: 20, overflow: "hidden", backgroundColor: C.primary, position: "relative" },
    cardGlowCircle: { position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: "#b8922e" },
    cardSub: { fontSize: 12, color: "rgba(0,0,0,0.6)", textTransform: "uppercase", letterSpacing: 2 },
    cardYear: { fontSize: 18, fontWeight: "700", color: "#000000" },
    aboutRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: `${C.primary}30`, backgroundColor: `${C.primary}08`, marginBottom: 20 },
    aboutIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: `${C.primary}18`, alignItems: "center", justifyContent: "center" },
    aboutTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 2 },
    aboutSub: { fontSize: 12, color: C.muted },
    stats: { flexDirection: "row", gap: 12, marginBottom: 24 },
    statBox: { flex: 1, alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: C.surface, minHeight: 70, justifyContent: "center" },
    statVal: { fontSize: 24, fontWeight: "700", color: C.text },
    statLabel: { fontSize: 11, color: C.muted, marginTop: 4 },
    tabRow: { flexDirection: "row", backgroundColor: C.surface, borderRadius: 14, padding: 4, marginBottom: 20 },
    tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 10, borderRadius: 10 },
    tabActive: { backgroundColor: C.background },
    tabText: { fontSize: 14, fontWeight: "600", color: C.muted },
    tabTextActive: { color: C.primary },
    expRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", backgroundColor: C.surface },
    expIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    expLabel: { fontSize: 14, fontWeight: "600", color: C.text },
    expSub: { fontSize: 12, color: C.muted },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    venueRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", backgroundColor: C.surface },
    venueImg: { width: 58, height: 58, borderRadius: 10 },
    venueName: { fontSize: 15, fontWeight: "600", color: C.text },
    venueCity: { fontSize: 12, color: C.muted },
    venueDot: { fontSize: 12, color: C.muted },
    venueCategory: { fontSize: 12, color: C.primary, fontWeight: "600" },
    emptyTab: { paddingTop: 48, alignItems: "center" },
    emptyTabText: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22 },
    articleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
    articleCard: { width: "48.5%", height: 200, borderRadius: 16, overflow: "hidden", position: "relative" },
    articleCardImg: { width: "100%", height: "100%", position: "absolute" },
    articleCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.52)" },
    articleCardContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12 },
    articleCardCategory: { fontSize: 9, fontWeight: "800", color: C.primary, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 },
    articleCardTitle: { fontSize: 13, fontWeight: "700", color: "#fff", lineHeight: 18, marginBottom: 6 },
    articleCardMeta: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
    articleViewAll: { alignItems: "center", paddingVertical: 16 },
    articleViewAllText: { fontSize: 14, fontWeight: "600", color: C.primary },
    dropdownBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
    dropdown: { position: "absolute", top: 60, right: 20, zIndex: 20, backgroundColor: C.surface, borderRadius: 20, padding: 8, width: 280, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
    dropdownHeading: { fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", paddingHorizontal: 14, paddingVertical: 10 },
    dropdownItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14 },
    dropdownIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: `${C.primary}18`, alignItems: "center", justifyContent: "center" },
    dropdownLabel: { fontSize: 14, fontWeight: "600", color: C.text },
    dropdownSub: { fontSize: 12, color: C.muted, marginTop: 1 },
});
