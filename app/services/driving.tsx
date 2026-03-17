import { useState, useMemo, useRef } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Platform, Keyboard, KeyboardAvoidingView, Image, ActivityIndicator,
    Modal, Animated, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, Clock, Users, Minus, Plus, Navigation, Check } from "lucide-react-native";

const CAR_OPTIONS = [
    { id: "standard-sedan", name: "Standard Sedan", desc: "Toyota Camry or similar", icon: require("@/assets/images/standard-sedan.png") },
    { id: "luxury-sedan", name: "Luxury Sedan", desc: "Mercedes E-Class or similar", icon: require("@/assets/images/mercedes-sedan.png") },
    { id: "premium-suv", name: "Premium SUV", desc: "Range Rover or similar", icon: require("@/assets/images/range-rover-suv.png") },
    { id: "executive-van", name: "Executive Van", desc: "Sprinter Van", icon: require("@/assets/images/sprinter-van.png") },
];

export default function DrivingServiceScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [carType, setCarType] = useState(CAR_OPTIONS[0].id);
    const [passengers, setPassengers] = useState(1);
    const [instructions, setInstructions] = useState("");
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const [dateObj, setDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [timeObj, setTimeObj] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const formattedTime = timeObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const onDateChange = (event: any, selected?: Date) => {
        if (Platform.OS === "android") setShowDatePicker(false);
        if (selected) setDateObj(selected);
    };

    const onTimeChange = (event: any, selected?: Date) => {
        if (Platform.OS === "android") setShowTimePicker(false);
        if (selected) setTimeObj(selected);
    };

    const detectLocation = async () => {
        setLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Denied", "Allow location access to auto-fill your pickup address.");
                setLocating(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const [address] = await Location.reverseGeocodeAsync(loc.coords);
            if (address) {
                const formatted = [
                    address.streetNumber,
                    address.street,
                    address.district ?? address.subregion,
                    address.city,
                ].filter(Boolean).join(", ");
                setPickup(formatted);
            }
        } catch {
            Alert.alert("Could not detect location", "Please enter it manually.");
        }
        setLocating(false);
    };

    const handleSubmit = async () => {
        if (!pickup || !dropoff) return Alert.alert("Fill in all required fields");
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const combined = new Date(dateObj);
        combined.setHours(timeObj.getHours(), timeObj.getMinutes());

        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "driving-service",
            status: "pending",
            title: CAR_OPTIONS.find(c => c.id === carType)?.name || "Car Hire",
            pickup_location: pickup,
            dropoff_location: dropoff,
            scheduled_time: combined.toISOString(),
            details: { instructions, carType, passengers },
        });

        setLoading(false);
        if (error) {
        } else {
            setShowSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
            ]).start();
        }
    };

    const hideSuccessAndGo = () => {
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(alertScale, { toValue: 0.9, duration: 200, useNativeDriver: true })
        ]).start(() => {
            setShowSuccess(false);
            router.back();
        });
    };

    return (
        <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Text style={[s.backText, { color: C.primary }]}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={[s.title, { color: C.text }]}>Driving Service</Text>
                    <Text style={[s.subtitle, { color: C.muted }]}>Book a chauffeur or scheduled ride</Text>

                    <Text style={[s.label, { color: C.text }]}>Vehicle Class</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.carScroller}>
                        {CAR_OPTIONS.map((car) => {
                            const isSelected = carType === car.id;
                            return (
                                <TouchableOpacity
                                    key={car.id}
                                    style={[s.carOption, { backgroundColor: C.surface, borderColor: isSelected ? C.primary : C.border }]}
                                    onPress={() => setCarType(car.id)}
                                >
                                    <View style={s.carImgWrap}>
                                        <Image source={car.icon} style={s.carImg} resizeMode="contain" />
                                    </View>
                                    <Text style={[s.carName, { color: isSelected ? C.primary : C.text }]}>{car.name}</Text>
                                    <Text style={[s.carDesc, { color: C.muted }]}>{car.desc}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <Text style={[s.label, { color: C.text }]}>Pickup Location *</Text>
                    <View style={[s.inputRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                        <MapPin size={18} color={C.primary} style={{ marginRight: 8 }} />
                        <TextInput
                            style={[s.inputFlex, { color: C.text }]}
                            placeholder="e.g. 14 Ahmadu Bello Way, VI"
                            placeholderTextColor={C.muted}
                            value={pickup}
                            onChangeText={setPickup}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                        <TouchableOpacity onPress={detectLocation} style={s.locateBtn} disabled={locating}>
                            {locating
                                ? <ActivityIndicator size="small" color={C.primary} />
                                : <Navigation size={18} color={C.primary} />
                            }
                        </TouchableOpacity>
                    </View>

                    <Text style={[s.label, { color: C.text }]}>Drop-off Location *</Text>
                    <View style={[s.inputRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                        <MapPin size={18} color={C.muted} style={{ marginRight: 8 }} />
                        <TextInput
                            style={[s.inputFlex, { color: C.text }]}
                            placeholder="e.g. Murtala Muhammed Airport"
                            placeholderTextColor={C.muted}
                            value={dropoff}
                            onChangeText={setDropoff}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                    </View>

                    <View style={s.dtRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.label, { color: C.text }]}>Date *</Text>
                            <TouchableOpacity
                                style={[s.inputRow, { backgroundColor: C.surface, borderColor: C.border }]}
                                onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                            >
                                <Clock size={18} color={C.primary} style={{ marginRight: 8 }} />
                                <Text style={{ color: C.text, fontSize: 14 }}>{formattedDate}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={[s.label, { color: C.text }]}>Time *</Text>
                            <TouchableOpacity
                                style={[s.inputRow, { backgroundColor: C.surface, borderColor: C.border }]}
                                onPress={() => { Keyboard.dismiss(); setShowTimePicker(true); }}
                            >
                                <Clock size={18} color={C.primary} style={{ marginRight: 8 }} />
                                <Text style={{ color: C.text, fontSize: 14 }}>{formattedTime}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dateObj}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={onDateChange}
                            minimumDate={new Date()}
                        />
                    )}
                    {Platform.OS === "ios" && showDatePicker && (
                        <TouchableOpacity style={s.iosDoneBtn} onPress={() => setShowDatePicker(false)}>
                            <Text style={[s.iosDoneText, { color: C.primary }]}>Done</Text>
                        </TouchableOpacity>
                    )}

                    {showTimePicker && (
                        <DateTimePicker
                            value={timeObj}
                            mode="time"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={onTimeChange}
                        />
                    )}
                    {Platform.OS === "ios" && showTimePicker && (
                        <TouchableOpacity style={s.iosDoneBtn} onPress={() => setShowTimePicker(false)}>
                            <Text style={[s.iosDoneText, { color: C.primary }]}>Done</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={[s.label, { color: C.text }]}>Passengers</Text>
                    <View style={[s.stepperRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                        <Users size={18} color={C.primary} />
                        <TouchableOpacity
                            style={[s.stepperBtn, { borderColor: C.border }]}
                            onPress={() => setPassengers(p => Math.max(1, p - 1))}
                        >
                            <Minus size={16} color={C.text} />
                        </TouchableOpacity>
                        <Text style={[s.stepperVal, { color: C.text }]}>{passengers}</Text>
                        <TouchableOpacity
                            style={[s.stepperBtn, { borderColor: C.border }]}
                            onPress={() => setPassengers(p => Math.min(14, p + 1))}
                        >
                            <Plus size={16} color={C.text} />
                        </TouchableOpacity>
                        <Text style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>
                            {passengers === 1 ? "passenger" : "passengers"}
                        </Text>
                    </View>

                    <Text style={[s.label, { color: C.text }]}>Special Instructions</Text>
                    <TextInput
                        style={[s.input, s.textarea, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                        placeholder="Any preferences or requirements..."
                        placeholderTextColor={C.muted}
                        multiline
                        numberOfLines={4}
                        value={instructions}
                        onChangeText={setInstructions}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <TouchableOpacity
                        style={[s.btn, { backgroundColor: C.primary }, loading && s.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={[s.btnText, { color: C.black }]}>{loading ? "Submitting..." : "Submit Request"}</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.modalOverlay}>
                    <Animated.View style={[
                        s.modalBox,
                        {
                            opacity: alertOpacity,
                            transform: [{ scale: alertScale }]
                        }
                    ]}>
                        <View style={s.modalIconWrap}>
                            <Check size={24} color={C.primary} strokeWidth={2.5} />
                        </View>
                        <Text style={s.modalTitle}>Request Submitted</Text>
                        <Text style={s.modalBody}>
                            Your request has been received. Track its status in My Requests.
                        </Text>

                        <TouchableOpacity style={s.modalBtnPrimary} onPress={() => {
                            setShowSuccess(false);
                            router.dismissAll();
                            router.push("/requests");
                        }}>
                            <Text style={s.modalBtnTxPri}>View My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSecondary} onPress={hideSuccessAndGo}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 20 },
    backBtn: { paddingVertical: 16 },
    backText: { fontSize: 14, fontWeight: "600" },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
    subtitle: { fontSize: 13, marginBottom: 28 },
    label: { fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },

    carScroller: { marginBottom: 28 },
    carOption: { width: 160, padding: 12, borderRadius: 16, borderWidth: 2, marginRight: 12 },
    carImgWrap: { height: 85, marginBottom: 8, justifyContent: "center", alignItems: "center" },
    carImg: { width: "100%", height: "100%" },
    carName: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
    carDesc: { fontSize: 10, lineHeight: 14 },

    inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 20 },
    inputFlex: { flex: 1, fontSize: 14 },
    locateBtn: { padding: 4, marginLeft: 8 },

    dtRow: { flexDirection: "row", gap: 12, marginBottom: 4 },

    stepperRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 20, gap: 12 },
    stepperBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    stepperVal: { fontSize: 18, fontWeight: "700", minWidth: 24, textAlign: "center" },

    input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, marginBottom: 18 },
    textarea: { height: 100, textAlignVertical: "top" },

    btn: { borderRadius: 14, padding: 18, alignItems: "center", marginTop: 8 },
    btnDisabled: { opacity: 0.6 },
    btnText: { fontSize: 15, fontWeight: "700" },

    iosDoneBtn: { alignItems: "flex-end", paddingHorizontal: 16, marginBottom: 12 },
    iosDoneText: { fontWeight: "600", fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.background, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: C.primary, alignItems: "center" },
    modalIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(201,168,76,0.1)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPrimary: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary, alignItems: "center" },
    modalBtnTxPri: { color: C.background, fontSize: 14, fontWeight: "700" },
    modalBtnSecondary: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },
});
