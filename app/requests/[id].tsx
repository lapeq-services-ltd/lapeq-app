import { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Car, Briefcase, Plane, HeartHandshake, FileText, Package, MapPin, Clock, Calendar, Users, AlertTriangle, Wallet, MessageSquare, Building2, UtensilsCrossed, Ticket, Sparkles, Anchor } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

type Request = {
    id: string;
    reference: string | null;
    service_type: string;
    status: string;
    title: string | null;
    created_at: string;
    pickup_location: string | null;
    dropoff_location: string | null;
    scheduled_time: string | null;
    notes: string | null;
    details: {
        // driving
        passengers?: number; carType?: string; instructions?: string; carCount?: number; color?: string | null;
        // lifestyle & travel
        serviceType?: string; destination?: string; dateFrom?: string; dateTo?: string; guests?: number; budget?: string; preferences?: string;
    } | null;
};

const CAR_IMAGES: Record<string, any> = {
    "standard-sedan": require("@/assets/images/standard-sedan.png"),
    "luxury-sedan": require("@/assets/images/mercedes-sedan.png"),
    "premium-suv": require("@/assets/images/range-rover-suv.png"),
    "executive-van": require("@/assets/images/sprinter-van.png"),
};

const SERVICE_LABELS: Record<string, string> = {
    "driving-service": "Driving Service",
    "logistics": "Logistics",
    "lifestyle-travel": "Hospitality & Travel",
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
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

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

    const confirmCancel = async () => {
        setCancelling(true);
        await supabase.from("requests").update({ status: "cancelled" }).eq("id", id);
        setCancelling(false);
        setShowCancelModal(false);
        router.back();
    };

    const getIcon = (type: string, details?: Request["details"]) => {
        if (type === "driving-service" && details?.carType && CAR_IMAGES[details.carType]) {
            return <Image source={CAR_IMAGES[details.carType]} style={{ width: 72, height: 52 }} resizeMode="contain" />;
        }
        const props = { size: 28, color: C.primary };
        if (type === "lifestyle-travel") {
            switch (details?.serviceType) {
                case "Hotel & Accommodation": return <Building2 {...props} />;
                case "Restaurant Reservation": return <UtensilsCrossed {...props} />;
                case "Event Access": return <Ticket {...props} />;
                case "Spa & Wellness": return <Sparkles {...props} />;
                case "Private Jet": return <Plane {...props} />;
                case "Yacht Charter": return <Anchor {...props} />;
                default: return <Plane {...props} />;
            }
        }
        switch (type) {
            case "driving-service": return <Car {...props} />;
            case "logistics": return <Package {...props} />;
            case "corporate-pairing": return <Briefcase {...props} />;
            case "project-trust": return <FileText {...props} />;
            default: return <HeartHandshake {...props} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
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
                <View>
                    <Text style={s.headerTitle}>Request Details</Text>
                    {request?.reference && <Text style={{ fontSize: 12, color: C.primary, fontWeight: "600", marginTop: 1 }}>{request.reference}</Text>}
                </View>
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
                            {getIcon(request.service_type, request.details)}
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

                        {request.details?.passengers && (
                            <View style={s.detailRow}>
                                <Users size={16} color={C.muted} />
                                <View style={s.detailText}>
                                    <Text style={s.detailLabel}>Passengers</Text>
                                    <Text style={s.detailValue}>{request.details.passengers} pax</Text>
                                </View>
                            </View>
                        )}

                        {request.details?.carCount && request.details.carCount > 1 && (
                            <View style={s.detailRow}>
                                <Car size={16} color={C.muted} />
                                <View style={s.detailText}>
                                    <Text style={s.detailLabel}>Cars</Text>
                                    <Text style={s.detailValue}>{request.details.carCount} cars</Text>
                                </View>
                            </View>
                        )}

                        {request.details?.color && (
                            <View style={s.detailRow}>
                                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: request.details.color === "black" ? "#1c1c1c" : request.details.color === "white" ? "#f0f0f0" : request.details.color === "silver" ? "#a8a8a8" : request.details.color === "navy" ? "#1a2a4a" : "#c9a84c", borderWidth: 1, borderColor: C.border }} />
                                <View style={s.detailText}>
                                    <Text style={s.detailLabel}>Color Preference</Text>
                                    <Text style={s.detailValue}>{request.details.color.charAt(0).toUpperCase() + request.details.color.slice(1)}</Text>
                                </View>
                            </View>
                        )}

                        {request.details?.instructions && (
                            <View style={s.notesBox}>
                                <Text style={s.detailLabel}>Special Instructions</Text>
                                <Text style={s.notesText}>{request.details.instructions}</Text>
                            </View>
                        )}

                        {/* Lifestyle & Travel fields */}
                        {request.service_type === "lifestyle-travel" && (<>
                            {request.details?.destination && (
                                <View style={s.detailRow}>
                                    <MapPin size={16} color={C.primary} />
                                    <View style={s.detailText}>
                                        <Text style={s.detailLabel}>Destination / Venue</Text>
                                        <Text style={s.detailValue}>{request.details.destination}</Text>
                                    </View>
                                </View>
                            )}
                            {(request.details?.dateFrom || request.details?.dateTo) && (
                                <View style={s.detailRow}>
                                    <Calendar size={16} color={C.muted} />
                                    <View style={s.detailText}>
                                        <Text style={s.detailLabel}>Dates</Text>
                                        <Text style={s.detailValue}>
                                            {[request.details.dateFrom, request.details.dateTo].filter(Boolean).join(" → ")}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            {request.details?.guests && (
                                <View style={s.detailRow}>
                                    <Users size={16} color={C.muted} />
                                    <View style={s.detailText}>
                                        <Text style={s.detailLabel}>Guests</Text>
                                        <Text style={s.detailValue}>{request.details.guests} {request.details.guests === 1 ? "guest" : "guests"}</Text>
                                    </View>
                                </View>
                            )}
                            {request.details?.budget && (
                                <View style={s.detailRow}>
                                    <Wallet size={16} color={C.muted} />
                                    <View style={s.detailText}>
                                        <Text style={s.detailLabel}>Budget Range</Text>
                                        <Text style={s.detailValue}>{request.details.budget}</Text>
                                    </View>
                                </View>
                            )}
                            {request.details?.preferences && (
                                <View style={s.notesBox}>
                                    <Text style={s.detailLabel}>Preferences & Requirements</Text>
                                    <Text style={s.notesText}>{request.details.preferences}</Text>
                                </View>
                            )}
                        </>)}

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

                    {request.status.toLowerCase() === "pending" && (
                        <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCancelModal(true)}>
                            <Text style={s.cancelBtnText}>Cancel Request</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}

            <Modal visible={showCancelModal} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.modalBox}>
                        <View style={s.modalIconWrap}>
                            <AlertTriangle size={24} color="#ef5350" />
                        </View>
                        <Text style={s.modalTitle}>Cancel Request</Text>
                        <Text style={s.modalBody}>Are you sure you want to cancel this request? This cannot be undone.</Text>
                        <TouchableOpacity style={s.modalBtnCancel} onPress={confirmCancel} disabled={cancelling}>
                            <Text style={s.modalBtnCancelText}>{cancelling ? "Cancelling..." : "Yes, Cancel"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnKeep} onPress={() => setShowCancelModal(false)}>
                            <Text style={s.modalBtnKeepText}>Keep Request</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    cancelBtn: { borderRadius: 16, padding: 18, alignItems: "center", borderWidth: 1, borderColor: "#ef5350" },
    cancelBtnText: { fontSize: 15, fontWeight: "700", color: "#ef5350" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 28, alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border },
    modalIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(239,83,80,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
    modalTitle: { fontSize: 18, fontWeight: "700", color: C.text },
    modalBody: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 8 },
    modalBtnCancel: { width: "100%", paddingVertical: 15, borderRadius: 14, backgroundColor: "#ef5350", alignItems: "center" },
    modalBtnCancelText: { fontSize: 15, fontWeight: "700", color: "#fff" },
    modalBtnKeep: { width: "100%", paddingVertical: 15, borderRadius: 14, alignItems: "center" },
    modalBtnKeepText: { fontSize: 15, fontWeight: "600", color: C.muted },
});
