import { useState, useMemo, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Animated, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, ShieldCheck, ChevronDown, Plus, Minus } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";
import LocationSearch from "@/components/LocationSearch";

const GOLD = "#c9a84c";
const isAndroid = Platform.OS === "android";

const CARE_TYPES = [
    "24/7 Butler Service",
    "Private Security Escort",
    "Medical Concierge",
];

// Butler and Security are personnel-based (headcount matters); Medical Concierge
// is about the case itself, not staffing, so the stepper is hidden for it.
const PERSONNEL_TYPES = ["24/7 Butler Service", "Private Security Escort"];

const DURATION_TYPES = [
    "Single Event",
    "Daily",
    "Weekly",
    "Monthly",
    "Custom Duration",
];

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

export default function BespokeCareScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [careType, setCareType] = useState("");
    const [duration, setDuration] = useState("");
    const [location, setLocation] = useState("");
    const [staffCount, setStaffCount] = useState(1);
    const [startDate, setStartDate] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const showPersonnelCount = PERSONNEL_TYPES.includes(careType);

    const handleSubmit = async () => {
        if (!careType || !location || description.trim().length < 10) {
            Alert.alert("Add Details", "Please select a care type, location, and describe your requirements.");
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "lifestyle-bespoke-care",
            status: "pending",
            reference: ref,
            title: `Bespoke Care - ${careType}`,
            details: {
                careType, duration, location, startDate, description,
                ...(showPersonnelCount ? { staffCount } : {}),
            },
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
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20} keyboardOpeningTime={0} contentContainerStyle={{ paddingBottom: 80 }}>

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
                        <ShieldCheck size={48} color={GOLD} style={{ opacity: 0.9, marginBottom: 16 }} />
                        <Text style={s.heroEyebrow}>LAPEQ BESPOKE CARE</Text>
                        <Text style={s.heroTitle}>Bespoke{"\n"}Care</Text>
                        <Text style={s.heroSub}>24/7 butler service, private security escorts & medical concierge, handled discreetly</Text>
                    </View>
                </View>

                <View style={s.form}>

                    <View style={s.field}>
                        <Text style={[s.label, { color: C.muted }]}>Type of care needed</Text>
                        <DropDown
                            value={careType}
                            options={CARE_TYPES}
                            onSelect={setCareType}
                            placeholder="Select care type"
                            C={C}
                            theme={theme}
                        />
                    </View>

                    <View style={s.field}>
                        <Text style={[s.label, { color: C.muted }]}>Duration</Text>
                        <DropDown
                            value={duration}
                            options={DURATION_TYPES}
                            onSelect={setDuration}
                            placeholder="How long do you need this for?"
                            C={C}
                            theme={theme}
                        />
                    </View>

                    <View style={s.field}>
                        <Text style={[s.label, { color: C.muted }]}>Location / City</Text>
                        <LocationSearch
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Search and select location..."
                        />
                    </View>

                    {showPersonnelCount && (
                        <View style={s.field}>
                            <Text style={[s.label, { color: C.muted }]}>
                                {careType === "24/7 Butler Service" ? "Number of staff" : "Number of agents"}
                            </Text>
                            <View style={[s.stepper, { backgroundColor: isDark ? "#111" : "#f7f3eb", borderColor: isDark ? "#2a2a2a" : "#e0dbd2" }]}>
                                <TouchableOpacity
                                    style={[s.stepBtn, { borderColor: isDark ? "#2a2a2a" : "#e0dbd2", backgroundColor: isDark ? "#1a1a1a" : "#fff" }]}
                                    onPress={() => setStaffCount(c => Math.max(1, c - 1))}
                                    activeOpacity={0.8}
                                >
                                    <Minus size={16} color={C.text} />
                                </TouchableOpacity>
                                <View style={{ alignItems: "center" }}>
                                    <Text style={{ fontSize: 9, fontWeight: "800", color: C.muted, letterSpacing: 2, marginBottom: 4 }}>
                                        {careType === "24/7 Butler Service" ? "STAFF" : "AGENTS"}
                                    </Text>
                                    <Text style={{ fontSize: 30, fontWeight: "800", color: GOLD }}>{staffCount}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[s.stepBtn, { borderColor: isDark ? "#2a2a2a" : "#e0dbd2", backgroundColor: isDark ? "#1a1a1a" : "#fff" }]}
                                    onPress={() => setStaffCount(c => Math.min(20, c + 1))}
                                    activeOpacity={0.8}
                                >
                                    <Plus size={16} color={C.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={s.field}>
                        <Text style={[s.label, { color: C.muted }]}>Start date / period</Text>
                        <TextInput
                            style={[s.input, { color: C.text, borderColor: startDate ? GOLD : (isDark ? "#2a2a2a" : "#e0dbd2") }]}
                            value={startDate}
                            onChangeText={setStartDate}
                            placeholder="e.g. 20 June 2026, or ASAP"
                            placeholderTextColor={C.muted}
                        />
                    </View>

                    <View style={s.field}>
                        <Text style={[s.label, { color: C.muted }]}>Tell us more</Text>
                        <VoiceInput
                            placeholder="Describe what you need: the household, event, medical situation, or protection requirement, and any specific preferences..."
                            value={description}
                            onChange={setDescription}
                            accent={GOLD}
                            textColor={C.text}
                            border={description ? GOLD : (isDark ? "#2a2a2a" : "#e0dbd2")}
                            inputBg={C.surface}
                        />
                    </View>

                    <View style={s.discreteNote}>
                        <ShieldCheck size={14} color={GOLD} />
                        <Text style={[s.discreteText, { color: C.muted }]}>All bespoke care requests are handled with complete discretion. Our team will contact you to discuss specific arrangements.</Text>
                    </View>

                    <TouchableOpacity
                        style={[s.cta, { opacity: loading ? 0.7 : 1 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <Text style={s.ctaText}>{loading ? "Submitting..." : "Request Bespoke Care"}</Text>
                    </TouchableOpacity>

                </View>
            </KeyboardAwareScrollView>

            {showSuccess && (
                <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.55)" }]} />
                    <Animated.View style={[s.alertBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <ShieldCheck size={40} color={GOLD} style={{ marginBottom: 14 }} />
                        <Text style={s.alertTitle}>Request Received</Text>
                        <Text style={s.alertBody}>Your bespoke care request has been submitted. Our team will reach out to you discreetly to finalise the arrangement.</Text>
                        <TouchableOpacity style={s.alertBtn} onPress={() => router.replace("/(tabs)")} activeOpacity={0.85}>
                            <Text style={s.alertBtnText}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </SafeAreaView>
    );
}

function getStyles(C: any, theme: string) {
    const isDark = theme === "dark";
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: C.background },

        hero: {
            height: 280,
            backgroundColor: "#0a0a0a",
            justifyContent: "flex-end",
            paddingBottom: 32,
            overflow: "hidden",
        },
        heroPattern: { ...StyleSheet.absoluteFillObject },
        heroLine: {
            position: "absolute",
            left: 0, right: 0,
            height: 1,
            backgroundColor: "rgba(201,168,76,0.06)",
        },
        backBtn: {
            position: "absolute",
            top: isAndroid ? 16 : 20,
            left: 20,
            width: 40, height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.1)",
            alignItems: "center",
            justifyContent: "center",
        },
        heroCenter: { paddingHorizontal: 26 },
        heroEyebrow: { fontSize: 10, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 3, marginBottom: 8 },
        heroTitle: { fontSize: isAndroid ? 34 : 38, fontFamily: "PlayfairDisplay_700Bold", color: "#fff", lineHeight: isAndroid ? 40 : 44, marginBottom: 12 },
        heroSub: { fontSize: 13, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.5)", lineHeight: 20 },

        form: { padding: 20, gap: 20 },
        field: { gap: 8 },
        label: { fontSize: 11, fontFamily: "Jost_700Bold", letterSpacing: 1.5 },

        input: {
            backgroundColor: C.surface,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            fontFamily: "Jost_400Regular",
            borderWidth: 1,
        },

        stepper: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
        },
        stepBtn: {
            width: 44, height: 44,
            borderRadius: 12,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
        },

        discreteNote: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
            backgroundColor: isDark ? "#111" : "#faf7f0",
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: isDark ? "#2a2a2a" : "#e8e2d4",
        },
        discreteText: { fontSize: 12, fontFamily: "Jost_400Regular", lineHeight: 18, flex: 1 },

        cta: {
            backgroundColor: GOLD,
            borderRadius: 16,
            paddingVertical: isAndroid ? 16 : 18,
            alignItems: "center",
            marginTop: 4,
        },
        ctaText: { fontSize: 15, fontFamily: "Jost_700Bold", color: "#0a0a0a" },

        alertBox: {
            position: "absolute",
            top: "30%",
            left: 32, right: 32,
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
            borderRadius: 24,
            padding: 32,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 12,
        },
        alertTitle: { fontSize: 22, fontFamily: "PlayfairDisplay_700Bold", color: isDark ? "#fff" : "#0a0a0a", marginBottom: 10, textAlign: "center" },
        alertBody: { fontSize: 14, fontFamily: "Jost_400Regular", color: isDark ? "rgba(255,255,255,0.6)" : "#666", textAlign: "center", lineHeight: 22, marginBottom: 24 },
        alertBtn: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
        alertBtnText: { fontSize: 15, fontFamily: "Jost_700Bold", color: "#0a0a0a" },
    });
}
