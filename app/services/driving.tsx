import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Keyboard, KeyboardAvoidingView, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const CAR_OPTIONS = [
    { id: "luxury-sedan", name: "Luxury Sedan", desc: "Mercedes E-Class or similar", icon: require("@/assets/images/mercedes-sedan.png") },
    { id: "premium-suv", name: "Premium SUV", desc: "Range Rover or similar", icon: require("@/assets/images/range-rover-suv.png") },
    { id: "executive-van", name: "Executive Van", desc: "Sprinter Van", icon: require("@/assets/images/sprinter-van.png") }
];

export default function DrivingServiceScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();

    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [carType, setCarType] = useState(CAR_OPTIONS[0].id);
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
            title: `${CAR_OPTIONS.find(c => c.id === carType)?.name || 'Car Hire'} Booking`,
            pickup_location: pickup,
            dropoff_location: dropoff,
            scheduled_time: new Date(`${date} ${time}`).toISOString() || null,
            details: { instructions, carType },
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
                        <Text style={[styles.backText, { color: C.primary }]}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: C.text }]}>Driving Service</Text>
                    <Text style={[styles.subtitle, { color: C.muted }]}>Book a chauffeur or scheduled ride</Text>

                    <Text style={[styles.label, { color: C.text }]}>Vehicle Class *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carScroller}>
                        {CAR_OPTIONS.map((car) => {
                            const isSelected = carType === car.id;
                            return (
                                <TouchableOpacity
                                    key={car.id}
                                    style={[styles.carOption, { backgroundColor: C.surface, borderColor: isSelected ? C.primary : C.border }]}
                                    onPress={() => setCarType(car.id)}
                                >
                                    <View style={styles.carImgWrap}>
                                        <Image source={car.icon} style={styles.carImg} resizeMode="contain" />
                                    </View>
                                    <Text style={[styles.carName, { color: C.text }]}>{car.name}</Text>
                                    <Text style={[styles.carDesc, { color: C.muted }]}>{car.desc}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>

                    <Text style={[styles.label, { color: C.text }]}>Pickup Location *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                        placeholder="e.g. 14 Ahmadu Bello Way, VI"
                        placeholderTextColor={C.muted}
                        value={pickup}
                        onChangeText={setPickup}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <Text style={[styles.label, { color: C.text }]}>Drop-off Location *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                        placeholder="e.g. Murtala Muhammed Airport"
                        placeholderTextColor={C.muted}
                        value={dropoff}
                        onChangeText={setDropoff}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <Text style={[styles.label, { color: C.text }]}>Date *</Text>
                    <TouchableOpacity
                        style={[styles.input, { backgroundColor: C.surface, borderColor: C.border }]}
                        onPress={() => {
                            Keyboard.dismiss();
                            setShowDatePicker(true);
                        }}
                    >
                        <Text style={{ color: date ? C.text : C.muted }}>
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
                            <Text style={[styles.iosDoneText, { color: C.primary }]}>Done</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={[styles.label, { color: C.text }]}>Time *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                        placeholder="e.g. 9:00 AM"
                        placeholderTextColor={C.muted}
                        value={time}
                        onChangeText={setTime}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <Text style={[styles.label, { color: C.text }]}>Special Instructions</Text>
                    <TextInput
                        style={[styles.input, styles.textarea, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                        placeholder="Any preferences or requirements..."
                        placeholderTextColor={C.muted}
                        multiline
                        numberOfLines={4}
                        value={instructions}
                        onChangeText={setInstructions}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <TouchableOpacity style={[styles.btn, { backgroundColor: C.primary }, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                        <Text style={[styles.btnText, { color: C.card }]}>{loading ? "Submitting..." : "Submit Request"}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    backBtn: { paddingVertical: 16 },
    backText: { fontSize: 14 },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
    subtitle: { fontSize: 13, marginBottom: 28 },
    label: { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },

    carScroller: { marginBottom: 24 },
    carOption: { width: 140, padding: 12, borderRadius: 16, borderWidth: 2, marginRight: 12 },
    carImgWrap: { height: 60, marginBottom: 10, justifyContent: "center", alignItems: "center" },
    carImg: { width: "100%", height: "100%" },
    carName: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
    carDesc: { fontSize: 10, lineHeight: 14 },

    input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, marginBottom: 18 },
    textarea: { height: 100, textAlignVertical: "top" },
    btn: { borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8, marginBottom: 40 },
    btnDisabled: { opacity: 0.6 },
    btnText: { fontSize: 15, fontWeight: "700" },
    iosDoneBtn: { alignItems: "flex-end", paddingHorizontal: 16, marginBottom: 12 },
    iosDoneText: { fontWeight: "600", fontSize: 16 },
});
