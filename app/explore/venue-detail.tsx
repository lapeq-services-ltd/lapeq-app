import { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Linking, NativeSyntheticEvent, NativeScrollEvent, Modal, TextInput, Platform, Animated, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, MapPin, Heart, ArrowRight, ExternalLink, Plus, Minus, Calendar, Check, X } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import VoiceInput from "@/components/VoiceInput";
import Toast from "@/components/Toast";
import { PayWithFlutterwave } from "flutterwave-react-native";

const GOLD = "#c9a84c";
const FLW_PUBLIC_KEY = process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? "FLWPUBK_TEST-5f00e9bc042a98f121d51a66a1a117b3-X";

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

function CollapsibleSection({ title, children, startExpanded = false, C, theme }: {
    title: string;
    children: React.ReactNode;
    startExpanded?: boolean;
    C: any;
    theme: string;
}) {
    const [expanded, setExpanded] = useState(startExpanded);
    const isDark = theme === "dark";

    return (
        <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: isDark ? "#2a2a2a" : "#d8d3ca", overflow: "hidden", marginBottom: 16 }}>
            <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.8}
            >
                <Text style={{ fontSize: 11, fontWeight: "800", color: GOLD, letterSpacing: 2, textTransform: "uppercase" }}>{title}</Text>
                <ChevronRight size={16} color={GOLD} style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }} />
            </TouchableOpacity>
            
            {expanded && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", paddingTop: 16 }}>
                    {children}
                </View>
            )}
        </View>
    );
}

