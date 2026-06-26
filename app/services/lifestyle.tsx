import { useState, useMemo, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Modal,
    Animated,
    Alert,
    Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Calendar, Check } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";
import * as Haptics from "expo-haptics";

const GOLD = "#c9a84c";

const EVENT_TYPES = ["Wedding", "Corporate Summit", "Birthday / Gala", "Concert / Show", "Exhibition", "Other Private Event"];
const FEATURE_OPTIONS = [
    { id: "rsvp", label: "RSVP & Guest Tracker" },
    { id: "travel", label: "Guest Travel & Aviation" },
    { id: "protocol", label: "VIP Airport Protocol" },
    { id: "chat", label: "Direct Concierge Chat" },
    { id: "custom_tabs", label: "Custom Customization Tabs" },
];

export default function LapeqCoBrandScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    // Form States
    const [eventName, setEventName] = useState("");
    const [eventType, setEventType] = useState("");
    const [eventLocation, setEventLocation] = useState("");
    const [guestCount, setGuestCount] = useState("");
    const [themeColors, setThemeColors] = useState("");
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [additionalNotes, setAdditionalNotes] = useState("");

    // Date Picker States
    const [eventDate, setEventDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Submission states
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;
    const scrollRef = useRef<ScrollView>(null);

    const fmtDate = (d: Date | null) =>
        d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

    const toggleFeature = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedFeatures(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (!eventName.trim() || !eventType || !eventLocation.trim() || !eventDate) {
            Alert.alert("Required Fields", "Please provide the Event Name, Type, Date, and Location.");
            return;
        }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "COB-" + Date.now().toString(36).toUpperCase().slice(-5);

        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "white-label-event",
            status: "pending",
            reference: ref,
            title: `Co-Brand: ${eventName}`,
            details: {
                eventName,
                eventType,
                eventLocation,
                eventDate: fmtDate(eventDate),
                guestCount: guestCount.trim() || "Unspecified",
                themeColors: themeColors.trim() || "Default Lapeq Style",
                features: selectedFeatures.map(f => FEATURE_OPTIONS.find(opt => opt.id === f)?.label || f),
                notes: additionalNotes,
            },
        });

        setLoading(false);

        if (!error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        } else {
            Alert.alert("Submission Failed", error.message || "Something went wrong. Please try again.");
        }
    };

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>
                {/* Hero */}
                <View style={s.hero}>
                    <Image source={require("@/assets/images/app-collab.png")} style={s.heroImg} resizeMode="cover" />
                    <View style={s.heroScrim} />
                    <View style={s.heroTopRow}>
                        <TouchableOpacity style={s.backBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={s.heroContent}>
                        <Text style={s.heroEyebrow}>EVENT APP CURATION</Text>
                        <Text style={s.heroTitle}>Lapeq Co-Brand</Text>
                        <Text style={s.heroDesc}>
                            Your event runs on Lapeq. Request a fully customized white-label app experience for your guests.
                        </Text>
                    </View>
                </View>

                {/* Form Fields */}
                <View style={s.section}>
                    <Text style={s.sectionLabel}>Event Name</Text>
                    <TextInput
                        style={s.input}
                        placeholder="e.g., The Adeleke Wedding / Summit 2026"
                        placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                        value={eventName}
                        onChangeText={setEventName}
                    />
                </View>

                <View style={s.section}>
                    <Text style={s.sectionLabel}>Event Type</Text>
                    <View style={s.wrapRow}>
                        {EVENT_TYPES.map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[s.chip, eventType === t && s.chipActive]}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEventType(t); }}
                                activeOpacity={0.8}
                            >
                                <Text style={[s.chipText, eventType === t && s.chipTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={s.sectionLabel}>Event Date</Text>
                    <TouchableOpacity
                        style={[s.dateCard, eventDate && { borderColor: GOLD }]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDatePicker(true); }}
                    >
                        <Calendar size={16} color={eventDate ? GOLD : C.muted} />
                        <View>
                            <Text style={s.dateCardLabel}>Date</Text>
                            <Text style={[s.dateCardValue, { color: eventDate ? C.text : C.muted }]}>
                                {fmtDate(eventDate) ?? "Select date"}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={s.section}>
                    <Text style={s.sectionLabel}>Location / Venue</Text>
                    <TextInput
                        style={s.input}
                        placeholder="e.g., Eko Hotel Grand Ballroom, Lagos"
                        placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                        value={eventLocation}
                        onChangeText={setEventLocation}
                    />
                </View>

                <View style={s.section}>
                    <Text style={s.sectionLabel}>Estimated Guest Count</Text>
                    <TextInput
                        style={s.input}
                        keyboardType="numeric"
                        placeholder="e.g., 350"
                        placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                        value={guestCount}
                        onChangeText={setGuestCount}
                    />
                </View>

                <View style={s.section}>
                    <Text style={s.sectionLabel}>Theme Colors / Aesthetic</Text>
                    <TextInput
                        style={s.input}
                        placeholder="e.g., Emerald Green & Champagne Gold"
                        placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                        value={themeColors}
                        onChangeText={setThemeColors}
                    />
                </View>

                <View style={s.section}>
                    <Text style={s.sectionLabel}>Requested Features</Text>
                    <Text style={s.sectionSub}>Select the Lapeq features you want customized for your event.</Text>
                    <View style={s.wrapRow}>
                        {FEATURE_OPTIONS.map(opt => {
                            const active = selectedFeatures.includes(opt.id);
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[s.chip, active && s.chipActive]}
                                    onPress={() => toggleFeature(opt.id)}
                                    activeOpacity={0.8}
                                >
                                    {active && <Check size={12} color="#0a0a0a" style={{ marginRight: 4 }} />}
                                    <Text style={[s.chipText, active && s.chipTextActive]}>{opt.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={s.sectionLabel}>Additional Curation Requests</Text>
                    <Text style={s.sectionSub}>Describe custom slides, branding materials, or specialized needs.</Text>
                    <VoiceInput
                        placeholder="e.g., We need custom welcome banners showing the couple's picture and a specific flight tracking list for international delegates..."
                        value={additionalNotes}
                        onChange={setAdditionalNotes}
                        accent={GOLD}
                        textColor={C.text}
                        border={isDark ? "#2a2a2a" : "#e0dbd2"}
                        inputBg={C.surface}
                    />
                </View>

                <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                    <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.8} disabled={loading}>
                        <Text style={s.submitText}>{loading ? "SUBMITTING..." : "REQUEST CO-BRAND APP"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Date Picker Modal */}
            <Modal visible={Platform.OS === "ios" && showDatePicker} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Event Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={eventDate ?? new Date()}
                            mode="date"
                            display="spinner"
                            minimumDate={new Date()}
                            themeVariant={isDark ? "dark" : "light"}
                            style={{ width: "100%" }}
                            onChange={(_, d) => { if (d) setEventDate(d); }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Android Date Picker */}
            {Platform.OS !== "ios" && showDatePicker && (
                <DateTimePicker
                    value={eventDate ?? new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(_, d) => {
                        setShowDatePicker(false);
                        if (d) setEventDate(d);
                    }}
                />
            )}

            {/* Success Alert Modal */}
            {showSuccess && (
                <Modal transparent visible={showSuccess} animationType="fade">
                    <View style={s.overlay}>
                        <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                            <View style={[s.modalIcon, { backgroundColor: `${GOLD}20` }]}>
                                <Check size={32} color={GOLD} />
                            </View>
                            <Text style={s.modalTitle}>Request Received</Text>
                            <Text style={s.modalBody}>
                                Your Lapeq Co-Brand curation request has been successfully submitted. Our event team will review the details and contact you to begin branding.
                            </Text>
                            <TouchableOpacity
                                style={s.modalBtnPri}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowSuccess(false);
                                    router.back();
                                }}
                            >
                                <Text style={s.modalBtnTxPri}>Return Home</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    hero: { height: 300, position: "relative" },
    heroImg: { width: "100%", height: "100%", position: "absolute" },
    heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)" },
    heroTopRow: { position: "absolute", top: 16, left: 20, right: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
    heroContent: { position: "absolute", bottom: 28, left: 24, right: 24 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: -0.5, marginBottom: 6 },
    heroDesc: { fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 19 },

    section: { paddingHorizontal: 24, paddingTop: 28 },
    sectionLabel: { fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 },
    sectionSub: { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 12 },

    input: {
        backgroundColor: C.surface,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: C.text,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2",
    },

    wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    chipActive: { backgroundColor: GOLD, borderColor: GOLD },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    chipTextActive: { color: "#0a0a0a", fontWeight: "700" },

    dateCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    dateCardLabel: { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 },
    dateCardValue: { fontSize: 13, fontWeight: "600" },

    submitBtn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    submitText: { color: "#0a0a0a", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },

    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },

    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center" },
    modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 24 },
    modalTitle: { color: C.text, fontSize: 24, fontWeight: "800", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: GOLD, alignItems: "center" },
    modalBtnTxPri: { color: "#0a0a0a", fontSize: 15, fontWeight: "700" },
});
