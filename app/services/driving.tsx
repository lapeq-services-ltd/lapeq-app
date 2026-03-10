import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Keyboard, KeyboardAvoidingView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function DrivingServiceScreen() {
    const router = useRouter();
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [instructions, setInstructions] = useState("");
    const [loading, setLoading] = useState(false);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateObj, setDateObj] = useState(new Date());

    const onDateChange = (event: any, selected?: Date) => {
        if (Platform.OS === "android") setShowDatePicker(false);
        if (selected) {
            setDateObj(selected);
            setDate(selected.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }));
        }
    };

    const handleSubmit = async () => {
        if (!pickup || !dropoff || !date || !time) return Alert.alert("Fill in all required fields");
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "driving-service",
            status: "pending",
            details: { pickup, dropoff, date, time, instructions },
        });
        setLoading(false);
        if (error) {
            Alert.alert("Submission failed", error.message);
        } else {
            Alert.alert("Request submitted", "Your concierge will confirm shortly.");
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Driving Service</Text>
                    <Text style={styles.subtitle}>Book a chauffeur or scheduled ride</Text>

                    <Text style={styles.label}>Pickup Location *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 14 Ahmadu Bello Way, VI"
                        placeholderTextColor={Colors.muted}
                        value={pickup}
                        onChangeText={setPickup}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <Text style={styles.label}>Drop-off Location *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Murtala Muhammed Airport"
                        placeholderTextColor={Colors.muted}
                        value={dropoff}
                        onChangeText={setDropoff}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <Text style={styles.label}>Date *</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => {
                            Keyboard.dismiss();
                            setShowDatePicker(true);
                        }}
                    >
                        <Text style={{ color: date ? Colors.black : Colors.muted }}>
                            {date || "Select Date"}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            key="datepicker"
                            value={dateObj}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                        />
                    )}
                    {Platform.OS === "ios" && showDatePicker && (
                        <TouchableOpacity style={styles.iosDoneBtn} onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.iosDoneText}>Done</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.label}>Time *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 9:00 AM"
                        placeholderTextColor={Colors.muted}
                        value={time}
                        onChangeText={setTime}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <Text style={styles.label}>Special Instructions</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        placeholder="Any preferences or requirements..."
                        placeholderTextColor={Colors.muted}
                        multiline
                        numberOfLines={4}
                        value={instructions}
                        onChangeText={setInstructions}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                        <Text style={styles.btnText}>{loading ? "Submitting..." : "Submit Request"}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
    btn: { backgroundColor: Colors.black, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8, marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.cream, fontSize: 15, fontWeight: "700" },
    iosDoneBtn: { alignItems: "flex-end", paddingHorizontal: 16, marginBottom: 12 },
    iosDoneText: { color: Colors.gold, fontWeight: "600", fontSize: 16 },
});
