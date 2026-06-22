import { useMemo, useState, useRef, useEffect } from "react";
import * as Notifications from "expo-notifications";
import {
    View, Text, TouchableOpacity, StyleSheet, TextInput,
    Image, ScrollView, Modal, Animated, Alert, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Search, X, MapPin, ChevronRight, Check, Users, Calendar, MessageSquare, Minus, Plus } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import VoiceInput from "@/components/VoiceInput";

const GOLD = "#c9a84c";

const IMAGES: Record<string, any> = {
    dining:    require("@/assets/images/lagos-restaurant.jpg"),
    rooftop:   require("@/assets/images/lagos-rooftop.jpg"),
    beach:     require("@/assets/images/lagos-beach.jpg"),
    hotel:     require("@/assets/images/lagos-hotel.jpg"),
    lifestyle: require("@/assets/images/onboarding-lifestyle.png"),
    driving:   require("@/assets/images/onboarding-driving.png"),
};

const ITINERARIES = [
    {
        id: "1", title: "Romantic Evening", tag: "DATE NIGHT", img: "dining",
        city: "Abuja · Lagos", tier: "Gold",
        desc: "A fully designed intimate evening. Your concierge arranges the venue, private chef, floral decor, and chauffeur - you simply arrive.",
        what: "We handle every detail from reservation to transport. You tell us the mood, we design the night.",
        includes: ["Private dining venue or home setup", "Personal chef & curated menu", "Floral arrangement & decor", "Chauffeur from 6 PM"],
        duration: "4 – 6 hours", guests: "2", category: "Dates",
    },
    {
        id: "2", title: "Spa & Wellness Day", tag: "SELF CARE", img: "lifestyle",
        city: "Abuja · Lagos · Akwa-Ibom", tier: "Silver",
        desc: "A full-day wellness experience. Priority bookings at top spas, plus optional massage therapy and light fine dining afterward.",
        what: "We secure your spot at the best spa in your city, coordinate treatments, and arrange everything so you arrive to a seamless experience.",
        includes: ["Priority spa reservation", "Full treatment package", "Optional fine dining after", "Transport coordination"],
        duration: "Full day", guests: "1 – 4", category: "Wellness",
    },
    {
        id: "3", title: "Executive Night Out", tag: "FOR HIM", img: "rooftop",
        city: "Lagos · Abuja", tier: "Gold",
        desc: "Curated evening for the gentleman. Priority lounge access, VIP table, vetted professional driver all night.",
        what: "Your concierge secures the table, handles the reservation, briefs the venue on your preferences, and ensures your driver is on standby all night.",
        includes: ["VIP lounge or rooftop reservation", "Professional chauffeur all night", "Bottle service coordination", "Table preferences communicated"],
        duration: "6 PM – Late", guests: "1 – 6", category: "Lifestyle",
    },
    {
        id: "4", title: "Weekend Getaway", tag: "TRAVEL", img: "hotel",
        city: "Abuja · Lagos · Port Harcourt", tier: "Gold",
        desc: "A curated weekend break - hotel, dining reservations, and activities arranged before you arrive. You just pack.",
        what: "Share your dates and destination preferences. We source the hotel, book the restaurants, and hand you a full itinerary before you leave.",
        includes: ["Luxury hotel arrangement", "Dining reservations for 2 nights", "Airport or road transfer", "Full weekend itinerary"],
        duration: "2 – 3 days", guests: "1 – 4", category: "Travel",
    },
    {
        id: "5", title: "Corporate Dinner", tag: "BUSINESS", img: "dining",
        city: "Abuja · Lagos", tier: "Gold",
        desc: "Impress your guests with a seamlessly arranged private business dinner. Venue, catering, and setup all handled.",
        what: "We secure a private dining space that matches the tone of your meeting - discreet, professional, and impeccably set up.",
        includes: ["Private dining room or venue", "Menu design & catering", "Full event coordination", "Dietary requirements handled"],
        duration: "2 – 4 hours", guests: "4 – 20", category: "Business",
    },
    {
        id: "6", title: "Ladies Night Experience", tag: "FOR HER", img: "lifestyle",
        city: "Lagos · Abuja", tier: "Silver",
        desc: "A curated evening for women - styling, exclusive venue access, and safe vetted transport the whole night.",
        what: "We coordinate the full evening: styling appointment, venue reservation, and a vetted driver on standby so everyone gets home safely.",
        includes: ["Styling & wardrobe coordination", "Exclusive venue access", "Safe vetted transport all night", "Table reservation"],
        duration: "5 PM – Late", guests: "2 – 8", category: "Ladies",
    },
    {
        id: "7", title: "Private Chef at Home", tag: "DINING", img: "dining",
        city: "All Cities", tier: "Silver",
        desc: "World-class cuisine prepared in your home or suite. A personal chef, curated menu, and flawless service - all arranged by your concierge.",
        what: "Share your location, guest count, and any dietary preferences. We dispatch a vetted personal chef with everything they need.",
        includes: ["Personal chef dispatch", "Custom menu design", "Full kitchen & service setup", "Ingredients sourced & supplied"],
        duration: "3 – 5 hours", guests: "2 – 12", category: "Dining",
    },
    {
        id: "8", title: "Arrival VIP Package", tag: "TRAVEL", img: "driving",
        city: "All Cities", tier: "Silver",
        desc: "Land and feel at home instantly. Airport reception, luxury vehicle, hotel check-in coordination, and a ready itinerary.",
        what: "Share your flight details and we handle everything from the arrivals hall to your suite - no waiting, no confusion.",
        includes: ["Airport VIP reception", "Executive vehicle to hotel", "Hotel readiness & itinerary", "Welcome briefing from concierge"],
        duration: "Arrival day", guests: "1 – 4", category: "Travel",
    },
    {
        id: "9", title: "Bespoke Birthday Experience", tag: "CELEBRATION", img: "rooftop",
        city: "Lagos · Abuja", tier: "Gold",
        desc: "Tell us the feeling, we design the night. Venue, décor, chef, entertainment, transport - one call, one night to remember.",
        what: "Fill in the brief below. The more you tell us about the person and the vibe, the better we design the experience.",
        includes: ["Full event concept & decor", "Venue, chef & entertainment", "Guest transport coordination", "Surprise element on request"],
        duration: "Full evening", guests: "2 – 30", category: "Dates",
    },
    {
        id: "10", title: "Diaspora Homecoming", tag: "DIASPORA", img: "hotel",
        city: "All Cities", tier: "Gold",
        desc: "Coming back to Nigeria? Your concierge handles every detail - airport, accommodation, family visits, and your first week back.",
        what: "We build your homecoming itinerary around your schedule, family plans, and comfort level. Nothing gets missed.",
        includes: ["Airport reception & transfer", "Accommodation arrangement", "Itinerary for your stay", "Family visit coordination"],
        duration: "Multi-day", guests: "1 – 6", category: "Diaspora",
    },
];

