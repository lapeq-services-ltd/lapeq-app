import { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, X, Clock, Calendar } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["All", "Lifestyle", "Real Estate", "Finance", "Travel", "Dining", "Fashion", "Society"];

const I = {
    extLux:     require("@/assets/images/exterior-luxury.jpg"),
    rooftop:    require("@/assets/images/lagos-rooftop.jpg"),
    bridge:     require("@/assets/images/ikoyi-bridge.jpg"),
    collab:     require("@/assets/images/collab-img.png"),
    luxHotel:   require("@/assets/images/lux-hotels.jpg"),
    scenery:    require("@/assets/images/beautiful-scenery.webp"),
    hotel:      require("@/assets/images/lagos-hotel.jpg"),
    restaurant: require("@/assets/images/lagos-restaurant.jpg"),
    card:       require("@/assets/images/card-1.png"),
    beach:      require("@/assets/images/lagos-beach.jpg"),
    lifestyle:  require("@/assets/images/onboarding-lifestyle.png"),
    trust:      require("@/assets/images/onboarding-trust.png"),
};

const getFallbackImg = (category: string | null, index: number) => {
    const cat = category || "Lifestyle";
    const imgs = {
        "Lifestyle":   [I.extLux, I.rooftop, I.beach, I.lifestyle],
        "Real Estate": [I.bridge, I.trust, I.collab],
        "Finance":     [I.collab, I.trust, I.bridge],
        "Travel":      [I.luxHotel, I.scenery, I.hotel, I.beach],
        "Dining":      [I.restaurant, I.rooftop],
        "Fashion":     [I.card, I.extLux, I.rooftop],
        "Society":     [I.rooftop, I.lifestyle, I.beach, I.collab],
    }[cat] || [I.extLux];
    return imgs[index % imgs.length];
};

const getReadTime = (body: string | null) => {
    if (!body) return "1 min read";
    const words = body.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return `${minutes} min read`;
};

