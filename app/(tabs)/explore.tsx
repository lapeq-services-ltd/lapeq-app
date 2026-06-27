import { useState, useEffect, useMemo } from "react";
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Image, Dimensions, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, X, Lock, MapPin, ChevronRight, Bookmark, LayoutGrid, UtensilsCrossed, Wine, Music2, Building2, Flower2, SlidersHorizontal } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import Skeleton from "@/components/Skeleton";

const { width: W } = Dimensions.get("window");
const GOLD = "#c9a84c";
const CARD_W = (W - 52) / 2;

type Venue = { id: string; category: string; city: string; image_url: string | null };

const CITIES = ["All", "Lagos", "Abuja", "Port Harcourt", "Akwa Ibom", "Kano"];

const CATEGORIES = [
    { id: "all",        label: "All",         Icon: LayoutGrid },
    { id: "restaurant", label: "Restaurants", Icon: UtensilsCrossed },
    { id: "lounge",     label: "Lounges",     Icon: Wine },
    { id: "club",       label: "Clubs",       Icon: Music2 },
    { id: "hotel",      label: "Hotels",      Icon: Building2 },
    { id: "spa",        label: "Spas",        Icon: Flower2 },
];

const FALLBACK: Record<string, any> = {
    restaurant: require("@/assets/images/lagos-restaurant.jpg"),
    lounge:     require("@/assets/images/lagos-rooftop.jpg"),
    club:       require("@/assets/images/lagos-beach.jpg"),
    hotel:      require("@/assets/images/lagos-hotel.jpg"),
    spa:        require("@/assets/images/onboarding-lifestyle.png"),
};

const VIBE: Record<string, string[]> = {
    restaurant: ["Intimate dining, curated menus.", "Where culinary artistry meets exclusivity.", "Private dining rooms await."],
    lounge:     ["Skyline views. Members only.", "The city's most exclusive rooftop.", "Quiet luxury, by arrangement."],
    club:       ["Private booths. Curated nights.", "The finest nightlife, reserved.", "Where the elite gather after dark."],
    hotel:      ["Luxury suites. Personal hospitality.", "Your private city sanctuary.", "World-class stays, by LAPEQ."],
    spa:        ["Wellness, reserved for members.", "Signature treatments, serene setting.", "Private wellness, tailored to you."],
};

function getVibe(id: string, cat: string) {
    const list = VIBE[cat] ?? VIBE.restaurant;
    return list[id.charCodeAt(0) % list.length];
}

