import { useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function LogisticsScreen() {
    const router = useRouter();
    const [itemDesc, setItemDesc] = useState("");
    const [pickup, setPickup] = useState("");
    const [delivery, setDelivery] = useState("");
    const [date, setDate] = useState("");
    const [fragile, setFragile] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!itemDesc || !pickup || !delivery || !date) return Alert.alert("Fill in all required fields");
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "logistics",
            status: "pending",
            details: { itemDesc, pickup, delivery, date, fragile, notes },
        });
        setLoading(false);
        if (error) Alert.alert("Submission failed", error.message);
        else { Alert.alert("Request submitted", "Your concierge will confirm shortly."); router.back(); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.title}>Logistics</Text>
                <Text style={styles.subtitle}>Pickup, delivery & item movement</Text>

                <Text style={styles.label}>Item Description *</Text>
                <TextInput style={styles.input} placeholder="What needs to be moved?" placeholderTextColor={Colors.muted} value={itemDesc} onChangeText={setItemDesc} />

                <Text style={styles.label}>Pickup Address *</Text>
                <TextInput style={styles.input} placeholder="Where to collect from" placeholderTextColor={Colors.muted} value={pickup} onChangeText={setPickup} />

                <Text style={styles.label}>Delivery Address *</Text>
                <TextInput style={styles.input} placeholder="Where to deliver to" placeholderTextColor={Colors.muted} value={delivery} onChangeText={setDelivery} />

                <Text style={styles.label}>Preferred Date *</Text>
                <TextInput style={styles.input} placeholder="e.g. 20 March 2025" placeholderTextColor={Colors.muted} value={date} onChangeText={setDate} />

                <TouchableOpacity style={styles.toggleRow} onPress={() => setFragile(v => !v)}>
                    <Text style={styles.label}>Fragile items?</Text>
                    <Text style={[styles.toggle, fragile && styles.toggleActive]}>{fragile ? "Yes" : "No"}</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Notes</Text>
                <TextInput style={[styles.input, styles.textarea]} placeholder="Any special handling instructions..." placeholderTextColor={Colors.muted} multiline numberOfLines={3} value={notes} onChangeText={setNotes} />

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
    label: { fontSize: 12, fontWeight: "600", color: Colors.black, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, fontSize: 14, color: Colors.black, marginBottom: 18 },
    textarea: { height: 90, textAlignVertical: "top" },
    toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
    toggle: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, fontSize: 13, color: Colors.muted },
    toggleActive: { backgroundColor: Colors.gold, borderColor: Colors.gold, color: Colors.black },
    btn: { backgroundColor: Colors.black, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.cream, fontSize: 15, fontWeight: "700" },
});