const getExcerpt = (body: string | null) => {
    if (!body) return "";
    const cleanBody = body.replace(/[#*`_]/g, ""); // strip simple markdown characters
    if (cleanBody.length <= 130) return cleanBody;
    return cleanBody.slice(0, 127) + "...";
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "TBA";
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

export default function JournalScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const [category, setCategory] = useState("All");
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

    useEffect(() => {
        setLoading(true);
        supabase
            .from("content")
            .select("id, title, body, image_url, tag, category, created_at")
            .eq("type", "article")
            .eq("published", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) {
                    setArticles(data);
                }
                setLoading(false);
            });
    }, []);

    const filtered = useMemo(() => {
        return articles.filter(a => category === "All" || a.category === category);
    }, [articles, category]);

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

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, marginBottom: 20 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 8, alignItems: "center" }}
            >
                {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
                        <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={C.primary} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 }}>
                    <Text style={{ color: C.muted, fontSize: 15, textAlign: "center" }}>No articles in this category yet.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 20 }}>
                    {filtered.map((article, i) => {
                        const fallbackImg = getFallbackImg(article.category, i);
                        const readTime = getReadTime(article.body);
                        const dateText = formatDate(article.created_at);
                        const excerpt = getExcerpt(article.body);

                        return (
                            <TouchableOpacity
                                key={article.id}
                                style={s.card}
                                activeOpacity={0.85}
                                onPress={() => setSelectedArticle(article)}
                            >
                                <Image
                                    source={article.image_url ? { uri: article.image_url } : fallbackImg}
                                    style={s.cardImg}
                                    resizeMode="cover"
                                />
                                {article.tag && (
                                    <View style={s.cardBadge}>
                                        <Text style={s.cardBadgeText}>{article.tag}</Text>
                                    </View>
                                )}
                                <View style={s.cardBody}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <Text style={s.cardCategory}>{article.category || "LIFESTYLE"}</Text>
                                        <Text style={s.dot}>·</Text>
                                        <Text style={s.cardMeta}>{readTime}</Text>
                                        <Text style={s.dot}>·</Text>
                                        <Text style={s.cardMeta}>{dateText}</Text>
                                    </View>
                                    <Text style={s.cardTitle}>{article.title}</Text>
                                    {excerpt ? <Text style={s.cardExcerpt}>{excerpt}</Text> : null}
                                    <Text style={s.readMore}>Read Article →</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Premium Article Detail Modal */}
            <Modal
                visible={selectedArticle !== null}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setSelectedArticle(null)}
            >
                <View style={[s.modalRoot, { paddingTop: insets.top }]}>
                    {/* Floating close button */}
                    <TouchableOpacity
                        onPress={() => setSelectedArticle(null)}
                        style={s.modalCloseBtn}
                        activeOpacity={0.8}
                    >
                        <X size={20} color="#fff" />
                    </TouchableOpacity>

                    {selectedArticle && (
                        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                            {/* Hero cover image */}
                            <View style={s.modalHero}>
                                <Image
                                    source={selectedArticle.image_url ? { uri: selectedArticle.image_url } : getFallbackImg(selectedArticle.category, 0)}
                                    style={s.modalHeroImg}
                                    resizeMode="cover"
                                />
                                <View style={s.modalHeroOverlay} />
                                
                                <View style={s.modalHeroContent}>
                                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
                                        {selectedArticle.category && (
                                            <View style={s.modalTagBadge}>
                                                <Text style={s.modalTagText}>{selectedArticle.category.toUpperCase()}</Text>
                                            </View>
                                        )}
                                        {selectedArticle.tag && (
                                            <View style={[s.modalTagBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                                                <Text style={[s.modalTagText, { color: "#fff" }]}>{selectedArticle.tag}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={s.modalTitle}>
                                        {selectedArticle.title}
                                    </Text>
                                </View>
                            </View>

                            {/* Meta Strip */}
                            <View style={s.modalMetaStrip}>
                                <View style={s.metaItem}>
                                    <Calendar size={13} color={C.primary} />
                                    <Text style={s.metaText}>{formatDate(selectedArticle.created_at)}</Text>
                                </View>
                                <View style={s.metaItem}>
                                    <Clock size={13} color={C.primary} />
                                    <Text style={s.metaText}>{getReadTime(selectedArticle.body)}</Text>
                                </View>
                                <View style={s.metaItem}>
                                    <Text style={[s.metaText, { fontFamily: "Jost_600SemiBold", color: C.primary }]}>LAPEQ EDITORIAL</Text>
                                </View>
                            </View>

                            <View style={s.modalBodyContainer}>
                                <Text style={s.modalBodyText}>
                                    {selectedArticle.body || "No content available."}
                                </Text>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: "700", color: C.text },
    subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
    chip: { height: 36, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", alignItems: "center", justifyContent: "center" },
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
    
    // Modal styles
    modalRoot: { flex: 1, backgroundColor: C.background },
    modalCloseBtn: {
        position: "absolute",
        top: Platform.OS === "ios" ? 54 : 20,
        left: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    modalHero: {
        height: 320,
        width: "100%",
        position: "relative",
        backgroundColor: "#1c1c1c",
    },
    modalHeroImg: {
        width: "100%",
        height: "100%",
        position: "absolute",
    },
    modalHeroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalHeroContent: {
        position: "absolute",
        bottom: 24,
        left: 20,
        right: 20,
    },
    modalTagBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: C.primary,
    },
    modalTagText: {
        fontSize: 9,
        fontFamily: "Jost_700Bold",
        color: "#000",
        letterSpacing: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: "PlayfairDisplay_700Bold",
        color: "#fff",
        lineHeight: 32,
        marginTop: 6,
    },
    modalMetaStrip: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        backgroundColor: theme === "dark" ? "#0f0f0f" : "#fbf9f6",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 11,
        fontFamily: "Jost_500Medium",
        color: C.muted,
    },
    modalBodyContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    modalBodyText: {
        fontSize: 15,
        fontFamily: "Jost_400Regular",
        color: C.text,
        lineHeight: 25,
    },
});
