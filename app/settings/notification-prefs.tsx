import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

type Pref = { key: string; label: string; desc: string };

const PREFS: Pref[] = [
    { key: "request_updates", label: "Request Updates", desc: "Get notified when your request status changes." },
    { key: "messages", label: "New Messages", desc: "Alerts when your concierge sends you a message." },
    { key: "package_ready", label: "Package Ready", desc: "Be notified the moment your itinerary is ready to view." },
    { key: "promotions", label: "Promotions & Offers", desc: "Exclusive member deals, events, and partner offers." },
    { key: "app_updates", label: "App & Account Updates", desc: "Important updates about your account and the app." },
];

export default function NotificationsPrefsScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [prefs, setPrefs] = useState<Record<string, boolean>>({
        request_updates: true,
        messages: true,
        package_ready: true,
        promotions: false,
        app_updates: true,
    });

    const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Notifications</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 }}>
                <Text style={s.intro}>Choose which notifications you'd like to receive.</Text>

                <View style={s.card}>
                    {PREFS.map((pref, i) => (
                        <View key={pref.key} style={[s.row, i < PREFS.length - 1 && s.rowBorder]}>
                            <View style={{ flex: 1, paddingRight: 12 }}>
                                <Text style={s.rowLabel}>{pref.label}</Text>
                                <Text style={s.rowDesc}>{pref.desc}</Text>
                            </View>
                            <Switch
                                value={prefs[pref.key]}
                                onValueChange={() => toggle(pref.key)}
                                trackColor={{ false: theme === "dark" ? "#333" : "#d8d3ca", true: C.primary }}
                                thumbColor="#fff"
                            />
                        </View>
                    ))}
                </View>

                <Text style={s.note}>
                    These preferences control in-app notifications. Push notification settings are managed in your device settings.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontWeight: "700", color: C.text },
    intro: { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 20 },
    card: { backgroundColor: C.surface, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", marginBottom: 20 },
    row: { flexDirection: "row", alignItems: "center", padding: 18 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    rowLabel: { fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 3 },
    rowDesc: { fontSize: 13, color: C.muted, lineHeight: 19 },
    note: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },
});
