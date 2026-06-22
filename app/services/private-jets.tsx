import { useState, useRef } from "react";
import {
    View, Text, TouchableOpacity, ScrollView, TextInput,
    StyleSheet, Modal, Animated, Alert, Platform, Switch
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import {
    ChevronLeft, Plane, Calendar, Clock, Users,
    Minus, Plus, Check
} from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import LocationSearch from "@/components/LocationSearch";

const GOLD = "#c9a84c";

const AIRCRAFT = [
    { id: "light",   name: "Light Jet",        capacity: 6,  range: "Up to 3,000 km",  note: "Short domestic routes" },
    { id: "midsize", name: "Midsize Jet",       capacity: 8,  range: "Up to 5,500 km",  note: "Domestic & West Africa" },
    { id: "heavy",   name: "Heavy Jet",         capacity: 14, range: "Up to 8,000 km",  note: "Pan-African routes" },
    { id: "ultra",   name: "Ultra Long Range",  capacity: 16, range: "14,000+ km",       note: "Worldwide, non-stop" },
];

export default function PrivateJetsScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const border = isDark ? "rgba(255,255,255,0.09)" : "#e0dbd2";
    const surface = C.surface;

    const [aircraft, setAircraft] = useState("midsize");
    const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
    const [departure, setDeparture] = useState("");
    const [destination, setDestination] = useState("");
    const [depDate, setDepDate] = useState(new Date());
    const [depTime, setDepTime] = useState(new Date());
    const [retDate, setRetDate] = useState(new Date());
    const [showDepDate, setShowDepDate] = useState(false);
    const [showDepTime, setShowDepTime] = useState(false);
    const [showRetDate, setShowRetDate] = useState(false);
    const [passengers, setPassengers] = useState(2);
    const [catering, setCatering] = useState("");
    const [groundTransfer, setGroundTransfer] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const selectedAircraft = AIRCRAFT.find(a => a.id === aircraft) ?? AIRCRAFT[1];
    const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const handleSubmit = async () => {
        if (!departure || !destination) {
            Alert.alert("Missing Details", "Please enter a departure and destination.");
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const ref = "JET-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user.id,
            service_type: "private-jet",
            status: "pending",
            reference: ref,
            title: `${selectedAircraft.name} · ${departure} → ${destination}`,
            details: {
                aircraft: selectedAircraft.name,
                tripType,
                departure,
                destination,
                departureDate: fmtDate(depDate),
                departureTime: fmtTime(depTime),
                returnDate: tripType === "return" ? fmtDate(retDate) : null,
                passengers,
                catering: catering || "Not specified",
                groundTransfer,
                notes: notes.trim(),
            },
        });
        setLoading(false);
        if (error) { Alert.alert("Error", error.message); return; }
        setSuccess(true);
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={["top"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 60 }}
            >
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity
                        style={[s.backBtn, { backgroundColor: surface, borderColor: border }]}
                        onPress={() => router.back()}
                    >
                        <ChevronLeft size={20} color={C.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.eyebrow, { color: GOLD }]}>PRIVATE AVIATION</Text>
                        <Text style={[s.pageTitle, { color: C.text }]}>Private Jets</Text>
                    </View>
                </View>

                {/* Hero */}
                <View style={[s.hero, { backgroundColor: isDark ? "#060810" : "#0a0c14" }]}>
                    {/* Subtle dot grid */}
                    <View style={StyleSheet.absoluteFill}>
                        {Array.from({ length: 80 }).map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    position: "absolute",
                                    width: 2, height: 2, borderRadius: 1,
                                    backgroundColor: "#fff",
                                    opacity: 0.04,
                                    left: (i % 10) * 38 + 12,
                                    top: Math.floor(i / 10) * 28 + 12,
                                }}
                            />
                        ))}
                    </View>
                    <Plane size={72} color={GOLD} style={{ opacity: 0.12, transform: [{ rotate: "42deg" }] }} />
                    <View style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
                        <Text style={s.heroEyebrow}>ANYWHERE · ANY TIME</Text>
                        <Text style={s.heroTitle}>The sky has{"\n"}no waiting room.</Text>
                    </View>
                </View>

                {/* Aircraft type */}
                <View style={s.section}>
                    <Text style={[s.sectionLabel, { color: C.muted }]}>AIRCRAFT TYPE</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                        {AIRCRAFT.map(a => {
                            const active = aircraft === a.id;
                            return (
                                <TouchableOpacity
                                    key={a.id}
                                    onPress={() => {
                                        setAircraft(a.id);
                                        setPassengers(p => Math.min(p, a.capacity));
                                    }}
                                    style={[
                                        s.aircraftCard,
                                        {
                                            borderColor: active ? GOLD : border,
                                            backgroundColor: active ? `${GOLD}10` : surface,
                                        },
                                    ]}
                                    activeOpacity={0.8}
                                >
                                    <Plane
                                        size={22}
                                        color={active ? GOLD : C.muted}
                                        style={{ transform: [{ rotate: "42deg" }] }}
                                    />
                                    <Text style={[s.aircraftName, { color: active ? GOLD : C.text }]}>{a.name}</Text>
                                    <Text style={[s.aircraftCap, { color: C.muted }]}>Up to {a.capacity} pax</Text>
                                    <Text style={[s.aircraftRange, { color: active ? `${GOLD}AA` : C.muted }]}>{a.range}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <Text style={[s.aircraftNote, { color: C.muted }]}>{selectedAircraft.note}</Text>
                </View>

                {/* Trip type */}
                <View style={s.section}>
                    <Text style={[s.sectionLabel, { color: C.muted }]}>TRIP TYPE</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        {(["one-way", "return"] as const).map(type => {
                            const active = tripType === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setTripType(type)}
                                    style={{
                                        flex: 1, paddingVertical: 13, borderRadius: 10,
                                        alignItems: "center", borderWidth: 1,
                                        borderColor: active ? GOLD : border,
                                        backgroundColor: active ? `${GOLD}12` : surface,
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={{ fontFamily: "Jost_600SemiBold", fontSize: 14, color: active ? GOLD : C.muted }}>
                                        {type === "one-way" ? "One Way" : "Return Flight"}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Route */}
                <View style={s.section}>
                    <Text style={[s.sectionLabel, { color: C.muted }]}>ROUTE</Text>
                    <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View style={[s.routeDot, { backgroundColor: GOLD }]} />
                            <View style={{ flex: 1 }}>
                                <LocationSearch
                                    value={departure}
                                    onChangeText={setDeparture}
                                    placeholder="Departure city or airport..."
                                    onSelect={setDeparture}
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View style={[s.routeLine, { backgroundColor: border }]} />
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View style={[s.routeDot, { backgroundColor: C.muted, opacity: 0.35 }]} />
                            <View style={{ flex: 1 }}>
                                <LocationSearch
                                    value={destination}
                                    onChangeText={setDestination}
                                    placeholder="Destination city or airport..."
                                    onSelect={setDestination}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Schedule */}
                <View style={s.section}>
                    <Text style={[s.sectionLabel, { color: C.muted }]}>SCHEDULE</Text>
                    <View style={{ gap: 10 }}>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setShowDepDate(true)}
                                style={[s.dateBtn, { flex: 1, borderColor: border, backgroundColor: surface }]}
                            >
                                <Calendar size={15} color={GOLD} />
                                <View>
                                    <Text style={[s.dateBtnLabel, { color: C.muted }]}>DEPARTURE</Text>
                                    <Text style={[s.dateBtnValue, { color: C.text }]}>{fmtDate(depDate)}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowDepTime(true)}
                                style={[s.dateBtn, { flex: 1, borderColor: border, backgroundColor: surface }]}
                            >
                                <Clock size={15} color={GOLD} />
                                <View>
                                    <Text style={[s.dateBtnLabel, { color: C.muted }]}>TIME</Text>
                                    <Text style={[s.dateBtnValue, { color: C.text }]}>{fmtTime(depTime)}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        {tripType === "return" && (
                            <TouchableOpacity
                                onPress={() => setShowRetDate(true)}
                                style={[s.dateBtn, { borderColor: border, backgroundColor: surface }]}
                            >
                                <Calendar size={15} color={GOLD} />
                                <View>
                                    <Text style={[s.dateBtnLabel, { color: C.muted }]}>RETURN DATE</Text>
                                    <Text style={[s.dateBtnValue, { color: C.text }]}>{fmtDate(retDate)}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Passengers */}
                <View style={s.section}>
                    <Text style={[s.sectionLabel, { color: C.muted }]}>PASSENGERS</Text>
                    <View style={[s.stepperRow, { backgroundColor: surface, borderColor: border }]}>
                        <Users size={18} color={GOLD} />
                        <TouchableOpacity
                            style={[s.stepperBtn, { borderColor: border }]}
                            onPress={() => setPassengers(p => Math.max(1, p - 1))}
                        >
                            <Minus size={16} color={C.text} />
                        </TouchableOpacity>
                        <Text style={[s.stepperVal, { color: C.text }]}>{passengers}</Text>
                        <TouchableOpacity
                            style={[s.stepperBtn, { borderColor: border }]}
                            onPress={() => setPassengers(p => Math.min(selectedAircraft.capacity, p + 1))}
                        >
                            <Plus size={16} color={C.text} />
                        </TouchableOpacity>
                        <Text style={{ fontFamily: "Jost_400Regular", fontSize: 13, color: C.muted }}>
                            {`of max ${selectedAircraft.capacity}`}
                        </Text>
                    </View>
                </View>

                {/* Catering */}
                <View style={s.section}>
                    <Text style={[s.sectionLabel, { color: C.muted }]}>IN-FLIGHT CATERING</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                        {["Standard", "Premium Selection", "Custom Menu"].map(opt => {
                            const active = catering === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => setCatering(catering === opt ? "" : opt)}
                                    style={{
                                        paddingHorizontal: 16, paddingVertical: 10,
                                        borderRadius: 8, borderWidth: 1,
                                        borderColor: active ? GOLD : border,
                                        backgroundColor: active ? `${GOLD}12` : surface,
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={{ fontFamily: "Jost_500Medium", fontSize: 13, color: active ? GOLD : C.muted }}>
                                        {opt}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Ground transfer toggle */}
                <View style={s.section}>
                    <View style={[s.toggleRow, { borderColor: border, backgroundColor: surface }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.toggleLabel, { color: C.text }]}>Onward Ground Transfer</Text>
                            <Text style={[s.toggleSub, { color: C.muted }]}>Arrange a chauffeur at your destination</Text>
                        </View>
                        <Switch
                            value={groundTransfer}
                            onValueChange={setGroundTransfer}
                            trackColor={{ false: border, true: `${GOLD}80` }}
                            thumbColor={groundTransfer ? GOLD : "#888"}
                        />
                    </View>
                </View>

                {/* Special requests */}
                <View style={s.section}>
                    <Text style={[s.sectionLabel, { color: C.muted }]}>SPECIAL REQUESTS</Text>
                    <VoiceInput
                        placeholder="Dietary requirements, preferred airports, onboard requests..."
                        value={notes}
                        onChange={setNotes}
                        accent={GOLD}
                        textColor={C.text}
                        border={border}
                        inputBg={surface}
                    />
                </View>

                {/* Submit */}
                <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
                    <TouchableOpacity
                        style={[s.submitBtn, loading && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <Text style={s.submitText}>{loading ? "Submitting..." : "Submit Enquiry"}</Text>
                    </TouchableOpacity>
                    <Text style={[s.submitNote, { color: C.muted }]}>
                        A Lapeq aviation advisor will respond within 2 hours.
                    </Text>
                </View>
            </ScrollView>

            {/* Date pickers - Departure date */}
            {Platform.OS === "android" && showDepDate && (
                <DateTimePicker value={depDate} mode="date" display="default" minimumDate={new Date()} onChange={(_, d) => { setShowDepDate(false); if (d) setDepDate(d); }} />
            )}
            <Modal visible={Platform.OS === "ios" && showDepDate} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} activeOpacity={1} onPress={() => setShowDepDate(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDepDate(false)}><Text style={{ color: C.muted }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontFamily: "Jost_600SemiBold" }}>Departure Date</Text>
                            <TouchableOpacity onPress={() => setShowDepDate(false)}><Text style={{ color: GOLD, fontFamily: "Jost_600SemiBold" }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={depDate} mode="date" display="spinner" minimumDate={new Date()} themeVariant={isDark ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDepDate(d); }} />
                    </View>
                </View>
            </Modal>

            {/* Departure time */}
            {Platform.OS === "android" && showDepTime && (
                <DateTimePicker value={depTime} mode="time" display="default" onChange={(_, d) => { setShowDepTime(false); if (d) setDepTime(d); }} />
            )}
            <Modal visible={Platform.OS === "ios" && showDepTime} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} activeOpacity={1} onPress={() => setShowDepTime(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDepTime(false)}><Text style={{ color: C.muted }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontFamily: "Jost_600SemiBold" }}>Departure Time</Text>
                            <TouchableOpacity onPress={() => setShowDepTime(false)}><Text style={{ color: GOLD, fontFamily: "Jost_600SemiBold" }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={depTime} mode="time" display="spinner" themeVariant={isDark ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDepTime(d); }} />
                    </View>
                </View>
            </Modal>

            {/* Return date */}
            {Platform.OS === "android" && showRetDate && (
                <DateTimePicker value={retDate} mode="date" display="default" minimumDate={depDate} onChange={(_, d) => { setShowRetDate(false); if (d) setRetDate(d); }} />
            )}
            <Modal visible={Platform.OS === "ios" && showRetDate} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} activeOpacity={1} onPress={() => setShowRetDate(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowRetDate(false)}><Text style={{ color: C.muted }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontFamily: "Jost_600SemiBold" }}>Return Date</Text>
                            <TouchableOpacity onPress={() => setShowRetDate(false)}><Text style={{ color: GOLD, fontFamily: "Jost_600SemiBold" }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={retDate} mode="date" display="spinner" minimumDate={depDate} themeVariant={isDark ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setRetDate(d); }} />
                    </View>
                </View>
            </Modal>

            {/* Success */}
            <Modal visible={success} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.successBox, { opacity: alertOpacity, transform: [{ scale: alertScale }], backgroundColor: C.surface, borderColor: `${GOLD}30` }]}>
                        <View style={[s.successIcon, { backgroundColor: `${GOLD}18` }]}>
                            <Check size={28} color={GOLD} strokeWidth={2} />
                        </View>
                        <Text style={[s.successTitle, { color: C.text }]}>Enquiry Received</Text>
                        <Text style={[s.successBody, { color: C.muted }]}>
                            Your Lapeq aviation advisor will confirm availability and present tailored options within 2 hours.
                        </Text>
                        <TouchableOpacity
                            style={[s.successBtn, { backgroundColor: GOLD }]}
                            onPress={() => { setSuccess(false); router.dismissAll(); router.push("/requests"); }}
                        >
                            <Text style={s.successBtnText}>View My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSuccess(false); router.back(); }} style={{ marginTop: 12 }}>
                            <Text style={{ fontFamily: "Jost_400Regular", fontSize: 14, color: C.muted }}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    eyebrow: { fontSize: 9, fontFamily: "Jost_700Bold", letterSpacing: 3, marginBottom: 2 },
    pageTitle: { fontSize: 26, fontFamily: "PlayfairDisplay_700Bold" },

    hero: { marginHorizontal: 20, borderRadius: 16, height: 190, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, position: "relative" },
    heroEyebrow: { fontSize: 9, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 26, fontFamily: "PlayfairDisplay_700Bold", color: "#ffffff", lineHeight: 32 },

    section: { paddingHorizontal: 24, marginBottom: 26 },
    sectionLabel: { fontSize: 9, fontFamily: "Jost_700Bold", letterSpacing: 2.5, marginBottom: 12 },

    aircraftCard: { width: 148, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "flex-start", gap: 5 },
    aircraftName: { fontSize: 14, fontFamily: "Jost_700Bold", marginTop: 4 },
    aircraftCap: { fontSize: 12, fontFamily: "Jost_400Regular" },
    aircraftRange: { fontSize: 11, fontFamily: "Jost_600SemiBold" },
    aircraftNote: { fontSize: 12, fontFamily: "Jost_400Regular", marginTop: 10 },

    routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 14, flexShrink: 0 },
    routeLine: { width: 1, height: 10, marginLeft: 4.5 },

    dateBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
    dateBtnLabel: { fontSize: 8, fontFamily: "Jost_700Bold", letterSpacing: 1.5, marginBottom: 2 },
    dateBtnValue: { fontSize: 13, fontFamily: "Jost_600SemiBold" },

    stepperRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 14, gap: 12 },
    stepperBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    stepperVal: { fontSize: 18, fontFamily: "Jost_700Bold", minWidth: 28, textAlign: "center" },

    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, padding: 16 },
    toggleLabel: { fontSize: 14, fontFamily: "Jost_600SemiBold", marginBottom: 2 },
    toggleSub: { fontSize: 12, fontFamily: "Jost_400Regular" },

    textarea: { flex: 1, minHeight: 100, borderRadius: 10, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: "Jost_400Regular" },
    micBtn: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },

    submitBtn: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 18, alignItems: "center" },
    submitText: { fontSize: 15, fontFamily: "Jost_700Bold", color: "#0a0a0a", letterSpacing: 0.5 },
    submitNote: { fontSize: 12, fontFamily: "Jost_400Regular", textAlign: "center", marginTop: 10 },

    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.12)" },

    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 24 },
    successBox: { width: "100%", borderRadius: 20, padding: 32, alignItems: "center", borderWidth: 1 },
    successIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    successTitle: { fontSize: 22, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 10 },
    successBody: { fontSize: 14, fontFamily: "Jost_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 28 },
    successBtn: { width: "100%", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
    successBtnText: { fontSize: 15, fontFamily: "Jost_700Bold", color: "#0a0a0a" },
});
