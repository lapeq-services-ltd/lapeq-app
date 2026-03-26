import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Modal, Dimensions } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, ArrowRight, Car, Briefcase, Plane, HeartHandshake, FileText, Package, Clock, Calendar, MapPin, Building2, UtensilsCrossed, Ticket, Sparkles, Anchor, SlidersHorizontal } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const { width: SW } = Dimensions.get("window");

const CAR_IMAGES: Record<string, any> = {
    "standard-sedan": require("@/assets/images/standard-sedan.png"),
    "luxury-sedan": require("@/assets/images/mercedes-sedan.png"),
    "premium-suv": require("@/assets/images/range-rover-suv.png"),
    "executive-van": require("@/assets/images/sprinter-van.png"),
};

type RequestType = {
    id: string;
    reference: string | null;
    service_type: string;
    status: string;
    title: string | null;
    created_at: string;
    pickup_location: string | null;
    dropoff_location: string | null;
    scheduled_time: string | null;
    details: { carType?: string; passengers?: number; serviceType?: string } | null;
};

export default function RequestsScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [activeRequests, setActiveRequests] = useState<RequestType[]>([]);
    const [cancelledRequests, setCancelledRequests] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0); // 0 = Active, 1 = Cancelled
    const [showFilterSheet, setShowFilterSheet] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
    const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);
    const [showPickerFrom, setShowPickerFrom] = useState(false);
    const [showPickerTo, setShowPickerTo] = useState(false);

    const pagerRef = useRef<ScrollView>(null);

    const STATUS_FILTERS = ["Pending", "Approved", "Arranged", "In Progress", "Completed"];
    const hasActiveFilter = !!(filterStatus || filterDateFrom || filterDateTo);
    const fmtDate = (d: Date | null) => d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

    const fetchRequests = async (uid?: string) => {
        const resolvedId = uid ?? userId;
        if (!resolvedId) return;

        const [activeRes, cancelledRes] = await Promise.all([
            supabase.from("requests").select("*").eq("user_id", resolvedId).neq("status", "cancelled").order("created_at", { ascending: false }),
            supabase.from("requests").select("*").eq("user_id", resolvedId).eq("status", "cancelled").order("created_at", { ascending: false }),
        ]);

        if (activeRes.data) setActiveRequests(activeRes.data as RequestType[]);
        if (cancelledRes.data) setCancelledRequests(cancelledRes.data as RequestType[]);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;
        const setup = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            await fetchRequests(user.id);

            channel = supabase
                .channel(`requests:${user.id}`)
                .on("postgres_changes", { event: "*", schema: "public", table: "requests", filter: `user_id=eq.${user.id}` },
                    () => { fetchRequests(user.id); })
                .subscribe();
        };
        setup();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, []);

    useFocusEffect(useCallback(() => { fetchRequests(); }, [userId]));

    const onRefresh = () => { setRefreshing(true); fetchRequests(); };

    const switchTab = (idx: number) => {
        setActiveTab(idx);
        pagerRef.current?.scrollTo({ x: idx * SW, animated: true });
    };

    const getServiceIcon = (type: string, details?: RequestType["details"]) => {
        if (type === "driving-service" && details?.carType && CAR_IMAGES[details.carType]) {
            return <Image source={CAR_IMAGES[details.carType]} style={{ width: 44, height: 32 }} resizeMode="contain" />;
        }
        if (type === "lifestyle-travel") {
            switch (details?.serviceType) {
                case "Hotel & Accommodation": return <Building2 size={24} color={C.primary} />;
                case "Restaurant Reservation": return <UtensilsCrossed size={24} color={C.primary} />;
                case "Event Access": return <Ticket size={24} color={C.primary} />;
                case "Spa & Wellness": return <Sparkles size={24} color={C.primary} />;
                case "Private Jet": return <Plane size={24} color={C.primary} />;
                case "Yacht Charter": return <Anchor size={24} color={C.primary} />;
                default: return <Plane size={24} color={C.primary} />;
            }
        }
        switch (type) {
            case 'driving-service': return <Car size={24} color={C.primary} />;
            case 'logistics': return <Package size={24} color={C.primary} />;
            case 'corporate-pairing': return <Briefcase size={24} color={C.primary} />;
            case 'project-trust': return <FileText size={24} color={C.primary} />;
            default: return <HeartHandshake size={24} color={C.primary} />;
        }
    };

    const getServiceTitle = (type: string, title?: string | null) => {
        if (title) return title;
        return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return { bg: "rgba(240,165,0,0.15)", text: "#f0a500" };
            case 'approved': return { bg: `${C.primary}20`, text: C.primary };
            case 'arranged': return { bg: `${C.primary}20`, text: C.primary };
            case 'en-route': return { bg: `${C.primary}50`, text: C.primary };
            case 'in-progress': return { bg: `${C.primary}40`, text: C.primary };
            case 'completed': return { bg: '#1a3a2a', text: '#4caf50' };
            case 'cancelled': return { bg: '#3a1a1a', text: '#ef5350' };
            default: return { bg: `${C.muted}20`, text: C.muted };
        }
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const applyFilters = (list: RequestType[]) => list.filter(r => {
        if (filterStatus && r.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
        if (filterDateFrom && new Date(r.created_at) < filterDateFrom) return false;
        if (filterDateTo) { const to = new Date(filterDateTo); to.setHours(23, 59, 59); if (new Date(r.created_at) > to) return false; }
        return true;
    });

    const renderList = (list: RequestType[], isCancelled: boolean) => {
        const filtered = applyFilters(list);
        if (filtered.length === 0) return (
            <View style={s.emptyState}>
                <Clock size={48} color={C.muted} style={{ marginBottom: 16 }} strokeWidth={1.5} />
                <Text style={s.emptyTitle}>{isCancelled ? "No Cancelled Requests" : "No Active Requests"}</Text>
                <Text style={s.emptySub}>{isCancelled ? "You have no cancelled requests." : "Your concierge requests will appear here."}</Text>
            </View>
        );
        return (
            <View style={{ gap: 16 }}>
                {filtered.map(req => {
                    const statusStyle = getStatusStyle(req.status);
                    return (
                        <TouchableOpacity key={req.id} style={s.card} activeOpacity={0.85} onPress={() => router.push(`/requests/${req.id}`)}>
                            <View style={s.cardHeader}>
                                <View style={s.iconWrap}>{getServiceIcon(req.service_type, req.details)}</View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.cardTitle}>{getServiceTitle(req.service_type, req.title)}</Text>
                                    <Text style={s.cardDate}>{req.reference ? `${req.reference} · ` : ""}{formatDate(req.created_at)}</Text>
                                </View>
                                <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                    <Text style={[s.statusText, { color: statusStyle.text }]}>{req.status.toUpperCase().replace('-', ' ')}</Text>
                                </View>
                            </View>
                            {(req.pickup_location || req.dropoff_location || req.scheduled_time) && (
                                <View style={s.detailsBox}>
                                    {req.scheduled_time && (
                                        <View style={s.detailRow}>
                                            <Calendar size={13} color={C.muted} />
                                            <Text style={s.detailText}>{new Date(req.scheduled_time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text>
                                        </View>
                                    )}
                                    {req.pickup_location && (
                                        <View style={s.detailRow}>
                                            <MapPin size={13} color={C.primary} />
                                            <Text style={s.detailText}>{req.pickup_location}</Text>
                                        </View>
                                    )}
                                    {req.dropoff_location && (
                                        <View style={s.detailRow}>
                                            <MapPin size={13} color={C.muted} />
                                            <Text style={s.detailText}>{req.dropoff_location}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <View style={s.cardFooter}>
                                <Text style={s.viewDetails}>View Details</Text>
                                <ArrowRight size={16} color={C.primary} />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView style={s.root}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.push("/profile")}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Requests</Text>
                <TouchableOpacity style={[s.filterBtn, hasActiveFilter && { backgroundColor: C.primary }]} onPress={() => setShowFilterSheet(true)}>
                    <SlidersHorizontal size={15} color={hasActiveFilter ? C.background : C.text} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={s.tabs}>
                {["Active", "Cancelled"].map((label, i) => (
                    <TouchableOpacity key={label} style={[s.tab, activeTab === i && s.tabActive]} onPress={() => switchTab(i)}>
                        <Text style={[s.tabText, activeTab === i && s.tabTextActive]}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
            ) : (
                <ScrollView
                    ref={pagerRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={e => {
                        const page = Math.round(e.nativeEvent.contentOffset.x / SW);
                        setActiveTab(page);
                    }}
                    style={{ flex: 1 }}
                >
                    {/* Active */}
                    <ScrollView
                        style={{ width: SW }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
                        scrollEnabled
                    >
                        {renderList(activeRequests, false)}
                    </ScrollView>
                    {/* Cancelled */}
                    <ScrollView
                        style={{ width: SW }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 }}
                        scrollEnabled
                    >
                        {renderList(cancelledRequests, true)}
                    </ScrollView>
                </ScrollView>
            )}

            {/* Filter Sheet */}
            <Modal visible={showFilterSheet} transparent animationType="slide">
                <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setShowFilterSheet(false)} />
                <View style={[s.sheet, { backgroundColor: C.surface }]}>
                    <View style={s.sheetHandle} />
                    <View style={s.sheetHeader}>
                        <Text style={[s.sheetTitle, { color: C.text }]}>Filter</Text>
                        <TouchableOpacity onPress={() => { setFilterStatus(null); setFilterDateFrom(null); setFilterDateTo(null); setShowPickerFrom(false); setShowPickerTo(false); setShowFilterSheet(false); }}>
                            <Text style={{ color: C.primary, fontWeight: "600", fontSize: 14 }}>Clear all</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[s.sheetLabel, { color: C.primary }]}>STATUS</Text>
                    <View style={s.statusRow}>
                        {STATUS_FILTERS.map(st => (
                            <TouchableOpacity key={st} style={[s.statusChip, filterStatus === st && s.statusChipActive]} onPress={() => setFilterStatus(f => f === st ? null : st)}>
                                <Text style={[s.statusChipText, filterStatus === st && s.statusChipTextActive]}>{st}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[s.sheetLabel, { color: C.primary }]}>DATE RANGE</Text>
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                        <TouchableOpacity style={[s.dateBtn, { borderColor: showPickerFrom ? C.primary : C.border, backgroundColor: C.background }]} onPress={() => { setShowPickerFrom(p => !p); setShowPickerTo(false); }}>
                            <Calendar size={14} color={C.primary} />
                            <Text style={{ color: filterDateFrom ? C.text : C.muted, fontSize: 13 }}>{fmtDate(filterDateFrom) ?? "From"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.dateBtn, { borderColor: showPickerTo ? C.primary : C.border, backgroundColor: C.background }]} onPress={() => { setShowPickerTo(p => !p); setShowPickerFrom(false); }}>
                            <Calendar size={14} color={C.primary} />
                            <Text style={{ color: filterDateTo ? C.text : C.muted, fontSize: 13 }}>{fmtDate(filterDateTo) ?? "To"}</Text>
                        </TouchableOpacity>
                    </View>
                    {showPickerFrom && (
                        <DateTimePicker value={filterDateFrom ?? new Date()} mode="date" display="spinner"
                            themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%", marginBottom: 8 }}
                            onChange={(_, d) => { if (d) setFilterDateFrom(d); }} />
                    )}
                    {showPickerTo && (
                        <DateTimePicker value={filterDateTo ?? filterDateFrom ?? new Date()} mode="date" display="spinner"
                            minimumDate={filterDateFrom ?? undefined} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%", marginBottom: 8 }}
                            onChange={(_, d) => { if (d) setFilterDateTo(d); }} />
                    )}
                    <TouchableOpacity style={[s.applyBtn, { backgroundColor: C.primary }]} onPress={() => setShowFilterSheet(false)}>
                        <Text style={[s.applyBtnText, { color: C.background }]}>Apply</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: "700", color: C.text, marginLeft: 12 },
    filterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
    tabs: { flexDirection: "row", marginHorizontal: 20, marginBottom: 16, backgroundColor: C.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
    tabActive: { backgroundColor: C.primary },
    tabText: { fontSize: 13, fontWeight: "600", color: C.muted },
    tabTextActive: { color: C.background },
    sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
    sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(128,128,128,0.3)", alignSelf: "center", marginBottom: 20 },
    sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    sheetTitle: { fontSize: 18, fontWeight: "700" },
    sheetLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 12 },
    statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
    statusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.background },
    statusChipActive: { backgroundColor: C.primary, borderColor: C.primary },
    statusChipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    statusChipTextActive: { color: C.background },
    dateBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
    applyBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
    applyBtnText: { fontSize: 15, fontWeight: "700" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 400, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 8 },
    emptySub: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22 },
    card: { backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 16 },
    iconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme === "dark" ? "rgba(201,168,76,0.12)" : C.background, alignItems: "center", justifyContent: "center" },
    cardTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4 },
    cardDate: { fontSize: 12, color: C.muted },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
    detailsBox: { backgroundColor: C.background, padding: 12, borderRadius: 12, marginBottom: 16, gap: 8 },
    detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    detailText: { fontSize: 13, color: C.muted, flex: 1 },
    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 },
    viewDetails: { fontSize: 13, fontWeight: "600", color: C.primary },
});
