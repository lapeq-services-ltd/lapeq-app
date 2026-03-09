import { useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";

const LIFESTYLE_TYPES = ["Hotel & Accommodation", "Restaurant Reservation", "Event Access", "Spa & Wellness", "Private Jet", "Yacht Charter", "Other"];

export default function LifestyleTravelScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const styles = useMemo(() => getStyles(C), [C]);

    const [serviceType, setServiceType] = useState("");
    const [destination, setDestination] = useState("");
    const [dates, setDates] = useState("");
    const [guestCount, setGuestCount] = useState("");
    const [preferences, setPreferences] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!serviceType || !destination) return Alert.alert("Fill in all required fields");
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "lifestyle-travel",
            status: "pending",
            details: { serviceType, destination, dates, guestCount, preferences },
        });
        setLoading(false);
        if (error) Alert.alert("Submission failed", error.message);
        else { Alert.alert("Request submitted", "Your concierge will curate options for you."); router.back(); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.title}>Lifestyle & Travel</Text>
                <Text style={styles.subtitle}>Hotels, experiences, and travel coordination</Text>

                <Text style={styles.label}>Service Type *</Text>
                <View style={styles.chipGrid}>
                    {LIFESTYLE_TYPES.map((t) => (
                        <TouchableOpacity key={t} style={[styles.chip, serviceType === t && styles.chipActive]} onPress={() => setServiceType(t)}>
                            <Text style={[styles.chipText, serviceType === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Destination / Venue *</Text>
                <TextInput style={styles.input} placeholder="e.g. Dubai, or Nobu Lagos" placeholderTextColor={C.muted} value={destination} onChangeText={setDestination} />

                <Text style={styles.label}>Dates</Text>
                <TextInput style={styles.input} placeholder="e.g. 1–5 April 2025" placeholderTextColor={C.muted} value={dates} onChangeText={setDates} />

                <Text style={styles.label}>Number of Guests</Text>
                <TextInput style={styles.input} placeholder="e.g. 2" placeholderTextColor={C.muted} keyboardType="numeric" value={guestCount} onChangeText={setGuestCount} />

                <Text style={styles.label}>Preferences & Requirements</Text>
                <TextInput style={[styles.input, styles.textarea]} placeholder="Dietary needs, room preferences, budget range, etc." placeholderTextColor={C.muted} multiline numberOfLines={4} value={preferences} onChangeText={setPreferences} />

                <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                    <Text style={styles.btnText}>{loading ? "Submitting..." : "Submit Request"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20 },
    backBtn: { paddingVertical: 16 },
    backText: { color: C.primary, fontSize: 14 },
    title: { fontSize: 24, fontWeight: "700", color: C.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: C.muted, marginBottom: 28 },
    label: { fontSize: 12, fontWeight: "600", color: C.text, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, marginBottom: 18 },
    textarea: { height: 100, textAlignVertical: "top" },
    chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    chipActive: { backgroundColor: C.text, borderColor: C.text },
    chipText: { fontSize: 12, color: C.text },
    chipTextActive: { color: C.background },
    btn: { backgroundColor: C.text, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: C.background, fontSize: 15, fontWeight: "700" },
});
