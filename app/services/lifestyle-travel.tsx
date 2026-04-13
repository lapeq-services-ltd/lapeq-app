import { useState, useMemo, useRef } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, View, Platform, KeyboardAvoidingView, Keyboard, Modal, Animated, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, MapPin, Check, Calendar } from "lucide-react-native";

const SERVICES = [
    { id: "Curated Itinerary", label: "Curated Itinerary" },
    { id: "Stays & Accommodations", label: "Stays & Accommodations" },
    { id: "Flights & Jets", label: "Flights & Jets" },
    { id: "Private Dining", label: "Private Dining" },
    { id: "VIP Protocol", label: "VIP Protocol" },
    { id: "Other", label: "Other" },
];
const BUDGET_RANGES = ["Under ₦5M", "₦5M – ₦20M", "₦20M+", "Open Budget"];

export default function LifestyleTravelScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const { prefillType, prefillVenue, prefillCity } = useLocalSearchParams<{ prefillType?: string; prefillVenue?: string; prefillCity?: string }>();

    const prefillDest = prefillVenue ? `${prefillVenue}${prefillCity ? `, ${prefillCity}` : ""}` : "";

    const [serviceType, setServiceType] = useState(prefillType || "Curated Itinerary");
    const [destination, setDestination] = useState(prefillDest);
    const [dateFromObj, setDateFromObj] = useState<Date | null>(null);
    const [dateToObj, setDateToObj] = useState<Date | null>(null);
    const [showDateFrom, setShowDateFrom] = useState(false);
    const [showDateTo, setShowDateTo] = useState(false);
    const [budget, setBudget] = useState("");
    const [showNotes, setShowNotes] = useState(false);
    const [preferences, setPreferences] = useState("");
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
    const [searching, setSearching] = useState(false);
    const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scrollRef = useRef<ScrollView>(null);
    const prefsY = useRef(0);
    const prefsRef = useRef<TextInput>(null);

    const fmtDate = (d: Date | null) => d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

    const searchDestination = (text: string) => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (text.length < 2) { setDestinationSuggestions([]); return; }
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
            try {
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=4&language=en&country=NG`;
                const res = await fetch(url);
                const json = await res.json();
                setDestinationSuggestions((json.features ?? []).map((f: any) => f.place_name));
            } catch {}
            setSearching(false);
        }, 200);
    };

    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSubmit = async () => {
        // We only require preferences if destination is empty, or destination if preferences is empty
        // essentially, we just need *some* input describing the trip.
        if (!serviceType || (!destination && preferences.trim().length === 0)) { 
            setShowError(true); 
            return; 
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "lifestyle-travel",
            status: "pending",
            reference: ref,
            title: serviceType,
            details: { serviceType, destination, dateFrom: fmtDate(dateFromObj), dateTo: fmtDate(dateToObj), budget, preferences },
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
                    
                    {/* Minimalist Premium Header */}
                    <View style={s.header}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                            <ChevronLeft size={24} color={C.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={s.headerTitle}>Bespoke Travel</Text>
                            <Text style={s.headerSub}>Curated travel, stays, and exclusive access tailored to your exact tastes.</Text>
                        </View>
                    </View>

                    {/* Venue Context */}
                    {!!prefillVenue && (
                        <View style={s.venueBanner}>
                            <MapPin size={13} color={C.primary} />
                            <Text style={s.venueBannerText}>Requesting for <Text style={{ color: C.primary, fontWeight: "700" }}>{prefillVenue}</Text></Text>
                        </View>
                    )}

                    {/* Service Type Selection (Elegant Horizontal Scroll instead of boxy cards) */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeScroll} contentContainerStyle={{ paddingHorizontal: 28, gap: 24, paddingBottom: 10 }}>
                        {SERVICES.map(({ id, label }) => {
                            const active = serviceType === id;
                            return (
                                <TouchableOpacity key={id} onPress={() => setServiceType(id)} activeOpacity={0.7}>
                                    <Text style={[s.typeTab, active && s.typeTabActive]}>{label}</Text>
                                    {active && <View style={[s.typeTabUnderline, { backgroundColor: C.primary }]} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={s.formContainer}>
                        {/* Destination (Underline style instead of full border) */}
                        <Text style={s.fieldLabel}>Where are you going?</Text>
                        <View style={[s.inputUnderlineRow, showError && !destination && !preferences && s.inputRowError]}>
                            {searching ? <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 12 }} /> : <MapPin size={18} color={C.primary} style={{ marginRight: 12 }} />}
                            <TextInput
                                style={s.inputFlex}
                                placeholder="City, hotel, region, or let us suggest..."
                                placeholderTextColor={theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                value={destination}
                                onChangeText={t => { setDestination(t); if (!t) setDestinationSuggestions([]); else searchDestination(t); }}
                                onBlur={() => setTimeout(() => setDestinationSuggestions([]), 300)}
                                returnKeyType="next"
                            />
                        </View>
                        {destinationSuggestions.length > 0 && (
                            <View style={s.suggestionBox}>
                                {destinationSuggestions.map((place, i) => (
                                    <TouchableOpacity key={i} style={s.suggestionItem} onPress={() => { setDestination(place); setDestinationSuggestions([]); Keyboard.dismiss(); }}>
                                        <Text style={s.suggestionText} numberOfLines={1}>{place}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Dates */}
                        <Text style={s.fieldLabel}>When?</Text>
                        <View style={s.dateRow}>
                            <TouchableOpacity style={s.dateBtn} onPress={() => setShowDateFrom(true)}>
                                <Calendar size={16} color={dateFromObj ? C.primary : C.muted} style={{ marginRight: 8 }} />
                                <Text style={{ color: dateFromObj ? C.text : C.muted, fontSize: 15, fontFamily: "Jost_500Medium" }}>{fmtDate(dateFromObj) ?? "Start Date"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.dateBtn} onPress={() => setShowDateTo(true)}>
                                <Calendar size={16} color={dateToObj ? C.primary : C.muted} style={{ marginRight: 8 }} />
                                <Text style={{ color: dateToObj ? C.text : C.muted, fontSize: 15, fontFamily: "Jost_500Medium" }}>{fmtDate(dateToObj) ?? "End Date"}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Budget */}
                        <Text style={s.fieldLabel}>Budget Range</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 32 }} contentContainerStyle={{ gap: 12 }}>
                            {BUDGET_RANGES.map(b => (
                                <TouchableOpacity key={b} onPress={() => setBudget(b)} style={[s.budgetChip, budget === b && s.budgetChipActive]}>
                                    <Text style={[s.budgetChipText, budget === b && s.budgetChipTextActive]}>{b}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* The Large Open Expression Area (Conditional) */}
                        {serviceType === "Curated Itinerary" || showNotes ? (
                            <View>
                                <View onLayout={e => { prefsY.current = e.nativeEvent.layout.y; }} style={{ marginBottom: 12 }}>
                                    <Text style={s.experienceHeader}>Design Your Experience</Text>
                                    <Text style={s.experienceSub}>Tell us everything. Specific aesthetics, special occasions, or the exact vibe you are looking for.</Text>
                                </View>
                                <TextInput
                                    ref={prefsRef}
                                    style={[s.textarea, showError && !preferences && !destination && { borderColor: "#ef5350", borderWidth: 1 }]}
                                    placeholder="e.g., I'm looking for a secluded villa with a private chef..."
                                    placeholderTextColor={theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"}
                                    multiline
                                    value={preferences}
                                    onChangeText={setPreferences}
                                    onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: prefsY.current - 40, animated: true }), 350)}
                                    textAlignVertical="top"
                                />
                            </View>
                        ) : (
                            <TouchableOpacity style={s.addNotesBtn} onPress={() => setShowNotes(true)}>
                                <Text style={s.addNotesTx}>+ Add specific requirements or preferences</Text>
                            </TouchableOpacity>
                        )}

                        {showError && (!destination && !preferences) && (
                            <Text style={s.fieldError}>Please provide either a destination or describe your experience.</Text>
                        )}

                        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
                            <Text style={s.submitText}>{loading ? "Orchestrating..." : "Submit Inquiry"}</Text>
                        </TouchableOpacity>
                        <View style={{ height: 60 }} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={s.modalIcon}><Check size={28} color={C.primary} strokeWidth={2} /></View>
                        <Text style={s.modalTitle}>Inquiry Received</Text>
                        <Text style={s.modalBody}>Your private luxury advisor has been notified and will curate the perfect options for your journey shortly.</Text>
                        <TouchableOpacity style={s.modalBtnPri} onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}>
                            <Text style={s.modalBtnTxPri}>View Request</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSec} onPress={() => { setShowSuccess(false); router.back(); }}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Pickers */}
            <Modal visible={showDateFrom} transparent animationType="slide">
                <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setShowDateFrom(false)} />
                <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                    <View style={s.pickerHeader}>
                        <TouchableOpacity onPress={() => setShowDateFrom(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                        <Text style={{ color: C.text, fontFamily: "PlayfairDisplay_700Bold", fontSize: 18 }}>Start Date</Text>
                        <TouchableOpacity onPress={() => setShowDateFrom(false)}><Text style={{ color: C.primary, fontWeight: "600", fontSize: 16 }}>Done</Text></TouchableOpacity>
                    </View>
                    <DateTimePicker value={dateFromObj ?? new Date()} mode="date" display="spinner" minimumDate={new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDateFromObj(d); }} />
                </View>
            </Modal>
            <Modal visible={showDateTo} transparent animationType="slide">
                <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setShowDateTo(false)} />
                <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                    <View style={s.pickerHeader}>
                        <TouchableOpacity onPress={() => setShowDateTo(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                        <Text style={{ color: C.text, fontFamily: "PlayfairDisplay_700Bold", fontSize: 18 }}>End Date</Text>
                        <TouchableOpacity onPress={() => setShowDateTo(false)}><Text style={{ color: C.primary, fontWeight: "600", fontSize: 16 }}>Done</Text></TouchableOpacity>
                    </View>
                    <DateTimePicker value={dateToObj ?? dateFromObj ?? new Date()} mode="date" display="spinner" minimumDate={dateFromObj ?? new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDateToObj(d); }} />
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 24 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    headerEyebrow: { fontSize: 11, fontFamily: "Jost_700Bold", color: C.primary, letterSpacing: 3, marginBottom: 8 },
    headerTitle: { fontSize: 36, fontFamily: "PlayfairDisplay_700Bold", color: C.text, marginBottom: 8, lineHeight: 42 },
    headerSub: { fontSize: 15, fontFamily: "Jost_400Regular", color: theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", lineHeight: 22 },

    venueBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 28, marginBottom: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.15)" },
    venueBannerText: { fontSize: 14, fontFamily: "Jost_400Regular", color: C.text, flex: 1 },

    typeScroll: { flexGrow: 0, marginBottom: 32 },
    typeTab: { fontSize: 15, fontFamily: "Jost_500Medium", color: theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", paddingBottom: 6 },
    typeTabActive: { color: C.text, fontFamily: "Jost_600SemiBold" },
    typeTabUnderline: { height: 2, borderRadius: 2, marginTop: 4, width: "100%" },

    formContainer: { paddingHorizontal: 28 },
    fieldLabel: { fontSize: 13, fontFamily: "Jost_600SemiBold", color: theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },
    
    inputUnderlineRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", paddingVertical: 12, marginBottom: 32 },
    inputRowError: { borderBottomColor: "#ef5350" },
    inputFlex: { flex: 1, fontSize: 16, fontFamily: "Jost_400Regular", color: C.text, paddingVertical: 4 },

    suggestionBox: { marginTop: -24, marginBottom: 32, backgroundColor: theme === "dark" ? "#191919" : "#f5f5f5", borderRadius: 12, overflow: "hidden" },
    suggestionItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
    suggestionText: { fontSize: 14, fontFamily: "Jost_400Regular", color: C.text },

    dateRow: { flexDirection: "row", gap: 16, marginBottom: 28 },
    dateBtn: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" },

    budgetChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 100, borderWidth: 1, borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" },
    budgetChipActive: { borderColor: C.primary, backgroundColor: C.surface },
    budgetChipText: { fontSize: 13, fontFamily: "Jost_500Medium", color: theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" },
    budgetChipTextActive: { color: C.primary },

    addNotesBtn: { paddingVertical: 16, marginBottom: 32, alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", borderRadius: 12 },
    addNotesTx: { fontSize: 14, fontFamily: "Jost_500Medium", color: theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" },

    experienceHeader: { fontSize: 24, fontFamily: "PlayfairDisplay_700Bold", color: C.text, marginBottom: 8 },
    experienceSub: { fontSize: 14, fontFamily: "Jost_400Regular", color: theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", lineHeight: 22 },
    textarea: {
        backgroundColor: C.surface,
        borderRadius: 16, 
        padding: 20, 
        fontSize: 16, 
        fontFamily: "Jost_400Regular", 
        color: C.text, 
        minHeight: 180, 
        lineHeight: 24,
        marginBottom: 32 
    },

    fieldError: { fontSize: 13, fontFamily: "Jost_500Medium", color: "#ef5350", marginBottom: 16 },

    submitBtn: { backgroundColor: C.primary, borderRadius: 100, paddingVertical: 18, alignItems: "center", shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    submitText: { color: C.background, fontSize: 16, fontFamily: "Jost_600SemiBold", letterSpacing: 0.5 },

    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center" },
    modalIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.surface, justifyContent: "center", alignItems: "center", marginBottom: 24 },
    modalTitle: { color: C.text, fontSize: 24, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 12 },
    modalBody: { color: theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", fontSize: 15, fontFamily: "Jost_400Regular", textAlign: "center", lineHeight: 24, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 16, borderRadius: 100, backgroundColor: C.text, alignItems: "center", marginBottom: 12 },
    modalBtnTxPri: { color: C.background, fontSize: 15, fontFamily: "Jost_600SemiBold" },
    modalBtnSec: { width: "100%", paddingVertical: 16, alignItems: "center" },
    modalBtnTxSec: { color: theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 15, fontFamily: "Jost_600SemiBold" },

    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },
});
