import { useState, useMemo, useRef } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, Modal, Animated, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Check } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

const SERVICE_META: Record<string, { label: string; placeholder: string; eyebrow: string }> = {
    legal: {
        label: "Legal Advisory",
        eyebrow: "LEGAL",
        placeholder: "Describe what you need - contract review, business registration, dispute resolution, a referral to a specific type of lawyer...",
    },
    gifts: {
        label: "Gift & Florals",
        eyebrow: "GIFTS",
        placeholder: "What's the occasion? Who is it for? Any preferences - flowers, luxury hamper, personalised gift? Delivery date and location...",
    },
    recreation: {
        label: "Recreational Activities",
        eyebrow: "RECREATION",
        placeholder: "What activity? Solo or group? Preferred date and location. Any experience level or requirements...",
    },
    medical: {
        label: "Medical Concierge",
        eyebrow: "MEDICAL",
        placeholder: "What do you need - GP appointment, specialist referral, health check, medical travel? Location and preferred dates...",
    },
    property: {
        label: "Home & Property",
        eyebrow: "PROPERTY",
        placeholder: "Buying, renting, or interior design? Location, budget range, and any specific requirements...",
    },
    finance: {
        label: "Financial Advisory",
        eyebrow: "FINANCE",
        placeholder: "What type of advice - investment, tax, wealth management, business finance? Any specific goals or timeframes...",
    },
    photography: {
        label: "Photography & Content",
        eyebrow: "PHOTOGRAPHY",
        placeholder: "What type of shoot? Event, portrait, content creation? Date, location, and number of people involved...",
    },
    family: {
        label: "Childcare & Family",
        eyebrow: "FAMILY",
        placeholder: "What do you need - nanny, school search, tutoring, family planning? Any specific requirements or preferences...",
    },
    request: {
        label: "Bespoke Request",
        eyebrow: "BESPOKE REQUEST",
        placeholder: "Tell us exactly what you need. Any custom request, reservation, sourcing, or premium service - your concierge is at your service...",
    },
};

const URGENCY = ["Flexible", "This week", "Today"];

export default function LifestyleRequestScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const { service } = useLocalSearchParams<{ service: string }>();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const meta = SERVICE_META[service ?? ""] ?? SERVICE_META.legal;

    const [details, setDetails] = useState("");
    const [urgency, setUrgency] = useState("Flexible");
    const [contact, setContact] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSubmit = async () => {
        if (details.trim().length < 10) {
            Alert.alert("Add Details", "Please describe what you need so we can help you properly.");
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: `lifestyle-${service}`,
            status: "pending",
            reference: ref,
            title: meta.label,
            details: { service, details, urgency, contact },
        });
        setLoading(false);
        if (!error) {
            setShowSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        }
    };

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>

                    <View style={s.header}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                            <ChevronLeft size={22} color={C.text} />
                        </TouchableOpacity>
                        <View>
                            <Text style={s.eyebrow}>{meta.eyebrow}</Text>
                            <Text style={s.title}>{meta.label}</Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Tell us what you need</Text>
                        <Text style={s.sublabel}>The more detail you give, the faster we can match you with the right partner.</Text>
                        <VoiceInput
                            placeholder={meta.placeholder}
                            value={details}
                            onChange={setDetails}
                            accent={C.primary}
                            textColor={C.text}
                            border={theme === "dark" ? "#2a2a2a" : "#e0dbd2"}
                            inputBg={C.surface}
                        />
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>How soon do you need this?</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            {URGENCY.map(u => (
                                <TouchableOpacity
                                    key={u}
                                    style={[s.pill, urgency === u && { backgroundColor: C.primary, borderColor: C.primary }]}
                                    onPress={() => setUrgency(u)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.pillText, urgency === u && { color: "#0a0a0a", fontWeight: "700" }]}>{u}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Preferred contact (optional)</Text>
                        <Text style={s.sublabel}>Phone or email if different from your account.</Text>
                        <TextInput
                            style={s.input}
                            placeholder="e.g. +234 800 000 0000"
                            placeholderTextColor={theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)"}
                            value={contact}
                            onChangeText={setContact}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
                        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                            <Text style={s.submitText}>{loading ? "Sending..." : "Submit Request"}</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIcon, { backgroundColor: `${C.primary}18` }]}>
                            <Check size={28} color={C.primary} strokeWidth={2} />
                        </View>
                        <Text style={s.modalTitle}>Request Received</Text>
                        <Text style={s.modalBody}>Your concierge will review your request and connect you with the right partner shortly.</Text>
                        <TouchableOpacity style={s.modalBtnPri} onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}>
                            <Text style={s.modalBtnTxPri}>View Request</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSec} onPress={() => { setShowSuccess(false); router.back(); router.back(); }}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", alignItems: "center", justifyContent: "center" },
    eyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2.5, marginBottom: 2 },
    title: { fontSize: 26, fontWeight: "700", color: C.text, fontFamily: "PlayfairDisplay_700Bold" },
    section: { paddingHorizontal: 24, paddingTop: 24 },
    label: { fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 },
    sublabel: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 14 },
    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 18, fontSize: 15, color: C.text, minHeight: 160, lineHeight: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    input: { backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    pill: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center" },
    pillText: { fontSize: 13, fontWeight: "600", color: C.muted },
    submitBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    submitText: { color: "#0a0a0a", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center" },
    modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 24 },
    modalTitle: { color: C.text, fontSize: 24, fontWeight: "800", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: C.primary, alignItems: "center", marginBottom: 12 },
    modalBtnTxPri: { color: "#0a0a0a", fontSize: 15, fontWeight: "700" },
    modalBtnSec: { width: "100%", paddingVertical: 14, alignItems: "center" },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },
});
