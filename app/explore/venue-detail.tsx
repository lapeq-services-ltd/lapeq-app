import { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Linking, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, MapPin, Heart, ArrowRight, ExternalLink } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const GOLD = "#c9a84c";

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
    perks: string | null;
    menu: string | null;
};

type VenueImage = { id: string; url: string; sort_order: number };

type VenueMenuItem = {
    id: string;
    image_url: string;
    name: string;
    description: string | null;
};

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
    restaurant: "Private Dining",
    lounge: "Private Dining",
    club: "VIP Protocol",
    hotel: "Stays & Accommodations",
    spa: "Recreational Activities",
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
    const { id, overrideDescription } = useLocalSearchParams<{ id: string; overrideDescription?: string }>();
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
    const [menuItems, setMenuItems] = useState<VenueMenuItem[]>([]);
    const [activeDishIndex, setActiveDishIndex] = useState(0);

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
            
            // Fetch curated menu dishes
            const { data: menuData } = await supabase
                .from("venue_menu_items")
                .select("id, image_url, name, description")
                .eq("venue_id", id)
                .order("sort_order");
            setMenuItems((menuData as VenueMenuItem[]) ?? []);
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
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <TouchableOpacity
                                style={s.headerCurateBtn}
                                onPress={() => router.push({
                                    pathname: "/services/lifestyle-travel" as any,
                                    params: {
                                        prefillType: VENUE_SERVICE_TYPE[venue.category] ?? "",
                                        prefillVenue: venue.name,
                                        prefillCity: venue.city,
                                    }
                                })}
                                activeOpacity={0.8}
                            >
                                <Text style={s.headerCurateText}>Curate This</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.actionBtn} onPress={toggleFavorite}>
                                <Heart size={20} color={isFav ? "#c9a84c" : "#fff"} fill={isFav ? "#c9a84c" : "transparent"} strokeWidth={2} />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    <View style={s.heroContent}>
                        <View style={[s.categoryPill, { backgroundColor: "rgba(201,168,76,0.85)" }]}>
                            <Text style={s.categoryPillText}>{CATEGORY_LABELS[venue.category] ?? venue.category}</Text>
                        </View>
                        <Text style={s.heroName}>{`Curated ${CATEGORY_LABELS[venue.category] ?? "Partner"} · ${venue.city}`}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <MapPin size={13} color="rgba(255,255,255,0.7)" />
                            <Text style={s.heroAddress}>{venue.city}</Text>
                        </View>
                    </View>
                </View>

                <View style={s.body}>
                    {/* About */}
                    <View style={s.section}>
                        <Text style={s.sectionLabel}>ABOUT</Text>
                        <Text style={s.description}>
                            {overrideDescription || venue.description || "One of Lapeq's curated partner venues, selected for quality, exclusivity, and experience. Book through Lapeq for priority reservations and member benefits."}
                        </Text>
                    </View>

                    {/* Perks */}
                    {venue.perks && (
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>MEMBER PERKS</Text>
                            <View style={s.perksCard}>
                                {venue.perks.split("\n").map((perk, i) => {
                                    const p = perk.trim();
                                    if (!p) return null;
                                    return (
                                        <View key={i} style={s.perkRow}>
                                            <View style={s.starIconWrap}>
                                                <Text style={s.starIcon}>✦</Text>
                                            </View>
                                            <Text style={s.perkText}>{p}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Curated Menu Swipe Carousel */}
                    {menuItems.length > 0 && (
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>CURATED SIGNATURE DISHES</Text>
                            
                            <View style={s.dishCarouselContainer}>
                                {menuItems.length > 1 && (
                                    <TouchableOpacity
                                        style={[s.navArrow, s.navArrowLeft]}
                                        onPress={() => setActiveDishIndex(prev => (prev === 0 ? menuItems.length - 1 : prev - 1))}
                                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                    >
                                        <ChevronLeft size={20} color="#fff" />
                                    </TouchableOpacity>
                                )}

                                <View style={s.dishImageFrame}>
                                    <Image
                                        source={{ uri: menuItems[activeDishIndex].image_url }}
                                        style={s.dishImage}
                                        resizeMode="contain"
                                    />
                                </View>

                                {menuItems.length > 1 && (
                                    <TouchableOpacity
                                        style={[s.navArrow, s.navArrowRight]}
                                        onPress={() => setActiveDishIndex(prev => (prev === menuItems.length - 1 ? 0 : prev + 1))}
                                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                    >
                                        <ChevronRight size={20} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={s.dishMeta}>
                                <Text style={s.dishNameText}>{menuItems[activeDishIndex].name}</Text>
                                {menuItems[activeDishIndex].description ? (
                                    <Text style={s.dishDescText}>{menuItems[activeDishIndex].description}</Text>
                                ) : null}
                                
                                {menuItems.length > 1 && (
                                    <View style={s.dishIndicators}>
                                        {menuItems.map((_, idx) => (
                                            <View
                                                key={idx}
                                                style={[
                                                    s.dishIndicatorDot,
                                                    idx === activeDishIndex && s.dishIndicatorDotActive
                                                ]}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Menu highlights */}
                    {venue.menu && (
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>CURATED MENU HIGHLIGHTS</Text>
                            <View style={s.menuCard}>
                                {venue.menu.split("\n").map((menuItem, i) => {
                                    const m = menuItem.trim();
                                    if (!m) return null;
                                    return (
                                        <View key={i} style={s.menuRow}>
                                            <Text style={s.menuBullet}>◈</Text>
                                            <Text style={s.menuItemText}>{m}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={s.cta}>
                <TouchableOpacity
                    style={s.ctaBtn}
                    onPress={() => router.push({
                        pathname: "/services/lifestyle-travel" as any,
                        params: {
                            prefillType: VENUE_SERVICE_TYPE[venue.category] ?? "",
                            prefillVenue: venue.name,
                            prefillCity: venue.city,
                        }
                    })}
                    activeOpacity={0.85}
                >
                    <Text style={s.ctaBtnText}>Curate This For Me</Text>
                    <ArrowRight size={18} color={C.background} strokeWidth={2.5} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const getStyles = (C: any, theme: string) => {
    const isDark = theme === "dark";
    return StyleSheet.create({
        hero: { height: 380, position: "relative" },
        heroImg: { width: SW, height: 380 },
        heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
        heroActions: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 },
        dots: { position: "absolute", bottom: 72, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 },
        dot: { height: 6, borderRadius: 3 } as any,
        actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
        headerCurateBtn: { backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, justifyContent: "center", alignItems: "center" },
        headerCurateText: { color: "#000", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
        heroContent: { position: "absolute", bottom: 28, left: 20, right: 20 },
        categoryPill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
        categoryPillText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 1 },
        heroName: { fontSize: 30, fontWeight: "700", color: "#fff", marginBottom: 8, lineHeight: 36 },
        heroAddress: { fontSize: 13, color: "rgba(255,255,255,0.7)" },

        body: { padding: 24, gap: 28 },
        section: { gap: 12 },
        sectionLabel: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 2 },
        description: { fontSize: 15, color: C.muted, lineHeight: 24 },

        perksCard: { backgroundColor: isDark ? "rgba(201,168,76,0.06)" : "#fdfbfa", borderWidth: 1, borderColor: `${GOLD}20`, borderRadius: 16, padding: 18, gap: 12 },
        perkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
        starIconWrap: { width: 16, height: 16, borderRadius: 8, backgroundColor: `${GOLD}20`, alignItems: "center", justifyContent: "center", marginTop: 2 },
        starIcon: { fontSize: 10, color: GOLD, fontWeight: "900" },
        perkText: { fontSize: 14, lineHeight: 20, color: C.text },

        dishCarouselContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative", height: 260, backgroundColor: isDark ? "#0f0f0f" : "#fafafa", borderRadius: 24, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
        dishImageFrame: { width: 220, height: 220, justifyContent: "center", alignItems: "center" },
        dishImage: { width: "100%", height: "100%" },
        navArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", position: "absolute", zIndex: 10 },
        navArrowLeft: { left: 16 },
        navArrowRight: { right: 16 },

        dishMeta: { alignItems: "center", gap: 6, paddingTop: 12, paddingHorizontal: 16 },
        dishNameText: { fontSize: 16, fontWeight: "700", color: GOLD, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
        dishDescText: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 18, paddingHorizontal: 10 },
        dishIndicators: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
        dishIndicatorDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" },
        dishIndicatorDotActive: { backgroundColor: GOLD, width: 12 },

        menuCard: { backgroundColor: isDark ? "#111" : "#fbfbfb", borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 18, gap: 12 },
        menuRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
        menuBullet: { fontSize: 12, color: GOLD, marginTop: 2 },
        menuItemText: { fontSize: 14, fontWeight: "600", lineHeight: 20, color: C.text },

        cta: { padding: 20, paddingBottom: 36, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.border },
        ctaBtn: { backgroundColor: GOLD, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
        ctaBtnText: { color: "#000", fontSize: 16, fontWeight: "700" },
    });
};
