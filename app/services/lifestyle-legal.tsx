import { useState, useMemo, useRef } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Animated, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Check, Scale, ChevronDown } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

const GOLD = "#c9a84c";

const MATTER_TYPES = ["Business Law", "Property Law", "Family Law", "Employment", "Contract Review", "Criminal", "Immigration", "Other"];
const NEED_TYPES = ["Consultation", "Document Review", "Drafting", "Representation", "Referral"];
const CONSULT_MODES = ["In-Person", "Video Call", "Phone"];

function DropDown({ value, options, onSelect, placeholder, C, theme }: any) {
    const [open, setOpen] = useState(false);
    return (
        <View style={{ zIndex: 10 }}>
            <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: value ? GOLD : (theme === "dark" ? "#2a2a2a" : "#e0dbd2") }}
                onPress={() => setOpen(!open)}
                activeOpacity={0.8}
            >
                <Text style={{ fontSize: 15, color: value ? C.text : C.muted, fontWeight: value ? "600" : "400" }}>{value || placeholder}</Text>
                <ChevronDown size={16} color={value ? GOLD : C.muted} />
            </TouchableOpacity>
            {open && (
                <View style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", marginTop: 4, overflow: "hidden", elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                    {options.map((opt: string, i: number) => (
                        <TouchableOpacity
                            key={opt}
                            style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: theme === "dark" ? "#1a1a1a" : "#f0ece6" }}
                            onPress={() => { onSelect(opt); setOpen(false); }}
                            activeOpacity={0.7}
                        >
                            <Text style={{ fontSize: 15, color: opt === value ? GOLD : C.text, fontWeight: opt === value ? "700" : "400" }}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

export default function LegalAdvisoryScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [matterType, setMatterType] = useState("");
    const [needType, setNeedType] = useState("");
    const [consultMode, setConsultMode] = useState("Video Call");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSubmit = async () => {
        if (!matterType || description.trim().length < 10) {
            Alert.alert("Add Details", "Please select a matter type and describe your situation.");
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "lifestyle-legal",
            status: "pending",
            reference: ref,
            title: `Legal Advisory - ${matterType}`,
            details: { matterType, needType, consultMode, description },
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

                    <View style={s.hero}>
                        <View style={s.heroPattern}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <View key={i} style={[s.heroLine, { top: i * 28 + 20 }]} />
                            ))}
                        </View>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={s.heroCenter}>
                            <Scale size={48} color={GOLD} style={{ opacity: 0.9, marginBottom: 16 }} />
                            <Text style={s.heroEyebrow}>LEGAL SERVICES</Text>
                            <Text style={s.heroTitle}>Legal Advisory</Text>
                            <Text style={s.heroSub}>Trusted legal partners. Every matter handled with discretion.</Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Area of Law</Text>
                        <View style={s.wrapRow}>
                            {MATTER_TYPES.map(m => (
                                <TouchableOpacity
                                    key={m}
                                    style={[s.chip, matterType === m && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setMatterType(m)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.chipText, matterType === m && { color: "#0a0a0a", fontWeight: "700" }]}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[s.section, { zIndex: 10 }]}>
                        <Text style={s.label}>What do you need?</Text>
                        <DropDown
                            value={needType}
                            options={NEED_TYPES}
                            onSelect={setNeedType}
                            placeholder="Select what you need..."
                            C={C}
                            theme={theme}
                        />
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Describe Your Matter</Text>
                        <Text style={s.sublabel}>Be as specific as you can. All information is handled in strict confidence.</Text>
                        <VoiceInput
                            placeholder="Briefly describe your legal situation, what happened, what you need, any relevant timeline or parties involved..."
                            value={description}
                            onChange={setDescription}
                            accent={GOLD}
                            textColor={C.text}
                            border={isDark ? "#2a2a2a" : "#e0dbd2"}
                            inputBg={C.surface}
                        />
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Preferred Consultation</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            {CONSULT_MODES.map(m => (
                                <TouchableOpacity
                                    key={m}
                                    style={[s.pill, consultMode === m && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setConsultMode(m)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.pillText, consultMode === m && { color: "#0a0a0a", fontWeight: "700" }]}>{m}</Text>
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
                        <View style={[s.modalIcon, { backgroundColor: `${GOLD}18` }]}>
                            <Check size={28} color={GOLD} strokeWidth={2} />
                        </View>
                        <Text style={s.modalTitle}>Request Received</Text>
                        <Text style={s.modalBody}>We will connect you with a verified legal partner within 24 hours. All details are strictly confidential.</Text>
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
    hero: { height: 260, backgroundColor: "#0c0e14", justifyContent: "flex-end", paddingBottom: 32, overflow: "hidden" },
    heroPattern: { ...StyleSheet.absoluteFillObject },
    heroLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(201,168,76,0.08)" },
    backBtn: { position: "absolute", top: 16, left: 20, width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
    heroCenter: { alignItems: "center", paddingHorizontal: 32 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 32, fontWeight: "700", color: "#fff", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 10, textAlign: "center" },
    heroSub: { fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 20 },
    section: { paddingHorizontal: 24, paddingTop: 28 },
    label: { fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 },
    sublabel: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 14 },
    wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    pill: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center" },
    pillText: { fontSize: 13, fontWeight: "600", color: C.muted },
    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 18, fontSize: 15, color: C.text, minHeight: 160, lineHeight: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
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
