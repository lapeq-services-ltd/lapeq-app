import { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Crown, Clock, MapPin, Car, Calendar, MessageCircle, Coffee, Star, CheckCircle2 } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

type Package = {
    id: string;
    title: string | null;
    city: string;
    start_date: string | null;
    end_date: string | null;
    type: string;
    status: string;
    budget_range: string | null;
    notes: string | null;
};

type PackageItem = {
    id: string;
    day_number: number;
    day_label: string | null;
    time_slot: string | null;
    title: string;
    description: string | null;
    category: string | null;
    is_vip: boolean;
    tag: string | null;
    sort_order: number;
};

type DayGroup = {
    day_number: number;
    day_label: string | null;
    items: PackageItem[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
    pending: {
        label: "Request Received",
        color: "#f59e0b",
        desc: "Your request has been received and assigned to your concierge. You will be notified as soon as your itinerary is being crafted.",
    },
    building: {
        label: "Being Crafted",
        color: "#3b82f6",
        desc: "Your concierge is actively researching and arranging every detail of your experience — hotels, dining, transport, and activities.",
    },
    ready: {
        label: "Ready to View",
        color: "#10b981",
        desc: "Your itinerary is complete. Review each day below and message your concierge with any changes.",
    },
    active: {
        label: "Active",
        color: "#10b981",
        desc: "Your experience is underway. Enjoy every moment. Your concierge is available 24/7.",
    },
    completed: {
        label: "Completed",
        color: "#6b7280",
        desc: "This experience has been completed. We hope it was extraordinary.",
    },
    cancelled: {
        label: "Cancelled",
        color: "#ef4444",
        desc: "This package has been cancelled. Contact your concierge if you have questions.",
    },
};

const TYPE_LABELS: Record<string, string> = {
    leisure: "Leisure",
    business: "Business",
    romantic: "Romantic Getaway",
    cultural: "Cultural",
    adventure: "Adventure",
    custom: "Custom",
};

function formatDate(d: string | null) {
    if (!d) return "TBD";
    return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function getCategoryIcon(category: string | null, color: string) {
    switch (category) {
        case "dining": return <Coffee size={18} color={color} />;
        case "transport": return <Car size={18} color={color} />;
        case "activity": return <Star size={18} color={color} />;
        default: return <MapPin size={18} color={color} />;
    }
}

export default function PackageDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [pkg, setPkg] = useState<Package | null>(null);
    const [items, setItems] = useState<PackageItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            const [{ data: pkgData }, { data: itemsData }] = await Promise.all([
                supabase.from("packages").select("*").eq("id", id).single(),
                supabase.from("package_items").select("*").eq("package_id", id).order("day_number").order("sort_order"),
            ]);
            setPkg(pkgData ?? null);
            setItems(itemsData ?? []);
            setLoading(false);
        })();
    }, [id]);

    const days = useMemo<DayGroup[]>(() => {
        const map: Record<number, DayGroup> = {};
        for (const item of items) {
            if (!map[item.day_number]) {
                map[item.day_number] = { day_number: item.day_number, day_label: item.day_label, items: [] };
            }
            map[item.day_number].items.push(item);
        }
        return Object.values(map).sort((a, b) => a.day_number - b.day_number);
    }, [items]);

    if (loading) {
        return (
            <SafeAreaView style={s.root}>
                <View style={s.center}><ActivityIndicator color={C.primary} /></View>
            </SafeAreaView>
        );
    }

    if (!pkg) {
        return (
            <SafeAreaView style={s.root}>
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={C.text} />
                    </TouchableOpacity>
                </View>
                <View style={s.center}>
                    <Text style={{ color: C.muted, fontSize: 15 }}>Package not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const st = STATUS_CONFIG[pkg.status] ?? { label: pkg.status, color: C.muted, desc: "" };
    const isCrafting = ["pending", "building"].includes(pkg.status);
    const hasItinerary = days.length > 0;

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.cityLabel}>{pkg.city.toUpperCase()}</Text>
                    <Text style={s.headerTitle}>{pkg.title ?? TYPE_LABELS[pkg.type] ?? "Custom Experience"}</Text>
                </View>
                <View style={[s.statusPill, { backgroundColor: `${st.color}18` }]}>
                    <Text style={[s.statusPillText, { color: st.color }]}>{st.label}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}>

                {/* Meta row */}
                <View style={s.metaRow}>
                    <View style={s.metaItem}>
                        <Calendar size={14} color={C.muted} />
                        <Text style={s.metaText}>{formatDate(pkg.start_date)}</Text>
                    </View>
                    {pkg.end_date && (
                        <View style={s.metaItem}>
                            <Calendar size={14} color={C.muted} />
                            <Text style={s.metaText}>{formatDate(pkg.end_date)}</Text>
                        </View>
                    )}
                    <View style={s.metaItem}>
                        <Crown size={14} color={C.primary} />
                        <Text style={[s.metaText, { color: C.primary }]}>{TYPE_LABELS[pkg.type] ?? "Custom"}</Text>
                    </View>
                </View>

                {/* Status card */}
                <View style={[s.statusCard, { borderLeftColor: st.color }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <View style={[s.statusDot, { backgroundColor: st.color }]} />
                        <Text style={[s.statusCardLabel, { color: st.color }]}>{st.label}</Text>
                    </View>
                    <Text style={s.statusCardDesc}>{st.desc}</Text>
                </View>

                {/* Crafting state */}
                {isCrafting && (
                    <>
                        <View style={s.craftingSection}>
                            <Text style={s.craftingTitle}>What We're Arranging</Text>
                            {[
                                { icon: <MapPin size={16} color={C.primary} />, label: "Accommodation in " + pkg.city },
                                { icon: <Coffee size={16} color={C.primary} />, label: "Dining reservations" },
                                { icon: <Car size={16} color={C.primary} />, label: "Private transport" },
                                { icon: <Star size={16} color={C.primary} />, label: "Curated activities & experiences" },
                            ].map((row, i) => (
                                <View key={i} style={s.craftingRow}>
                                    <View style={s.craftingIconWrap}>{row.icon}</View>
                                    <Text style={s.craftingRowText}>{row.label}</Text>
                                </View>
                            ))}
                        </View>

                        {pkg.notes ? (
                            <View style={s.notesCard}>
                                <Text style={s.notesLabel}>YOUR BRIEF</Text>
                                <Text style={s.notesText}>{pkg.notes}</Text>
                            </View>
                        ) : null}
                    </>
                )}

                {/* Ready/active: day-by-day itinerary */}
                {!isCrafting && hasItinerary && days.map((day) => (
                    <View key={day.day_number} style={{ marginBottom: 24 }}>
                        <View style={s.dayHeader}>
                            <View style={s.dayBadge}>
                                <Text style={s.dayBadgeNum}>{day.day_number}</Text>
                            </View>
                            <Text style={s.dayTitle}>{day.day_label ?? `Day ${day.day_number}`}</Text>
                        </View>

                        <View style={s.timeline}>
                            {day.items.map((item) => (
                                <View key={item.id} style={[s.timelineItem, item.is_vip && s.timelineItemVip]}>
                                    <View style={s.timelineItemTop}>
                                        <View style={s.timelineIconWrap}>
                                            {getCategoryIcon(item.category, item.is_vip ? C.primary : C.muted)}
                                        </View>
                                        <Text style={s.itemTitle} numberOfLines={2}>{item.title}</Text>
                                        {item.is_vip && (
                                            <View style={s.vipBadge}>
                                                <Crown size={10} color={C.primary} />
                                                <Text style={s.vipBadgeText}>VIP</Text>
                                            </View>
                                        )}
                                    </View>
                                    {item.time_slot && (
                                        <View style={s.timeRow}>
                                            <Clock size={12} color={C.muted} />
                                            <Text style={s.itemTime}>{item.time_slot}</Text>
                                        </View>
                                    )}
                                    {item.description ? (
                                        <Text style={s.itemDesc}>{item.description}</Text>
                                    ) : null}
                                    {item.tag ? (
                                        <View style={s.tagBadge}>
                                            <Text style={s.tagBadgeText}>{item.tag}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Empty itinerary when ready but no items yet */}
                {!isCrafting && !hasItinerary && (
                    <View style={s.emptyItinerary}>
                        <CheckCircle2 size={32} color={C.primary} />
                        <Text style={s.emptyItineraryTitle}>Itinerary Ready</Text>
                        <Text style={s.emptyItineraryDesc}>Your concierge is finalising the details. Check back shortly or send a message.</Text>
                    </View>
                )}

                {/* Concierge note */}
                <View style={s.conciergeCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <Crown size={18} color={C.primary} />
                        <Text style={s.conciergeCardTitle}>Your Concierge Is Available</Text>
                    </View>
                    <Text style={s.conciergeCardBody}>
                        Need to adjust dates, swap a venue, or add something new? Your concierge handles everything — just send a message.
                    </Text>
                </View>

                <TouchableOpacity style={s.messageBtn} onPress={() => router.push("/chat")} activeOpacity={0.85}>
                    <MessageCircle size={20} color="#0a0a0a" />
                    <Text style={s.messageBtnText}>Message My Concierge</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    cityLabel: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2, marginBottom: 2 },
    headerTitle: { fontSize: 20, fontWeight: "700", color: C.text },
    statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
    statusPillText: { fontSize: 11, fontWeight: "700" },

    metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaText: { fontSize: 13, color: C.muted },

    statusCard: { borderRadius: 14, backgroundColor: C.surface, padding: 16, marginBottom: 24, borderLeftWidth: 3, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusCardLabel: { fontSize: 13, fontWeight: "700" },
    statusCardDesc: { fontSize: 14, color: C.muted, lineHeight: 21 },

    craftingSection: { marginBottom: 20 },
    craftingTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 14, letterSpacing: 0.2 },
    craftingRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    craftingIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: `${C.primary}15`, alignItems: "center", justifyContent: "center" },
    craftingRowText: { fontSize: 14, color: C.text, fontWeight: "500" },

    notesCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    notesLabel: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2, marginBottom: 8 },
    notesText: { fontSize: 14, color: C.muted, lineHeight: 22 },

    dayHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
    dayBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
    dayBadgeNum: { fontSize: 14, fontWeight: "700", color: "#0a0a0a" },
    dayTitle: { fontSize: 18, fontWeight: "700", color: C.text },

    timeline: { marginLeft: 16, paddingLeft: 20, borderLeftWidth: 2, borderLeftColor: `${C.primary}33`, gap: 14 },
    timelineItem: { borderRadius: 16, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", backgroundColor: C.surface, padding: 14 },
    timelineItemVip: { borderColor: `${C.primary}4d`, backgroundColor: `${C.primary}0d` },
    timelineItemTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
    timelineIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: theme === "dark" ? "#2a2a2a" : "#f0ece4", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    itemTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: C.text, lineHeight: 21 },
    vipBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: `${C.primary}18` },
    vipBadgeText: { fontSize: 10, fontWeight: "800", color: C.primary },
    timeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    itemTime: { fontSize: 12, color: C.muted, fontWeight: "500" },
    itemDesc: { fontSize: 13, color: C.muted, lineHeight: 20 },
    tagBadge: { marginTop: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: `${C.primary}18`, alignSelf: "flex-start" },
    tagBadgeText: { fontSize: 11, fontWeight: "600", color: C.primary },

    emptyItinerary: { alignItems: "center", padding: 32, gap: 12 },
    emptyItineraryTitle: { fontSize: 18, fontWeight: "700", color: C.text },
    emptyItineraryDesc: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22 },

    conciergeCard: { borderRadius: 20, backgroundColor: theme === "dark" ? "#1a1a1a" : "#1a1a1a", padding: 20, marginBottom: 16 },
    conciergeCardTitle: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
    conciergeCardBody: { fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 21 },

    messageBtn: { borderRadius: 16, paddingVertical: 18, backgroundColor: C.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    messageBtnText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },
});
