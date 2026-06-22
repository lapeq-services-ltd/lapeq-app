import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Check, Lock } from "lucide-react-native";

const TIER_DATA: Record<string, {
    name: string;
    accent: string;
    bg: string;
    plans: { label: string; price: string; note: string }[];
    invite: boolean;
}> = {
    silver: {
        name: "Silver",
        accent: "#a8b8cc",
        bg: "#0a0c10",
        plans: [
            { label: "3 Months", price: "₦350,000", note: "Best for trying out" },
            { label: "6 Months", price: "₦500,000", note: "Best value" },
            { label: "1 Year", price: "₦850,000", note: "Full annual access" },
        ],
        invite: false,
    },
    gold: {
        name: "Gold",
        accent: "#c9a84c",
        bg: "#080806",
        plans: [
            { label: "1 Year", price: "₦2,500,000", note: "Full annual access" },
        ],
        invite: false,
    },
    black: {
        name: "Black",
        accent: "#e8e8e8",
        bg: "#000000",
        plans: [],
        invite: true,
    },
};

export default function MembershipRequestScreen() {
    const router = useRouter();
    const { tier } = useLocalSearchParams<{ tier: string }>();
    const tierKey = (tier ?? "silver").toLowerCase();
    const data = TIER_DATA[tierKey] ?? TIER_DATA.silver;

    const [selectedPlan, setSelectedPlan] = useState(0);

    return (
        <View style={[s.root, { backgroundColor: data.bg }]}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={s.header}>
                        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                            <ChevronLeft size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Logo */}
                    <View style={s.logoWrap}>
                        <Image
                            source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={[s.logo, { tintColor: data.accent }]}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Title */}
                    <View style={s.titleSection}>
                        <Text style={[s.eyebrow, { color: data.accent }]}>LAPEQ MEMBERSHIP</Text>
                        <Text style={s.title}>{data.name}</Text>
                        {data.invite ? (
                            <View style={[s.inviteBadge, { borderColor: `${data.accent}40` }]}>
                                <Lock size={12} color={data.accent} />
                                <Text style={[s.inviteText, { color: data.accent }]}>This tier is by invitation only</Text>
                            </View>
                        ) : (
                            <Text style={[s.subtitle, { color: "rgba(255,255,255,0.5)" }]}>
                                Choose your plan and get started today.
                            </Text>
                        )}
                    </View>

                    {/* Plan selector */}
                    {!data.invite && data.plans.length > 0 && (
                        <View style={s.plansSection}>
                            <Text style={[s.sectionLabel, { color: "rgba(255,255,255,0.3)" }]}>SELECT A PLAN</Text>
                            {data.plans.map((plan, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        s.planCard,
                                        { borderColor: i === selectedPlan ? data.accent : "rgba(255,255,255,0.1)" },
                                        i === selectedPlan && { backgroundColor: `${data.accent}12` },
                                    ]}
                                    onPress={() => setSelectedPlan(i)}
                                    activeOpacity={0.8}
                                >
                                    <View style={s.planLeft}>
                                        <Text style={[s.planLabel, { color: i === selectedPlan ? data.accent : "rgba(255,255,255,0.6)" }]}>
                                            {plan.label}
                                        </Text>
                                        <Text style={[s.planNote, { color: "rgba(255,255,255,0.35)" }]}>{plan.note}</Text>
                                    </View>
                                    <View style={s.planRight}>
                                        <Text style={[s.planPrice, { color: i === selectedPlan ? data.accent : "rgba(255,255,255,0.8)" }]}>
                                            {plan.price}
                                        </Text>
                                        {i === selectedPlan && (
                                            <View style={[s.planCheck, { backgroundColor: data.accent }]}>
                                                <Check size={12} color="#0a0a0a" strokeWidth={3} />
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* What happens next */}
                    <View style={s.nextSection}>
                        <Text style={[s.sectionLabel, { color: "rgba(255,255,255,0.3)" }]}>WHAT HAPPENS NEXT</Text>
                        {(data.invite ? [
                            "Submit your invitation request",
                            "Lapeq reviews your profile",
                            "You receive a personal call from our team",
                            "Your Black membership is activated",
                        ] : [
                            "Tap Pay Now below",
                            "Complete your payment securely",
                            "Your membership is activated instantly",
                            "Your physical Lapeq card is dispatched",
                        ]).map((step, i) => (
                            <View key={i} style={s.stepRow}>
                                <View style={[s.stepNum, { borderColor: `${data.accent}40` }]}>
                                    <Text style={[s.stepNumText, { color: data.accent }]}>{i + 1}</Text>
                                </View>
                                <Text style={s.stepText}>{step}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {/* Pay button */}
                <View style={s.footer}>
                    {!data.invite && data.plans.length > 0 && (
                        <Text style={[s.footerPrice, { color: data.accent }]}>
                            {data.plans[selectedPlan].price} · {data.plans[selectedPlan].label}
                        </Text>
                    )}
                    <TouchableOpacity
                        style={[s.cta, { backgroundColor: data.accent }]}
                        activeOpacity={0.85}
                        onPress={() => router.back()}
                    >
                        <Text style={s.ctaText}>
                            {data.invite ? "Request Invitation" : "Pay Now"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
    backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },

    logoWrap: { alignItems: "center", marginVertical: 24 },
    logo: { width: 52, height: 52, opacity: 0.85 },

    titleSection: { paddingHorizontal: 26, marginBottom: 36 },
    eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 3, marginBottom: 8 },
    title: { fontSize: 52, fontWeight: "800", letterSpacing: -2, color: "#fff", marginBottom: 10 },
    subtitle: { fontSize: 15, lineHeight: 22 },
    inviteBadge: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignSelf: "flex-start" },
    inviteText: { fontSize: 13, fontWeight: "600" },

    sectionLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 2, marginBottom: 14 },

    plansSection: { paddingHorizontal: 26, marginBottom: 36 },
    planCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 12 },
    planLeft: { gap: 4 },
    planLabel: { fontSize: 16, fontWeight: "700" },
    planNote: { fontSize: 12 },
    planRight: { flexDirection: "row", alignItems: "center", gap: 10 },
    planPrice: { fontSize: 20, fontWeight: "800" },
    planCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },

    nextSection: { paddingHorizontal: 26, marginBottom: 20 },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
    stepNum: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    stepNumText: { fontSize: 12, fontWeight: "800" },
    stepText: { fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 20, flex: 1 },

    footer: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 12, gap: 8 },
    footerPrice: { fontSize: 14, fontWeight: "700", textAlign: "center" },
    cta: { borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    ctaText: { fontSize: 15, fontWeight: "800", color: "#0a0a0a", letterSpacing: 0.3 },
});
