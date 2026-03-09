import { useMemo } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Share2, Users, Crown, CalendarDays, MapPin } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function EventsScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    return (
        <View style={s.root}>
            {/* Hero */}
            <View style={s.hero}>
                <Image
                    source={require("@/assets/images/lagos-rooftop.jpg")}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={s.heroOverlay} />
                <SafeAreaView style={s.heroNav}>
                    <TouchableOpacity style={s.heroBtn}>
                        <Share2 size={24} color={C.text} />
                    </TouchableOpacity>
                </SafeAreaView>
                <View style={s.heroText}>
                    <Text style={s.membersBadge}>Members Only</Text>
                    <Text style={s.heroTitle}>An Elevated Evening</Text>
                    <Text style={s.heroSub}>A Curated Rooftop Experience</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
                <View style={{ gap: 16 }}>
                    {/* Date */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                        <View style={s.metaIcon}>
                            <CalendarDays size={20} color={C.text} />
                        </View>
                        <View>
                            <Text style={s.metaTitle}>March 15, 2026</Text>
                            <Text style={s.metaSub}>9:00 PM onwards</Text>
                        </View>
                    </View>

                    {/* Location */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                        <View style={s.metaIcon}>
                            <MapPin size={20} color={C.text} />
                        </View>
                        <View>
                            <Text style={s.metaTitle}>Victoria Island, Lagos</Text>
                            <Text style={s.metaSub}>Venue disclosed upon confirmation</Text>
                        </View>
                    </View>

                    {/* Attending */}
                    <View style={s.attendeeRow}>
                        <View style={{ flexDirection: "row" }}>
                            {["T", "A", "C", "K"].map((initial, i) => (
                                <View key={i} style={[s.attendeeAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                                    <Text style={s.attendeeInitial}>{initial}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Users size={20} color={C.primary} />
                            <Text style={s.attendeeCount}>42 confirmed guests</Text>
                        </View>
                    </View>

                    {/* Concierge Introduction */}
                    <View style={s.introBox}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <Crown size={22} color={C.primary} />
                            <Text style={s.introTitle}>Concierge Introduction</Text>
                        </View>
                        <Text style={s.introDesc}>
                            Allow your concierge to introduce you to a fellow guest who shares your interests and industry. Discreet, intentional, and professionally facilitated.
                        </Text>
                        <TouchableOpacity style={s.introBtn}>
                            <Text style={s.introBtnText}>Request Introduction</Text>
                        </TouchableOpacity>
                    </View>

                    {/* About */}
                    <View>
                        <Text style={s.sectionTitle}>About This Experience</Text>
                        <Text style={s.bodyText}>
                            An intimate rooftop gathering for Lapeq members. Enjoy live music, curated cocktails, refined small plates, and the company of distinguished guests. Every detail has been arranged by your concierge — simply arrive and enjoy.
                        </Text>
                    </View>

                    {/* Handled For You */}
                    <View>
                        <Text style={s.sectionTitle}>Handled For You</Text>
                        <View style={{ gap: 8 }}>
                            {[
                                "Car hire to and from venue",
                                "Reserved seating arrangement",
                                "Complimentary welcome cocktail",
                                "Dedicated event concierge on-site",
                            ].map((item) => (
                                <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                    <View style={s.perkDot} />
                                    <Text style={s.perkText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Fixed CTA */}
            <View style={s.ctaBar}>
                <TouchableOpacity style={s.ctaBtn}>
                    <Text style={s.ctaBtnText}>Request Reservation</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    hero: { height: 360, overflow: "hidden", justifyContent: "flex-end" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6,6,6,0.55)" },
    heroNav: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, paddingTop: 12 },
    heroBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    heroText: { padding: 24 },
    membersBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, backgroundColor: C.primary, fontSize: 12, fontWeight: "600", color: C.black, alignSelf: "flex-start", marginBottom: 12 },
    heroTitle: { fontSize: 32, fontWeight: "700", color: "#ffffff", lineHeight: 40 },
    heroSub: { fontSize: 18, color: "rgba(255,255,255,0.8)", marginTop: 6 },
    metaIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    metaTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    metaSub: { fontSize: 14, color: C.muted },
    attendeeRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: 16, backgroundColor: C.surface },
    attendeeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#c4b89a", borderWidth: 2, borderColor: C.card, alignItems: "center", justifyContent: "center" },
    attendeeInitial: { fontSize: 12, fontWeight: "700", color: C.muted },
    attendeeCount: { fontSize: 15, fontWeight: "500", color: C.text },
    introBox: { borderRadius: 16, borderWidth: 1, borderColor: `${C.primary}4d`, backgroundColor: `${C.primary}0d`, padding: 20 },
    introTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    introDesc: { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 16 },
    introBtn: { borderRadius: 16, paddingVertical: 14, backgroundColor: C.primary, alignItems: "center" },
    introBtnText: { fontSize: 16, fontWeight: "600", color: C.black },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: C.text, marginBottom: 8 },
    bodyText: { fontSize: 15, color: C.muted, lineHeight: 24 },
    perkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
    perkText: { fontSize: 14, color: C.text },
    phase2: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: C.surface, marginTop: 12 },
    phase2Text: { fontSize: 13, color: C.muted },
    ctaBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, backgroundColor: `${C.background}f2`, borderTopWidth: 1, borderTopColor: C.border },
    ctaBtn: { borderRadius: 20, paddingVertical: 18, backgroundColor: C.text, alignItems: "center" },
    ctaBtnText: { fontSize: 18, fontWeight: "600", color: C.background },
});
