import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Platform,
} from "react-native";
import { X, Plus, Minus, Check, MapPin, Clock } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

interface DetailQuickRequestModalProps {
    visible: boolean;
    item: {
        id: string;
        title: string;
        body?: string | null;
        image_url?: string | null;
        category?: string | null;
        city?: string | null;
        tag?: string | null;
        opening_hours?: string | null;
        bullet_points?: string | null;
    } | null;
    onClose: () => void;
}

export default function DetailQuickRequestModal({
    visible,
    item,
    onClose,
}: DetailQuickRequestModalProps) {
    const { C, theme } = useTheme();
    const [mode, setMode] = useState<"detail" | "form" | "success">("detail");

    // Form states
    const [dateTime, setDateTime] = useState("");
    const [guests, setGuests] = useState(2);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [requireTransport, setRequireTransport] = useState(false);
    const [transportType, setTransportType] = useState<"jet" | "car" | "none">("none");

    // Reset state on modal close or open
    useEffect(() => {
        if (visible) {
            setMode("detail");
            setDateTime("");
            setGuests(2);
            setNotes("");
            setLoading(false);
            setRequireTransport(false);
            setTransportType("none");
        }
    }, [visible, item]);

    if (!item) return null;

    const handleSubmit = async () => {
        if (!dateTime.trim()) {
            alert("Please enter a preferred date and time.");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch user membership tier to determine payment_status
            let userTier = "free";
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("tier")
                .eq("id", user?.id)
                .single();
            if (profileError) console.warn("Failed to fetch profile tier:", profileError);
            if (profile?.tier) {
                userTier = profile.tier.toLowerCase();
            }

            const hasPremiumMembership = ["silver", "gold", "black"].includes(userTier);
            const ref = "REQ-" + Date.now().toString(36).toUpperCase().slice(-5);

            const cat = (item.category || "").toLowerCase();
            let serviceType = "lifestyle-travel";
            if (cat.includes("restaurant") || cat.includes("lounge") || cat.includes("dining")) {
                serviceType = "Private Dining";
            } else if (cat.includes("hotel") || cat.includes("stay") || cat.includes("accommodation")) {
                serviceType = "Stays & Accommodations";
            }

            const { error } = await supabase.from("requests").insert({
                user_id: user?.id,
                service_type: "lifestyle-travel",
                status: "pending",
                reference: ref,
                title: `${serviceType}: Plan ${item.title}`,
                payment_status: hasPremiumMembership ? "paid" : "unpaid",
                details: {
                    city: item.city,
                    venue_name: item.title,
                    category: item.category,
                    tag: item.tag,
                    date_time: dateTime,
                    guests: guests,
                    notes: notes.trim(),
                    plan_this_for_me: true,
                    require_transport: requireTransport,
                    transport_type: requireTransport ? transportType : "none"
                },
            });

            if (error) {
                alert("Error: " + error.message);
            } else {
                setMode("success");
            }
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={s.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
                <View style={[s.container, { backgroundColor: C.surface, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }]}>
                    
                    {/* Close Button */}
                    <TouchableOpacity 
                        style={s.closeBtn}
                        onPress={onClose}
                    >
                        <X size={16} color="#fff" />
                    </TouchableOpacity>

                    {mode === "detail" && (
                        <>
                            {item.image_url && (
                                <Image source={{ uri: item.image_url }} style={s.image} resizeMode="cover" />
                            )}
                            <View style={s.content}>
                                <View style={s.headerRow}>
                                    <Text style={[s.title, { color: C.text }]} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                    {item.category && (
                                        <Text style={[s.category, { color: C.primary }]}>
                                            {item.category}
                                        </Text>
                                    )}
                                </View>
                                
                                <View style={s.metaRow}>
                                    {item.city && (
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                            <MapPin size={13} color={C.muted} />
                                            <Text style={[s.metaText, { color: C.muted }]}>
                                                {item.city}
                                            </Text>
                                        </View>
                                    )}
                                    {item.opening_hours && (
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                            <Clock size={13} color={C.primary} />
                                            <Text style={[s.metaTextPrimary, { color: C.primary }]}>
                                                {item.opening_hours}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <ScrollView style={s.scroll}>
                                    <Text style={[s.bodyText, { color: C.text }]}>
                                        {item.body || "No additional description details provided."}
                                    </Text>

                                    {item.bullet_points && (
                                        <View style={[s.bulletsContainer, { borderTopColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
                                            {item.bullet_points.split("\n").filter(b => b.trim() !== "").map((bullet, idx) => (
                                                <View key={idx} style={s.bulletRow}>
                                                    <Text style={[s.bulletDot, { color: C.primary }]}>•</Text>
                                                    <Text style={[s.bulletText, { color: C.muted }]}>{bullet.replace(/^[•\s*-]+/, "")}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </ScrollView>

                                <TouchableOpacity
                                    style={[s.submitBtn, { backgroundColor: C.primary }]}
                                    onPress={() => setMode("form")}
                                >
                                    <Text style={s.submitBtnText}>Let LAPEQ Plan This For Me</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {mode === "form" && (
                        <View style={s.content}>
                            <Text style={[s.formHeaderTitle, { color: C.text }]}>Request Details</Text>
                            <Text style={[s.formHeaderSub, { color: C.muted }]}>Let us coordinate your experience at {item.title}</Text>

                            <ScrollView style={s.formScroll} keyboardShouldPersistTaps="handled">
                                {/* Date & Time input */}
                                <View style={s.inputContainer}>
                                    <Text style={[s.inputLabel, { color: C.muted }]}>When would you like this?</Text>
                                    <TextInput
                                        style={[s.input, { color: C.text, backgroundColor: C.background, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }]}
                                        placeholder="e.g., Saturday at 8 PM, or Tomorrow, 7:30 PM"
                                        placeholderTextColor={theme === "dark" ? "#555" : "#999"}
                                        value={dateTime}
                                        onChangeText={setDateTime}
                                    />
                                </View>

                                {/* Guest Count input */}
                                <View style={s.inputContainer}>
                                    <Text style={[s.inputLabel, { color: C.muted }]}>Number of guests</Text>
                                    <View style={s.counterRow}>
                                        <TouchableOpacity 
                                            style={[s.counterBtn, { backgroundColor: C.background, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }]}
                                            onPress={() => setGuests(g => Math.max(1, g - 1))}
                                        >
                                            <Minus size={16} color={C.text} />
                                        </TouchableOpacity>
                                        <Text style={[s.counterVal, { color: C.text }]}>{guests}</Text>
                                        <TouchableOpacity 
                                            style={[s.counterBtn, { backgroundColor: C.background, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }]}
                                            onPress={() => setGuests(g => g + 1)}
                                        >
                                            <Plus size={16} color={C.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Transport option */}
                                {item.city && (
                                    <View style={s.inputContainer}>
                                        <Text style={[s.inputLabel, { color: C.muted }]}>Do you require travel/transport to {item.city}?</Text>
                                        <View style={s.transportToggleRow}>
                                            <TouchableOpacity
                                                style={[
                                                    s.toggleOpt,
                                                    !requireTransport && s.toggleOptActive,
                                                    { borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }
                                                ]}
                                                onPress={() => {
                                                    setRequireTransport(false);
                                                    setTransportType("none");
                                                }}
                                            >
                                                <Text style={[s.toggleOptText, !requireTransport && s.toggleOptTextActive, { color: !requireTransport ? "#000" : C.text }]}>No</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    s.toggleOpt,
                                                    requireTransport && s.toggleOptActive,
                                                    { borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }
                                                ]}
                                                onPress={() => {
                                                    setRequireTransport(true);
                                                    setTransportType("car"); // default option
                                                }}
                                            >
                                                <Text style={[s.toggleOptText, requireTransport && s.toggleOptTextActive, { color: requireTransport ? "#000" : C.text }]}>Yes</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {requireTransport && (
                                            <View style={[s.transportTypeContainer, { borderColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
                                                <Text style={[s.inputLabelSub, { color: C.muted }]}>Preferred Mode of Transport</Text>
                                                <View style={s.transportTypeRow}>
                                                    <TouchableOpacity
                                                        style={[
                                                            s.transportTypeCard,
                                                            transportType === "car" && s.transportTypeCardActive,
                                                            { backgroundColor: C.background, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }
                                                        ]}
                                                        onPress={() => setTransportType("car")}
                                                    >
                                                        <Text style={[s.transportTypeText, { color: C.text }, transportType === "car" && { color: "#c9a84c" }]}>Chauffeur / Drive</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[
                                                            s.transportTypeCard,
                                                            transportType === "jet" && s.transportTypeCardActive,
                                                            { backgroundColor: C.background, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }
                                                        ]}
                                                        onPress={() => setTransportType("jet")}
                                                    >
                                                        <Text style={[s.transportTypeText, { color: C.text }, transportType === "jet" && { color: "#c9a84c" }]}>Jet / Flight</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Notes input */}
                                <View style={s.inputContainer}>
                                    <Text style={[s.inputLabel, { color: C.muted }]}>Special Requests / Notes</Text>
                                    <TextInput
                                        style={[s.textarea, { color: C.text, backgroundColor: C.background, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }]}
                                        placeholder="e.g., outdoor seating preference, allergies, special arrangements..."
                                        placeholderTextColor={theme === "dark" ? "#555" : "#999"}
                                        multiline
                                        numberOfLines={3}
                                        value={notes}
                                        onChangeText={setNotes}
                                    />
                                </View>
                            </ScrollView>

                            <View style={s.formActions}>
                                <TouchableOpacity 
                                    style={[s.backBtnForm, { borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }]}
                                    onPress={() => setMode("detail")}
                                    disabled={loading}
                                >
                                    <Text style={[s.backBtnFormText, { color: C.text }]}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[s.submitBtnForm, { backgroundColor: C.primary }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#000" />
                                    ) : (
                                        <Text style={s.submitBtnFormText}>Submit Request</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {mode === "success" && (
                        <View style={[s.content, s.successContent]}>
                            <View style={[s.successIconWrap, { backgroundColor: `${C.primary}15` }]}>
                                <Check size={24} color={C.primary} />
                            </View>
                            <Text style={[s.successTitle, { color: C.text }]}>Request Submitted</Text>
                            <Text style={[s.successDesc, { color: C.muted }]}>
                                Your concierge has received your request and will contact you shortly with coordinates.
                            </Text>
                            <TouchableOpacity 
                                style={[s.successBtn, { backgroundColor: C.primary }]}
                                onPress={onClose}
                            >
                                <Text style={s.successBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
    container: { width: "100%", maxWidth: 400, borderRadius: 24, overflow: "hidden", borderWidth: 1, position: "relative" },
    closeBtn: { position: "absolute", top: 12, right: 12, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    image: { width: "100%", height: 200 },
    content: { padding: 20 },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    title: { fontSize: 18, fontWeight: "700", flex: 1, marginRight: 8 },
    category: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
    metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
    metaText: { fontSize: 13 },
    metaTextPrimary: { fontSize: 13, fontWeight: "600" },
    scroll: { maxHeight: 200, marginBottom: 20 },
    bodyText: { fontSize: 13, lineHeight: 22 },
    bulletsContainer: { marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
    bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 6 },
    bulletDot: { fontSize: 13, lineHeight: 20 },
    bulletText: { fontSize: 13, lineHeight: 20, flex: 1 },
    submitBtn: { width: "100%", paddingVertical: 14, borderRadius: 16, alignItems: "center", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    submitBtnText: { fontSize: 14, fontWeight: "800", color: "#000", letterSpacing: 0.5 },
    
    // Form views
    formHeaderTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
    formHeaderSub: { fontSize: 13, marginBottom: 20 },
    formScroll: { maxHeight: 300, marginBottom: 20 },
    inputContainer: { marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
    input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 14 },
    textarea: { height: 80, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingTop: 12, fontSize: 14, textAlignVertical: "top" },
    counterRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    counterBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    counterVal: { fontSize: 16, fontWeight: "700", width: 24, textAlign: "center" },
    formActions: { flexDirection: "row", gap: 12 },
    backBtnForm: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    backBtnFormText: { fontSize: 14, fontWeight: "700" },
    submitBtnForm: { flex: 2, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    submitBtnFormText: { fontSize: 14, fontWeight: "800", color: "#000" },
    
    // Success view
    successContent: { alignItems: "center", paddingVertical: 24 },
    successIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    successTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
    successDesc: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24, paddingHorizontal: 12 },
    successBtn: { width: "100%", height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    successBtnText: { fontSize: 14, fontWeight: "800", color: "#000" },
    
    // Transport styles
    transportToggleRow: { flexDirection: "row", gap: 10, marginTop: 4 },
    toggleOpt: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    toggleOptActive: { backgroundColor: "#c9a84c", borderColor: "#c9a84c" },
    toggleOptText: { fontSize: 13, fontWeight: "600" },
    toggleOptTextActive: { fontWeight: "700" },
    transportTypeContainer: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.015)", borderWidth: 1 },
    inputLabelSub: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
    transportTypeRow: { flexDirection: "row", gap: 10 },
    transportTypeCard: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    transportTypeCardActive: { borderColor: "#c9a84c" },
    transportTypeText: { fontSize: 12, fontWeight: "600" }
});
