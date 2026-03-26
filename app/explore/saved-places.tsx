import { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MapPin, Heart, UtensilsCrossed, Music2, Hotel, Sparkles, Building2 } from "lucide-react-native";
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
    const props = { size: 18, color, strokeWidth: 1.8 };
    switch (category) {
        case "restaurant": return <UtensilsCrossed {...props} />;
        case "lounge": return <Sparkles {...props} />;
        case "club": return <Music2 {...props} />;
        case "hotel": return <Hotel {...props} />;
        case "spa": return <Sparkles {...props} />;
        default: return <Building2 {...props} />;
    }
};

export default function SavedPlacesScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        setUserId(user.id);

        const { data } = await supabase
            .from("favorites")
            .select("venue_id, venues(*)")
            .eq("user_id", user.id);

        if (data) {
            const saved = data.map((row: any) => row.venues).filter(Boolean);
            setVenues(saved);
        }
        setLoading(false);
    };

    const removeFavorite = async (venueId: string) => {
        if (!userId) return;
        await supabase.from("favorites").delete().eq("user_id", userId).eq("venue_id", venueId);
        setVenues(prev => prev.filter(v => v.id !== venueId));
    };

    const renderItem = useCallback(({ item, index }: { item: Venue; index: number }) => {
        const isFeature = index === 0;
        const imgSrc = item.image_url ? { uri: item.image_url } : PLACEHOLDER_IMAGES[item.category] ?? PLACEHOLDER_IMAGES.restaurant;

        return (
            <TouchableOpacity
                style={[s.card, isFeature ? s.cardFeatured : s.cardRegular]}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: "/explore/venue-detail", params: { id: item.id } })}
            >
                <Image source={imgSrc} style={[s.cardImg, isFeature ? s.cardImgFeatured : s.cardImgRegular]} resizeMode="cover" />
                <View style={s.cardOverlay} />

                <TouchableOpacity
                    style={s.favBtn}
                    onPress={() => removeFavorite(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Heart size={18} color="#ef4444" fill="#ef4444" strokeWidth={2} />
                </TouchableOpacity>

                <View style={[s.cityBadge, { backgroundColor: item.city === "Lagos" ? "rgba(201,168,76,0.85)" : "rgba(100,149,237,0.85)" }]}>
                    <Text style={s.cityBadgeText}>{item.city}</Text>
                </View>

                <View style={s.cardBottom}>
                    <View style={s.categoryTag}>
                        {getCategoryIcon(item.category, C.primary)}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={s.cardName}>{item.name}</Text>
                        {item.address && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                                <MapPin size={10} color="rgba(255,255,255,0.6)" />
                                <Text style={s.cardAddress} numberOfLines={1}>{item.address}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [s, C, userId]);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.eyebrow}>EXPLORE</Text>
                    <Text style={s.title}>Saved Places</Text>
                </View>
                <Text style={s.countText}>{venues.length} saved</Text>
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator color={C.primary} /></View>
            ) : venues.length === 0 ? (
                <View style={s.center}>
                    <Heart size={40} color={C.border} strokeWidth={1.5} />
                    <Text style={{ color: C.muted, fontSize: 15, marginTop: 14 }}>No saved places yet</Text>
                    <Text style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Tap the heart on any venue to save it</Text>
                </View>
            ) : (
                <FlatList
                    data={venues}
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
    header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    eyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2 },
    title: { fontSize: 24, fontWeight: "700", color: C.text },
    countText: { fontSize: 12, color: C.muted, fontWeight: "600" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

    card: { borderRadius: 20, overflow: "hidden", position: "relative" },
    cardFeatured: { height: 280 },
    cardRegular: { height: 180 },
    cardImg: { width: "100%", position: "absolute" },
    cardImgFeatured: { height: 280 },
    cardImgRegular: { height: 180 },
    cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },

    favBtn: { position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
    cityBadge: { position: "absolute", top: 14, left: 14, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    cityBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

    cardBottom: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, flexDirection: "row", alignItems: "center" },
    categoryTag: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
    cardName: { fontSize: 18, fontWeight: "700", color: "#ffffff" },
    cardAddress: { fontSize: 11, color: "rgba(255,255,255,0.65)", flex: 1 },
});
