import { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Linking, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MapPin, Heart, ArrowRight, ExternalLink } from "lucide-react-native";
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
    lat: number | null;
    lng: number | null;
};

type VenueImage = { id: string; url: string; sort_order: number };

const { width: SW } = Dimensions.get("window");
const MAP_W = SW - 48;
const MAP_H = 180;
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

const PLACEHOLDER_IMAGES: Record<string, any> = {
    restaurant: require("@/assets/images/lagos-restaurant.jpg"),
    lounge: require("@/assets/images/lagos-rooftop.jpg"),
    club: require("@/assets/images/lagos-beach.jpg"),
    hotel: require("@/assets/images/lagos-hotel.jpg"),
    spa: require("@/assets/images/lagos-restaurant.jpg"),
};

const VENUE_SERVICE_TYPE: Record<string, string> = {
    restaurant: "Restaurant Reservation",
    lounge: "Restaurant Reservation",
    club: "Event Access",
    hotel: "Hotel & Accommodation",
    spa: "Spa & Wellness",
};

const CATEGORY_LABELS: Record<string, string> = {
    restaurant: "Restaurant",
    lounge: "Lounge",
    club: "Club",
    hotel: "Hotel & Apartment",
    spa: "Spa & Wellness",
};

async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
    if (!MAPBOX_TOKEN) return null;
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=NG`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.features?.length > 0) {
            const [lng, lat] = json.features[0].center;
            return { lat, lng };
        }
    } catch {}
    return null;
}

function staticMapUrl(lat: number, lng: number) {
    const w = Math.round(MAP_W);
    const h = Math.round(MAP_H);
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+c9a84c(${lng},${lat})/${lng},${lat},14,0/${w}x${h}@2x?access_token=${MAPBOX_TOKEN}`;
}

