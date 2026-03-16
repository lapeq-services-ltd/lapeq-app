import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import { Crown, Bell, ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function NotificationsScreen() {
    const { C } = useTheme();
    const router = useRouter();
    const s = useMemo(() => getStyles(C), [C]);

    const notifications = [
        {
            id: "1",
            title: "Welcome to LAPEQ",
            message: "Your concierge is ready to assist you. Explore our curated experiences and elevate your lifestyle.",
            time: "Just now",
            type: "welcome",
            read: false,
        }
    ];

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Notifications</Text>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[s.notifCard, !item.read && s.unreadCard]}>
                        <View style={[s.iconBox, item.type === "welcome" && { backgroundColor: `${C.primary}18` }]}>
                            {item.type === "welcome" ? (
                                <Crown size={20} color={C.primary} />
                            ) : (
                                <Bell size={20} color={C.primary} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.title, !item.read && { fontWeight: "700" }]}>{item.title}</Text>
                            <Text style={s.message}>{item.message}</Text>
                            <Text style={s.time}>{item.time}</Text>
                        </View>
                        {!item.read && <View style={s.unreadDot} />}
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    notifCard: { flexDirection: "row", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 16, backgroundColor: C.surface, marginBottom: 12, borderWidth: 1, borderColor: C.border },
    unreadCard: { borderColor: `${C.primary}4d`, backgroundColor: `${C.primary}05` },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 16, fontWeight: "600", color: C.text, marginBottom: 4 },
    message: { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 8 },
    time: { fontSize: 11, color: C.primary, fontWeight: "500" },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 6 },
});
