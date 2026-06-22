import { useState, useMemo, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ChevronLeft, Plus, Calendar, ChevronRight, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a84c";

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
    pending:   { label: "Received",      color: "#f59e0b" },
    building:  { label: "Being Crafted", color: "#3b82f6" },
    ready:     { label: "Ready to View", color: "#10b981" },
    active:    { label: "Active",        color: "#10b981" },
    completed: { label: "Completed",     color: "#6b7280" },
    cancelled: { label: "Cancelled",     color: "#ef4444" },
};

const TYPE_LABELS: Record<string, string> = {
    leisure:  "Leisure",
    business: "Business",
    romantic: "Romantic Getaway",
    cultural: "Cultural",
    adventure:"Adventure",
    custom:   "Custom",
};

function formatDateRange(start: string | null, end: string | null) {
    if (!start) return "Dates TBD";
    const s = new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    if (!end) return s;
    const e = new Date(end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${s} – ${e}`;
}

// ─── Day Itinerary data ───────────────────────────────────────────────────────
const ITINERARY = {
    weekday: [
        {
            time: "7:00 AM – 9:30 AM", label: "Morning",
            items: ["Weather and traffic update provided", "Daily briefing sent via email", "Breakfast — preferred meal, dietary requirements in place", "Morning news & business updates", "Personal trainer session", "Gym workout", "Yoga / stretching exercises"],
        },
        {
            time: "10:00 AM – 12:00 PM", label: "Mid-Morning",
            items: ["Brunch — preferred meal selection", "Executive meetings", "Corporate visits", "Investor meetings", "Conference attendance", "Coffee shop"],
        },
        {
            time: "12:00 PM – 4:00 PM", label: "Afternoon",
            items: ["Lunch", "Shopping", "Site inspections", "Business appointments", "Executive lounge access"],
        },
        {
            time: "4:00 PM – 6:00 PM", label: "Leisure",
            items: ["Golf / tennis / padel session", "Spa treatment / wellness retreat", "Scenic lakeside walk / city sightseeing", "Networking events", "Swimming"],
        },
        {
            time: "6:00 PM – 8:00 PM", label: "Early Evening",
            items: ["Fine dining / private dinner reservations", "Salsa / Kizomba dance class", "Premium champagne / mocktail service", "Private / public cinema viewing"],
        },
        {
            time: "8:00 PM – 10:00 PM", label: "Evening",
            items: ["Concerts / shows", "Theatre performances", "Pubs / lounges", "Private social events", "Private karaoke session", "Chauffeur arranged", "Daily activity summary"],
        },
    ],
    weekend: [
        {
            time: "6:00 AM – 9:00 AM", label: "Early Morning",
            items: ["Pilates / gym / personal training sessions", "Swimming", "Schedule laundry appointments", "Salon appointments"],
        },
        {
            time: "9:00 AM – 12:00 PM", label: "Morning",
            items: ["Family getaway at a resort", "Brunch reservations", "Recreational parks", "Spa and wellness treatments", "Community events & fairs"],
        },
        {
            time: "12:00 PM – 4:00 PM", label: "Afternoon",
            items: ["In-house culinary chef experience", "Coffee shop", "Shopping", "Personal errands", "Family / personal art experience (sip & paint, pottery etc.)", "Picnic", "Horse riding", "Boat cruise"],
        },
        {
            time: "4:00 PM – 6:00 PM", label: "Late Afternoon",
            items: ["Outdoor hangout scenery", "Indoor / outdoor gaming", "Sport events", "Personal / family photoshoots", "Arcade"],
        },
        {
            time: "6:00 PM – 9:00 PM", label: "Evening",
            items: ["Live band events", "Karaoke", "Outdoor dining reservations", "Salsa / Kizomba classes", "Private barbecue experience"],
        },
        {
            time: "9:00 PM – 12:00 AM", label: "Late Night",
            items: ["Lounges / pubs", "Outdoor movie screening", "Clubbing", "Exclusive rooftop events"],
        },
    ],
};

// ─── Itinerary modal ──────────────────────────────────────────────────────────
function ItineraryModal({ visible, onClose, C, theme }: { visible: boolean; onClose: () => void; C: any; theme: string }) {
    const [tab, setTab] = useState<"weekday" | "weekend">("weekday");
    const isDark = theme === "dark";
    const surface = isDark ? "#111" : "#fff";
    const border  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const blocks  = ITINERARY[tab];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: isDark ? "#080808" : "#f2ede5" }}>
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: border }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2.5 }}>LAPEQ PREMIUM CONCIERGE</Text>
                        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>Daily Itinerary</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: isDark ? "#1a1a1a" : "#e8e2d8", alignItems: "center", justifyContent: "center" }}>
                        <X size={16} color={C.muted} />
                    </TouchableOpacity>
                </View>

                {/* Tab switcher */}
                <View style={{ flexDirection: "row", margin: 16, backgroundColor: isDark ? "#111" : "#e8e2d8", borderRadius: 10, padding: 3 }}>
                    {(["weekday", "weekend"] as const).map(t => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: tab === t ? GOLD : "transparent" }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "700", color: tab === t ? "#0a0a0a" : C.muted }}>
                                {t === "weekday" ? "Weekday" : "Weekend"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
                    {blocks.map((block, bi) => (
                        <View key={bi} style={{ flexDirection: "row", marginBottom: 6 }}>
                            {/* Timeline */}
                            <View style={{ width: 24, alignItems: "center" }}>
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD, marginTop: 14 }} />
                                {bi < blocks.length - 1 && <View style={{ width: 1.5, flex: 1, backgroundColor: `${GOLD}30`, marginTop: 3 }} />}
                            </View>

                            {/* Block content */}
                            <View style={{ flex: 1, marginLeft: 10, marginBottom: 14 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <Text style={{ fontSize: 10, fontWeight: "700", color: GOLD, letterSpacing: 1.5 }}>{block.time}</Text>
                                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: `${GOLD}15` }}>
                                        <Text style={{ fontSize: 9, fontWeight: "700", color: GOLD }}>{block.label.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View style={{ backgroundColor: surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: border }}>
                                    {block.items.map((item, ii) => (
                                        <View key={ii} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 5, borderBottomWidth: ii < block.items.length - 1 ? 1 : 0, borderBottomColor: border }}>
                                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD, marginTop: 6, flexShrink: 0 }} />
                                            <Text style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 19 }}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ExperiencesScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [packages, setPackages]             = useState<Package[]>([]);
    const [loading, setLoading]               = useState(true);
    const [itineraryVisible, setItinerary]    = useState(false);

    useFocusEffect(useCallback(() => { load(); }, []));

    const load = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase
            .from("requests")
            .select("id, title, details, status, created_at, reference")
            .eq("user_id", user.id)
            .eq("service_type", "experience")
            .order("created_at", { ascending: false });
        // Map requests to the Package shape the UI expects
        const mapped = (data ?? []).map((r: any) => ({
            id: r.id,
            title: r.title,
            city: r.details?.city ?? "—",
            start_date: r.details?.start_date ?? null,
            end_date: r.details?.end_date ?? null,
            type: r.details?.type ?? "custom",
            status: r.status,
            created_at: r.created_at,
        }));
        setPackages(mapped);
        setLoading(false);
    };

    const fireNotification = async () => {
        await Notifications.requestPermissionsAsync();
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Your Daily Itinerary is Ready",
                body: "LAPEQ Premium: Your curated schedule for today has been prepared.",
                sound: true,
                data: { url: "/(main)/experiences" },
            },
            trigger: null,
        });
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
            ) : (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>


                    {packages.length === 0 ? (
                        <>
                            {/* Empty state showcase */}
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
                        </>
                    ) : (
                        <View style={{ gap: 14, marginTop: 8 }}>
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
                        </View>
                    )}
                </ScrollView>
            )}

            <ItineraryModal visible={itineraryVisible} onClose={() => setItinerary(false)} C={C} theme={theme} />
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root:    { flex: 1, backgroundColor: C.background },
    header:  { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    title:   { fontSize: 22, fontWeight: "700", color: C.text },
    subtitle:{ fontSize: 13, color: C.muted, marginTop: 2 },
    newBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
    center:  { flex: 1, alignItems: "center", justifyContent: "center" },

    itinCard: { borderRadius: 20, borderWidth: 1.5, padding: 18, marginBottom: 20 },

    // Empty state
    showcaseCard:    { height: 260, borderRadius: 20, overflow: "hidden", marginBottom: 28, position: "relative" },
    showcaseImg:     { width: "100%", height: "100%", position: "absolute" },
    showcaseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    showcaseContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 24 },
    showcaseEyebrow: { fontSize: 9, fontWeight: "800", color: C.primary, letterSpacing: 2.5, marginBottom: 8 },
    showcaseTitle:   { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 10, lineHeight: 28 },
    showcaseBody:    { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 21 },
    steps:           { gap: 16, marginBottom: 32 },
    step:            { flexDirection: "row", alignItems: "flex-start", gap: 16 },
    stepNum:         { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    stepNumText:     { fontSize: 14, fontWeight: "700", color: "#0a0a0a" },
    stepTitle:       { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 4 },
    stepDesc:        { fontSize: 13, color: C.muted, lineHeight: 20 },
    ctaBtn:          { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    ctaBtnText:      { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },

    // Package cards
    pkgCard:       { backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    pkgCardTop:    { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
    pkgCity:       { fontSize: 11, fontWeight: "700", color: C.primary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
    pkgTitle:      { fontSize: 17, fontWeight: "700", color: C.text },
    statusBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
    statusText:    { fontSize: 11, fontWeight: "700" },
    pkgCardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTopWidth: 1, borderTopColor: theme === "dark" ? "#2a2a2a" : "#e8e4dc" },
    pkgMeta:       { fontSize: 13, color: C.muted },
    newPackageRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
    newPackageText:{ fontSize: 14, fontWeight: "600", color: C.primary },
});
