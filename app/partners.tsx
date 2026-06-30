import { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Filter, ChevronDown, X, Check } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

const CITIES = ["All", "Abuja", "Lagos", "Port Harcourt", "Akwa Ibom", "Kano"];
const CATEGORIES = ["All", "Restaurant", "Lounge", "Hotel", "Spa", "Experience"];

export default function PartnersScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const [city, setCity] = useState("All");
    const [category, setCategory] = useState("All");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [tempCity, setTempCity] = useState("All");
    const [tempCategory, setTempCategory] = useState("All");
    const [dbVenues, setDbVenues] = useState<{ id: string; name: string; city: string }[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<any | null>(null);

    useEffect(() => {
        supabase
            .from("venues")
            .select("id, name, city")
            .eq("active", true)
            .is("deleted_at", null)
            .then(({ data }) => { if (data) setDbVenues(data); });

        supabase
            .from("content")
            .select("id, title, body, image_url, tag, city, category, venue_id, address, bullet_points, opening_hours")
            .eq("type", "partner")
            .eq("published", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (error) {
                    console.warn("Partners query failed, trying fallback without venue_id/address columns:", error.message);
                    supabase
                        .from("content")
                        .select("id, title, body, image_url, tag, city, category, bullet_points, opening_hours")
                        .eq("type", "partner")
                        .eq("published", true)
                        .is("deleted_at", null)
                        .order("created_at", { ascending: false })
                        .then(({ data: fallbackData, error: fallbackError }) => {
                            if (fallbackError) {
                                console.error("Fallback partners query failed:", fallbackError.message);
                            } else if (fallbackData) {
                                setPartners(fallbackData);
                            }
                        });
                } else if (data) {
                    setPartners(data);
                }
            });
    }, []);

    const getVenueIdForCard = (title: string, cityStr: string) => {
        const cleanedTitle = title.replace(/\s+restaurant/gi, "").replace(/\s+grill/gi, "").trim().toLowerCase();
        const lowerCity = (cityStr || "").toLowerCase();
        
        let matches = dbVenues.filter(v => {
            const vName = v.name.toLowerCase();
            return vName.includes(cleanedTitle) || cleanedTitle.includes(vName);
        });

        if (matches.length > 0) {
            const cityMatch = matches.find(v => lowerCity.includes(v.city.toLowerCase()));
            if (cityMatch) return cityMatch.id;
            return matches[0].id;
        }
        return null;
    };

    const openFilters = () => {
        setTempCity(city);
        setTempCategory(category);
        setShowFilterModal(true);
    };

    const applyFilters = () => {
        setCity(tempCity);
        setCategory(tempCategory);
        setShowFilterModal(false);
    };

    const filtered = partners.filter(p =>
        (city === "All" || p.city === city) &&
        (category === "All" || p.category === category)
    );

    return (
        <SafeAreaView style={s.root}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>Our Partners</Text>
                    <Text style={s.subtitle}>Exclusive benefits & privileges</Text>
                </View>
            </View>

            {/* Filter row */}
            <View style={s.filterRow}>
                <TouchableOpacity style={s.filterBtn} onPress={openFilters}>
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <Filter size={16} color={C.primary} style={{ marginRight: 8 }} />
                        <Text style={s.filterBtnText} numberOfLines={1}>
                            {city === "All" && category === "All"
                                ? "Filter Partners"
                                : `${city !== "All" ? city : "All Cities"} · ${category !== "All" ? category : "All Categories"}`}
                        </Text>
                    </View>
                    <ChevronDown size={14} color={C.muted} style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                {(city !== "All" || category !== "All") && (
                    <TouchableOpacity style={s.resetBtn} onPress={() => { setCity("All"); setCategory("All"); }}>
                        <Text style={s.resetBtnText}>Reset</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filters Modal */}
            <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
                <View style={s.modalOverlay}>
                    <TouchableOpacity style={s.modalDismiss} activeOpacity={1} onPress={() => setShowFilterModal(false)} />
                    <View style={s.modalContent}>
                        <View style={s.modalHandle} />
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Filters</Text>
                            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowFilterModal(false)}>
                                <X size={20} color={C.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ gap: 24, paddingBottom: 20 }}>
                            {/* Cities Section */}
                            <View>
                                <Text style={s.filterSectionTitle}>Select Location</Text>
                                <View style={s.filterPillGrid}>
                                    {CITIES.map(c => {
                                        const isAvailable = c === "All" || c === "Lagos" || c === "Abuja";
                                        const displayLabel = isAvailable ? c : `${c} (Soon)`;
                                        const active = tempCity === c;
                                        return (
                                            <TouchableOpacity
                                                key={c}
                                                disabled={!isAvailable}
                                                style={[
                                                    s.filterPill,
                                                    active && s.filterPillActive,
                                                    !isAvailable && s.filterPillDisabled
                                                ]}
                                                onPress={() => setTempCity(c)}
                                            >
                                                <Text style={[
                                                    s.filterPillText,
                                                    active && s.filterPillTextActive,
                                                    !isAvailable && s.filterPillTextDisabled
                                                ]}>
                                                    {displayLabel}
                                                </Text>
                                                {active && <Check size={12} color="#000" style={{ marginLeft: 4 }} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Categories Section */}
                            <View>
                                <Text style={s.filterSectionTitle}>Select Category</Text>
                                <View style={s.filterPillGrid}>
                                    {CATEGORIES.map(c => {
                                        const active = tempCategory === c;
                                        return (
                                            <TouchableOpacity
                                                key={c}
                                                style={[s.filterPill, active && s.filterPillActive]}
                                                onPress={() => setTempCategory(c)}
                                            >
                                                <Text style={[
                                                    s.filterPillText,
                                                    active && s.filterPillTextActive
                                                ]}>
                                                    {c}
                                                </Text>
                                                {active && <Check size={12} color="#000" style={{ marginLeft: 4 }} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={s.applyBtn} onPress={applyFilters}>
                            <Text style={s.applyBtnText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Partner Details Modal */}
            <Modal
                visible={selectedPartner !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedPartner(null)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 24 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setSelectedPartner(null)} />
                    <View style={{ width: "100%", maxWidth: 400, backgroundColor: C.surface, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", position: "relative" }}>
                        
                        {/* Close button at top-right */}
                        <TouchableOpacity 
                            style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
                            onPress={() => setSelectedPartner(null)}
                        >
                            <X size={16} color="#fff" />
                        </TouchableOpacity>

                        {selectedPartner?.image_url && (
                            <Image source={{ uri: selectedPartner.image_url }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
                        )}
                        <View style={{ padding: 20 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                <Text style={{ fontSize: 18, fontWeight: "700", color: C.text, flex: 1, marginRight: 8 }} numberOfLines={2}>
                                    {selectedPartner?.title}
                                </Text>
                                {selectedPartner?.category && (
                                    <Text style={{ fontSize: 11, fontWeight: "700", color: C.primary, textTransform: "uppercase" }}>
                                        {selectedPartner.category}
                                    </Text>
                                )}
                            </View>
                            
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                                {selectedPartner?.city && (
                                    <Text style={{ fontSize: 13, color: C.muted }}>
                                        📍 {selectedPartner.city} {selectedPartner.address ? `· ${selectedPartner.address}` : ''}
                                    </Text>
                                )}
                                {selectedPartner?.opening_hours && (
                                    <Text style={{ fontSize: 13, color: C.primary, fontWeight: "600" }}>
                                        🕒 {selectedPartner.opening_hours}
                                    </Text>
                                )}
                            </View>

                            <ScrollView style={{ maxHeight: 200, marginBottom: 20 }}>
                                <Text style={{ fontSize: 13, color: C.text, lineHeight: 22 }}>
                                    {selectedPartner?.body || "No additional partner details provided."}
                                </Text>

                                {selectedPartner?.bullet_points && (
                                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", paddingTop: 12 }}>
                                        {selectedPartner.bullet_points.split("\n").filter(b => b.trim() !== "").map((bullet, idx) => (
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
                                    const item = selectedPartner;
                                    setSelectedPartner(null);
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

            {/* List */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
                {filtered.length === 0 ? (
                    <View style={{ paddingTop: 60, alignItems: "center" }}>
                        <Text style={{ color: C.muted, fontSize: 15 }}>No partners for this filter yet.</Text>
                    </View>
                ) : filtered.map((partner, i) => {
                    const venueId = partner.venue_id || getVenueIdForCard(partner.title, partner.city || "");
                    return (
                        <TouchableOpacity
                            key={i}
                            style={s.card}
                            activeOpacity={0.88}
                            onPress={() => {
                                if (venueId) {
                                    router.push({
                                        pathname: "/explore/venue-detail",
                                        params: { id: venueId }
                                    });
                                } else {
                                    setSelectedPartner(partner);
                                }
                            }}
                        >
                            <Image
                                source={partner.image_url ? { uri: partner.image_url } : require("@/assets/images/lagos-rooftop.jpg")}
                                style={s.cardImg}
                                resizeMode="cover"
                            />
                            {partner.tag && (
                                <View style={s.cardBadge}>
                                    <Text style={s.cardBadgeText}>{partner.tag}</Text>
                                </View>
                            )}
                            <View style={s.cardBody}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                    <Text style={s.cardName}>{partner.title}</Text>
                                    <Text style={s.cardCategory}>{partner.category}</Text>
                                </View>
                                <Text style={s.cardCity}>{partner.city} {partner.address ? `· ${partner.address}` : ''}</Text>
                                <Text style={s.cardDesc} numberOfLines={3}>{partner.body}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: "700", color: C.text },
    subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
    card: { borderRadius: 20, overflow: "hidden", backgroundColor: C.surface, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    cardImg: { width: "100%", height: 180 },
    cardBadge: { position: "absolute", top: 14, left: 14, backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
    cardBadgeText: { fontSize: 11, fontWeight: "700", color: "#0a0a0a" },
    cardBody: { padding: 16 },
    cardName: { fontSize: 17, fontWeight: "700", color: C.text },
    cardCategory: { fontSize: 12, fontWeight: "600", color: C.primary },
    cardCity: { fontSize: 13, color: C.muted, marginBottom: 6 },
    cardDesc: { fontSize: 13, color: C.muted, lineHeight: 20 },

    filterRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 10,
    },
    filterBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flex: 1,
        justifyContent: "space-between",
    },
    filterBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: C.text,
        flex: 1,
    },
    resetBtn: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.2)",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    resetBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#ef4444",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    modalDismiss: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        backgroundColor: C.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 44 : 24,
        borderTopWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        maxHeight: "85%",
    },
    modalHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
        alignSelf: "center",
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: C.text,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: C.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    filterSectionTitle: {
        fontSize: 12,
        fontWeight: "800",
        color: C.muted,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 12,
    },
    filterPillGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    filterPill: {
        flexDirection: "row",
        alignItems: "center",
        height: 38,
        paddingHorizontal: 14,
        borderRadius: 19,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
    },
    filterPillActive: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    filterPillDisabled: {
        opacity: 0.4,
        backgroundColor: "rgba(0,0,0,0.05)",
    },
    filterPillText: {
        fontSize: 13,
        fontWeight: "600",
        color: C.muted,
    },
    filterPillTextActive: {
        color: "#000",
    },
    filterPillTextDisabled: {
        color: C.muted,
    },
    applyBtn: {
        backgroundColor: C.primary,
        borderRadius: 16,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
    },
    applyBtnText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#000",
    },
});