const CATEGORIES = ["All", "Dates", "Wellness", "Lifestyle", "Travel", "Business", "Dining", "Diaspora", "Ladies"];

// ─── Day Itinerary schedule data ─────────────────────────────────────────────
const ITINERARY = {
    weekday: [
        {
            time: "7:00 AM – 9:30 AM", label: "Morning",
            items: ["Weather and traffic update provided", "Daily briefing sent via email", "Breakfast — preferred meal, dietary requirements in place", "Morning news & business updates", "Personal trainer session", "Gym workout", "Yoga / stretching exercises"],
        },
        {
            time: "10:00 AM – 12:00 PM", label: "Mid-Morning",
            items: ["Brunch — preferred meal selection", "Executive meetings", "Corporate visits", "Investor meetings", "Conference attendance", "Coffee shop"],
        },
        {
            time: "12:00 PM – 4:00 PM", label: "Afternoon",
            items: ["Lunch", "Shopping", "Site inspections", "Business appointments", "Executive lounge access"],
        },
        {
            time: "4:00 PM – 6:00 PM", label: "Leisure",
            items: ["Golf / tennis / padel session", "Spa treatment / wellness retreat", "Scenic lakeside walk / city sightseeing", "Networking events", "Swimming"],
        },
        {
            time: "6:00 PM – 8:00 PM", label: "Early Evening",
            items: ["Fine dining / private dinner reservations", "Salsa / Kizomba dance class", "Premium champagne / mocktail service", "Private / public cinema viewing"],
        },
        {
            time: "8:00 PM – 10:00 PM", label: "Evening",
            items: ["Concerts / shows", "Theatre performances", "Pubs / lounges", "Private social events", "Private karaoke session", "Chauffeur arranged", "Daily activity summary"],
        },
    ],
    weekend: [
        {
            time: "6:00 AM – 9:00 AM", label: "Early Morning",
            items: ["Pilates / gym / personal training sessions", "Swimming", "Schedule laundry appointments", "Salon appointments"],
        },
        {
            time: "9:00 AM – 12:00 PM", label: "Morning",
            items: ["Family getaway at a resort", "Brunch reservations", "Recreational parks", "Spa and wellness treatments", "Community events & fairs"],
        },
        {
            time: "12:00 PM – 4:00 PM", label: "Afternoon",
            items: ["In-house culinary chef experience", "Coffee shop", "Shopping", "Personal errands", "Family / personal art experience (sip & paint, pottery etc.)", "Picnic", "Horse riding", "Boat cruise"],
        },
        {
            time: "4:00 PM – 6:00 PM", label: "Late Afternoon",
            items: ["Outdoor hangout scenery", "Indoor / outdoor gaming", "Sport events", "Personal / family photoshoots", "Arcade"],
        },
        {
            time: "6:00 PM – 9:00 PM", label: "Evening",
            items: ["Live band events", "Karaoke", "Outdoor dining reservations", "Salsa / Kizomba classes", "Private barbecue experience"],
        },
        {
            time: "9:00 PM – 12:00 AM", label: "Late Night",
            items: ["Lounges / pubs", "Outdoor movie screening", "Clubbing", "Exclusive rooftop events"],
        },
    ],
};

