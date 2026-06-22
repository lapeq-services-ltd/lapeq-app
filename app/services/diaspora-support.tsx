import { useState, useMemo, useRef } from "react";
import {
    Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    View, Platform, KeyboardAvoidingView, Modal, Animated, Alert, Keyboard, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Briefcase, Check, FileText, ChevronLeft, ChevronDown, ChevronUp, Search, X, Plus, Minus } from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";

const SUGGESTIONS = [
    { label: "UAE", display: "UAE 🇦🇪" },
    { label: "Australia", display: "Australia 🇦🇺" },
    { label: "South Africa", display: "South Africa 🇿🇦" },
    { label: "Ireland", display: "Ireland 🇮🇪" },
    { label: "Ghana", display: "Ghana 🇬🇭" },
    { label: "Malaysia", display: "Malaysia 🇲🇾" }
];

const getFlagEmoji = (countryName: string) => {
    const list = [
        { name: "Australia", flag: "🇦🇺" },
        { name: "South Africa", flag: "🇿🇦" },
        { name: "Ireland", flag: "🇮🇪" },
        { name: "Ghana", flag: "🇬🇭" },
        { name: "Malaysia", flag: "🇲🇾" },
        { name: "UAE", flag: "🇦🇪" },
        { name: "United Arab Emirates", flag: "🇦🇪" },
        { name: "France", flag: "🇫🇷" },
        { name: "Germany", flag: "🇩🇪" }
    ];
    const found = list.find(x => x.name.toLowerCase() === countryName.trim().toLowerCase());
    return found ? found.flag : "🌍";
};

const { width: W } = Dimensions.get("window");
const GOLD = "#c9a84c";

const PACKAGES = [
    {
        id: "Homecoming Protocol",
        label: "Homecoming VIP Protocol",
        desc: "Return to Nigeria with peace of mind. Complete airport protocol clearance, VIP armored or executive transport (SUV/Sedan), accommodation readiness, and security standby.",
        bullet: "Airport VIP clearance · Escorted transfers · Luxury lodging",
        Icon: Briefcase
    },
    {
        id: "Family Welfare Concierge",
        label: "Family Care & Custodianship",
        desc: "Look after your loved ones remotely. We coordinate healthcare checks, deliver monthly groceries, manage school tuition transfers, and handle emergency family situations on your behalf.",
        bullet: "Family healthcare · Monthly supplies · Emergency support",
        Icon: Check
    },
    {
        id: "Property Custodianship",
        label: "Property & Project Oversight",
        desc: "Protect your real estate investments. We provide independent weekly site visits, photo/video documentation, construction material verification, and property management reports.",
        bullet: "Weekly site visits · Material verification · Drone reports",
        Icon: FileText
    }
];

const IMPORTANT_COUNTRIES = [
    { label: "United States", name: "USA", flag: "🇺🇸" },
    { label: "United Kingdom", name: "UK", flag: "🇬🇧" },
    { label: "Canada", name: "Canada", flag: "🇨🇦" },
    { label: "United Arab Emirates", name: "UAE", flag: "🇦🇪" }
];

const OTHER_COUNTRIES = [
    { label: "Australia", display: "Australia 🇦🇺", name: "Australia", flag: "🇦🇺" },
    { label: "South Africa", display: "South Africa 🇿🇦", name: "South Africa", flag: "🇿🇦" },
    { label: "Ireland", display: "Ireland 🇮🇪", name: "Ireland", flag: "🇮🇪" },
    { label: "Ghana", display: "Ghana 🇬🇭", name: "Ghana", flag: "🇬🇭" },
    { label: "Malaysia", display: "Malaysia 🇲🇾", name: "Malaysia", flag: "🇲🇾" },
    { label: "France", display: "France 🇫🇷", name: "France", flag: "🇫🇷" },
    { label: "Germany", display: "Germany 🇩🇪", name: "Germany", flag: "🇩🇪" },
    { label: "Other", display: "Other 🌍", name: "Other", flag: "🌍" }
];

const ALL_COUNTRIES = [...IMPORTANT_COUNTRIES, ...OTHER_COUNTRIES];

// Stepper formatting function
const formatBudget = (v: number) => v >= 1_000_000
    ? `₦${(v / 1_000_000 % 1 === 0 ? v / 1_000_000 : (v / 1_000_000).toFixed(1))}M`
    : `₦${(v / 1000).toFixed(0)}k`;

