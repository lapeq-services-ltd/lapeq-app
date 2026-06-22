import { useState, useMemo, useRef } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, View, Platform, KeyboardAvoidingView, Keyboard, Modal, Animated } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Paperclip, Check } from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";

const REQUEST_TYPES = ["Sourcing", "Event Planning", "Reservations", "Gifting", "Other"];

export default function ConciergeRequestScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const [requestType, setRequestType] = useState("");
    const [description, setDescription] = useState("");
    const [preferredTime, setPreferredTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const descY = useRef(0);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSubmit = async () => {
        if (!requestType || !description) { setShowError(true); return; }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "general-concierge",
            status: "pending",
            reference: ref,
            details: { requestType, description, preferredTime },
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
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Text style={s.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={s.title}>General Request</Text>
                    <Text style={s.subtitle}>Let us know how we can assist you today.</Text>

                    <Text style={s.label}>Request Type *</Text>
                    <View style={s.chipGrid}>
                        {REQUEST_TYPES.map((t) => (
                            <TouchableOpacity key={t} style={[s.chip, requestType === t && s.chipActive]} onPress={() => setRequestType(t)}>
                                <Text style={[s.chipText, requestType === t && s.chipTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={s.label} onLayout={e => { descY.current = e.nativeEvent.layout.y; }}>Description *</Text>
                    <VoiceInput
                        placeholder="Provide details about your request..."
                        value={description}
                        onChange={setDescription}
                        accent={C.primary}
                        textColor={C.text}
                        border={showError && !description ? "#ef5350" : C.border}
                        inputBg={C.surface}
                    />

                    <Text style={s.label}>Preferred Time (Optional)</Text>
                    <TextInput
                        style={s.input}
                        placeholder="e.g. Asap, Tomorrow at 2 PM"
                        placeholderTextColor={C.muted}
                        value={preferredTime}
                        onChangeText={setPreferredTime}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <TouchableOpacity style={s.attachmentBtn}>
                        <Paperclip size={20} color={C.muted} style={{ marginRight: 8 }} />
                        <Text style={s.attachmentText}>Upload Image or Document</Text>
                    </TouchableOpacity>

                    {showError && (!requestType || !description) && (
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
                        <Text style={s.modalBody}>Your concierge will review your request shortly.</Text>
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
    textarea: { height: 100, textAlignVertical: "top" },
    chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 12, color: C.text },
    chipTextActive: { color: C.background },
    attachmentBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 24 },
    attachmentText: { fontSize: 14, color: C.muted, fontWeight: "500" },
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
