import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, User, Bell, Shield, CreditCard, LifeBuoy, Info, HelpCircle, ChevronRight, Moon, Sun, SunMoon, BookOpen, AlertTriangle } from "lucide-react-native";

import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsScreen() {
    const router = useRouter();
    const { C, theme, themeMode, setThemeMode } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

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
            ],
            hasThemeToggle: true,
        },
        {
            title: "Support",
            items: [
                { icon: AlertTriangle, label: "Report a Problem", route: "/settings/report" },
                { icon: HelpCircle, label: "FAQ", route: "/faq" },
                { icon: LifeBuoy, label: "Help Center", route: "/settings/help" },
                { icon: BookOpen, label: "App Guide", route: "/settings/app-guide" },
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
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[s.row, s.rowBorder]}
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
                            {(section as any).hasThemeToggle && (
                                <View style={s.row}>
                                    <View style={s.iconBox}>
                                        {themeMode === "light" ? <Sun size={22} color={C.primary} /> : themeMode === "auto" ? <SunMoon size={22} color={C.primary} /> : <Moon size={22} color={C.primary} />}
                                    </View>
                                    <Text style={s.rowLabel}>Appearance</Text>
                                    <View style={[s.themePill, { backgroundColor: theme === "dark" ? "#1a1a1a" : "#e8e4dc" }]}>
                                        {(["light", "auto", "dark"] as const).map(mode => (
                                            <TouchableOpacity
                                                key={mode}
                                                style={[s.pillBtn, themeMode === mode && { backgroundColor: C.primary }]}
                                                onPress={() => setThemeMode(mode)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[s.pillText, { color: themeMode === mode ? "#0a0a0a" : C.muted }]}>
                                                    {mode === "light" ? "Light" : mode === "auto" ? "Auto" : "Dark"}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ))}
                <TouchableOpacity onPress={() => supabase.auth.signOut()} style={s.signOut}>
                    <Text style={s.signOutText}>Sign out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
    card: { borderRadius: 20, backgroundColor: C.surface, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme === "dark" ? "#222" : "#e8e4dc", alignItems: "center", justifyContent: "center" },
    rowLabel: { flex: 1, fontSize: 16, fontWeight: "600", color: C.text },
    signOut: { marginTop: 8, marginBottom: 16, alignItems: "center", padding: 16 },
    signOutText: { fontSize: 15, color: C.muted, fontWeight: "500" },
    themePill: { flexDirection: "row", borderRadius: 10, padding: 3, gap: 2 },
    pillBtn: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8 },
    pillText: { fontSize: 13, fontWeight: "600" },
});
