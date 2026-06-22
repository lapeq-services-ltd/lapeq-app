import { useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, Modal, Animated, Platform, KeyboardAvoidingView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { ChevronLeft, Calendar, Check, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Akwa Ibom", "Kano"];

const ACTIVITIES = [
    "Hotel / Villa Stay",
    "Private Dining",
    "Spa & Wellness",
    "Nightlife & Lounges",
    "Private Chef at Home",
    "Chauffeur & Transport",
    "Shopping & Styling",
    "Exclusive Events",
    "Cultural Experiences",
    "Business Dinner",
    "Boat / Yacht",
    "Photography Session",
    "Golf & Recreation",
    "Airport Protocol",
];

const STEPS = [
    { num: "1", title: "You tell us the basics", desc: "City, dates, and what you're looking for." },
    { num: "2", title: "We build your itinerary", desc: "Your concierge researches and arranges every detail." },
    { num: "3", title: "You receive your plan", desc: "Review your full day-by-day timetable and request any changes." },
];

const EXAMPLES = [
    { tag: "DATE NIGHT", title: "Romantic\nEvening in Abuja", img: require("@/assets/images/lagos-restaurant.jpg") },
    { tag: "WEEKEND", title: "Lagos\nGetaway Package", img: require("@/assets/images/lagos-hotel.jpg") },
    { tag: "CELEBRATION", title: "Bespoke\nBirthday Experience", img: require("@/assets/images/lagos-rooftop.jpg") },
    { tag: "WELLNESS", title: "Full Day\nSpa & Dining", img: require("@/assets/images/lagos-beach.jpg") },
];

export default function ExperiencesScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [showForm, setShowForm] = useState(false);
    const [city, setCity] = useState("");
    const [dateFromObj, setDateFromObj] = useState<Date | null>(null);
    const [dateToObj, setDateToObj] = useState<Date | null>(null);
    const [showDateFrom, setShowDateFrom] = useState(false);
    const [showDateTo, setShowDateTo] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
    const [notes, setNotes] = useState("");

    const toggleActivity = (item: string) => {
        setSelectedActivities(prev =>
            prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
        );
    };
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const fmtDate = (d: Date | null) => d
        ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : null;

    const handleSubmit = async () => {
        if (!city) { Alert.alert("Please select a city."); return; }
        if (selectedActivities.length === 0) { Alert.alert("Please select at least one activity."); return; }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "EXP-" + Date.now().toString(36).toUpperCase().slice(-5);

        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "experience",
            status: "pending",
            reference: ref,
            title: `${city} Experience${dateFromObj ? ` · ${fmtDate(dateFromObj)}` : ""}`,
            details: {
                city,
                dateFrom: fmtDate(dateFromObj),
                dateTo: fmtDate(dateToObj),
                activities: selectedActivities,
                notes: notes.trim(),
            },
        });

        setLoading(false);
        if (error) { Alert.alert("Error", error.message); return; }

        setShowForm(false);
        setShowSuccess(true);
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.headerTitle}>Experiences</Text>
                    <Text style={s.headerSub}>Curated itineraries, handled end to end</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                {/* Hero */}
                <View style={s.heroWrap}>
                    <Image source={require("@/assets/images/lagos-rooftop.jpg")} style={s.heroImg} resizeMode="cover" />
                    <View style={s.heroOverlay} />
                    <View style={s.heroContent}>
                        <Text style={s.heroEyebrow}>HOW IT WORKS</Text>
                        <Text style={s.heroTitle}>Your Concierge{"\n"}Plans Everything</Text>
                        <Text style={s.heroDesc}>
                            Tell us your city, dates, and what you're looking for. Your concierge builds a full day-by-day itinerary - hotels, dining, transport, experiences - and delivers it here.
                        </Text>
                    </View>
                </View>

                {/* Steps */}
                <View style={s.stepsSection}>
                    {STEPS.map((step, i) => (
                        <View key={step.num} style={s.stepRow}>
                            <View style={s.stepNumWrap}>
                                <Text style={s.stepNum}>{step.num}</Text>
                            </View>
                            <View style={s.stepBody}>
                                <Text style={s.stepTitle}>{step.title}</Text>
                                <Text style={s.stepDesc}>{step.desc}</Text>
                            </View>
                            {i < STEPS.length - 1 && <View style={s.stepLine} />}
                        </View>
                    ))}
                </View>

                {/* Example Packages */}
                <View style={s.examplesSection}>
                    <Text style={s.examplesTitle}>Popular Packages</Text>
                    <Text style={s.examplesSub}>These are examples - your concierge builds yours from scratch.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}>
                        {EXAMPLES.map((ex) => (
                            <TouchableOpacity key={ex.tag} style={s.exCard} activeOpacity={0.88} onPress={() => setShowForm(true)}>
                                <Image source={ex.img} style={s.exImg} resizeMode="cover" />
                                <View style={s.exOverlay} />
                                <View style={s.exContent}>
                                    <Text style={s.exTag}>{ex.tag}</Text>
                                    <Text style={s.exTitle}>{ex.title}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* CTA */}
                <View style={{ paddingHorizontal: 20 }}>
                    <TouchableOpacity style={s.ctaBtn} onPress={() => setShowForm(true)} activeOpacity={0.88}>
                        <Text style={s.ctaBtnText}>Request Your Package</Text>
                    </TouchableOpacity>
                    <Text style={s.ctaNote}>Your concierge responds within 48 hours.</Text>
                </View>
            </ScrollView>

            {/* Request Form Bottom Sheet */}
            <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setShowForm(false)} />
                    <View style={s.sheet}>
                        <View style={s.sheetHandle} />
                        <View style={s.sheetHeader}>
                            <Text style={s.sheetTitle}>Plan Your Experience</Text>
                            <TouchableOpacity onPress={() => setShowForm(false)}>
                                <X size={22} color={C.muted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {/* City */}
                            <Text style={s.fieldLabel}>Which city?</Text>
                            <View style={s.cityChips}>
                                {CITIES.map((c) => {
                                    const isAvailable = c === "Lagos" || c === "Abuja";
                                    const displayLabel = isAvailable ? c : `${c} (Coming Soon)`;
                                    return (
                                        <TouchableOpacity
                                            key={c}
                                            style={[s.cityChip, city === c && s.cityChipActive]}
                                            onPress={() => setCity(c)}
                                        >
                                            <Text style={[s.cityChipText, city === c && s.cityChipTextActive]}>{displayLabel}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Dates */}
                            <Text style={s.fieldLabel}>When?</Text>
                            <View style={s.dateRow}>
                                <TouchableOpacity style={s.dateBtn} onPress={() => setShowDateFrom(true)}>
                                    <Calendar size={16} color={dateFromObj ? C.primary : C.muted} />
                                    <Text style={[s.dateBtnText, dateFromObj && { color: C.text }]}>
                                        {fmtDate(dateFromObj) ?? "Start date"}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={{ color: C.muted, fontSize: 16 }}>→</Text>
                                <TouchableOpacity style={s.dateBtn} onPress={() => setShowDateTo(true)}>
                                    <Calendar size={16} color={dateToObj ? C.primary : C.muted} />
                                    <Text style={[s.dateBtnText, dateToObj && { color: C.text }]}>
                                        {fmtDate(dateToObj) ?? "End date"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Activities */}
                            <Text style={s.fieldLabel}>What do you want to do?</Text>
                            <Text style={s.fieldHint}>Select everything you'd like included in your itinerary.</Text>
                            <View style={s.activitiesGrid}>
                                {ACTIVITIES.map((item) => {
                                    const active = selectedActivities.includes(item);
                                    return (
                                        <TouchableOpacity
                                            key={item}
                                            style={[s.activityChip, active && s.activityChipActive]}
                                            onPress={() => toggleActivity(item)}
                                        >
                                            {active && <Check size={12} color="#0a0a0a" />}
                                            <Text style={[s.activityChipText, active && s.activityChipTextActive]}>{item}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Notes */}
                            <Text style={s.fieldLabel}>Anything else?</Text>
                            <VoiceInput
                                placeholder="e.g. Something intimate for two, nothing too flashy. Would love a rooftop dinner on the first night and a relaxed Sunday morning..."
                                value={notes}
                                onChange={setNotes}
                                accent={C.primary}
                                textColor={C.text}
                                border={theme === "dark" ? "#2a2a2a" : "#d8d3ca"}
                                inputBg={C.surface}
                            />

                            <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                                <Text style={s.submitBtnText}>{loading ? "Sending..." : "Submit Request"}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>

                        {/* iOS Date pickers */}
                        <Modal visible={Platform.OS === "ios" && showDateFrom} transparent animationType="slide">
                            <View style={{ flex: 1, justifyContent: "flex-end" }}>
                                <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDateFrom(false)} />
                                <View style={s.pickerSheet}>
                                    <View style={s.pickerHeader}>
                                        <TouchableOpacity onPress={() => setShowDateFrom(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                                        <Text style={{ color: C.text, fontFamily: "Jost_600SemiBold", fontSize: 16 }}>Start Date</Text>
                                        <TouchableOpacity onPress={() => setShowDateFrom(false)}><Text style={{ color: C.primary, fontFamily: "Jost_600SemiBold", fontSize: 16 }}>Done</Text></TouchableOpacity>
                                    </View>
                                    <DateTimePicker value={dateFromObj ?? new Date()} mode="date" display="spinner" minimumDate={new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDateFromObj(d); }} />
                                </View>
                            </View>
                        </Modal>

                        <Modal visible={Platform.OS === "ios" && showDateTo} transparent animationType="slide">
                            <View style={{ flex: 1, justifyContent: "flex-end" }}>
                                <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDateTo(false)} />
                                <View style={s.pickerSheet}>
                                    <View style={s.pickerHeader}>
                                        <TouchableOpacity onPress={() => setShowDateTo(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                                        <Text style={{ color: C.text, fontFamily: "Jost_600SemiBold", fontSize: 16 }}>End Date</Text>
                                        <TouchableOpacity onPress={() => setShowDateTo(false)}><Text style={{ color: C.primary, fontFamily: "Jost_600SemiBold", fontSize: 16 }}>Done</Text></TouchableOpacity>
                                    </View>
                                    <DateTimePicker value={dateToObj ?? dateFromObj ?? new Date()} mode="date" display="spinner" minimumDate={dateFromObj ?? new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDateToObj(d); }} />
                                </View>
                            </View>
                        </Modal>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Success Modal */}
            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={s.modalIcon}><Check size={28} color={C.primary} /></View>
                        <Text style={s.modalTitle}>Request Received</Text>
                        <Text style={s.modalBody}>Your concierge will curate your full day-by-day itinerary and send it back to you within 48 hours.</Text>
                        <TouchableOpacity style={s.modalBtnPri} onPress={() => { setShowSuccess(false); router.push("/requests" as any); }}>
                            <Text style={s.modalBtnTxPri}>View My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSec} onPress={() => { setShowSuccess(false); router.back(); }}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* General date pickers (Android) */}
            {Platform.OS === "android" && showDateFrom && (
                <DateTimePicker value={dateFromObj ?? new Date()} mode="date" display="default" minimumDate={new Date()} onChange={(_, d) => { setShowDateFrom(false); if (d) setDateFromObj(d); }} />
            )}
            {Platform.OS === "android" && showDateTo && (
                <DateTimePicker value={dateToObj ?? dateFromObj ?? new Date()} mode="date" display="default" minimumDate={dateFromObj ?? new Date()} onChange={(_, d) => { setShowDateTo(false); if (d) setDateToObj(d); }} />
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontFamily: "Jost_700Bold", color: C.text },
    headerSub: { fontSize: 12, fontFamily: "Jost_400Regular", color: C.muted, marginTop: 1 },

    heroWrap: { marginHorizontal: 20, borderRadius: 24, overflow: "hidden", height: 280, marginBottom: 32 },
    heroImg: { ...StyleSheet.absoluteFillObject as any, width: "100%", height: "100%" },
    heroOverlay: { ...StyleSheet.absoluteFillObject as any, backgroundColor: "rgba(0,0,0,0.58)" },
    heroContent: { flex: 1, justifyContent: "flex-end", padding: 24 },
    heroEyebrow: { fontSize: 10, fontFamily: "Jost_700Bold", color: C.primary, letterSpacing: 2.5, marginBottom: 10 },
    heroTitle: { fontSize: 28, fontFamily: "PlayfairDisplay_700Bold", color: "#fff", lineHeight: 34, marginBottom: 12 },
    heroDesc: { fontSize: 13, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.75)", lineHeight: 21 },

    stepsSection: { paddingHorizontal: 20, marginBottom: 36 },
    stepRow: { flexDirection: "row", gap: 16, marginBottom: 24, position: "relative" },
    stepNumWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    stepNum: { fontSize: 16, fontFamily: "Jost_700Bold", color: "#0a0a0a" },
    stepBody: { flex: 1, paddingTop: 8 },
    stepTitle: { fontSize: 15, fontFamily: "Jost_600SemiBold", color: C.text, marginBottom: 4 },
    stepDesc: { fontSize: 13, fontFamily: "Jost_400Regular", color: C.muted, lineHeight: 20 },
    stepLine: { position: "absolute", left: 19, top: 44, width: 2, height: 20, backgroundColor: theme === "dark" ? "#2a2a2a" : "#ddd" },

    examplesSection: { marginBottom: 36 },
    examplesTitle: { fontSize: 18, fontFamily: "PlayfairDisplay_700Bold", color: C.text, paddingHorizontal: 20, marginBottom: 4 },
    examplesSub: { fontSize: 12, fontFamily: "Jost_400Regular", color: C.muted, paddingHorizontal: 20, marginBottom: 16 },
    exCard: { width: 180, height: 220, borderRadius: 18, overflow: "hidden" },
    exImg: { width: "100%", height: "100%", position: "absolute" },
    exOverlay: { ...StyleSheet.absoluteFillObject as any, backgroundColor: "rgba(0,0,0,0.45)" },
    exContent: { flex: 1, justifyContent: "flex-end", padding: 14 },
    exTag: { fontSize: 9, fontFamily: "Jost_700Bold", color: C.primary, letterSpacing: 1.5, marginBottom: 6 },
    exTitle: { fontSize: 15, fontFamily: "PlayfairDisplay_700Bold", color: "#fff", lineHeight: 20 },

    ctaBtn: { backgroundColor: C.primary, borderRadius: 100, paddingVertical: 18, alignItems: "center", marginBottom: 12 },
    ctaBtnText: { fontSize: 15, fontFamily: "Jost_600SemiBold", color: "#0a0a0a" },
    ctaNote: { textAlign: "center", fontSize: 12, fontFamily: "Jost_400Regular", color: C.muted },

    // Bottom sheet
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: { backgroundColor: C.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "88%", padding: 20 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme === "dark" ? "#3a3a3a" : "#ddd", alignSelf: "center", marginBottom: 20 },
    sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    sheetTitle: { fontSize: 20, fontFamily: "PlayfairDisplay_700Bold", color: C.text },

    fieldLabel: { fontSize: 11, fontFamily: "Jost_700Bold", color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 },
    fieldHint: { fontSize: 12, fontFamily: "Jost_400Regular", color: C.muted, marginTop: -8, marginBottom: 14 },
    activitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
    activityChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", backgroundColor: C.surface },
    activityChipActive: { backgroundColor: C.primary, borderColor: C.primary },
    activityChipText: { fontSize: 13, fontFamily: "Jost_500Medium", color: C.muted },
    activityChipTextActive: { color: "#0a0a0a", fontFamily: "Jost_600SemiBold" },

    cityChips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
    cityChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", backgroundColor: C.surface },
    cityChipActive: { backgroundColor: C.primary, borderColor: C.primary },
    cityChipText: { fontSize: 14, fontFamily: "Jost_500Medium", color: C.muted },
    cityChipTextActive: { color: "#0a0a0a" },

    dateRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },
    dateBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    dateBtnText: { fontSize: 13, fontFamily: "Jost_500Medium", color: C.muted, flex: 1 },

    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 16, fontSize: 14, fontFamily: "Jost_400Regular", color: C.text, minHeight: 140, lineHeight: 22, marginBottom: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },

    submitBtn: { backgroundColor: C.primary, borderRadius: 100, paddingVertical: 18, alignItems: "center" },
    submitBtnText: { fontSize: 15, fontFamily: "Jost_600SemiBold", color: "#0a0a0a" },

    pickerSheet: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#2a2a2a" : "#eee" },

    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center" },
    modalIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${C.primary}20`, justifyContent: "center", alignItems: "center", marginBottom: 24 },
    modalTitle: { color: C.text, fontSize: 24, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, fontFamily: "Jost_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 16, borderRadius: 100, backgroundColor: C.text, alignItems: "center", marginBottom: 12 },
    modalBtnTxPri: { color: C.background, fontSize: 15, fontFamily: "Jost_600SemiBold" },
    modalBtnSec: { width: "100%", paddingVertical: 16, alignItems: "center" },
    modalBtnTxSec: { color: C.muted, fontSize: 15, fontFamily: "Jost_600SemiBold" },
});
