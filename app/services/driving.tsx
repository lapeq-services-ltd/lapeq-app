import { useState, useMemo, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Platform, Keyboard, KeyboardAvoidingView, Image, ActivityIndicator,
    Modal, Animated, Alert, Switch, ImageBackground
} from "react-native";
import LocationSearch, { reverseGeocodeWithMapbox } from "@/components/LocationSearch";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, Clock, Users, Car, Minus, Plus, Navigation, Check, Plane, ChevronLeft } from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";

const GOLD = "#c9a84c";

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

const AIRCRAFT = [
    { id: "light",   name: "Light Jet",        capacity: 6,  range: "Up to 3,000 km",  note: "Short domestic routes" },
    { id: "midsize", name: "Midsize Jet",       capacity: 8,  range: "Up to 5,500 km",  note: "Domestic & West Africa" },
    { id: "heavy",   name: "Heavy Jet",         capacity: 14, range: "Up to 8,000 km",  note: "Pan-African routes" },
    { id: "ultra",   name: "Ultra Long Range",  capacity: 16, range: "14,000+ km",       note: "Worldwide, non-stop" },
];

export default function DrivingServiceScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const border = isDark ? "rgba(255,255,255,0.09)" : "#e0dbd2";
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const { eventTag, eventDate, tab } = useLocalSearchParams<{ eventTag?: string; eventDate?: string; tab?: string }>();

    // Tab control
    const [activeTab, setActiveTab] = useState<"car" | "plane" | "commercial">(tab === "plane" ? "plane" : "car");

    // CAR STATES (Original Chauffeur)
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [carType, setCarType] = useState(CAR_OPTIONS[0].id);
    const [passengers, setPassengers] = useState(1);
    const [carCount, setCarCount] = useState(1);
    const [carColor, setCarColor] = useState("no-preference");
    const [instructions, setInstructions] = useState("");
    const [locating, setLocating] = useState(false);

    const [dateObj, setDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [timeObj, setTimeObj] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    // PLANE STATES (Private Jets)
    const [jetAircraft, setJetAircraft] = useState("midsize");
    const [jetTripType, setJetTripType] = useState<"one-way" | "return">("one-way");
    const [jetDeparture, setJetDeparture] = useState("");
    const [jetDestination, setJetDestination] = useState("");
    const [jetDepDate, setJetDepDate] = useState(new Date());
    const [jetDepTime, setJetDepTime] = useState(new Date());
    const [jetRetDate, setJetRetDate] = useState(new Date());
    const [showJetDepDate, setShowJetDepDate] = useState(false);
    const [showJetDepTime, setShowJetDepTime] = useState(false);
    const [showJetRetDate, setShowJetRetDate] = useState(false);
    const [jetPassengers, setJetPassengers] = useState(2);
    const [jetCatering, setJetCatering] = useState("");
    const [jetGroundTransfer, setJetGroundTransfer] = useState(false);
    const [jetNotes, setJetNotes] = useState("");

    // COMMERCIAL FLIGHT STATES
    const [comTripType, setComTripType] = useState<"round" | "oneway" | "multi">("round");
    const [comFrom, setComFrom] = useState("");
    const [comTo, setComTo] = useState("");
    const [comDepDate, setComDepDate] = useState(new Date());
    const [comRetDate, setComRetDate] = useState(new Date(Date.now() + 7 * 86400000));
    const [showComDepDate, setShowComDepDate] = useState(false);
    const [showComRetDate, setShowComRetDate] = useState(false);
    const [comPassengers, setComPassengers] = useState(1);
    const [comCabin, setComCabin] = useState<"economy" | "business" | "first">("economy");
    const [comNotes, setComNotes] = useState("");

    // Shared UI states
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;
    const scrollRef = useRef<ScrollView>(null);
    const dropoffY = useRef(0);

    // Formatted Strings
    const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const formattedTime = timeObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const formattedJetDepDate = jetDepDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const formattedJetDepTime = jetDepTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const formattedJetRetDate = jetRetDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const selectedAircraftObj = AIRCRAFT.find(a => a.id === jetAircraft) ?? AIRCRAFT[1];

    // Listeners for Car Dates
    const onDateChange = (_: any, selected?: Date) => {
        if (selected) setDateObj(selected);
        if (Platform.OS === "android") setShowDatePicker(false);
    };

    const onTimeChange = (_: any, selected?: Date) => {
        if (selected) setTimeObj(selected);
        if (Platform.OS === "android") setShowTimePicker(false);
    };

    // Listeners for Jet Dates
    const onJetDepDateChange = (_: any, selected?: Date) => {
        if (selected) setJetDepDate(selected);
        if (Platform.OS === "android") setShowJetDepDate(false);
    };

    const onJetDepTimeChange = (_: any, selected?: Date) => {
        if (selected) setJetDepTime(selected);
        if (Platform.OS === "android") setShowJetDepTime(false);
    };

    const onJetRetDateChange = (_: any, selected?: Date) => {
        if (selected) setJetRetDate(selected);
        if (Platform.OS === "android") setShowJetRetDate(false);
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

            // Build address from native geocoder
            const nativeFormatted = address ? [
                address.streetNumber,
                address.street,
                address.district ?? address.subregion,
                address.city,
            ].filter(Boolean).join(", ") : "";

            if (nativeFormatted && address?.street) {
                // Native geocoder returned a street — use it
                setPickup(nativeFormatted);
            } else {
                // Native geocoder only returned city/region — use Mapbox for precise street address
                const mapboxResult = await reverseGeocodeWithMapbox(
                    loc.coords.latitude,
                    loc.coords.longitude
                );
                if (mapboxResult) {
                    setPickup(mapboxResult.replace(/, Nigeria$/i, "").trim());
                } else if (nativeFormatted) {
                    setPickup(nativeFormatted);
                }
            }
        } catch {
            Alert.alert("Could not detect location", "Please enter it manually.");
        }
        setLocating(false);
    };

    const handleSubmit = async () => {
        if (activeTab === "car") {
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
                    title: CAR_OPTIONS.find(c => c.id === carType)?.name || "Elite Drive Service",
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
        } else {
            // Jet Submission
            if (!jetDeparture || !jetDestination) {
                return Alert.alert("Missing Details", "Please enter departure and destination.");
            }
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    Alert.alert("Not signed in", "Please sign in to submit a request.");
                    setLoading(false);
                    return;
                }

                const combined = new Date(jetDepDate);
                combined.setHours(jetDepTime.getHours(), jetDepTime.getMinutes());

                const ref = "JET-" + Date.now().toString(36).toUpperCase().slice(-5);
                const { error } = await supabase.from("requests").insert({
                    user_id: user.id,
                    service_type: "private-jet",
                    status: "pending",
                    reference: ref,
                    title: `${selectedAircraftObj.name} · ${jetDeparture} → ${jetDestination}`,
                    pickup_location: jetDeparture,
                    dropoff_location: jetDestination,
                    scheduled_time: combined.toISOString(),
                    details: {
                        aircraft: selectedAircraftObj.name,
                        tripType: jetTripType,
                        departure: jetDeparture,
                        destination: jetDestination,
                        departureDate: formattedJetDepDate,
                        departureTime: formattedJetDepTime,
                        returnDate: jetTripType === "return" ? formattedJetRetDate : null,
                        passengers: jetPassengers,
                        catering: jetCatering || "Not specified",
                        groundTransfer: jetGroundTransfer,
                        notes: jetNotes.trim(),
                    },
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
        <SafeAreaView style={[s.root, { backgroundColor: C.background }]} edges={["top"]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 60 }}>
                    {/* Header */}
                    <View style={s.header}>
                        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                            <ChevronLeft size={20} color={C.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.eyebrow, { color: GOLD }]}>MOBILITY & LOGISTICS</Text>
                            <Text style={[s.title, { color: C.text }]}>Elite Transit & Aviation</Text>
                        </View>
                    </View>

                    {!!eventTag && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 20, marginBottom: 12 }}>
                            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: "#c9a84c20", borderWidth: 1, borderColor: "#c9a84c50" }}>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#c9a84c", letterSpacing: 0.5 }}>EVENT · {eventTag}</Text>
                            </View>
                        </View>
                    )}

                    {/* Segmented Switcher */}
                    <View style={s.tabContainer}>
                        <TouchableOpacity
                            style={[s.tabButton, activeTab === "car" && s.tabButtonActive]}
                            onPress={() => setActiveTab("car")}
                            activeOpacity={0.8}
                        >
                            <Car size={16} color={activeTab === "car" ? C.black : C.muted} />
                            <Text style={[s.tabButtonText, { color: activeTab === "car" ? C.black : C.muted }]}>Elite Drive</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.tabButton, activeTab === "plane" && s.tabButtonActive]}
                            onPress={() => setActiveTab("plane")}
                            activeOpacity={0.8}
                        >
                            <Plane size={16} color={activeTab === "plane" ? C.black : C.muted} style={{ transform: [{ rotate: "45deg" }] }} />
                            <Text style={[s.tabButtonText, { color: activeTab === "plane" ? C.black : C.muted }]}>Private Jets</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.tabButton, activeTab === "commercial" && s.tabButtonActive]}
                            onPress={() => setActiveTab("commercial")}
                            activeOpacity={0.8}
                        >
                            <Plane size={16} color={activeTab === "commercial" ? C.black : C.muted} />
                            <Text style={[s.tabButtonText, { color: activeTab === "commercial" ? C.black : C.muted }]}>Flights</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ──── TAB CONTENT ──── */}
                    {activeTab === "car" ? (
                        /* ── CHAUFFEUR DRIVE FLOW ── */
                        <View style={{ paddingHorizontal: 20 }}>
                            <Text style={[s.label, { color: C.text }]}>Vehicle Class</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.carScroller}>
                                {CAR_OPTIONS.map((car) => {
                                    const isSelected = carType === car.id;
                                    return (
                                        <TouchableOpacity
                                            key={car.id}
                                            style={[s.carOption, { backgroundColor: C.surface, borderColor: isSelected ? C.primary : border }]}
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
                                    <TouchableOpacity onPress={detectLocation} style={[s.locateBtn, { backgroundColor: C.surface, borderWidth: 1, borderColor: border, borderRadius: 14, height: 50, width: 50, alignItems: "center", justifyContent: "center" }]} disabled={locating}>
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
                                        style={[s.inputRow, { backgroundColor: C.surface, borderColor: border }]}
                                        onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                                    >
                                        <Clock size={18} color={C.primary} style={{ marginRight: 8 }} />
                                        <Text style={{ color: C.text, fontSize: 14 }}>{formattedDate}</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={[s.label, { color: C.text }]}>Time *</Text>
                                    <TouchableOpacity
                                        style={[s.inputRow, { backgroundColor: C.surface, borderColor: border }]}
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
                                    <View style={[s.stepperRow, { backgroundColor: C.surface, borderColor: border }]}>
                                        <Users size={18} color={C.primary} />
                                        <TouchableOpacity
                                            style={[s.stepperBtn, { borderColor: border }]}
                                            onPress={() => setPassengers(p => Math.max(1, p - 1))}
                                        >
                                            <Minus size={16} color={C.text} />
                                        </TouchableOpacity>
                                        <Text style={[s.stepperVal, { color: C.text }]}>{passengers}</Text>
                                        <TouchableOpacity
                                            style={[s.stepperBtn, { borderColor: border }]}
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
                            <View style={[s.stepperRow, { backgroundColor: C.surface, borderColor: border }]}>
                                <Car size={18} color={C.primary} />
                                <TouchableOpacity
                                    style={[s.stepperBtn, { borderColor: border }]}
                                    onPress={() => setCarCount(n => Math.max(1, n - 1))}
                                >
                                    <Minus size={16} color={C.text} />
                                </TouchableOpacity>
                                <Text style={[s.stepperVal, { color: C.text }]}>{carCount}</Text>
                                <TouchableOpacity
                                    style={[s.stepperBtn, { borderColor: border }]}
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
                                            { borderColor: carColor === col.id ? C.primary : border, borderWidth: carColor === col.id ? 2.5 : 1.5 }
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
                                border={border}
                                inputBg={C.surface}
                            />
                        </View>
                    ) : (
                        /* ── PRIVATE FLIGHTS & JETS FLOW ── */
                        <View>
                            {/* Aviation Hero — jet.jpg banner */}
                            <ImageBackground
                                source={require("@/assets/images/jet.jpg")}
                                style={[s.hero, { overflow: "hidden" }]}
                                resizeMode="cover"
                            >
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.48)" }]} />
                                <View style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
                                    <Text style={s.heroEyebrow}>ANYWHERE · ANY TIME</Text>
                                    <Text style={s.heroTitle}>{"The sky has\nno waiting room."}</Text>
                                </View>
                            </ImageBackground>

                            <View style={{ paddingHorizontal: 20 }}>
                                {/* Aircraft Type Selection */}
                                <Text style={[s.label, { color: C.text }]}>Aircraft Type</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
                                    {AIRCRAFT.map(a => {
                                        const active = jetAircraft === a.id;
                                        return (
                                            <TouchableOpacity
                                                key={a.id}
                                                onPress={() => {
                                                    setJetAircraft(a.id);
                                                    setJetPassengers(p => Math.min(p, a.capacity));
                                                }}
                                                style={[
                                                    s.aircraftCard,
                                                    {
                                                        borderColor: active ? GOLD : border,
                                                        backgroundColor: active ? `${GOLD}10` : C.surface,
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
                                <Text style={[s.aircraftNote, { color: C.muted }]}>{selectedAircraftObj.note}</Text>

                                {/* Trip Type Selection */}
                                <Text style={[s.label, { color: C.text, marginTop: 12 }]}>Trip Type</Text>
                                <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                                    {(["one-way", "return"] as const).map(type => {
                                        const active = jetTripType === type;
                                        return (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => setJetTripType(type)}
                                                style={{
                                                    flex: 1, paddingVertical: 13, borderRadius: 12,
                                                    alignItems: "center", borderWidth: 1,
                                                    borderColor: active ? GOLD : border,
                                                    backgroundColor: active ? `${GOLD}12` : C.surface,
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={{ fontWeight: "600", fontSize: 14, color: active ? GOLD : C.muted }}>
                                                    {type === "one-way" ? "One Way" : "Return Flight"}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Departure and Destination Routes */}
                                <Text style={[s.label, { color: C.text }]}>Route</Text>
                                <View style={{ gap: 8, marginBottom: 20 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                        <View style={[s.routeDot, { backgroundColor: GOLD }]} />
                                        <View style={{ flex: 1 }}>
                                            <LocationSearch
                                                value={jetDeparture}
                                                onChangeText={setJetDeparture}
                                                placeholder="Departure city or airport..."
                                                onSelect={setJetDeparture}
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
                                                value={jetDestination}
                                                onChangeText={setJetDestination}
                                                placeholder="Destination city or airport..."
                                                onSelect={setJetDestination}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Schedule dates for flight */}
                                <View style={s.dtRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.label, { color: C.text }]}>Departure Date *</Text>
                                        <TouchableOpacity
                                            style={[s.inputRow, { backgroundColor: C.surface, borderColor: border }]}
                                            onPress={() => { Keyboard.dismiss(); setShowJetDepDate(true); }}
                                        >
                                            <Clock size={18} color={GOLD} style={{ marginRight: 8 }} />
                                            <Text style={{ color: C.text, fontSize: 14 }}>{formattedJetDepDate}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.label, { color: C.text }]}>Time *</Text>
                                        <TouchableOpacity
                                            style={[s.inputRow, { backgroundColor: C.surface, borderColor: border }]}
                                            onPress={() => { Keyboard.dismiss(); setShowJetDepTime(true); }}
                                        >
                                            <Clock size={18} color={GOLD} style={{ marginRight: 8 }} />
                                            <Text style={{ color: C.text, fontSize: 14 }}>{formattedJetDepTime}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {jetTripType === "return" && (
                                    <View style={{ width: "100%" }}>
                                        <Text style={[s.label, { color: C.text }]}>Return Date *</Text>
                                        <TouchableOpacity
                                            style={[s.inputRow, { backgroundColor: C.surface, borderColor: border }]}
                                            onPress={() => { Keyboard.dismiss(); setShowJetRetDate(true); }}
                                        >
                                            <Clock size={18} color={GOLD} style={{ marginRight: 8 }} />
                                            <Text style={{ color: C.text, fontSize: 14 }}>{formattedJetRetDate}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Passengers */}
                                <Text style={[s.label, { color: C.text }]}>Passengers</Text>
                                <View style={[s.stepperRow, { backgroundColor: C.surface, borderColor: border }]}>
                                    <Users size={18} color={GOLD} />
                                    <TouchableOpacity
                                        style={[s.stepperBtn, { borderColor: border }]}
                                        onPress={() => setJetPassengers(p => Math.max(1, p - 1))}
                                    >
                                        <Minus size={16} color={C.text} />
                                    </TouchableOpacity>
                                    <Text style={[s.stepperVal, { color: C.text }]}>{jetPassengers}</Text>
                                    <TouchableOpacity
                                        style={[s.stepperBtn, { borderColor: border }]}
                                        onPress={() => setJetPassengers(p => Math.min(selectedAircraftObj.capacity, p + 1))}
                                    >
                                        <Plus size={16} color={C.text} />
                                    </TouchableOpacity>
                                    <Text style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>
                                        {`of max ${selectedAircraftObj.capacity}`}
                                    </Text>
                                </View>

                                {/* Catering Selection */}
                                <Text style={[s.label, { color: C.text }]}>In-Flight Catering</Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                                    {["Standard", "Premium Selection", "Custom Menu"].map(opt => {
                                        const active = jetCatering === opt;
                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                onPress={() => setJetCatering(jetCatering === opt ? "" : opt)}
                                                style={{
                                                    paddingHorizontal: 16, paddingVertical: 10,
                                                    borderRadius: 8, borderWidth: 1,
                                                    borderColor: active ? GOLD : border,
                                                    backgroundColor: active ? `${GOLD}12` : C.surface,
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={{ fontWeight: "500", fontSize: 13, color: active ? GOLD : C.muted }}>
                                                    {opt}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Ground Transfer Toggle */}
                                <View style={[s.toggleRow, { borderColor: border, backgroundColor: C.surface, marginBottom: 20 }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.toggleLabel, { color: C.text }]}>Onward Ground Transfer</Text>
                                        <Text style={[s.toggleSub, { color: C.muted }]}>Arrange a chauffeur at your destination</Text>
                                    </View>
                                    <Switch
                                        value={jetGroundTransfer}
                                        onValueChange={setJetGroundTransfer}
                                        trackColor={{ false: border, true: `${GOLD}80` }}
                                        thumbColor={jetGroundTransfer ? GOLD : "#888"}
                                    />
                                </View>

                                {/* Special Requests */}
                                <Text style={[s.label, { color: C.text }]}>Special Requests</Text>
                                <VoiceInput
                                    placeholder="Dietary requirements, preferred airports, onboard requests..."
                                    value={jetNotes}
                                    onChange={setJetNotes}
                                    accent={GOLD}
                                    textColor={C.text}
                                    border={border}
                                    inputBg={C.surface}
                                />
                            </View>
                        </View>
                    ) : activeTab === "commercial" ? (
                        /* ── COMMERCIAL FLIGHTS FLOW ── */
                        <View>
                            {/* Commercial Flights Hero — jet.jpg banner */}
                            <ImageBackground
                                source={require("@/assets/images/jet.jpg")}
                                style={[s.hero, { overflow: "hidden", height: 200, marginHorizontal: 20, borderRadius: 20 }]}
                                resizeMode="cover"
                            >
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.42)" }]} />
                                <View style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
                                    <Text style={s.heroEyebrow}>ECONOMY · BUSINESS · FIRST CLASS</Text>
                                    <Text style={s.heroTitle}>{"Commercial\nFlights"}</Text>
                                </View>
                            </ImageBackground>

                            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>

                                {/* Trip Type Tabs — Round Trip / One Way / Multiple Trip */}
                                <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                                    {(["round", "oneway", "multi"] as const).map(type => {
                                        const active = comTripType === type;
                                        const labels: Record<string, string> = { round: "Round Trip", oneway: "One Way", multi: "Multi-City" };
                                        return (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => setComTripType(type)}
                                                style={{
                                                    flex: 1, paddingVertical: 10, borderRadius: 10,
                                                    alignItems: "center", borderWidth: 1,
                                                    borderColor: active ? GOLD : border,
                                                    backgroundColor: active ? `${GOLD}14` : C.surface,
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={{ fontSize: 12, fontWeight: "700", color: active ? GOLD : C.muted }}>
                                                    {labels[type]}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* From / To Card */}
                                <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: border, marginBottom: 16, overflow: "hidden" }}>
                                    {/* From */}
                                    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: border }}>
                                        <Text style={{ fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>FROM</Text>
                                        <LocationSearch
                                            value={comFrom}
                                            onChangeText={setComFrom}
                                            placeholder="Departure city or airport..."
                                            onSelect={setComFrom}
                                        />
                                    </View>
                                    {/* Swap icon */}
                                    <View style={{ position: "absolute", right: 20, top: "50%", marginTop: -18, zIndex: 2 }}>
                                        <TouchableOpacity
                                            onPress={() => { const t = comFrom; setComFrom(comTo); setComTo(t); }}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.background, borderWidth: 1, borderColor: border, alignItems: "center", justifyContent: "center" }}
                                        >
                                            <Plane size={16} color={GOLD} style={{ transform: [{ rotate: "90deg" }] }} />
                                        </TouchableOpacity>
                                    </View>
                                    {/* To */}
                                    <View style={{ padding: 16 }}>
                                        <Text style={{ fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>TO</Text>
                                        <LocationSearch
                                            value={comTo}
                                            onChangeText={setComTo}
                                            placeholder="Destination city or airport..."
                                            onSelect={setComTo}
                                        />
                                    </View>
                                </View>

                                {/* Dates Row */}
                                <View style={s.dtRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.label, { color: C.text }]}>Departure *</Text>
                                        <TouchableOpacity
                                            style={[s.inputRow, { backgroundColor: C.surface, borderColor: border }]}
                                            onPress={() => { Keyboard.dismiss(); setShowComDepDate(true); }}
                                        >
                                            <Clock size={18} color={GOLD} style={{ marginRight: 8 }} />
                                            <Text style={{ color: C.text, fontSize: 14 }}>
                                                {comDepDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    {comTripType === "round" && (
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.label, { color: C.text }]}>Return *</Text>
                                            <TouchableOpacity
                                                style={[s.inputRow, { backgroundColor: C.surface, borderColor: border }]}
                                                onPress={() => { Keyboard.dismiss(); setShowComRetDate(true); }}
                                            >
                                                <Clock size={18} color={GOLD} style={{ marginRight: 8 }} />
                                                <Text style={{ color: C.text, fontSize: 14 }}>
                                                    {comRetDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                {showComDepDate && (
                                    <DateTimePicker mode="date" value={comDepDate} minimumDate={new Date()}
                                        onChange={(_, d) => { if (d) setComDepDate(d); if (Platform.OS === "android") setShowComDepDate(false); }}
                                    />
                                )}
                                {showComRetDate && (
                                    <DateTimePicker mode="date" value={comRetDate} minimumDate={comDepDate}
                                        onChange={(_, d) => { if (d) setComRetDate(d); if (Platform.OS === "android") setShowComRetDate(false); }}
                                    />
                                )}

                                {/* Passengers Stepper */}
                                <Text style={[s.label, { color: C.text }]}>Passengers</Text>
                                <View style={[s.stepperRow, { backgroundColor: C.surface, borderColor: border, marginBottom: 20 }]}>
                                    <Users size={18} color={GOLD} />
                                    <TouchableOpacity
                                        style={[s.stepperBtn, { borderColor: border }]}
                                        onPress={() => setComPassengers(p => Math.max(1, p - 1))}
                                    >
                                        <Minus size={16} color={C.text} />
                                    </TouchableOpacity>
                                    <Text style={[s.stepperVal, { color: C.text }]}>{comPassengers}</Text>
                                    <TouchableOpacity
                                        style={[s.stepperBtn, { borderColor: border }]}
                                        onPress={() => setComPassengers(p => p + 1)}
                                    >
                                        <Plus size={16} color={C.text} />
                                    </TouchableOpacity>
                                    <Text style={{ flex: 1, textAlign: "right", color: C.muted, fontSize: 13 }}>
                                        {comPassengers === 1 ? "1 Passenger" : `${comPassengers} Passengers`}
                                    </Text>
                                </View>

                                {/* Cabin Class */}
                                <Text style={[s.label, { color: C.text }]}>Cabin Class</Text>
                                <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                                    {(["economy", "business", "first"] as const).map(cls => {
                                        const active = comCabin === cls;
                                        const icons: Record<string, string> = { economy: "✈️", business: "💼", first: "👑" };
                                        const labels: Record<string, string> = { economy: "Economy", business: "Business", first: "First Class" };
                                        return (
                                            <TouchableOpacity
                                                key={cls}
                                                onPress={() => setComCabin(cls)}
                                                style={{
                                                    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", gap: 4,
                                                    borderWidth: 1, borderColor: active ? GOLD : border,
                                                    backgroundColor: active ? `${GOLD}12` : C.surface,
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={{ fontSize: 18 }}>{icons[cls]}</Text>
                                                <Text style={{ fontSize: 11, fontWeight: "700", color: active ? GOLD : C.muted }}>
                                                    {labels[cls]}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Special Requests */}
                                <Text style={[s.label, { color: C.text }]}>Special Requests</Text>
                                <VoiceInput
                                    placeholder="Meal preference, seat preference, special assistance..."
                                    value={comNotes}
                                    onChange={setComNotes}
                                    accent={GOLD}
                                    textColor={C.text}
                                    border={border}
                                    inputBg={C.surface}
                                />
                            </View>
                        </View>
                    ) : null}

                    {/* Submit Button */}
                    <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
                        <TouchableOpacity
                            style={[s.btn, { backgroundColor: C.primary }, loading && s.btnDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Text style={[s.btnText, { color: C.black }]}>
                                {loading ? "Submitting..." : activeTab === "car" ? "Submit Request" : activeTab === "commercial" ? "Search & Request Flights" : "Submit Enquiry"}
                            </Text>
                        </TouchableOpacity>
                        {(activeTab === "plane" || activeTab === "commercial") && (
                            <Text style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10 }}>
                                {activeTab === "commercial"
                                    ? "A Lapeq travel advisor will source the best fares and confirm within 4 hours."
                                    : "A Lapeq aviation advisor will respond within 2 hours."}
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
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
                        <Text style={s.modalTitle}>
                            {activeTab === "car" ? "Request Submitted" : "Enquiry Received"}
                        </Text>
                        <Text style={s.modalBody}>
                            {activeTab === "car"
                                ? "Your request has been received. Track its status in My Requests."
                                : "Your Lapeq aviation advisor will confirm availability and present tailored options within 2 hours."}
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

            {/* ──── DATE/TIME PICKERS ──── */}
            {/* Car Date Picker Modal */}
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
                            themeVariant={isDark ? "dark" : "light"}
                            style={{ width: "100%" }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Car Time Picker Modal */}
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
                            themeVariant={isDark ? "dark" : "light"}
                            style={{ width: "100%" }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Jet Departure Date Modal */}
            <Modal visible={showJetDepDate} transparent animationType="slide" onRequestClose={() => setShowJetDepDate(false)}>
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} activeOpacity={1} onPress={() => setShowJetDepDate(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowJetDepDate(false)}><Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>Departure Date</Text>
                            <TouchableOpacity onPress={() => setShowJetDepDate(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 15 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={jetDepDate}
                            mode="date"
                            display="spinner"
                            minimumDate={new Date()}
                            themeVariant={isDark ? "dark" : "light"}
                            style={{ width: "100%" }}
                            onChange={onJetDepDateChange}
                        />
                    </View>
                </View>
            </Modal>

            {/* Jet Departure Time Modal */}
            <Modal visible={showJetDepTime} transparent animationType="slide" onRequestClose={() => setShowJetDepTime(false)}>
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} activeOpacity={1} onPress={() => setShowJetDepTime(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowJetDepTime(false)}><Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>Departure Time</Text>
                            <TouchableOpacity onPress={() => setShowJetDepTime(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 15 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={jetDepTime}
                            mode="time"
                            display="spinner"
                            themeVariant={isDark ? "dark" : "light"}
                            style={{ width: "100%" }}
                            onChange={onJetDepTimeChange}
                        />
                    </View>
                </View>
            </Modal>

            {/* Jet Return Date Modal */}
            <Modal visible={showJetRetDate} transparent animationType="slide" onRequestClose={() => setShowJetRetDate(false)}>
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} activeOpacity={1} onPress={() => setShowJetRetDate(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowJetRetDate(false)}><Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>Return Date</Text>
                            <TouchableOpacity onPress={() => setShowJetRetDate(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 15 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={jetRetDate}
                            mode="date"
                            display="spinner"
                            minimumDate={jetDepDate}
                            themeVariant={isDark ? "dark" : "light"}
                            style={{ width: "100%" }}
                            onChange={onJetRetDateChange}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 14 },
    backBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", alignItems: "center", justifyContent: "center" },
    eyebrow: { fontSize: 9, fontWeight: "700", letterSpacing: 2.5, marginBottom: 2 },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 2 },
    subtitle: { fontSize: 13, marginBottom: 28 },
    label: { fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.6 },

    // Tab Switcher Styles
    tabContainer: {
        flexDirection: "row",
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2",
    },
    tabButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
    },
    tabButtonActive: {
        backgroundColor: C.primary,
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },

    // Car Scroller
    carScroller: { marginBottom: 16 },
    carOption: { width: 160, padding: 12, borderRadius: 16, borderWidth: 2, marginRight: 12 },
    carImgWrap: { height: 85, marginBottom: 8, justifyContent: "center", alignItems: "center" },
    carImg: { width: "100%", height: "100%" },
    carName: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
    carDesc: { fontSize: 10, lineHeight: 14 },

    inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 20 },
    inputFlex: { flex: 1, fontSize: 14 },
    locateBtn: { padding: 4, marginLeft: 8 },

    dtRow: { flexDirection: "row", gap: 12 },

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

    // Aviation Hero & Component Styles
    hero: { marginHorizontal: 20, borderRadius: 16, height: 190, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 20, position: "relative" },
    heroEyebrow: { fontSize: 9, fontWeight: "700", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 26, fontWeight: "700", color: "#ffffff", lineHeight: 32, textAlign: "center" },

    aircraftCard: { width: 148, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "flex-start", gap: 5 },
    aircraftName: { fontSize: 14, fontWeight: "700", marginTop: 4 },
    aircraftCap: { fontSize: 12 },
    aircraftRange: { fontSize: 11, fontWeight: "600" },
    aircraftNote: { fontSize: 12, marginTop: 4, marginBottom: 12 },

    routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 14, flexShrink: 0 },
    routeLine: { width: 1, height: 10, marginLeft: 4.5 },

    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, padding: 16 },
    toggleLabel: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
    toggleSub: { fontSize: 12 },
});
