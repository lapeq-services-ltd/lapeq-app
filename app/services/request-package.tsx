import { useState, useMemo, useEffect } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Calendar, CheckCircle2, ChevronDown, Maximize2, Mic, X, Play, Pause, Trash2, Minus, Plus } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import LocationSearch from "@/components/LocationSearch";
import { Audio } from "expo-av";
import VoiceInput from "@/components/VoiceInput";

const TYPE_ACTIVITIES: Record<string, string[]> = {
    leisure: [
        "Hotel / Villa Stay",
        "Spa & Wellness",
        "Nightlife & Lounges",
        "Shopping & Styling",
        "Golf & Recreation",
        "Boat / Yacht",
        "Chauffeur & Transport",
    ],
    business: [
        "Business Dinner",
        "Chauffeur & Transport",
        "Airport Protocol",
        "Hotel / Villa Stay",
        "Exclusive Events",
    ],
    romantic: [
        "Private Dining",
        "Hotel / Villa Stay",
        "Spa & Wellness",
        "Private Chef at Home",
        "Boat / Yacht",
        "Photography Session",
    ],
    cultural: [
        "Cultural Experiences",
        "Exclusive Events",
        "Photography Session",
        "Hotel / Villa Stay",
    ],
    adventure: [
        "Golf & Recreation",
        "Boat / Yacht",
        "Cultural Experiences",
        "Chauffeur & Transport",
    ],
};

const TYPES = [
    { key: "leisure", label: "Leisure" },
    { key: "business", label: "Business" },
    { key: "romantic", label: "Romantic Getaway" },
    { key: "cultural", label: "Cultural" },
    { key: "adventure", label: "Adventure" },
];

const BUDGETS = [
    { key: "under-500k", label: "Under ₦500K" },
    { key: "500k-1m", label: "₦500K – ₦1M" },
    { key: "1m-3m", label: "₦1M – ₦3M" },
    { key: "3m-plus", label: "₦3M+" },
];

