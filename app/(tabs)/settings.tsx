import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, User, Bell, Shield, CreditCard, LifeBuoy, Info, ChevronRight } from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";

export default function SettingsScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const sections = [
        {
            title: "Account",
            items: [
                { icon: User, label: "Personal Information", route: "/settings/personal-info" },
                { icon: CreditCard, label: "Payment Methods", route: "/settings/payment-methods" },
            ]
        },
        {
            title: "Preferences",
            items: [
                { icon: Bell, label: "Notifications", route: "/settings/notification-prefs" },
                { icon: Shield, label: "Privacy & Security", route: "/settings/privacy" },
            ]
        },
        {
            title: "Support",
            items: [
                { icon: LifeBuoy, label: "Help Center", route: "/settings/help" },
                { icon: Info, label: "About Lapeq", route: "/settings/about" },
            ]
        }
    ];

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.push("/profile")}>
                    <ChevronLeft size={32} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}>
                {sections.map((section, idx) => (
                    <View key={idx} style={s.section}>
                        <Text style={s.sectionTitle}>{section.title}</Text>
                        <View style={s.card}>
                            {section.items.map((item, i) => {
                                const Icon = item.icon;
                                const isLast = i === section.items.length - 1;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[s.row, !isLast && s.rowBorder]}
                                        onPress={() => router.push(item.route as any)}
                                    >
                                        <View style={s.iconBox}>
                                            <Icon size={22} color={C.primary} />
                                        </View>
                                        <Text style={s.rowLabel}>{item.label}</Text>
                                        <ChevronRight size={20} color={C.muted} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
    card: { borderRadius: 20, backgroundColor: C.surface, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
    rowLabel: { flex: 1, fontSize: 16, fontWeight: "600", color: C.text },
});
