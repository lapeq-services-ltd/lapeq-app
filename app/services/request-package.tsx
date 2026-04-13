import { useState, useMemo } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    TextInput, Alert, Platform, Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Calendar, CheckCircle2, ChevronDown } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

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

export default function RequestPackageScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [city, setCity] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [type, setType] = useState<string | null>(null);
    const [budget, setBudget] = useState<string | null>(null);
    const [notes, setNotes] = useState("");

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

    const handleSubmit = async () => {
        if (!city.trim()) { Alert.alert("Please enter a city."); return; }
        if (!type) { Alert.alert("Please choose an experience type."); return; }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setLoading(true);
        const { data, error } = await supabase.from("packages").insert({
            user_id: user.id,
            city: city.trim(),
            type,
            status: "pending",
            start_date: toISO(startDate),
            end_date: toISO(endDate),
            budget_range: budget,
            notes: notes.trim() || null,
        }).select("id").single();
        setLoading(false);

        if (error) { Alert.alert("Error", error.message); return; }
        setNewId(data?.id ?? null);
        setSuccess(true);
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>Request a Package</Text>
                    <Text style={s.subtitle}>Tell us the basics — we handle everything else</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

                {/* City */}
                <Text style={s.label}>Where are you going?</Text>
                <TextInput
                    style={s.input}
                    placeholder="e.g. Lagos, Abuja, Dubai, London"
                    placeholderTextColor={C.muted}
                    value={city}
                    onChangeText={setCity}
                    autoCapitalize="words"
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

                {/* Type */}
                <Text style={s.label}>Type of experience</Text>
                <View style={s.chipRow}>
                    {TYPES.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[s.chip, type === t.key && s.chipActive]}
                            onPress={() => setType(t.key)}
                            activeOpacity={0.8}
                        >
                            <Text style={[s.chipText, type === t.key && s.chipTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Budget */}
                <Text style={s.label}>Budget range <Text style={s.labelOptional}>(optional)</Text></Text>
                <View style={[s.chipRow, { marginBottom: 28 }]}>
                    {BUDGETS.map(b => (
                        <TouchableOpacity
                            key={b.key}
                            style={[s.chip, budget === b.key && s.chipActive]}
                            onPress={() => setBudget(prev => prev === b.key ? null : b.key)}
                            activeOpacity={0.8}
                        >
                            <Text style={[s.chipText, budget === b.key && s.chipTextActive]}>{b.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Notes */}
                <Text style={s.label}>Anything else we should know? <Text style={s.labelOptional}>(optional)</Text></Text>
                <TextInput
                    style={s.textarea}
                    placeholder="Special requests, preferences, dietary requirements, celebration notes..."
                    placeholderTextColor={C.muted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
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

            {/* Date picker modal */}
            <Modal
                visible={!!pickerTarget}
                transparent
                animationType="fade"
                onRequestClose={() => setPickerTarget(null)}
            >
                <View style={s.pickerOverlay}>
                    <View style={s.pickerSheet}>
                        <View style={s.pickerHeader}>
                            <Text style={s.pickerTitle}>
                                {pickerTarget === "start" ? "Select Start Date" : "Select End Date"}
                            </Text>
                            <TouchableOpacity onPress={() => setPickerTarget(null)}>
                                <Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={tempDate}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            minimumDate={pickerTarget === "end" && startDate ? startDate : new Date()}
                            onChange={(_, date) => {
                                if (date) {
                                    setTempDate(date);
                                    if (Platform.OS === "android") {
                                        if (pickerTarget === "start") {
                                            setStartDate(date);
                                            if (endDate && date > endDate) setEndDate(null);
                                        } else {
                                            setEndDate(date);
                                        }
                                        setPickerTarget(null);
                                    }
                                } else {
                                    setPickerTarget(null);
                                }
                            }}
                            style={{ backgroundColor: C.background }}
                        />
                        {Platform.OS === "ios" && (
                            <TouchableOpacity style={s.pickerDoneBtn} onPress={confirmDate}>
                                <Text style={s.pickerDoneText}>Confirm</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

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
                                    router.replace("/experiences");
                                }
                            }}
                        >
                            <Text style={s.successBtnText}>View My Package</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSuccess(false); router.replace("/experiences"); }} style={{ marginTop: 12 }}>
                            <Text style={{ color: C.muted, fontSize: 14 }}>Back to Experiences</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
});
