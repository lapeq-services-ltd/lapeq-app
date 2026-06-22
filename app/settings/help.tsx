import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MessageCircle, Mail, HelpCircle, Phone, BookOpen } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function HelpScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const items = [
        {
            icon: BookOpen,
            title: "App Guide",
            desc: "A full overview of every feature in the app. Learn what it does and how to use it.",
            action: () => router.push("/settings/app-guide"),
            cta: "Open Guide",
        },
        {
            icon: MessageCircle,
            title: "Chat With Your Concierge",
            desc: "Your dedicated concierge is available 24/7 for anything you need.",
            action: () => router.push("/chat"),
            cta: "Open Chat",
        },
        {
            icon: Mail,
            title: "Email Support",
            desc: "Reach our support team at lapeqconceirge@gmail.com for account or billing queries.",
            action: () => Linking.openURL("mailto:lapeqconceirge@gmail.com"),
            cta: "Send Email",
        },
        {
            icon: Phone,
            title: "WhatsApp",
            desc: "Prefer WhatsApp? Message us directly for fast support.",
            action: () => Linking.openURL("https://wa.me/2349000000000"),
            cta: "Open WhatsApp",
        },
        {
            icon: HelpCircle,
            title: "Frequently Asked Questions",
            desc: "Find answers to common questions about membership, services, and more.",
            action: () => router.push("/faq"),
            cta: "View FAQ",
        },
    ];

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Help Center</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 48 }}>
                <Text style={s.intro}>Need help? We're here for you. Every day, any time.</Text>

                {items.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <View key={i} style={s.card}>
                            <View style={s.cardTop}>
                                <View style={s.iconBox}>
                                    <Icon size={20} color={C.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.cardTitle}>{item.title}</Text>
                                    <Text style={s.cardDesc}>{item.desc}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={s.ctaBtn} onPress={item.action} activeOpacity={0.85}>
                                <Text style={s.ctaBtnText}>{item.cta}</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontWeight: "700", color: C.text },
    intro: { fontSize: 15, color: C.muted, lineHeight: 23, marginBottom: 6 },
    card: { backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 14 },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${C.primary}15`, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    cardTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 4 },
    cardDesc: { fontSize: 13, color: C.muted, lineHeight: 20 },
    ctaBtn: { backgroundColor: `${C.primary}18`, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
    ctaBtnText: { fontSize: 14, fontWeight: "700", color: C.primary },
});
