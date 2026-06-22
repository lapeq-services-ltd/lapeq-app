import { useState, useEffect, useRef, useCallback } from "react";
import {
    View, Text, FlatList, TouchableOpacity, Dimensions,
    StyleSheet, Animated, Alert, Image, ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Lock, Check, Sparkles, ArrowRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

const { width: W } = Dimensions.get("window");

const CATEGORY_IMAGES: Record<string, any> = {
    "LIFESTYLE & GUIDES": require("@/assets/images/perks-lifestyle.png"),
    "TRAVEL & BOOKINGS": require("@/assets/images/perks-travel.png"),
    "RESERVATIONS": require("@/assets/images/perks-dining.png"),
    "CONCIERGE & SUPPORT": require("@/assets/images/exterior-luxury.jpg"),
    "TRAVEL & TRANSIT": require("@/assets/images/perks-travel.png"),
    "STAYS & DINING": require("@/assets/images/perks-dining.png"),
    "EVENTS & CURATION": require("@/assets/images/perks-events.png"),
    "LIFESTYLE SERVICES": require("@/assets/images/perks-lifestyle.png"),
    "EVENTS & NETWORKING": require("@/assets/images/perks-events.png"),
    "UNLIMITED SERVICES": require("@/assets/images/lagos-beach.jpg"),
};

const TIERS = [
    {
        id: "free",
        name: "Community",
        tagline: "Your starting point",
        bg: "#0e0c0a",
        accentBg: "#1a1612",
        accent: "#a0906a",
        glow: "#6b5a3a",
        invite: false,
        price: null,
        priceNote: null,
        includesNote: null,
        fomo: [
            "No rapid response concierge",
            "No errand management",
            "No airport coordination",
            "No access to sold-out event tickets",
            "No dedicated lifestyle support",
        ],
        categories: [
            {
                label: "Lifestyle & Guides",
                perks: [
                    "Monthly lifestyle digest",
                    "Curated monthly city guide",
                    "Access to Free Lapeq community Events"
                ]
            },
            {
                label: "Travel & Bookings",
                perks: [
                    "Limited curated itinerary planning",
                    "Apartment / Hotel booking support"
                ]
            },
            {
                label: "Reservations",
                perks: [
                    "Lounge, Restaurants, and clubs reservations (24hrs response time)",
                    "Access to car hire services (On Request)"
                ]
            }
        ],
        cta: "Upgrade to Silver",
    },
    {
        id: "silver",
        name: "Silver",
        tagline: "Essential access",
        bg: "#0a0c10",
        accentBg: "#10141c",
        accent: "#a8b8cc",
        glow: "#3a4a5a",
        invite: false,
        price: "₦850,000",
        priceNote: "3 months: ₦350,000 · 6 months: ₦500,000 · 1 year: ₦850,000",
        includesNote: null,
        categories: [
            {
                label: "Concierge & Support",
                perks: [
                    "Virtual concierge support",
                    "Rapid response time",
                    "Errand management",
                    "Lifestyle management support",
                    "Priority Access",
                    "Access to lapeq partner network"
                ]
            },
            {
                label: "Travel & Transit",
                perks: [
                    "Curated itinerary planning",
                    "Airport and Flight coordination",
                    "Discounted Airport pick-up or Drop-off",
                    "Access to car rental support service"
                ]
            },
            {
                label: "Stays & Dining",
                perks: [
                    "Access to luxury hotels and apartment bookings",
                    "Discounted meals at our partner restaurants"
                ]
            },
            {
                label: "Events & Curation",
                perks: [
                    "Access to premium lifestyle and professional events",
                    "Access to sold out event tickets",
                    "Tailored event curation at accessible pricing"
                ]
            },
            {
                label: "Lifestyle Services",
                perks: [
                    "Monthly Complimentary Experience",
                    "Relationship and Proposal Packages",
                    "Complimentary Luxury Photography Moment",
                    "Referral Reward",
                    "Access to curated grooming and personal care booking",
                    "Access to legal consultation",
                    "Access to Private Security Arrangement"
                ]
            }
        ],
        cta: "Get Silver",
    },
    {
        id: "gold",
        name: "Gold",
        tagline: "Enhanced privileges",
        bg: "#080806",
        accentBg: "#100e06",
        accent: "#c9a84c",
        glow: "#7a5a10",
        invite: false,
        price: "₦2,500,000",
        priceNote: "per year",
        includesNote: "Everything in Silver, plus:",
        categories: [
            {
                label: "Concierge & Support",
                perks: [
                    "Professional Dedicated concierge manager (9-6)",
                    "Priority fast track handling of all request",
                    "Diaspora support (Concierge manager)",
                    "Medical concierge /Specialist Access",
                    "Anniversary and Birthday Treatment",
                    "Luxury Cashback Credit"
                ]
            },
            {
                label: "Travel & Transit",
                perks: [
                    "Private jet access and bookings",
                    "Airport and flight coordination (with live updates)",
                    "Discounted Airport pick up and drop off",
                    "Access to luxury car hire support services",
                    "Access to private yacht and beach houses"
                ]
            },
            {
                label: "Stays & Dining",
                perks: [
                    "Last minute reservations",
                    "Discounted rates at partner restaurants, lounges and clubs"
                ]
            },
            {
                label: "Events & Networking",
                perks: [
                    "Exclusive Access to elite Fashion, Tech, energy and summit events",
                    "Elite Networking Access"
                ]
            },
            {
                label: "Lifestyle Services",
                perks: [
                    "Lapeq Privé",
                    "Monthly Complimentary Experience",
                    "Complimentary Monthly Gift",
                    "Vouchers",
                    "Relationship and proposal packages",
                    "Complimentary luxury photography moment",
                    "Referral Reward",
                    "Private Security Arrangement",
                    "Access to professional legal consultation",
                    "Investment advisorship",
                    "Luxury Emergency Assistance"
                ]
            }
        ],
        cta: "Get Gold",
    },
    {
        id: "black",
        name: "Black",
        tagline: "Access without limits",
        bg: "#000000",
        accentBg: "#080808",
        accent: "#e8e8e8",
        glow: "#282828",
        invite: true,
        price: "₦5,000,000",
        priceNote: "per year · strictly limited membership",
        includesNote: "Everything in Gold, plus:",
        categories: [
            {
                label: "Unlimited Services",
                perks: [
                    "Priority fast-track handling on all requests",
                    "Access to exquisite bookings and services",
                    "Seamless events coordination",
                    "Dedicated professional concierge manager (9am–6pm; extended hours attract additional fees)",
                    "Medical concierge — priority specialist access",
                    "Legal support / Consultation",
                    "Private Security Attached",
                    "Airport and flight coordination",
                    "Investment advisorship introductions",
                    "Elite Networking Access",
                    "Access to VIP fashion events and summits",
                    "Project Supervision (weekly construction oversight verification)"
                ]
            }
        ],
        cta: "Request Invitation",
    },
];

const TIER_INDEX: Record<string, number> = { free: 0, silver: 1, gold: 2, black: 3 };
const PREVIEW_COUNT = 4;

function TierPage({ tier, isOwned, userName, memberSince, cardRequested, cardLoading, onRequestCard, onUpgrade, onJoin, insets }: any) {
    const isFree = tier.id === "free";

    return (
        <ScrollView
            style={[s.page, { width: W, backgroundColor: tier.bg }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
        >
            <View style={[s.orb1, { backgroundColor: tier.glow }]} />
            <View style={[s.orb2, { backgroundColor: tier.glow }]} />
            <Text style={[s.watermark, { color: tier.accent }]}>{tier.name.toUpperCase()}</Text>

            {/* Logo + badge */}
            <View style={s.topRow}>
                <Image
                    source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                    style={[s.logo, { tintColor: tier.accent }]}
                    resizeMode="contain"
                />
                <View style={s.badgesRow}>
                    {isOwned && (
                        <View style={[s.badge, { borderColor: tier.accent, backgroundColor: `${tier.accent}18` }]}>
                            <Sparkles size={10} color={tier.accent} />
                            <Text style={[s.badgeText, { color: tier.accent }]}>YOUR PLAN</Text>
                        </View>
                    )}
                    {tier.invite && !isOwned && (
                        <View style={[s.badge, { borderColor: tier.accent }]}>
                            <Lock size={10} color={tier.accent} />
                            <Text style={[s.badgeText, { color: tier.accent }]}>INVITE ONLY</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Name */}
            <View style={s.nameSection}>
                <Text style={[s.tierName, { color: "#fff" }]}>{tier.name}</Text>
                <Text style={[s.tagline, { color: tier.accent, opacity: 0.7 }]}>{tier.tagline.toUpperCase()}</Text>
            </View>

            {/* Price */}
            {tier.price && (
                <View style={s.priceBlock}>
                    <Text style={[s.priceAmount, { color: tier.accent }]}>{tier.price}</Text>
                    <Text style={[s.priceNoteText, { color: "rgba(255,255,255,0.32)" }]}>{tier.priceNote}</Text>
                </View>
            )}

            <View style={[s.divider, { backgroundColor: tier.accent, opacity: 0.2 }]} />

            {/* Includes note for Gold / Black */}
            {tier.includesNote && (
                <View style={[s.includesBar, { backgroundColor: `${tier.accent}12`, borderColor: `${tier.accent}22` }]}>
                    <Check size={11} color={tier.accent} strokeWidth={2.5} />
                    <Text style={[s.includesText, { color: `${tier.accent}CC` }]}>{tier.includesNote}</Text>
                </View>
            )}

            {/* FOMO */}
            {isFree && (
                <View style={s.fomoSection}>
                    <Text style={[s.sectionLabel, { color: "rgba(255,255,255,0.3)" }]}>WITHOUT AN UPGRADE, YOU MISS:</Text>
                    {(tier.fomo ?? []).map((item: string, i: number) => (
                        <View key={i} style={s.fomoRow}>
                            <Text style={s.fomoX}>✕</Text>
                            <Text style={s.fomoText}>{item}</Text>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={[s.fomoNudge, { borderColor: `${tier.accent}40`, backgroundColor: `${tier.accent}10` }]}
                        onPress={onUpgrade}
                    >
                        <Text style={[s.fomoNudgeText, { color: tier.accent }]}>See what Silver unlocks</Text>
                        <ArrowRight size={14} color={tier.accent} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Perks Grouped by Category */}
            <View style={s.perksSection}>
                <Text style={[s.sectionLabel, { color: "rgba(255,255,255,0.3)", marginBottom: 16 }]}>WHAT YOU GET</Text>
                {tier.categories.map((cat: any, idx: number) => {
                    const img = CATEGORY_IMAGES[cat.label.toUpperCase()] ?? require("@/assets/images/lagos-hotel.jpg");
                    return (
                        <View key={idx} style={s.categoryCard}>
                            <Image source={img} style={s.categoryCardImg} resizeMode="cover" />
                            <View style={s.categoryCardOverlay} />
                            <View style={s.categoryCardContent}>
                                <Text style={[s.categoryCardTitle, { color: tier.accent }]}>{cat.label}</Text>
                                <View style={s.categoryPerksList}>
                                    {cat.perks.map((perk: string, pIdx: number) => (
                                        <View key={pIdx} style={s.categoryPerkRow}>
                                            <View style={[s.categoryPerkCheck, { backgroundColor: `${tier.accent}24` }]}>
                                                <Check size={10} color={tier.accent} strokeWidth={3} />
                                            </View>
                                            <Text style={s.categoryPerkText}>{perk}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Member card */}
            {isOwned && (
                <View style={[s.miniCard, { backgroundColor: tier.accentBg, borderColor: `${tier.accent}40` }]}>
                    <View>
                        <Text style={[s.miniCardLabel, { color: tier.accent, opacity: 0.5 }]}>LAPEQ {tier.name.toUpperCase()}</Text>
                        <Text style={[s.miniCardName, { color: "#fff" }]}>{userName}</Text>
                        <Text style={[s.miniCardSince, { color: tier.accent, opacity: 0.45 }]}>Member since {memberSince || "2025"}</Text>
                    </View>
                    <Image
                        source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                        style={{ width: 36, height: 36, opacity: 0.6 }}
                        resizeMode="contain"
                    />
                </View>
            )}

            {/* CTA */}
            {isOwned ? (
                <TouchableOpacity
                    style={[s.cta, { backgroundColor: tier.accent, opacity: cardRequested || cardLoading ? 0.6 : 1 }]}
                    onPress={onRequestCard}
                    disabled={cardRequested || cardLoading}
                    activeOpacity={0.85}
                >
                    <Text style={s.ctaText}>
                        {cardLoading ? "Submitting..." : cardRequested ? "Card Requested ✓" : "Request Physical Card"}
                    </Text>
                </TouchableOpacity>
            ) : isFree ? (
                <TouchableOpacity style={[s.cta, { backgroundColor: tier.accent }]} activeOpacity={0.85} onPress={onUpgrade}>
                    <Text style={s.ctaText}>Upgrade to Silver →</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={[s.cta, { backgroundColor: tier.accent }]} activeOpacity={0.85} onPress={onJoin}>
                    <Text style={s.ctaText}>{tier.cta}</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

export default function MembershipScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const listRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const [userName, setUserName] = useState("");
    const [userTier, setUserTier] = useState("free");
    const [memberSince, setMemberSince] = useState("");
    const [activeIndex, setActiveIndex] = useState(1); // Default to Silver
    const [cardRequested, setCardRequested] = useState(false);
    const [cardLoading, setCardLoading] = useState(false);

    const currentTier = TIERS[activeIndex];

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, preferred_name, tier, created_at")
                .eq("id", user.id)
                .single();
            setUserName(profile?.full_name || profile?.preferred_name || user.email?.split("@")[0] || "Member");
            const tier = profile?.tier ?? "free";
            setUserTier(tier);
            const since = profile?.created_at ?? user.created_at;
            if (since) setMemberSince(new Date(since).getFullYear().toString());
            const idx = TIER_INDEX[tier] ?? 1;
            setActiveIndex(idx);
            setTimeout(() => {
                listRef.current?.scrollToIndex({ index: idx, animated: false });
            }, 100);
        });
    }, []);

    const handleRequestCard = async () => {
        setCardLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setCardLoading(false); return; }
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user.id,
            reference: ref,
            service_type: "card-delivery",
            status: "pending",
            notes: `Physical LAPEQ card delivery for ${userName} - ${currentTier.name} tier.`,
        });
        setCardLoading(false);
        if (error) { Alert.alert("Error", error.message); return; }
        setCardRequested(true);
        Alert.alert("Request Sent", "Your physical card request has been received.");
    };

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
    }, []);

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
    const isUserTier = (tier: typeof TIERS[0]) => tier.id === userTier;

    const renderPage = ({ item: tier }: { item: typeof TIERS[0] }) => (
        <TierPage
            tier={tier}
            isOwned={isUserTier(tier)}
            userName={userName}
            memberSince={memberSince}
            cardRequested={cardRequested}
            cardLoading={cardLoading}
            onRequestCard={handleRequestCard}
            onUpgrade={() => listRef.current?.scrollToIndex({ index: 1, animated: true })}
            onJoin={() => router.push({ pathname: "/join/request", params: { tier: tier.id } })}
            insets={insets}
        />
    );

    return (
        <View style={[s.root, { backgroundColor: currentTier.bg }]}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <View style={s.header}>
                    <TouchableOpacity style={[s.backBtn, { backgroundColor: "rgba(255,255,255,0.08)" }]} onPress={() => router.back()}>
                        <ChevronLeft size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Membership</Text>
                    <View style={{ width: 44 }} />
                </View>

                <Animated.FlatList
                    ref={listRef}
                    data={TIERS}
                    keyExtractor={t => t.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    renderItem={renderPage}
                    getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
                    initialScrollIndex={1}
                />

                <View style={s.dots}>
                    {TIERS.map((tier, i) => (
                        <TouchableOpacity
                            key={tier.id}
                            onPress={() => listRef.current?.scrollToIndex({ index: i, animated: true })}
                        >
                            <View style={[
                                s.dot,
                                { backgroundColor: i === activeIndex ? currentTier.accent : "rgba(255,255,255,0.18)" },
                                i === activeIndex && { width: 24 },
                            ]} />
                        </TouchableOpacity>
                    ))}
                </View>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },

    page: { flex: 1, paddingHorizontal: 26, paddingTop: 16 },
    orb1: { position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: 120, opacity: 0.25 },
    orb2: { position: "absolute", bottom: 100, left: -60, width: 180, height: 180, borderRadius: 90, opacity: 0.15 },
    watermark: { position: "absolute", fontSize: 110, fontWeight: "900", opacity: 0.04, right: -10, top: "20%", letterSpacing: -4 },

    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
    logo: { width: 38, height: 38, opacity: 0.85 },
    badgesRow: { flexDirection: "row", gap: 8 },
    badge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    badgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },

    nameSection: { marginBottom: 20 },
    tierName: { fontSize: 56, fontWeight: "800", letterSpacing: -2, lineHeight: 58, marginBottom: 6 },
    tagline: { fontSize: 10, fontWeight: "700", letterSpacing: 3 },

    divider: { height: 1, marginBottom: 28 },

    sectionLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 2, marginBottom: 14 },

    fomoSection: { marginBottom: 28 },
    fomoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
    fomoX: { color: "rgba(255,255,255,0.22)", fontSize: 13, fontWeight: "700", width: 16 },
    fomoText: { color: "rgba(255,255,255,0.38)", fontSize: 14, lineHeight: 20 },
    fomoNudge: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, borderWidth: 1, borderRadius: 14, padding: 14 },
    fomoNudgeText: { fontSize: 13, fontWeight: "600" },

    perksSection: { marginBottom: 28 },
    categoryCard: {
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        backgroundColor: "#121212",
        minHeight: 100,
    },
    categoryCardImg: {
        ...StyleSheet.absoluteFillObject as any,
        width: "100%",
        height: "100%",
    },
    categoryCardOverlay: {
        ...StyleSheet.absoluteFillObject as any,
        backgroundColor: "rgba(0,0,0,0.78)",
    },
    categoryCardContent: {
        padding: 20,
    },
    categoryCardTitle: {
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: 2,
        marginBottom: 14,
        textTransform: "uppercase",
    },
    categoryPerksList: {
        gap: 10,
    },
    categoryPerkRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    categoryPerkCheck: {
        width: 18,
        height: 18,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 1,
    },
    categoryPerkText: {
        fontSize: 13.5,
        color: "rgba(255,255,255,0.85)",
        lineHeight: 19,
        flex: 1,
    },

    miniCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1 },
    miniCardLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 2, marginBottom: 4 },
    miniCardName: { fontSize: 17, fontWeight: "700", marginBottom: 3 },
    miniCardSince: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },

    cta: { borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    ctaText: { fontSize: 15, fontWeight: "800", color: "#0a0a0a", letterSpacing: 0.3 },

    dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingVertical: 16 },
    dot: { height: 6, width: 6, borderRadius: 3 },

    priceBlock: { marginBottom: 20 },
    priceAmount: { fontSize: 34, fontWeight: "800", letterSpacing: -1 },
    priceNoteText: { fontSize: 11, fontWeight: "500", marginTop: 5, letterSpacing: 0.2 },
    includesBar: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 24 },
    includesText: { fontSize: 12, fontWeight: "600" },
});
