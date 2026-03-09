import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function NotificationsPrefsScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={32} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Notifications</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={s.title}>Notification Preferences</Text>
                <Text style={s.desc}>This page is currently a placeholder to let you toggle which push notifications you receive.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    title: { fontSize: 20, fontWeight: "600", color: C.text, marginBottom: 8 },
    desc: { fontSize: 16, color: C.muted, lineHeight: 24 },
});
