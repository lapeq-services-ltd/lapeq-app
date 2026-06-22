import { useState, useMemo, useRef } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Animated, Alert, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Check, Minus, Plus, ChevronDown } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

const GOLD = "#c9a84c";

function DropDown({ value, options, onSelect, placeholder, C, theme }: any) {
    const [open, setOpen] = useState(false);
    return (
        <View style={{ zIndex: 10 }}>
            <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: value ? GOLD : (theme === "dark" ? "#2a2a2a" : "#e0dbd2") }}
                onPress={() => setOpen(!open)}
                activeOpacity={0.8}
            >
                <Text style={{ fontSize: 15, color: value ? C.text : C.muted, fontWeight: value ? "600" : "400" }}>{value || placeholder}</Text>
                <ChevronDown size={16} color={value ? GOLD : C.muted} />
            </TouchableOpacity>
            {open && (
                <View style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", marginTop: 4, overflow: "hidden", elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                    {options.map((opt: string, i: number) => (
                        <TouchableOpacity
                            key={opt}
                            style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: theme === "dark" ? "#1a1a1a" : "#f0ece6" }}
                            onPress={() => { onSelect(opt); setOpen(false); }}
                            activeOpacity={0.7}
                        >
                            <Text style={{ fontSize: 15, color: opt === value ? GOLD : C.text, fontWeight: opt === value ? "700" : "400" }}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const NEED_TYPES = ["Buy Property", "Rent / Lease", "Interior Design", "Property Management", "Short-Let Sourcing", "Land Acquisition"];
const PROP_TYPES = ["Apartment", "Duplex / Townhouse", "Detached House", "Commercial Space", "Land", "Villa / Estate"];
const BUDGETS = ["Under ₦15M", "₦15M – ₦50M", "₦50M – ₦200M", "₦200M+", "Open Budget"];
const LOCATIONS = ["Lagos", "Abuja", "Port Harcourt", "Akwa Ibom", "Kano"];
const TIMELINES = ["ASAP", "1 – 3 months", "3 – 6 months", "6 months+", "Just browsing"];

