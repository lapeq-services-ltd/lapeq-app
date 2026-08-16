import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import Skeleton from "@/components/Skeleton";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useMemo, useEffect, useState, useCallback } from "react";
import { Bell, ChevronLeft, Calendar, CalendarX, Trash2, Crown, Car } from "lucide-react-native";
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

const TYPE_CONFIG: Record<string, { icon: any; glow: string; iconColor: string; clickable?: boolean }> = {
    itinerary:          { icon: Calendar, glow: "rgba(192, 132, 252, 0.12)", iconColor: "#c084fc" },
    welcome:            { icon: Crown,    glow: `${GOLD}22`,                 iconColor: GOLD,      clickable: false },
    chauffeur_assigned: { icon: Car,      glow: "rgba(167, 139, 250, 0.15)", iconColor: "#a78bfa" },
    trip_status:        { icon: Car,      glow: "rgba(201, 168, 76, 0.15)",  iconColor: GOLD },
    itinerary_cancelled:{ icon: CalendarX,glow: "rgba(239, 83, 80, 0.15)",   iconColor: "#ef5350" },
    default:            { icon: Bell,     glow: `${GOLD}18`,                 iconColor: GOLD },
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

        // Staff-only ops alerts (from the admin dashboard's internal notification
        // system) must never surface in a personal member inbox, even for accounts
        // that are also staff — this table is shared, but this screen is member-facing.
        const { data } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .not("type", "in", '("chat_alert","request_alert","status_alert","payment_alert","driver_assignment")')
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

    const deleteNotif = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        await supabase.from("notifications").delete().eq("id", id);
    };

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
                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <View key={i}>
                            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 16 }}>
                                {/* Icon box */}
                                <Skeleton width={40} height={40} borderRadius={12} />
                                {/* Content */}
                                <View style={{ flex: 1, gap: 8 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <Skeleton width="55%" height={13} borderRadius={6} />
                                        <Skeleton width={36} height={10} borderRadius={4} />
                                    </View>
                                    <Skeleton width="90%" height={11} borderRadius={5} />
                                    <Skeleton width="70%" height={11} borderRadius={5} />
                                </View>
                            </View>
                            {i < 5 && <View style={s.separator} />}
                        </View>
                    ))}
                </View>
            ) : notifications.length === 0 ? (
                <View style={s.center}>
                    <Image source={require("@/assets/emptystate/notif.png")} style={s.emptyImg} resizeMode="contain" />
                    <Text style={s.emptyTitle}>All caught up</Text>
                    <Text style={s.emptySubtitle}>Your notifications will appear here: updates on requests, itineraries, and more.</Text>
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
                        const isWelcome = item.type === "welcome";

                        if (isWelcome) {
                            const tierColor = item.title.toLowerCase().includes("silver") ? "#a8b8cc"
                                : item.title.toLowerCase().includes("black") ? "#e8e8e8"
                                : GOLD;
                            return (
                                <View style={[s.welcomeCard, { borderColor: `${tierColor}30`, backgroundColor: `${tierColor}08` }]}>
                                    <View style={[s.welcomeIconBox, { backgroundColor: `${tierColor}20` }]}>
                                        <Crown size={20} color={tierColor} />
                                    </View>
                                    <View style={{ flex: 1, gap: 4 }}>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <Text style={[s.welcomeTitle, { color: tierColor }]}>{item.title}</Text>
                                            <Text style={s.time}>{timeAgo(item.created_at)}</Text>
                                        </View>
                                        <Text style={s.message}>{item.body}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => deleteNotif(item.id)}
                                        style={s.deleteBtn}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Trash2 size={15} color={C.muted} />
                                    </TouchableOpacity>
                                </View>
                            );
                        }

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
                                    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                                    supabase.from("notifications").update({ read: true }).eq("id", item.id);

                                    if (item.type === "chauffeur_assigned" || item.type === "trip_status") {
                                        router.push("/(main)/coordination");
                                    } else if (item.type === "request" || item.type === "receipt" || item.type === "itinerary_cancelled") {
                                        if (item.target_id) router.push(`/requests/${item.target_id}`);
                                        else router.push("/requests");
                                    } else if (item.type === "chat") {
                                        router.push({ pathname: "/(main)/chat", params: { mode: "concierge" } } as any);
                                    } else if (item.type === "itinerary") {
                                        router.push({ pathname: "/itinerary-view", params: { notifId: item.id } });
                                    } else {
                                        router.push("/(tabs)");
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
                                <TouchableOpacity
                                    onPress={() => deleteNotif(item.id)}
                                    style={s.deleteBtn}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Trash2 size={15} color={C.muted} />
                                </TouchableOpacity>
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
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16, paddingHorizontal: 40 },
    emptyImg: { width: 180, height: 180, marginBottom: 8 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: C.text, textAlign: "center" },
    emptySubtitle: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22 },
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
    deleteBtn: { paddingLeft: 8, paddingTop: 2, alignSelf: "flex-start" },
    welcomeCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, marginVertical: 4 },
    welcomeIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    welcomeTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },
});
