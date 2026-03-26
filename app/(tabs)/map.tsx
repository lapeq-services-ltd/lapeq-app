import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Crown, UtensilsCrossed, Sparkles, Ticket, MapPin, ChevronDown } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useRef } from "react";

const PARTNERS = [
    { id: "1", name: "Eko Hotel & Suites", area: "Victoria Island", category: "Hotel", badge: "Member Rate" },
    { id: "2", name: "Nok by Alara", area: "Oniru, Lekki", category: "Restaurant", badge: "Priority Booking" },
    { id: "3", name: "Quilox Club", area: "Victoria Island", category: "Nightlife", badge: "VIP Access" },
    { id: "4", name: "Four Points by Sheraton", area: "Oniru", category: "Hotel", badge: "Concierge Rate" },
    { id: "5", name: "Cactus Restaurant", area: "Victoria Island", category: "Restaurant", badge: "Reservation" },
    { id: "6", name: "Ikoyi Club 1938", area: "Ikoyi", category: "Wellness", badge: "Partner" },
];

const CATEGORY_ICON: Record<string, any> = {
    Hotel: Crown,
    Restaurant: UtensilsCrossed,
    Nightlife: Ticket,
    Wellness: Sparkles,
};

const PIN_POSITIONS = [
    { top: "30%", left: "22%" },
    { top: "48%", left: "58%" },
    { top: "22%", left: "68%" },
    { top: "62%", left: "38%" },
];

export default function MapScreen() {
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);
    const [selected, setSelected] = useState<typeof PARTNERS[0] | null>(null);
    const sheetAnim = useRef(new Animated.Value(0)).current;

    const openSheet = (partner: typeof PARTNERS[0]) => {
        setSelected(partner);
        Animated.spring(sheetAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    };

    const closeSheet = () => {
        Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setSelected(null));
    };

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

                {PARTNERS.slice(0, 4).map((p, i) => {
                    const Icon = CATEGORY_ICON[p.category] ?? MapPin;
                    return (
                        <TouchableOpacity key={p.id} style={[s.pin, PIN_POSITIONS[i] as any]} onPress={() => openSheet(p)} activeOpacity={0.85}>
                            <View style={s.pinTooltip}>
                                <Text style={s.pinLabel}>{p.name}</Text>
                            </View>
                            <View style={s.pinCircle}>
                                <Icon size={14} color="#0a0a0a" strokeWidth={2.5} />
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <SafeAreaView style={s.headerOverlay} pointerEvents="none">
                    <View style={s.headerBadge}>
                        <Crown size={12} color="#c9a84c" />
                        <Text style={s.headerBadgeText}>PARTNER LOCATIONS</Text>
                    </View>
                </SafeAreaView>
            </View>

            {/* Bottom card */}
            <View style={s.bottomCard}>
                <View style={s.bottomHandle} />
                <Text style={s.bottomTitle}>Nearby Partners</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                    {PARTNERS.map(p => {
                        const Icon = CATEGORY_ICON[p.category] ?? MapPin;
                        return (
                            <TouchableOpacity key={p.id} style={s.placeCard} onPress={() => openSheet(p)} activeOpacity={0.85}>
                                <View style={s.placeIconWrap}>
                                    <Icon size={16} color="#c9a84c" />
                                </View>
                                <Text style={s.placeName} numberOfLines={1}>{p.name}</Text>
                                <Text style={s.placeArea} numberOfLines={1}>{p.area}</Text>
                                <View style={s.placeBadgeWrap}>
                                    <Text style={s.placeBadgeText}>{p.badge}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Detail sheet */}
            {selected && (
                <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                    <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={closeSheet} />
                    <Animated.View style={[s.sheet, {
                        transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }]
                    }]}>
                        <View style={s.sheetHandle} />
                        <TouchableOpacity style={s.sheetClose} onPress={closeSheet}>
                            <ChevronDown size={20} color="#c9a84c" />
                        </TouchableOpacity>
                        <View style={s.sheetIconWrap}>
                            {(() => { const Icon = CATEGORY_ICON[selected.category] ?? MapPin; return <Icon size={24} color="#c9a84c" />; })()}
                        </View>
                        <Text style={s.sheetCategory}>{selected.category.toUpperCase()}</Text>
                        <Text style={s.sheetName}>{selected.name}</Text>
                        <Text style={s.sheetArea}>{selected.area}</Text>
                        <View style={s.sheetBadgeWrap}>
                            <Text style={s.sheetBadgeText}>{selected.badge}</Text>
                        </View>
                        <TouchableOpacity style={s.sheetBtn}>
                            <Text style={s.sheetBtnText}>Book via Lapeq</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    mapPlaceholder: { flex: 1, backgroundColor: "#0a0a0a", overflow: "hidden" },
    gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(201,168,76,0.07)" },
    gridLineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(201,168,76,0.07)" },
    headerOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
    headerBadge: { flexDirection: "row", alignItems: "center", gap: 6, margin: 20, backgroundColor: "rgba(10,10,10,0.9)", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" },
    headerBadgeText: { fontSize: 10, fontWeight: "800", color: "#c9a84c", letterSpacing: 2 },
    pin: { position: "absolute", alignItems: "center" },
    pinTooltip: { backgroundColor: "rgba(15,15,15,0.92)", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 6 },
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
    sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#0f0f0f", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48, borderTopWidth: 1, borderTopColor: "rgba(201,168,76,0.25)", alignItems: "center" },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(201,168,76,0.3)", marginBottom: 20 },
    sheetClose: { position: "absolute", top: 20, right: 24 },
    sheetIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(201,168,76,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(201,168,76,0.3)" },
    sheetCategory: { fontSize: 10, fontWeight: "800", color: "#c9a84c", letterSpacing: 2, marginBottom: 8 },
    sheetName: { fontSize: 22, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 4 },
    sheetArea: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 16 },
    sheetBadgeWrap: { backgroundColor: "rgba(201,168,76,0.12)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 28, borderWidth: 1, borderColor: "rgba(201,168,76,0.3)" },
    sheetBadgeText: { fontSize: 12, fontWeight: "700", color: "#c9a84c" },
    sheetBtn: { width: "100%", backgroundColor: "#c9a84c", borderRadius: 16, padding: 16, alignItems: "center" },
    sheetBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0a0a" },
});
