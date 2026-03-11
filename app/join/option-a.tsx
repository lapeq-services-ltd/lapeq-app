import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Check, Crown } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function OptionAScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const tiers = [
        {
            name: "Silver", price: "₦300,000 / year",
            perks: ["Essential concierge during business hours", "Restaurant & event reservations"],
        },
        {
            name: "Gold", price: "₦500,000 / year",
            perks: ["24/7 priority concierge access", "Curated private experiences", "Executive car hire & travel"],
        },
        {
            name: "Black", price: "₦1,000,000 / year",
            perks: ["Dedicated lifestyle manager", "VIP access & private security", "Unlimited tailored requests"],
        }
    ];

    return (
        <SafeAreaView style={s.root}>
            <ScrollView contentContainerStyle={s.scroll}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={32} color={C.cardFg} />
                </TouchableOpacity>

                <View style={s.header}>
                    <Crown size={32} color={C.primary} style={{ marginBottom: 16 }} />
                    <Text style={s.title}>Request Received</Text>
                    <Text style={s.subtitle}>Select your preferred membership tier below to proceed with your application.</Text>
                </View>

                {tiers.map((tier, i) => (
                    <View key={i} style={[s.tierCard, tier.name === "Gold" && s.goldCard]}>
                        <View style={s.tierHeader}>
                            <Text style={[s.tierName, tier.name === "Gold" && { color: C.primary }]}>{tier.name}</Text>
                            <Text style={s.tierPrice}>{tier.price}</Text>
                        </View>
                        <View style={s.perksBox}>
                            {tier.perks.map((perk, j) => (
                                <View key={j} style={s.perkRow}>
                                    <Check size={16} color={C.primary} />
                                    <Text style={s.perkText}>{perk}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity style={[s.selectBtn, tier.name === "Gold" ? s.selectBtnGold : s.selectBtnStandard]} onPress={() => router.replace("/(tabs)")}>
                            <Text style={[s.selectBtnText, tier.name === "Gold" && { color: C.black }]}>Select This Tier</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                <Text style={s.footerNote}>Your concierge will confirm and activate your membership.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    backBtn: { paddingVertical: 16, marginTop: 10, alignSelf: "flex-start" },
    header: { alignItems: "center", marginBottom: 32, marginTop: 10 },
    title: { fontSize: 26, fontWeight: "700", color: C.text, marginBottom: 8 },
    subtitle: { fontSize: 15, color: C.muted, textAlign: "center", lineHeight: 22 },
    tierCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border },
    goldCard: { borderColor: C.primary, backgroundColor: `${C.primary}10`, borderWidth: 2 },
    tierHeader: { marginBottom: 16 },
    tierName: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 4 },
    tierPrice: { fontSize: 15, fontWeight: "600", color: C.muted },
    perksBox: { gap: 8, marginBottom: 20 },
    perkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    perkText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 20 },
    selectBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    selectBtnStandard: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.muted },
    selectBtnGold: { backgroundColor: C.primary },
    selectBtnText: { fontSize: 14, fontWeight: "700", color: C.text },
    footerNote: { textAlign: "center", fontSize: 13, color: C.muted, marginTop: 10, fontStyle: "italic" }
});
