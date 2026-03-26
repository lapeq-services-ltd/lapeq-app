import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MapPin, Building2, UtensilsCrossed, Music2, Hotel, Sparkles, Heart, Search, X } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

type Venue = {
    id: string;
    name: string;
    category: string;
    city: string;
    address: string | null;
    description: string | null;
    image_url: string | null;
};

const { width: SW } = Dimensions.get("window");

const PLACEHOLDER_IMAGES: Record<string, any> = {
    restaurant: require("@/assets/images/lagos-restaurant.jpg"),
    lounge: require("@/assets/images/lagos-rooftop.jpg"),
    club: require("@/assets/images/lagos-beach.jpg"),
    hotel: require("@/assets/images/lagos-hotel.jpg"),
    spa: require("@/assets/images/lagos-restaurant.jpg"),
};

const getCategoryIcon = (category: string, color: string) => {
    const props = { size: 16, color, strokeWidth: 1.8 };
    switch (category) {
        case "restaurant": return <UtensilsCrossed {...props} />;
        case "lounge": return <Sparkles {...props} />;
        case "club": return <Music2 {...props} />;
        case "hotel": return <Hotel {...props} />;
        case "spa": return <Sparkles {...props} />;
        default: return <Building2 {...props} />;
    }
};

const CATEGORY_LABELS: Record<string, string> = {
    restaurant: "Restaurant",
    lounge: "Lounge",
    club: "Club",
    hotel: "Hotel & Apartment",
    spa: "Spa & Wellness",
};

export default function VenuesScreen() {
    const { category, title } = useLocalSearchParams<{ category: string; title: string }>();
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCity, setActiveCity] = useState("All");
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [userId, setUserId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        init();
    }, [category]);

    const init = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            const { data: favs } = await supabase.from("favorites").select("venue_id").eq("user_id", user.id);
            if (favs) setFavorites(new Set(favs.map((f: any) => f.venue_id)));
        }
        const { data } = await supabase.from("venues").select("*").eq("active", true).eq("category", category).order("name");
        if (data) setVenues(data);
        setLoading(false);
    };

    const toggleFavorite = async (venueId: string) => {
        if (!userId) return;
        const isFav = favorites.has(venueId);
        const next = new Set(favorites);
        if (isFav) {
            next.delete(venueId);
            await supabase.from("favorites").delete().eq("user_id", userId).eq("venue_id", venueId);
        } else {
            next.add(venueId);
            await supabase.from("favorites").insert({ user_id: userId, venue_id: venueId });
        }
        setFavorites(next);
    };

    const onSearch = (text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
    };

    const searchLower = search.toLowerCase().trim();
    const cityFiltered = activeCity === "All" ? venues : venues.filter(v => v.city === activeCity);
    const filtered = searchLower.length < 1
        ? cityFiltered
        : cityFiltered.filter(v =>
            v.name.toLowerCase().includes(searchLower) ||
            (v.address ?? "").toLowerCase().includes(searchLower)
        );

    const cities = ["All", ...Array.from(new Set(venues.map(v => v.city)))];

    const renderItem = useCallback(({ item, index }: { item: Venue; index: number }) => {
        const isFav = favorites.has(item.id);
        const isFeature = index === 0 && !searchLower;
        const imgSrc = item.image_url ? { uri: item.image_url } : PLACEHOLDER_IMAGES[item.category] ?? PLACEHOLDER_IMAGES.restaurant;

        return (
            <TouchableOpacity
                style={[s.card, isFeature ? s.cardFeatured : s.cardRegular]}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: "/explore/venue-detail", params: { id: item.id } })}
            >
                {/* Image section */}
                <View style={[s.imgWrap, isFeature ? s.imgWrapFeatured : s.imgWrapRegular]}>
                    <Image source={imgSrc} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />

                    {/* City badge */}
                    <View style={[s.cityBadge, { backgroundColor: item.city === "Lagos" ? "rgba(201,168,76,0.9)" : "rgba(100,149,237,0.9)" }]}>
                        <Text style={s.cityBadgeText}>{item.city}</Text>
                    </View>

                    {/* Favorite button */}
                    <TouchableOpacity
                        style={s.favBtn}
                        onPress={() => toggleFavorite(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Heart
                            size={16}
                            color={isFav ? C.primary : "#ffffff"}
                            fill={isFav ? C.primary : "transparent"}
                            strokeWidth={2}
                        />
                    </TouchableOpacity>
                </View>

                {/* Info section */}
                <View style={s.infoWrap}>
                    <View style={s.infoLeft}>
                        <View style={s.categoryTag}>
                            {getCategoryIcon(item.category, C.primary)}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                            {item.address ? (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                                    <MapPin size={10} color={C.muted} />
                                    <Text style={s.cardAddress} numberOfLines={1}>{item.address}</Text>
                                </View>
                            ) : (
                                <Text style={s.cardAddress}>{CATEGORY_LABELS[item.category] ?? item.category}</Text>
                            )}
                        </View>
                    </View>
                    <ChevronLeft size={16} color={C.muted} style={{ transform: [{ rotate: "180deg" }] }} />
                </View>
            </TouchableOpacity>
        );
    }, [favorites, s, C, searchLower]);

    return (
        <SafeAreaView style={s.root}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.eyebrow}>EXPLORE</Text>
                    <Text style={s.title}>{title}</Text>
                </View>
                <Text style={s.countText}>{filtered.length} places</Text>
            </View>

            {/* Search bar */}
            <View style={s.searchWrap}>
                <Search size={16} color={C.muted} />
                <TextInput
                    style={s.searchInput}
                    placeholder={`Search ${title?.toLowerCase()}...`}
                    placeholderTextColor={C.muted}
                    value={search}
                    onChangeText={onSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")}>
                        <X size={16} color={C.muted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* City filter */}
            {cities.length > 2 && (
                <View style={s.cityRow}>
                    {cities.map(city => (
                        <TouchableOpacity
                            key={city}
                            style={[s.cityChip, activeCity === city && s.cityChipActive]}
                            onPress={() => setActiveCity(city)}
                        >
                            <Text style={[s.cityChipText, activeCity === city && s.cityChipTextActive]}>{city}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {loading ? (
                <View style={s.center}><ActivityIndicator color={C.primary} /></View>
            ) : filtered.length === 0 ? (
                <View style={s.center}><Text style={{ color: C.muted, fontSize: 15 }}>No venues found</Text></View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={v => v.id}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                />
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    eyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2 },
    title: { fontSize: 24, fontWeight: "700", color: C.text },
    countText: { fontSize: 12, color: C.muted, fontWeight: "600" },

    searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginBottom: 14, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: C.border },
    searchInput: { flex: 1, fontSize: 14, color: C.text },

    cityRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
    cityChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
    cityChipActive: { borderColor: C.primary, backgroundColor: theme === "dark" ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.08)" },
    cityChipText: { fontSize: 12, fontWeight: "600", color: C.muted },
    cityChipTextActive: { color: C.primary },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

    card: { borderRadius: 20, overflow: "hidden", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    cardFeatured: {},
    cardRegular: {},

    imgWrap: { position: "relative", overflow: "hidden" },
    imgWrapFeatured: { height: 220 },
    imgWrapRegular: { height: 140 },

    cityBadge: { position: "absolute", top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    cityBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },
    favBtn: { position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },

    infoWrap: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
    infoLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
    categoryTag: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme === "dark" ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.08)", alignItems: "center", justifyContent: "center" },
    cardName: { fontSize: 15, fontWeight: "700", color: C.text },
    cardAddress: { fontSize: 12, color: C.muted },
});
