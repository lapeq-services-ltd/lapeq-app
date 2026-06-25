import { useState, useMemo, useRef } from "react";
import {
    Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    View, Platform, KeyboardAvoidingView, Modal, Animated, Alert, Keyboard, Dimensions, Switch, Image
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Briefcase, Check, FileText, ChevronLeft, ChevronDown, ChevronUp, Globe, Heart, Home, Minus, Plus } from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";

const SUGGESTIONS = [
    { label: "UAE", display: "UAE 🇦🇪" },
    { label: "Malaysia", display: "Malaysia 🇲🇾" },
    { label: "France", display: "France 🇫🇷" },
    { label: "Germany", display: "Germany 🇩🇪" },
    { label: "Netherlands", display: "Netherlands 🇳🇱" },
    { label: "Qatar", display: "Qatar 🇶🇦" },
    { label: "Saudi Arabia", display: "Saudi Arabia 🇸🇦" },
    { label: "Kenya", display: "Kenya 🇰🇪" }
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
        Icon: Heart
    },
    {
        id: "Property Custodianship",
        label: "Property & Project Oversight",
        desc: "Protect your real estate investments. We provide independent weekly site visits, photo/video documentation, construction material verification, and property management reports.",
        bullet: "Weekly site visits · Material verification · Drone reports",
        Icon: Home
    }
];

const COUNTRIES = [
    { label: "United States", name: "USA", flag: "🇺🇸" },
    { label: "United Kingdom", name: "UK", flag: "🇬🇧" },
    { label: "Canada", name: "Canada", flag: "🇨🇦" },
    { label: "Australia", name: "Australia", flag: "🇦🇺" },
    { label: "South Africa", name: "South Africa", flag: "🇿🇦" },
    { label: "Ireland", name: "Ireland", flag: "🇮🇪" },
    { label: "Ghana", name: "Ghana", flag: "🇬🇭" },
    { label: "Other", name: "Other", flag: "🌍" }
];

const TIMELINE_OPTIONS = [
    { label: "Immediate", value: "Immediate (< 1 week)" },
    { label: "1-4 Weeks", value: "Within 2-4 weeks" },
    { label: "1-3 Months", value: "Within 1-3 months" },
    { label: "Flexible", value: "Flexible / Ongoing" }
];

// Stepper formatting function
const formatBudget = (v: number) => v >= 10_000_000
    ? "Above ₦10 Million"
    : v >= 1_000_000
    ? `₦${(v / 1_000_000 % 1 === 0 ? v / 1_000_000 : (v / 1_000_000).toFixed(1))}M`
    : `₦${(v / 1000).toFixed(0)}k`;