function BudgetStepper({ value, onChange, min, step, label, C, theme }: {
    value: number; onChange: (v: number) => void; min: number; step: number; label?: string; C: any; theme: string;
}) {
    const isDark = theme === "dark";
    return (
        <View style={[styles.stepperContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
            <TouchableOpacity
                style={[styles.stepperBtn, { borderColor: C.border, backgroundColor: isDark ? "#1a1a1a" : "#fff" }]}
                onPress={() => onChange(Math.max(min, value - step))}
                activeOpacity={0.8}
            >
                <Minus size={18} color={C.text} />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
                {label && <Text style={{ fontSize: 9, fontWeight: "800", color: C.muted, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>{label}</Text>}
                <Text style={{ fontSize: 24, fontWeight: "800", color: GOLD }}>{formatBudget(value)}</Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>tap +/− to adjust</Text>
            </View>
            <TouchableOpacity
                style={[styles.stepperBtn, { borderColor: C.border, backgroundColor: isDark ? "#1a1a1a" : "#fff" }]}
                onPress={() => onChange(value + step)}
                activeOpacity={0.8}
            >
                <Plus size={18} color={C.text} />
            </TouchableOpacity>
        </View>
    );
}

export default function DiasporaScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [serviceType, setServiceType] = useState("Homecoming Protocol");
    const [country, setCountry] = useState("");
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const [otherCountry, setOtherCountry] = useState("");
    const [pkgExpanded, setPkgExpanded] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState(500000); // Defaults to ₦500k
    const [timeline, setTimeline] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const detailsY = useRef(0);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSelectCountry = (countryLabel: string) => {
        setCountry(countryLabel);
        setIsOtherSelected(false);
        setOtherCountry("");
    };

    const handleSelectOther = () => {
        setCountry("Other");
        setIsOtherSelected(true);
    };

    const handleSubmit = async () => {
        if (!country || (isOtherSelected && !otherCountry.trim()) || !details) {
            setShowError(true);
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const formattedBudget = formatBudget(budgetAmount);
        
        const dbCountry = isOtherSelected ? `Other (${otherCountry.trim()})` : country;

        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "diaspora-support",
            status: "pending",
            reference: ref,
            title: `Diaspora Support - ${serviceType}`,
            details: { package: serviceType, country: dbCountry, budget: formattedBudget, timeline, details },
        });

        setLoading(false);
        if (!error) {
            setShowSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        } else {
            Alert.alert("Submission Failed", error.message);
        }
    };

    return (
        <SafeAreaView style={s.root}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    ref={scrollRef}
                    scrollEnabled={!pkgExpanded}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <ChevronLeft size={22} color={C.text} />
                        <Text style={[s.backText, { color: C.text }]}>Back</Text>
                    </TouchableOpacity>

                    <Text style={[s.title, { color: C.text }]}>Diaspora Support</Text>
                    <Text style={[s.subtitle, { color: C.muted }]}>Remote assistance for Nigerians abroad</Text>

                    {/* Country of Residence Selection (Directly at the Top in Square Grid) */}
                    <View style={s.section}>
                        <Text style={[s.label, { color: C.text }]}>Country of Residence *</Text>
                        <Text style={[s.sectionDesc, { color: C.muted }]}>Where are you requesting this service from?</Text>
                        <View style={s.countryGrid}>
                            {IMPORTANT_COUNTRIES.map((c) => {
                                const isSelected = country === c.label && !isOtherSelected;
                                return (
                                    <TouchableOpacity
                                        key={c.label}
                                        style={[s.countryCard, isSelected && s.countryCardActive]}
                                        onPress={() => handleSelectCountry(c.label)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={s.countryCardFlag}>{c.flag}</Text>
                                        <Text numberOfLines={1} adjustsFontSizeToFit style={[s.countryCardName, { color: C.text }]}>{c.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            <TouchableOpacity
                                style={[s.countryCard, isOtherSelected && s.countryCardActive]}
                                onPress={handleSelectOther}
                                activeOpacity={0.8}
                            >
                                <Text style={s.countryCardFlag}>{isOtherSelected && otherCountry ? getFlagEmoji(otherCountry) : "🌍"}</Text>
                                <Text numberOfLines={1} adjustsFontSizeToFit style={[s.countryCardName, { color: C.text }]}>
                                    {isOtherSelected && otherCountry ? otherCountry : "Other"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Inline Specify Country Input */}
                        {isOtherSelected && (
                            <View style={{ marginTop: 14 }}>
                                <Text style={[s.label, { color: C.text, fontSize: 11 }]}>Specify Country *</Text>
                                <TextInput
                                    style={[s.singleLineInput, { color: C.text, backgroundColor: C.surface, borderColor: showError && !otherCountry.trim() ? "#ef5350" : C.border }]}
                                    placeholder="e.g. Australia, South Africa, UAE..."
                                    placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                                    value={otherCountry}
                                    onChangeText={setOtherCountry}
                                    returnKeyType="done"
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                />
                                {showError && !otherCountry.trim() && (
                                    <Text style={{ color: "#ef5350", fontSize: 12, marginTop: 4 }}>Base country is required.</Text>
                                )}
                                
                                {/* Suggestions */}
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                    {SUGGESTIONS.map(sugg => {
                                        const isSuggSelected = otherCountry.toLowerCase() === sugg.label.toLowerCase();
                                        return (
                                            <TouchableOpacity
                                                key={sugg.label}
                                                style={[
                                                    s.suggestionChip,
                                                    {
                                                        borderColor: isSuggSelected ? GOLD : C.border,
                                                        backgroundColor: isSuggSelected ? `${GOLD}15` : C.surface
                                                    }
                                                ]}
                                                onPress={() => setOtherCountry(sugg.label)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[s.suggestionChipText, { color: isSuggSelected ? GOLD : C.muted }]}>
                                                    {sugg.display}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Package Selection */}
                    <View style={s.section}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text style={[s.label, { color: C.text, marginBottom: 0 }]}>Select Package *</Text>
                            {pkgExpanded && (
                                <TouchableOpacity onPress={() => setPkgExpanded(false)} style={{ padding: 4 }}>
                                    <ChevronUp size={20} color={GOLD} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {!pkgExpanded ? (
                            /* Collapsed state: Render only selected package with a ChevronDown arrow */
                            <View>
                                {(() => {
                                    const selectedPkg = PACKAGES.find(p => p.id === serviceType) || PACKAGES[0];
                                    const IconComponent = selectedPkg.Icon;
                                    return (
                                        <TouchableOpacity
                                            style={[s.packageCard, s.packageCardActive]}
                                            onPress={() => setPkgExpanded(true)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={s.packageHeader}>
                                                <View style={[s.packageIconWrap, s.packageIconWrapActive]}>
                                                    <IconComponent size={18} color={GOLD} />
                                                </View>
                                                <Text style={[s.packageLabel, { color: C.text, flex: 1 }]}>{selectedPkg.label}</Text>
                                                <ChevronDown size={20} color={GOLD} />
                                            </View>
                                            <Text style={[s.packageDesc, { color: C.muted }]}>{selectedPkg.desc}</Text>
                                            <Text style={s.packageBullet}>• {selectedPkg.bullet}</Text>
                                        </TouchableOpacity>
                                    );
                                })()}
                            </View>
                        ) : (
                            /* Expanded state: Render list of all packages */
                            <View style={s.packageList}>
                                {PACKAGES.map((pkg) => {
                                    const isSelected = serviceType === pkg.id;
                                    const IconComponent = pkg.Icon;
                                    return (
                                        <TouchableOpacity
                                            key={pkg.id}
                                            style={[s.packageCard, isSelected && s.packageCardActive]}
                                            onPress={() => {
                                                setServiceType(pkg.id);
                                                setPkgExpanded(false);
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <View style={s.packageHeader}>
                                                <View style={[s.packageIconWrap, isSelected && s.packageIconWrapActive]}>
                                                    <IconComponent size={18} color={isSelected ? GOLD : C.text} />
                                                </View>
                                                <Text style={[s.packageLabel, { color: C.text, flex: 1 }]}>{pkg.label}</Text>
                                                {isSelected && <Check size={16} color={GOLD} />}
                                            </View>
                                            <Text style={[s.packageDesc, { color: C.muted }]}>{pkg.desc}</Text>
                                            <Text style={s.packageBullet}>• {pkg.bullet}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Estimated Budget Stepper */}
                    <View style={s.section}>
                        <Text style={[s.label, { color: C.text }]}>Estimated Budget *</Text>
                        <BudgetStepper
                            value={budgetAmount}
                            onChange={setBudgetAmount}
                            min={250000} // Minimum ₦250k
                            step={250000} // Increment by ₦250k
                            label="Estimated Service Budget"
                            C={C}
                            theme={theme}
                        />
                    </View>

                    {/* Timeline */}
                    <View style={s.section}>
                        <Text style={[s.label, { color: C.text }]}>Timeline</Text>
                        <TextInput
                            style={[s.input, { color: C.text }]}
                            placeholder="e.g. Within 2 weeks"
                            placeholderTextColor={C.muted}
                            value={timeline}
                            onChangeText={setTimeline}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                    </View>

                    {/* Details input with VoiceInput */}
                    <View style={s.section}>
                        <Text style={[s.label, { color: C.text }]} onLayout={e => { detailsY.current = e.nativeEvent.layout.y; }}>
                            Details *
                        </Text>
                        <VoiceInput
                            placeholder="Describe what you need help with in detail..."
                            value={details}
                            onChange={setDetails}
                            accent={GOLD}
                            textColor={C.text}
                            border={showError && !details ? "#ef5350" : C.border}
                            inputBg={C.surface}
                        />
                    </View>

                    {showError && (!country || (isOtherSelected && !otherCountry.trim()) || !details) && (
                        <Text style={s.errorText}>Please fill in all required fields.</Text>
                    )}

                    <TouchableOpacity
                        style={[s.btn, loading && s.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <Text style={[s.btnText, { color: C.background }]}>
                            {loading ? "Submitting..." : "Submit Request"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={s.modalIcon}><Check size={24} color={C.primary} strokeWidth={2.5} /></View>
                        <Text style={s.modalTitle}>Request Submitted</Text>
                        <Text style={s.modalBody}>Your concierge will be in touch shortly.</Text>
                        <TouchableOpacity
                            style={s.modalBtnPri}
                            onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}
                            activeOpacity={0.85}
                        >
                            <Text style={s.modalBtnTxPri}>View Request Status</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.modalBtnSec}
                            onPress={() => { setShowSuccess(false); router.back(); }}
                            activeOpacity={0.7}
                        >
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => {
    const isDark = theme === "dark";
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20 },
        backBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 4 },
        backText: { fontSize: 14, fontWeight: "500" },
        title: { fontSize: 24, fontWeight: "700", marginBottom: 4, fontFamily: "PlayfairDisplay_700Bold" },
        subtitle: { fontSize: 13, marginBottom: 28 },
        section: { marginBottom: 24 },
        sectionDesc: { fontSize: 12, marginBottom: 12 },
        label: { fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
        input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, marginBottom: 18 },
        inputError: { borderColor: "#ef5350" },
        errorText: { fontSize: 13, color: "#ef5350", marginBottom: 12, textAlign: "center" },
        btn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
        btnDisabled: { opacity: 0.6 },
        btnText: { fontSize: 15, fontWeight: "700" },

        // Specify country input styles
        singleLineInput: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, marginTop: 6 },
        suggestionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
        suggestionChipText: { fontSize: 12, fontWeight: "600" },

        // Square country cards layout styling
        countryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
        countryCard: {
            width: (W - 40 - 32) / 5, // 5 columns with 8px gaps (total gaps is 32px)
            height: 72, // taller to fit larger emojis and bolder texts
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.surface,
            alignItems: "center",
            justifyContent: "center",
            padding: 2
        },
        countryCardActive: {
            borderColor: GOLD,
            backgroundColor: isDark ? "rgba(201, 168, 76, 0.04)" : "rgba(201, 168, 76, 0.02)"
        },
        countryCardFlag: { fontSize: 26, marginBottom: 2 },
        countryCardName: { fontSize: 9.5, fontWeight: "700", textAlign: "center" },
        
        // Packages selection styling
        packageList: { gap: 12 },
        packageCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16 },
        packageCardActive: { borderColor: GOLD, backgroundColor: isDark ? "rgba(201, 168, 76, 0.04)" : "rgba(201, 168, 76, 0.02)" },
        packageHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
        packageIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: isDark ? "#1e1e1e" : "#e8e2d8", justifyContent: "center", alignItems: "center" },
        packageIconWrapActive: { backgroundColor: "rgba(201, 168, 76, 0.12)" },
        packageLabel: { fontSize: 15, fontWeight: "700" },
        packageDesc: { fontSize: 12, lineHeight: 18, marginBottom: 6 },
        packageBullet: { fontSize: 12, color: GOLD, fontWeight: "600" },

        // Country picker modal styling
        modalRoot: { flex: 1, paddingTop: 10 },
        modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
        modalTitleText: { fontSize: 18, fontWeight: "700" },
        modalClose: { padding: 4 },
        searchBarWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, marginHorizontal: 20, marginBottom: 14, height: 44 },
        searchBarInput: { flex: 1, fontSize: 14, paddingHorizontal: 10 },
        countryItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
        countryItemActive: { backgroundColor: isDark ? "rgba(201, 168, 76, 0.05)" : "rgba(201, 168, 76, 0.02)" },
        countryText: { fontSize: 15 },

        // Success dialog styling
        overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
        modalBox: { width: "100%", backgroundColor: C.background, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: C.primary, alignItems: "center" },
        modalIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? "#1e1e1e" : "#e8e2d8", justifyContent: "center", alignItems: "center", marginBottom: 20 },
        modalTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
        modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
        modalBtnPri: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary, alignItems: "center" },
        modalBtnTxPri: { color: C.background, fontSize: 14, fontWeight: "700" },
        modalBtnSec: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
        modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" }
    });
};

const styles = StyleSheet.create({
    stepperContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1
    },
    stepperBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center"
    }
});
