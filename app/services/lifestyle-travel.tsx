import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
    Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    View, Platform, Image, Modal, Animated, Alert, Dimensions, Switch,
} from "react-native";
import LocationSearch from "@/components/LocationSearch";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { takePendingService } from "@/lib/serviceStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, ChevronRight, Calendar, Check, Plane, Plus, Minus, Lock } from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";


const { width: W } = Dimensions.get("window");
const GOLD = "#c9a84c";

const AIRCRAFT = [
    { id: "light",   name: "Light Jet",       capacity: 6,  range: "Up to 3,000 km", note: "Short domestic routes" },
    { id: "midsize", name: "Midsize Jet",      capacity: 8,  range: "Up to 5,500 km", note: "Domestic & West Africa" },
    { id: "heavy",   name: "Heavy Jet",        capacity: 14, range: "Up to 8,000 km", note: "Pan-African routes" },
    { id: "ultra",   name: "Ultra Long Range", capacity: 16, range: "14,000+ km",      note: "Worldwide, non-stop" },
];

const SERVICE_TYPES = [
    { id: "Curated Itinerary",      label: "Curated Itinerary", emoji: "✦", desc: "A full trip planned end-to-end for you",           img: require("@/assets/images/lagos-hotel.jpg") },
    { id: "Stays & Accommodations", label: "Stays",             emoji: "⌂", desc: "Hotels, villas, and private residences",           img: require("@/assets/images/lagos-rooftop.jpg") },
    { id: "Private Dining",         label: "Private & Fine Dining", emoji: "◈", desc: "Exclusive tables, private chef, and fine dining experiences", img: require("@/assets/images/lagos-restaurant.jpg") },
    { id: "VIP Protocol",           label: "VIP Protocol",      emoji: "◆", desc: "Airport arrivals, security, and event access",     img: require("@/assets/images/lagos-beach.jpg") },
    { id: "Flights & Jets",         label: "Private Jets",      emoji: "✈", desc: "Book private charters, jets & helicopters",        img: require("@/assets/images/exterior-luxury.jpg") },
    { id: "Legal Advisory",         label: "Legal Advisory",    emoji: "⚖", desc: "Consultations, document support & trusted referrals", img: require("@/assets/images/onboarding-trust.png") },
    { id: "Gift & Florals",         label: "Gift & Florals",    emoji: "◈", desc: "Bouquets, luxury gifts & occasion curation",        img: require("@/assets/images/lagos-restaurant.jpg") },
    { id: "Recreational Activities",label: "Recreation",        emoji: "◎", desc: "Golf, tennis, water sports & leisure bookings",    img: require("@/assets/images/lagos-beach.jpg") },
    { id: "Medical Concierge",      label: "Medical Concierge", emoji: "✦", desc: "Doctor appointments & specialist referrals",        img: require("@/assets/images/onboarding-lifestyle.png") },
    { id: "Home & Property",        label: "Home & Property",   emoji: "⌂", desc: "Interior design, sourcing & management",           img: require("@/assets/images/lagos-hotel.jpg") },
    { id: "Financial Advisory",     label: "Financial Advisory",emoji: "◆", desc: "Wealth management, tax & investment planning",       img: require("@/assets/images/lagos-rooftop.jpg") },
    { id: "Photography & Content",  label: "Photography",       emoji: "□", desc: "Photographers, portrait sessions & content creators", img: require("@/assets/images/onboarding-driving.png") },
    { id: "Childcare & Family",     label: "Childcare & Family",emoji: "△", desc: "Nanny sourcing, school admissions & childcare",        img: require("@/assets/images/onboarding-lifestyle.png") },
    { id: "Security & Protocol",    label: "Security",          emoji: "◉", desc: "Personal protection & VIP security arrangements",    img: require("@/assets/images/ikoyi-bridge.jpg") },
    { id: "Bespoke Request",        label: "Bespoke Request",   emoji: "✦", desc: "Any custom request or premium service not listed",  img: require("@/assets/images/onboarding-lifestyle.png") },
    { id: "Passport Renewal",       label: "Passport Renewal",  emoji: "◈", desc: "End-to-end passport renewal & document processing",  img: require("@/assets/images/onboarding-trust.png") },
    { id: "Bank Account Opening",   label: "Bank Account",      emoji: "◆", desc: "Open a Nigerian bank account remotely",              img: require("@/assets/images/lagos-rooftop.jpg") },
];

const MOODS           = ["Romantic", "Adventure", "Business", "Wellness", "Celebration", "Family"];
const CITIES          = ["Lagos", "Abuja", "Port Harcourt", "Akwa Ibom", "Kano", "Other"];
const STAY_TYPES      = ["Hotel", "Villa", "Private Residence", "Serviced Apartment"];
const STAY_AMENITIES  = ["Private Pool", "Gym", "Spa Access", "Butler Service", "Private Chef", "Airport Transfer", "Sea View", "City View"];
const STAY_ACTIVITIES = ["Beach / Pool", "Gym / Fitness", "Spa & Wellness", "Nightlife", "Cultural Tours", "Nature / Hiking", "Water Sports", "Shopping"];
const DINING_OCCASIONS = ["Birthday", "Anniversary", "Business Dinner", "Proposal", "Celebration", "Just Because"];
const DINING_VENUES   = ["Restaurant", "Home Setup", "Villa", "Rooftop", "Yacht"];
const CUISINES        = ["Nigerian", "Continental", "Asian", "Mediterranean", "Chef's Choice"];
const DINING_SETUP    = ["Floral Decor", "Candlelight", "Live Music", "Photography", "Surprise Element", "Custom Menu"];
const PROTOCOL_TYPES  = ["Airport Reception", "Event Access", "Security Detail", "Port Protocol", "Diplomatic Escort"];

function BudgetStepper({ value, onChange, min, step, label, C, theme }: {
    value: number; onChange: (v: number) => void; min: number; step: number; label?: string; C: any; theme: string;
}) {
    const isDark = theme === "dark";
    const fmt = (v: number) => v >= 1_000_000
        ? `₦${(v / 1_000_000 % 1 === 0 ? v / 1_000_000 : (v / 1_000_000).toFixed(1))}M`
        : `₦${(v / 1000).toFixed(0)}k`;
    return (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: isDark ? "#111" : "#f7f3eb", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? "#2a2a2a" : "#e0dbd2" }}>
            <TouchableOpacity
                style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: isDark ? "#2a2a2a" : "#e0dbd2", backgroundColor: isDark ? "#1a1a1a" : "#fff", alignItems: "center", justifyContent: "center" }}
                onPress={() => onChange(Math.max(min, value - step))}
                activeOpacity={0.8}
            >
                <Minus size={18} color={C.text} />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
                {label && <Text style={{ fontSize: 9, fontWeight: "800", color: C.muted, letterSpacing: 2, marginBottom: 6 }}>{label}</Text>}
                <Text style={{ fontSize: 28, fontWeight: "800", color: GOLD }}>{fmt(value)}</Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>tap +/− to adjust</Text>
            </View>
            <TouchableOpacity
                style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: isDark ? "#2a2a2a" : "#e0dbd2", backgroundColor: isDark ? "#1a1a1a" : "#fff", alignItems: "center", justifyContent: "center" }}
                onPress={() => onChange(value + step)}
                activeOpacity={0.8}
            >
                <Plus size={18} color={C.text} />
            </TouchableOpacity>
        </View>
    );
}

