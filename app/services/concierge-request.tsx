import { useState, useMemo } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Paperclip } from "lucide-react-native";

const REQUEST_TYPES = ["Sourcing", "Event Planning", "Reservations", "Gifting", "Other"];

export default function ConciergeRequestScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const styles = useMemo(() => getStyles(C), [C]);

    const [requestType, setRequestType] = useState("");
    const [description, setDescription] = useState("");
    const [preferredTime, setPreferredTime] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!requestType || !description) return Alert.alert("Fill in all required fields");
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "general-concierge",
            status: "pending",
            details: { requestType, description, preferredTime },
        });

        setLoading(false);
        if (error) Alert.alert("Submission failed", error.message);
        else {
            Alert.alert("Request submitted", "Your concierge will review your request shortly.");
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>General Request</Text>
                <Text style={styles.subtitle}>Let us know how we can assist you today.</Text>

                <Text style={styles.label}>Request Type *</Text>
                <View style={styles.chipGrid}>
                    {REQUEST_TYPES.map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.chip, requestType === t && styles.chipActive]}
                            onPress={() => setRequestType(t)}
                        >
                            <Text style={[styles.chipText, requestType === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Description *</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Provide details about your request..."
                    placeholderTextColor={C.muted}
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                />

                <Text style={styles.label}>Preferred Time (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Asap, Tomorrow at 2 PM"
                    placeholderTextColor={C.muted}
                    value={preferredTime}
                    onChangeText={setPreferredTime}
                />

                <Text style={styles.label}>Attachments (Optional)</Text>
                <TouchableOpacity style={styles.attachmentBtn}>
                    <Paperclip size={20} color={C.text} style={{ marginRight: 8 }} />
                    <Text style={styles.attachmentText}>Upload Image or Document</Text>
                </TouchableOpacity>

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
    attachmentBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 32 },
    attachmentText: { fontSize: 14, color: C.text, fontWeight: "500" },
    btn: { backgroundColor: C.text, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: C.background, fontSize: 15, fontWeight: "700" },
});
