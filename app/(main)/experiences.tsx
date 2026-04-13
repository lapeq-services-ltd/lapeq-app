import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ChevronLeft, Plus, MapPin, Calendar, ChevronRight, Clock } from "lucide-react-native";
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
    created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: "Received", color: "#f59e0b" },
    building: { label: "Being Crafted", color: "#3b82f6" },
    ready: { label: "Ready to View", color: "#10b981" },
    active: { label: "Active", color: "#10b981" },
    completed: { label: "Completed", color: "#6b7280" },
    cancelled: { label: "Cancelled", color: "#ef4444" },
};

const TYPE_LABELS: Record<string, string> = {
    leisure: "Leisure",
    business: "Business",
    romantic: "Romantic Getaway",
    cultural: "Cultural",
    adventure: "Adventure",
    custom: "Custom",
};

function formatDateRange(start: string | null, end: string | null) {
    if (!start) return "Dates TBD";
    const s = new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    if (!end) return s;
    const e = new Date(end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${s} – ${e}`;
}

export default function ExperiencesScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(useCallback(() => {
        load();
    }, []));

    const load = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase
            .from("packages")
            .select("id, title, city, start_date, end_date, type, status, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        setPackages(data ?? []);
        setLoading(false);
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>Experiences</Text>
                    <Text style={s.subtitle}>Curated itineraries, handled end to end</Text>
                </View>
                <TouchableOpacity style={s.newBtn} onPress={() => router.push("/services/request-package")}>
                    <Plus size={18} color="#0a0a0a" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator color={C.primary} /></View>
            ) : packages.length === 0 ? (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                    {/* Empty state — showcase */}
                    <View style={s.showcaseCard}>
                        <Image source={require("@/assets/images/lagos-rooftop.jpg")} style={s.showcaseImg} resizeMode="cover" />
                        <View style={s.showcaseOverlay} />
                        <View style={s.showcaseContent}>
                            <Text style={s.showcaseEyebrow}>HOW IT WORKS</Text>
                            <Text style={s.showcaseTitle}>Your Concierge Plans Everything</Text>
                            <Text style={s.showcaseBody}>
                                Tell us your city, dates, and what you're looking for. Your concierge builds a full day-by-day itinerary — hotels, dining, transport, experiences — and delivers it here.
                            </Text>
                        </View>
                    </View>

                    <View style={s.steps}>
                        {[
                            { n: "1", title: "You tell us the basics", desc: "City, dates, type of experience, and your preferences." },
                            { n: "2", title: "We build your itinerary", desc: "Your concierge researches and arranges every detail." },
                            { n: "3", title: "You receive your plan", desc: "Review your full day-by-day timetable and request any changes." },
                        ].map(step => (
                            <View key={step.n} style={s.step}>
                                <View style={s.stepNum}><Text style={s.stepNumText}>{step.n}</Text></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.stepTitle}>{step.title}</Text>
                                    <Text style={s.stepDesc}>{step.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={s.ctaBtn} onPress={() => router.push("/services/request-package")}>
                        <Text style={s.ctaBtnText}>Request Your First Package</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}>
                    {packages.map(pkg => {
                        const st = STATUS_CONFIG[pkg.status] ?? { label: pkg.status, color: C.muted };
                        return (
                            <TouchableOpacity
                                key={pkg.id}
                                style={s.pkgCard}
                                onPress={() => router.push({ pathname: "/(main)/package/[id]", params: { id: pkg.id } })}
                                activeOpacity={0.85}
                            >
                                <View style={s.pkgCardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.pkgCity}>{pkg.city}</Text>
                                        <Text style={s.pkgTitle}>{pkg.title ?? TYPE_LABELS[pkg.type] ?? "Custom Experience"}</Text>
                                    </View>
                                    <View style={[s.statusBadge, { backgroundColor: `${st.color}18` }]}>
                                        <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                                    </View>
                                </View>
                                <View style={s.pkgCardBottom}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Calendar size={13} color={C.muted} />
                                        <Text style={s.pkgMeta}>{formatDateRange(pkg.start_date, pkg.end_date)}</Text>
                                    </View>
                                    <ChevronRight size={16} color={C.muted} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity style={s.newPackageRow} onPress={() => router.push("/services/request-package")}>
                        <Plus size={16} color={C.primary} />
                        <Text style={s.newPackageText}>Request Another Package</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: "700", color: C.text },
    subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
    newBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },

    // Empty state
    showcaseCard: { height: 260, borderRadius: 20, overflow: "hidden", marginBottom: 28, position: "relative" },
    showcaseImg: { width: "100%", height: "100%", position: "absolute" },
    showcaseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    showcaseContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 24 },
    showcaseEyebrow: { fontSize: 9, fontWeight: "800", color: C.primary, letterSpacing: 2.5, marginBottom: 8 },
    showcaseTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 10, lineHeight: 28 },
    showcaseBody: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 21 },
    steps: { gap: 16, marginBottom: 32 },
    step: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
    stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    stepNumText: { fontSize: 14, fontWeight: "700", color: "#0a0a0a" },
    stepTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 4 },
    stepDesc: { fontSize: 13, color: C.muted, lineHeight: 20 },
    ctaBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    ctaBtnText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },

    // Package cards
    pkgCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    pkgCardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
    pkgCity: { fontSize: 11, fontWeight: "700", color: C.primary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
    pkgTitle: { fontSize: 17, fontWeight: "700", color: C.text },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
    statusText: { fontSize: 11, fontWeight: "700" },
    pkgCardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTopWidth: 1, borderTopColor: theme === "dark" ? "#2a2a2a" : "#e8e4dc" },
    pkgMeta: { fontSize: 13, color: C.muted },
    newPackageRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
    newPackageText: { fontSize: 14, fontWeight: "600", color: C.primary },
});