export default function LifestyleTravelScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ prefillType?: string; prefillVenue?: string; prefillCity?: string }>();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [serviceType, setServiceType] = useState(SERVICE_TYPES[0].id);

    // Sub-form state variables
    const [giftOccasion, setGiftOccasion] = useState("");
    const [giftType, setGiftType] = useState("");
    const [giftRecipient, setGiftRecipient] = useState("");
    const [giftMessage, setGiftMessage] = useState("");

    const [recreationActivity, setRecreationActivity] = useState("");
    const [recreationLevel, setRecreationLevel] = useState("Beginner");
    const [recreationGroupSize, setRecreationGroupSize] = useState(1);

    const [medicalCareType, setMedicalCareType] = useState("");
    const [medicalUrgency, setMedicalUrgency] = useState("Flexible");

    const [financeGoal, setFinanceGoal] = useState("");
    const [financeStrategy, setFinanceStrategy] = useState("Balanced");

    const [legalMatterType, setLegalMatterType] = useState("");

    const startOfToday = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const isToday = useCallback((date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }, []);

    // Prefill logic
    useEffect(() => {
        if (params.prefillType) {
            setServiceType(params.prefillType);
        }
        if (params.prefillCity) {
            setDiningCity(params.prefillCity);
            setStayDest(params.prefillCity);
            setDestination(params.prefillCity);
        }
        if (params.prefillVenue) {
            if (params.prefillType === "Private Dining") {
                setDiningVenue("Restaurant");
                setDiningNotes(`Requested curation for Curated Partner Venue (Ref: ${params.prefillVenue}). Please coordinate reservations and benefits.`);
            } else if (params.prefillType === "Stays & Accommodations") {
                setStayNotes(`Requested curation for Curated Partner Venue (Ref: ${params.prefillVenue}). Please coordinate stays and benefits.`);
            } else {
                setPreferences(`Requested curation for Curated Partner Venue (Ref: ${params.prefillVenue}).`);
            }
        }
    }, []);

    useFocusEffect(useCallback(() => {
        const pending = takePendingService();
        if (pending) setServiceType(pending);
    }, []));

    useEffect(() => {
        const loadUserTier = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

                const [{ data: profile }, { count }] = await Promise.all([
                    supabase.from("profiles").select("tier").eq("id", user.id).single(),
                    supabase.from("requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfMonth),
                ]);

                if (profile) setUserTier(profile.tier);
                setMonthlyRequestsCount(count ?? 0);
            }
        };
        loadUserTier();
    }, []);

    // Shared date/time state
    const [dateFromObj, setDateFromObj]   = useState<Date | null>(null);
    const [dateToObj, setDateToObj]       = useState<Date | null>(null);
    const [showDateFrom, setShowDateFrom] = useState(false);
    const [showDateTo, setShowDateTo]     = useState(false);
    const [eventTime, setEventTime]       = useState<Date | null>(null);
    const [showEventTime, setShowEventTime] = useState(false);

    // Curated Itinerary
    const [mood, setMood]               = useState("");
    const [destination, setDestination] = useState("");
    const [curatedBudget, setCuratedBudget] = useState(50000);
    const [preferences, setPreferences] = useState("");

    // Stays
    const [stayType, setStayType]         = useState("");
    const [stayDest, setStayDest]         = useState("");
    const [stayGuests, setStayGuests]     = useState(2);
    const [dailyBudget, setDailyBudget]   = useState(20000);
    const [stayAmenities, setStayAmenities]   = useState<string[]>([]);
    const [stayActivities, setStayActivities] = useState<string[]>([]);
    const [stayNotes, setStayNotes]       = useState("");

    // Private Dining
    const [diningOccasion, setDiningOccasion] = useState("");
    const [diningVenue, setDiningVenue]       = useState("");
    const [diningCity, setDiningCity]         = useState("");
    const [diningGuests, setDiningGuests]     = useState(2);
    const [diningCuisine, setDiningCuisine]   = useState("");
    const [diningSetup, setDiningSetup]       = useState<string[]>([]);
    const [diningBudget, setDiningBudget]     = useState(50000);
    const [diningNotes, setDiningNotes]       = useState("");

    // VIP Protocol
    const [protocolType, setProtocolType]   = useState("");
    const [protocolCity, setProtocolCity]   = useState("");
    const [protocolPersons, setProtocolPersons] = useState(1);
    const [protocolReqs, setProtocolReqs]   = useState("");

    // Jets
    const [selectedAircraft, setSelectedAircraft] = useState(AIRCRAFT[0]);
    const [tripType, setTripType]   = useState<"oneway" | "return">("oneway");
    const [jetDeparture, setJetDeparture]     = useState("");
    const [jetDestination, setJetDestination] = useState("");
    const [depDate, setDepDate]     = useState<Date | null>(null);
    const [depTime, setDepTime]     = useState<Date | null>(null);
    const [retDate, setRetDate]     = useState<Date | null>(null);
    const [passengers, setPassengers] = useState(1);
    const [catering, setCatering]   = useState("standard");
    const [groundTransfer, setGroundTransfer] = useState(false);
    const [specialRequests, setSpecialRequests] = useState("");
    const [showDepDate, setShowDepDate] = useState(false);
    const [showDepTime, setShowDepTime] = useState(false);
    const [showRetDate, setShowRetDate] = useState(false);

    const [loading, setLoading]       = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [userTier, setUserTier] = useState<string | null>(null);
    const [monthlyRequestsCount, setMonthlyRequestsCount] = useState(0);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale   = useRef(new Animated.Value(0.9)).current;
    const scrollRef    = useRef<ScrollView>(null);

    const activeService   = SERVICE_TYPES.find(sv => sv.id === serviceType) ?? SERVICE_TYPES[0];
    const isJets          = serviceType === "Flights & Jets";
    const isStays         = serviceType === "Stays & Accommodations";
    const isPrivateDining = serviceType === "Private Dining";
    const isVIPProtocol   = serviceType === "VIP Protocol";
    const isLifestyleService = [
        "Legal Advisory",
        "Gift & Florals",
        "Recreational Activities",
        "Medical Concierge",
        "Home & Property",
        "Financial Advisory",
        "Photography & Content",
        "Childcare & Family",
        "Security & Protocol",
        "Bespoke Request",
        "Passport Renewal",
        "Bank Account Opening",
    ].includes(serviceType);

    const isFreeUser = !userTier || !["silver", "gold", "black"].includes(userTier.toLowerCase());
    const limitReached = isFreeUser && monthlyRequestsCount >= 5;

    const fmtDate = (d: Date | null) => d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;
    const fmtTime = (d: Date | null) => d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null;

    const toggle = (list: string[], setList: (v: string[]) => void, val: string) =>
        setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);

    const handleSubmit = async () => {
        if (limitReached) { Alert.alert("Limit Reached", "You've used all 5 of your monthly requests. Upgrade to Premium to continue."); return; }
        if (isJets) {
            if (!jetDeparture || !jetDestination) { Alert.alert("Add Route", "Please enter departure and destination."); return; }
        } else if (isStays) {
            if (!stayDest) { Alert.alert("Add Destination", "Please enter a destination."); return; }
        } else if (isPrivateDining) {
            if (!diningCity) { Alert.alert("Select City", "Please choose your city."); return; }
        } else if (isVIPProtocol) {
            if (!protocolType || !protocolCity) { Alert.alert("Add Details", "Please select a service type and city."); return; }
        } else if (isLifestyleService) {
            if (serviceType === "Gift & Florals" && !giftOccasion) { Alert.alert("Select Occasion", "Please choose an occasion."); return; }
            if (serviceType === "Recreational Activities" && !recreationActivity) { Alert.alert("Select Activity", "Please choose an activity."); return; }
            if (serviceType === "Medical Concierge" && !medicalCareType) { Alert.alert("Select Care Type", "Please choose a care type."); return; }
            if (serviceType === "Financial Advisory" && !financeGoal) { Alert.alert("Select Goal", "Please choose a goal."); return; }
            if (serviceType === "Legal Advisory" && !legalMatterType) { Alert.alert("Select Matter Type", "Please choose a matter type."); return; }
            if (preferences.trim().length === 0) { Alert.alert("Add Details", "Please describe what you need."); return; }
        } else {
            if (!destination && preferences.trim().length === 0) { Alert.alert("Add Details", "Please enter a destination or describe your experience."); return; }
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = (isJets ? "JET-" : "LPQ-") + Date.now().toString(36).toUpperCase().slice(-5);
        const hasPremiumMembership = userTier && ["silver", "gold", "black"].includes(userTier.toLowerCase());
        const details = isJets
            ? { aircraft: selectedAircraft.name, tripType, departure: jetDeparture, destination: jetDestination, depDate: fmtDate(depDate), depTime: fmtTime(depTime), retDate: tripType === "return" ? fmtDate(retDate) : null, passengers, catering, groundTransfer, specialRequests }
            : {
                ...(isStays
                    ? { serviceType, stayType, destination: stayDest, checkIn: fmtDate(dateFromObj), checkOut: fmtDate(dateToObj), guests: stayGuests, dailyBudget, amenities: stayAmenities, activities: stayActivities, notes: stayNotes }
                    : isPrivateDining
                    ? { serviceType, occasion: diningOccasion, venueType: diningVenue, city: diningCity, guests: diningGuests, date: fmtDate(dateFromObj), time: fmtTime(eventTime), cuisine: diningCuisine, setup: diningSetup, budget: diningBudget, notes: diningNotes }
                    : isVIPProtocol
                    ? { serviceType, protocolType, city: protocolCity, date: fmtDate(dateFromObj), time: fmtTime(eventTime), persons: protocolPersons, requirements: protocolReqs }
                    : isLifestyleService
                    ? {
                        serviceType,
                        city: destination,
                        date: fmtDate(dateFromObj),
                        budget: curatedBudget,
                        description: preferences,
                        // Add serialized details for sub-forms
                        ...(serviceType === "Gift & Florals" ? { giftOccasion, giftType, giftRecipient, giftMessage } : {}),
                        ...(serviceType === "Recreational Activities" ? { recreationActivity, recreationLevel, recreationGroupSize } : {}),
                        ...(serviceType === "Medical Concierge" ? { medicalCareType, medicalUrgency } : {}),
                        ...(serviceType === "Financial Advisory" ? { financeGoal, financeStrategy } : {}),
                        ...(serviceType === "Legal Advisory" ? { legalMatterType } : {})
                      }
                    : { serviceType, mood, destination, dateFrom: fmtDate(dateFromObj), dateTo: fmtDate(dateToObj), budget: curatedBudget, preferences }),
                targetVenue: params.prefillVenue || null
              };
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: isJets ? "private-jet" : "lifestyle-travel",
            status: "pending",
            reference: ref,
            title: isLifestyleService ? `${serviceType} Request` : isJets ? `${selectedAircraft.name} · ${jetDeparture} → ${jetDestination}` : serviceType,
            payment_status: hasPremiumMembership ? "paid" : null,
            details,
        });
        setLoading(false);
        if (!error) {
            setShowSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        }
    };

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>

                {/* Hero */}
                <View style={s.hero}>
                    <Image source={activeService.img} style={s.heroImg} resizeMode="cover" />
                    <View style={s.heroScrim} />
                    <View style={s.heroTopRow}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={s.heroContent}>
                        <Text style={s.heroTitle}>{activeService.label}</Text>
                        <Text style={s.heroDesc}>{activeService.desc}</Text>
                    </View>
                </View>

                {/* Service type chips */}
                <View style={s.section}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <Text style={[s.sectionLabel, { marginBottom: 0 }]}>Select a Service</Text>
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: "/services/all-services" as any, params: { currentType: serviceType } })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={{ fontSize: 12, color: GOLD, fontWeight: "700" }}>View all</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                        {SERVICE_TYPES.map(svc => {
                            const active = serviceType === svc.id;
                            return (
                                <TouchableOpacity
                                    key={svc.id}
                                    style={[
                                        s.svcChip,
                                        active 
                                            ? { backgroundColor: "#000", borderColor: "#000" } 
                                            : { backgroundColor: GOLD, borderColor: GOLD }
                                    ]}
                                    onPress={() => setServiceType(svc.id)}
                                    activeOpacity={0.8}
                                >
                                    <Image source={svc.img} style={{ width: 20, height: 20, borderRadius: 10, opacity: active ? 1 : 0.8 }} />
                                    <Text style={[s.svcChipText, active ? { color: GOLD } : { color: "#000" }]}>{svc.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* ── FLIGHTS & JETS ── */}
                {isJets ? (
                    <>
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Aircraft Type</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                                {AIRCRAFT.map(ac => {
                                    const active = selectedAircraft.id === ac.id;
                                    return (
                                        <TouchableOpacity
                                            key={ac.id}
                                            style={[s.acCard, active && { borderColor: GOLD, backgroundColor: `${GOLD}10` }]}
                                            onPress={() => { setSelectedAircraft(ac); if (passengers > ac.capacity) setPassengers(ac.capacity); }}
                                            activeOpacity={0.8}
                                        >
                                            <Plane size={20} color={active ? GOLD : C.muted} style={{ transform: [{ rotate: "45deg" }] }} />
                                            <Text style={[s.acName, active && { color: GOLD }]}>{ac.name}</Text>
                                            <Text style={s.acDetail}>Up to {ac.capacity} pax</Text>
                                            <Text style={s.acDetail}>{ac.range}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Trip Type</Text>
                            <View style={{ flexDirection: "row", gap: 12 }}>
                                {(["oneway", "return"] as const).map(t => (
                                    <TouchableOpacity key={t} style={[s.pill, tripType === t && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setTripType(t)} activeOpacity={0.8}>
                                        <Text style={[s.pillText, tripType === t && { color: "#0a0a0a", fontWeight: "700" }]}>
                                            {t === "oneway" ? "One Way" : "Return Flight"}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Route</Text>
                            <TextInput style={s.routeInput} placeholder="Departure city or airport" placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"} value={jetDeparture} onChangeText={setJetDeparture} />
                            <View style={{ height: 10 }} />
                            <TextInput style={s.routeInput} placeholder="Destination city or airport" placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"} value={jetDestination} onChangeText={setJetDestination} />
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Schedule</Text>
                            <View style={s.dateRow}>
                                <TouchableOpacity style={[s.dateCard, depDate && { borderColor: GOLD }]} onPress={() => setShowDepDate(true)}>
                                    <Calendar size={16} color={depDate ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Date</Text><Text style={[s.dateCardValue, { color: depDate ? C.text : C.muted }]}>{fmtDate(depDate) ?? "Select date"}</Text></View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.dateCard, depTime && { borderColor: GOLD }]} onPress={() => setShowDepTime(true)}>
                                    <Calendar size={16} color={depTime ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Time</Text><Text style={[s.dateCardValue, { color: depTime ? C.text : C.muted }]}>{fmtTime(depTime) ?? "Select time"}</Text></View>
                                </TouchableOpacity>
                            </View>
                            {tripType === "return" && (
                                <TouchableOpacity style={[s.dateCard, { marginTop: 12, flex: undefined }, retDate && { borderColor: GOLD }]} onPress={() => setShowRetDate(true)}>
                                    <Calendar size={16} color={retDate ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Return Date</Text><Text style={[s.dateCardValue, { color: retDate ? C.text : C.muted }]}>{fmtDate(retDate) ?? "Select date"}</Text></View>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Passengers</Text>
                            <View style={s.stepperRow}>
                                <TouchableOpacity style={s.stepBtn} onPress={() => setPassengers(p => Math.max(1, p - 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>−</Text></TouchableOpacity>
                                <Text style={s.stepVal}>{passengers}</Text>
                                <TouchableOpacity style={s.stepBtn} onPress={() => setPassengers(p => Math.min(selectedAircraft.capacity, p + 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>+</Text></TouchableOpacity>
                                <Text style={s.stepMax}>Max {selectedAircraft.capacity}</Text>
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>In-Flight Catering</Text>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                                {[{ id: "standard", label: "Standard" }, { id: "premium", label: "Premium" }, { id: "custom", label: "Custom Menu" }].map(opt => (
                                    <TouchableOpacity key={opt.id} style={[s.pill, catering === opt.id && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setCatering(opt.id)} activeOpacity={0.8}>
                                        <Text style={[s.pillText, catering === opt.id && { color: "#0a0a0a", fontWeight: "700" }]}>{opt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                <View>
                                    <Text style={[s.sectionLabel, { marginBottom: 4 }]}>Onward Ground Transfer</Text>
                                    <Text style={{ fontSize: 12, color: C.muted }}>Arrange a chauffeur at your destination</Text>
                                </View>
                                <Switch value={groundTransfer} onValueChange={setGroundTransfer} trackColor={{ false: isDark ? "#2a2a2a" : "#e0dbd2", true: GOLD }} thumbColor="#fff" />
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Special Requests</Text>
                            <VoiceInput
                                placeholder="Dietary requirements, specific amenities, security protocols..."
                                value={specialRequests}
                                onChange={setSpecialRequests}
                                accent={GOLD}
                                textColor={C.text}
                                border={isDark ? "#2a2a2a" : "#e0dbd2"}
                                inputBg={C.surface}
                            />
                        </View>
                    </>

                ) : isStays ? (
                    /* ── STAYS & ACCOMMODATIONS ── */
                    <>
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Type of Stay</Text>
                            <View style={s.wrapRow}>
                                {STAY_TYPES.map(t => (
                                    <TouchableOpacity key={t} style={[s.chip, stayType === t && s.chipActive]} onPress={() => setStayType(t)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, stayType === t && s.chipTextActive]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Destination</Text>
                            <View style={params.prefillCity ? { opacity: 0.6 } : null} pointerEvents={params.prefillCity ? "none" : "auto"}>
                                <LocationSearch value={stayDest} onChangeText={setStayDest} placeholder="City or country..." onSelect={setStayDest} />
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Check-in & Check-out</Text>
                            <View style={s.dateRow}>
                                <TouchableOpacity style={[s.dateCard, dateFromObj && { borderColor: GOLD }]} onPress={() => setShowDateFrom(true)}>
                                    <Calendar size={16} color={dateFromObj ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Check-in</Text><Text style={[s.dateCardValue, { color: dateFromObj ? C.text : C.muted }]}>{fmtDate(dateFromObj) ?? "Select"}</Text></View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.dateCard, dateToObj && { borderColor: GOLD }]} onPress={() => setShowDateTo(true)}>
                                    <Calendar size={16} color={dateToObj ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Check-out</Text><Text style={[s.dateCardValue, { color: dateToObj ? C.text : C.muted }]}>{fmtDate(dateToObj) ?? "Select"}</Text></View>
                                </TouchableOpacity>
                            </View>
                            {isToday(dateFromObj) && (
                                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: 8 }}>
                                    ⚠️ Same-day requests are subject to concierge confirmation and may not be guaranteed.
                                </Text>
                            )}
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Number of Guests</Text>
                            <View style={s.stepperRow}>
                                <TouchableOpacity style={s.stepBtn} onPress={() => setStayGuests(g => Math.max(1, g - 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>−</Text></TouchableOpacity>
                                <Text style={s.stepVal}>{stayGuests}</Text>
                                <TouchableOpacity style={s.stepBtn} onPress={() => setStayGuests(g => Math.min(20, g + 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>+</Text></TouchableOpacity>
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Daily Budget (per night)</Text>
                            <BudgetStepper value={dailyBudget} onChange={setDailyBudget} min={20000} step={20000} label="PER NIGHT" C={C} theme={theme} />
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Recreational Activities</Text>
                            <View style={s.wrapRow}>
                                {STAY_ACTIVITIES.map(a => (
                                    <TouchableOpacity key={a} style={[s.chip, stayActivities.includes(a) && s.chipActive]} onPress={() => toggle(stayActivities, setStayActivities, a)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, stayActivities.includes(a) && s.chipTextActive]}>{a}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Must-Have Amenities</Text>
                            <View style={s.wrapRow}>
                                {STAY_AMENITIES.map(a => (
                                    <TouchableOpacity key={a} style={[s.chip, stayAmenities.includes(a) && s.chipActive]} onPress={() => toggle(stayAmenities, setStayAmenities, a)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, stayAmenities.includes(a) && s.chipTextActive]}>{a}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Additional Requests</Text>
                            <VoiceInput
                                placeholder="Room preferences, special occasions, dietary needs, anything specific..."
                                value={stayNotes}
                                onChange={setStayNotes}
                                accent={GOLD}
                                textColor={C.text}
                                border={isDark ? "#2a2a2a" : "#e0dbd2"}
                                inputBg={C.surface}
                            />
                        </View>
                    </>

                ) : isPrivateDining ? (
                    /* ── PRIVATE DINING ── */
                    <>
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Occasion</Text>
                            <View style={s.wrapRow}>
                                {DINING_OCCASIONS.map(o => (
                                    <TouchableOpacity key={o} style={[s.chip, diningOccasion === o && s.chipActive]} onPress={() => setDiningOccasion(o)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, diningOccasion === o && s.chipTextActive]}>{o}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Venue Type</Text>
                            <View style={s.wrapRow}>
                                {DINING_VENUES.map(v => (
                                    <TouchableOpacity key={v} style={[s.chip, diningVenue === v && s.chipActive]} onPress={() => setDiningVenue(v)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, diningVenue === v && s.chipTextActive]}>{v}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>City</Text>
                            <View style={s.wrapRow}>
                                {CITIES.map(c => {
                                    const isAvailable = c === "Lagos" || c === "Abuja";
                                    const displayLabel = isAvailable ? c : `${c} (Coming Soon)`;
                                    const isLocked = !!params.prefillCity && params.prefillCity.toLowerCase() !== c.toLowerCase();
                                    return (
                                        <TouchableOpacity 
                                            key={c} 
                                            disabled={isLocked || !isAvailable}
                                            style={[
                                                s.chip, 
                                                diningCity === c && s.chipActive,
                                                isLocked && { opacity: 0.25, backgroundColor: "rgba(0,0,0,0.05)", borderColor: "rgba(0,0,0,0.05)" }
                                            ]} 
                                            onPress={() => setDiningCity(c)} 
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[
                                                s.chipText, 
                                                diningCity === c && s.chipTextActive,
                                                isLocked && { color: C.muted }
                                            ]}>
                                                {displayLabel}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Date & Time</Text>
                            <View style={s.dateRow}>
                                <TouchableOpacity style={[s.dateCard, dateFromObj && { borderColor: GOLD }]} onPress={() => setShowDateFrom(true)}>
                                    <Calendar size={16} color={dateFromObj ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Date</Text><Text style={[s.dateCardValue, { color: dateFromObj ? C.text : C.muted }]}>{fmtDate(dateFromObj) ?? "Select"}</Text></View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.dateCard, eventTime && { borderColor: GOLD }]} onPress={() => setShowEventTime(true)}>
                                    <Calendar size={16} color={eventTime ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Time</Text><Text style={[s.dateCardValue, { color: eventTime ? C.text : C.muted }]}>{fmtTime(eventTime) ?? "Select"}</Text></View>
                                </TouchableOpacity>
                            </View>
                            {isToday(dateFromObj) && (
                                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: 8 }}>
                                    ⚠️ Same-day requests are subject to concierge confirmation and may not be guaranteed.
                                </Text>
                            )}
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Number of Guests</Text>
                            <View style={s.stepperRow}>
                                <TouchableOpacity style={s.stepBtn} onPress={() => setDiningGuests(g => Math.max(1, g - 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>−</Text></TouchableOpacity>
                                <Text style={s.stepVal}>{diningGuests}</Text>
                                <TouchableOpacity style={s.stepBtn} onPress={() => setDiningGuests(g => Math.min(50, g + 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>+</Text></TouchableOpacity>
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Cuisine Preference</Text>
                            <View style={s.wrapRow}>
                                {CUISINES.map(c => (
                                    <TouchableOpacity key={c} style={[s.chip, diningCuisine === c && s.chipActive]} onPress={() => setDiningCuisine(c)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, diningCuisine === c && s.chipTextActive]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Setup & Extras</Text>
                            <View style={s.wrapRow}>
                                {DINING_SETUP.map(opt => (
                                    <TouchableOpacity key={opt} style={[s.chip, diningSetup.includes(opt) && s.chipActive]} onPress={() => toggle(diningSetup, setDiningSetup, opt)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, diningSetup.includes(opt) && s.chipTextActive]}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Budget</Text>
                            <BudgetStepper value={diningBudget} onChange={setDiningBudget} min={50000} step={50000} C={C} theme={theme} />
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Special Requests</Text>
                            <VoiceInput
                                placeholder="Dietary requirements, allergies, dress code, surprise elements..."
                                value={diningNotes}
                                onChange={setDiningNotes}
                                accent={GOLD}
                                textColor={C.text}
                                border={isDark ? "#2a2a2a" : "#e0dbd2"}
                                inputBg={C.surface}
                            />
                        </View>
                    </>

                ) : isVIPProtocol ? (
                    /* ── VIP PROTOCOL ── */
                    <>
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Service Type</Text>
                            <View style={s.wrapRow}>
                                {PROTOCOL_TYPES.map(t => (
                                    <TouchableOpacity key={t} style={[s.chip, protocolType === t && s.chipActive]} onPress={() => setProtocolType(t)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, protocolType === t && s.chipTextActive]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>City</Text>
                            <View style={s.wrapRow}>
                                {CITIES.map(c => {
                                    const isAvailable = c === "Lagos" || c === "Abuja";
                                    const displayLabel = isAvailable ? c : `${c} (Coming Soon)`;
                                    const isLocked = !!params.prefillCity && params.prefillCity.toLowerCase() !== c.toLowerCase();
                                    return (
                                        <TouchableOpacity 
                                            key={c} 
                                            disabled={isLocked || !isAvailable}
                                            style={[
                                                s.chip, 
                                                protocolCity === c && s.chipActive,
                                                isLocked && { opacity: 0.25, backgroundColor: "rgba(0,0,0,0.05)", borderColor: "rgba(0,0,0,0.05)" }
                                            ]} 
                                            onPress={() => setProtocolCity(c)} 
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[
                                                s.chipText, 
                                                protocolCity === c && s.chipTextActive,
                                                isLocked && { color: C.muted }
                                            ]}>
                                                {displayLabel}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Date & Time</Text>
                            <View style={s.dateRow}>
                                <TouchableOpacity style={[s.dateCard, dateFromObj && { borderColor: GOLD }]} onPress={() => setShowDateFrom(true)}>
                                    <Calendar size={16} color={dateFromObj ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Date</Text><Text style={[s.dateCardValue, { color: dateFromObj ? C.text : C.muted }]}>{fmtDate(dateFromObj) ?? "Select"}</Text></View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.dateCard, eventTime && { borderColor: GOLD }]} onPress={() => setShowEventTime(true)}>
                                    <Calendar size={16} color={eventTime ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Time</Text><Text style={[s.dateCardValue, { color: eventTime ? C.text : C.muted }]}>{fmtTime(eventTime) ?? "Select"}</Text></View>
                                </TouchableOpacity>
                            </View>
                            {isToday(dateFromObj) && (
                                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: 8 }}>
                                    ⚠️ Same-day requests are subject to concierge confirmation and may not be guaranteed.
                                </Text>
                            )}
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Number of Persons</Text>
                            <View style={s.stepperRow}>
                                <TouchableOpacity style={s.stepBtn} onPress={() => setProtocolPersons(p => Math.max(1, p - 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>−</Text></TouchableOpacity>
                                <Text style={s.stepVal}>{protocolPersons}</Text>
                                <TouchableOpacity style={s.stepBtn} onPress={() => setProtocolPersons(p => Math.min(20, p + 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>+</Text></TouchableOpacity>
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Specific Requirements</Text>
                            <VoiceInput
                                placeholder="Security clearance level, VIP names, flight details, event name, any special protocols..."
                                value={protocolReqs}
                                onChange={setProtocolReqs}
                                accent={GOLD}
                                textColor={C.text}
                                border={isDark ? "#2a2a2a" : "#e0dbd2"}
                                inputBg={C.surface}
                            />
                        </View>
                    </>

                ) : isLifestyleService ? (
                    /* ── LIFESTYLE SERVICES GENERAL FORM ── */
                    <>
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>City / Location</Text>
                            <LocationSearch
                                value={destination}
                                onChangeText={setDestination}
                                placeholder="Search and select location..."
                            />
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>When is this needed?</Text>
                            <TouchableOpacity
                                style={[s.dateCard, dateFromObj && { borderColor: GOLD }]}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDateFrom(true); }}
                            >
                                <Calendar size={16} color={dateFromObj ? GOLD : C.muted} />
                                <View>
                                    <Text style={s.dateCardLabel}>Date</Text>
                                    <Text style={[s.dateCardValue, { color: dateFromObj ? C.text : C.muted }]}>
                                        {fmtDate(dateFromObj) ?? "Select Date"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {isToday(dateFromObj) && (
                                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: 8 }}>
                                    ⚠️ Same-day requests are subject to concierge confirmation and may not be guaranteed.
                                </Text>
                            )}
                        </View>

                        {serviceType === "Gift & Florals" ? (
                            /* ── GIFT & FLORALS INLINE ── */
                            <>
                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>What is the Occasion?</Text>
                                    <View style={s.wrapRow}>
                                        {[
                                            "Birthday", "Anniversary", "Mother's Day", "Father's Day", 
                                            "Valentine's", "Sympathy", "Celebration", "Corporate Gift", 
                                            "Just Because", "Other"
                                        ].map(occ => (
                                            <TouchableOpacity
                                                key={occ}
                                                style={[s.chip, giftOccasion === occ && s.chipActive]}
                                                onPress={() => setGiftOccasion(occ)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[s.chipText, giftOccasion === occ && s.chipTextActive]}>{occ}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Type of Gift</Text>
                                    <View style={s.wrapRow}>
                                        {[
                                            "Fresh Flowers", "Floral Arrangement", "Luxury Hamper", 
                                            "Personalised Gift", "Gift Basket", "Cake & Flowers", 
                                            "Custom Package"
                                        ].map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[s.chip, giftType === g && s.chipActive]}
                                                onPress={() => setGiftType(g)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[s.chipText, giftType === g && s.chipTextActive]}>{g}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Who is it for?</Text>
                                    <TextInput
                                        style={s.textInput}
                                        placeholder="e.g. My mum, Sarah, a business partner..."
                                        placeholderTextColor={C.muted}
                                        value={giftRecipient}
                                        onChangeText={setGiftRecipient}
                                    />
                                </View>

                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Personal Message (optional)</Text>
                                    <TextInput
                                        style={s.textInput}
                                        placeholder="Message to include on the gift card..."
                                        placeholderTextColor={C.muted}
                                        value={giftMessage}
                                        onChangeText={setGiftMessage}
                                        multiline
                                    />
                                </View>

                                {/* Interactive Calligraphic Greeting Card Preview */}
                                {(giftMessage.trim().length > 0 || giftRecipient.trim().length > 0) && (
                                    <View style={s.section}>
                                        <Text style={s.sectionLabel}>Gift Card Preview</Text>
                                        <View style={s.greetingCardBox}>
                                            <LinearGradient
                                                colors={isDark ? ["#1c1c1f", "#121214"] : ["#faf8f5", "#f5f0e6"]}
                                                style={StyleSheet.absoluteFillObject}
                                            />
                                            <View style={s.greetingCardInner}>
                                                <Text style={s.greetingCardTitle}>LAPEQ GREETING CARD</Text>
                                                <View style={s.greetingCardContent}>
                                                    <Text style={s.greetingRecipient}>
                                                        To: {giftRecipient.trim() ? giftRecipient : "_________________"}
                                                    </Text>
                                                    <Text style={s.greetingMessage}>
                                                        "{giftMessage.trim() ? giftMessage : "Your message here..."}"
                                                    </Text>
                                                    <Text style={s.greetingSender}>
                                                        With warm regards,
                                                    </Text>
                                                    <Text style={s.greetingSenderName}>
                                                        Lapeq Member
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </>

                        ) : serviceType === "Recreational Activities" ? (
                            /* ── RECREATION INLINE ── */
                            <>
                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Choose an Activity</Text>
                                    <View style={s.wrapRow}>
                                        {[
                                            "Golf", "Tennis", "Swimming", "Water Sports", "Hiking",
                                            "Horse Riding", "Skydiving", "Boat Cruise", "Cycling",
                                            "Spa Day", "Clay Shooting", "Other"
                                        ].map(act => (
                                            <TouchableOpacity
                                                key={act}
                                                style={[s.chip, recreationActivity === act && s.chipActive]}
                                                onPress={() => setRecreationActivity(act)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[s.chipText, recreationActivity === act && s.chipTextActive]}>{act}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Experience Level</Text>
                                    <View style={s.wrapRow}>
                                        {["First Time", "Beginner", "Intermediate", "Advanced"].map(l => (
                                            <TouchableOpacity
                                                key={l}
                                                style={[s.chip, recreationLevel === l && s.chipActive]}
                                                onPress={() => setRecreationLevel(l)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[s.chipText, recreationLevel === l && s.chipTextActive]}>{l}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Group Size</Text>
                                    <View style={s.stepperRow}>
                                        <TouchableOpacity style={s.stepBtn} onPress={() => setRecreationGroupSize(g => Math.max(1, g - 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>−</Text></TouchableOpacity>
                                        <Text style={s.stepVal}>{recreationGroupSize}</Text>
                                        <TouchableOpacity style={s.stepBtn} onPress={() => setRecreationGroupSize(g => Math.min(20, g + 1))} activeOpacity={0.8}><Text style={s.stepBtnText}>+</Text></TouchableOpacity>
                                        <Text style={s.stepLabel}>{recreationGroupSize === 1 ? "Solo" : `${recreationGroupSize} people`}</Text>
                                    </View>
                                </View>
                            </>

                        ) : serviceType === "Medical Concierge" ? (
                            /* ── MEDICAL INLINE ── */
                            <>
                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Type of Care</Text>
                                    <View style={s.wrapRow}>
                                        {[
                                            "GP Appointment", "Specialist Referral", "Full Health Check", 
                                            "Mental Health", "Dental", "Eye Care", 
                                            "Medical Tourism", "Emergency Abroad", "Other"
                                        ].map(c => (
                                            <TouchableOpacity
                                                key={c}
                                                style={[s.chip, medicalCareType === c && s.chipActive]}
                                                onPress={() => setMedicalCareType(c)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[s.chipText, medicalCareType === c && s.chipTextActive]}>{c}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Priority / Urgency</Text>
                                    <View style={s.urgencyContainer}>
                                        {[
                                            { key: "Flexible", label: "Flexible", desc: "Routine checks & non-urgent bookings" },
                                            { key: "This Week", label: "This Week", desc: "For appointments needed within 7 days" },
                                            { key: "Today / Urgent", label: "Today / Urgent", desc: "Time-critical and immediate medical needs" }
                                        ].map(u => {
                                            const isSelected = medicalUrgency === u.key;
                                            let borderClr = theme === "dark" ? "#2a2a2a" : "#e0dbd2";
                                            let bgClr = C.background;
                                            if (isSelected) {
                                                borderClr = u.key === "Flexible" ? "#10b981" : u.key === "This Week" ? GOLD : "#ef4444";
                                                bgClr = u.key === "Flexible" ? "rgba(16, 185, 129, 0.08)" : u.key === "This Week" ? "rgba(201, 168, 76, 0.08)" : "rgba(239, 68, 68, 0.08)";
                                            }
                                            return (
                                                <TouchableOpacity
                                                    key={u.key}
                                                    style={[
                                                        s.urgencyCard,
                                                        { borderColor: borderClr, backgroundColor: bgClr }
                                                    ]}
                                                    onPress={() => setMedicalUrgency(u.key)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={[s.urgencyLabel, isSelected && { color: GOLD, fontWeight: "700" }]}>{u.label}</Text>
                                                    <Text style={s.urgencyDesc}>{u.desc}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </>

                        ) : serviceType === "Financial Advisory" ? (
                            /* ── FINANCE INLINE ── */
                            <>
                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Type of Advisory Goal</Text>
                                    <View style={s.wrapRow}>
                                        {[
                                            "Grow my wealth", "Reduce my tax", "Plan for retirement", 
                                            "Fund a business", "Protect my assets", "Invest abroad", "Other"
                                        ].map(goal => (
                                            <TouchableOpacity
                                                key={goal}
                                                style={[s.chip, financeGoal === goal && s.chipActive]}
                                                onPress={() => setFinanceGoal(goal)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[s.chipText, financeGoal === goal && s.chipTextActive]}>{goal}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Investment Strategy</Text>
                                    <View style={s.strategyContainer}>
                                        {[
                                            { key: "Preservation", label: "Capital Preservation", desc: "Low risk tolerance. Focus on protecting existing capital & steady assets" },
                                            { key: "Balanced", label: "Balanced Growth", desc: "Medium risk tolerance. Core mix of growth equities & steady yields" },
                                            { key: "Venture", label: "High-Yield Venture", desc: "High risk tolerance. Focus on tech startups, private equity & global markets" }
                                        ].map(strat => {
                                            const isSelected = financeStrategy === strat.key;
                                            return (
                                                <TouchableOpacity
                                                    key={strat.key}
                                                    style={[
                                                        s.strategyCard,
                                                        isSelected && { borderColor: GOLD, backgroundColor: "rgba(201, 168, 76, 0.08)" }
                                                    ]}
                                                    onPress={() => setFinanceStrategy(strat.key)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={[s.strategyLabel, isSelected && { color: GOLD, fontWeight: "700" }]}>{strat.label}</Text>
                                                    <Text style={s.strategyDesc}>{strat.desc}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </>

                        ) : serviceType === "Legal Advisory" ? (
                            /* ── LEGAL INLINE ── */
                            <>
                                <View style={s.section}>
                                    <Text style={s.sectionLabel}>Area of Law</Text>
                                    <View style={s.wrapRow}>
                                        {[
                                            "Business Law", "Property Law", "Family Law", "Employment", 
                                            "Contract Review", "Criminal Law", "Immigration", "Other"
                                        ].map(m => (
                                            <TouchableOpacity
                                                key={m}
                                                style={[s.chip, legalMatterType === m && s.chipActive]}
                                                onPress={() => setLegalMatterType(m)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[s.chipText, legalMatterType === m && s.chipTextActive]}>{m}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Encryption Confidentiality Banner */}
                                <View style={s.lockBanner}>
                                    <Lock size={14} color={GOLD} />
                                    <Text style={s.lockBannerText}>NDA Protection Active • Encrypted Client Briefing Channel</Text>
                                </View>
                            </>
                        ) : null}

                        {/* Fallback budget step for non-special services */}
                        {serviceType !== "Gift & Florals" && serviceType !== "Recreational Activities" && serviceType !== "Medical Concierge" && serviceType !== "Financial Advisory" && (
                            <View style={s.section}>
                                <Text style={s.sectionLabel}>Budget Limit</Text>
                                <BudgetStepper value={curatedBudget} onChange={setCuratedBudget} min={10000} step={10000} C={C} theme={theme} />
                            </View>
                        )}

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>
                                {serviceType === "Legal Advisory" ? "Brief your Case" : "Describe Your Request"}
                            </Text>
                            <Text style={s.sectionSub}>Please describe what you need in detail for your concierge team to curate it.</Text>
                            <VoiceInput
                                placeholder={serviceType === "Legal Advisory" ? "Describe your legal situation in strict confidentiality..." : "e.g., specific requirements, brands, details..."}
                                value={preferences}
                                onChange={setPreferences}
                                accent={GOLD}
                                textColor={serviceType === "Legal Advisory" && !isDark ? "#1a1a1a" : C.text}
                                border={serviceType === "Legal Advisory" ? GOLD : (isDark ? "#2a2a2a" : "#e0dbd2")}
                                inputBg={serviceType === "Legal Advisory" ? (isDark ? "#201d14" : "#fffdeb") : C.surface}
                            />
                        </View>
                    </>
                ) : (
                    /* ── CURATED ITINERARY ── */
                    <>
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Trip Mood</Text>
                            <View style={s.wrapRow}>
                                {MOODS.map(m => (
                                    <TouchableOpacity key={m} style={[s.chip, mood === m && s.chipActive]} onPress={() => setMood(mood === m ? "" : m)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, mood === m && s.chipTextActive]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Destination</Text>
                            <View style={params.prefillCity ? { opacity: 0.6 } : null} pointerEvents={params.prefillCity ? "none" : "auto"}>
                                <LocationSearch value={destination} onChangeText={setDestination} placeholder="City, country, or let us suggest..." onSelect={setDestination} />
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>When?</Text>
                            <View style={s.dateRow}>
                                <TouchableOpacity style={[s.dateCard, dateFromObj && { borderColor: GOLD }]} onPress={() => setShowDateFrom(true)}>
                                    <Calendar size={16} color={dateFromObj ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Departure</Text><Text style={[s.dateCardValue, { color: dateFromObj ? C.text : C.muted }]}>{fmtDate(dateFromObj) ?? "Select date"}</Text></View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.dateCard, dateToObj && { borderColor: GOLD }]} onPress={() => setShowDateTo(true)}>
                                    <Calendar size={16} color={dateToObj ? GOLD : C.muted} />
                                    <View><Text style={s.dateCardLabel}>Return</Text><Text style={[s.dateCardValue, { color: dateToObj ? C.text : C.muted }]}>{fmtDate(dateToObj) ?? "Select date"}</Text></View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Budget</Text>
                            <BudgetStepper value={curatedBudget} onChange={setCuratedBudget} min={50000} step={50000} C={C} theme={theme} />
                        </View>

                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Tell us everything</Text>
                            <Text style={s.sectionSub}>Specific aesthetics, special occasions, or the exact vibe you're after.</Text>
                            <VoiceInput
                                placeholder="e.g., I want a secluded villa with a private chef for a 10-year anniversary..."
                                value={preferences}
                                onChange={setPreferences}
                                accent={GOLD}
                                textColor={C.text}
                                border={isDark ? "#2a2a2a" : "#e0dbd2"}
                                inputBg={C.surface}
                            />
                        </View>
                    </>
                )}

                {/* Fee card */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
                    {userTier && ["silver", "gold", "black"].includes(userTier.toLowerCase()) ? (
                        <View style={[s.feeCard, { borderColor: "rgba(76,175,80,0.3)", backgroundColor: "rgba(76,175,80,0.05)" }]}>
                            <Text style={[s.feeEyebrow, { color: "#4caf50" }]}>MEMBERSHIP BENEFIT</Text>
                            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                                <Text style={[s.feeAmount, { color: "#4caf50" }]}>₦0</Text>
                                <Text style={[s.feeNote, { color: C.muted }]}>Included in Tier</Text>
                            </View>
                            <Text style={s.feeSub}>Your Lapeq premium membership covers all request and orchestration fees.</Text>
                        </View>
                    ) : (
                        <View style={s.feeCard}>
                            <Text style={s.feeEyebrow}>SERVICE FEE</Text>
                            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                                <Text style={s.feeAmount}>₦5,000</Text>
                                <Text style={s.feeNote}>per request</Text>
                            </View>
                            <Text style={s.feeSub}>Collected upon confirmation of your request.</Text>
                        </View>
                    )}
                </View>

                {isFreeUser && (
                    <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
                        <Text style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
                            Community Plan · {monthlyRequestsCount}/5 monthly requests used
                        </Text>
                    </View>
                )}

                {/* Submit */}
                <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
                    {limitReached ? (
                        <View style={{ borderRadius: 18, padding: 24, alignItems: "center", gap: 10, borderWidth: 1, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` }}>
                            <Text style={{ fontSize: 15, fontWeight: "800", color: GOLD, letterSpacing: -0.2 }}>Monthly Limit Reached</Text>
                            <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 }}>
                                You've used all 5 of your monthly concierge requests. Upgrade to Lapeq Premium for unlimited access.
                            </Text>
                            <TouchableOpacity
                                style={{ marginTop: 6, backgroundColor: GOLD, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
                                onPress={() => router.push("/(main)/membership" as any)}
                                activeOpacity={0.85}
                            >
                                <Text style={{ color: "#0a0a0a", fontSize: 14, fontWeight: "800" }}>Upgrade to Premium</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                            <Text style={s.submitText}>{loading ? "Orchestrating..." : "Submit Inquiry"}</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>

            {/* Success Modal */}
            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIcon, { backgroundColor: `${GOLD}18` }]}>
                            <Check size={28} color={GOLD} strokeWidth={2} />
                        </View>
                        <Text style={s.modalTitle}>{isJets ? "Enquiry Received" : "Inquiry Received"}</Text>
                        <Text style={s.modalBody}>
                            {isJets ? "A Lapeq aviation advisor will respond within 2 hours." : "Your private luxury advisor has been notified and will curate the perfect options for your journey."}
                        </Text>
                        <TouchableOpacity style={s.modalBtnPri} onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}>
                            <Text style={s.modalBtnTxPri}>View Request</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSec} onPress={() => { setShowSuccess(false); router.back(); }}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* General date pickers (Android) */}
            {Platform.OS === "android" && showDateFrom && (
                <DateTimePicker value={dateFromObj ?? new Date()} mode="date" display="default" minimumDate={startOfToday} onChange={(_, d) => { setShowDateFrom(false); if (d) setDateFromObj(d); }} />
            )}
            {Platform.OS === "android" && showDateTo && (
                <DateTimePicker value={dateToObj ?? dateFromObj ?? new Date()} mode="date" display="default" minimumDate={dateFromObj ?? startOfToday} onChange={(_, d) => { setShowDateTo(false); if (d) setDateToObj(d); }} />
            )}
            {Platform.OS === "android" && showEventTime && (
                <DateTimePicker value={eventTime ?? new Date()} mode="time" display="default" onChange={(_, d) => { setShowEventTime(false); if (d) setEventTime(d); }} />
            )}

            {/* General date pickers (iOS) */}
            <Modal visible={Platform.OS === "ios" && showDateFrom} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDateFrom(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDateFrom(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>{isStays ? "Check-in" : "Date"}</Text>
                            <TouchableOpacity onPress={() => setShowDateFrom(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={dateFromObj ?? new Date()} mode="date" display="spinner" minimumDate={startOfToday} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDateFromObj(d); }} />
                    </View>
                </View>
            </Modal>
            <Modal visible={Platform.OS === "ios" && showDateTo} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDateTo(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDateTo(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>{isStays ? "Check-out" : "Return"}</Text>
                            <TouchableOpacity onPress={() => setShowDateTo(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={dateToObj ?? dateFromObj ?? new Date()} mode="date" display="spinner" minimumDate={dateFromObj ?? startOfToday} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDateToObj(d); }} />
                    </View>
                </View>
            </Modal>
            <Modal visible={Platform.OS === "ios" && showEventTime} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowEventTime(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowEventTime(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Time</Text>
                            <TouchableOpacity onPress={() => setShowEventTime(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={eventTime ?? new Date()} mode="time" display="spinner" themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setEventTime(d); }} />
                    </View>
                </View>
            </Modal>

            {/* Jets date/time pickers (Android) */}
            {Platform.OS === "android" && showDepDate && (
                <DateTimePicker value={depDate ?? new Date()} mode="date" display="default" minimumDate={startOfToday} onChange={(_, d) => { setShowDepDate(false); if (d) setDepDate(d); }} />
            )}
            {Platform.OS === "android" && showRetDate && (
                <DateTimePicker value={retDate ?? depDate ?? new Date()} mode="date" display="default" minimumDate={depDate ?? startOfToday} onChange={(_, d) => { setShowRetDate(false); if (d) setRetDate(d); }} />
            )}
            {Platform.OS === "android" && showDepTime && (
                <DateTimePicker value={depTime ?? new Date()} mode="time" display="default" onChange={(_, d) => { setShowDepTime(false); if (d) setDepTime(d); }} />
            )}


            {/* Jets date/time pickers (iOS) */}
            <Modal visible={Platform.OS === "ios" && showDepDate} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDepDate(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDepDate(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Departure Date</Text>
                            <TouchableOpacity onPress={() => setShowDepDate(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={depDate ?? new Date()} mode="date" display="spinner" minimumDate={startOfToday} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDepDate(d); }} />
                    </View>
                </View>
            </Modal>
            <Modal visible={Platform.OS === "ios" && showRetDate} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowRetDate(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowRetDate(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Return Date</Text>
                            <TouchableOpacity onPress={() => setShowRetDate(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={retDate ?? depDate ?? new Date()} mode="date" display="spinner" minimumDate={depDate ?? startOfToday} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setRetDate(d); }} />
                    </View>
                </View>
            </Modal>
            <Modal visible={Platform.OS === "ios" && showDepTime} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDepTime(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDepTime(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Departure Time</Text>
                            <TouchableOpacity onPress={() => setShowDepTime(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={depTime ?? new Date()} mode="time" display="spinner" themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDepTime(d); }} />
                    </View>
                </View>
            </Modal>
            <Modal visible={Platform.OS === "ios" && showRetDate} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowRetDate(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowRetDate(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Return Date</Text>
                            <TouchableOpacity onPress={() => setShowRetDate(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={retDate ?? depDate ?? new Date()} mode="date" display="spinner" minimumDate={depDate ?? new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setRetDate(d); }} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },

    hero: { height: 320, position: "relative" },
    heroImg: { width: "100%", height: "100%", position: "absolute" },
    heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.52)" },
    heroTopRow: { position: "absolute", top: 16, left: 20, right: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
    heroContent: { position: "absolute", bottom: 28, left: 24, right: 24 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: -0.5, marginBottom: 6 },
    heroDesc: { fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 20 },

    section: { paddingHorizontal: 24, paddingTop: 28 },
    sectionLabel: { fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 },
    sectionSub: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 12 },

    svcChip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    svcChipEmoji: { fontSize: 14, color: C.muted },
    svcChipText: { fontSize: 13, fontWeight: "600", color: C.muted },

    wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    chipActive: { backgroundColor: GOLD, borderColor: GOLD },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    chipTextActive: { color: "#0a0a0a", fontWeight: "700" },

    dateRow: { flexDirection: "row", gap: 12 },
    dateCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    dateCardLabel: { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 },
    dateCardValue: { fontSize: 13, fontWeight: "600" },

    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 18, fontSize: 15, color: C.text, minHeight: 140, lineHeight: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },

    feeCard: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` },
    feeEyebrow: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 6 },
    feeAmount: { fontSize: 22, fontWeight: "800", color: GOLD },
    feeNote: { fontSize: 13, color: C.muted, fontWeight: "600" },
    feeSub: { fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 16 },

    submitBtn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    submitText: { color: "#0a0a0a", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },

    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center" },
    modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 24 },
    modalTitle: { color: C.text, fontSize: 24, fontWeight: "800", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: GOLD, alignItems: "center", marginBottom: 12 },
    modalBtnTxPri: { color: "#0a0a0a", fontSize: 15, fontWeight: "700" },
    modalBtnSec: { width: "100%", paddingVertical: 14, alignItems: "center" },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },

    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },

    routeInput: { backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },

    acCard: { width: 148, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, gap: 6 },
    acName: { fontSize: 13, fontWeight: "700", color: C.text },
    acDetail: { fontSize: 11, color: C.muted },

    pill: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center" },
    pillText: { fontSize: 13, fontWeight: "600", color: C.muted },

    stepperRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    stepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    stepBtnText: { fontSize: 20, color: C.text, lineHeight: 24 },
    stepVal: { fontSize: 24, fontWeight: "700", color: C.text, minWidth: 36, textAlign: "center" },
    stepMax: { fontSize: 12, color: C.muted, marginLeft: 4 },

    // Custom request forms inline styles
    textInput: { backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    greetingCardBox: {
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: GOLD,
        padding: 24,
        overflow: "hidden",
        position: "relative",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        marginTop: 14,
    },
    greetingCardInner: {
        alignItems: "center",
    },
    greetingCardTitle: {
        fontSize: 10,
        fontWeight: "800",
        color: GOLD,
        letterSpacing: 3,
        marginBottom: 20,
    },
    greetingCardContent: {
        width: "100%",
        gap: 14,
    },
    greetingRecipient: {
        fontSize: 14,
        fontWeight: "700",
        color: C.text,
        fontFamily: "PlayfairDisplay_700Bold",
    },
    greetingMessage: {
        fontSize: 15,
        color: C.text,
        lineHeight: 24,
        fontFamily: "PlayfairDisplay_400Regular_Italic",
        marginVertical: 6,
    },
    greetingSender: {
        fontSize: 12,
        color: C.muted,
        marginTop: 10,
        fontStyle: "italic",
    },
    greetingSenderName: {
        fontSize: 14,
        fontWeight: "700",
        color: GOLD,
        fontFamily: "PlayfairDisplay_700Bold",
    },

    stepLabel: { fontSize: 13, color: C.muted, fontWeight: "600", marginLeft: 8 },
    silhouetteRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12, backgroundColor: theme === "dark" ? "#111" : "#f7f3eb", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    silhouetteText: { fontSize: 16 },
    silhouetteExtraText: { fontSize: 12, color: C.muted, fontWeight: "600", marginLeft: 6 },

    urgencyContainer: { gap: 10 },
    urgencyCard: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 4 },
    urgencyLabel: { fontSize: 14, fontWeight: "600", color: C.text },
    urgencyDesc: { fontSize: 11, color: C.muted, lineHeight: 15 },

    strategyContainer: { gap: 10 },
    strategyCard: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, gap: 4 },
    strategyLabel: { fontSize: 14, fontWeight: "600", color: C.text },
    strategyDesc: { fontSize: 11, color: C.muted, lineHeight: 15 },

    lockBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(201, 168, 76, 0.1)", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderTopWidth: 1, borderColor: "rgba(201, 168, 76, 0.15)", marginTop: 20 },
    lockBannerText: { fontSize: 11, fontWeight: "700", color: GOLD, letterSpacing: 0.5 },
});
