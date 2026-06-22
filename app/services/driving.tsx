import { useState, useMemo, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Platform, Keyboard, KeyboardAvoidingView, Image, ActivityIndicator,
    Modal, Animated, Alert
} from "react-native";
import LocationSearch from "@/components/LocationSearch";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, Clock, Users, Car, Minus, Plus, Navigation, Check } from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";

const CAR_OPTIONS = [
    { id: "standard-sedan", name: "Standard Sedan", desc: "Toyota Camry or similar", icon: require("@/assets/images/standard-sedan.png"), maxPax: 4 },
    { id: "luxury-sedan", name: "Luxury Sedan", desc: "Mercedes E-Class or similar", icon: require("@/assets/images/mercedes-sedan.png"), maxPax: 4 },
    { id: "premium-suv", name: "Premium SUV", desc: "Range Rover or similar", icon: require("@/assets/images/range-rover-suv.png"), maxPax: 7 },
    { id: "escalade-suv", name: "Luxury SUV", desc: "Cadillac Escalade or similar", icon: require("@/assets/images/escalade-suv.png"), maxPax: 7 },
    { id: "executive-van", name: "Executive Van", desc: "Sprinter Van", icon: require("@/assets/images/sprinter-van.png"), maxPax: 14 },
];

const CAR_COLORS = [
    { id: "no-preference", label: "Any", hex: null },
    { id: "black", label: "Black", hex: "#1c1c1c" },
    { id: "white", label: "White", hex: "#f0f0f0" },
    { id: "silver", label: "Silver", hex: "#a8a8a8" },
    { id: "navy", label: "Navy", hex: "#1a2a4a" },
    { id: "champagne", label: "Gold", hex: "#c9a84c" },
];

