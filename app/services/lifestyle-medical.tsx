import { useState, useMemo, useRef } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Animated, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Check, Heart } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

const GOLD = "#c9a84c";

const CARE_TYPES = ["GP Appointment", "Specialist Referral", "Full Health Check", "Mental Health", "Dental", "Eye Care", "Medical Tourism", "Emergency Abroad", "Other"];
const LOCATIONS = ["Lagos", "Abuja", "Port Harcourt", "Akwa Ibom", "Kano"];
const URGENCY = ["Flexible", "This Week", "Today / Urgent"];
const GENDER_PREF = ["No Preference", "Male Doctor", "Female Doctor"];

export default function MedicalConciergeScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [careType, setCareType] = useState("");
    const [location, setLocation] = useState("");
    const [urgency, setUrgency] = useState("Flexible");
    const [genderPref, setGenderPref] = useState("No Preference");
    const [hasInsurance, setHasInsurance] = useState<boolean | null>(null);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSubmit = async () => {
        if (!careType || description.trim().length < 5) {
            Alert.alert("Add Details", "Please select a care type and briefly describe what you need.");
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "lifestyle-medical",
            status: "pending",
            reference: ref,
            title: `Medical Concierge - ${careType}`,
            details: { careType, location, urgency, genderPref, hasInsurance, description },
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
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 80 }}>

                    {/* Hero - clean clinical design, no photo */}
                    <View style={s.hero}>
                        <View style={s.heroBg}>
                            <View style={s.heroPulse1} />
                            <View style={s.heroPulse2} />
                        </View>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                            <ChevronLeft size={22} color={C.text} />
                        </TouchableOpacity>
                        <View style={s.heroContent}>
                            <View style={s.heroIconWrap}>
                                <Heart size={32} color={GOLD} fill={`${GOLD}30`} />
                            </View>
                            <Text style={s.heroEyebrow}>HEALTH & WELLNESS</Text>
                            <Text style={s.heroTitle}>Medical Concierge</Text>
                            <Text style={s.heroSub}>Private healthcare access. All details handled with absolute discretion.</Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Type of Care</Text>
                        <View style={s.wrapRow}>
                            {CARE_TYPES.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[s.chip, careType === c && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setCareType(c)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.chipText, careType === c && { color: "#0a0a0a", fontWeight: "700" }]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {careType === "Other" && (
                        <View style={s.section}>
                            <Text style={s.label}>Describe Your Needs</Text>
                            <Text style={s.sublabel}>Share as much or as little as you are comfortable with. Everything stays private.</Text>
                            <VoiceInput
                                placeholder="What symptoms, concerns, or requirements should we know about..."
                                value={description}
                                onChange={setDescription}
                                accent={GOLD}
                                textColor={C.text}
                                border={isDark ? "#2a2a2a" : "#e0dbd2"}
                                inputBg={C.surface}
                            />
                        </View>
                    )}

                    <View style={s.section}>
                        <Text style={s.label}>Preferred Location</Text>
                        <View style={s.wrapRow}>
                            {LOCATIONS.map(loc => {
                                const isAvailable = loc === "Lagos" || loc === "Abuja";
                                const displayLabel = isAvailable ? loc : `${loc} (Coming Soon)`;
                                return (
                                    <TouchableOpacity
                                        key={loc}
                                        style={[s.chip, location === loc && { backgroundColor: GOLD, borderColor: GOLD }]}
                                        onPress={() => setLocation(loc)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[s.chipText, location === loc && { color: "#0a0a0a", fontWeight: "700" }]}>{displayLabel}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>How Soon?</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            {URGENCY.map(u => (
                                <TouchableOpacity
                                    key={u}
                                    style={[s.pill, urgency === u && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setUrgency(u)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.pillText, urgency === u && { color: "#0a0a0a", fontWeight: "700" }]}>{u}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Doctor Preference</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            {GENDER_PREF.map(g => (
                                <TouchableOpacity
                                    key={g}
                                    style={[s.pill, genderPref === g && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setGenderPref(g)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.pillText, genderPref === g && { color: "#0a0a0a", fontWeight: "700" }]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Do you have health insurance?</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            {([true, false] as const).map(v => (
                                <TouchableOpacity
                                    key={String(v)}
                                    style={[s.pill, hasInsurance === v && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setHasInsurance(v)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.pillText, hasInsurance === v && { color: "#0a0a0a", fontWeight: "700" }]}>{v ? "Yes" : "No"}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.feeCard}>
                        <Text style={s.feeEyebrow}>SERVICE FEE</Text>
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                            <Text style={s.feeAmount}>₦5,000</Text>
                            <Text style={s.feeNote}>per request</Text>
                        </View>
                        <Text style={s.feeSub}>Collected upon confirmation of your request.</Text>
                    </View>

                    <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
                        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                            <Text style={s.submitText}>{loading ? "Submitting..." : "Submit Request"}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIcon, { backgroundColor: `${GOLD}18` }]}><Check size={28} color={GOLD} strokeWidth={2} /></View>
                        <Text style={s.modalTitle}>Request Received</Text>
                        <Text style={s.modalBody}>Your concierge will arrange the appropriate healthcare contact within 2 hours. Everything remains confidential.</Text>
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
    hero: { paddingTop: 60, paddingBottom: 36, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#1a1a1a" : "#ede9e1", position: "relative" },
    heroBg: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
    heroPulse1: { position: "absolute", width: 300, height: 300, borderRadius: 150, borderWidth: 1, borderColor: `${GOLD}12`, top: -80, right: -80 },
    heroPulse2: { position: "absolute", width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: `${GOLD}08`, top: -30, right: -30 },
    backBtn: { position: "absolute", top: 16, left: 20, width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", alignItems: "center", justifyContent: "center" },
    heroContent: { alignItems: "center", paddingHorizontal: 32 },
    heroIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${GOLD}15`, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 28, fontWeight: "700", color: C.text, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 8, textAlign: "center" },
    heroSub: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },
    section: { paddingHorizontal: 24, paddingTop: 28 },
    label: { fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 },
    sublabel: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 14 },
    wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.background },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    pill: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.background, alignItems: "center" },
    pillText: { fontSize: 13, fontWeight: "600", color: C.muted },
    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 18, fontSize: 15, color: C.text, minHeight: 140, lineHeight: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    feeCard: { marginHorizontal: 24, marginTop: 28, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` },
    feeEyebrow: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 6 },
    feeAmount: { fontSize: 22, fontWeight: "800", color: GOLD },
    feeNote: { fontSize: 13, color: C.muted, fontWeight: "600" },
    feeSub: { fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 16 },
    submitBtn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    submitText: { color: "#0a0a0a", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center" },
    modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 24 },
    modalTitle: { color: C.text, fontSize: 24, fontWeight: "800", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: GOLD, alignItems: "center", marginBottom: 12 },
    modalBtnTxPri: { color: "#0a0a0a", fontSize: 15, fontWeight: "700" },
    modalBtnSec: { width: "100%", paddingVertical: 14, alignItems: "center" },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },
});
