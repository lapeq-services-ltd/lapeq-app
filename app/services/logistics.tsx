import { useState, useMemo, useRef } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, View, Platform, KeyboardAvoidingView, Keyboard, Modal, Animated } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Check } from "lucide-react-native";

export default function LogisticsScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const [itemDesc, setItemDesc] = useState("");
    const [pickup, setPickup] = useState("");
    const [delivery, setDelivery] = useState("");
    const [date, setDate] = useState("");
    const [fragile, setFragile] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const notesY = useRef(0);
    const pickupRef = useRef<TextInput>(null);
    const deliveryRef = useRef<TextInput>(null);
    const dateRef = useRef<TextInput>(null);
    const notesRef = useRef<TextInput>(null);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSubmit = async () => {
        if (!itemDesc || !pickup || !delivery || !date) { setShowError(true); return; }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "logistics",
            status: "pending",
            reference: ref,
            details: { itemDesc, pickup, delivery, date, fragile, notes },
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
                    <Text style={s.title}>Logistics</Text>
                    <Text style={s.subtitle}>Pickup, delivery & item movement</Text>

                    <Text style={s.label}>Item Description *</Text>
                    <TextInput
                        style={[s.input, showError && !itemDesc && s.inputError]}
                        placeholder="What needs to be moved?"
                        placeholderTextColor={C.muted}
                        value={itemDesc}
                        onChangeText={setItemDesc}
                        returnKeyType="next"
                        onSubmitEditing={() => pickupRef.current?.focus()}
                    />

                    <Text style={s.label}>Pickup Address *</Text>
                    <TextInput
                        ref={pickupRef}
                        style={[s.input, showError && !pickup && s.inputError]}
                        placeholder="Where to collect from"
                        placeholderTextColor={C.muted}
                        value={pickup}
                        onChangeText={setPickup}
                        returnKeyType="next"
                        onSubmitEditing={() => deliveryRef.current?.focus()}
                    />

                    <Text style={s.label}>Delivery Address *</Text>
                    <TextInput
                        ref={deliveryRef}
                        style={[s.input, showError && !delivery && s.inputError]}
                        placeholder="Where to deliver to"
                        placeholderTextColor={C.muted}
                        value={delivery}
                        onChangeText={setDelivery}
                        returnKeyType="next"
                        onSubmitEditing={() => dateRef.current?.focus()}
                    />

                    <Text style={s.label}>Preferred Date *</Text>
                    <TextInput
                        ref={dateRef}
                        style={[s.input, showError && !date && s.inputError]}
                        placeholder="e.g. 20 March 2025"
                        placeholderTextColor={C.muted}
                        value={date}
                        onChangeText={setDate}
                        returnKeyType="next"
                        onSubmitEditing={() => notesRef.current?.focus()}
                    />

                    <TouchableOpacity style={s.toggleRow} onPress={() => setFragile(v => !v)}>
                        <Text style={s.label}>Fragile items?</Text>
                        <View style={[s.toggle, fragile && s.toggleActive]}>
                            <Text style={[s.toggleText, fragile && s.toggleTextActive]}>{fragile ? "Yes" : "No"}</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={s.label} onLayout={e => { notesY.current = e.nativeEvent.layout.y; }}>Notes</Text>
                    <TextInput
                        ref={notesRef}
                        style={[s.input, s.textarea]}
                        placeholder="Any special handling instructions..."
                        placeholderTextColor={C.muted}
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                        returnKeyType="done"
                        blurOnSubmit
                        onSubmitEditing={() => Keyboard.dismiss()}
                        onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: notesY.current - 80, animated: true }), 350)}
                    />

                    {showError && (!itemDesc || !pickup || !delivery || !date) && (
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
                        <Text style={s.modalBody}>Your concierge will confirm the logistics shortly.</Text>
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
    textarea: { height: 90, textAlignVertical: "top" },
    toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
    toggle: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    toggleActive: { backgroundColor: C.primary, borderColor: C.primary },
    toggleText: { fontSize: 13, color: C.muted, fontWeight: "600" },
    toggleTextActive: { color: C.background },
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
