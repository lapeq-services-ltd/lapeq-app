import { useState, useMemo, useRef } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Animated, Alert, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Check, Calendar, Minus, Plus } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

const { width: W } = Dimensions.get("window");
const GOLD = "#c9a84c";

const ACTIVITIES = [
    "Golf", "Tennis", "Swimming", "Water Sports", "Hiking",
    "Horse Riding", "Skydiving", "Boat Cruise", "Cycling",
    "Spa Day", "Clay Shooting", "Other",
];

const LEVELS = ["First Time", "Beginner", "Intermediate", "Advanced"];
const LOCATIONS = ["Lagos", "Abuja", "Port Harcourt", "Akwa Ibom", "Kano"];

export default function RecreationScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [activity, setActivity] = useState<string>("");
    const [level, setLevel] = useState("Beginner");
    const [location, setLocation] = useState("");
    const [groupSize, setGroupSize] = useState(1);
    const [date, setDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const fmtDate = (d: Date | null) => d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

    const handleSubmit = async () => {
        if (!activity) {
            Alert.alert("Select Activity", "Please choose an activity to continue.");
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "lifestyle-recreation",
            status: "pending",
            reference: ref,
            title: `Recreation - ${activity}`,
            details: { activity, level, location, groupSize, date: fmtDate(date), notes },
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
                        <Image source={require("@/assets/images/lagos-beach.jpg")} style={s.heroImg} resizeMode="cover" />
                        <View style={s.heroScrim} />
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={s.heroContent}>
                            <Text style={s.heroEyebrow}>RECREATIONAL</Text>
                            <Text style={s.heroTitle}>Activities</Text>
                            <Text style={s.heroSub}>Curated leisure. Every experience arranged for you.</Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Choose an Activity</Text>
                        <View style={s.wrapRow}>
                            {ACTIVITIES.map(act => (
                                <TouchableOpacity
                                    key={act}
                                    style={[s.chip, activity === act && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setActivity(act)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.chipText, activity === act && { color: "#0a0a0a", fontWeight: "700" }]}>{act}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Experience Level</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                            {LEVELS.map(l => (
                                <TouchableOpacity
                                    key={l}
                                    style={[s.chip, level === l && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setLevel(l)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.chipText, level === l && { color: "#0a0a0a", fontWeight: "700" }]}>{l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Group Size</Text>
                        <View style={s.stepperRow}>
                            <TouchableOpacity style={s.stepBtn} onPress={() => setGroupSize(g => Math.max(1, g - 1))} activeOpacity={0.8}>
                                <Minus size={18} color={C.text} />
                            </TouchableOpacity>
                            <Text style={s.stepVal}>{groupSize}</Text>
                            <TouchableOpacity style={s.stepBtn} onPress={() => setGroupSize(g => Math.min(20, g + 1))} activeOpacity={0.8}>
                                <Plus size={18} color={C.text} />
                            </TouchableOpacity>
                            <Text style={s.stepLabel}>{groupSize === 1 ? "Solo" : `${groupSize} people`}</Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Preferred Location</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
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
                        <Text style={s.label}>Preferred Date</Text>
                        <TouchableOpacity style={[s.dateBtn, date && { borderColor: GOLD }]} onPress={() => setShowDatePicker(true)}>
                            <Calendar size={18} color={date ? GOLD : C.muted} />
                            <Text style={{ fontSize: 15, color: date ? C.text : C.muted, fontWeight: date ? "600" : "400" }}>
                                {fmtDate(date) ?? "Select a date"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Additional Notes</Text>
                        <VoiceInput
                            placeholder="Any specific requirements, fitness considerations, preferred venue or club..."
                            value={notes}
                            onChange={setNotes}
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
                            <Text style={s.submitText}>{loading ? "Booking..." : "Book Activity"}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

            {Platform.OS === "android" && showDatePicker && (
                <DateTimePicker value={date ?? new Date()} mode="date" display="default" minimumDate={new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
            )}
            <Modal visible={Platform.OS === "ios" && showDatePicker} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Preferred Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={date ?? new Date()} mode="date" display="spinner" minimumDate={new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDate(d); }} />
                    </View>
                </View>
            </Modal>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIcon, { backgroundColor: `${GOLD}18` }]}><Check size={28} color={GOLD} strokeWidth={2} /></View>
                        <Text style={s.modalTitle}>Activity Booked</Text>
                        <Text style={s.modalBody}>We're sourcing the best option for you. Confirmation will follow shortly.</Text>
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
    activityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    actCard: { width: (W - 48 - 20) / 3, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center", gap: 8 },
    actIcon: { fontSize: 20, color: C.muted },
    actLabel: { fontSize: 11, fontWeight: "700", color: C.muted, textAlign: "center" },
    wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    feeCard: { marginHorizontal: 24, marginTop: 28, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` },
    feeEyebrow: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 6 },
    feeAmount: { fontSize: 22, fontWeight: "800", color: GOLD },
    feeNote: { fontSize: 13, color: C.muted, fontWeight: "600" },
    feeSub: { fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 16 },
    stepperRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    stepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    stepVal: { fontSize: 24, fontWeight: "700", color: C.text, minWidth: 36, textAlign: "center" },
    stepLabel: { fontSize: 14, color: C.muted, fontWeight: "500" },
    dateBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 18, fontSize: 15, color: C.text, minHeight: 120, lineHeight: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    submitBtn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    submitText: { color: "#0a0a0a", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },
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
