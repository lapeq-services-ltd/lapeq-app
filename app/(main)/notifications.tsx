import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useMemo, useEffect, useState, useCallback } from "react";
import { Bell, ChevronLeft, Calendar } from "lucide-react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a84c";

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

// All types → Bell + gold, EXCEPT itinerary → Calendar + purple
const TYPE_CONFIG: Record<string, { icon: any; glow: string; iconColor: string }> = {
    itinerary: { icon: Calendar, glow: "rgba(192, 132, 252, 0.12)", iconColor: "#c084fc" },
    default:   { icon: Bell,     glow: `${GOLD}18`,                 iconColor: GOLD },
};

function getCfg(type: string) {
    return TYPE_CONFIG[type] ?? TYPE_CONFIG.default;
}

export default function NotificationsScreen() {
    const { C } = useTheme();
    const router = useRouter();
    const s = useMemo(() => getStyles(C), [C]);
    const [notifications, setNotifications] = useState<Notif[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const load = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }
        const user = session.user;
        setUserId(user.id);

        const { data } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (data) setNotifications(data);
        setLoading(false);

        // Silently mark all as read in DB on open (but keep local unread state visible)
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const markAllRead = async () => {
        if (!userId) return;
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", userId)
            .eq("read", false);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const hasUnread = notifications.length > 0;

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Notifications</Text>
                {hasUnread && (
                    <TouchableOpacity onPress={markAllRead} style={{ padding: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: GOLD }}>Mark all read</Text>
                    </TouchableOpacity>
                )}
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
                        const cfg = getCfg(item.type);
                        const IconComponent = cfg.icon;
                        return (
                            <TouchableOpacity
                               style={[
                                   s.notifItem,
                                   !item.read && {
                                       backgroundColor: `${cfg.iconColor}0c`,
                                       borderLeftWidth: 3,
                                       borderLeftColor: cfg.iconColor,
                                       paddingLeft: 12
                                   }
                               ]}
                               activeOpacity={0.7}
                               onPress={() => {
                                    // Mark this one read locally
                                    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                                    supabase.from("notifications").update({ read: true }).eq("id", item.id);

                                    if (item.type === "request" || item.type === "receipt") {
                                        if (item.target_id) router.push(`/requests/${item.target_id}`);
                                        else router.push("/requests");
                                    } else if (item.type === "chat") {
                                        router.push({ pathname: "/(main)/chat", params: { mode: "concierge" } } as any);
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
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 12 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text, flex: 1 },
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
    unreadDot: { width: 8, height: 8, borderRadius: 4 },
    separator: { height: 1, backgroundColor: C.border },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 },
    title: { fontSize: 15, fontWeight: "500", color: C.text, flex: 1 },
    time: { fontSize: 11, color: C.muted, fontWeight: "500" },
    message: { fontSize: 13, color: C.muted, lineHeight: 18, paddingRight: 4 },
});
