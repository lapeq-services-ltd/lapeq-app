import { useState, useEffect, useRef } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Crown, MapPin, Users, ShieldCheck, Lock, Check } from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";

export default function MembershipScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const tiers = [
        {
            name: "Community", subtitle: "FREE", tagline: "Free",
            bgColor: "#4a4a4a", active: false, done: true, invite: false,
            perks: ["Physical LAPEQ membership card mailed to you", "Monthly lifestyle digest", "Curated city guides for restaurants, hotels & events", "Community events access", "Member-only benefits"],
        },
        {
            name: "Silver", subtitle: "ESSENTIAL ACCESS", tagline: "Essential Access",
            bgColor: "#C0C0C0", active: false, done: false, invite: false,
            perks: ["Priority hotel & apartment bookings", "Flight assistance", "Restaurant & lounge reservations", "Executive car hire", "Event coordination", "Business hours concierge"],
        },
        {
            name: "Gold", subtitle: "ENHANCED PRIVILEGES", tagline: "Enhanced Privileges",
            bgColor: C.primary, active: true, done: false, invite: false,
            perks: ["Everything in Silver", "24-hour concierge access", "Fast-track request handling", "VIP restaurant & lounge reservations", "Curated private experiences", "Personalised itinerary planning", "Dedicated concierge"],
        },
        {
            name: "Black", subtitle: "INVITE ONLY", tagline: "Invite Only",
            bgColor: C.black, active: false, done: false, invite: true,
            perks: ["Everything in Gold", "24/7 dedicated concierge manager", "Unlimited requests", "VIP & private event access", "Confidential personal assistance", "Private security", "Full lifestyle management"],
        },
    ];

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={32} color={C.cardFg} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Membership</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                <View style={s.profileRow}>
                    <View style={s.avatar}>
                        <Image
                            source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={{ width: 44, height: 44 }}
                            resizeMode="contain"
                        />
                    </View>
                    <View>
                        <Text style={s.profileName}>Chidi O.</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <Crown size={16} color={C.primary} />
                            <Text style={s.profileTier}>Gold Member</Text>
                        </View>
                    </View>
                </View>

                <View style={s.memberCard}>
                    <View style={s.cardGlow1} />
                    <View style={s.cardGlow2} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={s.cardWordmark}>LAPEQ</Text>
                        <Image
                            source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={{ width: 28, height: 28 }}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={{ marginTop: "auto" }}>
                        <Text style={s.cardSince}>Member Since 2025</Text>
                        <Text style={s.cardName}>Chidi Okonkwo</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <Text style={s.cardTier}>Gold Tier</Text>
                            <Text style={s.cardBadge}>Enhanced Privileges</Text>
                        </View>
                    </View>
                </View>

                <View style={s.orderBox}>
                    <View style={s.orderGlow} />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <Image
                            source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={{ width: 24, height: 24 }}
                            resizeMode="contain"
                        />
                        <Text style={s.orderTitle}>Order Your LAPEQ Card</Text>
                    </View>

                    <View style={s.physCard}>
                        <View style={s.physGlow} />
                        <View>
                            <Text style={s.physSub}>Physical Card</Text>
                            <Text style={s.physTitle}>LAPEQ Gold</Text>
                            <Text style={s.physName}>Chidi Okonkwo</Text>
                        </View>
                        <Image
                            source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={{ width: 36, height: 36 }}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={s.deliveryRow}>
                        <MapPin size={20} color={C.primary} />
                        <View>
                            <Text style={s.deliveryLabel}>Delivery address</Text>
                            <Text style={s.deliveryAddr}>4 Aguiyi Ironsi St, Maitama, Abuja</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={s.cardBtn}>
                        <Text style={s.cardBtnText}>Request Card Delivery</Text>
                    </TouchableOpacity>
                </View>

                <Text style={s.sectionTitle}>Membership Tiers</Text>
                <Text style={s.sectionSub}>Membership fees tailored to service scope.</Text>
                <View style={{ gap: 10, marginBottom: 24 }}>
                    {tiers.map((tier) => (
                        <View key={tier.name} style={[s.tierRow, tier.active && s.tierRowActive]}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                <View style={[s.tierIcon, { backgroundColor: tier.bgColor }]}>
                                    {tier.invite ? (
                                        <Lock size={20} color={C.primary} />
                                    ) : tier.done ? (
                                        <Check size={20} color={C.cream} />
                                    ) : (
                                        <Crown size={20} color={tier.name === "Gold" ? C.black : tier.name === "Silver" ? C.black : C.cream} />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Text style={[s.tierName, tier.active && { color: C.primary }]}>{tier.name}</Text>
                                        <Text style={[s.tierBadge, tier.active && s.tierBadgeActive, tier.invite && s.tierBadgeInvite]}>
                                            {tier.subtitle}
                                        </Text>
                                    </View>
                                    <Text style={s.tierTagline}>{tier.tagline}</Text>
                                </View>
                            </View>
                            <View style={{ gap: 6, paddingLeft: 4 }}>
                                {tier.perks.map((perk) => (
                                    <View key={perk} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                                        <View style={s.perkDot} />
                                        <Text style={s.perkText}>{perk}</Text>
                                    </View>
                                ))}
                            </View>
                            {!tier.active && !tier.done && (
                                <TouchableOpacity style={s.enquireBtn} onPress={() => router.push({ pathname: "/join/request", params: { tier: tier.name } })}>
                                    <Text style={s.enquireBtnText}>{tier.invite ? "Request Invitation" : `Enquire About ${tier.name}`}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>

                <View style={s.corpBox}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <Users size={24} color={C.primary} />
                        <Text style={s.corpTitle}>Corporate Membership</Text>
                    </View>
                    <Text style={s.corpDesc}>Tailored concierge solutions for teams and executives. Bespoke packages designed around your organisation.</Text>
                    <TouchableOpacity style={s.corpBtn} onPress={() => router.push({ pathname: "/join/request", params: { tier: "Corporate" } })}>
                        <Text style={s.corpBtnText}>Contact Us</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.securityBox}>
                    <ShieldCheck size={28} color={C.primary} />
                    <View>
                        <Text style={s.securityTitle}>Discreet Security</Text>
                        <Text style={s.securitySub}>Private security arrangements available upon request.</Text>
                    </View>
                </View>

                <TouchableOpacity style={[s.corpBtn, { marginTop: 24, backgroundColor: 'transparent', borderWidth: 1, borderColor: C.primary }]} onPress={() => router.push("/join/request")}>
                    <Text style={[s.corpBtnText, { color: C.primary }]}>Demo: Request Flow Simulation</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    profileRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.surface, borderWidth: 2, borderColor: C.primary, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    profileName: { fontSize: 20, fontWeight: "700", color: C.text },
    profileTier: { fontSize: 14, fontWeight: "600", color: C.primary },
    memberCard: { borderRadius: 20, padding: 24, height: 220, marginBottom: 24, overflow: "hidden", backgroundColor: C.primary, position: "relative" },
    cardGlow1: { position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: "#b8922e" },
    cardGlow2: { position: "absolute", bottom: -60, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "#a07828" },
    cardWordmark: { fontSize: 24, fontWeight: "800", color: "#000000", letterSpacing: 4 },
    cardSince: { fontSize: 13, color: `rgba(0,0,0,0.6)`, textTransform: "uppercase", letterSpacing: 2, marginBottom: 2 },
    cardName: { fontSize: 22, fontWeight: "700", color: "#000000" },
    cardTier: { fontSize: 13, fontWeight: "600", color: "#000000" },
    cardBadge: { fontSize: 11, fontWeight: "700", color: C.primary, backgroundColor: "#000000", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
    orderBox: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 32, overflow: "hidden" },
    orderGlow: { position: "absolute", top: 0, right: 0, width: 100, height: 100, borderRadius: 50, backgroundColor: `${C.primary}15`, transform: [{ scale: 2 }] },
    orderTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    physCard: { borderRadius: 12, backgroundColor: "#000000", padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
    physGlow: { position: "absolute", top: -20, left: -20, width: 60, height: 60, borderRadius: 30, backgroundColor: `${C.primary}33` },
    physSub: { fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
    physTitle: { fontSize: 16, fontWeight: "700", color: "#ffffff", marginBottom: 2 },
    physName: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
    deliveryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16 },
    deliveryLabel: { fontSize: 12, color: C.muted, marginBottom: 2 },
    deliveryAddr: { fontSize: 14, fontWeight: "500", color: C.text },
    cardBtn: { borderRadius: 12, paddingVertical: 14, backgroundColor: C.primary, alignItems: "center" },
    cardBtnText: { fontSize: 15, fontWeight: "700", color: C.black },
    sectionTitle: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 4 },
    sectionSub: { fontSize: 14, color: C.muted, marginBottom: 16 },
    tierRow: { backgroundColor: C.surface, borderRadius: 16, padding: 20, borderWidth: 2, borderColor: "transparent" },
    tierRowActive: { borderColor: C.primary, backgroundColor: `${C.primary}08` },
    tierIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    tierName: { fontSize: 18, fontWeight: "700", color: C.text },
    tierBadge: { fontSize: 10, fontWeight: "700", color: C.muted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: C.background, overflow: "hidden" },
    tierBadgeActive: { color: C.primary, backgroundColor: `${C.primary}18` },
    tierBadgeInvite: { color: C.black, backgroundColor: C.primary },
    tierTagline: { fontSize: 13, color: C.muted, marginTop: 4 },
    perkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
    perkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.muted, marginTop: 7 },
    perkDotActive: { backgroundColor: C.primary },
    perkText: { flex: 1, fontSize: 14, color: C.muted, lineHeight: 20 },
    perkTextActive: { color: C.text },
    enquireBtn: { marginTop: 16, borderRadius: 16, paddingVertical: 14, backgroundColor: C.text, alignItems: "center" },
    enquireBtnText: { fontSize: 15, fontWeight: "600", color: C.background },
    manageBtn: { borderRadius: 12, paddingVertical: 12, backgroundColor: C.text, alignItems: "center", marginTop: 8 },
    manageBtnText: { fontSize: 14, fontWeight: "600", color: C.background },
    corpBox: { borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, padding: 20, marginBottom: 16 },
    corpTitle: { fontSize: 18, fontWeight: "600", color: C.text },
    corpDesc: { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 16 },
    corpBtn: { borderRadius: 16, paddingVertical: 14, backgroundColor: C.primary, alignItems: "center" },
    corpBtnText: { fontSize: 15, fontWeight: "600", color: C.black },
    securityBox: { borderRadius: 16, backgroundColor: C.surface, padding: 16, flexDirection: "row", alignItems: "center", gap: 16 },
    securityTitle: { fontSize: 14, fontWeight: "600", color: C.text },
    securitySub: { fontSize: 13, color: C.muted, lineHeight: 20 },
});
