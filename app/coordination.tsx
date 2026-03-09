import { useState, useEffect, useRef } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ShieldCheck, Crown, Star, MessageCircle, Phone, CalendarDays, Clock } from "lucide-react-native";
import Svg, { Path, Circle } from "react-native-svg";

import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";

const scheduled = [
    { title: "Dinner at Nok by Alara", from: "Eko Hotel, VI", to: "Nok by Alara, Oniru", day: "Fri, Mar 20", time: "7:00 PM" },
    { title: "VIP Evening – Quilox", from: "Nok by Alara", to: "Quilox, Victoria Island", day: "Fri, Mar 20", time: "10:30 PM" },
    { title: "Nike Art Gallery Tour", from: "Eko Hotel, VI", to: "Nike Art Gallery, Lekki", day: "Sat, Mar 21", time: "9:30 AM" },
    { title: "Elegushi Beach Club", from: "Terra Kulture, VI", to: "Elegushi Beach, Lekki", day: "Sat, Mar 21", time: "3:30 PM" },
    { title: "Airport Departure", from: "Eko Hotel, VI", to: "Murtala Muhammed Intl.", day: "Sun, Mar 22", time: "11:00 AM" },
];

export default function CoordinationScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [activeTab, setActiveTab] = useState<"current" | "upcoming">("current");
    const progressAnim = useRef(new Animated.Value(35)).current;

    useEffect(() => {
        const animate = () => {
            Animated.sequence([
                Animated.timing(progressAnim, { toValue: 85, duration: 5000, useNativeDriver: false }),
                Animated.timing(progressAnim, { toValue: 35, duration: 0, useNativeDriver: false }),
            ]).start(() => animate());
        };
        animate();
    }, []);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={32} color={C.cardFg} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Coordination</Text>
            </View>

            {/* Tabs */}
            <View style={s.tabBar}>
                {(["current", "upcoming"] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[s.tab, activeTab === tab && s.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                            {tab === "current" ? "En Route" : "Scheduled"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                {activeTab === "current" ? (
                    <>
                        {/* ETA Card */}
                        <View style={s.etaCard}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <Text style={s.etaLabel}>Arriving in</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <ShieldCheck size={18} color={C.green} />
                                    <Text style={s.verifiedText}>Verified</Text>
                                </View>
                            </View>
                            <Text style={s.etaTime}>8 min</Text>
                            <Text style={s.etaCar}>Toyota Camry — Silver — LND 234 GH</Text>
                            <View style={s.membershipTag}>
                                <Crown size={16} color={theme === 'dark' ? C.black : C.primary} />
                                <Text style={s.membershipTagText}>Included in your membership</Text>
                            </View>
                        </View>

                        {/* Progress */}
                        <View style={{ marginBottom: 32 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
                                <View>
                                    <Text style={s.stopLabel}>Pickup</Text>
                                    <Text style={s.stopName}>Lekki Phase 1</Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={s.stopLabel}>Destination</Text>
                                    <Text style={s.stopName}>Nok by Alara, VI</Text>
                                </View>
                            </View>
                            <View style={{ position: "relative", marginBottom: 12 }}>
                                <View style={s.trackBar}>
                                    <Animated.View style={[s.trackFill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }]} />
                                </View>
                                <Animated.View
                                    style={[
                                        s.carIconWrap,
                                        { left: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }
                                    ]}
                                >
                                    <View style={s.carIconInner}>
                                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" color={C.black}>
                                            <Path d="M5 17h2m10 0h2M3 11l1.5-5.5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.5L21 11M3 11h18M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <Circle cx="7" cy="17" r="1.5" fill="currentColor" />
                                            <Circle cx="17" cy="17" r="1.5" fill="currentColor" />
                                        </Svg>
                                    </View>
                                </Animated.View>
                            </View>
                            <View style={s.trackDots}>
                                <View style={s.trackDotFilled} />
                                <View style={s.trackLine} />
                                <View style={s.trackDotEmpty} />
                            </View>
                        </View>

                        <View style={s.driverCard}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                                <View style={s.driverAvatar}>
                                    <Text style={s.driverInitials}>AB</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.driverName}>Abubakar S.</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Star size={14} color={C.primary} fill={C.primary} />
                                        <Text style={s.driverRating}>4.92</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: "row", gap: 12 }}>
                                    <TouchableOpacity style={s.driverActionSecondary}>
                                        <MessageCircle size={24} color={C.cardFg} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.driverActionPrimary}>
                                        <Phone size={24} color={C.black} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Updates */}
                        <Text style={s.sectionTitle}>Updates</Text>
                        <View style={{ gap: 12, marginBottom: 20 }}>
                            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                                <View style={[s.updateDot, { backgroundColor: C.green }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.updateTitle}>Driver en route to you</Text>
                                    <Text style={s.updateSub}>Passing Admiralty Way</Text>
                                </View>
                                <Text style={s.updateTime}>Now</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                                <View style={[s.updateDot, { backgroundColor: "rgba(6,6,6,0.15)" }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.updateTitle}>Arrangement confirmed</Text>
                                    <Text style={s.updateSub}>Your concierge arranged this ride</Text>
                                </View>
                                <Text style={s.updateTime}>2 min</Text>
                            </View>
                        </View>

                        {/* Safety */}
                        <View style={s.safetyBox}>
                            <ShieldCheck size={28} color={C.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={s.safetyTitle}>Share trip details</Text>
                                <Text style={s.safetySub}>Discreetly share your live location with someone you trust</Text>
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={s.memberBanner}>
                            <Crown size={20} color={C.primary} />
                            <Text style={s.memberBannerText}><Text style={s.memberBannerBold}>All movements coordinated</Text> through your membership.</Text>
                        </View>
                        <View style={{ gap: 12 }}>
                            {scheduled.map((trip, i) => (
                                <TouchableOpacity key={i} style={s.tripCard}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                        <Text style={s.tripTitle}>{trip.title}</Text>
                                        <Text style={s.arrangedBadge}>Arranged</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                        <CalendarDays size={16} color={C.muted} />
                                        <Text style={s.tripMeta}>{trip.day}</Text>
                                        <View style={{ width: 12 }} />
                                        <Clock size={16} color={C.muted} />
                                        <Text style={s.tripMeta}>{trip.time}</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                                        <View style={{ alignItems: "center", gap: 2 }}>
                                            <View style={s.routeDotFilled} />
                                            <View style={s.routeLine} />
                                            <View style={s.routeDotEmpty} />
                                        </View>
                                        <View style={{ gap: 8 }}>
                                            <Text style={s.routeStop}>{trip.from}</Text>
                                            <Text style={s.routeStop}>{trip.to}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    tabBar: { flexDirection: "row", marginHorizontal: 20, padding: 6, backgroundColor: C.surface, borderRadius: 16, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
    tabActive: { backgroundColor: C.background, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 14, fontWeight: "600", color: C.muted },
    tabTextActive: { color: C.text },
    etaCard: { borderRadius: 20, backgroundColor: theme === 'dark' ? C.primary : C.black, padding: 24, marginBottom: 28 },
    etaLabel: { fontSize: 13, color: theme === 'dark' ? "rgba(0,0,0,0.6)" : "rgba(240,236,228,0.6)", textTransform: "uppercase", letterSpacing: 1 },
    verifiedText: { fontSize: 12, color: theme === 'dark' ? "rgba(0,0,0,0.8)" : C.green, fontWeight: "600" },
    etaTime: { fontSize: 48, fontWeight: "700", color: theme === 'dark' ? "#000000" : C.background, marginBottom: 8 },
    etaCar: { fontSize: 14, color: theme === 'dark' ? "rgba(0,0,0,0.5)" : "rgba(240,236,228,0.5)", marginBottom: 16 },
    membershipTag: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: theme === 'dark' ? "rgba(0,0,0,0.1)" : "rgba(240,236,228,0.1)", alignSelf: "flex-start" },
    membershipTagText: { fontSize: 12, fontWeight: "600", color: theme === 'dark' ? C.black : C.primary },
    stopLabel: { fontSize: 12, color: C.muted },
    stopName: { fontSize: 15, fontWeight: "600", color: C.text, marginTop: 4 },
    trackBar: { height: 10, borderRadius: 5, backgroundColor: C.surface, overflow: "hidden" },
    trackFill: { height: "100%", backgroundColor: C.primary, borderRadius: 5 },
    carIconWrap: { position: "absolute", top: "50%", marginTop: -16, marginLeft: -16 },
    carIconInner: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
    trackDots: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
    trackDotFilled: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.primary },
    trackLine: { flex: 1, height: 1.5, borderStyle: "dashed", borderWidth: 1.5, borderColor: theme === 'dark' ? C.primary : C.border, marginHorizontal: 10 },
    trackDotEmpty: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: C.primary, backgroundColor: C.background },
    driverCard: { borderRadius: 20, borderWidth: 1, borderColor: theme === 'dark' ? C.primary : C.border, backgroundColor: C.background, padding: 20, marginBottom: 28 },
    driverAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    driverInitials: { fontSize: 18, fontWeight: "700", color: C.muted },
    driverName: { fontSize: 18, fontWeight: "600", color: C.text },
    driverRating: { fontSize: 14, fontWeight: "600", color: C.text },
    driverActionSecondary: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    driverActionPrimary: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: C.text, marginBottom: 16 },
    updateDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
    updateTitle: { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 2 },
    updateSub: { fontSize: 12, color: C.muted },
    updateTime: { fontSize: 12, color: C.muted, marginTop: 2 },
    safetyBox: { borderRadius: 16, backgroundColor: C.surface, padding: 16, flexDirection: "row", alignItems: "center", gap: 16 },
    safetyTitle: { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 2 },
    safetySub: { fontSize: 12, color: C.muted, lineHeight: 18 },
    memberBanner: { borderRadius: 16, backgroundColor: C.black, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
    memberBannerText: { fontSize: 14, color: "rgba(240,236,228,0.7)", flex: 1, lineHeight: 20 },
    memberBannerBold: { fontWeight: "700", color: C.background },
    tripCard: { borderRadius: 20, borderWidth: 1, borderColor: theme === 'dark' ? C.primary : C.border, backgroundColor: C.background, padding: 20, marginBottom: 12 },
    tripTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    arrangedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: "rgba(201,168,76,0.15)", fontSize: 11, fontWeight: "600", color: C.primary },
    tripMeta: { fontSize: 13, color: C.muted, fontWeight: "500" },
    routeDotFilled: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
    routeLine: { width: 2, height: 16, backgroundColor: theme === 'dark' ? C.primary : C.border },
    routeDotEmpty: { width: 10, height: 10, borderRadius: 5, borderWidth: 2.5, borderColor: C.primary, backgroundColor: C.background },
    routeStop: { fontSize: 14, fontWeight: "500", color: C.text },
});
