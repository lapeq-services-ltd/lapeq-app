import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Lock, Eye, Trash2, ShieldCheck } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function PrivacyScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const handleChangePassword = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;
        const { error } = await supabase.auth.resetPasswordForEmail(user.email);
        if (error) {
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Password Reset Sent", "Check your email for a link to reset your password.");
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "To delete your account, please contact support at lapeqconceirge@gmail.com. This action is irreversible.",
            [{ text: "OK" }]
        );
    };

    const sections = [
        {
            title: "Security",
            items: [
                {
                    icon: Lock,
                    label: "Change Password",
                    desc: "Send a password reset link to your email.",
                    action: handleChangePassword,
                    danger: false,
                },
                {
                    icon: Eye,
                    label: "Active Sessions",
                    desc: "You are currently signed in on this device.",
                    action: null,
                    danger: false,
                },
            ],
        },
        {
            title: "Data & Privacy",
            items: [
                {
                    icon: ShieldCheck,
                    label: "Your Data",
                    desc: "Lapeq collects only the information needed to deliver your concierge service. Your data is never sold or shared with third parties.",
                    action: null,
                    danger: false,
                },
                {
                    icon: Trash2,
                    label: "Delete Account",
                    desc: "Permanently remove your account and all associated data.",
                    action: handleDeleteAccount,
                    danger: true,
                },
            ],
        },
    ];

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Privacy & Security</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 }}>
                {sections.map((section, si) => (
                    <View key={si} style={{ marginBottom: 28 }}>
                        <Text style={s.sectionTitle}>{section.title}</Text>
                        <View style={s.card}>
                            {section.items.map((item, i) => {
                                const Icon = item.icon;
                                const isLast = i === section.items.length - 1;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[s.row, !isLast && s.rowBorder]}
                                        onPress={item.action ?? undefined}
                                        activeOpacity={item.action ? 0.7 : 1}
                                    >
                                        <View style={[s.iconBox, item.danger && s.iconBoxDanger]}>
                                            <Icon size={18} color={item.danger ? "#ef4444" : C.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.rowLabel, item.danger && { color: "#ef4444" }]}>{item.label}</Text>
                                            <Text style={s.rowDesc}>{item.desc}</Text>
                                        </View>
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

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontWeight: "700", color: C.text },
    sectionTitle: { fontSize: 12, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginLeft: 2 },
    card: { backgroundColor: C.surface, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    row: { flexDirection: "row", alignItems: "flex-start", padding: 16, gap: 14 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    iconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: `${C.primary}15`, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
    iconBoxDanger: { backgroundColor: "#fef2f2" },
    rowLabel: { fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 3 },
    rowDesc: { fontSize: 13, color: C.muted, lineHeight: 19 },
});
