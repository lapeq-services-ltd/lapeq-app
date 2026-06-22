import { useState, useMemo, useRef, useEffect } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, Image,
    Modal, StyleSheet, Dimensions, Linking, TextInput, Alert, Platform,
    KeyboardAvoidingView, ActivityIndicator, Animated, Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, Clock, X, Globe, ChevronRight, Shirt, Sparkles, Car, LayoutGrid, Search, Ticket, CheckCircle2, Phone, User, MessageSquare, ChevronDown, SlidersHorizontal, Check } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import QRCode from "react-native-qrcode-svg";
import VoiceInput from "@/components/VoiceInput";

const { width: SW } = Dimensions.get("window");
const GOLD = "#c9a84c";

type Event = {
    id: string;
    image: any;
    organizer: string;
    title: string;
    categories: string[];
    date: string;
    time: string;
    venue: string;
    venueDetail: string;
    dressCode: string;
    website: string;
    instagram?: string | null;
    email?: string;
    speakers: { name: string; role: string }[];
    sponsors: string[];
    teams?: string[];
    confirmed_count?: number;
    description?: string;
    subtitle?: string;
    ticketUrl?: string;
    registerUrl?: string;
    qrUrl?: string;
    highlights?: string[];
    admission?: string;
    ticketLink?: string;
};

