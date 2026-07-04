import { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Dimensions, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Car, Briefcase, Plane, HeartHandshake, FileText, Package, MapPin, Clock, Calendar, Users, AlertTriangle, Wallet, Building2, UtensilsCrossed, Ticket, Sparkles, Anchor, Receipt, Check, MessageCircle } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { PayWithFlutterwave } from "flutterwave-react-native";

const GOLD = "#c9a84c";
const FLW_PUBLIC_KEY = process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? "";
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
    payment_status?: string | null;
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
    const [userName, setUserName] = useState("Member");
    const [userEmail, setUserEmail] = useState("");
    const [payingOption, setPayingOption] = useState<{ title: string; price: number } | null>(null);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            let profileData = null;
            if (user) {
                const { data: prof } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single();
                profileData = prof;
            }
            const [{ data: reqData }, { data: recData }, { data: itineraryNotifs }] = await Promise.all([
                supabase.from("requests").select("*").eq("id", id).single(),
                supabase.from("receipts").select("*").eq("request_id", id).order("created_at", { ascending: false }).limit(1).single(),
                supabase.from("notifications")
                    .select("id")
                    .eq("type", "itinerary")
                    .filter("data->>requestId", "eq", id)
                    .order("created_at", { ascending: false })
                    .limit(1)
            ]);
            if (reqData) setRequest(reqData as Request);
            if (recData) setReceipt(recData as ReceiptType);
            if (itineraryNotifs && itineraryNotifs.length > 0) {
                router.replace({ pathname: "/itinerary-view", params: { notifId: itineraryNotifs[0].id } } as any);
                return;
            }
            if (profileData) {
                setUserName(profileData.full_name ?? "Member");
                setUserEmail(profileData.email ?? user?.email ?? "");
            }
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

    const verifyPayment = async (payload: {
        tx_ref: string;
        request_id: string;
        expected_amount: number;
        payment_type: "curation" | "option";
        option_title?: string;
    }) => {
        setVerifying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-payment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            const result = await res.json();
            if (!res.ok || !result.success) {
                Alert.alert(
                    "Verification Failed",
                    "Your payment was received but could not be verified automatically. Please contact support with your reference number and we will confirm it shortly."
                );
                return null;
            }
            return result;
        } catch {
            Alert.alert(
                "Verification Error",
                "Could not reach our server to verify your payment. Please contact support — your payment may still have gone through."
            );
            return null;
        } finally {
            setVerifying(false);
        }
    };

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

                    {/* Curation Payment Action Card */}
                    {request.service_type === "experience" && request.payment_status === "unpaid" && (
                        <View style={{ marginHorizontal: 20, marginBottom: 20, borderRadius: 24, backgroundColor: C.surface, borderWidth: 1, borderColor: `${GOLD}50`, overflow: "hidden" }}>
                            <LinearGradient colors={[`${GOLD}15`, "transparent"]} style={{ padding: 24, gap: 16 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${GOLD}20`, alignItems: "center", justifyContent: "center" }}>
                                        <Wallet size={20} color={GOLD} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>Curation Fee Booking</Text>
                                        <Text style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>Secure your reservation curated by LAPEQ</Text>
                                    </View>
                                </View>

                                <View style={{ height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }} />

                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: C.muted }}>Curation Fee</Text>
                                    <Text style={{ fontSize: 24, fontWeight: "800", color: GOLD }}>₦5,000</Text>
                                </View>

                                <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: 12, padding: 12 }}>
                                    <Text style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>
                                        Secure payment via Flutterwave · Card, Bank Transfer, USSD
                                    </Text>
                                </View>

                                {verifying ? (
                                    <View style={{ paddingVertical: 16, alignItems: "center", gap: 8 }}>
                                        <ActivityIndicator size="small" color={GOLD} />
                                        <Text style={{ fontSize: 12, color: C.muted }}>Verifying payment with server...</Text>
                                    </View>
                                ) : userEmail ? (
                                    <PayWithFlutterwave
                                        options={{
                                            // Deterministic tx_ref — derived from request.id, never changes.
                                            // Flutterwave rejects duplicate tx_refs, preventing double-charges.
                                            tx_ref: `CUR-${request.id.replace(/-/g, "").slice(0, 20)}`,
                                            authorization: FLW_PUBLIC_KEY,
                                            customer: { email: userEmail, name: userName },
                                            amount: 5000,
                                            currency: "NGN",
                                            payment_options: "card,banktransfer,ussd",
                                            customization: {
                                                title: "Lapeq Curation Fee",
                                                description: "One-time concierge request curation",
                                                logo: "https://iwedpnipbuurohaqibag.supabase.co/storage/v1/object/public/avatars/lapeq-logo.png",
                                            },
                                        }}
                                        customButton={(props) => (
                                            <TouchableOpacity
                                                onPress={props.onPress}
                                                disabled={props.disabled}
                                                style={{
                                                    backgroundColor: GOLD,
                                                    paddingVertical: 16,
                                                    borderRadius: 16,
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    shadowColor: GOLD,
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.2,
                                                    shadowRadius: 8,
                                                    elevation: 3,
                                                }}
                                                activeOpacity={0.85}
                                            >
                                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#000" }}>
                                                    Pay Booking Fee (₦5,000)
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        onRedirect={async (data) => {
                                            if (data.status === "successful" || data.status === "completed") {
                                                const result = await verifyPayment({
                                                    tx_ref: `CUR-${request.id.replace(/-/g, "").slice(0, 20)}`,
                                                    request_id: request.id,
                                                    expected_amount: 5000,
                                                    payment_type: "curation",
                                                });
                                                if (result?.success) {
                                                    setRequest(prev => prev ? { ...prev, payment_status: "paid" } : prev);
                                                    Alert.alert("Payment Verified", "Your curation booking fee of ₦5,000 has been confirmed. Your concierge is now finalizing your booking details.");
                                                }
                                            } else {
                                                Alert.alert("Payment Cancelled", "The payment process was not completed.");
                                            }
                                        }}
                                    />
                                ) : (
                                    <ActivityIndicator size="small" color={GOLD} />
                                )}
                            </LinearGradient>
                        </View>
                    )}

                    {/* Paid Success Banner */}
                    {request.service_type === "experience" && request.payment_status === "paid" && (
                        <View style={{ marginHorizontal: 20, marginBottom: 20, borderRadius: 16, backgroundColor: "rgba(76,175,80,0.08)", borderWidth: 1, borderColor: "rgba(76,175,80,0.3)", padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(76,175,80,0.15)", alignItems: "center", justifyContent: "center" }}>
                                <Check size={14} color="#4caf50" strokeWidth={3} />
                            </View>
                            <Text style={{ flex: 1, fontSize: 13, color: "#4caf50", fontWeight: "600" }}>
                                Curation Booking Fee (₦5,000) Paid Successfully! Our team is finalizing your reservation.
                            </Text>
                        </View>
                    )}

                    {/* Curated Interactive Suggestions */}
                    {request.details?.curated_options && (
                        <View style={{ marginHorizontal: 20, marginBottom: 20, gap: 14 }}>
                            {request.payment_status === "paid" && request.details.curated_options.selection ? (
                                <View style={{ borderRadius: 20, backgroundColor: "rgba(76,175,80,0.06)", borderWidth: 1, borderColor: "rgba(76,175,80,0.3)", padding: 20, gap: 8 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(76,175,80,0.15)", alignItems: "center", justifyContent: "center" }}>
                                            <Check size={12} color="#4caf50" strokeWidth={3} />
                                        </View>
                                        <Text style={{ fontSize: 11, fontWeight: "800", color: "#4caf50", letterSpacing: 1 }}>BOOKING CONFIRMED</Text>
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>{request.details.curated_options.selection.title}</Text>
                                    <Text style={{ fontSize: 13, color: C.muted }}>Paid ₦{Number(request.details.curated_options.selection.price).toLocaleString()}</Text>
                                </View>
                            ) : (
                                <View style={{ gap: 16 }}>
                                    <Text style={{ fontSize: 11, fontWeight: "800", color: GOLD, letterSpacing: 1.5 }}>RECOMMENDED FOR YOU</Text>
                                    
                                    {request.details.curated_options.recommended && (
                                        <View style={{ borderRadius: 24, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, overflow: "hidden" }}>
                                            {request.details.curated_options.recommended.image ? (
                                                <Image source={{ uri: request.details.curated_options.recommended.image }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
                                            ) : null}
                                            <View style={{ padding: 20, gap: 12 }}>
                                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                                    <View style={{ flex: 1, gap: 4 }}>
                                                        <View style={{ alignSelf: "flex-start", backgroundColor: `${GOLD}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                                            <Text style={{ fontSize: 9, fontWeight: "700", color: GOLD }}>STRONGLY RECOMMENDED</Text>
                                                        </View>
                                                        <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>{request.details.curated_options.recommended.title}</Text>
                                                    </View>
                                                    <Text style={{ fontSize: 18, fontWeight: "800", color: GOLD }}>₦{Number(request.details.curated_options.recommended.price).toLocaleString()}</Text>
                                                </View>
                                                
                                                {request.details.curated_options.recommended.description ? (
                                                    <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18 }}>{request.details.curated_options.recommended.description}</Text>
                                                ) : null}

                                                <TouchableOpacity 
                                                    onPress={() => setPayingOption({ title: request.details.curated_options.recommended.title, price: request.details.curated_options.recommended.price })}
                                                    style={{ backgroundColor: GOLD, paddingVertical: 12, borderRadius: 14, alignItems: "center" }}
                                                    activeOpacity={0.85}
                                                >
                                                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#000" }}>Select & Pay</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}

                                    {request.details.curated_options.suggestions?.length > 0 && (
                                        <View style={{ gap: 10 }}>
                                            <Text style={{ fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 1 }}>ALTERNATIVE OPTIONS</Text>
                                            {request.details.curated_options.suggestions.map((sug: any, idx: number) => (
                                                <View key={idx} style={{ borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                                    <View style={{ flex: 1, gap: 4 }}>
                                                        <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>{sug.title}</Text>
                                                        {sug.description ? <Text style={{ fontSize: 12, color: C.muted }}>{sug.description}</Text> : null}
                                                    </View>
                                                    <View style={{ alignItems: "flex-end", gap: 8 }}>
                                                        <Text style={{ fontSize: 15, fontWeight: "800", color: GOLD }}>₦{Number(sug.price).toLocaleString()}</Text>
                                                        <TouchableOpacity 
                                                            onPress={() => setPayingOption({ title: sug.title, price: sug.price })}
                                                            style={{ backgroundColor: `${GOLD}20`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                                                            activeOpacity={0.85}
                                                        >
                                                            <Text style={{ fontSize: 11, fontWeight: "700", color: GOLD }}>Select</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    )}

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

                        {/* Concierge Response Updates */}
                        {request.notes && (
                            <View style={{ margin: 12, borderRadius: 16, backgroundColor: isDark ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.05)", borderWidth: 1, borderColor: `${GOLD}30`, padding: 16, gap: 6 }}>
                                <Text style={{ fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Concierge Response</Text>
                                <Text style={{ fontSize: 14, color: C.text, lineHeight: 22 }}>
                                    {request.notes}
                                </Text>
                            </View>
                        )}

                        {/* User initial request notes */}
                        {(request.details?.instructions || request.details?.preferences || request.details?.notes || request.details?.specialRequests || request.details?.details) && (
                            <View style={{ margin: 12, borderRadius: 14, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", padding: 16, gap: 6 }}>
                                <Text style={{ fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>My Request Notes</Text>
                                <Text style={{ fontSize: 14, color: C.text, lineHeight: 22 }}>
                                    {request.details?.instructions || request.details?.preferences || request.details?.notes || request.details?.specialRequests || request.details?.details}
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

            {/* Paying Option Checkout Modal */}
            <Modal visible={!!payingOption} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" }}>
                    <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 20, borderTopWidth: 1, borderTopColor: C.border }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Confirm Booking</Text>
                            <TouchableOpacity onPress={() => setPayingOption(null)}>
                                <Text style={{ fontSize: 14, color: GOLD, fontWeight: "600" }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 4 }}>
                            <Text style={{ fontSize: 12, color: C.muted }}>SELECTED OPTION</Text>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: C.text }}>{payingOption?.title}</Text>
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderRadius: 16, padding: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: C.muted }}>Total Amount</Text>
                            <Text style={{ fontSize: 22, fontWeight: "800", color: GOLD }}>₦{Number(payingOption?.price || 0).toLocaleString()}</Text>
                        </View>

                        {verifying ? (
                            <View style={{ paddingVertical: 16, alignItems: "center", gap: 8 }}>
                                <ActivityIndicator size="small" color={GOLD} />
                                <Text style={{ fontSize: 12, color: C.muted }}>Verifying payment with server...</Text>
                            </View>
                        ) : userEmail && payingOption ? (
                            <PayWithFlutterwave
                                options={{
                                    // Deterministic: same option on same request always produces the same tx_ref.
                                    // Prevents duplicate charges if the user re-opens the modal after paying.
                                    tx_ref: `REC-${request.id.replace(/-/g, "").slice(0, 12)}-${payingOption.title.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}`,
                                    authorization: FLW_PUBLIC_KEY,
                                    customer: { email: userEmail, name: userName },
                                    amount: payingOption.price,
                                    currency: "NGN",
                                    payment_options: "card,banktransfer,ussd",
                                    customization: {
                                        title: `Lapeq · ${payingOption.title}`,
                                        description: "Concierge-managed service · Secure checkout",
                                        logo: "https://iwedpnipbuurohaqibag.supabase.co/storage/v1/object/public/avatars/lapeq-logo.png",
                                    },
                                }}
                                customButton={(props) => (
                                    <TouchableOpacity
                                        onPress={props.onPress}
                                        disabled={props.disabled}
                                        style={{
                                            backgroundColor: GOLD,
                                            paddingVertical: 16,
                                            borderRadius: 16,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            shadowColor: GOLD,
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 8,
                                            elevation: 3,
                                        }}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#000" }}>
                                            Pay and Confirm Booking
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                onRedirect={async (data) => {
                                    if (data.status === "successful" || data.status === "completed") {
                                        const txRef = `REC-${request.id.replace(/-/g, "").slice(0, 12)}-${payingOption.title.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}`;
                                        const result = await verifyPayment({
                                            tx_ref: txRef,
                                            request_id: request.id,
                                            expected_amount: payingOption.price,
                                            payment_type: "option",
                                            option_title: payingOption.title,
                                        });
                                        if (result?.success) {
                                            const updatedDetails = {
                                                ...request.details,
                                                curated_options: {
                                                    ...request.details?.curated_options,
                                                    selection: result.selection ?? payingOption,
                                                },
                                            };
                                            setRequest(prev => prev ? { ...prev, payment_status: "paid", details: updatedDetails } : prev);
                                            setPayingOption(null);
                                            Alert.alert("Booking Confirmed", `Your payment of ₦${Number(payingOption.price).toLocaleString()} for ${payingOption.title} has been verified. Your concierge is preparing confirmation passes.`);
                                        }
                                    } else {
                                        Alert.alert("Payment Cancelled", "The payment process was not completed.");
                                    }
                                }}
                            />
                        ) : (
                            <ActivityIndicator size="small" color={GOLD} />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
