import { useState, useMemo, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Keyboard, Modal, Animated } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Check } from "lucide-react-native";

export default function ProjectTrustScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const [projectName, setProjectName] = useState("");
    const [address, setAddress] = useState("");
    const [contractorName, setContractorName] = useState("");
    const [inspectionFrequency, setInspectionFrequency] = useState("Weekly");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const frequencies = ["Weekly", "Bi-weekly", "Monthly"];

    const scrollRef = useRef<ScrollView>(null);
    const notesY = useRef(0);
    const addressRef = useRef<TextInput>(null);
    const contractorRef = useRef<TextInput>(null);
    const notesRef = useRef<TextInput>(null);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSubmit = async () => {
        if (!projectName || !address) { setShowError(true); return; }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "project-trust",
            status: "pending",
            reference: ref,
            details: { projectName, address, contractorName, inspectionFrequency, notes },
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
                    <Text style={s.title}>Project Trust</Text>
                    <Text style={s.subtitle}>Independent construction oversight & weekly reporting</Text>

                    <Text style={s.label}>Project Name *</Text>
                    <TextInput
                        style={[s.input, showError && !projectName && s.inputError]}
                        placeholder="e.g. Lekki Duplex Build"
                        placeholderTextColor={C.muted}
                        value={projectName}
                        onChangeText={setProjectName}
                        returnKeyType="next"
                        onSubmitEditing={() => addressRef.current?.focus()}
                    />

                    <Text style={s.label}>Project Address *</Text>
                    <TextInput
                        ref={addressRef}
                        style={[s.input, showError && !address && s.inputError]}
                        placeholder="Full address of the construction site"
                        placeholderTextColor={C.muted}
                        value={address}
                        onChangeText={setAddress}
                        returnKeyType="next"
                        onSubmitEditing={() => contractorRef.current?.focus()}
                    />

                    <Text style={s.label}>Contractor Name</Text>
                    <TextInput
                        ref={contractorRef}
                        style={s.input}
                        placeholder="Name of contractor (if known)"
                        placeholderTextColor={C.muted}
                        value={contractorName}
                        onChangeText={setContractorName}
                        returnKeyType="next"
                        onSubmitEditing={() => notesRef.current?.focus()}
                    />

                    <Text style={s.label}>Inspection Frequency</Text>
                    <View style={s.chipRow}>
                        {frequencies.map((f) => (
                            <TouchableOpacity key={f} style={[s.chip, inspectionFrequency === f && s.chipActive]} onPress={() => setInspectionFrequency(f)}>
                                <Text style={[s.chipText, inspectionFrequency === f && s.chipTextActive]}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={s.label} onLayout={e => { notesY.current = e.nativeEvent.layout.y; }}>Additional Notes</Text>
                    <TextInput
                        ref={notesRef}
                        style={[s.input, s.textarea]}
                        placeholder="Any specific concerns or requirements..."
                        placeholderTextColor={C.muted}
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                        returnKeyType="done"
                        blurOnSubmit
                        onSubmitEditing={() => Keyboard.dismiss()}
                        onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: notesY.current - 80, animated: true }), 350)}
                    />

                    <View style={s.infoBox}>
                        <Text style={s.infoTitle}>What's included</Text>
                        <Text style={s.infoText}>• Weekly site visit reports{"\n"}• Date-stamped photography{"\n"}• Materials & worker verification{"\n"}• Drone footage (where applicable){"\n"}• Uploaded directly to your app</Text>
                    </View>

                    {showError && (!projectName || !address) && (
                        <Text style={s.errorText}>Please fill in all required fields.</Text>
                    )}

                    <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                        <Text style={s.btnText}>{loading ? "Submitting..." : "Submit Project"}</Text>
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={s.modalIcon}><Check size={24} color={C.primary} strokeWidth={2.5} /></View>
                        <Text style={s.modalTitle}>Project Submitted</Text>
                        <Text style={s.modalBody}>Your oversight team will be in touch to confirm details.</Text>
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
    label: { fontSize: 12, fontWeight: "600", color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, marginBottom: 18 },
    inputError: { borderColor: "#ef5350" },
    textarea: { height: 100, textAlignVertical: "top" },
    chipRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 13, color: C.text },
    chipTextActive: { color: C.background },
    infoBox: { backgroundColor: C.black, borderRadius: 16, padding: 16, marginBottom: 24 },
    infoTitle: { fontSize: 13, fontWeight: "700", color: C.primary, marginBottom: 8 },
    infoText: { fontSize: 12, color: "rgba(240,236,228,0.7)", lineHeight: 20 },
    errorText: { fontSize: 13, color: "#ef5350", marginBottom: 12, textAlign: "center" },
    btn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center" },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: C.background, fontSize: 15, fontWeight: "700" },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.background, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: C.primary, alignItems: "center" },
    modalIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(201,168,76,0.1)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary, alignItems: "center" },
    modalBtnTxPri: { color: C.background, fontSize: 14, fontWeight: "700" },
    modalBtnSec: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },
});
