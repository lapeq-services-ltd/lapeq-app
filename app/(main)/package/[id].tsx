import { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Crown, Calendar, MessageCircle } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

const { width: W } = Dimensions.get("window");

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
    activities: string[] | null;
};

const GOLD = "#c9a84c";


const STATUS_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
    pending: {
        label: "Request Received",
        color: "#f59e0b",
        desc: "Your request has been received and assigned to your concierge. You will be notified as soon as your itinerary is being crafted.",
    },
    building: {
        label: "Being Crafted",
        color: "#3b82f6",
        desc: "Your concierge is actively researching and arranging every detail of your experience - hotels, dining, transport, and activities.",
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


export default function PackageDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [pkg, setPkg] = useState<Package | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            const [{ data: reqData }, { data: itineraryNotifs }] = await Promise.all([
                supabase.from("requests").select("*").eq("id", id).single(),
                supabase.from("notifications")
                    .select("id, data")
                    .eq("type", "itinerary")
                    .filter("data->>requestId", "eq", id)
                    .order("created_at", { ascending: false })
                    .limit(1)
            ]);
            if (reqData) {
                const d = (reqData.details as any) ?? {};
                setPkg({
                    id: reqData.id,
                    title: reqData.title,
                    city: d.city ?? "—",
                    start_date: d.start_date ?? null,
                    end_date: d.end_date ?? null,
                    type: d.type ?? "custom",
                    status: reqData.status,
                    budget_range: d.budget_range ?? null,
                    notes: d.notes ?? null,
                    activities: d.activities ?? null,
                });
            }
            if (itineraryNotifs && itineraryNotifs.length > 0) {
                router.replace({ pathname: "/itinerary-view", params: { notifId: itineraryNotifs[0].id } } as any);
                return;
            }
            setLoading(false);
        })();
    }, [id]);

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

                {/* Empty state — waiting for itinerary */}
                <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 32 }}>
                    <Image
                        source={require("@/assets/emptystate/itenaryotw.png")}
                        style={{ width: W * 0.72, height: W * 0.72 }}
                        resizeMode="contain"
                    />
                    <Text style={{ fontSize: 20, fontWeight: "700", color: C.text, textAlign: "center", marginTop: 4 }}>
                        Your itinerary is on its way
                    </Text>
                    <Text style={{ fontSize: 14, color: C.muted, textAlign: "center", marginTop: 8, lineHeight: 22, paddingHorizontal: 24 }}>
                        Your concierge is curating every detail. You'll get a notification when it's ready.
                    </Text>
                </View>

                {/* Concierge note */}
                <View style={s.conciergeCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <Crown size={18} color={C.primary} />
                        <Text style={s.conciergeCardTitle}>Your Concierge Is Available</Text>
                    </View>
                    <Text style={s.conciergeCardBody}>
                        Need to adjust dates, swap a venue, or add something new? Your concierge handles everything - just send a message.
                    </Text>
                </View>

                <TouchableOpacity style={s.messageBtn} onPress={() => router.push({ pathname: "/chat", params: { mode: "concierge", packageId: pkg.id } })} activeOpacity={0.85}>
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

    conciergeCard: { borderRadius: 20, backgroundColor: theme === "dark" ? "#1a1a1a" : "#1a1a1a", padding: 20, marginBottom: 16 },
    conciergeCardTitle: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
    conciergeCardBody: { fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 21 },

    messageBtn: { borderRadius: 16, paddingVertical: 18, backgroundColor: C.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    messageBtnText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },
});
