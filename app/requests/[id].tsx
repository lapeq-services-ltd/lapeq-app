import { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Car, Briefcase, Plane, HeartHandshake, FileText, Package, MapPin, Clock, Calendar, Users, AlertTriangle, Wallet, Building2, UtensilsCrossed, Ticket, Sparkles, Anchor, Receipt, Check, MessageCircle } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

const GOLD = "#c9a84c";
const { width: W } = Dimensions.get("window");

type ReceiptType = {
    id: string;
    items: { description: string; amount: number }[];
    total: number;
    currency: string;
    notes: string | null;
    issued_at: string;
    created_at: string;
};

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
    driver_status: string | null;
    details: {
        passengers?: number; carType?: string; instructions?: string; carCount?: number; color?: string | null;
        serviceType?: string; destination?: string; dateFrom?: string; dateTo?: string; guests?: number; budget?: string; preferences?: string;
        aircraft?: string; tripType?: string; departure?: string; departureDate?: string; depDate?: string; departureTime?: string; depTime?: string; returnDate?: string | null; retDate?: string | null; catering?: string; groundTransfer?: boolean; notes?: string; specialRequests?: string;
        package?: string; country?: string; timeline?: string; options?: Record<string, boolean>; details?: string;
    } | null;
};

const CAR_IMAGES: Record<string, any> = {
    "standard-sedan": require("@/assets/images/standard-sedan.png"),
    "luxury-sedan": require("@/assets/images/mercedes-sedan.png"),
    "premium-suv": require("@/assets/images/range-rover-suv.png"),
    "escalade-suv": require("@/assets/images/escalade-suv.png"),
    "executive-van": require("@/assets/images/sprinter-van.png"),
};

const SERVICE_LABELS: Record<string, string> = {
    "driving-service": "Elite Transit & Aviation",
    "private-jet": "Private Aviation",
    "logistics": "Logistics",
    "lifestyle-travel": "Hospitality & Travel",
    "corporate-pairing": "Corporate Pairing",
    "project-trust": "Project Trust",
    "concierge-request": "Concierge Request",
    "diaspora-support": "Diaspora Support",
    "lifestyle-request": "Bespoke Request",
};

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
        pending:     { bg: "rgba(240,165,0,0.12)",  text: "#f0a500", dot: "#f0a500" },
        approved:    { bg: "rgba(76,175,80,0.12)",  text: "#4caf50", dot: "#4caf50" },
        arranged:    { bg: "rgba(76,175,80,0.12)",  text: "#4caf50", dot: "#4caf50" },
        active:      { bg: "rgba(201,168,76,0.15)", text: GOLD,      dot: GOLD },
        "en-route":  { bg: "rgba(201,168,76,0.2)",  text: GOLD,      dot: GOLD },
        "in-progress":{ bg:"rgba(201,168,76,0.2)",  text: GOLD,      dot: GOLD },
        completed:   { bg: "rgba(76,175,80,0.12)",  text: "#4caf50", dot: "#4caf50" },
        cancelled:   { bg: "rgba(239,83,80,0.12)",  text: "#ef5350", dot: "#ef5350" },
    };
    const c = colors[status.toLowerCase()] ?? { bg: "rgba(255,255,255,0.08)", text: "#888", dot: "#888" };
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: c.bg }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.dot }} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: c.text, letterSpacing: 0.8 }}>
                {status.toUpperCase().replace(/-/g, " ")}
            </Text>
        </View>
    );
}

