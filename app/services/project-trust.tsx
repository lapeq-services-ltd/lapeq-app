import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function ProjectTrustScreen() {
    const router = useRouter();
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
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Project Trust</Text>
                <Text style={styles.subtitle}>Independent construction oversight & weekly reporting</Text>

                <Text style={styles.label}>Project Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. Lekki Duplex Build" placeholderTextColor={Colors.muted} value={projectName} onChangeText={setProjectName} />

                <Text style={styles.label}>Project Address *</Text>
                <TextInput style={styles.input} placeholder="Full address of the construction site" placeholderTextColor={Colors.muted} value={address} onChangeText={setAddress} />

                <Text style={styles.label}>Contractor Name</Text>
                <TextInput style={styles.input} placeholder="Name of contractor (if known)" placeholderTextColor={Colors.muted} value={contractorName} onChangeText={setContractorName} />

                <Text style={styles.label}>Inspection Frequency *</Text>
                <View style={styles.chipRow}>
                    {frequencies.map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.chip, inspectionFrequency === f && styles.chipActive]}
                            onPress={() => setInspectionFrequency(f)}
                        >
                            <Text style={[styles.chipText, inspectionFrequency === f && styles.chipTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Additional Notes</Text>
                <TextInput style={[styles.input, styles.textarea]} placeholder="Any specific concerns or requirements..." placeholderTextColor={Colors.muted} multiline numberOfLines={4} value={notes} onChangeText={setNotes} />

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>What's included</Text>
                    <Text style={styles.infoText}>• Weekly site visit reports{"\n"}• Date-stamped photography{"\n"}• Materials & worker verification{"\n"}• Drone footage (where applicable){"\n"}• Uploaded directly to your app</Text>
                </View>

                <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                    <Text style={styles.btnText}>{loading ? "Submitting..." : "Submit Project"}</Text>
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
    label: { fontSize: 12, fontWeight: "600", color: Colors.black, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, fontSize: 14, color: Colors.black, marginBottom: 18 },
    textarea: { height: 100, textAlignVertical: "top" },
    chipRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
    chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
    chipText: { fontSize: 13, color: Colors.black },
    chipTextActive: { color: Colors.gold },
    infoBox: { backgroundColor: Colors.black, borderRadius: 16, padding: 16, marginBottom: 24 },
    infoTitle: { fontSize: 13, fontWeight: "700", color: Colors.gold, marginBottom: 8 },
    infoText: { fontSize: 12, color: "rgba(240,236,228,0.7)", lineHeight: 20 },
    btn: { backgroundColor: Colors.gold, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.black, fontSize: 15, fontWeight: "700" },
});
