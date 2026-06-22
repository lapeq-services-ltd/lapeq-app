import { useState, useMemo, useRef } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Animated, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Check, TrendingUp, ChevronDown } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

const GOLD = "#c9a84c";

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

const ADVISORY_TYPES = ["Investment Planning", "Wealth Management", "Tax Planning", "Business Finance", "Estate Planning", "Retirement Planning", "Foreign Exchange", "Other"];
const GOALS = ["Grow my wealth", "Reduce my tax", "Plan for retirement", "Fund a business", "Protect my assets", "Invest abroad", "Other"];
const TIMELINES = ["Immediate (1–3 months)", "Short-term (3–12 months)", "Long-term (1 year+)", "Ongoing relationship"];
const MEET_MODES = ["In-Person", "Video Call", "Phone"];

export default function FinanceScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [advisoryType, setAdvisoryType] = useState("");
    const [goals, setGoals] = useState<string[]>([]);
    const [timeline, setTimeline] = useState("");
    const [meetMode, setMeetMode] = useState("Video Call");
    const [context, setContext] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const toggleGoal = (g: string) => setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

    const handleSubmit = async () => {
        if (!advisoryType) { Alert.alert("Select Type", "Please choose the type of financial advisory you need."); return; }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id, service_type: "lifestyle-finance", status: "pending", reference: ref,
            title: `Financial Advisory - ${advisoryType}`,
            details: { advisoryType, goals, timeline, meetMode, context },
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

                    {/* Dark premium hero */}
                    <View style={s.hero}>
                        <View style={s.heroGrid}>
                            {Array.from({ length: 20 }).map((_, i) => (
                                <View key={i} style={[s.gridDot, { top: Math.floor(i / 5) * 48 + 24, left: (i % 5) * 64 + 20 }]} />
                            ))}
                        </View>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={s.heroContent}>
                            <TrendingUp size={44} color={GOLD} style={{ opacity: 0.9, marginBottom: 14 }} />
                            <Text style={s.heroEyebrow}>WEALTH & FINANCE</Text>
                            <Text style={s.heroTitle}>Financial Advisory</Text>
                            <Text style={s.heroSub}>Introductions to trusted financial partners who understand your level.</Text>
                        </View>
                    </View>

                    <View style={[s.section, { zIndex: 10 }]}>
                        <Text style={s.label}>Type of Advisory</Text>
                        <DropDown
                            value={advisoryType}
                            options={ADVISORY_TYPES}
                            onSelect={setAdvisoryType}
                            placeholder="Select advisory type..."
                            C={C}
                            theme={theme}
                        />
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Your Goals</Text>
                        <Text style={s.sublabel}>Select all that apply.</Text>
                        <View style={s.wrapRow}>
                            {GOALS.map(g => (
                                <TouchableOpacity key={g} style={[s.chip, goals.includes(g) && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => toggleGoal(g)} activeOpacity={0.8}>
                                    <Text style={[s.chipText, goals.includes(g) && { color: "#0a0a0a", fontWeight: "700" }]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Additional Context</Text>
                        <Text style={s.sublabel}>Share anything that helps us match you with the right advisor. All information is private.</Text>
                        <VoiceInput
                            placeholder="Current situation, specific questions, industries of interest, or amounts involved..."
                            value={context}
                            onChange={setContext}
                            accent={GOLD}
                            textColor={C.text}
                            border={isDark ? "#2a2a2a" : "#e0dbd2"}
                            inputBg={C.surface}
                        />
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Timeline</Text>
                        <View style={s.wrapRow}>
                            {TIMELINES.map(t => (
                                <TouchableOpacity key={t} style={[s.chip, timeline === t && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setTimeline(t)} activeOpacity={0.8}>
                                    <Text style={[s.chipText, timeline === t && { color: "#0a0a0a", fontWeight: "700" }]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Preferred Meeting</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            {MEET_MODES.map(m => (
                                <TouchableOpacity key={m} style={[s.pill, meetMode === m && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setMeetMode(m)} activeOpacity={0.8}>
                                    <Text style={[s.pillText, meetMode === m && { color: "#0a0a0a", fontWeight: "700" }]}>{m}</Text>
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
                            <Text style={s.submitText}>{loading ? "Submitting..." : "Request Advisor"}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIcon, { backgroundColor: `${GOLD}18` }]}><Check size={28} color={GOLD} strokeWidth={2} /></View>
                        <Text style={s.modalTitle}>Request Received</Text>
                        <Text style={s.modalBody}>We'll connect you with a vetted financial advisor suited to your needs within 24 hours.</Text>
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
    hero: { height: 270, backgroundColor: "#080a0f", justifyContent: "flex-end", paddingBottom: 32, overflow: "hidden" },
    heroGrid: { ...StyleSheet.absoluteFillObject },
    gridDot: { position: "absolute", width: 3, height: 3, borderRadius: 2, backgroundColor: `${GOLD}20` },
    backBtn: { position: "absolute", top: 16, left: 20, width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
    heroContent: { alignItems: "center", paddingHorizontal: 32 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 30, fontWeight: "700", color: "#fff", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 10, textAlign: "center" },
    heroSub: { fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 20 },
    section: { paddingHorizontal: 24, paddingTop: 28 },
    label: { fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 },
    sublabel: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 14 },
    wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    pill: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center" },
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
