import { useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const REQUEST_TYPES = ["Property Search", "School Enrollment", "Document Processing", "Emergency Assistance", "Business Setup", "Other"];
const BUDGET_RANGES = ["Under ₦500k", "₦500k – ₦2M", "₦2M – ₦5M", "Above ₦5M"];

export default function DiasporaScreen() {
    const router = useRouter();
    const [requestType, setRequestType] = useState("");
    const [budget, setBudget] = useState("");
    const [timeline, setTimeline] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!requestType || !details) return Alert.alert("Fill in all required fields");
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "diaspora-support",
            status: "pending",
            details: { requestType, budget, timeline, details },
        });
        setLoading(false);
        if (error) Alert.alert("Submission failed", error.message);
        else { Alert.alert("Request submitted", "Your concierge will be in touch."); router.back(); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.title}>Diaspora Support</Text>
                <Text style={styles.subtitle}>Remote assistance for Nigerians abroad</Text>

                <Text style={styles.label}>Request Type *</Text>
                <View style={styles.chipGrid}>
                    {REQUEST_TYPES.map((t) => (
                        <TouchableOpacity key={t} style={[styles.chip, requestType === t && styles.chipActive]} onPress={() => setRequestType(t)}>
                            <Text style={[styles.chipText, requestType === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Budget Range</Text>
                <View style={styles.chipGrid}>
                    {BUDGET_RANGES.map((b) => (
                        <TouchableOpacity key={b} style={[styles.chip, budget === b && styles.chipActive]} onPress={() => setBudget(b)}>
                            <Text style={[styles.chipText, budget === b && styles.chipTextActive]}>{b}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Timeline</Text>
                <TextInput style={styles.input} placeholder="e.g. Within 2 weeks" placeholderTextColor={Colors.muted} value={timeline} onChangeText={setTimeline} />

                <Text style={styles.label}>Details *</Text>
                <TextInput style={[styles.input, styles.textarea]} placeholder="Describe what you need help with..." placeholderTextColor={Colors.muted} multiline numberOfLines={5} value={details} onChangeText={setDetails} />

                <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                    <Text style={styles.btnText}>{loading ? "Submitting..." : "Submit Request"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream, paddingHorizontal: 20 },
    backBtn: { paddingVertical: 16 },
    backText: { color: Colors.gold, fontSize: 14 },
    title: { fontSize: 24, fontWeight: "700", color: Colors.black, marginBottom: 4 },
    subtitle: { fontSize: 13, color: Colors.muted, marginBottom: 28 },
    label: { fontSize: 12, fontWeight: "600", color: Colors.black, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, fontSize: 14, color: Colors.black, marginBottom: 18 },
    textarea: { height: 110, textAlignVertical: "top" },
    chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
    chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
    chipText: { fontSize: 12, color: Colors.black },
    chipTextActive: { color: Colors.gold },
    btn: { backgroundColor: Colors.black, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.cream, fontSize: 15, fontWeight: "700" },
});