export default function VenueDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [venue, setVenue] = useState<Venue | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [mapLoading, setMapLoading] = useState(false);
    const [venueImages, setVenueImages] = useState<VenueImage[]>([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const carouselRef = useRef<ScrollView>(null);

    useEffect(() => { init(); }, [id]);

    const init = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            const { data: fav } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("venue_id", id).single();
            setIsFav(!!fav);
        }
        const { data } = await supabase.from("venues").select("*").eq("id", id).is("deleted_at", null).single();
        if (data) {
            setVenue(data);
            const { data: imgs } = await supabase
                .from("venue_images")
                .select("id, url, sort_order")
                .eq("venue_id", id)
                .order("sort_order");
            setVenueImages((imgs as VenueImage[]) ?? []);
            // Use stored coords or geocode
            if (data.lat && data.lng) {
                setCoords({ lat: data.lat, lng: data.lng });
            } else {
                const query = data.address ? `${data.address}, ${data.city}, Nigeria` : `${data.name}, ${data.city}, Nigeria`;
                setMapLoading(true);
                geocodeAddress(query).then(c => {
                    if (c) setCoords(c);
                    setMapLoading(false);
                });
            }
        }
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

    const openMaps = () => {
        if (!venue) return;
        const query = encodeURIComponent(`${venue.name}, ${venue.address ?? venue.city}`);
        Linking.openURL(`https://maps.google.com/?q=${query}`);
    };

    if (loading) return (
        <View style={{ flex: 1, backgroundColor: C.background, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={C.primary} />
        </View>
    );

    if (!venue) return null;

    const fallbackSrc = venue.image_url ? { uri: venue.image_url } : PLACEHOLDER_IMAGES[venue.category] ?? PLACEHOLDER_IMAGES.restaurant;
    const slides = venueImages.length > 0
        ? venueImages.map(img => ({ uri: img.url }))
        : [fallbackSrc];
    const mapUrl = coords ? staticMapUrl(coords.lat, coords.lng) : null;

    const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slide = Math.round(e.nativeEvent.contentOffset.x / SW);
        setActiveSlide(slide);
    };

    return (
        <View style={{ flex: 1, backgroundColor: C.background }}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero carousel */}
                <View style={s.hero}>
                    <ScrollView
                        ref={carouselRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleCarouselScroll}
                        scrollEventThrottle={16}
                        style={{ width: SW, height: 380 }}
                    >
                        {slides.map((src, i) => (
                            <View key={i} style={{ width: SW, height: 380 }}>
                                <Image source={src} style={s.heroImg} resizeMode="cover" />
                                <View style={s.heroOverlay} />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Dot indicators */}
                    {slides.length > 1 && (
                        <View style={s.dots}>
                            {slides.map((_, i) => (
                                <View
                                    key={i}
                                    style={[s.dot, { backgroundColor: i === activeSlide ? "#c9a84c" : "rgba(255,255,255,0.35)", width: i === activeSlide ? 16 : 6 }]}
                                />
                            ))}
                        </View>
                    )}

                    <SafeAreaView style={s.heroActions}>
                        <TouchableOpacity style={s.actionBtn} onPress={() => router.back()}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.actionBtn} onPress={toggleFavorite}>
                            <Heart size={20} color={isFav ? "#c9a84c" : "#fff"} fill={isFav ? "#c9a84c" : "transparent"} strokeWidth={2} />
                        </TouchableOpacity>
                    </SafeAreaView>

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

                <View style={s.body}>
                    {/* About */}
                    <View style={s.section}>
                        <Text style={s.sectionLabel}>ABOUT</Text>
                        <Text style={s.description}>
                            {venue.description ?? "One of Lapeq's curated partner venues, selected for quality, exclusivity, and experience. Book through Lapeq for priority reservations and member benefits."}
                        </Text>
                    </View>

                    {/* Location */}
                    <View style={s.section}>
                        <Text style={s.sectionLabel}>LOCATION</Text>

                        {/* Address row */}
                        <TouchableOpacity style={s.addressRow} onPress={openMaps} activeOpacity={0.75}>
                            <MapPin size={16} color={C.primary} />
                            <Text style={s.locationText}>{venue.address ?? venue.city}</Text>
                            <ExternalLink size={14} color={C.muted} />
                        </TouchableOpacity>

                        {/* Map */}
                        <TouchableOpacity
                            style={s.mapWrap}
                            onPress={openMaps}
                            activeOpacity={0.9}
                        >
                            {mapLoading && (
                                <View style={[s.mapWrap, s.mapPlaceholder]}>
                                    <ActivityIndicator color={C.primary} />
                                </View>
                            )}
                            {mapUrl && !mapLoading && (
                                <>
                                    <Image
                                        source={{ uri: mapUrl }}
                                        style={s.mapImg}
                                        resizeMode="cover"
                                    />
                                    <View style={s.mapOpenHint}>
                                        <ExternalLink size={12} color="#fff" />
                                        <Text style={s.mapOpenText}>Open in Maps</Text>
                                    </View>
                                </>
                            )}
                            {!mapUrl && !mapLoading && (
                                <View style={[s.mapWrap, s.mapPlaceholder]}>
                                    <MapPin size={24} color={C.border} />
                                    <Text style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>Map unavailable</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* CTA */}
            <View style={s.cta}>
                <TouchableOpacity
                    style={s.ctaBtn}
                    onPress={() => router.push({
                        pathname: "/services/lifestyle-travel" as any,
                        params: {
                            prefillType: VENUE_SERVICE_TYPE[venue.category] ?? "",
                            prefillVenue: venue.name,
                            prefillCity: venue.address ?? venue.city,
                        }
                    })}
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
    heroImg: { width: SW, height: 380 },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    heroActions: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 },
    dots: { position: "absolute", bottom: 72, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 },
    dot: { height: 6, borderRadius: 3, transition: "width 0.2s" } as any,
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

    addressRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border },
    locationText: { fontSize: 14, color: C.text, flex: 1 },

    mapWrap: { borderRadius: 16, overflow: "hidden", height: MAP_H, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    mapImg: { width: "100%", height: "100%" },
    mapPlaceholder: { justifyContent: "center", alignItems: "center" },
    mapOpenHint: { position: "absolute", bottom: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    mapOpenText: { fontSize: 11, color: "#fff", fontWeight: "600" },

    cta: { padding: 20, paddingBottom: 36, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.border },
    ctaBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    ctaBtnText: { color: C.background, fontSize: 16, fontWeight: "700" },
});