// ─── Custom Instagram icon ────────────────────────────────────────────────────
function IgIcon({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
    return (
        <View style={{ width: size, height: size, borderRadius: size * 0.28, borderWidth: 1.8, borderColor: color, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: size * 0.44, height: size * 0.44, borderRadius: size * 0.22, borderWidth: 1.8, borderColor: color }} />
            <View style={{ position: "absolute", top: size * 0.13, right: size * 0.13, width: size * 0.14, height: size * 0.14, borderRadius: size * 0.07, backgroundColor: color }} />
        </View>
    );
}

// ─── Speaker bubble ───────────────────────────────────────────────────────────
function SpeakerBubble({ name, role, C }: { name: string; role: string; C: any }) {
    const initials = name.replace(/Dr\.?\s|Rt\.\s?Hon\.\s?|Hon\.\s?|Brig\.\s?Gen\.\s?|Arch\.\s?/g, "").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
    const firstName = name.replace(/Dr\.?\s|Rt\.\s?Hon\.\s?|Hon\.\s?|Brig\.\s?Gen\.\s?|Arch\.\s?/g, "").split(" ")[0];
    return (
        <View style={{ alignItems: "center", width: 72, marginRight: 14 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${GOLD}20`, borderWidth: 1.5, borderColor: `${GOLD}50`, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                <Text style={{ fontSize: 15, fontFamily: "Jost_700Bold", color: GOLD }}>{initials}</Text>
            </View>
            <Text style={{ fontSize: 10, fontFamily: "Jost_600SemiBold", color: C.text, textAlign: "center" }} numberOfLines={1}>{firstName}</Text>
        </View>
    );
}

// ─── Event service options with updated premium colors and visual style ───
const EVENT_SERVICES = [
    { id: "personal-stylist", label: "Personal Stylist",  sub: "Dressed for the room", Icon: Shirt,      color: "#c9a84c" },
    { id: "private-chauffeur", label: "Private Chauffeur", sub: "Arrive in comfort",    Icon: Car,        color: "#4e9a74" },
    { id: "full-concierge", label: "Full Concierge",    sub: "We handle everything", Icon: LayoutGrid, color: "#a568b8" },
];

// ─── Elegant service booking form with event context ──────────────────────────
function EventRequestModal({
    visible, onClose, initialEventTitle, initialEventDate, initialServiceId, C, theme, eventsList,
}: {
    visible: boolean; onClose: () => void;
    initialEventTitle: string; initialEventDate: string;
    initialServiceId: string | null;
    C: any; theme: string;
    eventsList: any[];
}) {
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const isDark = theme === "dark";
    const bg      = isDark ? "#0d0d0d" : "#f7f3ec";
    const surface = isDark ? "#161616" : "#ffffff";
    const border  = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    const [selectedService, setSelectedService] = useState<string | null>(initialServiceId);
    const [selectedEventTitle, setSelectedEventTitle] = useState(initialEventTitle);
    const [selectedEventDate, setSelectedEventDate] = useState(initialEventDate);
    const [showEventPicker, setShowEventPicker] = useState(false);
    const [gender, setGender]     = useState<"lady" | "gentleman">("lady");
    const [notes, setNotes]       = useState("");
    const [shirtSize, setShirtSize] = useState<string | null>(null);
    const [trouserSize, setTrouserSize] = useState<string | null>(null);
    const [shoeSize, setShoeSize] = useState<string | null>(null);
    const [guests, setGuests] = useState<string>("1");
    const [vehiclePref, setVehiclePref] = useState<string>("Luxury Sedan");
    const [loading, setLoading]   = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError]       = useState("");
    const successAnim = useRef(new Animated.Value(0)).current;

    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => setKeyboardHeight(0)
        );
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    // Keep form state in sync when modal re-opens
    useEffect(() => {
        if (visible) {
            setSelectedService(initialServiceId);
            setSelectedEventTitle(initialEventTitle);
            setSelectedEventDate(initialEventDate);
            setNotes("");
            setShirtSize(null); setTrouserSize(null); setShoeSize(null);
            setGuests("1"); setVehiclePref("Luxury Sedan");
            setError(""); setSubmitted(false);
            successAnim.setValue(0);
            setGender("lady");
        }
    }, [visible, initialEventTitle, initialServiceId]);

    const handleServiceSelect = (id: string) => {
        setSelectedService(id);
        if (id === "personal-stylist") {
            setGender("lady");
        }
    };

    const handleSubmit = async () => {
        if (!selectedService) { setError("Please select a service option."); return; }
        
        const isStyling = selectedService === "personal-stylist" || selectedService === "full-concierge";
        const isChauffeur = selectedService === "private-chauffeur" || selectedService === "full-concierge";

        if ((selectedService === "personal-stylist") && (!shirtSize || !trouserSize || !shoeSize)) {
            setError(`Please select all fitting sizes (${gender === "gentleman" ? "Shirt, Waist, Shoe" : "Dress, Waist, Shoe"}).`);
            return;
        }

        setError("");
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const ref = "EVT-" + Date.now().toString(36).toUpperCase().slice(-6);
            const service = EVENT_SERVICES.find(s => s.id === selectedService);

            await supabase.from("requests").insert({
                user_id: user?.id,
                service_type: "event-service",
                status: "pending",
                reference: ref,
                details: {
                    serviceId: selectedService,
                    serviceLabel: service?.label,
                    eventTitle: selectedEventTitle,
                    eventDate: selectedEventDate,
                    notes: notes.trim(),
                    gender: isStyling ? gender : null,
                    sizes: isStyling ? { shirtSize, trouserSize, shoeSize } : null,
                    chauffeurPrefs: isChauffeur ? { guests, vehiclePref } : null,
                },
            });
            setSubmitted(true);
            Animated.spring(successAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }).start();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEvent = (title: string, date: string) => {
        setSelectedEventTitle(title);
        setSelectedEventDate(date);
        setShowEventPicker(false);
    };

    // Find the currently selected event to display its thumbnail
    const currentEventObj = eventsList.find(e => e.title.replace("\n", " ") === selectedEventTitle);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: bg }} keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}>
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: border }}>
                        <View>
                            <Text style={{ fontSize: 9, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2.5, marginBottom: 2 }}>LAPEQ · SERVICE REQUEST</Text>
                            <Text style={{ fontSize: 20, fontFamily: "PlayfairDisplay_700Bold", color: C.text }}>Event Experience Form</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: border, alignItems: "center", justifyContent: "center" }}>
                            <X size={16} color={C.muted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 20, paddingBottom: keyboardHeight > 0 ? keyboardHeight + 60 : 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {submitted ? (
                            // ── Success state ──
                            <Animated.View style={{ alignItems: "center", paddingVertical: 48, opacity: successAnim, transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
                                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: `${GOLD}20`, borderWidth: 2, borderColor: GOLD, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                                    <CheckCircle2 size={34} color={GOLD} />
                                </View>
                                <Text style={{ fontSize: 22, fontFamily: "PlayfairDisplay_700Bold", color: C.text, marginBottom: 10 }}>Request Received</Text>
                                <Text style={{ fontSize: 14, fontFamily: "Jost_400Regular", color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 8 }}>
                                    Your request for {EVENT_SERVICES.find(s => s.id === selectedService)?.label} at
                                </Text>
                                <Text style={{ fontSize: 14, fontFamily: "Jost_700Bold", color: GOLD, textAlign: "center", marginBottom: 8 }}>
                                    {selectedEventTitle}
                                </Text>
                                <Text style={{ fontSize: 13, fontFamily: "Jost_400Regular", color: C.muted, textAlign: "center", lineHeight: 20, marginBottom: 36 }}>
                                    has been recorded. A lifestyle coordinator will contact you shortly.
                                </Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={{ backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 48 }}
                                    activeOpacity={0.85}
                                >
                                    <Text style={{ fontSize: 14, fontFamily: "Jost_700Bold", color: "#0a0a0a" }}>Done</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ) : (
                            <>
                                {/* ── Event Selection ── */}
                                <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: C.muted, letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" }}>Selected Event</Text>
                                <TouchableOpacity
                                    onPress={() => setShowEventPicker(!showEventPicker)}
                                    activeOpacity={0.8}
                                    style={{
                                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                                        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: showEventPicker ? GOLD : border, marginBottom: 16
                                    }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 }}>
                                        {currentEventObj?.image && (
                                            <Image source={currentEventObj.image} style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: border }} resizeMode="cover" />
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, fontFamily: "PlayfairDisplay_700Bold", color: C.text }} numberOfLines={1}>{selectedEventTitle}</Text>
                                            <Text style={{ fontSize: 12, fontFamily: "Jost_400Regular", color: C.muted, marginTop: 4 }}>{selectedEventDate}</Text>
                                        </View>
                                    </View>
                                    <ChevronDown size={16} color={GOLD} />
                                </TouchableOpacity>

                                {/* Dropdown browse/picker for events */}
                                {showEventPicker && (
                                    <View style={{ borderBottomWidth: 1, borderBottomColor: border, paddingBottom: 8, marginBottom: 20 }}>
                                        {eventsList.map((e) => (
                                            <TouchableOpacity
                                                key={e.id}
                                                onPress={() => handleSelectEvent(e.title.replace("\n", " "), e.date)}
                                                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}
                                            >
                                                <Image source={e.image} style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: border }} resizeMode="cover" />
                                                <Text style={{ fontSize: 14, fontFamily: "Jost_600SemiBold", color: selectedEventTitle === e.title.replace("\n", " ") ? GOLD : C.text, flex: 1 }}>
                                                    {e.title.replace("\n", " ")}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* ── Service selection ── */}
                                <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: C.muted, letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>Request Service Option *</Text>
                                <View style={{ marginBottom: 24 }}>
                                    {EVENT_SERVICES.map(({ id, label, sub, Icon, color }) => {
                                        const active = selectedService === id;
                                        return (
                                            <TouchableOpacity
                                                key={id}
                                                onPress={() => handleServiceSelect(id)}
                                                activeOpacity={0.8}
                                                style={{
                                                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                                                    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: border
                                                }}
                                            >
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                                                    <Icon size={16} color={active ? GOLD : C.muted} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 14, fontFamily: "Jost_600SemiBold", color: active ? GOLD : C.text }}>{label}</Text>
                                                        <Text style={{ fontSize: 11, fontFamily: "Jost_400Regular", color: C.muted, marginTop: 2 }}>{sub}</Text>
                                                    </View>
                                                </View>
                                                {active ? (
                                                    <CheckCircle2 size={16} color={GOLD} />
                                                ) : (
                                                    <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: border }} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* ── Dynamic Size and Preference Selectors (Card-less design) ── */}
                                {(selectedService === "personal-stylist" || selectedService === "full-concierge") && (
                                    <View style={{ marginBottom: 24, borderBottomWidth: 1, borderBottomColor: border, paddingBottom: 16 }}>
                                        <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 1.5, marginBottom: 16, textTransform: "uppercase" }}>Sizing & Fitting Options</Text>

                                        {/* Gender Selector */}
                                        <View style={{ marginBottom: 20 }}>
                                            <Text style={{ fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.muted, marginBottom: 8, letterSpacing: 0.5 }}>GENDER PROFILE</Text>
                                            <View style={{ flexDirection: "row", gap: 12 }}>
                                                {[
                                                    { id: "lady", label: "LADY" },
                                                    { id: "gentleman", label: "GENTLEMAN" }
                                                ].map((g) => {
                                                    const active = gender === g.id;
                                                    return (
                                                        <TouchableOpacity
                                                            key={g.id}
                                                            onPress={() => {
                                                                setGender(g.id as any);
                                                                setShirtSize(null);
                                                                setTrouserSize(null);
                                                                setShoeSize(null);
                                                            }}
                                                            activeOpacity={0.8}
                                                            style={{
                                                                flex: 1,
                                                                paddingVertical: 12,
                                                                borderRadius: 24,
                                                                borderWidth: 1.5,
                                                                borderColor: active ? GOLD : border,
                                                                backgroundColor: active ? `${GOLD}12` : "transparent",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: active ? GOLD : C.text, letterSpacing: 1.5 }}>
                                                                {g.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>

                                        {/* Dynamic size options based on gender */}
                                        {(() => {
                                            const SHIRT_SIZES_GENTLEMAN = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
                                            const WAIST_SIZES_GENTLEMAN = ["30", "32", "34", "36", "38", "40", "42"];
                                            const SHOE_SIZES_GENTLEMAN = ["40", "41", "42", "43", "44", "45", "46"];

                                            const DRESS_SIZES_LADY = ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18"];
                                            const WAIST_SIZES_LADY = ["26", "28", "30", "32", "34", "36"];
                                            const SHOE_SIZES_LADY = ["36", "37", "38", "39", "40", "41", "42"];

                                            const shirtSizes = gender === "gentleman" ? SHIRT_SIZES_GENTLEMAN : DRESS_SIZES_LADY;
                                            const trouserSizes = gender === "gentleman" ? WAIST_SIZES_GENTLEMAN : WAIST_SIZES_LADY;
                                            const shoeSizes = gender === "gentleman" ? SHOE_SIZES_GENTLEMAN : SHOE_SIZES_LADY;

                                            const shirtLabel = gender === "gentleman" ? "Shirt Size *" : "Dress / Top Size *";
                                            const trouserLabel = gender === "gentleman" ? "Waist / Trouser Size *" : "Waist / Skirt Size *";

                                            return (
                                                <>
                                                    {/* Shirt/Dress Size */}
                                                    <View style={{ marginBottom: 16 }}>
                                                        <Text style={{ fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.muted, marginBottom: 8 }}>{shirtLabel}</Text>
                                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                                                            {shirtSizes.map((size) => {
                                                                const active = shirtSize === size;
                                                                return (
                                                                    <TouchableOpacity
                                                                        key={size}
                                                                        onPress={() => setShirtSize(size)}
                                                                        activeOpacity={0.8}
                                                                        style={{
                                                                            width: 52,
                                                                            height: 52,
                                                                            borderRadius: 26,
                                                                            borderWidth: 1.5,
                                                                            borderColor: active ? GOLD : border,
                                                                            backgroundColor: active ? `${GOLD}15` : "transparent",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                        }}
                                                                    >
                                                                        <Text style={{ fontSize: 13, fontFamily: "Jost_700Bold", color: active ? GOLD : C.text }}>
                                                                            {size}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            })}
                                                        </ScrollView>
                                                    </View>

                                                    {/* Trouser/Waist Size */}
                                                    <View style={{ marginBottom: 16 }}>
                                                        <Text style={{ fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.muted, marginBottom: 8 }}>{trouserLabel}</Text>
                                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                                                            {trouserSizes.map((size) => {
                                                                const active = trouserSize === size;
                                                                return (
                                                                    <TouchableOpacity
                                                                        key={size}
                                                                        onPress={() => setTrouserSize(size)}
                                                                        activeOpacity={0.8}
                                                                        style={{
                                                                            width: 52,
                                                                            height: 52,
                                                                            borderRadius: 26,
                                                                            borderWidth: 1.5,
                                                                            borderColor: active ? GOLD : border,
                                                                            backgroundColor: active ? `${GOLD}15` : "transparent",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                        }}
                                                                    >
                                                                        <Text style={{ fontSize: 13, fontFamily: "Jost_700Bold", color: active ? GOLD : C.text }}>
                                                                            {size}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            })}
                                                        </ScrollView>
                                                    </View>

                                                    {/* Shoe Size */}
                                                    <View style={{ marginBottom: 8 }}>
                                                        <Text style={{ fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.muted, marginBottom: 8 }}>Shoe Size (EU) *</Text>
                                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                                                            {shoeSizes.map((size) => {
                                                                const active = shoeSize === size;
                                                                return (
                                                                    <TouchableOpacity
                                                                        key={size}
                                                                        onPress={() => setShoeSize(size)}
                                                                        activeOpacity={0.8}
                                                                        style={{
                                                                            width: 52,
                                                                            height: 52,
                                                                            borderRadius: 26,
                                                                            borderWidth: 1.5,
                                                                            borderColor: active ? GOLD : border,
                                                                            backgroundColor: active ? `${GOLD}15` : "transparent",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                        }}
                                                                    >
                                                                        <Text style={{ fontSize: 13, fontFamily: "Jost_700Bold", color: active ? GOLD : C.text }}>
                                                                            {size}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            })}
                                                        </ScrollView>
                                                    </View>
                                                </>
                                            );
                                        })()}
                                    </View>
                                )}

                                {(selectedService === "private-chauffeur" || selectedService === "full-concierge") && (
                                    <View style={{ marginBottom: 24, borderBottomWidth: 1, borderBottomColor: border, paddingBottom: 16 }}>
                                        <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 1.5, marginBottom: 16, textTransform: "uppercase" }}>Chauffeur Preferences</Text>

                                        {/* Guest Count */}
                                        <View style={{ marginBottom: 16 }}>
                                            <Text style={{ fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.muted, marginBottom: 8 }}>Number of Guests</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                                                {["1", "2", "3", "4", "5+"].map((count) => {
                                                    const active = guests === count;
                                                    return (
                                                        <TouchableOpacity
                                                            key={count}
                                                            onPress={() => setGuests(count)}
                                                            activeOpacity={0.8}
                                                            style={{
                                                                width: 52,
                                                                height: 52,
                                                                borderRadius: 26,
                                                                borderWidth: 1.5,
                                                                borderColor: active ? GOLD : border,
                                                                backgroundColor: active ? `${GOLD}15` : "transparent",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 13, fontFamily: "Jost_700Bold", color: active ? GOLD : C.text }}>
                                                                {count}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                        </View>

                                        {/* Vehicle Type */}
                                        <View style={{ marginBottom: 8 }}>
                                            <Text style={{ fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.muted, marginBottom: 8 }}>Vehicle Preference</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                                                {["Luxury Sedan", "Executive SUV", "Mercedes Sprinter"].map((type) => {
                                                    const active = vehiclePref === type;
                                                    return (
                                                        <TouchableOpacity
                                                            key={type}
                                                            onPress={() => setVehiclePref(type)}
                                                            activeOpacity={0.8}
                                                            style={{
                                                                paddingHorizontal: 20,
                                                                paddingVertical: 12,
                                                                borderRadius: 24,
                                                                borderWidth: 1.5,
                                                                borderColor: active ? GOLD : border,
                                                                backgroundColor: active ? `${GOLD}15` : "transparent",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 13, fontFamily: "Jost_700Bold", color: active ? GOLD : C.text }}>
                                                                {type}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                        </View>
                                    </View>
                                )}

                                {/* ── Contact details ── */}
                                <View style={{ marginBottom: 28 }}>
                                    <Text style={{ fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.muted, marginBottom: 8 }}>Special Instructions & Preferences</Text>
                                    <VoiceInput
                                        placeholder="e.g. I prefer silver accessories over gold, or have a preference for classic earth tones..."
                                        value={notes}
                                        onChange={setNotes}
                                        accent={GOLD}
                                        textColor={C.text}
                                        border={border}
                                        inputBg={C.surface}
                                    />
                                </View>

                                {/* Error */}
                                {!!error && (
                                    <Text style={{ fontSize: 13, fontFamily: "Jost_500Medium", color: "#e05c5c", marginBottom: 12, textAlign: "center" }}>{error}</Text>
                                )}

                                {/* Submit button */}
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                    style={{ backgroundColor: GOLD, borderRadius: 30, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10, opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? <ActivityIndicator size="small" color="#0a0a0a" /> : null}
                                    <Text style={{ fontSize: 14, fontFamily: "Jost_700Bold", color: "#0a0a0a", letterSpacing: 1 }}>
                                        {loading ? "SUBMITTING..." : "SUBMIT REQUEST"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

function EventServiceCTA({ C, theme, eventTitle, eventDate, eventsList }: { C: any; theme: string; eventTitle: string; eventDate: string; eventsList: any[] }) {
    const surface = theme === "dark" ? "#111" : "#fff";
    const border  = theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const [requestOpen, setRequestOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

    const handleOpenRequest = (serviceId: string) => {
        setSelectedServiceId(serviceId);
        setRequestOpen(true);
    };

    return (
        <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 16 }}>
            <View style={{ borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: `${GOLD}30`, backgroundColor: surface }}>
                <View style={{ padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: border }}>
                    <Text style={{ fontSize: 10, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2, marginBottom: 3 }}>LAPEQ · EVENT EXPERIENCE</Text>
                    <Text style={{ fontSize: 16, fontFamily: "PlayfairDisplay_700Bold", color: C.text }}>Let us elevate your evening</Text>
                    <Text style={{ fontSize: 12, fontFamily: "Jost_400Regular", color: C.muted, marginTop: 4, lineHeight: 18 }}>
                        Attending this event? Add a Lapeq service and arrive ready.
                    </Text>
                </View>

                {EVENT_SERVICES.map(({ id, label, sub, Icon, color }, i) => (
                    <TouchableOpacity
                        key={id}
                        onPress={() => handleOpenRequest(id)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderBottomWidth: i < EVENT_SERVICES.length - 1 ? 1 : 0, borderBottomColor: border }}
                        activeOpacity={0.75}
                    >
                        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${color}15`, alignItems: "center", justifyContent: "center" }}>
                            <Icon size={17} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontFamily: "Jost_600SemiBold", color: C.text }}>{label}</Text>
                            <Text style={{ fontSize: 11, fontFamily: "Jost_400Regular", color: C.muted }}>{sub}</Text>
                        </View>
                        <ChevronRight size={15} color={C.muted} />
                    </TouchableOpacity>
                ))}
            </View>

            <EventRequestModal
                visible={requestOpen}
                onClose={() => { setRequestOpen(false); setSelectedServiceId(null); }}
                initialEventTitle={eventTitle}
                initialEventDate={eventDate}
                initialServiceId={selectedServiceId}
                C={C}
                theme={theme}
                eventsList={eventsList}
            />
        </View>
    );
}

