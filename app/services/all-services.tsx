import { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Dimensions, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Search, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { setPendingService } from "@/lib/serviceStore";

const { width: W } = Dimensions.get("window");
const GOLD = "#c9a84c";
const CARD_W = (W - 40 - 24) / 3;

const SERVICE_TYPES = [
    { id: "Curated Itinerary",       label: "Curated Itinerary",     emoji: "✦", desc: "A full trip planned end-to-end",            img: require("@/assets/images/lagos-hotel.jpg") },
    { id: "Stays & Accommodations",  label: "Stays",                  emoji: "⌂", desc: "Hotels, villas & private residences",       img: require("@/assets/images/lagos-rooftop.jpg") },
    { id: "Private Dining",          label: "Private Dining",         emoji: "◈", desc: "Exclusive tables & fine dining",            img: require("@/assets/images/lagos-restaurant.jpg") },
    { id: "VIP Protocol",            label: "VIP Protocol",           emoji: "◆", desc: "Airport arrivals & event access",           img: require("@/assets/images/lagos-beach.jpg") },
    { id: "Flights & Jets",          label: "Private Jets",           emoji: "✈", desc: "Charter jets & helicopters",                img: require("@/assets/images/exterior-luxury.jpg") },
    { id: "Legal Advisory",          label: "Legal Advisory",         emoji: "⚖", desc: "Consultations & document support",          img: require("@/assets/images/onboarding-trust.png") },
    { id: "Gift & Florals",          label: "Gift & Florals",         emoji: "◈", desc: "Bouquets, luxury gifts & curation",         img: require("@/assets/images/lagos-restaurant.jpg") },
    { id: "Recreational Activities", label: "Recreation",             emoji: "◎", desc: "Golf, tennis & water sports",              img: require("@/assets/images/lagos-beach.jpg") },
    { id: "Medical Concierge",       label: "Medical Concierge",      emoji: "✦", desc: "Doctor appointments & referrals",           img: require("@/assets/images/onboarding-lifestyle.png") },
    { id: "Home & Property",         label: "Home & Property",        emoji: "⌂", desc: "Interior design & management",             img: require("@/assets/images/lagos-hotel.jpg") },
    { id: "Financial Advisory",      label: "Financial Advisory",     emoji: "◆", desc: "Wealth, tax & investment planning",         img: require("@/assets/images/lagos-rooftop.jpg") },
    { id: "Photography & Content",   label: "Photography",            emoji: "□", desc: "Photographers & content creators",          img: require("@/assets/images/onboarding-driving.png") },
    { id: "Childcare & Family",      label: "Childcare & Family",     emoji: "△", desc: "Nanny sourcing & school admissions",        img: require("@/assets/images/onboarding-lifestyle.png") },
    { id: "Security & Protocol",     label: "Security",               emoji: "◉", desc: "Personal protection & VIP security",        img: require("@/assets/images/ikoyi-bridge.jpg") },
    { id: "Bespoke Request",         label: "Bespoke Request",        emoji: "✦", desc: "Any custom premium service",                img: require("@/assets/images/onboarding-lifestyle.png") },
    { id: "Passport Renewal",        label: "Passport Renewal",       emoji: "◈", desc: "End-to-end passport renewal & docs",          img: require("@/assets/images/onboarding-trust.png") },
    { id: "Bank Account Opening",    label: "Bank Account",           emoji: "◆", desc: "Open a Nigerian bank account remotely",       img: require("@/assets/images/lagos-rooftop.jpg") },
];

export default function AllServicesScreen() {
    const router = useRouter();
    const { currentType } = useLocalSearchParams<{ currentType?: string }>();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";

    const [query, setQuery] = useState("");

    const filtered = query.trim()
        ? SERVICE_TYPES.filter(s =>
            s.label.toLowerCase().includes(query.toLowerCase()) ||
            s.desc.toLowerCase().includes(query.toLowerCase())
          )
        : SERVICE_TYPES;

    const handleSelect = (svc: typeof SERVICE_TYPES[0]) => {
        setPendingService(svc.id);
        router.back();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={["top"]}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12 }}>
                <TouchableOpacity
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" }}
                    onPress={() => router.back()}
                    activeOpacity={0.75}
                >
                    <ChevronLeft size={22} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: C.text, letterSpacing: -0.3 }}>All Services</Text>
                    <Text style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>Select the type of request</Text>
                </View>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <View style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                    borderWidth: 1, borderColor: isDark ? "#2a2a2a" : "#e8e3da",
                }}>
                    <Search size={16} color={C.muted} />
                    <TextInput
                        style={{ flex: 1, fontSize: 14, color: C.text }}
                        placeholder="Search services..."
                        placeholderTextColor={C.muted}
                        value={query}
                        onChangeText={setQuery}
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <X size={15} color={C.muted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                {filtered.length === 0 ? (
                    <View style={{ alignItems: "center", paddingTop: 60, gap: 8 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>No services found</Text>
                        <Text style={{ fontSize: 13, color: C.muted }}>Try a different search term</Text>
                    </View>
                ) : (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                        {filtered.map(svc => {
                            const active = svc.id === currentType;
                            return (
                                <TouchableOpacity
                                    key={svc.id}
                                    style={{
                                        width: CARD_W,
                                        aspectRatio: 0.9,
                                        borderRadius: 16,
                                        backgroundColor: active
                                            ? "#000000"
                                            : GOLD,
                                        borderWidth: 1,
                                        borderColor: active ? "#000000" : GOLD,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 12,
                                        gap: 8,
                                    }}
                                    onPress={() => handleSelect(svc)}
                                    activeOpacity={0.75}
                                >
                                    <Image
                                        source={svc.img}
                                        style={{ width: 44, height: 44, borderRadius: 12, opacity: active ? 1 : 0.85 }}
                                        resizeMode="cover"
                                    />
                                    <Text
                                        style={{
                                            fontSize: 11, fontWeight: "700",
                                            color: active ? GOLD : "#000000",
                                            textAlign: "center", lineHeight: 15,
                                        }}
                                        numberOfLines={2}
                                    >
                                        {svc.label}
                                    </Text>
                                    <Text
                                        style={{ fontSize: 9, color: active ? "rgba(201, 168, 76, 0.7)" : "rgba(0,0,0,0.5)", textAlign: "center", lineHeight: 13 }}
                                        numberOfLines={2}
                                    >
                                        {svc.desc}
                                    </Text>
                                    {active && (
                                        <View style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD }} />
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
