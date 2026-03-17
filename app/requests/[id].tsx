import { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Car, Briefcase, Plane, HeartHandshake, FileText, Package, MapPin, Clock, Calendar } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

type Request = {
    id: string;
    service_type: string;
    status: string;
    title: string | null;
    created_at: string;
    pickup_location: string | null;
    dropoff_location: string | null;
    scheduled_time: string | null;
    notes: string | null;
};

const SERVICE_LABELS: Record<string, string> = {
    "driving-service": "Driving Service",
    "logistics": "Logistics",
    "lifestyle-travel": "Lifestyle & Travel",
    "corporate-pairing": "Corporate Pairing",
    "project-trust": "Project Trust",
    "concierge-request": "Concierge Request",
    "diaspora-support": "Diaspora Support",
};

export default function RequestDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [request, setRequest] = useState<Request | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from("requests")
                .select("*")
                .eq("id", id)
                .single();
            if (data) setRequest(data as Request);
            setLoading(false);
        };
        fetch();
    }, [id]);

    const getIcon = (type: string) => {
        const props = { size: 28, color: C.primary };
        switch (type) {
            case "driving-service": return <Car {...props} />;
            case "logistics": return <Package {...props} />;
            case "lifestyle-travel": return <Plane {...props} />;
            case "corporate-pairing": return <Briefcase {...props} />;
            case "project-trust": return <FileText {...props} />;
            default: return <HeartHandshake {...props} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return { bg: "rgba(240,165,0,0.15)", text: "#f0a500" };
            case "approved":
            case "arranged": return { bg: `${C.primary}20`, text: C.primary };
            case "en-route":
            case "in-progress": return { bg: `${C.primary}40`, text: C.primary };
            case "completed": return { bg: "#1a3a2a", text: "#4caf50" };
            case "cancelled": return { bg: "#3a1a1a", text: "#ef5350" };
            default: return { bg: `${C.muted}20`, text: C.muted };
        }
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={28} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Request Details</Text>
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color={C.primary} />
                </View>
            ) : !request ? (
                <View style={s.center}>
                    <Text style={s.notFound}>Request not found.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={s.scroll}>
                    <View style={s.heroCard}>
                        <View style={s.iconWrap}>
                            {getIcon(request.service_type)}
                        </View>
                        <Text style={s.serviceLabel}>
                            {SERVICE_LABELS[request.service_type] ?? request.service_type}
                        </Text>
                        {request.title && (
                            <Text style={s.title}>{request.title}</Text>
                        )}
                        <View style={[s.statusBadge, { backgroundColor: getStatusColor(request.status).bg }]}>
                            <Text style={[s.statusText, { color: getStatusColor(request.status).text }]}>
                                {request.status.toUpperCase().replace("-", " ")}
                            </Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.sectionLabel}>DETAILS</Text>

                        <View style={s.detailRow}>
                            <Calendar size={16} color={C.muted} />
                            <View style={s.detailText}>
                                <Text style={s.detailLabel}>Submitted</Text>
                                <Text style={s.detailValue}>
                                    {new Date(request.created_at).toLocaleString([], {
                                        month: "long", day: "numeric", year: "numeric",
                                        hour: "2-digit", minute: "2-digit"
                                    })}
                                </Text>
                            </View>
                        </View>

                        {request.scheduled_time && (
                            <View style={s.detailRow}>
                                <Clock size={16} color={C.muted} />
                                <View style={s.detailText}>
                                    <Text style={s.detailLabel}>Scheduled</Text>
                                    <Text style={s.detailValue}>
                                        {new Date(request.scheduled_time).toLocaleString([], {
                                            month: "long", day: "numeric", year: "numeric",
                                            hour: "2-digit", minute: "2-digit"
                                        })}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {request.pickup_location && (
                            <View style={s.detailRow}>
                                <MapPin size={16} color={C.muted} />
                                <View style={s.detailText}>
                                    <Text style={s.detailLabel}>Pickup</Text>
                                    <Text style={s.detailValue}>{request.pickup_location}</Text>
                                </View>
                            </View>
                        )}

                        {request.dropoff_location && (
                            <View style={s.detailRow}>
                                <MapPin size={16} color={C.primary} />
                                <View style={s.detailText}>
                                    <Text style={s.detailLabel}>Drop-off</Text>
                                    <Text style={s.detailValue}>{request.dropoff_location}</Text>
                                </View>
                            </View>
                        )}

                        {request.notes && (
                            <View style={s.notesBox}>
                                <Text style={s.detailLabel}>Notes</Text>
                                <Text style={s.notesText}>{request.notes}</Text>
                            </View>
                        )}
                    </View>

                    <View style={s.infoBox}>
                        <Text style={s.infoText}>
                            Our team is handling your request. You'll be notified as the status updates.
                        </Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 20, fontWeight: "700", color: C.text },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    notFound: { fontSize: 16, color: C.muted },
    scroll: { padding: 20, gap: 20 },

    heroCard: { backgroundColor: C.surface, borderRadius: 24, padding: 28, alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.border },
    iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme === "dark" ? "rgba(201,168,76,0.12)" : C.background, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    serviceLabel: { fontSize: 13, color: C.muted, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
    title: { fontSize: 20, fontWeight: "700", color: C.text, textAlign: "center" },
    statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, marginTop: 4 },
    statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },

    section: { backgroundColor: C.surface, borderRadius: 20, padding: 20, gap: 16, borderWidth: 1, borderColor: C.border },
    sectionLabel: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2, marginBottom: 4 },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    detailText: { flex: 1, gap: 2 },
    detailLabel: { fontSize: 11, color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
    detailValue: { fontSize: 15, color: C.text, fontWeight: "500" },
    notesBox: { backgroundColor: C.background, borderRadius: 12, padding: 14, gap: 6 },
    notesText: { fontSize: 14, color: C.text, lineHeight: 22 },

    infoBox: { backgroundColor: theme === "dark" ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.06)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(201,168,76,0.2)" },
    infoText: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },
});
