import { useState, useMemo, useRef } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, View, Platform, KeyboardAvoidingView, Keyboard, Modal, Animated, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Building2, UtensilsCrossed, Ticket, Sparkles, Plane, Anchor, MoreHorizontal, MapPin, Users, Minus, Plus, Check, Calendar } from "lucide-react-native";

const LIFESTYLE_TYPES = [
    { id: "Hotel & Accommodation", label: "Apartment & Stay", icon: Building2 },
    { id: "Restaurant Reservation", label: "Restaurant", icon: UtensilsCrossed },
    { id: "Event Access", label: "Event Access", icon: Ticket },
    { id: "Spa & Wellness", label: "Spa & Wellness", icon: Sparkles },
    { id: "Private Jet", label: "Private Jet", icon: Plane },
    { id: "Yacht Charter", label: "Yacht Charter", icon: Anchor },
    { id: "Other", label: "Other", icon: MoreHorizontal },
];

const BUDGET_RANGES = ["Under ₦500k", "₦500k – ₦2M", "₦2M – ₦10M", "₦10M+", "Open Budget"];

export default function LifestyleTravelScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const { prefillType, prefillVenue, prefillCity } = useLocalSearchParams<{ prefillType?: string; prefillVenue?: string; prefillCity?: string }>();

    const prefillDest = prefillVenue ? `${prefillVenue}${prefillCity ? `, ${prefillCity}` : ""}` : "";

    const [serviceType, setServiceType] = useState(prefillType ?? "");
    const [destination, setDestination] = useState(prefillDest);
    const [dateFromObj, setDateFromObj] = useState<Date | null>(null);
    const [dateToObj, setDateToObj] = useState<Date | null>(null);
    const [showDateFrom, setShowDateFrom] = useState(false);
    const [showDateTo, setShowDateTo] = useState(false);
    const [guests, setGuests] = useState(1);
    const [budget, setBudget] = useState("");
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
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=en&country=NG`;
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
        if (!serviceType || !destination) { setShowError(true); return; }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "lifestyle-travel",
            status: "pending",
            reference: ref,
            title: serviceType,
            details: { serviceType, destination, dateFrom: fmtDate(dateFromObj), dateTo: fmtDate(dateToObj), guests, budget, preferences },
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

                    {/* Header */}
                    <View style={s.header}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                            <ChevronLeft size={24} color={C.text} />
                        </TouchableOpacity>
                        <View style={s.headerTextWrap}>
                            <Text style={s.headerEyebrow}>CONCIERGE</Text>
                            <Text style={s.headerTitle}>Hospitality & Travel</Text>
                            <Text style={s.headerSub}>Hotels, experiences & travel coordination</Text>
                        </View>
                        <View style={s.headerIconWrap}>
                            <Plane size={22} color={C.primary} />
                        </View>
                    </View>

                    {/* Venue context banner */}
                    {!!prefillVenue && (
                        <View style={s.venueBanner}>
                            <MapPin size={13} color={C.primary} />
                            <Text style={s.venueBannerText}>Requesting for <Text style={{ color: C.primary, fontWeight: "700" }}>{prefillVenue}</Text></Text>
                        </View>
                    )}

                    {/* Service type cards */}
                    <Text style={s.sectionLabel}>What can we arrange? *</Text>
                    <View style={s.cardGrid}>
                        {LIFESTYLE_TYPES.map(({ id, label, icon: Icon }) => {
                            const active = serviceType === id;
                            return (
                                <TouchableOpacity
                                    key={id}
                                    style={[s.typeCard, active && s.typeCardActive]}
                                    onPress={() => setServiceType(id)}
                                    activeOpacity={0.75}
                                >
                                    <View style={[s.typeIconWrap, active && s.typeIconWrapActive]}>
                                        <Icon size={20} color={active ? C.primary : C.muted} strokeWidth={1.8} />
                                    </View>
                                    <Text style={[s.typeLabel, active && s.typeLabelActive]}>{label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {showError && !serviceType && <Text style={s.fieldError}>Please select a service type.</Text>}

                    {/* Destination */}
                    <Text style={s.sectionLabel}>Where to? *</Text>
                    <View style={[s.inputRow, showError && !destination && s.inputRowError]}>
                        {searching
                            ? <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 10 }} />
                            : <MapPin size={17} color={C.primary} style={{ marginRight: 10 }} />
                        }
                        <TextInput
                            style={[s.inputFlex, { color: C.text }]}
                            placeholder="City, hotel, venue or region..."
                            placeholderTextColor={C.muted}
                            value={destination}
                            onChangeText={t => { setDestination(t); if (!t) setDestinationSuggestions([]); else searchDestination(t); }}
                            onBlur={() => setTimeout(() => setDestinationSuggestions([]), 300)}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                    </View>
                    {destinationSuggestions.length > 0 && (
                        <View style={[s.suggestionBox, { backgroundColor: C.surface, borderColor: C.border }]}>
                            {destinationSuggestions.map((place, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[s.suggestionItem, i < destinationSuggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                                    onPress={() => { setDestination(place); setDestinationSuggestions([]); Keyboard.dismiss(); }}
                                >
                                    <MapPin size={13} color={C.muted} style={{ marginRight: 8 }} />
                                    <Text style={[s.suggestionText, { color: C.text }]} numberOfLines={1}>{place}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Dates */}
                    <Text style={s.sectionLabel}>Dates</Text>
                    <View style={s.dateRow}>
                        <TouchableOpacity style={[s.inputRow, { flex: 1 }]} onPress={() => setShowDateFrom(true)}>
                            <Calendar size={15} color={C.primary} style={{ marginRight: 8 }} />
                            <Text style={{ color: dateFromObj ? C.text : C.muted, fontSize: 14 }}>{fmtDate(dateFromObj) ?? "From"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.inputRow, { flex: 1 }]} onPress={() => setShowDateTo(true)}>
                            <Calendar size={15} color={C.primary} style={{ marginRight: 8 }} />
                            <Text style={{ color: dateToObj ? C.text : C.muted, fontSize: 14 }}>{fmtDate(dateToObj) ?? "To"}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Guests */}
                    <Text style={s.sectionLabel}>Guests</Text>
                    <View style={s.stepperRow}>
                        <Users size={17} color={C.primary} />
                        <TouchableOpacity style={s.stepBtn} onPress={() => setGuests(g => Math.max(1, g - 1))}>
                            <Minus size={16} color={C.text} />
                        </TouchableOpacity>
                        <Text style={[s.stepVal, { color: C.text }]}>{guests}</Text>
                        <TouchableOpacity style={s.stepBtn} onPress={() => setGuests(g => Math.min(50, g + 1))}>
                            <Plus size={16} color={C.text} />
                        </TouchableOpacity>
                        <Text style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>{guests === 1 ? "guest" : "guests"}</Text>
                    </View>

                    {/* Budget */}
                    <Text style={s.sectionLabel}>Budget Range</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {BUDGET_RANGES.map(b => (
                                <TouchableOpacity
                                    key={b}
                                    style={[s.budgetChip, budget === b && s.budgetChipActive]}
                                    onPress={() => setBudget(b === budget ? "" : b)}
                                >
                                    <Text style={[s.budgetChipText, budget === b && s.budgetChipTextActive]}>{b}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Preferences */}
                    <Text
                        style={s.sectionLabel}
                        onLayout={e => { prefsY.current = e.nativeEvent.layout.y; }}
                    >Preferences & Requirements</Text>
                    <TextInput
                        ref={prefsRef}
                        style={s.textarea}
                        placeholder="Dietary needs, suite preferences, special occasions, specific requests..."
                        placeholderTextColor={C.muted}
                        multiline
                        value={preferences}
                        onChangeText={setPreferences}
                        returnKeyType="done"
                        submitBehavior="blurAndSubmit"
                        onSubmitEditing={() => Keyboard.dismiss()}
                        onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: prefsY.current - 80, animated: true }), 350)}
                    />

                    {showError && !destination && (
                        <Text style={s.fieldError}>Please fill in all required fields.</Text>
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
                        <Text style={s.modalBody}>Your concierge will curate the best options for you shortly.</Text>
                        <TouchableOpacity style={s.modalBtnPri} onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}>
                            <Text style={s.modalBtnTxPri}>View My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSec} onPress={() => { setShowSuccess(false); router.back(); }}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            <Modal visible={showDateFrom} transparent animationType="slide">
                <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setShowDateFrom(false)} />
                <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                    <View style={s.pickerHeader}>
                        <TouchableOpacity onPress={() => setShowDateFrom(false)}><Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text></TouchableOpacity>
                        <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>From</Text>
                        <TouchableOpacity onPress={() => setShowDateFrom(false)}><Text style={{ color: C.primary, fontWeight: "700", fontSize: 15 }}>Done</Text></TouchableOpacity>
                    </View>
                    <DateTimePicker value={dateFromObj ?? new Date()} mode="date" display="spinner" minimumDate={new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }}
                        onChange={(_, d) => { if (d) setDateFromObj(d); }} />
                </View>
            </Modal>

            <Modal visible={showDateTo} transparent animationType="slide">
                <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setShowDateTo(false)} />
                <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                    <View style={s.pickerHeader}>
                        <TouchableOpacity onPress={() => setShowDateTo(false)}><Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text></TouchableOpacity>
                        <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>To</Text>
                        <TouchableOpacity onPress={() => setShowDateTo(false)}><Text style={{ color: C.primary, fontWeight: "700", fontSize: 15 }}>Done</Text></TouchableOpacity>
                    </View>
                    <DateTimePicker value={dateToObj ?? dateFromObj ?? new Date()} mode="date" display="spinner" minimumDate={dateFromObj ?? new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }}
                        onChange={(_, d) => { if (d) setDateToObj(d); }} />
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },

    header: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", marginTop: 4 },
    headerTextWrap: { flex: 1 },
    headerEyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2, marginBottom: 4 },
    headerTitle: { fontSize: 26, fontWeight: "700", color: C.text, marginBottom: 4 },
    headerSub: { fontSize: 13, color: C.muted, lineHeight: 18 },
    headerIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme === "dark" ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.1)", alignItems: "center", justifyContent: "center", marginTop: 4 },

    venueBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme === "dark" ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.06)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: theme === "dark" ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.15)" },
    venueBannerText: { fontSize: 13, color: C.text, flex: 1 },
    sectionLabel: { fontSize: 11, fontWeight: "800", color: C.primary, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, paddingHorizontal: 20 },

    cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 20, marginBottom: 8 },
    typeCard: { width: "30%", flexGrow: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14, alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: C.border },
    typeCardActive: { borderColor: C.primary, backgroundColor: theme === "dark" ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.06)" },
    typeIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.background, alignItems: "center", justifyContent: "center" },
    typeIconWrapActive: { backgroundColor: theme === "dark" ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.12)" },
    typeLabel: { fontSize: 11, fontWeight: "600", color: C.muted, textAlign: "center" },
    typeLabelActive: { color: C.primary },

    inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 20 },
    inputRowError: { borderColor: "#ef5350" },
    inputFlex: { flex: 1, fontSize: 14 },

    dateRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 20 },

    stepperRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 24, gap: 12 },
    stepBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
    stepVal: { fontSize: 18, fontWeight: "700", minWidth: 24, textAlign: "center" },

    budgetChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, marginLeft: 20 },
    budgetChipActive: { borderColor: C.primary, backgroundColor: theme === "dark" ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.08)" },
    budgetChipText: { fontSize: 13, color: C.muted, fontWeight: "600" },
    budgetChipTextActive: { color: C.primary },

    textarea: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, height: 120, textAlignVertical: "top", marginHorizontal: 20, marginBottom: 20 },

    suggestionBox: { borderWidth: 1, borderRadius: 14, marginHorizontal: 20, marginTop: -16, marginBottom: 20, overflow: "hidden" },
    suggestionItem: { flexDirection: "row", alignItems: "center", padding: 14 },
    suggestionText: { fontSize: 13, flex: 1 },

    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },

    fieldError: { fontSize: 12, color: "#ef5350", marginBottom: 12, paddingHorizontal: 20 },

    btn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center", marginHorizontal: 20 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: C.background, fontSize: 15, fontWeight: "700" },

    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.background, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: C.primary, alignItems: "center" },
    modalIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(201,168,76,0.1)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary, alignItems: "center" },
    modalBtnTxPri: { color: C.background, fontSize: 14, fontWeight: "700" },
    modalBtnSec: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },
});
