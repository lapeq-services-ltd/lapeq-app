import { useMemo } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Switch
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Settings, Crown, Star, MapPin, CalendarDays, Moon } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";

export default function ProfileScreen() {
    const router = useRouter();
    const { theme, toggleTheme, C } = useTheme();
    const [userName, setUserName] = useState("Nife");
    const [userLocation, setUserLocation] = useState("Lagos");
    const [userCountry, setUserCountry] = useState("Nigeria");
    const [imageUri, setImageUri] = useState<string | null>(null);

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
        }, [])
    );

    // Memoize styles to react to theme changes
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
                {/* Profile Info */}
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
                            <Text style={s.tier}>Gold Member</Text>
                        </View>
                    </View>
                </View>

                {/* Membership Card */}
                <View style={s.card}>
                    <View style={s.cardGlowCircle} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View>
                            <Text style={s.cardSub}>Lapeq Gold</Text>
                            <Text style={s.cardYear}>Since 2025</Text>
                        </View>
                        <Crown size={20} color="#000000" />
                    </View>
                </View>

                {/* Theme Toggle */}
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

                {/* Stats */}
                <View style={s.stats}>
                    {[{ val: "12", label: "Experiences" }, { val: "8", label: "Events" }, { val: "3", label: "Cities" }].map((st) => (
                        <View key={st.label} style={s.statBox}>
                            <Text style={s.statVal}>{st.val}</Text>
                            <Text style={s.statLabel}>{st.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Recent Experiences */}
                <Text style={s.sectionTitle}>Recent Experiences</Text>
                <View style={{ gap: 10, marginBottom: 20 }}>
                    {[
                        { label: "Nok by Alara", sub: "Victoria Island, Lagos", color: "#c9a84c", type: "location" },
                        { label: "Eko Hotel & Suites", sub: "Mar 20-22, Weekend stay", color: "#a8892f", type: "calendar" },
                        { label: "An Elevated Evening", sub: "Mar 15, Members event", color: "#8a6b20", type: "calendar" },
                    ].map((exp, i) => (
                        <TouchableOpacity key={i} style={s.expRow}>
                            <View style={[s.expIcon, { backgroundColor: `${exp.color}33` }]}>
                                <Crown size={20} color={C.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.expLabel}>{exp.label}</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                                    {exp.type === "location"
                                        ? <MapPin size={12} color={C.muted} />
                                        : <CalendarDays size={12} color={C.muted} />}
                                    <Text style={s.expSub}>{exp.sub}</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: "row", gap: 4 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={12}
                                        color={C.primary}
                                        fill={i === 1 && star === 5 ? "none" : C.primary}
                                    />
                                ))}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Contact Concierge */}
                <TouchableOpacity style={s.conciergeBtn}>
                    <Text style={s.conciergeBtnText}>Contact My Concierge</Text>
                </TouchableOpacity>

                {/* Sign out */}
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
    themeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 16, backgroundColor: C.surface, marginBottom: 24 },
    themeIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${C.primary}18`, alignItems: "center", justifyContent: "center" },
    themeLabel: { fontSize: 15, fontWeight: "600", color: C.text },
    stats: { flexDirection: "row", gap: 12, marginBottom: 32 },
    statBox: { flex: 1, alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: C.surface },
    statVal: { fontSize: 24, fontWeight: "700", color: C.text },
    statLabel: { fontSize: 11, color: C.muted, marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: C.text, marginBottom: 16 },
    expRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
    expIcon: { width: 64, height: 64, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    expLabel: { fontSize: 15, fontWeight: "600", color: C.text },
    expSub: { fontSize: 13, color: C.muted },
    conciergeBtn: { width: "100%", paddingVertical: 18, borderRadius: 20, backgroundColor: C.text, alignItems: "center" },
    conciergeBtnText: { fontSize: 18, fontWeight: "600", color: C.background },
});
