import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, ChevronRight, Search } from "lucide-react-native";

const SERVICES = [
    {
        id: "legal",
        label: "Legal Advisory",
        desc: "Consultations, document support & trusted legal referrals",
        emoji: "⚖",
        img: require("@/assets/images/onboarding-trust.png"),
        route: "/services/lifestyle-legal",
        keywords: ["lawyer", "contract", "law", "court", "advice", "document", "legal"],
    },
    {
        id: "gifts",
        label: "Gift & Florals",
        desc: "Bouquets, luxury gifts & occasion curation - delivered anywhere",
        emoji: "◈",
        img: require("@/assets/images/lagos-restaurant.jpg"),
        route: "/services/lifestyle-gifts",
        keywords: ["flowers", "bouquet", "gift", "present", "birthday", "anniversary", "florist", "hamper", "mother"],
    },
    {
        id: "recreation",
        label: "Recreational Activities",
        desc: "Golf, tennis, water sports, outdoor adventures & leisure bookings",
        emoji: "◎",
        img: require("@/assets/images/lagos-beach.jpg"),
        route: "/services/lifestyle-recreation",
        keywords: ["golf", "tennis", "sport", "activity", "outdoor", "adventure", "water", "fun", "leisure"],
    },
    {
        id: "medical",
        label: "Medical Concierge",
        desc: "Doctor appointments, specialist referrals & medical travel",
        emoji: "✦",
        img: require("@/assets/images/onboarding-lifestyle.png"),
        route: "/services/lifestyle-medical",
        keywords: ["doctor", "hospital", "health", "medical", "appointment", "specialist", "clinic", "wellness"],
    },
    {
        id: "property",
        label: "Home & Property",
        desc: "Interior design, real estate sourcing & property management",
        emoji: "⌂",
        img: require("@/assets/images/lagos-hotel.jpg"),
        route: "/services/lifestyle-property",
        keywords: ["house", "apartment", "rent", "buy", "interior", "design", "real estate", "property", "home"],
    },
    {
        id: "finance",
        label: "Financial Advisory",
        desc: "Wealth management, tax planning & investment introductions",
        emoji: "◆",
        img: require("@/assets/images/lagos-rooftop.jpg"),
        route: "/services/lifestyle-finance",
        keywords: ["money", "investment", "tax", "wealth", "financial", "accounting", "budget", "savings"],
    },
    {
        id: "photography",
        label: "Photography & Content",
        desc: "Event photographers, portrait sessions & professional content",
        emoji: "□",
        img: require("@/assets/images/onboarding-driving.png"),
        route: "/services/lifestyle-photography",
        keywords: ["photo", "camera", "shoot", "video", "content", "portrait", "photographer", "film"],
    },
    {
        id: "family",
        label: "Childcare & Family",
        desc: "Nanny sourcing, school admissions & family planning services",
        emoji: "△",
        img: require("@/assets/images/onboarding-lifestyle.png"),
        route: "/services/lifestyle-family",
        keywords: ["nanny", "child", "baby", "school", "tutor", "childcare", "kids", "family", "au pair"],
    },
    {
        id: "security",
        label: "Security & Protocol",
        desc: "Personal protection, event security & VIP security arrangements",
        emoji: "◉",
        img: require("@/assets/images/ikoyi-bridge.jpg"),
        route: "/services/lifestyle-security",
        keywords: ["security", "protection", "bodyguard", "escort", "protocol", "vip", "guard", "safety", "personal"],
    },
    {
        id: "request",
        label: "Bespoke Request",
        desc: "Any custom request or premium service not listed above - we handle it all",
        emoji: "✦",
        img: require("@/assets/images/onboarding-lifestyle.png"),
        route: "/services/lifestyle-request?service=request",
        keywords: ["request", "custom", "anything", "other", "bespoke", "special", "service"],
    },
];

export default function LifestyleScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        if (!query.trim()) return SERVICES;
        const q = query.toLowerCase();
        return SERVICES.filter(svc =>
            svc.label.toLowerCase().includes(q) ||
            svc.desc.toLowerCase().includes(q) ||
            svc.keywords.some(k => k.includes(q))
        );
    }, [query]);

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                    <ChevronLeft size={22} color={C.text} />
                </TouchableOpacity>
                <View>
                    <Text style={s.eyebrow}>LAPEQ SERVICES</Text>
                    <Text style={s.title}>Lifestyle</Text>
                </View>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <View style={s.searchBox}>
                    <Search size={16} color={C.muted} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Type a service or keyword to find it..."
                        placeholderTextColor={theme === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                    />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
                {filtered.length === 0 ? (
                    <View style={{ paddingTop: 40, alignItems: "center" }}>
                        <Text style={{ fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22 }}>
                            No services match "{query}".{"\n"}Try a different word.
                        </Text>
                    </View>
                ) : (
                    filtered.map((svc) => (
                        <TouchableOpacity
                            key={svc.id}
                            style={s.card}
                            onPress={() => router.push(svc.route as any)}
                            activeOpacity={0.85}
                        >
                            <View style={s.imgWrap}>
                                <Image source={svc.img} style={s.img} resizeMode="cover" />
                                <View style={s.imgOverlay} />
                                <Text style={s.emoji}>{svc.emoji}</Text>
                            </View>
                            <View style={s.cardBody}>
                                <Text style={s.cardLabel}>{svc.label}</Text>
                                <Text style={s.cardDesc} numberOfLines={2}>{svc.desc}</Text>
                            </View>
                            <ChevronRight size={18} color={C.muted} />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", alignItems: "center", justifyContent: "center" },
    eyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2.5, marginBottom: 2 },
    title: { fontSize: 26, fontWeight: "700", color: C.text, fontFamily: "PlayfairDisplay_700Bold" },
    searchBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    searchInput: { flex: 1, fontSize: 14, color: C.text },
    card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.surface, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme === "dark" ? "#1e1e1e" : "#ece8e1", padding: 14 },
    imgWrap: { width: 60, height: 60, borderRadius: 12, overflow: "hidden", position: "relative" },
    img: { width: "100%", height: "100%", position: "absolute" },
    imgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    emoji: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, textAlign: "center", textAlignVertical: "center", fontSize: 20, lineHeight: 60 },
    cardBody: { flex: 1 },
    cardLabel: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4 },
    cardDesc: { fontSize: 12, color: C.muted, lineHeight: 18 },
});
