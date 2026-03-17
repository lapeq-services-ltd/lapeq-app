import { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ArrowRight, Car, Briefcase, Plane, HeartHandshake, FileText, Package, Clock, Calendar, MapPin } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const CAR_IMAGES: Record<string, any> = {
    "standard-sedan": require("@/assets/images/standard-sedan.png"),
    "luxury-sedan": require("@/assets/images/mercedes-sedan.png"),
    "premium-suv": require("@/assets/images/range-rover-suv.png"),
    "executive-van": require("@/assets/images/sprinter-van.png"),
};

type RequestType = {
    id: string;
    service_type: string;
    status: string;
    title: string | null;
    created_at: string;
    pickup_location: string | null;
    dropoff_location: string | null;
    scheduled_time: string | null;
    details: { carType?: string; passengers?: number } | null;
};

export default function RequestsScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [requests, setRequests] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchRequests = async (uid?: string) => {
        const resolvedId = uid ?? userId;
        if (!resolvedId) return;

        const { data, error } = await supabase
            .from("requests")
            .select("*")
            .eq("user_id", resolvedId)
            .order("created_at", { ascending: false });

        if (data) setRequests(data as RequestType[]);
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
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "requests",
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        if (payload.eventType === "INSERT") {
                            setRequests(prev => [payload.new as RequestType, ...prev]);
                        } else if (payload.eventType === "UPDATE") {
                            setRequests(prev =>
                                prev.map(r => r.id === payload.new.id ? payload.new as RequestType : r)
                            );
                        } else if (payload.eventType === "DELETE") {
                            setRequests(prev => prev.filter(r => r.id !== payload.old.id));
                        }
                    }
                )
                .subscribe();
        };

        setup();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const getServiceIcon = (type: string, details?: RequestType["details"]) => {
        if (type === "driving-service" && details?.carType && CAR_IMAGES[details.carType]) {
            return <Image source={CAR_IMAGES[details.carType]} style={{ width: 44, height: 32 }} resizeMode="contain" />;
        }
        switch (type) {
            case 'driving-service': return <Car size={24} color={C.primary} />;
            case 'logistics': return <Package size={24} color={C.primary} />;
            case 'lifestyle-travel': return <Plane size={24} color={C.primary} />;
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

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.push("/profile")}>
                    <ChevronLeft size={32} color={C.cardFg} />
                </TouchableOpacity>
                <View>
                    <Text style={s.headerTitle}>My Requests</Text>
                    <Text style={s.headerSub}>Live status updates</Text>
                </View>
                <View style={s.liveDot} />
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color={C.primary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
                >
                    {requests.length === 0 ? (
                        <View style={s.emptyState}>
                            <Clock size={48} color={C.muted} style={{ marginBottom: 16 }} strokeWidth={1.5} />
                            <Text style={s.emptyTitle}>No Active Requests</Text>
                            <Text style={s.emptySub}>Your concierge requests will appear here and update in real time as our team processes them.</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 16 }}>
                            {requests.map(req => {
                                const statusStyle = getStatusStyle(req.status);
                                return (
                                    <TouchableOpacity
                                        key={req.id}
                                        style={s.card}
                                        activeOpacity={0.85}
                                        onPress={() => router.push(`/requests/${req.id}`)}
                                    >
                                        <View style={s.cardHeader}>
                                            <View style={s.iconWrap}>
                                                {getServiceIcon(req.service_type, req.details)}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={s.cardTitle}>{getServiceTitle(req.service_type, req.title)}</Text>
                                                <Text style={s.cardDate}>{formatDate(req.created_at)}</Text>
                                            </View>
                                            <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                                <Text style={[s.statusText, { color: statusStyle.text }]}>
                                                    {req.status.toUpperCase().replace('-', ' ')}
                                                </Text>
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
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontWeight: "700", color: C.text },
    headerSub: { fontSize: 11, color: C.primary, fontWeight: "600", letterSpacing: 0.5 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4caf50", marginLeft: "auto", shadowColor: "#4caf50", shadowOpacity: 0.8, shadowRadius: 4 },
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
    viewDetails: { fontSize: 13, fontWeight: "600", color: C.primary }
});
