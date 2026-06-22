import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MapPin, Coffee, Crown, Clock, Star } from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";

export default function TripPlannerScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const DAY_1 = [
        { icon: <MapPin size={20} color={C.text} />, title: "Check in at Eko Hotel & Suites", time: "2:00 PM", rating: "4.8", desc: "Ocean view suite, Victoria Island. Pool access and spa arranged.", tag: "Reservation handled by concierge", vip: false },
        { icon: <Coffee size={20} color={C.text} />, title: "Dinner at Nok by Alara", time: "7:30 PM", rating: "4.9", desc: "Modern Nigerian cuisine. Private table reserved with personal sommelier.", tag: "Car hire arranged", vip: false },
        { icon: <Crown size={20} color={C.primary} />, title: "VIP Evening at Quilox", time: "11:00 PM", rating: null, desc: "VIP table and bottle service arranged. No queue, no hassle - simply arrive.", tag: "Priority Access", vip: true },
    ];

    const DAY_2 = [
        { icon: <MapPin size={20} color={C.text} />, title: "Nike Art Gallery", time: "10:00 AM", rating: null, desc: "Private guided tour of four floors of Nigerian art. A truly immersive experience.", tag: null, vip: false },
        { icon: <Coffee size={20} color={C.text} />, title: "Lunch at Terra Kulture", time: "1:00 PM", rating: "4.7", desc: "Art, food, and culture in one destination. Reservation secured by your concierge.", tag: null, vip: false },
        { icon: <MapPin size={20} color={C.text} />, title: "Elegushi Beach Club", time: "4:00 PM", rating: null, desc: "Private cabana reserved. Refreshments arranged. Simply arrive and unwind.", tag: "Member Access", vip: false },
    ];

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={32} color={C.cardFg} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Your Experience</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                <View style={s.hero}>
                    <View style={s.heroOverlay} />
                    <View style={s.heroContent}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <Crown size={18} color={C.primary} />
                            <Text style={s.heroCurated}>Curated by Your Concierge</Text>
                        </View>
                        <Text style={s.heroTitle}>Lagos Weekend Experience</Text>
                        <Text style={s.heroDates}>Fri Mar 20 - Sun Mar 22</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        {["Lagos", "Abuja", "Port Harcourt", "Akwa Ibom", "Kano"].map((city) => {
                            const isAvailable = city === "Lagos" || city === "Abuja";
                            const displayLabel = isAvailable ? city : `${city} (Soon)`;
                            return (
                                <TouchableOpacity key={city} style={[s.cityChip, city === "Lagos" && s.cityChipActive]}>
                                    <Text style={[s.cityChipText, city === "Lagos" && s.cityChipTextActive]}>{displayLabel}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <View style={s.dayBadge}><Text style={s.dayNum}>1</Text></View>
                    <Text style={s.dayTitle}>Friday - Arrive & Settle</Text>
                </View>
                <View style={s.timeline}>
                    {DAY_1.map((item, i) => (
                        <View key={i} style={[s.timelineItem, item.vip && s.timelineItemVip]}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                <View style={{ width: 24, alignItems: "center" }}>{item.icon}</View>
                                <Text style={s.itemTitle}>{item.title}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 10 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                    <Clock size={14} color={C.muted} />
                                    <Text style={s.itemMeta}>{item.time}</Text>
                                </View>
                                {item.rating && (
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                        <Star size={14} color={C.primary} fill={C.primary} />
                                        <Text style={s.itemMeta}>{item.rating}</Text>
                                    </View>
                                )}
                                {item.vip && <Text style={s.priorityBadge}>Priority Access</Text>}
                            </View>
                            <Text style={s.itemDesc}>{item.desc}</Text>
                            {item.tag && !item.vip && (
                                <View style={s.tagBadge}><Text style={s.tagBadgeText}>{item.tag}</Text></View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 20 }}>
                    <View style={s.dayBadge}><Text style={s.dayNum}>2</Text></View>
                    <Text style={s.dayTitle}>Saturday - Explore & Unwind</Text>
                </View>
                <View style={s.timeline}>
                    {DAY_2.map((item, i) => (
                        <View key={i} style={s.timelineItem}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                <View style={{ width: 24, alignItems: "center" }}>{item.icon}</View>
                                <Text style={s.itemTitle}>{item.title}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 10 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                    <Clock size={14} color={C.muted} />
                                    <Text style={s.itemMeta}>{item.time}</Text>
                                </View>
                                {item.rating && (
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                        <Star size={14} color={C.primary} fill={C.primary} />
                                        <Text style={s.itemMeta}>{item.rating}</Text>
                                    </View>
                                )}
                                {item.tag && <Text style={s.priorityBadge}>{item.tag}</Text>}
                            </View>
                            <Text style={s.itemDesc}>{item.desc}</Text>
                        </View>
                    ))}
                </View>

                <View style={s.conciergeNote}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <Crown size={20} color={C.primary} />
                        <Text style={s.conciergeNoteTitle}>Everything Is Handled</Text>
                    </View>
                    <Text style={s.conciergeNoteBody}>
                        All reservations, car hire, and arrangements have been coordinated by your dedicated concierge. Costs are managed through your membership - no surprises, no hassle.
                    </Text>
                </View>

                <TouchableOpacity style={s.cta}>
                    <Text style={s.ctaText}>Contact Concierge</Text>
                </TouchableOpacity>
                <Text style={s.ctaSub}>Available 24/7 for adjustments</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    hero: { height: 160, borderRadius: 20, backgroundColor: "#d4c8a8", overflow: "hidden", marginBottom: 24, justifyContent: "flex-end" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6,6,6,0.5)" },
    heroContent: { padding: 24 },
    heroCurated: { fontSize: 13, color: C.primary, fontWeight: "600" },
    heroTitle: { fontSize: 24, fontWeight: "700", color: "#ffffff", marginBottom: 4 },
    heroDates: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
    cityChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: C.surface },
    cityChipActive: { backgroundColor: C.text },
    cityChipText: { fontSize: 15, fontWeight: "600", color: C.text },
    cityChipTextActive: { color: C.background },
    dayBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
    dayNum: { fontSize: 14, fontWeight: "700", color: C.black },
    dayTitle: { fontSize: 18, fontWeight: "700", color: C.text },
    timeline: { marginLeft: 16, paddingLeft: 24, borderLeftWidth: 2, borderLeftColor: `${C.primary}33`, gap: 16, paddingBottom: 12 },
    timelineItem: { borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, padding: 16 },
    timelineItemVip: { borderColor: `${C.primary}4d`, backgroundColor: `${C.primary}0d` },
    itemTitle: { fontSize: 16, fontWeight: "600", color: C.text, flex: 1 },
    itemMeta: { fontSize: 13, color: C.muted, fontWeight: "500" },
    itemDesc: { fontSize: 13, color: C.muted, lineHeight: 20 },
    priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: `${C.primary}18`, fontSize: 11, fontWeight: "600", color: C.primary },
    tagBadge: { marginTop: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: `${C.primary}18`, alignSelf: "flex-start" },
    tagBadgeText: { fontSize: 11, fontWeight: "600", color: C.primary },
    conciergeNote: { borderRadius: 20, backgroundColor: C.black, padding: 20, marginTop: 24, marginBottom: 24 },
    conciergeNoteTitle: { fontSize: 16, fontWeight: "600", color: C.cream },
    conciergeNoteBody: { fontSize: 14, color: `${C.cream}b3`, lineHeight: 22 },
    cta: { borderRadius: 20, paddingVertical: 18, backgroundColor: C.primary, alignItems: "center", marginBottom: 12 },
    ctaText: { fontSize: 18, fontWeight: "600", color: C.black },
    ctaSub: { textAlign: "center", fontSize: 13, color: C.muted },
});