// ─── Itinerary modal ──────────────────────────────────────────────────────────
function ItineraryModal({ visible, onClose, C, theme }: { visible: boolean; onClose: () => void; C: any; theme: string }) {
    const [tab, setTab] = useState<"weekday" | "weekend">("weekday");
    const isDark = theme === "dark";
    const surface = isDark ? "#111" : "#fff";
    const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const blocks = ITINERARY[tab];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: isDark ? "#080808" : "#f2ede5" }}>
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: border }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 2.5 }}>LAPEQ PREMIUM CONCIERGE</Text>
                        <Text style={{ fontSize: 22, fontFamily: "PlayfairDisplay_700Bold", color: C.text }}>Daily Itinerary</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: isDark ? "#1a1a1a" : "#e8e2d8", alignItems: "center", justifyContent: "center" }}>
                        <X size={16} color={C.muted} />
                    </TouchableOpacity>
                </View>

                {/* Tab switcher */}
                <View style={{ flexDirection: "row", margin: 16, backgroundColor: isDark ? "#111" : "#e8e2d8", borderRadius: 10, padding: 3 }}>
                    {(["weekday", "weekend"] as const).map(t => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: tab === t ? GOLD : "transparent" }}
                        >
                            <Text style={{ fontSize: 12, fontFamily: "Jost_700Bold", color: tab === t ? "#0a0a0a" : C.muted }}>
                                {t === "weekday" ? "Weekday" : "Weekend"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
                    {blocks.map((block, bi) => (
                        <View key={bi} style={{ flexDirection: "row", marginBottom: 6 }}>
                            {/* Timeline line */}
                            <View style={{ width: 24, alignItems: "center" }}>
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD, marginTop: 14 }} />
                                {bi < blocks.length - 1 && <View style={{ width: 1.5, flex: 1, backgroundColor: `${GOLD}30`, marginTop: 3 }} />}
                            </View>

                            {/* Block content */}
                            <View style={{ flex: 1, marginLeft: 10, marginBottom: 14 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <Text style={{ fontSize: 10, fontFamily: "Jost_700Bold", color: GOLD, letterSpacing: 1.5 }}>{block.time}</Text>
                                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: `${GOLD}15` }}>
                                        <Text style={{ fontSize: 9, fontFamily: "Jost_700Bold", color: GOLD }}>{block.label.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View style={{ backgroundColor: surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: border }}>
                                    {block.items.map((item, ii) => (
                                        <View key={ii} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 5, borderBottomWidth: ii < block.items.length - 1 ? 1 : 0, borderBottomColor: border }}>
                                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD, marginTop: 6, flexShrink: 0 }} />
                                            <Text style={{ flex: 1, fontSize: 13, fontFamily: "Jost_400Regular", color: C.text, lineHeight: 19 }}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
}
const TIER_COLORS: Record<string, string> = { Silver: "#a8a8a8", Gold: "#c9a84c" };
const CITIES_REQ = ["Lagos", "Abuja", "Port Harcourt", "Akwa Ibom", "Kano", "Other"];

type Itinerary = typeof ITINERARIES[0];

function RequestModal({ item, visible, onClose, C, theme, eventTag, eventDate: eventDateParam }: { item: Itinerary | null; visible: boolean; onClose: () => void; C: any; theme: string; eventTag?: string; eventDate?: string }) {
    const isDark = theme === "dark";
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale  = useRef(new Animated.Value(0.9)).current;

    const [guests, setGuests]     = useState(2);
    const [city, setCity]         = useState("");
    const [date, setDate]         = useState<Date | null>(null);
    const [showDate, setShowDate] = useState(false);
    const [notes, setNotes]       = useState("");
    const [loading, setLoading]   = useState(false);
    const [success, setSuccess]   = useState(false);

    const fmtDate = (d: Date | null) => d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

    const handleSubmit = async () => {
        if (!city) { Alert.alert("Select City", "Please choose your preferred city."); return; }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "experience",
            status: "pending",
            reference: ref,
            title: `Experience - ${item?.title}`,
            details: { experience: item?.id, title: item?.title, guests, city, date: fmtDate(date), notes, ...(eventTag ? { eventTag, eventDate: eventDateParam } : {}) },
        });
        setLoading(false);
        if (!error) {
            setSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        }
    };

    if (!item) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={rs.backdrop}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
                <View style={[rs.sheet, { backgroundColor: C.background }]}>
                    <View style={[rs.sheetHandle, { backgroundColor: isDark ? "#333" : "#ddd" }]} />

                    {success ? (
                        <Animated.View style={[rs.successBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                            <View style={[rs.successIcon, { backgroundColor: `${GOLD}18` }]}>
                                <Check size={28} color={GOLD} strokeWidth={2} />
                            </View>
                            <Text style={[rs.successTitle, { color: C.text }]}>Request Sent</Text>
                            <Text style={[rs.successBody, { color: C.muted }]}>Your concierge will reach out within 2 hours to confirm and begin arranging your experience.</Text>
                            <TouchableOpacity style={rs.successBtn} onPress={onClose}>
                                <Text style={rs.successBtnText}>Done</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <View style={rs.sheetHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={rs.sheetTag}>{item.tag}</Text>
                                    <Text style={[rs.sheetTitle, { color: C.text }]}>{item.title}</Text>
                                    {!!eventTag && (
                                        <View style={{ flexDirection: "row", marginTop: 6 }}>
                                            <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, backgroundColor: "#c9a84c20", borderWidth: 1, borderColor: "#c9a84c50" }}>
                                                <Text style={{ fontSize: 10, fontWeight: "700", color: "#c9a84c", letterSpacing: 0.5 }}>EVENT · {eventTag}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity onPress={onClose} style={[rs.closeBtn, { backgroundColor: C.surface }]}>
                                    <X size={16} color={C.muted} />
                                </TouchableOpacity>
                            </View>

                            <View style={rs.metaRow}>
                                <View style={rs.metaChip}>
                                    <Calendar size={11} color={GOLD} />
                                    <Text style={rs.metaChipText}>{item.duration}</Text>
                                </View>
                                <View style={rs.metaChip}>
                                    <Users size={11} color={GOLD} />
                                    <Text style={rs.metaChipText}>{item.guests} guests</Text>
                                </View>
                                <View style={rs.metaChip}>
                                    <MapPin size={11} color={GOLD} />
                                    <Text style={rs.metaChipText}>{item.city}</Text>
                                </View>
                            </View>

                            <Text style={[rs.sectionLabel, { color: C.muted }]}>HOW IT WORKS</Text>
                            <Text style={[rs.howText, { color: C.text }]}>{item.what}</Text>

                            <Text style={[rs.sectionLabel, { color: C.muted }]}>WHAT'S INCLUDED</Text>
                            {item.includes.map((inc, i) => (
                                <View key={i} style={rs.includeRow}>
                                    <View style={rs.includeDot} />
                                    <Text style={[rs.includeText, { color: C.text }]}>{inc}</Text>
                                </View>
                            ))}

                            <View style={[rs.divider, { backgroundColor: isDark ? "#1e1e1e" : "#ece8e1" }]} />

                            <Text style={[rs.sectionLabel, { color: C.muted }]}>YOUR DETAILS</Text>

                            <Text style={[rs.fieldLabel, { color: C.muted }]}>Number of Guests</Text>
                            <View style={rs.stepperRow}>
                                <TouchableOpacity style={[rs.stepBtn, { borderColor: isDark ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface }]} onPress={() => setGuests(g => Math.max(1, g - 1))}>
                                    <Minus size={16} color={C.text} />
                                </TouchableOpacity>
                                <Text style={[rs.stepVal, { color: C.text }]}>{guests}</Text>
                                <TouchableOpacity style={[rs.stepBtn, { borderColor: isDark ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface }]} onPress={() => setGuests(g => Math.min(30, g + 1))}>
                                    <Plus size={16} color={C.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[rs.fieldLabel, { color: C.muted }]}>Preferred City</Text>
                            <View style={rs.cityRow}>
                                {CITIES_REQ.map(c => {
                                    const isAvailable = c === "Lagos" || c === "Abuja";
                                    const displayLabel = isAvailable ? c : `${c} (Coming Soon)`;
                                    return (
                                        <TouchableOpacity key={c} style={[rs.cityChip, { borderColor: city === c ? GOLD : (isDark ? "#2a2a2a" : "#e0dbd2"), backgroundColor: city === c ? `${GOLD}15` : C.surface }]} onPress={() => setCity(c)}>
                                            <Text style={[rs.cityChipText, { color: city === c ? GOLD : C.muted, fontWeight: city === c ? "700" : "400" }]}>{displayLabel}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[rs.fieldLabel, { color: C.muted }]}>Preferred Date</Text>
                            <TouchableOpacity style={[rs.dateBtn, { backgroundColor: C.surface, borderColor: date ? GOLD : (isDark ? "#2a2a2a" : "#e0dbd2") }]} onPress={() => setShowDate(true)}>
                                <Calendar size={16} color={date ? GOLD : C.muted} />
                                <Text style={{ fontSize: 15, color: date ? C.text : C.muted, fontWeight: date ? "600" : "400" }}>{fmtDate(date) ?? "Select a date (optional)"}</Text>
                            </TouchableOpacity>

                            <Text style={[rs.fieldLabel, { color: C.muted }]}>Special Requests or Notes</Text>
                            <VoiceInput
                                placeholder="Any preferences, dietary requirements, surprises, or details that will help us get it right..."
                                value={notes}
                                onChange={setNotes}
                                accent={GOLD}
                                textColor={C.text}
                                border={isDark ? "#2a2a2a" : "#e0dbd2"}
                                inputBg={C.surface}
                            />

                            <View style={[rs.feeCard, { borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` }]}>
                                <Text style={rs.feeEyebrow}>SERVICE FEE</Text>
                                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                                    <Text style={rs.feeAmount}>₦5,000</Text>
                                    <Text style={[rs.feeNote, { color: C.muted }]}>per request</Text>
                                </View>
                                <Text style={[rs.feeSub, { color: C.muted }]}>Collected upon confirmation. Experience costs are quoted separately.</Text>
                            </View>

                            <TouchableOpacity style={[rs.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                                <Text style={rs.submitText}>{loading ? "Submitting..." : "Request This Experience"}</Text>
                                <ChevronRight size={16} color="#0a0a0a" />
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>

                {Platform.OS === "android" && showDate && (
                    <DateTimePicker value={date ?? new Date()} mode="date" display="default" minimumDate={new Date()} onChange={(_, d) => { setShowDate(false); if (d) setDate(d); }} />
                )}
                <Modal visible={Platform.OS === "ios" && showDate} transparent animationType="slide">
                    <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} activeOpacity={1} onPress={() => setShowDate(false)} />
                    <View style={[rs.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={rs.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDate(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Select Date</Text>
                            <TouchableOpacity onPress={() => setShowDate(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={date ?? new Date()} mode="date" display="spinner" minimumDate={new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDate(d); }} />
                    </View>
                </Modal>
            </View>
        </Modal>
    );
}

export default function ExperiencesScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const { eventTag, eventDate } = useLocalSearchParams<{ eventTag?: string; eventDate?: string }>();

    const [query, setQuery]               = useState("");
    const [activeCategory, setCategory]   = useState("All");
    const [selectedItem, setSelectedItem] = useState<Itinerary | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [itineraryVisible, setItineraryVisible] = useState(false);

    // If coming from an event, auto-open the first itinerary as a request
    useEffect(() => {
        if (eventTag && ITINERARIES.length > 0) {
            // Show the request modal immediately for the first itinerary (Full Concierge context)
            setSelectedItem(ITINERARIES[0]);
            setModalVisible(true);
        }
    }, []);

    const fireItineraryNotification = async () => {
        await Notifications.requestPermissionsAsync();
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Your Daily Itinerary is Ready",
                body: "LAPEQ Premium: Your curated schedule for today has been prepared.",
                sound: true,
                data: { url: "/explore/experiences" },
            },
            trigger: null,
        });
    };

    const filtered = useMemo(() => ITINERARIES.filter(exp => {
        const q = query.toLowerCase();
        const matchQ = q === "" || exp.title.toLowerCase().includes(q) || exp.desc.toLowerCase().includes(q) || exp.category.toLowerCase().includes(q);
        const matchC = activeCategory === "All" || exp.category === activeCategory;
        return matchQ && matchC;
    }), [query, activeCategory]);

    const openRequest = (item: Itinerary) => { setSelectedItem(item); setModalVisible(true); };

    return (
        <SafeAreaView style={s.root}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={22} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[s.eyebrow, { color: GOLD }]}>CURATED BY LAPEQ</Text>
                    <Text style={[s.title, { color: C.text }]}>Experiences</Text>
                </View>
            </View>

            {/* What is this */}
            <View style={[s.introBanner, { backgroundColor: isDark ? "#0f0f0f" : "#f7f3eb", borderColor: isDark ? "#1e1e1e" : "#e8e0d0" }]}>
                <Text style={[s.introText, { color: C.muted }]}>
                    Choose an experience below, tell us your preferences, and your concierge handles everything. You simply show up.
                </Text>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                <View style={[s.searchBox, { backgroundColor: C.surface, borderColor: isDark ? "#2a2a2a" : "#d8d3ca" }]}>
                    <Search size={16} color={C.muted} />
                    <TextInput style={[s.searchInput, { color: C.text }]} value={query} onChangeText={setQuery}
                        placeholder="Search experiences..." placeholderTextColor={C.muted} returnKeyType="search" autoCapitalize="none" />
                    {query.length > 0 && <TouchableOpacity onPress={() => setQuery("")}><X size={16} color={C.muted} /></TouchableOpacity>}
                </View>
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat} style={[s.chip, activeCategory === cat && s.chipActive]} onPress={() => setCategory(cat)}>
                        <Text style={[s.chipText, { color: activeCategory === cat ? "#0a0a0a" : C.muted }, activeCategory === cat && { fontWeight: "700" }]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Count */}
            <View style={s.countRow}>
                <Text style={[s.countText, { color: C.muted }]}>{filtered.length} experience{filtered.length !== 1 ? "s" : ""}</Text>
            </View>

            {/* List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>

                {/* Featured: Premium Day Itinerary */}
                <View style={[s.itinCard, { backgroundColor: isDark ? "#111" : "#faf6ee", borderColor: GOLD + "40" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <View style={{ backgroundColor: GOLD, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                            <Text style={{ color: "#0a0a0a", fontSize: 9, fontWeight: "800", letterSpacing: 1.2 }}>PREMIUM</Text>
                        </View>
                        <Text style={{ color: GOLD, fontSize: 9, fontWeight: "700", letterSpacing: 1.2 }}>DAY ITINERARY</Text>
                    </View>
                    <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 4, letterSpacing: -0.3 }}>
                        Your Curated Day, Planned.
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
                        From morning rituals to evening wind-down — a full weekday or weekend schedule designed around your lifestyle.
                    </Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                            style={{ flex: 1, backgroundColor: GOLD, borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
                            onPress={() => setItineraryVisible(true)}
                            activeOpacity={0.85}
                        >
                            <Text style={{ color: "#0a0a0a", fontSize: 13, fontWeight: "700" }}>View Itinerary</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: GOLD + "60" }}
                            onPress={async () => {
                                await fireItineraryNotification();
                                setItineraryVisible(true);
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={{ color: GOLD, fontSize: 13, fontWeight: "600" }}>Send to Notifs</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {filtered.length === 0 ? (
                    <View style={s.empty}>
                        <Text style={[{ fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 6 }]}>No experiences found</Text>
                        <Text style={[{ fontSize: 13, color: C.muted }]}>Try a different search or category</Text>
                    </View>
                ) : filtered.map(item => (
                    <TouchableOpacity key={item.id} style={[s.card, { backgroundColor: C.surface, borderColor: isDark ? "#2a2a2a" : "#ece8de" }]} onPress={() => openRequest(item)} activeOpacity={0.88}>
                        <Image source={IMAGES[item.img]} style={s.cardImg} resizeMode="cover" />
                        <View style={s.cardOverlay} />
                        <View style={s.cardImgContent}>
                            <View style={s.tagRow}>
                                <View style={s.tag}><Text style={s.tagText}>{item.tag}</Text></View>
                                <View style={[s.tierTag, { borderColor: TIER_COLORS[item.tier] + "80" }]}>
                                    <Text style={[s.tierTagText, { color: TIER_COLORS[item.tier] }]}>{item.tier}+</Text>
                                </View>
                            </View>
                            <Text style={s.cardTitle}>{item.title}</Text>
                            <View style={s.cityRow}>
                                <MapPin size={11} color="rgba(255,255,255,0.6)" />
                                <Text style={s.cityText}>{item.city}</Text>
                            </View>
                        </View>

                        <View style={s.cardBody}>
                            <Text style={[s.cardDesc, { color: C.muted }]}>{item.desc}</Text>

                            <View style={s.metaRow}>
                                <View style={[s.metaPill, { borderColor: isDark ? "#2a2a2a" : "#e8e0d0" }]}>
                                    <Users size={11} color={C.muted} />
                                    <Text style={[s.metaPillText, { color: C.muted }]}>{item.guests}</Text>
                                </View>
                                <View style={[s.metaPill, { borderColor: isDark ? "#2a2a2a" : "#e8e0d0" }]}>
                                    <Calendar size={11} color={C.muted} />
                                    <Text style={[s.metaPillText, { color: C.muted }]}>{item.duration}</Text>
                                </View>
                            </View>

                            <View style={s.includesList}>
                                {item.includes.slice(0, 3).map((inc, i) => (
                                    <View key={i} style={s.includeRow}>
                                        <View style={[s.includeDot, { backgroundColor: GOLD }]} />
                                        <Text style={[s.includeText, { color: C.text }]}>{inc}</Text>
                                    </View>
                                ))}
                                {item.includes.length > 3 && <Text style={[s.moreText, { color: C.muted }]}>+{item.includes.length - 3} more included</Text>}
                            </View>

                            <TouchableOpacity style={s.requestBtn} onPress={() => openRequest(item)} activeOpacity={0.85}>
                                <Text style={s.requestBtnText}>Request This Experience</Text>
                                <ChevronRight size={16} color="#0a0a0a" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <RequestModal item={selectedItem} visible={modalVisible} onClose={() => { setModalVisible(false); }} C={C} theme={theme} eventTag={eventTag as string | undefined} eventDate={eventDate as string | undefined} />
            <ItineraryModal visible={itineraryVisible} onClose={() => setItineraryVisible(false)} C={C} theme={theme} />
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", alignItems: "center", justifyContent: "center" },
    eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 2.5, marginBottom: 2 },
    title: { fontSize: 28, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
    introBanner: { marginHorizontal: 20, marginBottom: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
    introText: { fontSize: 13, lineHeight: 20 },
    searchBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 14 },
    chips: { paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    chipActive: { backgroundColor: GOLD, borderColor: GOLD },
    chipText: { fontSize: 13 },
    countRow: { paddingHorizontal: 20, paddingBottom: 8 },
    countText: { fontSize: 12, fontWeight: "600" },
    list: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    card: { borderRadius: 20, overflow: "hidden", borderWidth: 1 },
    cardImg: { width: "100%", height: 180 },
    cardOverlay: { ...StyleSheet.absoluteFillObject, height: 180, backgroundColor: "rgba(0,0,0,0.45)" },
    cardImgContent: { position: "absolute", top: 0, left: 0, right: 0, height: 180, padding: 16, justifyContent: "flex-end" },
    tagRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: GOLD },
    tagText: { fontSize: 9, fontWeight: "800", color: "#0a0a0a", letterSpacing: 1 },
    tierTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, backgroundColor: "rgba(0,0,0,0.3)" },
    tierTagText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
    cardTitle: { fontSize: 20, fontWeight: "700", color: "#fff", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 4 },
    cityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    cityText: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
    cardBody: { padding: 16 },
    cardDesc: { fontSize: 13, lineHeight: 21, marginBottom: 12 },
    metaRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
    metaPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    metaPillText: { fontSize: 11, fontWeight: "600" },
    includesList: { gap: 7, marginBottom: 16 },
    includeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    includeDot: { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
    includeText: { fontSize: 13, fontWeight: "500", flex: 1 },
    moreText: { fontSize: 12, marginTop: 2, paddingLeft: 15 },
    requestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14 },
    requestBtnText: { fontSize: 14, fontWeight: "700", color: "#0a0a0a" },
    empty: { alignItems: "center", paddingTop: 60 },
    itinCard: { borderRadius: 20, borderWidth: 1.5, padding: 18, marginBottom: 4 },
});

// Request modal styles
const rs = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, maxHeight: "92%", paddingBottom: 0 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
    sheetHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
    sheetTag: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 6 },
    sheetTitle: { fontSize: 22, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
    closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    metaRow: { flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" },
    metaChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}10` },
    metaChipText: { fontSize: 11, fontWeight: "600", color: GOLD },
    sectionLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 10, marginTop: 4 },
    howText: { fontSize: 14, lineHeight: 22, marginBottom: 18 },
    includeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    includeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GOLD, flexShrink: 0 },
    includeText: { fontSize: 13, fontWeight: "500", flex: 1 },
    divider: { height: 1, marginVertical: 20 },
    fieldLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 12, marginTop: 16 },
    stepperRow: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 4 },
    stepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    stepVal: { fontSize: 24, fontWeight: "700", minWidth: 36, textAlign: "center" },
    cityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    cityChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
    cityChipText: { fontSize: 13 },
    dateBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 4 },
    textarea: { borderRadius: 14, padding: 16, fontSize: 14, minHeight: 110, lineHeight: 22, borderWidth: 1 },
    feeCard: { marginTop: 20, padding: 16, borderRadius: 14, borderWidth: 1 },
    feeEyebrow: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 6 },
    feeAmount: { fontSize: 22, fontWeight: "800", color: GOLD },
    feeNote: { fontSize: 13, fontWeight: "600" },
    feeSub: { fontSize: 11, marginTop: 2, lineHeight: 16 },
    submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 17, marginTop: 16 },
    submitText: { color: "#0a0a0a", fontSize: 15, fontWeight: "800" },
    successBox: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 16 },
    successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 24 },
    successTitle: { fontSize: 24, fontWeight: "800", marginBottom: 12 },
    successBody: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    successBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: GOLD, alignItems: "center" },
    successBtnText: { color: "#0a0a0a", fontSize: 15, fontWeight: "700" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },
});
