import { useState, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Crown, Check, Star } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const TIERS = [
    {
        id: "gold",
        label: "Gold",
        price: "₦150,000",
        period: "/year",
        color: "#c9a84c",
        perks: [
            "Priority request handling",
            "Dedicated concierge",
            "Airport coordination",
            "Lifestyle & travel planning",
            "Restaurant reservations",
        ],
    },
    {
        id: "black",
        label: "Black",
        price: "₦350,000",
        period: "/year",
        color: "#e2e8f0",
        perks: [
            "Everything in Gold",
            "Private jet coordination",
            "Exclusive venue access",
            "Corporate pairing",
            "24/7 personal manager",
        ],
    },
];

export default function TierPurchaseScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSubmit = async () => {
        if (!selected) return;
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const tier = TIERS.find(t => t.id === selected)!;
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "tier-purchase",
            status: "pending",
            reference: ref,
            title: `${tier.label} Membership`,
            details: { tier: tier.id, price: tier.price },
        });
        setLoading(false);
        if (!error) {
            setShowSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        }
    };

    return (
        <SafeAreaView style={s.root}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Text style={s.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.title}>Membership Upgrade</Text>
                <Text style={s.subtitle}>Select a tier and our team will reach out with payment details.</Text>

                {TIERS.map((tier) => {
                    const isSelected = selected === tier.id;
                    return (
                        <TouchableOpacity
                            key={tier.id}
                            style={[s.card, isSelected && { borderColor: tier.color, borderWidth: 2 }]}
                            onPress={() => setSelected(tier.id)}
                            activeOpacity={0.85}
                        >
                            <View style={s.cardHeader}>
                                <View style={[s.tierBadge, { backgroundColor: `${tier.color}18` }]}>
                                    <Crown size={14} color={tier.color} />
                                    <Text style={[s.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={[s.tierPrice, { color: tier.color }]}>{tier.price}</Text>
                                    <Text style={s.tierPeriod}>{tier.period}</Text>
                                </View>
                            </View>

                            <View style={s.divider} />

                            {tier.perks.map((perk) => (
                                <View key={perk} style={s.perkRow}>
                                    <Star size={11} color={tier.color} fill={tier.color} />
                                    <Text style={s.perkText}>{perk}</Text>
                                </View>
                            ))}

                            {isSelected && (
                                <View style={[s.selectedBadge, { backgroundColor: `${tier.color}18` }]}>
                                    <Check size={12} color={tier.color} />
                                    <Text style={[s.selectedText, { color: tier.color }]}>Selected</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}

                <TouchableOpacity
                    style={[s.btn, (!selected || loading) && s.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={!selected || loading}
                >
                    <Text style={s.btnText}>
                        {loading ? "Submitting..." : selected ? `Request ${TIERS.find(t => t.id === selected)?.label} Membership` : "Select a Tier"}
                    </Text>
                </TouchableOpacity>

                <Text style={s.note}>
                    After submitting, our team will contact you with payment instructions within 24 hours.
                </Text>
            </ScrollView>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={s.modalIcon}>
                            <Check size={24} color={C.primary} strokeWidth={2.5} />
                        </View>
                        <Text style={s.modalTitle}>Request Submitted</Text>
                        <Text style={s.modalBody}>
                            Your {TIERS.find(t => t.id === selected)?.label} membership request has been received. We'll be in touch shortly.
                        </Text>
                        <TouchableOpacity style={s.modalBtnPri} onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}>
                            <Text style={s.modalBtnTxPri}>View My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSec} onPress={() => { setShowSuccess(false); router.back(); }}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20 },
    backBtn: { paddingVertical: 16 },
    backText: { color: C.primary, fontSize: 14, fontWeight: "600" },
    title: { fontSize: 24, fontWeight: "700", color: C.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 20 },

    card: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border, gap: 12 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    tierBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    tierLabel: { fontSize: 14, fontWeight: "700" },
    tierPrice: { fontSize: 22, fontWeight: "700" },
    tierPeriod: { fontSize: 12, color: C.muted, marginTop: 2 },
    divider: { height: 1, backgroundColor: C.border },
    perkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    perkText: { fontSize: 13, color: C.text, flex: 1 },
    selectedBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginTop: 4 },
    selectedText: { fontSize: 11, fontWeight: "700" },

    btn: { backgroundColor: C.primary, borderRadius: 14, padding: 18, alignItems: "center", marginTop: 8 },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: C.background, fontSize: 15, fontWeight: "700" },
    note: { fontSize: 12, color: C.muted, textAlign: "center", marginTop: 16, lineHeight: 18 },

    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.background, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: C.primary, alignItems: "center" },
    modalIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(201,168,76,0.1)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary, alignItems: "center" },
    modalBtnTxPri: { color: C.background, fontSize: 14, fontWeight: "700" },
    modalBtnSec: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },
});
