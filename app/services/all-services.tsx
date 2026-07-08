import { useState, useMemo } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    ChevronLeft, Search, X,
    MapPin, BedDouble, Utensils, Star, Plane,
    Scale, Gift, Dumbbell, Heart, Home,
    TrendingUp, Camera, Users, ShieldCheck,
    Sparkles, CreditCard, Landmark, Check,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { setPendingService } from "@/lib/serviceStore";

const { width: W } = Dimensions.get("window");
const GOLD = "#c9a84c";
const CARD_W = (W - 48 - 12) / 2;

const SERVICES = [
    { id: "Curated Itinerary",       label: "Curated Itinerary",    desc: "Full trip planned end-to-end",           icon: MapPin },
    { id: "Stays & Accommodations",  label: "Stays",                desc: "Hotels, villas & residences",            icon: BedDouble },
    { id: "Private Dining",          label: "Private Dining",       desc: "Exclusive tables & fine dining",          icon: Utensils },
    { id: "VIP Protocol",            label: "VIP Protocol",         desc: "Airport arrivals & event access",         icon: Star },
    { id: "Flights & Jets",          label: "Private Jets",         desc: "Charter jets & helicopters",              icon: Plane },
    { id: "Legal Advisory",          label: "Legal Advisory",       desc: "Consultations & document support",        icon: Scale },
    { id: "Gift & Florals",          label: "Gift & Florals",       desc: "Bouquets, luxury gifts & curation",       icon: Gift },
    { id: "Recreational Activities", label: "Recreation",           desc: "Golf, tennis & water sports",             icon: Dumbbell },
    { id: "Medical Concierge",       label: "Medical Concierge",    desc: "Doctor appointments & referrals",         icon: Heart },
    { id: "Home & Property",         label: "Home & Property",      desc: "Interior design & management",            icon: Home },
    { id: "Financial Advisory",      label: "Financial Advisory",   desc: "Wealth, tax & investment planning",       icon: TrendingUp },
    { id: "Photography & Content",   label: "Photography",          desc: "Photographers & content creators",        icon: Camera },
    { id: "Childcare & Family",      label: "Childcare & Family",   desc: "Nanny sourcing & school admissions",      icon: Users },
    { id: "Security & Protocol",     label: "Security",             desc: "Personal protection & VIP security",      icon: ShieldCheck },
    { id: "Bespoke Request",         label: "Bespoke Request",      desc: "Any custom premium service",              icon: Sparkles },
    { id: "Passport Renewal",        label: "Passport Renewal",     desc: "End-to-end passport & docs",              icon: CreditCard },
    { id: "Bank Account Opening",    label: "Bank Account",         desc: "Open a Nigerian account remotely",        icon: Landmark },
];

export default function AllServicesScreen() {
    const router = useRouter();
    const { currentType } = useLocalSearchParams<{ currentType?: string }>();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [query, setQuery] = useState("");

    const filtered = query.trim()
        ? SERVICES.filter(s =>
            s.label.toLowerCase().includes(query.toLowerCase()) ||
            s.desc.toLowerCase().includes(query.toLowerCase())
          )
        : SERVICES;

    const handleSelect = (svc: typeof SERVICES[0]) => {
        setPendingService(svc.id);
        router.back();
    };

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
                    <ChevronLeft size={22} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.headerTitle}>All Services</Text>
                    <Text style={s.headerSub}>Select the type of request</Text>
                </View>
            </View>

            {/* Search */}
            <View style={s.searchWrap}>
                <Search size={15} color={C.muted} />
                <TextInput
                    style={s.searchInput}
                    placeholder="Search services..."
                    placeholderTextColor={C.muted}
                    value={query}
                    onChangeText={setQuery}
                    autoCorrect={false}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <X size={14} color={C.muted} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.grid}>
                {filtered.length === 0 ? (
                    <View style={s.empty}>
                        <Text style={s.emptyTitle}>No services found</Text>
                        <Text style={s.emptySub}>Try a different search term</Text>
                    </View>
                ) : (
                    <View style={s.row}>
                        {filtered.map(svc => {
                            const active = svc.id === currentType;
                            const Icon = svc.icon;
                            return (
                                <TouchableOpacity
                                    key={svc.id}
                                    style={[s.card, active && s.cardActive]}
                                    onPress={() => handleSelect(svc)}
                                    activeOpacity={0.72}
                                >
                                    <View style={[s.iconWrap, active && s.iconWrapActive]}>
                                        <Icon size={22} color={active ? GOLD : C.text} strokeWidth={1.6} />
                                    </View>
                                    <Text style={[s.cardLabel, active && { color: C.text }]} numberOfLines={2}>
                                        {svc.label}
                                    </Text>
                                    <Text style={s.cardDesc} numberOfLines={2}>
                                        {svc.desc}
                                    </Text>
                                    {active && (
                                        <View style={s.checkBadge}>
                                            <Check size={10} color="#000" strokeWidth={3} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => {
    const isDark = theme === "dark";
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: isDark ? C.background : "#f2ede5" },
        header: {
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12,
        },
        backBtn: {
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: C.surface,
            alignItems: "center", justifyContent: "center",
        },
        headerTitle: { fontSize: 20, fontWeight: "700", color: C.text, letterSpacing: -0.3 },
        headerSub: { fontSize: 12, color: C.muted, marginTop: 1 },

        searchWrap: {
            flexDirection: "row", alignItems: "center", gap: 10,
            marginHorizontal: 20, marginBottom: 16,
            backgroundColor: C.surface,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
            borderWidth: 1, borderColor: isDark ? "#2a2a2a" : "#e0dbd2",
        },
        searchInput: { flex: 1, fontSize: 14, color: C.text },

        grid: { paddingHorizontal: 20, paddingBottom: 48 },
        row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

        card: {
            width: CARD_W,
            backgroundColor: C.surface,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: isDark ? "#222" : "#e0dbd2",
            gap: 10,
            position: "relative",
        },
        cardActive: {
            borderColor: GOLD,
            backgroundColor: isDark ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.05)",
        },

        iconWrap: {
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            alignItems: "center", justifyContent: "center",
        },
        iconWrapActive: {
            backgroundColor: `${GOLD}18`,
        },

        cardLabel: {
            fontSize: 13, fontWeight: "700", color: C.text, lineHeight: 18,
        },
        cardDesc: {
            fontSize: 11, color: C.muted, lineHeight: 16,
        },

        checkBadge: {
            position: "absolute", top: 10, right: 10,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: GOLD,
            alignItems: "center", justifyContent: "center",
        },

        empty: { alignItems: "center", paddingTop: 80, gap: 8 },
        emptyTitle: { fontSize: 15, fontWeight: "700", color: C.text },
        emptySub: { fontSize: 13, color: C.muted },
    });
};
