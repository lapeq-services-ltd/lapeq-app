import { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MapPin, Heart, UtensilsCrossed, Music2, Hotel, Sparkles, Building2, ArrowRight } from "lucide-react-native";
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

const SERVICE_ROUTES: Record<string, string> = {
    restaurant: "/services/lifestyle-travel",
    lounge: "/services/lifestyle-travel",
    club: "/services/lifestyle-travel",
    hotel: "/services/lifestyle-travel",
    spa: "/services/lifestyle-travel",
};

const CATEGORY_LABELS: Record<string, string> = {
    restaurant: "Restaurant",
    lounge: "Lounge",
    club: "Club",
    hotel: "Hotel & Apartment",
    spa: "Spa & Wellness",
};

export default function VenueDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [venue, setVenue] = useState<Venue | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        init();
    }, [id]);

    const init = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            const { data: fav } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("venue_id", id).single();
            setIsFav(!!fav);
        }
        const { data } = await supabase.from("venues").select("*").eq("id", id).single();
        if (data) setVenue(data);
        setLoading(false);
    };

    const toggleFavorite = async () => {
        if (!userId || !venue) return;
        if (isFav) {
            await supabase.from("favorites").delete().eq("user_id", userId).eq("venue_id", venue.id);
        } else {
            await supabase.from("favorites").insert({ user_id: userId, venue_id: venue.id });
        }
        setIsFav(!isFav);
    };

    if (loading) return (
        <View style={{ flex: 1, backgroundColor: C.background, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={C.primary} />
        </View>
    );

    if (!venue) return null;

    const imgSrc = venue.image_url ? { uri: venue.image_url } : PLACEHOLDER_IMAGES[venue.category] ?? PLACEHOLDER_IMAGES.restaurant;

    return (
        <View style={{ flex: 1, backgroundColor: C.background }}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero image */}
                <View style={s.hero}>
                    <Image source={imgSrc} style={s.heroImg} resizeMode="cover" />
                    <View style={s.heroOverlay} />

                    {/* Back + Favorite */}
                    <SafeAreaView style={s.heroActions}>
                        <TouchableOpacity style={s.actionBtn} onPress={() => router.back()}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.actionBtn} onPress={toggleFavorite}>
                            <Heart size={20} color={isFav ? "#ef4444" : "#fff"} fill={isFav ? "#ef4444" : "transparent"} strokeWidth={2} />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Venue name over image */}
                    <View style={s.heroContent}>
                        <View style={[s.categoryPill, { backgroundColor: "rgba(201,168,76,0.85)" }]}>
                            <Text style={s.categoryPillText}>{CATEGORY_LABELS[venue.category] ?? venue.category}</Text>
                        </View>
                        <Text style={s.heroName}>{venue.name}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <MapPin size={13} color="rgba(255,255,255,0.7)" />
                            <Text style={s.heroAddress}>{venue.city}{venue.address ? ` · ${venue.address}` : ""}</Text>
                        </View>
                    </View>
                </View>

                {/* Details */}
                <View style={s.body}>
                    {venue.description ? (
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>ABOUT</Text>
                            <Text style={s.description}>{venue.description}</Text>
                        </View>
                    ) : (
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>ABOUT</Text>
                            <Text style={s.description}>One of Lapeq's curated partner venues, selected for quality, exclusivity, and experience. Book through Lapeq for priority reservations and member benefits.</Text>
                        </View>
                    )}

                    <View style={s.section}>
                        <Text style={s.sectionLabel}>LOCATION</Text>
                        <View style={s.locationBox}>
                            <MapPin size={16} color={C.primary} />
                            <Text style={s.locationText}>{venue.address ?? venue.city}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Book CTA */}
            <View style={s.cta}>
                <TouchableOpacity
                    style={s.ctaBtn}
                    onPress={() => router.push(SERVICE_ROUTES[venue.category] as any)}
                    activeOpacity={0.85}
                >
                    <Text style={s.ctaBtnText}>Request via Lapeq</Text>
                    <ArrowRight size={18} color={C.background} strokeWidth={2.5} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    hero: { height: 380, position: "relative" },
    heroImg: { width: SW, height: 380, position: "absolute" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    heroActions: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 },
    actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
    heroContent: { position: "absolute", bottom: 28, left: 20, right: 20 },
    categoryPill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
    categoryPillText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 1 },
    heroName: { fontSize: 30, fontWeight: "700", color: "#fff", marginBottom: 8, lineHeight: 36 },
    heroAddress: { fontSize: 13, color: "rgba(255,255,255,0.7)" },

    body: { padding: 24, gap: 28 },
    section: { gap: 12 },
    sectionLabel: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2 },
    description: { fontSize: 15, color: C.muted, lineHeight: 24 },
    locationBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border },
    locationText: { fontSize: 14, color: C.text, flex: 1 },

    cta: { padding: 20, paddingBottom: 36, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.border },
    ctaBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    ctaBtnText: { color: C.background, fontSize: 16, fontWeight: "700" },
});
