import { useState, useMemo } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

const PAIRING_TYPES = ["Investor Matching", "Legal Advisory", "Business Partner", "Executive Recruitment", "Industry Introductions", "Other"];

export default function CorporatePairingScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);
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
        <SafeAreaView style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backText}>← Back</Text></TouchableOpacity>
                <Text style={s.title}>Corporate Pairing</Text>
                <Text style={s.subtitle}>Business introductions and professional connections</Text>

                <Text style={s.label}>Pairing Type *</Text>
                <View style={s.chipGrid}>
                    {PAIRING_TYPES.map((t) => (
                        <TouchableOpacity key={t} style={[s.chip, pairingType === t && s.chipActive]} onPress={() => setPairingType(t)}>
                            <Text style={[s.chipText, pairingType === t && s.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={s.label}>Industry / Sector</Text>
                <TextInput style={s.input} placeholder="e.g. Real Estate, Fintech, FMCG" placeholderTextColor={C.muted} value={industry} onChangeText={setIndustry} />

                <Text style={s.label}>Your Company / Role</Text>
                <TextInput style={s.input} placeholder="e.g. CEO, Lekki Properties Ltd" placeholderTextColor={C.muted} value={company} onChangeText={setCompany} />

                <Text style={s.label}>Objective *</Text>
                <TextInput style={[s.input, s.textarea]} placeholder="What are you looking to achieve? Be specific." placeholderTextColor={C.muted} multiline numberOfLines={5} value={objective} onChangeText={setObjective} />

                <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                    <Text style={s.btnText}>{loading ? "Submitting..." : "Submit Request"}</Text>
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
    textarea: { height: 110, textAlignVertical: "top" },
    chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    chipActive: { backgroundColor: C.black, borderColor: C.black },
    chipText: { fontSize: 12, color: C.text },
    chipTextActive: { color: C.primary },
    btn: { backgroundColor: C.black, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: C.cream, fontSize: 15, fontWeight: "700" },
});
