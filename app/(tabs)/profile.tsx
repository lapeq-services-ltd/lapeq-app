import { useMemo, useCallback, useState, useEffect } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Switch, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Settings, Crown, MapPin, Moon, Package, Heart, ArrowRight, Clock } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RecentRequest = {
    id: string;
    service: string;
    status: string;
    created_at: string;
    reference: string | null;
};

const SERVICE_LABELS: Record<string, string> = {
    "lifestyle-travel": "Hospitality & Travel",
    "concierge": "Concierge Request",
    "driving": "Driving",
    "logistics": "Logistics",
    "corporate-pairing": "Corporate Pairing",
    "diaspora-support": "Diaspora Support",
    "project-trust": "Project Trust",
};

const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    active: "#10b981",
    completed: "#6b7280",
    cancelled: "#ef4444",
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ProfileScreen() {
    const router = useRouter();
    const { theme, toggleTheme, C } = useTheme();
    const [userName, setUserName] = useState("Member");
    const [userLocation, setUserLocation] = useState("Lagos");
    const [userCountry, setUserCountry] = useState("Nigeria");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [tier, setTier] = useState("Gold");

    const [requestCount, setRequestCount] = useState<number | null>(null);
    const [savedCount, setSavedCount] = useState<number | null>(null);
    const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem("personal_info").then(data => {
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.name) setUserName(parsed.name);
                    if (parsed.imageUri) setImageUri(parsed.imageUri);
                    if (parsed.state) setUserLocation(parsed.state);
                    if (parsed.country) setUserCountry(parsed.country);
                }
            });
            loadStats();
        }, [])
    );

    const loadStats = async () => {
        setLoadingStats(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoadingStats(false); return; }

        const [reqResult, favResult, recentResult, profileResult] = await Promise.all([
            supabase.from("requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "cancelled"),
            supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
            supabase.from("requests").select("id, service, status, created_at, reference").eq("user_id", user.id).neq("status", "cancelled").order("created_at", { ascending: false }).limit(3),
            supabase.from("profiles").select("tier, full_name").eq("id", user.id).single(),
        ]);

        setRequestCount(reqResult.count ?? 0);
        setSavedCount(favResult.count ?? 0);
        if (recentResult.data) setRecentRequests(recentResult.data);
        if (profileResult.data) {
            if (profileResult.data.tier) setTier(profileResult.data.tier);
            if (profileResult.data.full_name && profileResult.data.full_name !== userName) {
                setUserName(profileResult.data.full_name.split(" ")[0]);
            }
        }
        setLoadingStats(false);
    };

    const s = useMemo(() => getStyles(C), [C]);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Profile</Text>
                <TouchableOpacity style={s.settingsBtn} onPress={() => router.push("/settings")}>
                    <Settings size={20} color={C.muted} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                <View style={s.profileRow}>
                    <View style={s.avatar}>
                        <Image
                            source={imageUri ? { uri: imageUri } : require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={s.avatarImg}
                            resizeMode="cover"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.name}>{userName}</Text>
                        <Text style={s.location}>{userLocation}, {userCountry}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                            <Crown size={16} color={C.primary} />
                            <Text style={s.tier}>{tier} Member</Text>
                        </View>
                    </View>
                </View>

                <View style={s.card}>
                    <View style={s.cardGlowCircle} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View>
                            <Text style={s.cardSub}>Lapeq {tier}</Text>
                            <Text style={s.cardYear}>Since 2025</Text>
                        </View>
                        <Crown size={20} color="#000000" />
                    </View>
                </View>

                {/* Stats */}
                <View style={s.stats}>
                    <View style={s.statBox}>
                        {loadingStats ? <ActivityIndicator size="small" color={C.primary} /> : <Text style={s.statVal}>{requestCount ?? 0}</Text>}
                        <Text style={s.statLabel}>Requests</Text>
                    </View>
                    <View style={s.statBox}>
                        {loadingStats ? <ActivityIndicator size="small" color={C.primary} /> : <Text style={s.statVal}>{savedCount ?? 0}</Text>}
                        <Text style={s.statLabel}>Saved</Text>
                    </View>
                </View>

                <View style={s.themeRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={s.themeIconBox}>
                            <Moon size={18} color={C.primary} />
                        </View>
                        <Text style={s.themeLabel}>Dark Mode</Text>
                    </View>
                    <Switch
                        value={theme === "dark"}
                        onValueChange={toggleTheme}
                        trackColor={{ false: C.border, true: C.primary }}
                        thumbColor={C.card}
                    />
                </View>

                <TouchableOpacity style={[s.themeRow, { marginTop: -16 }]} onPress={() => router.push("/requests")}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={s.themeIconBox}>
                            <Package size={18} color={C.primary} />
                        </View>
                        <Text style={s.themeLabel}>My Requests</Text>
                    </View>
                    <ArrowRight size={20} color={C.muted} />
                </TouchableOpacity>

                <TouchableOpacity style={[s.themeRow, { marginTop: -16 }]} onPress={() => router.push("/explore/saved-places")}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={s.themeIconBox}>
                            <Heart size={18} color={C.primary} />
                        </View>
                        <Text style={s.themeLabel}>Saved Places</Text>
                    </View>
                    <ArrowRight size={20} color={C.muted} />
                </TouchableOpacity>

                {/* Recent Requests */}
                {!loadingStats && recentRequests.length > 0 && (
                    <>
                        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Recent Requests</Text>
                        <View style={{ gap: 10, marginBottom: 20 }}>
                            {recentRequests.map((req) => (
                                <TouchableOpacity
                                    key={req.id}
                                    style={s.expRow}
                                    onPress={() => router.push({ pathname: "/requests/[id]", params: { id: req.id } })}
                                >
                                    <View style={[s.expIcon, { backgroundColor: `${C.primary}18` }]}>
                                        <Clock size={18} color={C.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.expLabel}>{SERVICE_LABELS[req.service] ?? req.service}</Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                                            <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[req.status] ?? C.muted }]} />
                                            <Text style={s.expSub}>
                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                {req.reference ? `  ·  ${req.reference}` : ""}
                                                {"  ·  "}{formatDate(req.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                    <ArrowRight size={16} color={C.muted} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                <TouchableOpacity style={s.conciergeBtn}>
                    <Text style={s.conciergeBtnText}>Contact My Concierge</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ marginTop: 24, alignItems: "center" }}>
                    <Text style={{ fontSize: 15, color: C.muted, fontWeight: "500" }}>Sign out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    profileRow: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 24 },
    avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: C.black, borderWidth: 3, borderColor: C.primary, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    avatarImg: { width: "100%", height: "100%" },
    name: { fontSize: 22, fontWeight: "700", color: C.text },
    location: { fontSize: 15, color: C.muted, marginTop: 4 },
    tier: { fontSize: 14, fontWeight: "600", color: C.primary },
    card: { borderRadius: 16, padding: 20, marginBottom: 20, overflow: "hidden", backgroundColor: C.primary, position: "relative" },
    cardGlowCircle: { position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: `rgba(255,255,255,0.18)` },
    cardSub: { fontSize: 13, color: `rgba(0,0,0,0.6)`, textTransform: "uppercase", letterSpacing: 2 },
    cardYear: { fontSize: 18, fontWeight: "700", color: "#000000" },
    stats: { flexDirection: "row", gap: 12, marginBottom: 24 },
    statBox: { flex: 1, alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: C.surface, minHeight: 72, justifyContent: "center" },
    statVal: { fontSize: 24, fontWeight: "700", color: C.text },
    statLabel: { fontSize: 11, color: C.muted, marginTop: 4 },
    themeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 16, backgroundColor: C.surface, marginBottom: 24 },
    themeIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${C.primary}18`, alignItems: "center", justifyContent: "center" },
    themeLabel: { fontSize: 15, fontWeight: "600", color: C.text },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: C.text, marginBottom: 16 },
    expRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
    expIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    expLabel: { fontSize: 14, fontWeight: "600", color: C.text },
    expSub: { fontSize: 12, color: C.muted },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    conciergeBtn: { width: "100%", paddingVertical: 18, borderRadius: 20, backgroundColor: C.text, alignItems: "center" },
    conciergeBtnText: { fontSize: 18, fontWeight: "600", color: C.background },
});
