import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const CITIES = ["All", "Abuja", "Lagos", "Port Harcourt"];
const CATEGORIES = ["All", "Restaurants", "Lounges", "Hotels", "Spa", "Experiences"];

const PICKS = [
    { name: "Zuma Restaurant", city: "Lagos", category: "Restaurants", tag: "Rooftop Dining", img: require("@/assets/images/lagos-rooftop.jpg"), desc: "Japanese robata grill and sushi. Exclusive member reservations available." },
    { name: "Cilantro Restaurant", city: "Abuja", category: "Restaurants", tag: "Fine Dining", img: require("@/assets/images/lagos-hotel.jpg"), desc: "Award-winning Mediterranean cuisine in the heart of Abuja." },
    { name: "Breeze Restaurant", city: "Lagos", category: "Restaurants", tag: "Waterfront", img: require("@/assets/images/lagos-beach.jpg"), desc: "Waterfront dining experience. Reserve your private cabana through Lapeq." },
    { name: "Nola Restaurant", city: "Abuja", category: "Restaurants", tag: "Members Only", img: require("@/assets/images/lagos-restaurant.jpg"), desc: "Upscale dining with an intimate atmosphere. Priority seating for Lapeq members." },
    { name: "Transcorp Hilton", city: "Abuja", category: "Hotels", tag: "5-Star", img: require("@/assets/images/lagos-hotel.jpg"), desc: "Abuja's premier luxury hotel. Member room upgrades and priority check-in." },
    { name: "Eko Hotel & Suites", city: "Lagos", category: "Hotels", tag: "Iconic", img: require("@/assets/images/lagos-rooftop.jpg"), desc: "Lagos landmark. Lapeq members receive complimentary lounge access." },
    { name: "Zen Spa Abuja", city: "Abuja", category: "Spa", tag: "Wellness", img: require("@/assets/images/lagos-beach.jpg"), desc: "Full-service luxury spa. Priority bookings for Gold and Black members." },
    { name: "Quilox", city: "Lagos", category: "Lounges", tag: "Trending", img: require("@/assets/images/lagos-restaurant.jpg"), desc: "Lagos' most exclusive entertainment lounge. VIP table reservations available." },
    { name: "Pebbles", city: "Port Harcourt", category: "Restaurants", tag: "Local Pick", img: require("@/assets/images/lagos-rooftop.jpg"), desc: "Port Harcourt's finest dining experience. Seafood and continental cuisine." },
    { name: "Landmark Beach", city: "Lagos", category: "Experiences", tag: "Seasonal", img: require("@/assets/images/lagos-beach.jpg"), desc: "Private cabana bookings and VIP beach experience through Lapeq." },
];

export default function MonthlyPicksScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const [city, setCity] = useState("All");
    const [category, setCategory] = useState("All");

    const filtered = PICKS.filter(p =>
        (city === "All" || p.city === city) &&
        (category === "All" || p.category === category)
    );

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>Monthly Picks</Text>
                    <Text style={s.subtitle}>April 2026 · Curated by LAPEQ Concierge</Text>
                </View>
            </View>

            <View style={s.proTip}>
                <Text style={s.proTipLabel}>PRO TIP</Text>
                <Text style={s.proTipText}>FIFA World Cup 2026 fan zones at Landmark Beach and Eko Atlantic, Lagos — the biggest viewing parties on the continent, June/July 2026.</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cityRow} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingRight: 20 }}>
                {CITIES.map(c => (
                    <TouchableOpacity key={c} style={[s.chip, city === c && s.chipActive]} onPress={() => setCity(c)}>
                        <Text style={[s.chipText, city === c && s.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingRight: 20 }}>
                {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
                        <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
                {filtered.length === 0 ? (
                    <View style={{ paddingTop: 60, alignItems: "center" }}>
                        <Text style={{ color: C.muted, fontSize: 15 }}>No picks for this filter yet.</Text>
                    </View>
                ) : filtered.map((pick, i) => (
                    <View key={i} style={s.card}>
                        <Image source={pick.img} style={s.cardImg} resizeMode="cover" />
                        <View style={s.cardBadge}>
                            <Text style={s.cardBadgeText}>{pick.tag}</Text>
                        </View>
                        <View style={s.cardBody}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text style={s.cardName}>{pick.name}</Text>
                                <Text style={s.cardCategory}>{pick.category}</Text>
                            </View>
                            <Text style={s.cardCity}>{pick.city}</Text>
                            <Text style={s.cardDesc}>{pick.desc}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: "700", color: C.text },
    subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
    proTip: { marginHorizontal: 20, marginBottom: 16, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: C.primary },
    proTipLabel: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2, marginBottom: 4 },
    proTipText: { fontSize: 13, color: C.text, lineHeight: 20 },
    cityRow: { marginBottom: 8 },
    chip: { height: 36, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", alignItems: "center", justifyContent: "center" },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    chipTextActive: { color: "#0a0a0a" },
    card: { borderRadius: 20, overflow: "hidden", backgroundColor: C.surface, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    cardImg: { width: "100%", height: 180 },
    cardBadge: { position: "absolute", top: 14, left: 14, backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
    cardBadgeText: { fontSize: 11, fontWeight: "700", color: "#0a0a0a" },
    cardBody: { padding: 16 },
    cardName: { fontSize: 17, fontWeight: "700", color: C.text },
    cardCategory: { fontSize: 12, fontWeight: "600", color: C.primary },
    cardCity: { fontSize: 13, color: C.muted, marginBottom: 6 },
    cardDesc: { fontSize: 13, color: C.muted, lineHeight: 20 },
});