function fmtDate(d: Date | null) {
    if (!d) return null;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toISO(d: Date | null) {
    if (!d) return null;
    return d.toISOString().split("T")[0];
}

// Reusable voice input field with expand and mic dictation
export default function RequestPackageScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [city, setCity] = useState("");
    const [citySelected, setCitySelected] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [type, setType] = useState<string | null>(null);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [budget, setBudget] = useState<string>("under-500k");
    const [activities, setActivities] = useState<string[]>([]);
    const [notes, setNotes] = useState("");

    const toggleActivity = (item: string) =>
        setActivities(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]);

    const filteredActivities = useMemo(() => {
        if (!type) return [];
        return TYPE_ACTIVITIES[type] ?? [];
    }, [type]);

    // Date picker state
    const [pickerTarget, setPickerTarget] = useState<"start" | "end" | null>(null);
    const [tempDate, setTempDate] = useState<Date>(new Date());

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [newId, setNewId] = useState<string | null>(null);

    const openPicker = (target: "start" | "end") => {
        const current = target === "start" ? startDate : endDate;
        setTempDate(current ?? new Date());
        setPickerTarget(target);
    };

    const confirmDate = () => {
        if (pickerTarget === "start") {
            setStartDate(tempDate);
            if (endDate && tempDate > endDate) setEndDate(null);
        } else {
            setEndDate(tempDate);
        }
        setPickerTarget(null);
    };

    const handleAndroidChange = (_: any, date?: Date) => {
        setPickerTarget(null);
        if (date) {
            if (pickerTarget === "start") {
                setStartDate(date);
                if (endDate && date > endDate) setEndDate(null);
            } else {
                setEndDate(date);
            }
        }
    };

    const handleSubmit = async () => {
        if (!city.trim()) { Alert.alert("Please search and select a destination."); return; }
        if (!citySelected) { Alert.alert("Please select a location from the search recommendations."); return; }
        if (!type) { Alert.alert("Please choose an experience type."); return; }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setLoading(true);
        const voiceNoteUrlMatch = notes ? notes.match(/\[Voice Note: (https:\/\/.*?)\]/) : null;
        const voiceNoteUrl = voiceNoteUrlMatch ? voiceNoteUrlMatch[1] : null;

        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { data, error } = await supabase.from("requests").insert({
            user_id: user.id,
            service_type: "experience",
            status: "pending",
            reference: ref,
            title: `Experience Package - ${city.trim()}`,
            details: {
                city: city.trim(),
                type,
                start_date: toISO(startDate),
                end_date: toISO(endDate),
                budget_range: budget,
                activities: activities.length > 0 ? activities : null,
                notes: notes.trim() || null,
                voice_note: voiceNoteUrl,
            },
        }).select("id").single();
        setLoading(false);

        if (error) { Alert.alert("Error", error.message); return; }
        setNewId(data?.id ?? null);
        setSuccess(true);
    };

    const borderCol = theme === "dark" ? "#2a2a2a" : "#d8d3ca";

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>Request a Package</Text>
                    <Text style={s.subtitle}>Tell us the basics - we handle everything else</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

                {/* City / Location Autocomplete */}
                <Text style={s.label}>Where are you going?</Text>
                <LocationSearch
                    value={city}
                    onChangeText={(text) => {
                        setCity(text);
                        setCitySelected(false);
                    }}
                    placeholder="e.g. Lagos, Abuja, Dubai, London"
                    onSelect={(place) => {
                        setCity(place);
                        setCitySelected(true);
                    }}
                    style={{ marginBottom: 28 }}
                />

                {/* Dates */}
                <Text style={s.label}>When?</Text>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
                    <TouchableOpacity style={[s.dateBtn, { flex: 1 }]} onPress={() => openPicker("start")} activeOpacity={0.8}>
                        <Calendar size={16} color={startDate ? C.primary : C.muted} />
                        <Text style={[s.dateBtnText, startDate && { color: C.text }]}>
                            {fmtDate(startDate) ?? "Start date"}
                        </Text>
                        <ChevronDown size={14} color={C.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.dateBtn, { flex: 1 }]} onPress={() => openPicker("end")} activeOpacity={0.8}>
                        <Calendar size={16} color={endDate ? C.primary : C.muted} />
                        <Text style={[s.dateBtnText, endDate && { color: C.text }]}>
                            {fmtDate(endDate) ?? "End date"}
                        </Text>
                        <ChevronDown size={14} color={C.muted} />
                    </TouchableOpacity>
                </View>

                {/* Type of Experience Custom Dropdown */}
                <Text style={s.label}>Type of experience</Text>
                <View style={{ position: "relative", zIndex: 10, marginBottom: 28 }}>
                    <TouchableOpacity
                        style={[s.dropdownTrigger, showTypeDropdown && s.dropdownTriggerActive]}
                        onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                        activeOpacity={0.9}
                    >
                        <Text style={[s.dropdownValue, !type && { color: C.muted }]}>
                            {type ? TYPES.find(t => t.key === type)?.label : "Select experience type"}
                        </Text>
                        <ChevronDown size={18} color={C.primary} style={{ transform: [{ rotate: showTypeDropdown ? "180deg" : "0deg" }] }} />
                    </TouchableOpacity>

                    {showTypeDropdown && (
                        <View style={s.dropdownList}>
                            {TYPES.map(t => (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[s.dropdownItem, type === t.key && s.dropdownItemActive]}
                                    onPress={() => {
                                        setType(t.key);
                                        setActivities([]);
                                        setShowTypeDropdown(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[s.dropdownItemText, type === t.key && s.dropdownItemTextActive]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Tailored Activities */}
                {type ? (
                    <>
                        <Text style={s.label}>What do you want to do? <Text style={s.labelOptional}>(select all that apply)</Text></Text>
                        <View style={[s.chipRow, { marginBottom: 28 }]}>
                            {filteredActivities.map(item => (
                                <TouchableOpacity
                                    key={item}
                                    style={[s.chip, activities.includes(item) && s.chipActive]}
                                    onPress={() => toggleActivity(item)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.chipText, activities.includes(item) && s.chipTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                ) : (
                    <View style={{ marginBottom: 28 }}>
                        <Text style={s.label}>What do you want to do?</Text>
                        <View style={s.tailorPlaceholder}>
                            <Text style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>
                                Select an experience type above to unlock tailored activities.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Budget */}
                <Text style={s.label}>Budget range</Text>
                {(() => {
                    const currentIdx = BUDGETS.findIndex(b => b.key === budget);
                    return (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 28 }}>
                            <TouchableOpacity
                                style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    borderWidth: 1, borderColor: borderCol,
                                    backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
                                    opacity: currentIdx <= 0 ? 0.4 : 1
                                }}
                                disabled={currentIdx <= 0}
                                onPress={() => {
                                    const newIdx = Math.max(0, currentIdx - 1);
                                    setBudget(BUDGETS[newIdx].key);
                                }}
                            >
                                <Minus size={16} color={C.text} />
                            </TouchableOpacity>
                            <View style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: borderCol, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                                    {BUDGETS[currentIdx]?.label ?? "Select Budget"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    borderWidth: 1, borderColor: borderCol,
                                    backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
                                    opacity: currentIdx >= BUDGETS.length - 1 ? 0.4 : 1
                                }}
                                disabled={currentIdx >= BUDGETS.length - 1}
                                onPress={() => {
                                    const newIdx = Math.min(BUDGETS.length - 1, currentIdx + 1);
                                    setBudget(BUDGETS[newIdx].key);
                                }}
                            >
                                <Plus size={16} color={C.text} />
                            </TouchableOpacity>
                        </View>
                    );
                })()}

                {/* Notes (VoiceInput) */}
                <Text style={s.label}>Anything else we should know? <Text style={s.labelOptional}>(optional)</Text></Text>
                <VoiceInput
                    placeholder="Special requests, preferences, dietary requirements, celebration notes..."
                    value={notes}
                    onChange={setNotes}
                    accent={C.primary}
                    textColor={C.text}
                    border={borderCol}
                    inputBg={C.surface}
                />

                <TouchableOpacity
                    style={[s.submitBtn, loading && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={s.submitText}>{loading ? "Submitting..." : "Request My Package"}</Text>
                </TouchableOpacity>

                <Text style={s.disclaimer}>
                    Your concierge will review your brief and begin crafting your personalised itinerary. You will be notified when it's ready.
                </Text>

            </ScrollView>

            {/* Date picker — iOS only in Modal */}
            {Platform.OS === "ios" && (
                <Modal
                    visible={!!pickerTarget}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setPickerTarget(null)}
                >
                    <TouchableOpacity
                        style={s.pickerOverlay}
                        activeOpacity={1}
                        onPress={() => setPickerTarget(null)}
                    >
                        <View style={s.pickerSheet} onStartShouldSetResponder={() => true}>
                            <View style={s.pickerHeader}>
                                <TouchableOpacity onPress={() => setPickerTarget(null)}>
                                    <Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={s.pickerTitle}>
                                    {pickerTarget === "start" ? "Start Date" : "End Date"}
                                </Text>
                                <TouchableOpacity onPress={confirmDate}>
                                    <Text style={{ color: C.primary, fontSize: 15, fontWeight: "700" }}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display="spinner"
                                minimumDate={pickerTarget === "end" && startDate ? startDate : new Date()}
                                onChange={(_, date) => { if (date) setTempDate(date); }}
                                style={{ width: "100%" }}
                                themeVariant={theme === "dark" ? "dark" : "light"}
                            />
                            <TouchableOpacity style={s.pickerDoneBtn} onPress={confirmDate}>
                                <Text style={s.pickerDoneText}>Confirm Date</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Date picker — Android only native dialogue */}
            {Platform.OS === "android" && !!pickerTarget && (
                <DateTimePicker
                    value={tempDate}
                    mode="date"
                    minimumDate={pickerTarget === "end" && startDate ? startDate : new Date()}
                    onChange={handleAndroidChange}
                />
            )}

            {/* Success modal */}
            <Modal visible={success} transparent animationType="fade">
                <View style={s.successOverlay}>
                    <View style={s.successBox}>
                        <CheckCircle2 size={48} color={C.primary} style={{ marginBottom: 16 }} />
                        <Text style={s.successTitle}>Package Requested</Text>
                        <Text style={s.successBody}>
                            Your concierge has received your brief and will begin crafting your personalised itinerary. You will be notified when it's ready to view.
                        </Text>
                        <TouchableOpacity
                            style={s.successBtn}
                            onPress={() => {
                                setSuccess(false);
                                if (newId) {
                                    router.replace({ pathname: "/(main)/package/[id]", params: { id: newId } });
                                } else {
                                    router.replace("/(main)/experiences");
                                }
                            }}
                        >
                            <Text style={s.successBtnText}>View My Package</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSuccess(false); router.replace("/(main)/experiences"); }} style={{ marginTop: 12 }}>
                            <Text style={{ color: C.muted, fontSize: 14 }}>Back to Experiences</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: "700", color: C.text },
    subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },

    form: { paddingHorizontal: 20, paddingBottom: 60 },

    label: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 12 },
    labelOptional: { fontSize: 12, fontWeight: "400", color: C.muted },

    input: {
        backgroundColor: C.surface,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: C.text,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
        marginBottom: 28,
    },

    dateBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: C.surface,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
    },
    dateBtnText: { flex: 1, fontSize: 14, color: C.muted },

    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
    chip: {
        height: 38,
        paddingHorizontal: 16,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
        backgroundColor: C.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    chipTextActive: { color: "#0a0a0a" },

    textarea: {
        backgroundColor: C.surface,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: C.text,
        minHeight: 120,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
        marginBottom: 28,
    },

    submitBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginBottom: 16 },
    submitText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },

    disclaimer: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },

    // Picker
    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    pickerSheet: { backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingBottom: 40 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 8 },
    pickerTitle: { fontSize: 16, fontWeight: "700", color: C.text },
    pickerDoneBtn: { marginHorizontal: 24, marginTop: 12, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
    pickerDoneText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },

    // Success
    successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    successBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center", borderWidth: 1, borderColor: C.primary },
    successTitle: { fontSize: 22, fontWeight: "700", color: C.text, marginBottom: 10 },
    successBody: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 28 },
    successBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: C.primary, alignItems: "center" },
    successBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0a0a" },

    // Dropdown styles
    dropdownTrigger: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: C.surface,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
    },
    dropdownTriggerActive: {
        borderColor: C.primary,
    },
    dropdownValue: {
        fontSize: 15,
        color: C.text,
    },
    dropdownList: {
        backgroundColor: C.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
        marginTop: 4,
        overflow: "hidden",
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 50,
        elevation: 5,
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme === "dark" ? "#2a2a2a" : "#f0ece4",
    },
    dropdownItemActive: {
        backgroundColor: `${C.primary}18`,
    },
    dropdownItemText: {
        fontSize: 14,
        color: C.text,
    },
    dropdownItemTextActive: {
        color: C.primary,
        fontWeight: "700",
    },

    // Tailored Placeholder
    tailorPlaceholder: {
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
        alignItems: "center",
        justifyContent: "center",
    },
});