export default function VenueDetailScreen() {
    const { id, overrideDescription } = useLocalSearchParams<{ id: string; overrideDescription?: string }>();
    const router = useRouter();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [venue, setVenue] = useState<Venue | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: "save" | "unsave" }>({ visible: false, message: "", type: "save" });
    const toastTimer = useRef<any>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [mapLoading, setMapLoading] = useState(false);
    const [venueImages, setVenueImages] = useState<VenueImage[]>([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const carouselRef = useRef<ScrollView>(null);
    const [menuItems, setMenuItems] = useState<VenueMenuItem[]>([]);
    const [activeDishIndex, setActiveDishIndex] = useState(0);
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

    // Curation Request Form State
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestDate, setRequestDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [guestsCount, setGuestsCount] = useState(2);
    const [requestNotes, setRequestNotes] = useState("");
    const [requestLoading, setRequestLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [userTier, setUserTier] = useState<string | null>(null);
    const [monthlyRequestsCount, setMonthlyRequestsCount] = useState(0);
    const [userEmail, setUserEmail] = useState("");
    const [userName, setUserName] = useState("Member");

    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const fmtDate = (d: Date | null) => d
        ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : null;

    const handleSubmitRequest = async (paidAlready = false) => {
        setRequestLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "CUR-" + Date.now().toString(36).toUpperCase().slice(-5);
        const hasPremiumMembership = userTier && ["silver", "gold", "black"].includes(userTier.toLowerCase());

        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "experience",
            status: "pending",
            reference: ref,
            title: `Curation: Curated ${CATEGORY_LABELS[venue?.category ?? ""] ?? venue?.category ?? "Partner"} (${venue?.city})`,
            payment_status: (hasPremiumMembership || paidAlready) ? "paid" : "unpaid",
            details: {
                city: venue?.city,
                venue_id: venue?.id,
                venue_name: venue?.name, // Admin sees this!
                venue_category: venue?.category,
                guests: guestsCount,
                date: fmtDate(requestDate),
                notes: requestNotes.trim(),
                curation_fee: (hasPremiumMembership || paidAlready) ? "Included" : "₦5,000",
            },
        });

        setRequestLoading(false);
        if (error) {
            alert("Error: " + error.message);
            return;
        }

        setShowRequestModal(false);
        setShowSuccessModal(true);
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    };

    useEffect(() => { init(); }, [id]);

    const init = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const [{ data: fav }, { data: profile }, { count }] = await Promise.all([
                supabase.from("favorites").select("id").eq("user_id", user.id).eq("venue_id", id).single(),
                supabase.from("profiles").select("tier, full_name, email").eq("id", user.id).single(),
                supabase.from("requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfMonth),
            ]);

            setIsFav(!!fav);
            if (profile) {
                setUserTier(profile.tier);
                setUserName(profile.full_name ?? "Member");
                setUserEmail(profile.email ?? user.email ?? "");
            }
            setMonthlyRequestsCount(count ?? 0);
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

    const showToast = (message: string, type: "save" | "unsave") => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ visible: true, message, type });
        toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
    };

    const toggleFavorite = async () => {
        if (!userId || !venue) return;
        if (isFav) {
            await supabase.from("favorites").delete().eq("user_id", userId).eq("venue_id", venue.id);
            setIsFav(false);
            showToast("Removed from saved places", "unsave");
        } else {
            await supabase.from("favorites").insert({ user_id: userId, venue_id: venue.id });
            setIsFav(true);
            showToast("Saved to your profile", "save");
        }
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
                                onPress={() => setShowRequestModal(true)}
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
                        <Text style={s.heroName}>{venue.name}</Text>
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

                    {/* Perks Section (Collapsible) */}
                    {venue.perks && (
                        <CollapsibleSection title="MEMBER PERKS" C={C} theme={theme}>
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
                        </CollapsibleSection>
                    )}

                    {/* Curated Menu Swipe Carousel (Collapsible) */}
                    {menuItems.length > 0 && (
                        <CollapsibleSection title="CURATED SIGNATURE DISHES" C={C} theme={theme}>
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
                        </CollapsibleSection>
                    )}

                    {/* Menu highlights (Collapsible) */}
                    {venue.menu && (
                        <CollapsibleSection title="CURATED MENU HIGHLIGHTS" C={C} theme={theme}>
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
                        </CollapsibleSection>
                    )}

                    {/* Media Gallery (Non-collapsible) */}
                    {venueImages.length > 0 && (
                        <View style={{ gap: 12, marginTop: 12 }}>
                            <Text style={s.sectionLabel}>MEDIA GALLERY</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                {venueImages.map((img) => (
                                    <TouchableOpacity
                                        key={img.id}
                                        style={{ width: (SW - 48 - 16) / 3, height: (SW - 48 - 16) / 3, borderRadius: 12, overflow: "hidden", backgroundColor: C.surface, borderWidth: 1, borderColor: isDark ? "#2a2a2a" : "#d8d3ca" }}
                                        onPress={() => setSelectedGalleryImage(img.url)}
                                        activeOpacity={0.9}
                                    >
                                        <Image source={{ uri: img.url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={s.cta}>
                <TouchableOpacity
                    style={s.ctaBtn}
                    onPress={() => setShowRequestModal(true)}
                    activeOpacity={0.85}
                >
                    <Text style={s.ctaBtnText}>Curate This For Me</Text>
                    <ArrowRight size={18} color={C.background} strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {/* Request Modal */}
            <Modal visible={showRequestModal} animationType="slide" transparent onRequestClose={() => setShowRequestModal(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setShowRequestModal(false)} />
                    <View style={[s.sheet, { backgroundColor: C.background }]}>
                        <View style={[s.sheetHandle, { backgroundColor: isDark ? "#2a2a2a" : "#e0dbd2" }]} />
                        <View style={s.sheetHeader}>
                            <View>
                                <Text style={s.sheetTag}>CURATION REQUEST</Text>
                                <Text style={[s.sheetTitle, { color: C.text }]}>{`Curated ${CATEGORY_LABELS[venue.category] ?? venue.category}`}</Text>
                            </View>
                            <TouchableOpacity style={[s.closeBtn, { backgroundColor: C.surface }]} onPress={() => setShowRequestModal(false)}>
                                <X size={20} color={C.muted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text style={[s.fieldLabel, { color: C.muted }]}>NUMBER OF GUESTS</Text>
                            <View style={s.stepperRow}>
                                <TouchableOpacity style={[s.stepBtn, { borderColor: isDark ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface }]} onPress={() => setGuestsCount(g => Math.max(1, g - 1))}>
                                    <Minus size={16} color={C.text} />
                                </TouchableOpacity>
                                <Text style={[s.stepVal, { color: C.text }]}>{guestsCount}</Text>
                                <TouchableOpacity style={[s.stepBtn, { borderColor: isDark ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface }]} onPress={() => setGuestsCount(g => Math.min(30, g + 1))}>
                                    <Plus size={16} color={C.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[s.fieldLabel, { color: C.muted }]}>PREFERRED DATE</Text>
                            <TouchableOpacity style={[s.dateBtn, { backgroundColor: C.surface, borderColor: requestDate ? GOLD : (isDark ? "#2a2a2a" : "#e0dbd2") }]} onPress={() => setShowDatePicker(true)}>
                                <Calendar size={16} color={requestDate ? GOLD : C.muted} />
                                <Text style={{ fontSize: 15, color: requestDate ? C.text : C.muted, fontWeight: requestDate ? "600" : "400" }}>{fmtDate(requestDate) ?? "Select a date (optional)"}</Text>
                            </TouchableOpacity>

                            <Text style={[s.fieldLabel, { color: C.muted }]}>SPECIAL NOTES</Text>
                            <VoiceInput
                                placeholder="Any dietary restrictions, table preference, or surprise arrangements..."
                                value={requestNotes}
                                onChange={setRequestNotes}
                                accent={GOLD}
                                textColor={C.text}
                                border={isDark ? "#2a2a2a" : "#e0dbd2"}
                                inputBg={C.surface}
                            />

                            {userTier && ["silver", "gold", "black"].includes(userTier.toLowerCase()) ? (
                                <View style={[s.feeCard, { borderColor: "rgba(76,175,80,0.3)", backgroundColor: "rgba(76,175,80,0.05)" }]}>
                                    <Text style={[s.feeEyebrow, { color: "#4caf50" }]}>MEMBERSHIP BENEFIT</Text>
                                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                                        <Text style={[s.feeAmount, { color: "#4caf50" }]}>₦0</Text>
                                        <Text style={[s.feeNote, { color: C.muted }]}>Included in Tier</Text>
                                    </View>
                                    <Text style={[s.feeSub, { color: C.muted }]}>As a premium member, your booking curation fees are fully covered.</Text>
                                </View>
                            ) : (
                                <View style={[s.feeCard, { borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` }]}>
                                    <Text style={s.feeEyebrow}>COMMITMENT FEE</Text>
                                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                                        <Text style={s.feeAmount}>₦5,000</Text>
                                        <Text style={[s.feeNote, { color: C.muted }]}>per request</Text>
                                    </View>
                                    <Text style={[s.feeSub, { color: C.muted }]}>Charged to your payment method when reservations are confirmed. Cost of food and experiences are billed separately.</Text>
                                </View>
                            )}

                            {(!userTier || !["silver", "gold", "black"].includes(userTier.toLowerCase())) && (
                                <Text style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 8, marginBottom: 4 }}>
                                    Community Plan: This will use 1 of your 5 monthly concierge requests ({monthlyRequestsCount}/5 used this month).
                                </Text>
                            )}

                            {(!userTier || !["silver", "gold", "black"].includes(userTier.toLowerCase())) ? (
                                <PayWithFlutterwave
                                    options={{
                                        tx_ref: `CUR-${Date.now().toString(36).toUpperCase()}`,
                                        authorization: FLW_PUBLIC_KEY,
                                        customer: { email: userEmail || "member@lapeq.com", name: userName },
                                        amount: 5000,
                                        currency: "NGN",
                                        payment_options: "card,banktransfer,ussd",
                                        customization: {
                                            title: "Lapeq Curation Fee",
                                            description: "Venue booking · Concierge-managed",
                                            logo: "https://iwedpnipbuurohaqibag.supabase.co/storage/v1/object/public/avatars/lapeq-logo.png",
                                        },
                                    }}
                                    customButton={(props) => (
                                        <TouchableOpacity 
                                            style={[s.submitBtn, (requestLoading || props.disabled) && { opacity: 0.7 }]} 
                                            onPress={props.onPress} 
                                            disabled={requestLoading || props.disabled} 
                                            activeOpacity={0.85}
                                        >
                                            <Text style={s.submitText}>{requestLoading ? "Submitting..." : "Pay ₦5,000 & Confirm"}</Text>
                                            <ChevronRight size={16} color="#0a0a0a" />
                                        </TouchableOpacity>
                                    )}
                                    onRedirect={async (data) => {
                                        if (data.status === "successful" || data.status === "completed") {
                                            await handleSubmitRequest(true);
                                        } else {
                                            alert("Payment not successful. Please try again.");
                                        }
                                    }}
                                />
                            ) : (
                                <TouchableOpacity style={[s.submitBtn, requestLoading && { opacity: 0.7 }]} onPress={() => handleSubmitRequest(false)} disabled={requestLoading} activeOpacity={0.85}>
                                    <Text style={s.submitText}>{requestLoading ? "Submitting..." : "Confirm Request"}</Text>
                                    <ChevronRight size={16} color="#0a0a0a" />
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>

                    {Platform.OS === "android" && showDatePicker && (
                        <DateTimePicker value={requestDate ?? new Date()} mode="date" display="default" minimumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setRequestDate(d); }} />
                    )}
                    <Modal visible={Platform.OS === "ios" && showDatePicker} transparent animationType="slide">
                        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
                        <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                            <View style={s.pickerHeader}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                                <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Select Date</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                            </View>
                            <DateTimePicker value={requestDate ?? new Date()} mode="date" display="spinner" minimumDate={new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setRequestDate(d); }} />
                        </View>
                    </Modal>
                </KeyboardAvoidingView>
            </Modal>

            {/* Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 24 }}>
                    <Animated.View style={[s.successBox, { backgroundColor: C.surface, opacity: alertOpacity, transform: [{ scale: alertScale }], borderColor: C.border, borderWidth: 1 }]}>
                        <View style={[s.successIcon, { backgroundColor: `${GOLD}20` }]}>
                            <Check size={36} color={GOLD} strokeWidth={3} />
                        </View>
                        <Text style={[s.successTitle, { color: C.text }]}>Curation Requested</Text>
                        <Text style={[s.successBody, { color: C.muted }]}>
                            Your concierge is checking availability at this venue. We will confirm details and lock reservations shortly.
                        </Text>
                        <TouchableOpacity style={s.successBtn} onPress={() => { setShowSuccessModal(false); router.back(); }} activeOpacity={0.8}>
                            <Text style={s.successBtnText}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} />

            {/* Media Gallery Zoom Modal */}
            <Modal visible={selectedGalleryImage !== null} transparent animationType="fade" onRequestClose={() => setSelectedGalleryImage(null)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setSelectedGalleryImage(null)} />
                    <TouchableOpacity style={{ position: "absolute", top: 48, right: 24, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }} onPress={() => setSelectedGalleryImage(null)}>
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                    {selectedGalleryImage && (
                        <Image source={{ uri: selectedGalleryImage }} style={{ width: SW, height: SW * 1.3 }} resizeMode="contain" />
                    )}
                </View>
            </Modal>
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

        modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
        sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, maxHeight: "90%", paddingBottom: 30, position: "absolute", bottom: 0, left: 0, right: 0 },
        sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
        sheetHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
        sheetTag: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 6 },
        sheetTitle: { fontSize: 20, fontWeight: "700" },
        closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
        fieldLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 12, marginTop: 16 },
        stepperRow: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 4 },
        stepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
        stepVal: { fontSize: 24, fontWeight: "700", minWidth: 36, textAlign: "center" },
        dateBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 4 },
        feeCard: { marginTop: 20, padding: 16, borderRadius: 14, borderWidth: 1 },
        feeEyebrow: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 6 },
        feeAmount: { fontSize: 22, fontWeight: "800", color: GOLD },
        feeNote: { fontSize: 13, fontWeight: "600" },
        feeSub: { fontSize: 11, marginTop: 2, lineHeight: 16 },
        submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 17, marginTop: 16 },
        submitText: { color: "#0a0a0a", fontSize: 15, fontWeight: "800" },
        successBox: { borderRadius: 28, padding: 24, width: "100%", alignItems: "center", gap: 16 },
        successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 8 },
        successTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
        successBody: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 12 },
        successBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: GOLD, alignItems: "center" },
        successBtnText: { color: "#0a0a0a", fontSize: 15, fontWeight: "700" },
        pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, position: "absolute", bottom: 0, left: 0, right: 0 },
        pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },
    });
};