// ─── Full detail modal ────────────────────────────────────────────────────────
function EventModal({ event, onClose, C, theme, eventsList }: { event: Event; onClose: () => void; C: any; theme: string; eventsList: any[] }) {
    const insets = useSafeAreaInsets();
    const [showAllSpeakers, setShowAllSpeakers] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        let animation: Animated.CompositeAnimation | null = null;
        if (imageLoading) {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true })
                ])
            );
            animation.start();
        }
        return () => {
            if (animation) animation.stop();
        };
    }, [imageLoading]);

    const bg      = theme === "dark" ? "#080808" : "#f2ede5";
    const surface = theme === "dark" ? "#111" : "#fff";
    const border  = theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const skeletonBg = theme === "dark" ? "#1c1c1c" : "#e4dfd5";

    const openIg = () => {
        const username = (event as any).instagram;
        if (!username) return;
        Linking.openURL(`instagram://user?username=${username}`).catch(() =>
            Linking.openURL(`https://www.instagram.com/${username}`)
        );
    };

    const hasSpeakers  = event.speakers && event.speakers.length > 0;
    const hasSponsors  = event.sponsors && event.sponsors.length > 0;
    const hasTeams     = (event as any).teams && (event as any).teams.length > 0;
    const hasQr        = !!(event as any).qrUrl;
    const hasTicket    = !!(event as any).ticketUrl || !!(event as any).registerUrl;
    const ticketLink   = (event as any).ticketUrl || (event as any).registerUrl;
    const qrValue      = (event as any).qrUrl;
    const highlights   = (event as any).highlights as string[] | undefined;
    const admission    = (event as any).admission as string | undefined;

    return (
        <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>

                {/* Hero */}
                <View style={{ height: 260, width: "100%", position: "relative", backgroundColor: skeletonBg }}>
                    <Image 
                        source={event.image} 
                        style={{ width: "100%", height: "100%", position: "absolute" }} 
                        resizeMode="cover"
                        onLoadStart={() => setImageLoading(true)}
                        onLoadEnd={() => setImageLoading(false)}
                    />
                    
                    {imageLoading && (
                        <Animated.View style={{
                            position: "absolute",
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: skeletonBg,
                            opacity: pulseAnim,
                        }} />
                    )}
                    <View style={{ width: "100%", height: "100%", position: "absolute", backgroundColor: "rgba(0,0,0,0.5)" }} />
                    <TouchableOpacity
                        onPress={onClose}
                        style={{ position: "absolute", top: 14, left: 16, width: 34, height: 34, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}
                    >
                        <X size={17} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
                        <Text style={{ fontSize: 9, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2.5, marginBottom: 3 }}>{event.organizer.toUpperCase()}</Text>
                        <Text style={{ fontSize: 20, fontFamily: "PlayfairDisplay_700Bold", color: "#fff", lineHeight: 26 }}>{event.title.replace("\n", " ")}</Text>
                        {(event as any).subtitle && (
                            <Text style={{ fontSize: 12, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{(event as any).subtitle}</Text>
                        )}
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

                    {/* ── Quick info strip ── */}
                    <View style={{ flexDirection: "row", margin: 16, borderRadius: 14, overflow: "hidden", backgroundColor: surface, borderWidth: 1, borderColor: border }}>
                        {[
                            { Icon: Clock,  val: event.date,      sub: event.time },
                            { Icon: MapPin, val: event.venue,     sub: event.venueDetail },
                            { Icon: Shirt,  val: event.dressCode, sub: "Dress Code" },
                        ].map(({ Icon, val, sub }, i) => (
                            <View key={i} style={{ flex: 1, alignItems: "center", paddingVertical: 14, paddingHorizontal: 6, borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: border }}>
                                <Icon size={15} color={GOLD} />
                                <Text style={{ fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.text, marginTop: 5, textAlign: "center" }} numberOfLines={1}>{val}</Text>
                                <Text style={{ fontSize: 10, fontFamily: "Jost_400Regular", color: C.muted, marginTop: 1, textAlign: "center" }} numberOfLines={1}>{sub}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Event Description ── */}
                    {event.description && (
                        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontFamily: "Jost_400Regular", color: C.text, lineHeight: 22 }}>
                                {event.description}
                            </Text>
                        </View>
                    )}

                    {/* ── Admission badge ── */}
                    {admission && (
                        <View style={{ marginHorizontal: 16, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: `${GOLD}15`, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: `${GOLD}30` }}>
                            <Ticket size={15} color={GOLD} />
                            <Text style={{ fontSize: 13, fontFamily: "Jost_600SemiBold", color: GOLD }}>{admission}</Text>
                        </View>
                    )}

                    {/* ── Highlights (Future Conference) ── */}
                    {highlights && highlights.length > 0 && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
                            {highlights.map((h: string) => (
                                <View key={h} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: surface, borderWidth: 1, borderColor: border }}>
                                    <Text style={{ fontSize: 12, fontFamily: "Jost_600SemiBold", color: C.text }}>{h}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ── QR Code ── */}
                    {hasQr && (
                        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: surface, borderRadius: 16, borderWidth: 1, borderColor: border, padding: 20, alignItems: "center" }}>
                            <Text style={{ fontSize: 10, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2, marginBottom: 14 }}>SCAN TO REGISTER</Text>
                            <View style={{ padding: 12, backgroundColor: "#fff", borderRadius: 12 }}>
                                <QRCode value={qrValue} size={160} color="#0a0a0a" backgroundColor="#fff" />
                            </View>
                            <TouchableOpacity onPress={() => Linking.openURL(qrValue)} style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Globe size={13} color={GOLD} />
                                <Text style={{ fontSize: 12, fontFamily: "Jost_600SemiBold", color: GOLD }}>Open registration link</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── Ticket / Register button (no QR) ── */}
                    {hasTicket && !hasQr && (
                        <TouchableOpacity
                            onPress={() => Linking.openURL(ticketLink)}
                            style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
                            activeOpacity={0.85}
                        >
                            <Ticket size={16} color="#0a0a0a" />
                            <Text style={{ fontSize: 14, fontFamily: "Jost_700Bold", color: "#0a0a0a" }}>Get Tickets</Text>
                        </TouchableOpacity>
                    )}

                    {/* ── Social links ── */}
                    <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16 }}>
                        {(event as any).instagram && (
                            <TouchableOpacity
                                onPress={openIg}
                                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12, backgroundColor: surface, borderWidth: 1, borderColor: border }}
                            >
                                <IgIcon size={17} color={GOLD} />
                                <Text style={{ fontSize: 12, fontFamily: "Jost_600SemiBold", color: C.text }}>@{(event as any).instagram}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => Linking.openURL(event.website)}
                            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12, backgroundColor: surface, borderWidth: 1, borderColor: border }}
                        >
                            <Globe size={15} color={GOLD} />
                            <Text style={{ fontSize: 12, fontFamily: "Jost_600SemiBold", color: C.text }}>Website</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Categories ── */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
                        {event.categories.map((c: string) => (
                            <View key={c} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, backgroundColor: theme === "dark" ? "#1a1a1a" : "#ece8de", borderWidth: 1, borderColor: `${GOLD}30` }}>
                                <Text style={{ fontSize: 10, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 1.5 }}>{c}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Team names (Awé Lagos) ── */}
                    {hasTeams && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: C.muted, letterSpacing: 2, paddingHorizontal: 16, marginBottom: 12, textTransform: "uppercase" }}>
                                Teams · {(event as any).teams.length}
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                                {(event as any).teams.map((team: string) => (
                                    <View key={team} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: surface, borderWidth: 1, borderColor: border }}>
                                        <Text style={{ fontSize: 12, fontFamily: "Jost_600SemiBold", color: C.text }}>{team}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* ── Speakers ── */}
                    {hasSpeakers && (
                        <View style={{ marginBottom: 16 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 }}>
                                <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>
                                    Speakers · {event.speakers.length}
                                </Text>
                                <TouchableOpacity onPress={() => setShowAllSpeakers(v => !v)}>
                                    <Text style={{ fontSize: 12, fontFamily: "Jost_600SemiBold", color: GOLD }}>
                                        {showAllSpeakers ? "Show less" : "See all"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showAllSpeakers ? (
                                <View style={{ marginHorizontal: 16, backgroundColor: surface, borderRadius: 14, borderWidth: 1, borderColor: border, overflow: "hidden" }}>
                                    {event.speakers.map((s: any, i: number) => {
                                        const initials = s.name.replace(/Dr\.?\s|Rt\.\s?Hon\.\s?|Hon\.\s?|Brig\.\s?Gen\.\s?|Arch\.\s?/g, "").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                                        return (
                                            <View key={s.name} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderBottomWidth: i < event.speakers.length - 1 ? 1 : 0, borderBottomColor: border }}>
                                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${GOLD}15`, alignItems: "center", justifyContent: "center" }}>
                                                    <Text style={{ fontSize: 12, fontFamily: "Jost_700Bold", color: GOLD }}>{initials}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 12, fontFamily: "Jost_600SemiBold", color: C.text }}>{s.name}</Text>
                                                    <Text style={{ fontSize: 11, fontFamily: "Jost_400Regular", color: C.muted, marginTop: 1 }} numberOfLines={1}>{s.role}</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                                    {event.speakers.map((s: any) => (
                                        <SpeakerBubble key={s.name} name={s.name} role={s.role} C={C} />
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}

                    {/* ── Sponsors ── */}
                    {hasSponsors && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: C.muted, letterSpacing: 2, paddingHorizontal: 16, marginBottom: 12, textTransform: "uppercase" }}>Sponsors</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                                {event.sponsors.map((sp: string) => (
                                    <View key={sp} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: surface, borderWidth: 1, borderColor: border }}>
                                        <Text style={{ fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.text }}>{sp}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* ── Lapeq service CTA ── */}
                    <EventServiceCTA C={C} theme={theme} eventTitle={event.title.replace("\n", " ")} eventDate={event.date} eventsList={eventsList} />

                </ScrollView>
            </View>
        </Modal>
    );
}

// ─── Event card ───────────────────────────────────────────────────────────────
function EventCard({ event, onPress, C, theme }: { event: Event; onPress: () => void; C: any; theme: string }) {
    const [imageLoading, setImageLoading] = useState(true);
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        let animation: Animated.CompositeAnimation | null = null;
        if (imageLoading) {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true })
                ])
            );
            animation.start();
        }
        return () => {
            if (animation) animation.stop();
        };
    }, [imageLoading]);

    const isDark = theme === "dark";
    const skeletonBg = isDark ? "#1c1c1c" : "#e4dfd5";

    const speakerCount = event.speakers?.length ?? 0;
    const sponsorCount = event.sponsors?.length ?? 0;
    const meta = [
        speakerCount > 0 && `${speakerCount} speakers`,
        sponsorCount > 0 && `${sponsorCount} sponsors`,
        (event as any).admission,
    ].filter(Boolean).join(" · ");

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={{ marginBottom: 24, width: "100%" }}>
            <View style={{ borderRadius: 24, overflow: "hidden", width: "100%", backgroundColor: skeletonBg }}>
                <View style={{ height: SW * 1.05, width: "100%", position: "relative" }}>
                    <Image 
                        source={event.image} 
                        style={{ width: "100%", height: "100%", position: "absolute" }} 
                        resizeMode="cover"
                        onLoadStart={() => setImageLoading(true)}
                        onLoadEnd={() => setImageLoading(false)}
                    />
                    
                    {imageLoading && (
                        <Animated.View style={{
                            position: "absolute",
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: skeletonBg,
                            opacity: pulseAnim,
                        }} />
                    )}
                    <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120, backgroundColor: "rgba(0,0,0,0.25)" }} />
                    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", backgroundColor: "rgba(0,0,0,0.75)" }} />

                    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 }}>
                        <Text style={{ fontSize: 10, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2.5, marginBottom: 6 }}>
                            {event.organizer.toUpperCase()}
                        </Text>
                        <Text style={{ fontSize: 26, fontFamily: "PlayfairDisplay_700Bold", color: "#fff", lineHeight: 32, marginBottom: 16 }}>
                            {event.title}
                        </Text>

                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 }}>
                                <Clock size={11} color="rgba(255,255,255,0.8)" />
                                <Text style={{ fontSize: 11, fontFamily: "Jost_500Medium", color: "rgba(255,255,255,0.9)" }}>{event.date}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 }}>
                                <MapPin size={11} color="rgba(255,255,255,0.8)" />
                                <Text style={{ fontSize: 11, fontFamily: "Jost_500Medium", color: "rgba(255,255,255,0.9)" }}>{event.venue}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                            <Text style={{ fontSize: 12, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.55)", flex: 1, marginRight: 8 }} numberOfLines={1}>
                                {meta || event.categories.join(" · ")}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GOLD, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 }}>
                                <Text style={{ fontSize: 12, fontFamily: "Jost_700Bold", color: "#0a0a0a" }}>Explore</Text>
                                <ChevronRight size={13} color="#0a0a0a" />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function SkeletonCard({ isDark }: { isDark: boolean }) {
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const skeletonBg = isDark ? "#1c1c1c" : "#e4dfd5";
    const skeletonHighlight = isDark ? "#282828" : "#f2ece2";

    return (
        <Animated.View style={{
            marginBottom: 24,
            width: "100%",
            height: SW * 1.05,
            borderRadius: 24,
            backgroundColor: skeletonBg,
            opacity: pulseAnim,
            padding: 20,
            justifyContent: "flex-end",
            gap: 12
        }}>
            <View style={{ width: 100, height: 10, borderRadius: 5, backgroundColor: skeletonHighlight }} />
            <View style={{ width: "80%", height: 26, borderRadius: 6, backgroundColor: skeletonHighlight }} />
            <View style={{ width: "60%", height: 26, borderRadius: 6, backgroundColor: skeletonHighlight }} />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <View style={{ width: 120, height: 26, borderRadius: 99, backgroundColor: skeletonHighlight }} />
                <View style={{ width: 100, height: 26, borderRadius: 99, backgroundColor: skeletonHighlight }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <View style={{ width: 140, height: 12, borderRadius: 6, backgroundColor: skeletonHighlight }} />
                <View style={{ width: 70, height: 28, borderRadius: 99, backgroundColor: skeletonHighlight }} />
            </View>
        </Animated.View>
    );
}

const mapDbEventToEvent = (db: any) => {
    let formattedDate = "TBA";
    let formattedTime = "TBA";
    if (db.date) {
        const d = new Date(db.date);
        if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
            formattedTime = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        }
    }

    return {
        id: db.id,
        image: db.image_url ? { uri: db.image_url } : require("@/assets/events/testevent.jpeg"),
        organizer: db.badge || "LAPEQ Event",
        title: db.title || "Untitled Event",
        categories: db.badge ? [db.badge.toUpperCase()] : ["EXCLUSIVE"],
        date: formattedDate,
        time: formattedTime,
        venue: db.location_name || "TBA",
        venueDetail: db.location_name || "TBA",
        dressCode: "Smart Casual",
        website: db.website || "",
        instagram: db.instagram || null,
        speakers: [],
        sponsors: [],
        confirmed_count: db.confirmed_count || 0,
        description: db.description || "",
        qrUrl: db.qr_url || null
    };
};

// ─── Screen ───────────────────────────────────────────────────────────────────
// ─── Screen ───────────────────────────────────────────────────────────────────
export default function EventsScreen() {
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<Event | null>(null);
    const [query, setQuery]       = useState("");
    const [dbEvents, setDbEvents] = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);

    // Filters states
    const [filterLocation, setFilterLocation] = useState("All");
    const [filterComingSoon, setFilterComingSoon] = useState(false);
    const [filterDateRange, setFilterDateRange] = useState<"all" | "today" | "week" | "month">("all");
    const [showFiltersModal, setShowFiltersModal] = useState(false);

    useEffect(() => {
        setLoading(true);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        supabase.from("events")
            .select("*")
            .is("deleted_at", null)
            .gte("date", startOfToday.toISOString())
            .order("date", { ascending: true })
            .then(({ data, error }) => {
                if (!error && data) {
                    setDbEvents(data.map(db => ({
                        ...mapDbEventToEvent(db),
                        rawDate: db.date || null
                    })));
                }
                setLoading(false);
            });
    }, []);

    const filtered = useMemo(() => {
        let list = dbEvents;

        // 1. Filter by location
        if (filterLocation !== "All") {
            list = list.filter(ev => 
                (ev.venue || "").toLowerCase().includes(filterLocation.toLowerCase())
            );
        }

        // 2. Filter by Coming Soon / Upcoming (future date)
        if (filterComingSoon) {
            const now = new Date();
            list = list.filter(ev => {
                if (ev.rawDate) {
                    const evDate = new Date(ev.rawDate);
                    if (!isNaN(evDate.getTime())) {
                        return evDate >= now;
                    }
                }
                return true;
            });
        }

        // 3. Filter by Date Range
        if (filterDateRange !== "all") {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            list = list.filter(ev => {
                if (!ev.rawDate) return false;
                const evDate = new Date(ev.rawDate);
                if (isNaN(evDate.getTime())) return false;

                if (filterDateRange === "today") {
                    return evDate >= startOfToday && evDate <= endOfToday;
                } else if (filterDateRange === "week") {
                    const endOfWeek = new Date(startOfToday);
                    endOfWeek.setDate(startOfToday.getDate() + 7);
                    return evDate >= startOfToday && evDate <= endOfWeek;
                } else if (filterDateRange === "month") {
                    const endOfMonth = new Date(startOfToday);
                    endOfMonth.setMonth(startOfToday.getMonth() + 1);
                    return evDate >= startOfToday && evDate <= endOfMonth;
                }
                return true;
            });
        }

        // 4. Filter by search query
        const q = query.toLowerCase().trim();
        if (!q) return list;
        return list.filter(ev =>
            (ev.title || "").toLowerCase().includes(q) ||
            (ev.organizer || "").toLowerCase().includes(q) ||
            (ev.venue || "").toLowerCase().includes(q) ||
            (ev.date || "").toLowerCase().includes(q) ||
            (ev.categories && ev.categories.some((c: string) => (c || "").toLowerCase().includes(q)))
        );
    }, [query, dbEvents, filterLocation, filterComingSoon, filterDateRange]);

    const hasActiveFilters = filterLocation !== "All" || filterComingSoon || filterDateRange !== "all";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
                <Text style={{ fontSize: 10, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2.5 }}>LAPEQ</Text>
                <Text style={{ fontSize: 28, fontFamily: "PlayfairDisplay_700Bold", color: C.text }}>Events</Text>
            </View>

            {/* Search and Filter Row */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", gap: 10, alignItems: "center" }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: isDark ? "#111" : "#f0ece4", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: isDark ? "#1e1e1e" : "#ddd7cc" }}>
                    <Search size={15} color={C.muted} />
                    <TextInput
                        style={{ flex: 1, fontSize: 14, fontFamily: "Jost_400Regular", color: C.text }}
                        placeholder="Search events, venues..."
                        placeholderTextColor={C.muted}
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        autoCapitalize="none"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery("")}>
                            <X size={15} color={C.muted} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    onPress={() => setShowFiltersModal(true)}
                    activeOpacity={0.8}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: hasActiveFilters ? GOLD : (isDark ? "#111" : "#f0ece4"),
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: hasActiveFilters ? GOLD : (isDark ? "#1e1e1e" : "#ddd7cc")
                    }}
                >
                    <SlidersHorizontal size={16} color={hasActiveFilters ? "#0a0a0a" : C.text} />
                    {hasActiveFilters && (
                        <View style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD, borderWidth: 1.5, borderColor: C.background }} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={{ gap: 10 }}>
                        <SkeletonCard isDark={isDark} />
                        <SkeletonCard isDark={isDark} />
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={{ paddingTop: 80, alignItems: "center" }}>
                        <Text style={{ fontSize: 15, fontFamily: "Jost_400Regular", color: C.muted, textAlign: "center", lineHeight: 24 }}>
                            {hasActiveFilters || query ? `No events match your criteria.\nTry resetting your filters.` : "No events scheduled yet."}
                        </Text>
                    </View>
                ) : (
                    filtered.map(ev => (
                        <EventCard key={ev.id} event={ev} onPress={() => setSelected(ev)} C={C} theme={theme} />
                    ))
                )}
            </ScrollView>

            {selected && (
                <EventModal event={selected} onClose={() => setSelected(null)} C={C} theme={theme} eventsList={dbEvents} />
            )}

            {/* Filter Bottom Sheet Modal */}
            <Modal visible={showFiltersModal} transparent animationType="slide" onRequestClose={() => setShowFiltersModal(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
                    <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject }} activeOpacity={1} onPress={() => setShowFiltersModal(false)} />
                    <View style={{
                        backgroundColor: isDark ? "#121212" : "#f7f3ec",
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        paddingHorizontal: 24,
                        paddingTop: 8,
                        paddingBottom: Platform.OS === "ios" ? insets.bottom + 20 : 24,
                        borderTopWidth: 1,
                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                        maxHeight: "85%"
                    }}>
                        <View style={{
                            width: 40,
                            height: 5,
                            borderRadius: 3,
                            backgroundColor: isDark ? "#2a2a2a" : "#d8d3ca",
                            alignSelf: "center",
                            marginBottom: 16
                        }} />

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontFamily: "PlayfairDisplay_700Bold", color: C.text }}>Filter Events</Text>
                            <TouchableOpacity
                                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" }}
                                onPress={() => setShowFiltersModal(false)}
                            >
                                <X size={18} color={C.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                            {/* Location Section */}
                            <View>
                                <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Location</Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                    {["All", "Lagos", "Abuja", "Port Harcourt", "Kano"].map(loc => {
                                        const active = filterLocation === loc;
                                        return (
                                            <TouchableOpacity
                                                key={loc}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    height: 38,
                                                    paddingHorizontal: 14,
                                                    borderRadius: 19,
                                                    backgroundColor: active ? GOLD : C.surface,
                                                    borderWidth: 1,
                                                    borderColor: active ? GOLD : (isDark ? "#2a2a2a" : "#d8d3ca")
                                                }}
                                                onPress={() => setFilterLocation(loc)}
                                            >
                                                <Text style={{ fontSize: 13, fontFamily: "Jost_600SemiBold", color: active ? "#000" : C.text }}>{loc}</Text>
                                                {active && <Check size={12} color="#000" style={{ marginLeft: 4 }} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Date Range Section */}
                            <View>
                                <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Date Range</Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                    {[
                                        { id: "all", label: "All Dates" },
                                        { id: "today", label: "Today" },
                                        { id: "week", label: "This Week" },
                                        { id: "month", label: "This Month" }
                                    ].map(item => {
                                        const active = filterDateRange === item.id;
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    height: 38,
                                                    paddingHorizontal: 14,
                                                    borderRadius: 19,
                                                    backgroundColor: active ? GOLD : C.surface,
                                                    borderWidth: 1,
                                                    borderColor: active ? GOLD : (isDark ? "#2a2a2a" : "#d8d3ca")
                                                }}
                                                onPress={() => setFilterDateRange(item.id as any)}
                                            >
                                                <Text style={{ fontSize: 13, fontFamily: "Jost_600SemiBold", color: active ? "#000" : C.text }}>{item.label}</Text>
                                                {active && <Check size={12} color="#000" style={{ marginLeft: 4 }} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Status Section */}
                            <View>
                                <Text style={{ fontSize: 11, fontFamily: "Jost_700Bold", color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Status</Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            height: 38,
                                            paddingHorizontal: 14,
                                            borderRadius: 19,
                                            backgroundColor: filterComingSoon ? GOLD : C.surface,
                                            borderWidth: 1,
                                            borderColor: filterComingSoon ? GOLD : (isDark ? "#2a2a2a" : "#d8d3ca")
                                        }}
                                        onPress={() => setFilterComingSoon(!filterComingSoon)}
                                    >
                                        <Text style={{ fontSize: 13, fontFamily: "Jost_600SemiBold", color: filterComingSoon ? "#000" : C.text }}>Coming Soon / Upcoming</Text>
                                        {filterComingSoon && <Check size={12} color="#000" style={{ marginLeft: 4 }} />}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: isDark ? "#222" : "#ddd" }}
                                onPress={() => {
                                    setFilterLocation("All");
                                    setFilterComingSoon(false);
                                    setFilterDateRange("all");
                                }}
                            >
                                <Text style={{ fontSize: 14, fontFamily: "Jost_700Bold", color: C.text }}>Reset All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 2, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: GOLD }}
                                onPress={() => setShowFiltersModal(false)}
                            >
                                <Text style={{ fontSize: 14, fontFamily: "Jost_700Bold", color: "#0a0a0a" }}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