export default function PropertyScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [needType, setNeedType] = useState("");
    const [propType, setPropType] = useState("");
    const [bedrooms, setBedrooms] = useState(0);
    const [budget, setBudget] = useState("");
    const [location, setLocation] = useState("");
    const [timeline, setTimeline] = useState("");
    const [requirements, setRequirements] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const isDesign = needType === "Interior Design" || needType === "Property Management";

    const handleSubmit = async () => {
        if (!needType) { Alert.alert("Select Need", "Please choose what you're looking for."); return; }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "lifestyle-property",
            status: "pending",
            reference: ref,
            title: `Property - ${needType}`,
            details: { needType, propType, bedrooms, budget, location, timeline, requirements },
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
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 80 }}>

                    <View style={s.hero}>
                        <Image source={require("@/assets/images/lagos-hotel.jpg")} style={s.heroImg} resizeMode="cover" />
                        <View style={s.heroScrim} />
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={s.heroContent}>
                            <Text style={s.heroEyebrow}>REAL ESTATE & DESIGN</Text>
                            <Text style={s.heroTitle}>Home & Property</Text>
                            <Text style={s.heroSub}>Finding and curating the perfect space for you.</Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>What do you need?</Text>
                        <View style={s.wrapRow}>
                            {NEED_TYPES.map(n => (
                                <TouchableOpacity key={n} style={[s.chip, needType === n && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setNeedType(n)} activeOpacity={0.8}>
                                    <Text style={[s.chipText, needType === n && { color: "#0a0a0a", fontWeight: "700" }]}>{n}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {!isDesign && (
                        <>
                            <View style={[s.section, { zIndex: 10 }]}>
                                <Text style={s.label}>Property Type</Text>
                                <DropDown
                                    value={propType}
                                    options={PROP_TYPES}
                                    onSelect={setPropType}
                                    placeholder="Select property type..."
                                    C={C}
                                    theme={theme}
                                />
                            </View>

                            <View style={s.section}>
                                <Text style={s.label}>Bedrooms</Text>
                                <View style={s.stepperRow}>
                                    <TouchableOpacity style={s.stepBtn} onPress={() => setBedrooms(b => Math.max(0, b - 1))} activeOpacity={0.8}>
                                        <Minus size={18} color={C.text} />
                                    </TouchableOpacity>
                                    <Text style={s.stepVal}>{bedrooms === 0 ? "Any" : bedrooms}</Text>
                                    <TouchableOpacity style={s.stepBtn} onPress={() => setBedrooms(b => Math.min(10, b + 1))} activeOpacity={0.8}>
                                        <Plus size={18} color={C.text} />
                                    </TouchableOpacity>
                                    {bedrooms > 0 && <Text style={s.stepLabel}>{bedrooms === 1 ? "bedroom" : "bedrooms"}</Text>}
                                </View>
                            </View>

                            <View style={s.section}>
                                <Text style={s.label}>Budget Range</Text>
                                <View style={s.wrapRow}>
                                    {BUDGETS.map(b => (
                                        <TouchableOpacity key={b} style={[s.chip, budget === b && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setBudget(b)} activeOpacity={0.8}>
                                            <Text style={[s.chipText, budget === b && { color: "#0a0a0a", fontWeight: "700" }]}>{b}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}

                    <View style={s.section}>
                        <Text style={s.label}>Location</Text>
                        <View style={s.wrapRow}>
                            {LOCATIONS.map(loc => {
                                const isAvailable = loc === "Lagos" || loc === "Abuja";
                                const displayLabel = isAvailable ? loc : `${loc} (Coming Soon)`;
                                return (
                                    <TouchableOpacity key={loc} style={[s.chip, location === loc && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setLocation(loc)} activeOpacity={0.8}>
                                        <Text style={[s.chipText, location === loc && { color: "#0a0a0a", fontWeight: "700" }]}>{displayLabel}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Timeline</Text>
                        <View style={s.wrapRow}>
                            {TIMELINES.map(t => (
                                <TouchableOpacity key={t} style={[s.chip, timeline === t && { backgroundColor: GOLD, borderColor: GOLD }]} onPress={() => setTimeline(t)} activeOpacity={0.8}>
                                    <Text style={[s.chipText, timeline === t && { color: "#0a0a0a", fontWeight: "700" }]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Specific Requirements</Text>
                        <VoiceInput
                            placeholder="Neighbourhood preferences, must-haves, style references, security requirements..."
                            value={requirements}
                            onChange={setRequirements}
                            accent={GOLD}
                            textColor={C.text}
                            border={isDark ? "#2a2a2a" : "#e0dbd2"}
                            inputBg={C.surface}
                        />
                    </View>

                    <View style={s.feeCard}>
                        <Text style={s.feeEyebrow}>SERVICE FEE</Text>
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                            <Text style={s.feeAmount}>₦5,000</Text>
                            <Text style={s.feeNote}>per request</Text>
                        </View>
                        <Text style={s.feeSub}>Collected upon confirmation of your request.</Text>
                    </View>

                    <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
                        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                            <Text style={s.submitText}>{loading ? "Submitting..." : "Submit Request"}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIcon, { backgroundColor: `${GOLD}18` }]}><Check size={28} color={GOLD} strokeWidth={2} /></View>
                        <Text style={s.modalTitle}>Request Received</Text>
                        <Text style={s.modalBody}>Our property team will be in touch with curated options matching your brief.</Text>
                        <TouchableOpacity style={s.modalBtnPri} onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}>
                            <Text style={s.modalBtnTxPri}>View Request</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSec} onPress={() => { setShowSuccess(false); router.back(); router.back(); }}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    hero: { height: 260, position: "relative" },
    heroImg: { width: "100%", height: "100%", position: "absolute" },
    heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.52)" },
    backBtn: { position: "absolute", top: 16, left: 20, width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    heroContent: { position: "absolute", bottom: 28, left: 24, right: 24 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 32, fontWeight: "700", color: "#fff", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
    heroSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "PlayfairDisplay_400Regular_Italic" },
    section: { paddingHorizontal: 24, paddingTop: 28 },
    label: { fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 },
    wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    stepperRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    stepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    stepVal: { fontSize: 22, fontWeight: "700", color: C.text, minWidth: 48, textAlign: "center" },
    stepLabel: { fontSize: 14, color: C.muted },
    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 18, fontSize: 15, color: C.text, minHeight: 130, lineHeight: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    feeCard: { marginHorizontal: 24, marginTop: 28, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` },
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
});
