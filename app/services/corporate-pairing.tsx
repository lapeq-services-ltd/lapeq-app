import { useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const PAIRING_TYPES = ["Investor Matching", "Legal Advisory", "Business Partner", "Executive Recruitment", "Industry Introductions", "Other"];

export default function CorporatePairingScreen() {
    const router = useRouter();
    const [pairingType, setPairingType] = useState("");
    const [industry, setIndustry] = useState("");
    const [company, setCompany] = useState("");
    const [objective, setObjective] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!pairingType || !objective) return Alert.alert("Fill in all required fields");
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "corporate-pairing",
            status: "pending",
            details: { pairingType, industry, company, objective },
        });
        setLoading(false);
        if (error) Alert.alert("Submission failed", error.message);
        else { Alert.alert("Request submitted", "Our team will prepare a curated introduction shortly."); router.back(); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.title}>Corporate Pairing</Text>
                <Text style={styles.subtitle}>Business introductions and professional connections</Text>

                <Text style={styles.label}>Pairing Type *</Text>
                <View style={styles.chipGrid}>
                    {PAIRING_TYPES.map((t) => (
                        <TouchableOpacity key={t} style={[styles.chip, pairingType === t && styles.chipActive]} onPress={() => setPairingType(t)}>
                            <Text style={[styles.chipText, pairingType === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Industry / Sector</Text>
                <TextInput style={styles.input} placeholder="e.g. Real Estate, Fintech, FMCG" placeholderTextColor={Colors.muted} value={industry} onChangeText={setIndustry} />

                <Text style={styles.label}>Your Company / Role</Text>
                <TextInput style={styles.input} placeholder="e.g. CEO, Lekki Properties Ltd" placeholderTextColor={Colors.muted} value={company} onChangeText={setCompany} />

                <Text style={styles.label}>Objective *</Text>
                <TextInput style={[styles.input, styles.textarea]} placeholder="What are you looking to achieve? Be specific." placeholderTextColor={Colors.muted} multiline numberOfLines={5} value={objective} onChangeText={setObjective} />

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