function BudgetStepper({ value, onChange, min, step, label, C, theme }: {
    value: number; onChange: (v: number) => void; min: number; step: number; label?: string; C: any; theme: string;
}) {
    const isDark = theme === "dark";
    const border = isDark ? "rgba(255,255,255,0.09)" : "#e0dbd2";
    const isMax = value >= 10000000;
    return (
        <View style={[styles.stepperContainer, { backgroundColor: C.surface, borderColor: border }]}>
            <TouchableOpacity
                style={[styles.stepperBtn, { borderColor: border, backgroundColor: isDark ? "#1a1a1a" : "#fff" }]}
                onPress={() => onChange(Math.max(min, value - step))}
                activeOpacity={0.8}
            >
                <Minus size={18} color={C.text} />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
                {label && <Text style={{ fontSize: 9, fontWeight: "800", color: C.muted, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>{label}</Text>}
                <Text style={{ fontSize: 24, fontWeight: "800", color: GOLD }}>{formatBudget(value)}</Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                    {isMax ? "maximum budget reached" : "tap +/− to adjust"}
                </Text>
            </View>
            <TouchableOpacity
                style={[styles.stepperBtn, { borderColor: border, backgroundColor: isDark ? "#1a1a1a" : "#fff", opacity: isMax ? 0.4 : 1 }]}
                onPress={() => { if (!isMax) onChange(value + step); }}
                activeOpacity={0.8}
                disabled={isMax}
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
    const border = isDark ? "rgba(255,255,255,0.09)" : "#e0dbd2";

    const [serviceType, setServiceType] = useState("Homecoming Protocol");
    const [country, setCountry] = useState("");
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const [otherCountry, setOtherCountry] = useState("");
    const [pkgExpanded, setPkgExpanded] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState(500000); // Defaults to ₦500k
    const [timeline, setTimeline] = useState(TIMELINE_OPTIONS[1].value); // Defaults to 1-4 weeks
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Homecoming Sub-options
    const [hcClearance, setHcClearance] = useState(true);
    const [hcSecurity, setHcSecurity] = useState(false);
    const [hcTransit, setHcTransit] = useState(false);
    const [hcLodging, setHcLodging] = useState(false);

    // Family Care Sub-options
    const [fcMedical, setFcMedical] = useState(true);
    const [fcGrocery, setFcGrocery] = useState(false);
    const [fcTuition, setFcTuition] = useState(false);
    const [fcEmergency, setFcEmergency] = useState(false);

    // Property Custodianship Sub-options
    const [poInspections, setPoInspections] = useState(true);
    const [poDrone, setPoDrone] = useState(false);
    const [poAudit, setPoAudit] = useState(false);
    const [poLegal, setPoLegal] = useState(false);

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

    const hideSuccessAndGo = () => {
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(alertScale, { toValue: 0.9, duration: 200, useNativeDriver: true })
        ]).start(() => {
            setShowSuccess(false);
            router.back();
        });
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

        const detailsPayload: Record<string, any> = {
            package: serviceType,
            country: dbCountry,
            budget: formattedBudget,
            timeline,
            details
        };

        // Enrich details with selected sub-options checkmarks
        if (serviceType === "Homecoming Protocol") {
            detailsPayload.options = {
                "VIP Airport Protocol": hcClearance,
                "Armed Escort Standby": hcSecurity,
                "Luxury SUV Transit": hcTransit,
                "Villa Booking": hcLodging
            };
        } else if (serviceType === "Family Welfare Concierge") {
            detailsPayload.options = {
                "Elderly Medical Checks": fcMedical,
                "Monthly Groceries": fcGrocery,
                "School Fees Liaison": fcTuition,
                "Emergency Cash Standby": fcEmergency
            };
        } else if (serviceType === "Property Custodianship") {
            detailsPayload.options = {
                "Weekly Site Visits": poInspections,
                "Drone Video Reports": poDrone,
                "Materials Verification": poAudit,
                "Title & Legal Due Diligence": poLegal
            };
        }

        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "diaspora-support",
            status: "pending",
            reference: ref,
            title: `Diaspora Support - ${serviceType}`,
            details: detailsPayload,
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
        <SafeAreaView style={[s.root, { backgroundColor: C.background }]} edges={["top"]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    ref={scrollRef}
                    scrollEnabled={!pkgExpanded}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{ paddingBottom: 60 }}
                >
                    {/* Header */}
                    <View style={s.header}>
                        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                            <ChevronLeft size={20} color={C.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.eyebrow, { color: GOLD }]}>GLOBAL RELATIONS</Text>
                            <Text style={[s.titleText, { color: C.text }]}>Diaspora Support</Text>
                        </View>
                    </View>

                    {/* Flashy Hero Banner */}
                    <View style={[s.hero, { backgroundColor: isDark ? "#05070f" : "#0d111d" }]}>
                        <Image source={require("@/assets/images/diaspora-header.jpg")} style={s.heroImg} resizeMode="cover" />
                        <View style={s.heroScrim} />
                        <View style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
                            <Text style={s.heroEyebrow}>GLOBAL CONCIERGE</Text>
                            <Text style={s.heroTitle}>The bridge to home.</Text>
                            <Text style={s.heroDesc}>Elite on-ground services, caretakership, and asset oversight in Nigeria while you are away.</Text>
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 20 }}>
                        {/* Country of Residence Selection */}
                        <View style={s.section}>
                            <Text style={[s.label, { color: C.text }]}>Country of Residence *</Text>
                            <Text style={[s.sectionDesc, { color: C.muted }]}>Select the country you are requesting from:</Text>
                            <View style={s.countryGrid}>
                                {COUNTRIES.map((c) => {
                                    const isSelected = c.label === "Other" ? isOtherSelected : (country === c.label && !isOtherSelected);
                                    return (
                                        <TouchableOpacity
                                            key={c.label}
                                            style={[s.countryCard, { borderColor: border }, isSelected && s.countryCardActive]}
                                            onPress={() => c.label === "Other" ? handleSelectOther() : handleSelectCountry(c.label)}
                                            activeOpacity={0.8}
                                        >
                                            {isSelected && (
                                                <View style={s.activeBadge}>
                                                    <Check size={9} color={C.black} strokeWidth={4} />
                                                </View>
                                            )}
                                            <Text style={s.countryCardFlag}>
                                                {c.label === "Other" && isOtherSelected && otherCountry ? getFlagEmoji(otherCountry) : c.flag}
                                            </Text>
                                            <Text numberOfLines={1} adjustsFontSizeToFit style={[s.countryCardName, { color: C.text }]}>
                                                {c.label === "Other" && isOtherSelected && otherCountry ? otherCountry : c.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Specify Country Input */}
                            {isOtherSelected && (
                                <View style={{ marginTop: 14 }}>
                                    <Text style={[s.label, { color: C.text, fontSize: 11 }]}>Specify Country *</Text>
                                    <TextInput
                                        style={[s.singleLineInput, { color: C.text, backgroundColor: C.surface, borderColor: showError && !otherCountry.trim() ? "#ef5350" : border }]}
                                        placeholder="e.g. Australia, South Africa, UAE..."
                                        placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                                        value={otherCountry}
                                        onChangeText={setOtherCountry}
                                        returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                    {showError && !otherCountry.trim() && (
                                        <Text style={{ color: "#ef5350", fontSize: 12, marginTop: 4 }}>Base country name is required.</Text>
                                    )}
                                    
                                    {/* Suggestions */}
                                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                        {SUGGESTIONS.filter(sugg => {
                                            const isAlreadyVisible = COUNTRIES.some(c => 
                                                c.label !== "Other" && 
                                                (c.label.toLowerCase() === sugg.label.toLowerCase() || 
                                                 c.name.toLowerCase() === sugg.label.toLowerCase())
                                            );
                                            return !isAlreadyVisible;
                                        }).map(sugg => {
                                            const isSuggSelected = otherCountry.toLowerCase() === sugg.label.toLowerCase();
                                            return (
                                                <TouchableOpacity
                                                    key={sugg.label}
                                                    style={[
                                                        s.suggestionChip,
                                                        {
                                                            borderColor: isSuggSelected ? GOLD : border,
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
                                <Text style={[s.label, { color: C.text, marginBottom: 0 }]}>Concierge Services *</Text>
                                {pkgExpanded && (
                                    <TouchableOpacity onPress={() => setPkgExpanded(false)} style={{ padding: 4 }}>
                                        <ChevronUp size={20} color={GOLD} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {!pkgExpanded ? (
                                /* Collapsed selected card */
                                <View>
                                    {(() => {
                                        const selectedPkg = PACKAGES.find(p => p.id === serviceType) || PACKAGES[0];
                                        const IconComponent = selectedPkg.Icon;
                                        return (
                                            <TouchableOpacity
                                                style={[s.packageCard, { borderColor: border }, s.packageCardActive]}
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
                                /* Expanded package choices */
                                <View style={s.packageList}>
                                    {PACKAGES.map((pkg) => {
                                        const isSelected = serviceType === pkg.id;
                                        const IconComponent = pkg.Icon;
                                        return (
                                            <TouchableOpacity
                                                key={pkg.id}
                                                style={[s.packageCard, { borderColor: border }, isSelected && s.packageCardActive]}
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

                            {/* ── EXPANDABLE DETAILED CHECKLIST SUB-OPTIONS ── */}
                            {!pkgExpanded && (
                                <View style={[s.subOptionsCard, { borderColor: border }]}>
                                    <Text style={s.subOptionsTitle}>
                                        {serviceType === "Homecoming Protocol" && "Homecoming custom add-ons"}
                                        {serviceType === "Family Welfare Concierge" && "Family Care custom add-ons"}
                                        {serviceType === "Property Custodianship" && "Oversight custom add-ons"}
                                    </Text>
                                    
                                    {serviceType === "Homecoming Protocol" && (
                                        <View style={{ gap: 4 }}>
                                            <View style={s.toggleRow}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Airport VIP Protocol</Text>
                                                    <Text style={s.toggleSub}>Fast-track clearance & customs liaison</Text>
                                                </View>
                                                <Switch value={hcClearance} onValueChange={setHcClearance} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={hcClearance ? GOLD : "#888"} />
                                            </View>
                                            <View style={s.toggleRow}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Armed Security Escort</Text>
                                                    <Text style={s.toggleSub}>Professional escorts & executive protection detail</Text>
                                                </View>
                                                <Switch value={hcSecurity} onValueChange={setHcSecurity} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={hcSecurity ? GOLD : "#888"} />
                                            </View>
                                            <View style={s.toggleRow}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Luxury SUV / Transit</Text>
                                                    <Text style={s.toggleSub}>Private premium road transit arrangements</Text>
                                                </View>
                                                <Switch value={hcTransit} onValueChange={setHcTransit} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={hcTransit ? GOLD : "#888"} />
                                            </View>
                                            <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Villa / Lodging Coordination</Text>
                                                    <Text style={s.toggleSub}>Secure hotel booking or private residence setup</Text>
                                                </View>
                                                <Switch value={hcLodging} onValueChange={setHcLodging} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={hcLodging ? GOLD : "#888"} />
                                            </View>
                                        </View>
                                    )}

                                    {serviceType === "Family Welfare Concierge" && (
                                        <View style={{ gap: 4 }}>
                                            <View style={s.toggleRow}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Elderly Medical Checkups</Text>
                                                    <Text style={s.toggleSub}>Scheduled health evaluations & clinical reports</Text>
                                                </View>
                                                <Switch value={fcMedical} onValueChange={setFcMedical} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={fcMedical ? GOLD : "#888"} />
                                            </View>
                                            <View style={s.toggleRow}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Grocery & Provisions Delivery</Text>
                                                    <Text style={s.toggleSub}>Monthly delivery of food supplies & essentials</Text>
                                                </View>
                                                <Switch value={fcGrocery} onValueChange={setFcGrocery} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={fcGrocery ? GOLD : "#888"} />
                                            </View>
                                            <View style={s.toggleRow}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>School Fees liaison</Text>
                                                    <Text style={s.toggleSub}>Direct tuition payments & school administration support</Text>
                                                </View>
                                                <Switch value={fcTuition} onValueChange={setFcTuition} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={fcTuition ? GOLD : "#888"} />
                                            </View>
                                            <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Emergency Cash Coordination</Text>
                                                    <Text style={s.toggleSub}>A standby emergency cash reserve fund for your family</Text>
                                                </View>
                                                <Switch value={fcEmergency} onValueChange={setFcEmergency} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={fcEmergency ? GOLD : "#888"} />
                                            </View>
                                        </View>
                                    )}

                                    {serviceType === "Property Custodianship" && (
                                        <View style={{ gap: 4 }}>
                                            <View style={s.toggleRow}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Weekly Construction Inspections</Text>
                                                    <Text style={s.toggleSub}>Site visits with visual photographic documentation</Text>
                                                </View>
                                                <Switch value={poInspections} onValueChange={setPoInspections} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={poInspections ? GOLD : "#888"} />
                                            </View>
                                            <View style={s.toggleRow}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Arial Drone Video Reports</Text>
                                                    <Text style={s.toggleSub}>High-resolution aerial construction footage</Text>
                                                </View>
                                                <Switch value={poDrone} onValueChange={setPoDrone} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={poDrone ? GOLD : "#888"} />
                                            </View>
                                            <View style={s.toggleRow}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Materials Quality Verification</Text>
                                                    <Text style={s.toggleSub}>Audit raw material inventory purchase vs usage specs</Text>
                                                </View>
                                                <Switch value={poAudit} onValueChange={setPoAudit} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={poAudit ? GOLD : "#888"} />
                                            </View>
                                            <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
                                                <View style={{ flex: 1, paddingRight: 10 }}>
                                                    <Text style={[s.toggleLabel, { color: C.text }]}>Title Verification & Due Diligence</Text>
                                                    <Text style={s.toggleSub}>Registry boundary checks & property background research</Text>
                                                </View>
                                                <Switch value={poLegal} onValueChange={setPoLegal} trackColor={{ false: border, true: `${GOLD}80` }} thumbColor={poLegal ? GOLD : "#888"} />
                                            </View>
                                        </View>
                                    )}
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

                        {/* Segmented Timeline Selector */}
                        <View style={s.section}>
                            <Text style={[s.label, { color: C.text }]}>Required Timeline</Text>
                            <View style={s.timelineRow}>
                                {TIMELINE_OPTIONS.map(opt => {
                                    const active = timeline === opt.value;
                                    return (
                                        <TouchableOpacity
                                            key={opt.label}
                                            style={[s.timelineChip, { borderColor: border }, active && s.timelineChipActive]}
                                            onPress={() => setTimeline(opt.value)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[s.timelineChipText, { color: active ? C.black : C.muted }]}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Details input with VoiceInput */}
                        <View style={s.section}>
                            <Text style={[s.label, { color: C.text }]} onLayout={e => { detailsY.current = e.nativeEvent.layout.y; }}>
                                Additional Details *
                            </Text>
                            <VoiceInput
                                placeholder="Describe what you need help with in detail..."
                                value={details}
                                onChange={setDetails}
                                accent={GOLD}
                                textColor={C.text}
                                border={showError && !details ? "#ef5350" : border}
                                inputBg={C.surface}
                            />
                        </View>

                        {showError && (!country || (isOtherSelected && !otherCountry.trim()) || !details) && (
                            <Text style={s.errorText}>Please fill in all required fields.</Text>
                        )}

                        <TouchableOpacity
                            style={[s.btn, { backgroundColor: C.primary }, loading && s.btnDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <Text style={[s.btnText, { color: C.black }]}>
                                {loading ? "Submitting..." : "Submit Request"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIcon, { backgroundColor: `${GOLD}18` }]}><Check size={24} color={GOLD} strokeWidth={2.5} /></View>
                        <Text style={[s.modalTitle, { color: C.text }]}>Request Submitted</Text>
                        <Text style={[s.modalBody, { color: C.muted }]}>Your global concierge advisor will review details and confirm on-ground logistics shortly.</Text>
                        <TouchableOpacity
                            style={[s.modalBtnPri, { backgroundColor: GOLD }]}
                            onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}
                            activeOpacity={0.85}
                        >
                            <Text style={[s.modalBtnTxPri, { color: C.background }]}>View Request Status</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.modalBtnSec}
                            onPress={hideSuccessAndGo}
                            activeOpacity={0.7}
                        >
                            <Text style={[s.modalBtnTxSec, { color: C.muted }]}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => {
    const isDark = theme === "dark";
    const border = isDark ? "rgba(255,255,255,0.09)" : "#e0dbd2";
    return StyleSheet.create({
        root: { flex: 1 },
        header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 14 },
        backBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: border, alignItems: "center", justifyContent: "center" },
        eyebrow: { fontSize: 9, fontWeight: "700", letterSpacing: 2.5, marginBottom: 2 },
        titleText: { fontSize: 24, fontWeight: "700", marginBottom: 2 },
        section: { marginBottom: 24 },
        sectionDesc: { fontSize: 12, marginBottom: 12 },
        label: { fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },
        errorText: { fontSize: 13, color: "#ef5350", marginBottom: 12, textAlign: "center", fontWeight: "600" },
        btn: { borderRadius: 14, padding: 18, alignItems: "center", marginTop: 8 },
        btnDisabled: { opacity: 0.6 },
        btnText: { fontSize: 15, fontWeight: "700" },

        // Specify country input styles
        singleLineInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, marginTop: 6 },
        suggestionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
        suggestionChipText: { fontSize: 12, fontWeight: "600" },

        // Country grid selector
        countryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
        countryCard: {
            width: (W - 40 - 24) / 4, // 4 columns with 8px gaps (total gaps is 24px)
            height: 76,
            borderRadius: 14,
            borderWidth: 1,
            backgroundColor: C.surface,
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
            position: "relative"
        },
        countryCardActive: {
            borderColor: GOLD,
            backgroundColor: isDark ? "rgba(201, 168, 76, 0.06)" : "rgba(201, 168, 76, 0.02)"
        },
        activeBadge: {
            position: "absolute",
            top: 6,
            right: 6,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: GOLD,
            alignItems: "center",
            justifyContent: "center"
        },
        countryCardFlag: { fontSize: 26, marginBottom: 2 },
        countryCardName: { fontSize: 9.5, fontWeight: "700", textAlign: "center" },
        
        // Packages selection styling
        packageList: { gap: 12 },
        packageCard: { backgroundColor: C.surface, borderWidth: 1, borderRadius: 16, padding: 16 },
        packageCardActive: { borderColor: GOLD, backgroundColor: isDark ? "rgba(201, 168, 76, 0.04)" : "rgba(201, 168, 76, 0.02)" },
        packageHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
        packageIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: isDark ? "#1e1e1e" : "#e8e2d8", justifyContent: "center", alignItems: "center" },
        packageIconWrapActive: { backgroundColor: "rgba(201, 168, 76, 0.12)" },
        packageLabel: { fontSize: 15, fontWeight: "700" },
        packageDesc: { fontSize: 12, lineHeight: 18, marginBottom: 6 },
        packageBullet: { fontSize: 12, color: GOLD, fontWeight: "600" },

        // Detailed Switch Custom Addons Card
        subOptionsCard: {
            backgroundColor: C.surface,
            borderWidth: 1,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginTop: 12,
        },
        subOptionsTitle: {
            fontSize: 10,
            fontWeight: "800",
            color: GOLD,
            letterSpacing: 1,
            textTransform: "uppercase",
            paddingVertical: 6,
            borderBottomWidth: 1,
            borderBottomColor: border,
            marginBottom: 4
        },
        toggleRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: border,
            paddingVertical: 12,
        },
        toggleLabel: {
            fontSize: 14,
            fontWeight: "600",
            marginBottom: 2
        },
        toggleSub: {
            fontSize: 11,
            color: C.muted,
            lineHeight: 15
        },

        // Timeline segmented selector
        timelineRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
        timelineChip: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
        timelineChipActive: { backgroundColor: GOLD, borderColor: GOLD },
        timelineChipText: { fontSize: 12, fontWeight: "600" },

        // Hero Banner
        hero: { marginHorizontal: 20, borderRadius: 16, height: 210, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 24, position: "relative" },
        heroImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
        heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)" },
        heroEyebrow: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 8 },
        heroTitle: { fontSize: 26, fontWeight: "700", color: "#ffffff", lineHeight: 32, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
        heroDesc: { fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 16, textAlign: "center", paddingHorizontal: 12 },

        // Success dialog styling
        overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 24 },
        modalBox: { width: "100%", borderRadius: 24, padding: 32, borderWidth: 1, borderColor: GOLD, alignItems: "center" },
        modalIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 20 },
        modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12, fontFamily: "PlayfairDisplay_700Bold" },
        modalBody: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
        modalBtnPri: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
        modalBtnTxPri: { fontSize: 14, fontWeight: "700" },
        modalBtnSec: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
        modalBtnTxSec: { fontSize: 14, fontWeight: "600" }
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
