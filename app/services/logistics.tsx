import { useState, useMemo } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function LogisticsScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);
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
        <SafeAreaView style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backText}>← Back</Text></TouchableOpacity>
                <Text style={s.title}>Logistics</Text>
                <Text style={s.subtitle}>Pickup, delivery & item movement</Text>

                <Text style={s.label}>Item Description *</Text>
                <TextInput style={s.input} placeholder="What needs to be moved?" placeholderTextColor={C.muted} value={itemDesc} onChangeText={setItemDesc} />

                <Text style={s.label}>Pickup Address *</Text>
                <TextInput style={s.input} placeholder="Where to collect from" placeholderTextColor={C.muted} value={pickup} onChangeText={setPickup} />

                <Text style={s.label}>Delivery Address *</Text>
                <TextInput style={s.input} placeholder="Where to deliver to" placeholderTextColor={C.muted} value={delivery} onChangeText={setDelivery} />

                <Text style={s.label}>Preferred Date *</Text>
                <TextInput style={s.input} placeholder="e.g. 20 March 2025" placeholderTextColor={C.muted} value={date} onChangeText={setDate} />

                <TouchableOpacity style={s.toggleRow} onPress={() => setFragile(v => !v)}>
                    <Text style={s.label}>Fragile items?</Text>
                    <Text style={[s.toggle, fragile && s.toggleActive]}>{fragile ? "Yes" : "No"}</Text>
                </TouchableOpacity>

                <Text style={s.label}>Notes</Text>
                <TextInput style={[s.input, s.textarea]} placeholder="Any special handling instructions..." placeholderTextColor={C.muted} multiline numberOfLines={3} value={notes} onChangeText={setNotes} />

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
    label: { fontSize: 12, fontWeight: "600", color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, marginBottom: 18 },
    textarea: { height: 90, textAlignVertical: "top" },
    toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
    toggle: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, fontSize: 13, color: C.muted },
    toggleActive: { backgroundColor: C.primary, borderColor: C.primary, color: C.black },
    btn: { backgroundColor: C.black, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: C.cream, fontSize: 15, fontWeight: "700" },
});