function DetailRow({ icon: Icon, label, value, iconColor }: { icon: any; label: string; value: string; iconColor?: string }) {
    const { C } = useTheme();
    return (
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${iconColor ?? GOLD}15`, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                <Icon size={16} color={iconColor ?? GOLD} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: C.muted, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 }}>{label}</Text>
                <Text style={{ fontSize: 15, color: C.text, fontWeight: "500", lineHeight: 22 }}>{value}</Text>
            </View>
        </View>
    );
}

export default function RequestDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";

    const [request, setRequest] = useState<Request | null>(null);
    const [receipt, setReceipt] = useState<ReceiptType | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            const [{ data: reqData }, { data: recData }] = await Promise.all([
                supabase.from("requests").select("*").eq("id", id).single(),
                supabase.from("receipts").select("*").eq("request_id", id).order("created_at", { ascending: false }).limit(1).single(),
            ]);
            if (reqData) setRequest(reqData as Request);
            if (recData) setReceipt(recData as ReceiptType);
            setLoading(false);
        };
        fetch();

        const channel = supabase.channel(`request-${id}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "requests", filter: `id=eq.${id}` }, (payload) => {
                setRequest(prev => prev ? { ...prev, ...payload.new } : prev);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
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
            return <Image source={CAR_IMAGES[details.carType]} style={{ width: 90, height: 60 }} resizeMode="contain" />;
        }
        const props = { size: 32, color: GOLD };
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
            case "private-jet": return <Plane {...props} style={{ transform: [{ rotate: "45deg" }] }} />;
            case "logistics": return <Package {...props} />;
            case "corporate-pairing": return <Briefcase {...props} />;
            case "project-trust": return <FileText {...props} />;
            default: return <HeartHandshake {...props} />;
        }
    };

    const fmtDate = (d: string) => new Date(d).toLocaleString([], {
        month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border }}
                >
                    <ChevronLeft size={22} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Request Details</Text>
                    {request?.reference && (
                        <Text style={{ fontSize: 12, color: GOLD, fontWeight: "600", marginTop: 1, letterSpacing: 0.5 }}>{request.reference}</Text>
                    )}
                </View>
                {request && (
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/(main)/chat", params: { mode: "concierge", packageId: request.id } } as any)}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${GOLD}15`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${GOLD}30` }}
                    >
                        <MessageCircle size={18} color={GOLD} />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={GOLD} />
                </View>
            ) : !request ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 16, color: C.muted }}>Request not found.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

                    {/* Driver Live Banner */}
                    {request.service_type === "driving-service" && request.driver_status && (
                        <View style={{ marginHorizontal: 20, marginBottom: 16, borderRadius: 14, overflow: "hidden" }}>
                            <LinearGradient colors={[`${GOLD}30`, `${GOLD}10`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD }} />
                                <Text style={{ fontSize: 14, fontWeight: "600", color: GOLD }}>
                                    {request.driver_status === "assigned" && "Your driver has been assigned"}
                                    {request.driver_status === "en_route" && "Your driver is on the way"}
                                    {request.driver_status === "arrived" && "Your driver has arrived"}
                                    {request.driver_status === "in_progress" && "Trip in progress"}
                                    {request.driver_status === "completed" && "Trip completed"}
                                </Text>
                            </LinearGradient>
                        </View>
                    )}

                    {/* Hero Card */}
                    <View style={{ marginHorizontal: 20, marginBottom: 20, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: isDark ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.2)" }}>
                        <LinearGradient
                            colors={isDark ? ["#1a1400", "#0d0d0d"] : ["#fffbf0", "#ffffff"]}
                            style={{ padding: 32, alignItems: "center", gap: 14 }}
                        >
                            {/* Icon circle */}
                            <View style={{
                                width: 80, height: 80, borderRadius: 40,
                                backgroundColor: isDark ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.08)",
                                borderWidth: 1, borderColor: `${GOLD}30`,
                                alignItems: "center", justifyContent: "center",
                            }}>
                                {getIcon(request.service_type, request.details)}
                            </View>

                            <Text style={{ fontSize: 11, color: GOLD, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" }}>
                                {SERVICE_LABELS[request.service_type] ?? request.service_type}
                            </Text>

                            {request.title && (
                                <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, textAlign: "center", letterSpacing: -0.3 }}>
                                    {request.title}
                                </Text>
                            )}

                            <StatusBadge status={request.status} />

                            <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                                Submitted {fmtDate(request.created_at)}
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* Details Card */}
                    <View style={{ marginHorizontal: 20, marginBottom: 20, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, overflow: "hidden" }}>
                        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 2, textTransform: "uppercase" }}>Details</Text>
                        </View>
                        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>

                            {request.scheduled_time && (
                                <DetailRow icon={Clock} label="Scheduled" value={fmtDate(request.scheduled_time)} />
                            )}
                            {request.pickup_location && (
                                <DetailRow icon={MapPin} label="Pickup" value={request.pickup_location} />
                            )}
                            {request.dropoff_location && (
                                <DetailRow icon={MapPin} label="Drop-off" value={request.dropoff_location} iconColor="#60a5fa" />
                            )}
                            {request.details?.passengers && (
                                <DetailRow icon={Users} label="Passengers" value={`${request.details.passengers} pax`} />
                            )}
                            {request.details?.carCount && request.details.carCount > 1 && (
                                <DetailRow icon={Car} label="Cars" value={`${request.details.carCount} vehicles`} />
                            )}
                            {request.details?.color && (
                                <DetailRow icon={Car} label="Colour Preference" value={request.details.color.charAt(0).toUpperCase() + request.details.color.slice(1)} />
                            )}

                            {/* Lifestyle & Travel */}
                            {request.service_type === "lifestyle-travel" && (<>
                                {request.details?.destination && <DetailRow icon={MapPin} label="Destination / Venue" value={request.details.destination} />}
                                {(request.details?.dateFrom || request.details?.dateTo) && (
                                    <DetailRow icon={Calendar} label="Dates" value={[request.details.dateFrom, request.details.dateTo].filter(Boolean).join(" → ")} />
                                )}
                                {request.details?.guests && <DetailRow icon={Users} label="Guests" value={`${request.details.guests} ${request.details.guests === 1 ? "guest" : "guests"}`} />}
                                {request.details?.budget && <DetailRow icon={Wallet} label="Budget Range" value={request.details.budget} />}
                            </>)}

                            {/* Private Jet */}
                            {request.service_type === "private-jet" && (<>
                                {request.details?.aircraft && <DetailRow icon={Plane} label="Aircraft Class" value={request.details.aircraft} />}
                                {request.details?.tripType && <DetailRow icon={Clock} label="Trip Type" value={request.details.tripType === "return" || request.details.tripType === "round-trip" ? "Return Flight" : "One Way"} />}
                                {(request.details?.departureDate || request.details?.depDate) && (
                                    <DetailRow icon={Calendar} label="Departure" value={`${request.details.departureDate || request.details.depDate}${(request.details.departureTime || request.details.depTime) ? ` @ ${request.details.departureTime || request.details.depTime}` : ""}`} />
                                )}
                                {(request.details?.returnDate || request.details?.retDate) && (
                                    <DetailRow icon={Calendar} label="Return Date" value={(request.details.returnDate || request.details.retDate)!} />
                                )}
                                {request.details?.passengers && <DetailRow icon={Users} label="Passengers" value={`${request.details.passengers} pax`} />}
                                {request.details?.catering && (
                                    <DetailRow icon={UtensilsCrossed} label="Catering" value={typeof request.details.catering === "string" ? request.details.catering.charAt(0).toUpperCase() + request.details.catering.slice(1) : "Standard"} />
                                )}
                                {request.details?.groundTransfer !== undefined && (
                                    <DetailRow icon={Car} label="Ground Transfer" value={request.details.groundTransfer ? "Requested" : "Not requested"} />
                                )}
                            </>)}

                            {/* Diaspora Support */}
                            {request.service_type === "diaspora-support" && (<>
                                {request.details?.package && <DetailRow icon={Briefcase} label="Concierge Service" value={request.details.package} />}
                                {request.details?.country && <DetailRow icon={MapPin} label="Country of Residence" value={request.details.country} />}
                                {request.details?.budget && <DetailRow icon={Wallet} label="Estimated Budget" value={request.details.budget} />}
                                {request.details?.timeline && <DetailRow icon={Clock} label="Timeline" value={request.details.timeline} />}
                            </>)}
                        </View>

                        {/* Notes / special instructions */}
                        {(request.details?.instructions || request.details?.preferences || request.details?.notes || request.details?.specialRequests || request.details?.details || request.notes) && (
                            <View style={{ margin: 12, borderRadius: 14, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", padding: 16, gap: 6 }}>
                                <Text style={{ fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Notes</Text>
                                <Text style={{ fontSize: 14, color: C.text, lineHeight: 22 }}>
                                    {request.details?.instructions || request.details?.preferences || request.details?.notes || request.details?.specialRequests || request.details?.details || request.notes}
                                </Text>
                            </View>
                        )}

                        {/* Diaspora options checklist */}
                        {request.details?.options && (
                            <View style={{ margin: 12, borderRadius: 14, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", padding: 16, gap: 10 }}>
                                <Text style={{ fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Service Features</Text>
                                {Object.entries(request.details.options).map(([key, val]) => {
                                    if (!val) return null;
                                    return (
                                        <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: `${GOLD}20`, alignItems: "center", justifyContent: "center" }}>
                                                <Check size={11} color={GOLD} strokeWidth={3} />
                                            </View>
                                            <Text style={{ fontSize: 13, color: C.text }}>{key}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Status info */}
                    <View style={{ marginHorizontal: 20, marginBottom: 20, borderRadius: 16, backgroundColor: isDark ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.05)", borderWidth: 1, borderColor: `${GOLD}20`, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD }} />
                        <Text style={{ flex: 1, fontSize: 13, color: C.muted, lineHeight: 20 }}>
                            Our team is handling your request. You'll be notified as the status updates.
                        </Text>
                    </View>

                    {/* Receipt */}
                    {receipt && (
                        <View style={{ marginHorizontal: 20, marginBottom: 20, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, overflow: "hidden" }}>
                            <LinearGradient colors={isDark ? [`${GOLD}18`, "transparent"] : [`${GOLD}10`, "transparent"]} style={{ padding: 20 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${GOLD}20`, alignItems: "center", justifyContent: "center" }}>
                                        <Receipt size={18} color={GOLD} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>Invoice</Text>
                                        <Text style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
                                            {new Date(receipt.issued_at ?? receipt.created_at).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", marginBottom: 16 }} />
                                {receipt.items.map((item, i) => (
                                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                        <Text style={{ fontSize: 14, color: C.text, fontWeight: "500", flex: 1 }}>{item.description || "Service"}</Text>
                                        <Text style={{ fontSize: 14, color: C.text, fontWeight: "600" }}>
                                            {new Intl.NumberFormat("en-NG", { style: "currency", currency: receipt.currency ?? "NGN", minimumFractionDigits: 0 }).format(item.amount)}
                                        </Text>
                                    </View>
                                ))}
                                <View style={{ height: 1, backgroundColor: `${GOLD}30`, marginBottom: 14 }} />
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <Text style={{ fontSize: 12, fontWeight: "700", color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Total</Text>
                                    <Text style={{ fontSize: 26, fontWeight: "700", color: GOLD }}>
                                        {new Intl.NumberFormat("en-NG", { style: "currency", currency: receipt.currency ?? "NGN", minimumFractionDigits: 0 }).format(receipt.total)}
                                    </Text>
                                </View>
                                {receipt.notes && (
                                    <Text style={{ fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 18 }}>{receipt.notes}</Text>
                                )}
                            </LinearGradient>
                        </View>
                    )}

                    {/* Cancel button */}
                    {request.status.toLowerCase() === "pending" && (
                        <TouchableOpacity
                            onPress={() => setShowCancelModal(true)}
                            style={{ marginHorizontal: 20, paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: "600", color: "#ef535080" }}>Cancel this request</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}

            {/* Cancel Modal */}
            <Modal visible={showCancelModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 }}>
                    <View style={{ width: "100%", backgroundColor: C.surface, borderRadius: 28, padding: 28, alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.border }}>
                        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(239,83,80,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                            <AlertTriangle size={26} color="#ef5350" />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: C.text }}>Cancel Request?</Text>
                        <Text style={{ fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 8 }}>
                            Are you sure you want to cancel this request? This cannot be undone.
                        </Text>
                        <TouchableOpacity
                            onPress={confirmCancel}
                            disabled={cancelling}
                            style={{ width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: "#ef5350", alignItems: "center" }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{cancelling ? "Cancelling..." : "Yes, Cancel"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowCancelModal(false)}
                            style={{ width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center" }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: "600", color: C.muted }}>Keep Request</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
