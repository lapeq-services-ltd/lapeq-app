import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function ExploreScreen() {
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const categories = [
        { title: "Experiences", desc: "Discover our finest curated outings.", img: require("@/assets/images/lagos-beach.jpg") },
        { title: "Restaurants", desc: "Reserve tables at premium dining spots.", img: require("@/assets/images/lagos-restaurant.jpg") },
        { title: "Travel Packages", desc: "Seamless journeys designed for members.", img: require("@/assets/images/lagos-hotel.jpg") },
        { title: "Events", desc: "Exclusive gatherings and rooftop evenings.", img: require("@/assets/images/lagos-rooftop.jpg") },
    ];

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Explore</Text>
                <Text style={s.headerSub}>Discover curated experiences.</Text>
            </View>

            <View style={s.searchContainer}>
                <Search size={24} color={C.muted} style={s.searchIcon} />
                <TextInput
                    style={s.searchInput}
                    placeholder="Search experiences, events, dining..."
                    placeholderTextColor={C.muted}
                />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent}>
                {categories.map((cat, idx) => (
                    <TouchableOpacity key={idx} style={s.card}>
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
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { padding: 20 },
    headerTitle: { fontSize: 32, fontWeight: "700", color: C.text, marginBottom: 8 },
    headerSub: { fontSize: 16, color: C.muted },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.surface,
        marginHorizontal: 20,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: C.border,
    },
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
});