function VenueCard({ venue, height, router }: { venue: Venue; height: number; router: any }) {
    const img = venue.image_url ? { uri: venue.image_url } : (FALLBACK[venue.category] ?? FALLBACK.restaurant);
    const cat = venue.category.charAt(0).toUpperCase() + venue.category.slice(1);
    return (
        <TouchableOpacity
            style={[s.venueCard, { height }]}
            activeOpacity={0.88}
            onPress={() => router.push({ pathname: "/explore/venue-detail", params: { id: venue.id } })}
        >
            <Image source={img} style={s.venueImg} resizeMode="cover" />
            <View style={s.venueScrim} />
            <View style={s.venueTop}>
                <View style={s.venueBadge}>
                    <Text style={s.venueBadgeText}>{cat}</Text>
                </View>
                <TouchableOpacity style={s.saveBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Bookmark size={13} color="#fff" />
                </TouchableOpacity>
            </View>
            <View style={s.venueBottom}>
                <View style={s.venueCityRow}>
                    <MapPin size={9} color="rgba(255,255,255,0.55)" />
                    <Text style={s.venueCityText}>{venue.city}</Text>
                </View>
                <Text style={s.venueVibe} numberOfLines={2}>{getVibe(venue.id, venue.category)}</Text>
                <View style={s.venueCTA}>
                    <Lock size={9} color={GOLD} />
                    <Text style={s.venueCTAText}>Curate this</Text>
                    <ChevronRight size={10} color={GOLD} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function ExploreScreen() {
    const { C, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const isDark = theme === "dark";

    const [activeCategory, setActiveCategory] = useState("all");
    const [city, setCity] = useState("All");
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [showFilter, setShowFilter] = useState(false);

    useEffect(() => {
        setLoading(true);
        let q = supabase.from("venues").select("id, category, city, image_url").eq("active", true).is("deleted_at", null).limit(40);
        if (activeCategory !== "all") q = q.eq("category", activeCategory);
        if (city !== "All") q = q.eq("city", city);
        q.then(({ data }) => { setVenues(data ?? []); setLoading(false); });
    }, [activeCategory, city]);

    const filtered = useMemo(() => {
        if (search.length < 2) return venues;
        const q = search.toLowerCase();
        return venues.filter(v =>
            v.category.toLowerCase().includes(q) || v.city.toLowerCase().includes(q)
        );
    }, [venues, search]);

    const left  = filtered.filter((_, i) => i % 2 === 0);
    const right = filtered.filter((_, i) => i % 2 === 1);
    const leftHeights  = left.map((_, i)  => i % 2 === 0 ? 260 : 210);
    const rightHeights = right.map((_, i) => i % 2 === 0 ? 210 : 260);
    const cityActive = city !== "All";

    return (
        <View style={[s.root, { backgroundColor: C.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 110 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Hero */}
                <View style={[s.hero, { paddingTop: insets.top + 20, backgroundColor: C.background }]}>
                    <Text style={s.heroEyebrow}>CURATED BY LAPEQ</Text>
                    <Text style={[s.heroTitle, { color: C.text }]}>Discover{"\n"}Nigeria's finest.</Text>
                    <Text style={[s.heroSub, { color: C.muted }]}>Members-only access to restaurants, lounges, hotels & more.</Text>

                    {/* Search bar + filter icon */}
                    <View style={s.searchRow}>
                        <View style={[s.heroSearch, {
                            backgroundColor: isDark ? "rgba(255,255,255,0.07)" : C.surface,
                            borderColor: searchFocused ? GOLD : C.border,
                        }]}>
                            <Search size={17} color={searchFocused ? GOLD : C.muted} />
                            <TextInput
                                style={[s.heroSearchInput, { color: C.text }]}
                                placeholder="Search restaurants, lounges..."
                                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                value={search}
                                onChangeText={setSearch}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch("")}>
                                    <X size={15} color={C.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[s.filterBtn, {
                                backgroundColor: cityActive ? `${GOLD}18` : (isDark ? "rgba(255,255,255,0.07)" : C.surface),
                                borderColor: cityActive ? GOLD : C.border,
                            }]}
                            onPress={() => setShowFilter(true)}
                            activeOpacity={0.8}
                        >
                            <SlidersHorizontal size={18} color={cityActive ? GOLD : C.muted} strokeWidth={1.8} />
                            {cityActive && <View style={s.filterActiveDot} />}
                        </TouchableOpacity>
                    </View>

                    {/* Stats */}
                    <View style={s.heroStats}>
                        <View style={s.heroStat}>
                            <Text style={s.heroStatNum}>{loading ? "-" : filtered.length}</Text>
                            <Text style={[s.heroStatLabel, { color: C.muted }]}>Venues</Text>
                        </View>
                        <View style={[s.heroStatDivider, { backgroundColor: C.border }]} />
                        <View style={s.heroStat}>
                            <Text style={s.heroStatNum}>5</Text>
                            <Text style={[s.heroStatLabel, { color: C.muted }]}>Cities</Text>
                        </View>
                        <View style={[s.heroStatDivider, { backgroundColor: C.border }]} />
                        <View style={s.heroStat}>
                            <Text style={s.heroStatNum}>10+</Text>
                            <Text style={[s.heroStatLabel, { color: C.muted }]}>Experiences</Text>
                        </View>
                    </View>
                </View>

                {/* Sticky - category pills only */}
                <View style={{ backgroundColor: C.background, paddingBottom: 8 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 16, paddingBottom: 4 }}
                    >
                        {CATEGORIES.map(cat => {
                            const active = activeCategory === cat.id;
                            const CatIcon = cat.Icon;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[s.catPill, {
                                        backgroundColor: active ? `${GOLD}18` : C.surface,
                                        borderColor: active ? GOLD : C.border,
                                    }]}
                                    onPress={() => setActiveCategory(cat.id)}
                                    activeOpacity={0.82}
                                >
                                    <CatIcon size={15} color={active ? GOLD : C.muted} strokeWidth={active ? 2 : 1.7} />
                                    <Text style={[s.catPillLabel, { color: active ? GOLD : C.text }]}>{cat.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Experiences Banner */}
                <TouchableOpacity
                    style={s.expBanner}
                    onPress={() => router.push("/explore/experiences" as any)}
                    activeOpacity={0.88}
                >
                    <Image source={require("@/assets/images/lagos-hotel.jpg")} style={s.expBannerImg} resizeMode="cover" />
                    <View style={s.expBannerOverlay} />
                    <View style={s.expBannerContent}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.expBannerEyebrow}>CURATED PACKAGES</Text>
                            <Text style={s.expBannerTitle}>Experiences</Text>
                            <Text style={s.expBannerSub}>Date nights, weekend getaways & more - fully arranged.</Text>
                        </View>
                        <View style={s.expBannerBtn}>
                            <Text style={s.expBannerBtnText}>Browse</Text>
                            <ChevronRight size={14} color="#0a0a0a" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Results label */}
                <View style={s.resultsRow}>
                    <Text style={[s.resultsCount, { color: C.text }]}>
                        {loading ? "Finding venues..." : `${filtered.length} ${activeCategory === "all" ? "venues" : CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase() ?? "venues"}`}
                        {cityActive ? ` in ${city}` : ""}
                    </Text>
                    <View style={[s.membersBadge, { borderColor: `${GOLD}50`, backgroundColor: `${GOLD}10` }]}>
                        <Lock size={9} color={GOLD} />
                        <Text style={s.membersBadgeText}>Members only</Text>
                    </View>
                </View>

                {/* Venue grid */}
                {loading ? (
                    <View style={s.grid}>
                        <View style={s.col}>
                            <Skeleton width={CARD_W} height={260} borderRadius={18} style={{ marginBottom: 12 }} />
                            <Skeleton width={CARD_W} height={210} borderRadius={18} style={{ marginBottom: 12 }} />
                        </View>
                        <View style={s.col}>
                            <Skeleton width={CARD_W} height={210} borderRadius={18} style={{ marginBottom: 12 }} />
                            <Skeleton width={CARD_W} height={260} borderRadius={18} style={{ marginBottom: 12 }} />
                        </View>
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={s.empty}>
                        <Text style={[s.emptyTitle, { color: C.text }]}>No venues found</Text>
                        <Text style={[s.emptyHint, { color: C.muted }]}>Try a different category or city</Text>
                    </View>
                ) : (
                    <View style={s.grid}>
                        <View style={s.col}>
                            {left.map((v, i) => <VenueCard key={v.id} venue={v} height={leftHeights[i]} router={router} />)}
                        </View>
                        <View style={s.col}>
                            {right.map((v, i) => <VenueCard key={v.id} venue={v} height={rightHeights[i]} router={router} />)}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* City filter bottom sheet */}
            <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
                <View style={s.filterOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowFilter(false)} />
                    <View style={[s.filterSheet, { backgroundColor: isDark ? "#161616" : C.surface }]}>
                        <View style={[s.filterHandle, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }]} />
                        <Text style={[s.filterHeading, { color: C.text }]}>Filter by city</Text>
                        <View style={s.filterOptions}>
                            {CITIES.map(c => {
                                const active = city === c;
                                return (
                                    <TouchableOpacity
                                        key={c}
                                        style={[s.filterOption, {
                                            backgroundColor: active ? `${GOLD}18` : (isDark ? "rgba(255,255,255,0.05)" : C.background),
                                            borderColor: active ? GOLD : C.border,
                                        }]}
                                        onPress={() => { setCity(c); setShowFilter(false); }}
                                    >
                                        <Text style={[s.filterOptionText, { color: active ? GOLD : C.text }]}>
                                            {c === "All" || c === "Lagos" || c === "Abuja" ? c : `${c} (Coming Soon)`}
                                        </Text>
                                        {active && <View style={s.filterOptionDot} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={{ height: insets.bottom + 12 }} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1 },

    // Hero
    hero: { paddingHorizontal: 24, paddingBottom: 28 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 14 },
    heroTitle: { fontSize: 36, fontWeight: "800", fontFamily: "PlayfairDisplay_700Bold", lineHeight: 42, marginBottom: 10 },
    heroSub: { fontSize: 13, lineHeight: 20, marginBottom: 20 },

    // Search row
    searchRow: { flexDirection: "row", gap: 10, marginBottom: 24, alignItems: "center" },
    heroSearch: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, paddingHorizontal: 18, height: 52, borderWidth: 1 },
    heroSearchInput: { flex: 1, fontSize: 14 },
    filterBtn: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    filterActiveDot: { position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD },

    // Stats
    heroStats: { flexDirection: "row", alignItems: "center" },
    heroStat: { flex: 1, alignItems: "center" },
    heroStatNum: { fontSize: 20, fontWeight: "800", color: GOLD, marginBottom: 2 },
    heroStatLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
    heroStatDivider: { width: 1, height: 32 },

    // Category pills
    catPill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, borderWidth: 1 },
    catPillLabel: { fontSize: 13, fontFamily: "Jost_600SemiBold" },

    // Experiences banner
    expBanner: { marginHorizontal: 20, marginTop: 20, borderRadius: 18, overflow: "hidden", height: 110, position: "relative" },
    expBannerImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
    expBannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    expBannerContent: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, gap: 12 },
    expBannerEyebrow: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2.5, marginBottom: 4 },
    expBannerTitle: { fontSize: 22, fontWeight: "700", color: "#fff", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 4 },
    expBannerSub: { fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 16 },
    expBannerBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GOLD, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    expBannerBtnText: { fontSize: 13, fontWeight: "700", color: "#0a0a0a" },

    // Results
    resultsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
    resultsCount: { fontSize: 15, fontWeight: "700" },
    membersBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    membersBadgeText: { fontSize: 10, fontWeight: "700", color: GOLD },

    // Grid
    grid: { flexDirection: "row", paddingHorizontal: 16, gap: 12 },
    col: { flex: 1, gap: 12 },

    // Venue cards (always dark - photo based)
    venueCard: { width: CARD_W, borderRadius: 18, overflow: "hidden", position: "relative" },
    venueImg: { width: "100%", height: "100%", position: "absolute" },
    venueScrim: { position: "absolute", bottom: 0, left: 0, right: 0, height: 140, backgroundColor: "rgba(0,0,0,0.68)" },
    venueTop: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    venueBadge: { backgroundColor: GOLD, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
    venueBadgeText: { fontSize: 9, fontWeight: "800", color: "#0a0a0a", letterSpacing: 0.5 },
    saveBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
    venueBottom: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14, gap: 4 },
    venueCityRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    venueCityText: { fontSize: 10, color: "rgba(255,255,255,0.55)" },
    venueVibe: { fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 17, fontWeight: "500" },
    venueCTA: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    venueCTAText: { fontSize: 11, fontWeight: "700", color: GOLD },

    // Empty state
    empty: { paddingTop: 60, alignItems: "center", gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: "700" },
    emptyHint: { fontSize: 13 },

    // City filter modal
    filterOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    filterSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 14 },
    filterHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 22 },
    filterHeading: { fontSize: 16, fontFamily: "Jost_700Bold", marginBottom: 18 },
    filterOptions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
    filterOption: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7 },
    filterOptionText: { fontSize: 14, fontFamily: "Jost_500Medium" },
    filterOptionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
});
