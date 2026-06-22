import { useState, useMemo, useRef } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, View, Platform, KeyboardAvoidingView, Keyboard, Modal, Animated } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Check } from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";

const PAIRING_TYPES = ["Investor Matching", "Legal Advisory", "Business Partner", "Executive Recruitment", "Industry Introductions", "Other"];

export default function CorporatePairingScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const [pairingType, setPairingType] = useState("");
    const [industry, setIndustry] = useState("");
    const [company, setCompany] = useState("");
    const [objective, setObjective] = useState("");
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const objY = useRef(0);
    const companyRef = useRef<TextInput>(null);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSubmit = async () => {
        if (!pairingType || !objective) { setShowError(true); return; }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "corporate-pairing",
            status: "pending",
            reference: ref,
            details: { pairingType, industry, company, objective },
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
        <SafeAreaView style={s.root}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backText}>← Back</Text></TouchableOpacity>
                    <Text style={s.title}>Corporate Pairing</Text>
                    <Text style={s.subtitle}>Business introductions and professional connections</Text>

                    <Text style={s.label}>Pairing Type *</Text>
                    <View style={s.chipGrid}>
                        {PAIRING_TYPES.map((t) => (
                            <TouchableOpacity key={t} style={[s.chip, pairingType === t && s.chipActive]} onPress={() => setPairingType(t)}>
                                <Text style={[s.chipText, pairingType === t && s.chipTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={s.label}>Industry / Sector</Text>
                    <TextInput
                        style={s.input}
                        placeholder="e.g. Real Estate, Fintech, FMCG"
                        placeholderTextColor={C.muted}
                        value={industry}
                        onChangeText={setIndustry}
                        returnKeyType="next"
                        onSubmitEditing={() => companyRef.current?.focus()}
                    />

                    <Text style={s.label}>Your Company / Role</Text>
                    <TextInput
                        ref={companyRef}
                        style={s.input}
                        placeholder="e.g. CEO, Lekki Properties Ltd"
                        placeholderTextColor={C.muted}
                        value={company}
                        onChangeText={setCompany}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <Text style={s.label}>Objective *</Text>
                    <VoiceInput
                        placeholder="What are you looking to achieve? Be specific."
                        value={objective}
                        onChange={setObjective}
                        accent={C.primary}
                        textColor={C.text}
                        border={showError && !objective ? "#ef5350" : C.border}
                        inputBg={C.surface}
                    />

                    {showError && (!pairingType || !objective) && (
                        <Text style={s.errorText}>Please fill in all required fields.</Text>
                    )}

                    <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                        <Text style={s.btnText}>{loading ? "Submitting..." : "Submit Request"}</Text>
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={s.modalIcon}><Check size={24} color={C.primary} strokeWidth={2.5} /></View>
                        <Text style={s.modalTitle}>Request Submitted</Text>
                        <Text style={s.modalBody}>Our team will prepare a curated introduction for you shortly.</Text>
                        <TouchableOpacity style={s.modalBtnPri} onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}>
                            <Text style={s.modalBtnTxPri}>View My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSec} onPress={() => { setShowSuccess(false); router.back(); }}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20 },
    backBtn: { paddingVertical: 16 },
    backText: { color: C.primary, fontSize: 14 },
    title: { fontSize: 24, fontWeight: "700", color: C.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: C.muted, marginBottom: 28 },
    label: { fontSize: 12, fontWeight: "600", color: C.text, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, marginBottom: 18 },
    inputError: { borderColor: "#ef5350" },
    textarea: { height: 110, textAlignVertical: "top" },
    chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 12, color: C.text },
    chipTextActive: { color: C.background },
    errorText: { fontSize: 13, color: "#ef5350", marginBottom: 12, textAlign: "center" },
    btn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center" },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: C.background, fontSize: 15, fontWeight: "700" },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.background, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: C.primary, alignItems: "center" },
    modalIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1e1e1e", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary, alignItems: "center" },
    modalBtnTxPri: { color: C.background, fontSize: 14, fontWeight: "700" },
    modalBtnSec: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },
});
