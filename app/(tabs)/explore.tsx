import { useState, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, MapPin } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

type Venue = { id: string; name: string; category: string; city: string; address: string | null };

export default function ExploreScreen() {
    
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const router = useRouter();

    const [search, setSearch] = useState("");
    const [results, setResults] = useState<Venue[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const categories = [
        { title: "Restaurants", desc: "Reserve tables at premium dining spots.", img: require("@/assets/images/lagos-restaurant.jpg"), category: "restaurant" },
        { title: "Lounges", desc: "Unwind at the finest lounges in the city.", img: require("@/assets/images/lagos-rooftop.jpg"), category: "lounge" },
        { title: "Clubs", desc: "Exclusive nightlife curated for members.", img: require("@/assets/images/lagos-beach.jpg"), category: "club" },
        { title: "Hotels & Apartments", desc: "Luxury stays handpicked for you.", img: require("@/assets/images/lagos-hotel.jpg"), category: "hotel" },
        { title: "Spa & Wellness", desc: "Rejuvenate at world-class wellness spots.", img: require("@/assets/images/lagos-restaurant.jpg"), category: "spa" },
    ];

    const onSearch = (text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (text.length < 2) { setResults([]); setSearching(false); return; }
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
            const { data } = await supabase.from("venues").select("id, name, category, city, address").ilike("name", `%${text}%`).eq("active", true).limit(10);
            setResults(data ?? []);
            setSearching(false);
        }, 200);
    };

    const clearSearch = () => { setSearch(""); setResults([]); };

    const showResults = search.length >= 2;

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Explore</Text>
                <Text style={s.headerSub}>Discover curated experiences.</Text>
            </View>

            <View style={s.searchContainer}>
                {searching ? <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 12 }} /> : <Search size={20} color={C.muted} style={s.searchIcon} />}
                <TextInput
                    style={s.searchInput}
                    placeholder="Search venues, dining, stays..."
                    placeholderTextColor={C.muted}
                    value={search}
                    onChangeText={onSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={clearSearch}>
                        <X size={18} color={C.muted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search results */}
            {showResults ? (
                <FlatList
                    data={results}
                    keyExtractor={v => v.id}
                    contentContainerStyle={s.resultsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        !searching ? <Text style={{ color: C.muted, textAlign: "center", marginTop: 40 }}>No venues found</Text> : null
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity style={s.resultRow} onPress={() => { clearSearch(); router.push({ pathname: "/explore/venue-detail", params: { id: item.id } }); }}>
                            <View style={s.resultIcon}>
                                <MapPin size={14} color={C.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.resultName}>{item.name}</Text>
                                <Text style={s.resultSub}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)} · {item.city}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            ) : (
                <ScrollView contentContainerStyle={s.scrollContent}>
                    {categories.map((cat, idx) => (
                        <TouchableOpacity key={idx} style={s.card} onPress={() => router.push({ pathname: "/explore/venues", params: { category: cat.category, title: cat.title } })}>
                            <View style={s.imgWrap}>
                                <Image source={cat.img} style={s.img} resizeMode="cover" />
                                <View style={s.overlay} />
                                <View style={s.cardContent}>
                                    <Text style={s.cardTitle}>{cat.title}</Text>
                                    <Text style={s.cardDesc}>{cat.desc}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any, _theme: string) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { padding: 20 },
    headerTitle: { fontSize: 32, fontWeight: "700", color: C.text, marginBottom: 8 },
    headerSub: { fontSize: 16, color: C.muted },
    searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 20, borderWidth: 1, borderColor: _theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, fontSize: 16, color: C.text, height: "100%" },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
    card: { borderRadius: 16, overflow: "hidden", height: 160 },
    imgWrap: { flex: 1, position: "relative" },
    img: { width: "100%", height: "100%" },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
    cardContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 },
    cardTitle: { fontSize: 22, fontWeight: "700", color: "#ffffff", marginBottom: 4 },
    cardDesc: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
    resultsList: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
    resultRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: _theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    resultIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    resultName: { fontSize: 15, fontWeight: "600", color: C.text },
    resultSub: { fontSize: 12, color: C.muted, marginTop: 2 },
});
