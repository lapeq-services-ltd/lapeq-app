import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useMemo, useEffect, useState } from "react";
import { Crown, Bell, ChevronLeft, Receipt, Package } from "lucide-react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

type Notif = {
    id: string;
    title: string;
    body: string;
    type: string;
    read: boolean;
    created_at: string;
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function NotificationsScreen() {
    const { C } = useTheme();
    const router = useRouter();
    const s = useMemo(() => getStyles(C), [C]);
    const [notifications, setNotifications] = useState<Notif[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);

            if (data) setNotifications(data);
            setLoading(false);

            // Mark all as read
            await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .eq("read", false);
        };
        load();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "welcome": return <Crown size={20} color={C.primary} />;
            case "receipt": return <Receipt size={20} color={C.primary} />;
            case "request": return <Package size={20} color={C.primary} />;
            default: return <Bell size={20} color={C.primary} />;
        }
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Notifications</Text>
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator color={C.primary} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={s.center}>
                    <Bell size={40} color={C.border} />
                    <Text style={s.empty}>No notifications yet</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={[s.notifCard, !item.read && s.unreadCard]}>
                            <View style={[s.iconBox, { backgroundColor: `${C.primary}18` }]}>
                                {getIcon(item.type)}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.title, !item.read && { fontWeight: "700" }]}>{item.title}</Text>
                                <Text style={s.message}>{item.body}</Text>
                                <Text style={s.time}>{timeAgo(item.created_at)}</Text>
                            </View>
                            {!item.read && <View style={s.unreadDot} />}
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    empty: { fontSize: 14, color: C.muted },
    notifCard: { flexDirection: "row", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 16, backgroundColor: C.surface, marginBottom: 12, borderWidth: 1, borderColor: C.border },
    unreadCard: { borderColor: `${C.primary}4d`, backgroundColor: `${C.primary}05` },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 16, fontWeight: "600", color: C.text, marginBottom: 4 },
    message: { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 8 },
    time: { fontSize: 11, color: C.primary, fontWeight: "500" },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 6 },
});