export default function DrivingServiceScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);
    const { eventTag, eventDate } = useLocalSearchParams<{ eventTag?: string; eventDate?: string }>();

    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [carType, setCarType] = useState(CAR_OPTIONS[0].id);
    const [passengers, setPassengers] = useState(1);
    const [carCount, setCarCount] = useState(1);
    const [carColor, setCarColor] = useState("no-preference");
    const [instructions, setInstructions] = useState("");
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const dropoffY = useRef(0);

    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const [dateObj, setDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [timeObj, setTimeObj] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const formattedTime = timeObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const onDateChange = (_: any, selected?: Date) => {
        if (selected) setDateObj(selected);
        if (Platform.OS === "android") setShowDatePicker(false);
    };

    const onTimeChange = (_: any, selected?: Date) => {
        if (selected) setTimeObj(selected);
        if (Platform.OS === "android") setShowTimePicker(false);
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
        if (!pickup || !dropoff) return Alert.alert("Missing Fields", "Please enter both pickup and drop-off locations.");
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert("Not signed in", "Please sign in to submit a request.");
                setLoading(false);
                return;
            }

            const combined = new Date(dateObj);
            combined.setHours(timeObj.getHours(), timeObj.getMinutes());

            const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
            const { error } = await supabase.from("requests").insert({
                user_id: user.id,
                service_type: "driving-service",
                status: "pending",
                reference: ref,
                title: CAR_OPTIONS.find(c => c.id === carType)?.name || "Chauffeur Service",
                pickup_location: pickup,
                dropoff_location: dropoff,
                scheduled_time: combined.toISOString(),
                details: { instructions, carType, passengers, carCount, color: carColor === "no-preference" ? null : carColor, ...(eventTag ? { eventTag, eventDate } : {}) },
            });

            setLoading(false);
            if (error) {
                Alert.alert("Submission Failed", error.message);
                console.error("[Request insert error]", JSON.stringify(error));
            } else {
                setShowSuccess(true);
                Animated.parallel([
                    Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                    Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
                ]).start();
            }
        } catch (e: any) {
            setLoading(false);
            Alert.alert("Error", e?.message || "Something went wrong. Please try again.");
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
                <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Text style={[s.backText, { color: C.primary }]}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={[s.title, { color: C.text }]}>Chauffeur Service</Text>
                    {!!eventTag && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: "#c9a84c20", borderWidth: 1, borderColor: "#c9a84c50" }}>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#c9a84c", letterSpacing: 0.5 }}>EVENT · {eventTag}</Text>
                            </View>
                        </View>
                    )}
                    <Text style={[s.subtitle, { color: C.muted }]}>Book a private chauffeur or scheduled ride</Text>

                    <Text style={[s.label, { color: C.text }]}>Vehicle Class</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.carScroller}>
                        {CAR_OPTIONS.map((car) => {
                            const isSelected = carType === car.id;
                            return (
                                <TouchableOpacity
                                    key={car.id}
                                    style={[s.carOption, { backgroundColor: C.surface, borderColor: isSelected ? C.primary : C.border }]}
                                    onPress={() => {
                                        setCarType(car.id);
                                        setPassengers(p => Math.min(p, car.maxPax));
                                    }}
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
                    <View style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                            <View style={{ flex: 1 }}>
                                <LocationSearch
                                    value={pickup}
                                    onChangeText={setPickup}
                                    placeholder="Search pickup location..."
                                    onSelect={setPickup}
                                />
                            </View>
                            <TouchableOpacity onPress={detectLocation} style={[s.locateBtn, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, height: 50, width: 50, alignItems: "center", justifyContent: "center" }]} disabled={locating}>
                                {locating
                                    ? <ActivityIndicator size="small" color={C.primary} />
                                    : <Navigation size={18} color={C.primary} />
                                }
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text
                        style={[s.label, { color: C.text }]}
                        onLayout={e => { dropoffY.current = e.nativeEvent.layout.y; }}
                    >Drop-off Location *</Text>
                    <LocationSearch
                        value={dropoff}
                        onChangeText={setDropoff}
                        placeholder="Search drop-off location..."
                        onSelect={setDropoff}
                        style={{ marginBottom: 20 }}
                    />

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


                    <Text style={[s.label, { color: C.text }]}>Passengers</Text>
                    {(() => {
                        const maxPax = CAR_OPTIONS.find(c => c.id === carType)?.maxPax ?? 4;
                        return (
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
                                    onPress={() => setPassengers(p => Math.min(maxPax, p + 1))}
                                >
                                    <Plus size={16} color={C.text} />
                                </TouchableOpacity>
                                <Text style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>
                                    {`pax  ·  max ${maxPax}`}
                                </Text>
                            </View>
                        );
                    })()}

                    <Text style={[s.label, { color: C.text }]}>Number of Cars</Text>
                    <View style={[s.stepperRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                        <Car size={18} color={C.primary} />
                        <TouchableOpacity
                            style={[s.stepperBtn, { borderColor: C.border }]}
                            onPress={() => setCarCount(n => Math.max(1, n - 1))}
                        >
                            <Minus size={16} color={C.text} />
                        </TouchableOpacity>
                        <Text style={[s.stepperVal, { color: C.text }]}>{carCount}</Text>
                        <TouchableOpacity
                            style={[s.stepperBtn, { borderColor: C.border }]}
                            onPress={() => setCarCount(n => Math.min(10, n + 1))}
                        >
                            <Plus size={16} color={C.text} />
                        </TouchableOpacity>
                        <Text style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>
                            {carCount === 1 ? "car" : "cars"}
                        </Text>
                    </View>

                    <Text style={[s.label, { color: C.text }]}>Preferred Color</Text>
                    <View style={[s.colorRow, { marginBottom: 20 }]}>
                        {CAR_COLORS.map(col => (
                            <TouchableOpacity key={col.id} style={s.colorItem} onPress={() => setCarColor(col.id)}>
                                <View style={[
                                    s.colorDot,
                                    { backgroundColor: col.hex ?? C.surface },
                                    { borderColor: carColor === col.id ? C.primary : C.border, borderWidth: carColor === col.id ? 2.5 : 1.5 }
                                ]}>
                                    {!col.hex && <Text style={{ fontSize: 11, color: C.muted }}>?</Text>}
                                </View>
                                <Text style={[s.colorLabel, { color: carColor === col.id ? C.primary : C.muted }]}>{col.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[s.label, { color: C.text }]}>Special Instructions</Text>
                    <VoiceInput
                        placeholder="Any preferences or requirements..."
                        value={instructions}
                        onChange={instructions => setInstructions(instructions)}
                        accent={C.primary}
                        textColor={C.text}
                        border={C.border}
                        inputBg={C.surface}
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

            {/* Date Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>Select Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={{ color: C.primary, fontWeight: "700", fontSize: 15 }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={dateObj}
                            mode="date"
                            display="spinner"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                            themeVariant={theme === "dark" ? "dark" : "light"}
                            style={{ width: "100%" }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Time Picker Modal */}
            <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} activeOpacity={1} onPress={() => setShowTimePicker(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                <Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>Select Time</Text>
                            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                <Text style={{ color: C.primary, fontWeight: "700", fontSize: 15 }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={timeObj}
                            mode="time"
                            display="spinner"
                            onChange={onTimeChange}
                            themeVariant={theme === "dark" ? "dark" : "light"}
                            style={{ width: "100%" }}
                        />
                    </View>
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

    colorRow: { flexDirection: "row", gap: 16 },
    colorItem: { alignItems: "center", gap: 6 },
    colorDot: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    colorLabel: { fontSize: 10, fontWeight: "600" },

    suggestionBox: { borderWidth: 1, borderRadius: 14, marginTop: -16, marginBottom: 20, overflow: "hidden" },
    suggestionItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 },
    suggestionText: { flex: 1, fontSize: 13, lineHeight: 18 },

    input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, marginBottom: 18 },
    textarea: { height: 100, textAlignVertical: "top" },

    btn: { borderRadius: 14, padding: 18, alignItems: "center", marginTop: 8 },
    btnDisabled: { opacity: 0.6 },
    btnText: { fontSize: 15, fontWeight: "700" },

    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.background, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: C.primary, alignItems: "center" },
    modalIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1e1e1e", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPrimary: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary, alignItems: "center" },
    modalBtnTxPri: { color: C.background, fontSize: 14, fontWeight: "700" },
    modalBtnSecondary: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },
});
