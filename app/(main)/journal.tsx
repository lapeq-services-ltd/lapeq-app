import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const CATEGORIES = ["All", "Lifestyle", "Travel", "Dining", "Fashion", "Hospitality", "Events"];

const ARTICLES = [
    {
        category: "Lifestyle",
        tag: "Cover Story",
        readTime: "6 min read",
        date: "February 2026",
        title: "The Insider's Guide to Abuja's Most Exclusive Venues in 2026",
        excerpt: "From rooftop lounges with sweeping skyline views to private dining rooms reserved for those who know where to ask — LAPEQ reveals the addresses that define Abuja's luxury scene this year.",
        img: require("@/assets/images/lagos-rooftop.jpg"),
    },
    {
        category: "Travel",
        tag: "Travel Guide",
        readTime: "5 min read",
        date: "March 2026",
        title: "Lagos to London: How LAPEQ Members Travel Differently",
        excerpt: "Business class upgrades, airport lounge coordination, and hotel arrangements that go beyond booking — here's what elevated travel actually looks like.",
        img: require("@/assets/images/lagos-hotel.jpg"),
    },
    {
        category: "Dining",
        tag: "Fine Dining",
        readTime: "4 min read",
        date: "March 2026",
        title: "Port Harcourt's Best Kept Dining Secrets",
        excerpt: "Our concierge team spent a week in Port Harcourt finding the restaurants that locals love and visitors never discover. Here's what they found.",
        img: require("@/assets/images/lagos-restaurant.jpg"),
    },
    {
        category: "Hospitality",
        tag: "Hotels",
        readTime: "7 min read",
        date: "April 2026",
        title: "Nigeria's Finest Hotel Suites — Reviewed by Our Team",
        excerpt: "We checked in so you know exactly what to expect. From Abuja's Transcorp Presidential to Lagos' most discreet boutique hotels.",
        img: require("@/assets/images/lagos-beach.jpg"),
    },
];

export default function JournalScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const [category, setCategory] = useState("All");

    const filtered = ARTICLES.filter(a => category === "All" || a.category === category);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>The LAPEQ Journal</Text>
                    <Text style={s.subtitle}>Lifestyle insights & curated guides</Text>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingRight: 20 }}>
                {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
                        <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 20 }}>
                {filtered.map((article, i) => (
                    <TouchableOpacity key={i} style={s.card} activeOpacity={0.85}>
                        <Image source={article.img} style={s.cardImg} resizeMode="cover" />
                        <View style={s.cardBadge}>
                            <Text style={s.cardBadgeText}>{article.tag}</Text>
                        </View>
                        <View style={s.cardBody}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <Text style={s.cardCategory}>{article.category}</Text>
                                <Text style={s.dot}>·</Text>
                                <Text style={s.cardMeta}>{article.readTime}</Text>
                                <Text style={s.dot}>·</Text>
                                <Text style={s.cardMeta}>{article.date}</Text>
                            </View>
                            <Text style={s.cardTitle}>{article.title}</Text>
                            <Text style={s.cardExcerpt}>{article.excerpt}</Text>
                            <Text style={s.readMore}>Read Article →</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={s.comingSoon}>
                    <Text style={s.comingSoonText}>More articles coming soon. Our editorial team is working on the next edition.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: "700", color: C.text },
    subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    chipTextActive: { color: "#0a0a0a" },
    card: { borderRadius: 20, overflow: "hidden", backgroundColor: C.surface, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    cardImg: { width: "100%", height: 200 },
    cardBadge: { position: "absolute", top: 14, left: 14, backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
    cardBadgeText: { fontSize: 11, fontWeight: "700", color: "#0a0a0a" },
    cardBody: { padding: 18 },
    cardCategory: { fontSize: 12, fontWeight: "700", color: C.primary, textTransform: "uppercase", letterSpacing: 0.5 },
    dot: { color: C.muted, fontSize: 12 },
    cardMeta: { fontSize: 12, color: C.muted },
    cardTitle: { fontSize: 18, fontWeight: "700", color: C.text, lineHeight: 26, marginBottom: 8 },
    cardExcerpt: { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 14 },
    readMore: { fontSize: 14, fontWeight: "600", color: C.primary },
    comingSoon: { padding: 20, backgroundColor: C.surface, borderRadius: 16, alignItems: "center" },
    comingSoonText: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22 },
});
