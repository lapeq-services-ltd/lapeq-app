import { useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Crown, UtensilsCrossed, Sparkles, Music2, Hotel, MapPin, Building2 } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

type Venue = {
    id: string;
    name: string;
    category: string;
    city: string;
    address: string | null;
};

const CATEGORY_ICON: Record<string, any> = {
    restaurant: UtensilsCrossed,
    lounge: Sparkles,
    club: Music2,
    hotel: Hotel,
    spa: Sparkles,
};

const CATEGORY_LABELS: Record<string, string> = {
    restaurant: "Restaurant",
    lounge: "Lounge",
    club: "Club",
    hotel: "Hotel & Apt",
    spa: "Spa & Wellness",
};

export default function MapScreen() {
    const { C } = useTheme();
    const router = useRouter();
    const s = useMemo(() => getStyles(C), [C]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [activeCity, setActiveCity] = useState<"Lagos" | "Abuja">("Lagos");

    useEffect(() => {
        supabase.from("venues").select("id, name, category, city, address").eq("active", true).order("name")
            .then(({ data }) => { if (data) setVenues(data); });
    }, []);

    const cityVenues = venues.filter(v => v.city === activeCity);

    // Fake pin grid positions for visual effect
    const PIN_POSITIONS = [
        { top: "28%", left: "20%" },
        { top: "45%", left: "55%" },
        { top: "20%", left: "65%" },
        { top: "60%", left: "35%" },
        { top: "35%", left: "42%" },
        { top: "55%", left: "68%" },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
            {/* Map placeholder */}
            <View style={s.mapPlaceholder}>
                <View style={StyleSheet.absoluteFillObject}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <View key={`h${i}`} style={[s.gridLine, { top: `${i * 14}%` as any }]} />
                    ))}
                    {Array.from({ length: 8 }).map((_, i) => (
                        <View key={`v${i}`} style={[s.gridLineV, { left: `${i * 14}%` as any }]} />
                    ))}
                </View>

                {/* Pin dots from real venues */}
                {cityVenues.slice(0, 6).map((v, i) => {
                    const Icon = CATEGORY_ICON[v.category] ?? Building2;
                    return (
                        <TouchableOpacity
                            key={v.id}
                            style={[s.pin, PIN_POSITIONS[i] as any]}
                            onPress={() => router.push({ pathname: "/explore/venue-detail", params: { id: v.id } })}
                            activeOpacity={0.85}
                        >
                            <View style={s.pinTooltip}>
                                <Text style={s.pinLabel} numberOfLines={1}>{v.name}</Text>
                            </View>
                            <View style={s.pinCircle}>
                                <Icon size={13} color="#0a0a0a" strokeWidth={2.5} />
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <SafeAreaView style={s.headerOverlay} pointerEvents="box-none">
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 }}>
                        <View style={s.headerBadge}>
                            <Crown size={12} color="#c9a84c" />
                            <Text style={s.headerBadgeText}>PARTNER LOCATIONS</Text>
                        </View>
                        <View style={s.cityToggle}>
                            {(["Lagos", "Abuja"] as const).map(city => (
                                <TouchableOpacity
                                    key={city}
                                    style={[s.cityBtn, activeCity === city && s.cityBtnActive]}
                                    onPress={() => setActiveCity(city)}
                                >
                                    <Text style={[s.cityBtnText, activeCity === city && s.cityBtnTextActive]}>{city}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Bottom list */}
            <View style={s.bottomCard}>
                <View style={s.bottomHandle} />
                <Text style={s.bottomTitle}>{activeCity} Partners  <Text style={{ fontSize: 12, color: "rgba(201,168,76,0.6)", fontWeight: "600" }}>{cityVenues.length} places</Text></Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                    {cityVenues.map(v => {
                        const Icon = CATEGORY_ICON[v.category] ?? Building2;
                        return (
                            <TouchableOpacity
                                key={v.id}
                                style={s.placeCard}
                                onPress={() => router.push({ pathname: "/explore/venue-detail", params: { id: v.id } })}
                                activeOpacity={0.85}
                            >
                                <View style={s.placeIconWrap}>
                                    <Icon size={16} color="#c9a84c" />
                                </View>
                                <Text style={s.placeName} numberOfLines={1}>{v.name}</Text>
                                {v.address && <Text style={s.placeArea} numberOfLines={1}>{v.address}</Text>}
                                <View style={s.placeBadgeWrap}>
                                    <Text style={s.placeBadgeText}>{CATEGORY_LABELS[v.category] ?? v.category}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    {cityVenues.length === 0 && (
                        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, paddingVertical: 20 }}>No venues yet</Text>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    mapPlaceholder: { flex: 1, backgroundColor: "#0a0a0a", overflow: "hidden" },
    gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(201,168,76,0.07)" },
    gridLineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(201,168,76,0.07)" },
    headerOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
    headerBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(10,10,10,0.9)", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" },
    headerBadgeText: { fontSize: 10, fontWeight: "800", color: "#c9a84c", letterSpacing: 2 },
    cityToggle: { flexDirection: "row", backgroundColor: "rgba(10,10,10,0.9)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", overflow: "hidden" },
    cityBtn: { paddingHorizontal: 14, paddingVertical: 6 },
    cityBtnActive: { backgroundColor: "#c9a84c" },
    cityBtnText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.5)" },
    cityBtnTextActive: { color: "#0a0a0a" },
    pin: { position: "absolute", alignItems: "center" },
    pinTooltip: { backgroundColor: "rgba(15,15,15,0.92)", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 6, maxWidth: 120 },
    pinLabel: { fontSize: 10, fontWeight: "600", color: "#fff" },
    pinCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#c9a84c", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#0a0a0a", shadowColor: "#c9a84c", shadowOpacity: 0.7, shadowRadius: 8, elevation: 6 },
    bottomCard: { backgroundColor: "rgba(12,12,12,0.98)", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, borderTopWidth: 1, borderTopColor: "rgba(201,168,76,0.2)" },
    bottomHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(201,168,76,0.3)", alignSelf: "center", marginBottom: 16 },
    bottomTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 16 },
    placeCard: { width: 140, backgroundColor: "rgba(201,168,76,0.05)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(201,168,76,0.2)" },
    placeIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(201,168,76,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
    placeName: { fontSize: 13, fontWeight: "700", color: "#fff", marginBottom: 2 },
    placeArea: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 },
    placeBadgeWrap: { backgroundColor: "rgba(201,168,76,0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
    placeBadgeText: { fontSize: 10, fontWeight: "700", color: "#c9a84c" },
});
