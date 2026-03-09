import { useMemo } from "react";
import {
    View, Text, TouchableOpacity, StyleSheet, Image, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MapPin, Crown, Search } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const { width, height } = Dimensions.get("window");

const pins = [
    { top: "35%", left: "25%", icon: "map", label: "Eko Hotel", badge: "Member Rate", dark: false },
    { top: "50%", left: "55%", icon: "coffee", label: "Nok by Alara", badge: "Exclusive Access", dark: true },
    { top: "25%", left: "65%", icon: "crown", label: "Quilox", badge: "VIP Access", dark: false },
    { top: "65%", left: "35%", icon: "coffee", label: "Terra Kulture", badge: "Partner", dark: true },
];

export default function MapScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    return (
        <View style={s.root}>
            {/* Map Background */}
            <Image
                source={require("@/assets/images/lagos-map.jpg")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />

            {/* Header overlay */}
            <SafeAreaView style={s.headerOverlay}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.cardFg} />
                </TouchableOpacity>
                <View style={s.searchBar}>
                    <Search size={20} color={C.muted} style={{ marginRight: 12 }} />
                    <Text style={s.searchText}>Search locations...</Text>
                </View>
            </SafeAreaView>

            {/* Map pins */}
            {pins.map((pin) => (
                <View
                    key={pin.label}
                    style={[s.pin, { top: pin.top as any, left: pin.left as any }]}
                >
                    {/* Tooltip */}
                    <View style={s.tooltip}>
                        <Text style={s.tooltipTitle}>{pin.label}</Text>
                        <Text style={s.tooltipBadge}>{pin.badge}</Text>
                    </View>
                    {/* Pin circle */}
                    <View style={[s.pinCircle, pin.dark && s.pinCircleDark]}>
                        {pin.icon === "crown"
                            ? <Crown size={28} color={pin.dark ? C.black : C.cardFg} />
                            : <MapPin size={28} color={pin.dark ? C.black : C.cardFg} />}
                    </View>
                </View>
            ))}

            {/* Bottom card */}
            <View style={s.bottomCard}>
                <View style={s.bottomCardInner}>
                    <View style={s.bottomCardRow}>
                        <Text style={s.bottomTitle}>Partner Locations</Text>
                        <Text style={s.viewAll}>View all</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        {[
                            { name: "Eko Hotel", area: "Victoria Island", badge: "Member Rate" },
                            { name: "Nok by Alara", area: "Oniru, Lekki", badge: "Priority Booking" },
                        ].map((place) => (
                            <TouchableOpacity key={place.name} style={s.placeCard}>
                                <Text style={s.placeName}>{place.name}</Text>
                                <Text style={s.placeArea}>{place.area}</Text>
                                <View style={s.placeBadgeWrap}>
                                    <Text style={s.placeBadge}>{place.badge}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1 },
    headerOverlay: {
        position: "absolute",
        top: 0, left: 0, right: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: 20,
        paddingBottom: 16,
        zIndex: 10,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: `${C.card}d9`,
        alignItems: "center", justifyContent: "center",
        shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    searchBar: {
        flex: 1, height: 48, borderRadius: 16,
        backgroundColor: `${C.card}d9`,
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16,
        shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    searchText: { fontSize: 16, color: C.muted },
    pin: {
        position: "absolute",
        alignItems: "center",
        zIndex: 5,
    },
    tooltip: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: C.card,
        marginBottom: 6,
        shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
    },
    tooltipTitle: { fontSize: 12, fontWeight: "600", color: C.text },
    tooltipBadge: { fontSize: 10, fontWeight: "700", color: C.primary, marginTop: 2 },
    pinCircle: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: C.primary,
        alignItems: "center", justifyContent: "center",
        shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
    },
    pinCircleDark: { backgroundColor: C.text },
    bottomCard: {
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingTop: 0, paddingBottom: 40,
    },
    bottomCardInner: {
        borderRadius: 20,
        backgroundColor: `${C.card}f2`,
        padding: 20,
        shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
        borderWidth: 1, borderColor: C.border,
    },
    bottomCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    bottomTitle: { fontSize: 18, fontWeight: "600", color: C.text },
    viewAll: { fontSize: 14, color: C.primary, fontWeight: "600" },
    placeCard: { flex: 1, borderRadius: 16, backgroundColor: C.surface, padding: 16 },
    placeName: { fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 2 },
    placeArea: { fontSize: 13, color: C.muted, marginBottom: 8 },
    placeBadgeWrap: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
        backgroundColor: `${C.primary}18`,
        alignSelf: "flex-start",
    },
    placeBadge: {
        fontSize: 11, fontWeight: "600", color: C.primary,
    },
});
