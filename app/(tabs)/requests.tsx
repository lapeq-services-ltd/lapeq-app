import { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ChevronLeft, ArrowRight, Car, Briefcase, Plane, HeartHandshake, FileText, Package } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

type RequestType = {
    id: string;
    service_type: string;
    status: string;
    title: string | null;
    created_at: string;
    pickup_location: string | null;
    dropoff_location: string | null;
    scheduled_time: string | null;
};

export default function RequestsScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [requests, setRequests] = useState<RequestType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRequests = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        let hasRealData = false;

        if (user) {
            const { data, error } = await supabase
                .from("requests")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (data && data.length > 0) {
                setRequests(data as RequestType[]);
                hasRealData = true;
            }
        }

        // --- MOCK DATA FOR PREVIEW ---
        if (!hasRealData) {
            setRequests([
                {
                    id: "mock-1",
                    service_type: "driving-service",
                    status: "en-route",
                    title: null,
                    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                    pickup_location: "Murtala Muhammed Intl Airport",
                    dropoff_location: "Eko Hotels & Suites, VI",
                    scheduled_time: new Date(Date.now() + 1000 * 60 * 45).toISOString()
                },
                {
                    id: "mock-2",
                    service_type: "lifestyle-travel",
                    status: "arranged",
                    title: "Private Jet: LOS to LHR",
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
                    pickup_location: null,
                    dropoff_location: null,
                    scheduled_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString()
                },
                {
                    id: "mock-3",
                    service_type: "corporate-pairing",
                    status: "pending",
                    title: "Security Detail for Conference",
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
                    pickup_location: "Landmark Event Center",
                    dropoff_location: null,
                    scheduled_time: null
                }
            ]);
        }

        setLoading(false);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchRequests();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const getServiceIcon = (type: string) => {
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
        switch (status) {
            case 'pending': return { bg: `${C.muted}20`, text: C.muted };
            case 'approved':
            case 'arranged': return { bg: `${C.primary}20`, text: C.primary };
            case 'en-route':
            case 'in-progress': return { bg: `${C.primary}40`, text: C.primary };
            case 'completed': return { bg: `${C.green}20`, text: C.green };
            case 'cancelled': return { bg: '#ffebee', text: '#d32f2f' };
            default: return { bg: `${C.muted}20`, text: C.muted };
        }
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.push("/profile")}>
                    <ChevronLeft size={32} color={C.cardFg} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Requests</Text>
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
                            <Text style={s.emptyTitle}>No Active Requests</Text>
                            <Text style={s.emptySub}>Your submitted concierge tasks and services will appear here for tracking.</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 16 }}>
                            {requests.map(req => {
                                const statusStyle = getStatusStyle(req.status);
                                return (
                                    <TouchableOpacity
                                        key={req.id}
                                        style={s.card}
                                        onPress={() => {
                                            if (req.service_type === 'driving-service') {
                                                router.push("/coordination");
                                            }
                                        }}
                                    >
                                        <View style={s.cardHeader}>
                                            <View style={s.iconWrap}>
                                                {getServiceIcon(req.service_type)}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={s.cardTitle}>{getServiceTitle(req.service_type, req.title)}</Text>
                                                <Text style={s.cardDate}>{new Date(req.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                                            </View>
                                            <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                                <Text style={[s.statusText, { color: statusStyle.text }]}>
                                                    {req.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>

                                        {(req.pickup_location || req.dropoff_location || req.scheduled_time) && (
                                            <View style={s.detailsBox}>
                                                {req.scheduled_time && <Text style={s.detailText}>• {new Date(req.scheduled_time).toLocaleString()}</Text>}
                                                {req.pickup_location && <Text style={s.detailText}>• From: {req.pickup_location}</Text>}
                                                {req.dropoff_location && <Text style={s.detailText}>• To: {req.dropoff_location}</Text>}
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
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 400, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 8 },
    emptySub: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 20 },
    card: { backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 16 },
    iconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme === 'dark' ? "rgba(201,168,76,0.15)" : C.background, alignItems: "center", justifyContent: "center" },
    cardTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4 },
    cardDate: { fontSize: 12, color: C.muted },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
    detailsBox: { backgroundColor: C.background, padding: 12, borderRadius: 12, marginBottom: 16, gap: 6 },
    detailText: { fontSize: 13, color: C.muted },
    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 },
    viewDetails: { fontSize: 13, fontWeight: "600", color: C.primary }
});
