import { useState, useMemo, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ImageBackground,
    Modal,
    Animated,
    Alert,
    Platform,
    Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import {
    ChevronLeft,
    Calendar,
    Check,
    ArrowRight,
    ArrowLeft,
    Shield,
    Sliders,
    Palette,
    Users,
    Sparkles,
    MessageSquare,
    Compass,
    Smartphone,
    Info,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GOLD = "#c9a84c";

const EVENT_TYPES = [
    { name: "Wedding", desc: "Celebrate union in bespoke style", img: require("@/assets/images/beautiful-scenery.webp") },
    { name: "Corporate Summit", desc: "For keynotes, networking & brands", img: require("@/assets/images/lagos-hotel.jpg") },
    { name: "Gala / Birthday", desc: "Milestone banquets & private galas", img: require("@/assets/images/lagos-rooftop.jpg") },
    { name: "Concert / Show", desc: "Live audience & stage setup", img: require("@/assets/events/awe-lagos.jpeg") },
    { name: "Exhibition / Summit", desc: "Art, summits, trade & fashion fairs", img: require("@/assets/events/coresphere.jpeg") },
    { name: "Other Occasion", desc: "Custom designed event layout", img: require("@/assets/images/exterior-luxury.jpg") },
];

const FEATURE_OPTIONS = [
    { id: "rsvp", label: "RSVP & Guest Tracker", desc: "Let guests confirm and track attendance", icon: Users },
    { id: "travel", label: "Guest Travel & Aviation", desc: "Manage delegate flight & private jet bookings", icon: Compass },
    { id: "protocol", label: "VIP Airport Protocol", desc: "Airport arrivals, customs clearance & escorts", icon: Shield },
    { id: "chat", label: "Personal Butler Chat", desc: "Dedicated concierge channel for guests", icon: MessageSquare },
    { id: "custom_tabs", label: "Custom Tabs", desc: "Branded itinerary and event schedules", icon: Sliders },
];

const PRESET_PALETTES = [
    { name: "Midnight Gold", colors: ["#000000", "#c9a84c"] },
    { name: "Rose & Pearl", colors: ["#F9E5E6", "#D3C3B0"] },
    { name: "Emerald & Brass", colors: ["#0B3C2D", "#c9a84c"] },
    { name: "Sapphire & Silver", colors: ["#0F2537", "#C0C0C0"] },
];

const GUEST_PRESETS = ["50", "150", "300", "500", "1000+"];

export default function LapeqCoBrandScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    // Step state: 1: Event Info, 2: Place & Guests, 3: Branding & Palette, 4: Features & Submission
    const [step, setStep] = useState(1);

    // Form States
    const [eventName, setEventName] = useState("");
    const [eventType, setEventType] = useState("");
    const [eventLocation, setEventLocation] = useState("");
    const [guestCount, setGuestCount] = useState("");
    const [themeColors, setThemeColors] = useState("Midnight Gold");
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [additionalNotes, setAdditionalNotes] = useState("");

    // Date Picker States
    const [eventDate, setEventDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Input focus states for premium glow borders
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    // Submission states
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Animated values for transition steps
    const stepAnim = useRef(new Animated.Value(1)).current;
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;
    const scrollRef = useRef<ScrollView>(null);

    const fmtDate = (d: Date | null) =>
        d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

    const navigateStep = (targetStep: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.timing(stepAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setStep(targetStep);
            scrollRef.current?.scrollTo({ y: 0, animated: false });
            Animated.timing(stepAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    const toggleFeature = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedFeatures(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const selectPresetColors = (paletteName: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setThemeColors(paletteName);
    };

    const handleSelectGuestPreset = (val: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGuestCount(val);
    };

    const handleSubmit = async () => {
        if (!eventName.trim() || !eventType || !eventLocation.trim() || !eventDate) {
            Alert.alert("Required Fields", "Please provide the Event Name, Type, Date, and Location.");
            return;
        }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "COB-" + Date.now().toString(36).toUpperCase().slice(-5);

        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "white-label-event",
            status: "pending",
            reference: ref,
            title: `Co-Brand: ${eventName}`,
            details: {
                eventName,
                eventType,
                eventLocation,
                eventDate: fmtDate(eventDate),
                guestCount: guestCount.trim() || "Unspecified",
                themeColors: themeColors.trim() || "Default Lapeq Style",
                features: selectedFeatures.map(f => FEATURE_OPTIONS.find(opt => opt.id === f)?.label || f),
                notes: additionalNotes,
            },
        });

        setLoading(false);

        if (!error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        } else {
            Alert.alert("Submission Failed", error.message || "Something went wrong. Please try again.");
        }
    };

    // Computes the active colors for live mockup preview
    const mockupColors = useMemo(() => {
        const activePalette = PRESET_PALETTES.find(p => p.name === themeColors);
        if (activePalette) {
            return {
                bg: activePalette.colors[0],
                accent: activePalette.colors[1],
                isLightBg: activePalette.name === "Rose & Pearl",
            };
        }
        // Custom colors fallback
        return {
            bg: isDark ? "#121212" : "#ffffff",
            accent: GOLD,
            isLightBg: !isDark,
        };
    }, [themeColors, isDark]);

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
            <LinearGradient colors={isDark ? ["#060606", "#14110e", "#0a0a0b"] : ["#fdfbf7", "#f8f5f0", "#ffffff"]} style={StyleSheet.absoluteFillObject} />

            {/* Premium Header */}
            <View style={s.stickyHeader}>
                <TouchableOpacity style={s.backBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
                    <ChevronLeft size={22} color={C.text} />
                </TouchableOpacity>
                <View style={s.stepProgressContainer}>
                    <Text style={s.stepText}>STEP {step} OF 4</Text>
                    <View style={s.progressBarBackground}>
                        <Animated.View style={[s.progressBarFill, { width: `${(step / 4) * 100}%` }]} />
                    </View>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
                
                {/* Steps container */}
                <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}>
                    
                    {step === 1 && (
                        /* STEP 1: EVENT IDENTITY */
                        <View style={s.stepWrap}>
                            {/* Premium Welcome Hero Card */}
                            <View style={s.heroCard}>
                                <ImageBackground
                                    source={require("@/assets/images/app-collab.png")}
                                    style={s.heroBg}
                                    imageStyle={{ borderRadius: 20 }}
                                    resizeMode="cover"
                                >
                                    <LinearGradient
                                        colors={["transparent", "rgba(6, 6, 6, 0.95)"]}
                                        style={s.heroGradient}
                                    >
                                        <View style={s.heroBadge}>
                                            <Sparkles size={12} color={GOLD} />
                                            <Text style={s.heroBadgeText}>LAPEQ × CO-BRAND</Text>
                                        </View>
                                        <Text style={s.heroTitle}>Your Event Runs On Lapeq</Text>
                                        <Text style={s.heroSubtitle}>We will customize the full app layout, colors, and guest portal for your brand.</Text>
                                    </LinearGradient>
                                </ImageBackground>
                            </View>

                            <View style={s.formSection}>
                                <Text style={s.label}>What is your event called?</Text>
                                <TextInput
                                    style={[s.input, focusedInput === "eventName" && s.inputFocused]}
                                    placeholder="e.g., Adeleke Wedding / Summit 2026"
                                    placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)"}
                                    value={eventName}
                                    onChangeText={setEventName}
                                    onFocus={() => setFocusedInput("eventName")}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>

                            <View style={s.formSection}>
                                <Text style={s.label}>What type of occasion is it?</Text>
                                <View style={s.gridRow}>
                                    {EVENT_TYPES.map(t => {
                                        const isSelected = eventType === t.name;
                                        return (
                                            <TouchableOpacity
                                                key={t.name}
                                                style={[s.eventCard, isSelected && s.eventCardActive]}
                                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEventType(t.name); }}
                                                activeOpacity={0.9}
                                            >
                                                <ImageBackground
                                                    source={t.img}
                                                    style={StyleSheet.absoluteFillObject}
                                                    imageStyle={{ borderRadius: 16 }}
                                                    resizeMode="cover"
                                                >
                                                    <LinearGradient
                                                        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
                                                        style={s.eventCardGradient}
                                                    >
                                                        <View style={[s.checkboxCircle, isSelected && s.checkboxCircleActive]}>
                                                            {isSelected && <Check size={10} color="#000" strokeWidth={4} />}
                                                        </View>
                                                        <View style={{ marginTop: "auto" }}>
                                                            <Text style={s.eventName}>{t.name}</Text>
                                                            <Text style={s.eventDesc}>{t.desc}</Text>
                                                        </View>
                                                    </LinearGradient>
                                                </ImageBackground>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[s.primaryBtn, (!eventName.trim() || !eventType) && s.disabledBtn]}
                                onPress={() => eventName.trim() && eventType && navigateStep(2)}
                                disabled={!eventName.trim() || !eventType}
                            >
                                <Text style={s.primaryBtnText}>CONTINUE TO DETAILS</Text>
                                <ArrowRight size={16} color="#0a0a0a" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 2 && (
                        /* STEP 2: PLACE & TIME */
                        <View style={s.stepWrap}>
                            <View style={s.stepIntro}>
                                <Calendar size={28} color={GOLD} />
                                <Text style={s.stepHeaderTitle}>When & where?</Text>
                                <Text style={s.stepHeaderSubtitle}>Provide scheduling and venue guidelines to structure your app itinerary.</Text>
                            </View>

                            <View style={s.formSection}>
                                <Text style={s.label}>Event Date</Text>
                                <TouchableOpacity
                                    style={[s.customDatePickerCard, eventDate && s.customDatePickerCardActive]}
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDatePicker(true); }}
                                    activeOpacity={0.8}
                                >
                                    <Calendar size={20} color={eventDate ? GOLD : C.muted} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.dateCardLabel}>Selected Date</Text>
                                        <Text style={[s.dateCardValue, { color: eventDate ? C.text : C.muted }]}>
                                            {fmtDate(eventDate) ?? "Select occasion date"}
                                        </Text>
                                    </View>
                                    <Text style={s.dateChangeAction}>{eventDate ? "CHANGE" : "SELECT"}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={s.formSection}>
                                <Text style={s.label}>Location / Venue</Text>
                                <TextInput
                                    style={[s.input, focusedInput === "eventLocation" && s.inputFocused]}
                                    placeholder="e.g., Eko Hotel Grand Ballroom, Lagos"
                                    placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)"}
                                    value={eventLocation}
                                    onChangeText={setEventLocation}
                                    onFocus={() => setFocusedInput("eventLocation")}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>

                            <View style={s.formSection}>
                                <Text style={s.label}>Estimated Guest Count</Text>
                                <TextInput
                                    style={[s.input, focusedInput === "guestCount" && s.inputFocused, { marginBottom: 12 }]}
                                    keyboardType="numeric"
                                    placeholder="e.g., 350"
                                    placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)"}
                                    value={guestCount}
                                    onChangeText={setGuestCount}
                                    onFocus={() => setFocusedInput("guestCount")}
                                    onBlur={() => setFocusedInput(null)}
                                />
                                <View style={s.presetRow}>
                                    {GUEST_PRESETS.map(p => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[s.presetChip, guestCount === p && s.presetChipActive]}
                                            onPress={() => handleSelectGuestPreset(p)}
                                        >
                                            <Text style={[s.presetChipText, guestCount === p && s.presetChipTextActive]}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={s.navRow}>
                                <TouchableOpacity style={s.secondaryBtn} onPress={() => navigateStep(1)}>
                                    <ArrowLeft size={16} color={C.text} />
                                    <Text style={[s.secondaryBtnText, { color: C.text }]}>BACK</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.primaryBtn, { flex: 1 }, (!eventLocation.trim() || !eventDate) && s.disabledBtn]}
                                    onPress={() => eventLocation.trim() && eventDate && navigateStep(3)}
                                    disabled={!eventLocation.trim() || !eventDate}
                                >
                                    <Text style={s.primaryBtnText}>AESTHETICS</Text>
                                    <ArrowRight size={16} color="#0a0a0a" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {step === 3 && (
                        /* STEP 3: BRANDING & COLORS */
                        <View style={s.stepWrap}>
                            <View style={s.stepIntro}>
                                <Palette size={28} color={GOLD} />
                                <Text style={s.stepHeaderTitle}>App Curation Theme</Text>
                                <Text style={s.stepHeaderSubtitle}>Choose pre-designed luxurious color accents or supply your custom brand colors.</Text>
                            </View>

                            {/* Two-column styled section: inputs on left/top, real-time live mockup preview below */}
                            <View style={s.themeConfigContainer}>
                                <View style={s.formSection}>
                                    <Text style={s.label}>Preset Palettes</Text>
                                    <View style={s.paletteGrid}>
                                        {PRESET_PALETTES.map(p => {
                                            const isActive = themeColors === p.name;
                                            return (
                                                <TouchableOpacity
                                                    key={p.name}
                                                    style={[s.paletteCard, isActive && s.paletteCardActive]}
                                                    onPress={() => selectPresetColors(p.name)}
                                                    activeOpacity={0.8}
                                                >
                                                    <View style={s.colorRow}>
                                                        {p.colors.map((col, idx) => (
                                                            <View key={idx} style={[s.colorCircle, { backgroundColor: col }]} />
                                                        ))}
                                                    </View>
                                                    <Text style={[s.paletteName, isActive && { color: GOLD }]}>{p.name}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                <View style={s.formSection}>
                                    <Text style={s.label}>Or describe custom brand colors</Text>
                                    <TextInput
                                        style={[s.input, focusedInput === "themeColors" && s.inputFocused]}
                                        placeholder="e.g., Emerald Green, Gold & White"
                                        placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)"}
                                        value={themeColors}
                                        onChangeText={setThemeColors}
                                        onFocus={() => setFocusedInput("themeColors")}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>

                                {/* Live Mockup Preview Card */}
                                <View style={s.mockupSection}>
                                    <Text style={s.mockupHeaderLabel}>LIVE PREVIEW</Text>
                                    <View style={[s.phoneMockup, { backgroundColor: mockupColors.bg, borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }]}>
                                        {/* Phone Notch/Header line */}
                                        <View style={s.phoneCamera} />
                                        <View style={s.phoneScreen}>
                                            <View style={s.mockStatusBar}>
                                                <Text style={[s.mockStatusBarText, { color: mockupColors.isLightBg ? "#333" : "#888" }]}>9:41</Text>
                                                <View style={s.mockStatusBarIcons}>
                                                    <View style={[s.mockIconSignal, { backgroundColor: mockupColors.isLightBg ? "#333" : "#888" }]} />
                                                    <View style={[s.mockIconBattery, { borderColor: mockupColors.isLightBg ? "#333" : "#888" }]} />
                                                </View>
                                            </View>
                                            
                                            {/* Micro event screen */}
                                            <View style={s.mockAppContent}>
                                                <Image
                                                    source={require("@/assets/images/app-collab.png")}
                                                    style={s.mockHeroImg}
                                                    resizeMode="cover"
                                                />
                                                <View style={s.mockAppMeta}>
                                                    <Text style={[s.mockEventTitle, { color: mockupColors.isLightBg ? "#1a1a1a" : "#ffffff" }]}>
                                                        {eventName.trim() ? eventName : "YOUR EVENT APP"}
                                                    </Text>
                                                    <Text style={[s.mockEventTag, { color: mockupColors.accent }]}>
                                                        {eventType || "Occasion Curation"}
                                                    </Text>
                                                    <View style={[s.mockButton, { backgroundColor: mockupColors.accent }]}>
                                                        <Text style={[s.mockButtonText, { color: mockupColors.accent === "#ffffff" || mockupColors.isLightBg ? "#000" : "#fff" }]}>RSVP PASS</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={s.navRow}>
                                <TouchableOpacity style={s.secondaryBtn} onPress={() => navigateStep(2)}>
                                    <ArrowLeft size={16} color={C.text} />
                                    <Text style={[s.secondaryBtnText, { color: C.text }]}>BACK</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.primaryBtn, { flex: 1 }]}
                                    onPress={() => navigateStep(4)}
                                >
                                    <Text style={s.primaryBtnText}>CHOOSE MODULES</Text>
                                    <ArrowRight size={16} color="#0a0a0a" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {step === 4 && (
                        /* STEP 4: FEATURES & SUBMISSION */
                        <View style={s.stepWrap}>
                            <View style={s.stepIntro}>
                                <Sliders size={28} color={GOLD} />
                                <Text style={s.stepHeaderTitle}>App Capabilities</Text>
                                <Text style={s.stepHeaderSubtitle}>Toggle guest management features compiled natively inside your custom app environment.</Text>
                            </View>

                            <View style={s.formSection}>
                                <Text style={s.label}>Select Enabled Modules</Text>
                                {FEATURE_OPTIONS.map(opt => {
                                    const isActive = selectedFeatures.includes(opt.id);
                                    const IconComp = opt.icon;
                                    return (
                                        <TouchableOpacity
                                            key={opt.id}
                                            style={[s.featureCard, isActive && s.featureCardActive]}
                                            onPress={() => toggleFeature(opt.id)}
                                            activeOpacity={0.85}
                                        >
                                            <View style={[s.featureIconContainer, isActive && { backgroundColor: `${GOLD}18` }]}>
                                                <IconComp size={20} color={isActive ? GOLD : C.muted} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[s.featureLabel, isActive && { color: GOLD }]}>{opt.label}</Text>
                                                <Text style={s.featureDescText}>{opt.desc}</Text>
                                            </View>
                                            <View style={[s.featureCheckbox, isActive && s.featureCheckboxActive]}>
                                                {isActive && <Check size={10} color="#0a0a0a" strokeWidth={4} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={s.formSection}>
                                <Text style={s.label}>Bespoke Demands & Guidelines</Text>
                                <Text style={s.sectionSub}>Describe custom flight coordination guidelines, layout adjustments, or welcome rules.</Text>
                                <VoiceInput
                                    placeholder="e.g., We require custom greeting screens and airport VIP greetings..."
                                    value={additionalNotes}
                                    onChange={setAdditionalNotes}
                                    accent={GOLD}
                                    textColor={C.text}
                                    border={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                                    inputBg={isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"}
                                />
                            </View>

                            <View style={s.navRow}>
                                <TouchableOpacity style={s.secondaryBtn} onPress={() => navigateStep(3)}>
                                    <ArrowLeft size={16} color={C.text} />
                                    <Text style={[s.secondaryBtnText, { color: C.text }]}>BACK</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.submitBtn, loading && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    activeOpacity={0.8}
                                    disabled={loading}
                                >
                                    <Text style={s.submitText}>{loading ? "COMPILING..." : "SUBMIT APP REQUEST"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                </Animated.View>
            </ScrollView>

            {/* Date Picker Modal */}
            <Modal visible={Platform.OS === "ios" && showDatePicker} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Event Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={eventDate ?? new Date()}
                            mode="date"
                            display="spinner"
                            minimumDate={new Date()}
                            themeVariant={isDark ? "dark" : "light"}
                            style={{ width: "100%" }}
                            onChange={(_, d) => { if (d) setEventDate(d); }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Android Date Picker */}
            {Platform.OS !== "ios" && showDatePicker && (
                <DateTimePicker
                    value={eventDate ?? new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(_, d) => {
                        setShowDatePicker(false);
                        if (d) setEventDate(d);
                    }}
                />
            )}

            {/* Success Alert Modal */}
            {showSuccess && (
                <Modal transparent visible={showSuccess} animationType="fade">
                    <View style={s.overlay}>
                        <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                            <View style={[s.modalIcon, { backgroundColor: `${GOLD}20` }]}>
                                <Check size={32} color={GOLD} />
                            </View>
                            <Text style={s.modalTitle}>Request Received</Text>
                            <Text style={s.modalBody}>
                                Your Lapeq Co-Brand curation request has been successfully submitted. Our event team will review the details and contact you to begin branding.
                            </Text>
                            <TouchableOpacity
                                style={s.modalBtnPri}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowSuccess(false);
                                    router.back();
                                }}
                            >
                                <Text style={s.modalBtnTxPri}>Return Home</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => {
    const isDark = theme === "dark";
    return StyleSheet.create({
        root: { flex: 1 },
        stickyHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
            zIndex: 50,
        },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
        },
        stepProgressContainer: {
            alignItems: "center",
        },
        stepText: {
            fontSize: 9,
            fontWeight: "800",
            color: GOLD,
            letterSpacing: 2,
            marginBottom: 6,
        },
        progressBarBackground: {
            width: 140,
            height: 4,
            borderRadius: 2,
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            overflow: "hidden",
        },
        progressBarFill: {
            height: "100%",
            backgroundColor: GOLD,
            borderRadius: 2,
        },

        stepWrap: {
            paddingHorizontal: 24,
            paddingTop: 16,
        },
        heroCard: {
            height: 220,
            width: "100%",
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 24,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        heroBg: {
            flex: 1,
            justifyContent: "flex-end",
        },
        heroGradient: {
            padding: 20,
            paddingTop: 40,
        },
        heroBadge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            backgroundColor: "rgba(6, 6, 6, 0.6)",
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 8,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: "rgba(201, 168, 76, 0.2)",
        },
        heroBadgeText: {
            color: GOLD,
            fontSize: 9,
            fontWeight: "800",
            letterSpacing: 1.5,
        },
        heroTitle: {
            fontSize: 22,
            fontWeight: "800",
            color: "#ffffff",
            marginBottom: 6,
            letterSpacing: -0.5,
        },
        heroSubtitle: {
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 17,
        },

        stepIntro: {
            alignItems: "center",
            marginBottom: 24,
        },
        stepHeaderTitle: {
            fontSize: 24,
            fontWeight: "800",
            color: C.text,
            textAlign: "center",
            marginTop: 12,
            marginBottom: 6,
        },
        stepHeaderSubtitle: {
            fontSize: 13,
            color: C.muted,
            textAlign: "center",
            lineHeight: 19,
            paddingHorizontal: 12,
        },

        formSection: {
            marginBottom: 24,
        },
        label: {
            fontSize: 11,
            fontWeight: "800",
            color: C.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 12,
        },
        sectionSub: {
            fontSize: 12,
            color: C.muted,
            lineHeight: 18,
            marginBottom: 12,
        },
        input: {
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            borderRadius: 14,
            paddingHorizontal: 18,
            paddingVertical: 15,
            fontSize: 15,
            color: C.text,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
        },
        inputFocused: {
            borderColor: GOLD,
            backgroundColor: isDark ? "rgba(201,168,76,0.03)" : "rgba(201,168,76,0.01)",
        },

        gridRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
        },
        eventCard: {
            width: (SCREEN_WIDTH - 48 - 12) / 2,
            height: 140,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1.5,
            borderColor: "transparent",
        },
        eventCardActive: {
            borderColor: GOLD,
        },
        eventCardGradient: {
            flex: 1,
            padding: 12,
            justifyContent: "space-between",
        },
        checkboxCircle: {
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.4)",
            alignSelf: "flex-end",
            alignItems: "center",
            justifyContent: "center",
        },
        checkboxCircleActive: {
            backgroundColor: GOLD,
            borderColor: GOLD,
        },
        eventName: {
            fontSize: 13,
            fontWeight: "800",
            color: "#ffffff",
            marginBottom: 2,
        },
        eventDesc: {
            fontSize: 10,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 13,
        },

        customDatePickerCard: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        },
        customDatePickerCardActive: {
            borderColor: GOLD,
            backgroundColor: isDark ? "rgba(201,168,76,0.03)" : "rgba(201,168,76,0.01)",
        },
        dateCardLabel: {
            fontSize: 9,
            fontWeight: "700",
            color: C.muted,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 2,
        },
        dateCardValue: {
            fontSize: 14,
            fontWeight: "600",
        },
        dateChangeAction: {
            fontSize: 11,
            fontWeight: "800",
            color: GOLD,
            letterSpacing: 1,
        },

        presetRow: {
            flexDirection: "row",
            gap: 8,
            flexWrap: "wrap",
        },
        presetChip: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
        },
        presetChipActive: {
            borderColor: GOLD,
            backgroundColor: "rgba(201,168,76,0.08)",
        },
        presetChipText: {
            fontSize: 12,
            fontWeight: "700",
            color: C.muted,
        },
        presetChipTextActive: {
            color: GOLD,
        },

        themeConfigContainer: {
            marginBottom: 12,
        },
        paletteGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
        },
        paletteCard: {
            width: (SCREEN_WIDTH - 48 - 10) / 2,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            borderRadius: 14,
            padding: 14,
            borderWidth: 1.5,
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
            alignItems: "center",
            gap: 8,
        },
        paletteCardActive: {
            borderColor: GOLD,
            backgroundColor: "rgba(201,168,76,0.06)",
        },
        colorRow: {
            flexDirection: "row",
            gap: 6,
        },
        colorCircle: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.25)",
        },
        paletteName: {
            fontSize: 12,
            fontWeight: "700",
            color: C.text,
        },

        mockupSection: {
            marginTop: 12,
            alignItems: "center",
            padding: 24,
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
        mockupHeaderLabel: {
            fontSize: 10,
            fontWeight: "900",
            color: GOLD,
            letterSpacing: 2,
            marginBottom: 16,
        },
        phoneMockup: {
            width: 190,
            height: 310,
            borderRadius: 30,
            borderWidth: 5,
            padding: 4,
            overflow: "hidden",
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
        },
        phoneCamera: {
            width: 50,
            height: 12,
            backgroundColor: "#000",
            borderRadius: 6,
            position: "absolute",
            top: 2,
            alignSelf: "center",
            zIndex: 10,
        },
        phoneScreen: {
            flex: 1,
            borderRadius: 24,
            overflow: "hidden",
            paddingTop: 10,
        },
        mockStatusBar: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            alignItems: "center",
            height: 16,
        },
        mockStatusBarText: {
            fontSize: 9,
            fontWeight: "600",
        },
        mockStatusBarIcons: {
            flexDirection: "row",
            gap: 4,
            alignItems: "center",
        },
        mockIconSignal: {
            width: 8,
            height: 8,
            borderRadius: 2,
        },
        mockIconBattery: {
            width: 14,
            height: 8,
            borderWidth: 1,
            borderRadius: 1.5,
        },
        mockAppContent: {
            flex: 1,
            padding: 8,
        },
        mockHeroImg: {
            height: 90,
            width: "100%",
            borderRadius: 12,
            marginBottom: 10,
        },
        mockAppMeta: {
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
        },
        mockEventTitle: {
            fontSize: 10,
            fontWeight: "900",
            textAlign: "center",
            letterSpacing: 0.5,
            marginBottom: 4,
        },
        mockEventTag: {
            fontSize: 8,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 14,
        },
        mockButton: {
            paddingVertical: 6,
            paddingHorizontal: 16,
            borderRadius: 8,
            width: "100%",
            alignItems: "center",
        },
        mockButtonText: {
            fontSize: 8,
            fontWeight: "900",
            letterSpacing: 1,
        },

        featureCard: {
            flexDirection: "row",
            gap: 12,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            marginBottom: 12,
            alignItems: "center",
        },
        featureCardActive: {
            borderColor: GOLD,
            backgroundColor: "rgba(201,168,76,0.06)",
        },
        featureIconContainer: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        },
        featureCheckbox: {
            width: 18,
            height: 18,
            borderRadius: 5,
            borderWidth: 1.5,
            borderColor: C.muted,
            alignItems: "center",
            justifyContent: "center",
        },
        featureCheckboxActive: {
            backgroundColor: GOLD,
            borderColor: GOLD,
        },
        featureLabel: {
            fontSize: 14,
            fontWeight: "800",
            color: C.text,
            marginBottom: 2,
        },
        featureDescText: {
            fontSize: 11,
            color: C.muted,
            lineHeight: 15,
        },

        navRow: {
            flexDirection: "row",
            gap: 12,
            marginTop: 16,
        },
        primaryBtn: {
            flexDirection: "row",
            backgroundColor: GOLD,
            borderRadius: 14,
            paddingVertical: 16,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
        },
        primaryBtnText: {
            color: "#0a0a0a",
            fontSize: 13,
            fontWeight: "800",
            letterSpacing: 0.5,
        },
        disabledBtn: {
            opacity: 0.4,
        },
        secondaryBtn: {
            flexDirection: "row",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            paddingVertical: 16,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
        },
        secondaryBtnText: {
            fontSize: 13,
            fontWeight: "800",
            letterSpacing: 0.5,
        },

        submitBtn: {
            flex: 1,
            backgroundColor: GOLD,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
        },
        submitText: {
            color: "#0a0a0a",
            fontSize: 13,
            fontWeight: "800",
            letterSpacing: 0.5,
        },

        pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
        pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },

        overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 24 },
        modalBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center" },
        modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 24 },
        modalTitle: { color: C.text, fontSize: 24, fontWeight: "800", marginBottom: 12 },
        modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
        modalBtnPri: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: GOLD, alignItems: "center" },
        modalBtnTxPri: { color: "#0a0a0a", fontSize: 15, fontWeight: "700" },
    });
};

