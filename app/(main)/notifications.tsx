import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useMemo, useEffect, useState } from "react";
import { Crown, Bell, ChevronLeft, Receipt, Package, Calendar } from "lucide-react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

type Notif = {
    id: string;
    title: string;
    body: string;
    type: string;
    target_id: string | null;
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
            // Use getSession() - reads from local SecureStore cache reliably
            // getUser() can return null if SecureStore hasn't hydrated yet
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) { setLoading(false); return; }
            const user = session.user;

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

    const TYPE_CONFIG: Record<string, { icon: any; glow: string; iconColor: string }> = useMemo(() => ({
        welcome: { icon: Crown, glow: "rgba(201, 168, 76, 0.12)", iconColor: "#c9a84c" },
        receipt: { icon: Receipt, glow: "rgba(52, 211, 153, 0.12)", iconColor: "#34d399" },
        request: { icon: Package, glow: "rgba(96, 165, 250, 0.12)", iconColor: "#60a5fa" },
        itinerary: { icon: Calendar, glow: "rgba(192, 132, 252, 0.12)", iconColor: "#c084fc" },
        chat: { icon: Bell, glow: "rgba(251, 113, 133, 0.12)", iconColor: "#fb7185" },
        default: { icon: Bell, glow: "rgba(255, 255, 255, 0.08)", iconColor: C.muted },
    }), [C]);

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
                    ItemSeparatorComponent={() => <View style={s.separator} />}
                    renderItem={({ item }) => {
                        const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.default;
                        const IconComponent = cfg.icon;
                        return (
                            <TouchableOpacity 
                               style={[
                                   s.notifItem,
                                   !item.read && { 
                                       backgroundColor: `${cfg.iconColor}0c`, 
                                       borderLeftWidth: 4, 
                                       borderLeftColor: cfg.iconColor,
                                       paddingLeft: 12
                                   }
                               ]}
                               activeOpacity={0.7}
                               onPress={() => {
                                    if (item.type === "request" || item.type === "receipt") {
                                        if (item.target_id) router.push(`/requests/${item.target_id}`);
                                        else router.push("/requests");
                                    } else if (item.type === "chat") {
                                        router.push("/chat");
                                    } else if (item.type === "itinerary") {
                                        router.push({ pathname: "/itinerary-view", params: { notifId: item.id } });
                                    } else if (item.type === "welcome") {
                                        router.push("/explore");
                                    } else {
                                        router.push("/");
                                    }
                                }}
                            >
                                <View style={[s.iconBox, { backgroundColor: cfg.glow }]}>
                                    <IconComponent size={18} color={cfg.iconColor} />
                                </View>
                                
                                <View style={{ flex: 1 }}>
                                    <View style={s.itemHeader}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                                            {!item.read && <View style={[s.unreadDot, { backgroundColor: cfg.iconColor }]} />}
                                            <Text style={[s.title, !item.read && { fontWeight: "700" }]} numberOfLines={1}>
                                                {item.title}
                                            </Text>
                                        </View>
                                        <Text style={s.time}>{timeAgo(item.created_at)}</Text>
                                    </View>
                                    <Text style={s.message}>{item.body}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
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
    notifItem: { 
        flexDirection: "row", 
        alignItems: "flex-start", 
        gap: 14, 
        paddingVertical: 16, 
        paddingLeft: 16, 
        position: "relative" 
    },
    unreadDot: { 
        width: 8, 
        height: 8, 
        borderRadius: 4 
    },
    separator: {
        height: 1,
        backgroundColor: C.border,
    },
    iconBox: { 
        width: 40, 
        height: 40, 
        borderRadius: 12, 
        alignItems: "center", 
        justifyContent: "center" 
    },
    itemHeader: { 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 4, 
        gap: 8 
    },
    title: { 
        fontSize: 15, 
        fontWeight: "500", 
        color: C.text, 
        flex: 1 
    },
    time: { 
        fontSize: 11, 
        color: C.muted, 
        fontWeight: "500" 
    },
    message: { 
        fontSize: 13, 
        color: C.muted, 
        lineHeight: 18, 
        paddingRight: 4 
    },
});
