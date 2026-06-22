import { useState, useMemo, useRef } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Animated, Alert, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Check, Minus, Plus } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

const { width: W } = Dimensions.get("window");
const GOLD = "#c9a84c";

const SERVICE_TYPES = [
    { id: "nanny", label: "Nanny", desc: "Daily or live-in childcare" },
    { id: "au-pair", label: "Au Pair", desc: "Live-in cultural exchange caregiver" },
    { id: "school", label: "School Search", desc: "Find the right school for your child" },
    { id: "tutor", label: "Private Tutoring", desc: "Academic support at home" },
    { id: "baby-planning", label: "Baby Planning", desc: "Newborn preparation & support" },
    { id: "activities", label: "Children's Activities", desc: "Clubs, sports, hobbies & enrichment" },
];

const SCHEDULES = ["Full-time", "Part-time", "Weekdays only", "Weekends only", "Flexible"];
const LANGUAGES = ["English", "French", "Igbo", "Yoruba", "Hausa", "Other"];
const TIMELINES = ["Immediately", "Within 1 month", "1–3 months", "Just exploring"];

export default function FamilyScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [serviceType, setServiceType] = useState("");
    const [childAge, setChildAge] = useState(0);
    const [oldestAge, setOldestAge] = useState(0);
    const [numChildren, setNumChildren] = useState(1);
    const [schedule, setSchedule] = useState("");
    const [languages, setLanguages] = useState<string[]>([]);
    const [liveIn, setLiveIn] = useState<boolean | null>(null);
    const [timeline, setTimeline] = useState("");
    const [requirements, setRequirements] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const toggleLang = (l: string) => setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
    const isCaregiver = ["nanny", "au-pair"].includes(serviceType);

    const handleSubmit = async () => {
        if (!serviceType) { Alert.alert("Select Service", "Please choose what you need."); return; }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id, service_type: "lifestyle-family", status: "pending", reference: ref,
            title: `Family - ${SERVICE_TYPES.find(s => s.id === serviceType)?.label}`,
            details: { serviceType, childAge, oldestAge, numChildren, schedule, languages, liveIn, timeline, requirements },
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
                        <Image source={require("@/assets/images/onboarding-lifestyle.png")} style={s.heroImg} resizeMode="cover" />
                        <View style={s.heroScrim} />
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={s.heroContent}>
                            <Text style={s.heroEyebrow}>FAMILY SERVICES</Text>
                            <Text style={s.heroTitle}>Childcare & Family</Text>
                            <Text style={s.heroSub}>The right people, carefully vetted, for your family.</Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>What do you need?</Text>
                        <View style={s.serviceGrid}>
                            {SERVICE_TYPES.map(svc => (
                                <TouchableOpacity
                                    key={svc.id}
                                    style={[s.svcCard, serviceType === svc.id && { borderColor: GOLD, backgroundColor: `${GOLD}10` }]}
                                    onPress={() => setServiceType(svc.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.svcLabel, serviceType === svc.id && { color: GOLD }]}>{svc.label}</Text>
                                    <Text style={s.svcDesc}>{svc.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Number of Children</Text>
                        <View style={s.stepperRow}>
                            <TouchableOpacity style={s.stepBtn} onPress={() => setNumChildren(n => Math.max(1, n - 1))} activeOpacity={0.8}>
                                <Minus size={18} color={C.text} />
                            </TouchableOpacity>
                            <Text style={s.stepVal}>{numChildren}</Text>
                            <TouchableOpacity style={s.stepBtn} onPress={() => setNumChildren(n => Math.min(8, n + 1))} activeOpacity={0.8}>
                                <Plus size={18} color={C.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Youngest Child's Age (years)</Text>
                        <View style={s.stepperRow}>
                            <TouchableOpacity style={s.stepBtn} onPress={() => setChildAge(a => Math.max(0, a - 1))} activeOpacity={0.8}>
                                <Minus size={18} color={C.text} />
                            </TouchableOpacity>
                            <Text style={s.stepVal}>{childAge === 0 ? "<1" : childAge}</Text>
                            <TouchableOpacity style={s.stepBtn} onPress={() => setChildAge(a => Math.min(18, a + 1))} activeOpacity={0.8}>
                                <Plus size={18} color={C.text} />
                            </TouchableOpacity>
                            <Text style={s.stepLabel}>{childAge <= 1 ? "yr old" : "yrs old"}</Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Oldest Child's Age (years)</Text>
                        <View style={s.stepperRow}>
                            <TouchableOpacity style={s.stepBtn} onPress={() => setOldestAge(a => Math.max(0, a - 1))} activeOpacity={0.8}>
                                <Minus size={18} color={C.text} />
                            </TouchableOpacity>
                            <Text style={s.stepVal}>{oldestAge === 0 ? "<1" : oldestAge}</Text>
                            <TouchableOpacity style={s.stepBtn} onPress={() => setOldestAge(a => Math.min(18, a + 1))} activeOpacity={0.8}>
                                <Plus size={18} color={C.text} />
                            </TouchableOpacity>
                            <Text style={s.stepLabel}>{oldestAge <= 1 ? "yr old" : "yrs old"}</Text>
                        </View>
                    </View>

                    {isCaregiver && (
                        <>
                            <View style={s.section}>
                                <Text style={s.label}>Schedule</Text>
                                <View style={s.wrapRow}>
                                    {SCHEDULES.map(sc => (
                                        <TouchableOpacity key={sc} style={[s.chip, schedule === sc && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setSchedule(sc)} activeOpacity={0.8}>
                                            <Text style={[s.chipText, schedule === sc && { color: "#0a0a0a", fontWeight: "700" }]}>{sc}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={s.section}>
                                <Text style={s.label}>Live-in or Daily?</Text>
                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    {([true, false] as const).map(v => (
                                        <TouchableOpacity key={String(v)} style={[s.pill, liveIn === v && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setLiveIn(v)} activeOpacity={0.8}>
                                            <Text style={[s.pillText, liveIn === v && { color: "#0a0a0a", fontWeight: "700" }]}>{v ? "Live-in" : "Daily (Non-resident)"}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={s.section}>
                                <Text style={s.label}>Language Requirements</Text>
                                <Text style={s.sublabel}>Select languages the caregiver should speak.</Text>
                                <View style={s.wrapRow}>
                                    {LANGUAGES.map(l => (
                                        <TouchableOpacity key={l} style={[s.chip, languages.includes(l) && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => toggleLang(l)} activeOpacity={0.8}>
                                            <Text style={[s.chipText, languages.includes(l) && { color: "#0a0a0a", fontWeight: "700" }]}>{l}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}

                    <View style={s.section}>
                        <Text style={s.label}>When do you need this?</Text>
                        <View style={s.wrapRow}>
                            {TIMELINES.map(t => (
                                <TouchableOpacity key={t} style={[s.chip, timeline === t && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setTimeline(t)} activeOpacity={0.8}>
                                    <Text style={[s.chipText, timeline === t && { color: "#0a0a0a", fontWeight: "700" }]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Additional Requirements</Text>
                        <VoiceInput
                            placeholder="Allergies, special needs, religious considerations, driving licence, first aid, specific qualifications..."
                            value={requirements}
                            onChange={setRequirements}
                            accent={GOLD}
                            textColor={C.text}
                            border={isDark ? "#2a2a2a" : "#e0dbd2"}
                            inputBg={C.surface}
                        />
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
                        <Text style={s.modalBody}>We'll begin sourcing vetted candidates that match your family's needs. You'll hear from us shortly.</Text>
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
    hero: { height: 260, position: "relative" },
    heroImg: { width: "100%", height: "100%", position: "absolute" },
    heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
    backBtn: { position: "absolute", top: 16, left: 20, width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    heroContent: { position: "absolute", bottom: 28, left: 24, right: 24 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 32, fontWeight: "700", color: "#fff", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
    heroSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "PlayfairDisplay_400Regular_Italic" },
    section: { paddingHorizontal: 24, paddingTop: 28 },
    label: { fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 },
    sublabel: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 12 },
    serviceGrid: { gap: 10 },
    svcCard: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    svcLabel: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 4 },
    svcDesc: { fontSize: 12, color: C.muted },
    wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    pill: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center" },
    pillText: { fontSize: 13, fontWeight: "600", color: C.muted },
    stepperRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    stepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    stepVal: { fontSize: 24, fontWeight: "700", color: C.text, minWidth: 40, textAlign: "center" },
    stepLabel: { fontSize: 14, color: C.muted },
    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 18, fontSize: 15, color: C.text, minHeight: 130, lineHeight: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
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
