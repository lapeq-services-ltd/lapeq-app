import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function ProjectTrustScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);
    const [projectName, setProjectName] = useState("");
    const [address, setAddress] = useState("");
    const [contractorName, setContractorName] = useState("");
    const [inspectionFrequency, setInspectionFrequency] = useState("Weekly");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const frequencies = ["Weekly", "Bi-weekly", "Monthly"];

    const handleSubmit = async () => {
        if (!projectName || !address) return Alert.alert("Fill in all required fields");
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "project-trust",
            status: "pending",
            details: { projectName, address, contractorName, inspectionFrequency, notes },
        });
        setLoading(false);
        if (error) {
            Alert.alert("Submission failed", error.message);
        } else {
            Alert.alert("Project submitted", "Your oversight team will be in touch to confirm details.");
            router.back();
        }
    };

    return (
        <SafeAreaView style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Text style={s.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.title}>Project Trust</Text>
                <Text style={s.subtitle}>Independent construction oversight & weekly reporting</Text>

                <Text style={s.label}>Project Name *</Text>
                <TextInput style={s.input} placeholder="e.g. Lekki Duplex Build" placeholderTextColor={C.muted} value={projectName} onChangeText={setProjectName} />

                <Text style={s.label}>Project Address *</Text>
                <TextInput style={s.input} placeholder="Full address of the construction site" placeholderTextColor={C.muted} value={address} onChangeText={setAddress} />

                <Text style={s.label}>Contractor Name</Text>
                <TextInput style={s.input} placeholder="Name of contractor (if known)" placeholderTextColor={C.muted} value={contractorName} onChangeText={setContractorName} />

                <Text style={s.label}>Inspection Frequency *</Text>
                <View style={s.chipRow}>
                    {frequencies.map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[s.chip, inspectionFrequency === f && s.chipActive]}
                            onPress={() => setInspectionFrequency(f)}
                        >
                            <Text style={[s.chipText, inspectionFrequency === f && s.chipTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={s.label}>Additional Notes</Text>
                <TextInput style={[s.input, s.textarea]} placeholder="Any specific concerns or requirements..." placeholderTextColor={C.muted} multiline numberOfLines={4} value={notes} onChangeText={setNotes} />

                <View style={s.infoBox}>
                    <Text style={s.infoTitle}>What's included</Text>
                    <Text style={s.infoText}>• Weekly site visit reports{"\n"}• Date-stamped photography{"\n"}• Materials & worker verification{"\n"}• Drone footage (where applicable){"\n"}• Uploaded directly to your app</Text>
                </View>

                <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                    <Text style={s.btnText}>{loading ? "Submitting..." : "Submit Project"}</Text>
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
    label: { fontSize: 12, fontWeight: "600", color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, marginBottom: 18 },
    textarea: { height: 100, textAlignVertical: "top" },
    chipRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    chipActive: { backgroundColor: C.black, borderColor: C.black },
    chipText: { fontSize: 13, color: C.text },
    chipTextActive: { color: C.primary },
    infoBox: { backgroundColor: C.black, borderRadius: 16, padding: 16, marginBottom: 24 },
    infoTitle: { fontSize: 13, fontWeight: "700", color: C.primary, marginBottom: 8 },
    infoText: { fontSize: 12, color: "rgba(240,236,228,0.7)", lineHeight: 20 },
    btn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: C.black, fontSize: 15, fontWeight: "700" },
});
