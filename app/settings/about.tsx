import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MapPin, Shield, Clock, Star, Compass } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const STATS = [
    { value: "2023", label: "Founded in Abuja" },
    { value: "5", label: "Nigerian Cities" },
    { value: "100%", label: "Discretion Guarantee" },
    { value: "48h", label: "Max Response Time" },
];

const SERVICES = [
    { letter: "H", name: "Hospitality & Travel", desc: "Hotels, flights, airport handling, car hire, and executive transport across all five LAPEQ cities and beyond." },
    { letter: "L", name: "Lifestyle & Exclusive Access", desc: "Concert tickets, private event invitations, fashion appointments, premium shopping, and access to experiences not publicly available." },
    { letter: "W", name: "Wellness & Health", desc: "Spa bookings, wellness retreats, private medical appointments, and curated health experiences." },
    { letter: "R", name: "Restaurants & Fine Dining", desc: "Private chefs dispatched to your home, villa, or event. Fine dining reservations with priority access at our curated restaurant network." },
    { letter: "D", name: "Management of Dates", desc: "Complete design and execution of intimate occasions. Venue, transport, chef, and decor - all arranged so you can be entirely present." },
    { letter: "P", name: "Personal & Business Support", desc: "Errand management, research, vendor vetting, personal scheduling, and business-level administrative concierge." },
    { letter: "I", name: "Investment Advisorship", desc: "Vetted access to investment professionals, real estate partners, and sector advisors across Nigeria." },
    { letter: "C", name: "Corporate Pairing", desc: "Intelligent B2B introductions between executives from complementary companies. Warm, curated connections that create lasting business value." },
    { letter: "LC", name: "Ladies Concierge", desc: "Premium concierge built around the realities of all women in Nigeria - styling, transport, social events, and personal arrangements." },
    { letter: "PS", name: "Project Supervision", desc: "Independent weekly site inspections with drone footage and materials verification. Your eyes on the ground." },
    { letter: "E", name: "Executive Networking Transit", desc: "Vetted, professional drivers available 24/7 across Abuja, Lagos, Port Harcourt, Akwa Ibom, and Kano." },
    { letter: "DS", name: "Diaspora Support", desc: "Property management, family liaison, construction oversight, and arrival coordination for Nigerians abroad." },
    { letter: "LA", name: "Legal Advisory", desc: "Discreet access to vetted legal professionals for business, property, and personal legal matters across Nigeria." },
    { letter: "SC", name: "Private Security", desc: "Professional, low-profile security arrangements for executives, events, and high-profile individuals." },
];

export default function AboutScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>About LAPEQ</Text>
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={s.heroSection}>
                    <View style={s.logoBox}>
                        <Image
                            source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={{ width: 52, height: 52 }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={s.appName}>LAPEQ</Text>
                    <Text style={s.tagline}>Built for Those Who Deserve More</Text>
                    <Text style={s.heroDesc}>
                        Nigeria's most discreet premium concierge and lifestyle management service. We arrange the extraordinary - hotels, private dining, curated events, executive travel, and bespoke experiences - so our members never have to.
                    </Text>
                    <View style={s.citiesRow}>
                        <MapPin size={14} color={C.muted} />
                        <Text style={s.citiesText}>Abuja · Lagos · PH (Soon) · Akwa Ibom (Soon) · Kano (Soon)</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={s.statsGrid}>
                    {STATS.map((stat) => (
                        <View key={stat.value} style={s.statCard}>
                            <Text style={s.statValue}>{stat.value}</Text>
                            <Text style={s.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Quote */}
                <View style={s.quoteBox}>
                    <Text style={s.quoteText}>"We do not simply book things. We create the conditions for life to be lived at its fullest."</Text>
                </View>

                {/* Our Services */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Our Services</Text>
                    <Text style={s.sectionSub}>Everything You Need. Nothing to Manage.</Text>
                    <Text style={s.sectionDesc}>
                        From a last-minute hotel reservation to a completely designed evening experience, LAPEQ covers the full spectrum of premium concierge life across Nigeria.
                    </Text>

                    <TouchableOpacity style={s.exploreBtn} onPress={() => router.push("/explore/experiences" as any)}>
                        <Compass size={16} color="#0a0a0a" />
                        <Text style={s.exploreBtnText}>Browse & Search All Experiences</Text>
                    </TouchableOpacity>

                    {SERVICES.map((svc) => (
                        <View key={svc.name} style={s.serviceRow}>
                            <View style={s.serviceBadge}>
                                <Text style={s.serviceLetter}>{svc.letter}</Text>
                            </View>
                            <View style={s.serviceInfo}>
                                <Text style={s.serviceName}>{svc.name}</Text>
                                <Text style={s.serviceDesc}>{svc.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Founder */}
                <View style={s.founderSection}>
                    <Text style={s.founderLabel}>The Founder</Text>
                    <Text style={s.founderName}>Nelson E. Williams</Text>
                    <Text style={s.founderRole}>Founder & CEO, LAPEQ</Text>
                    <Text style={s.founderBio}>
                        Nelson E. Williams is the founder of LAPEQ - a lawyer, business consultant, humanitarian, and entrepreneur widely recognised for his exceptional ability to connect people, opportunities, and experiences.
                    </Text>
                    <Text style={s.founderBio}>
                        A firm believer in creating a balance between work and life, Nelson promotes effortless living while curating bespoke and unforgettable experiences for individuals who value quality and distinction.
                    </Text>
                    <Text style={s.founderQuote}>"Fondly called The Plug Master - a powerful connector who is well-informed, well-travelled, and deeply aware of what is happening across Nigeria."</Text>
                </View>

                {/* Trust signals */}
                <View style={s.trustSection}>
                    <View style={s.trustRow}>
                        <Shield size={16} color={C.primary} />
                        <Text style={s.trustText}>NDAs standard for all staff</Text>
                    </View>
                    <View style={s.trustRow}>
                        <Shield size={16} color={C.primary} />
                        <Text style={s.trustText}>SSL secured - data never shared</Text>
                    </View>
                    <View style={s.trustRow}>
                        <Star size={16} color={C.primary} />
                        <Text style={s.trustText}>9.4 client satisfaction score</Text>
                    </View>
                    <View style={s.trustRow}>
                        <Clock size={16} color={C.primary} />
                        <Text style={s.trustText}>48h maximum response time</Text>
                    </View>
                </View>

                <Text style={s.version}>LAPEQ · Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Jost_700Bold" },
    scroll: { paddingBottom: 60 },

    heroSection: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    logoBox: { width: 88, height: 88, borderRadius: 28, backgroundColor: `${C.primary}15`, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: `${C.primary}30` },
    appName: { fontSize: 26, fontFamily: "PlayfairDisplay_700Bold", color: C.text, letterSpacing: 4, marginBottom: 8 },
    tagline: { fontSize: 15, fontFamily: "Jost_600SemiBold", color: C.primary, marginBottom: 14, textAlign: "center" },
    heroDesc: { fontSize: 14, fontFamily: "Jost_400Regular", color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 14 },
    citiesRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    citiesText: { fontSize: 13, fontFamily: "Jost_400Regular", color: C.muted },

    statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12, justifyContent: "center" },
    statCard: { width: "44%", backgroundColor: C.surface, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    statValue: { fontSize: 26, fontFamily: "PlayfairDisplay_700Bold", color: C.primary, marginBottom: 4 },
    statLabel: { fontSize: 12, fontFamily: "Jost_400Regular", color: C.muted, textAlign: "center" },

    quoteBox: { marginHorizontal: 20, marginBottom: 8, padding: 20, backgroundColor: C.surface, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: C.primary },
    quoteText: { fontSize: 14, fontFamily: "Jost_400Regular", color: C.text, lineHeight: 22, fontStyle: "italic" },

    section: { paddingHorizontal: 20, paddingTop: 32 },
    sectionTitle: { fontSize: 20, fontFamily: "PlayfairDisplay_700Bold", color: C.text, marginBottom: 4 },
    sectionSub: { fontSize: 13, fontFamily: "Jost_600SemiBold", color: C.primary, marginBottom: 10 },
    sectionDesc: { fontSize: 13, fontFamily: "Jost_400Regular", color: C.muted, lineHeight: 21, marginBottom: 20 },
    exploreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, backgroundColor: C.primary, marginBottom: 20 },
    exploreBtnText: { fontSize: 14, fontFamily: "Jost_600SemiBold", color: "#0a0a0a" },

    serviceRow: { flexDirection: "row", gap: 14, marginBottom: 18, alignItems: "flex-start" },
    serviceBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${C.primary}18`, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${C.primary}30`, flexShrink: 0 },
    serviceLetter: { fontSize: 12, fontFamily: "Jost_700Bold", color: C.primary },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: 15, fontFamily: "Jost_600SemiBold", color: C.text, marginBottom: 3 },
    serviceDesc: { fontSize: 13, fontFamily: "Jost_400Regular", color: C.muted, lineHeight: 20 },

    founderSection: { margin: 20, marginTop: 32, padding: 20, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    founderLabel: { fontSize: 11, fontFamily: "Jost_600SemiBold", color: C.primary, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
    founderName: { fontSize: 20, fontFamily: "PlayfairDisplay_700Bold", color: C.text, marginBottom: 2 },
    founderRole: { fontSize: 13, fontFamily: "Jost_400Regular", color: C.muted, marginBottom: 14 },
    founderBio: { fontSize: 13, fontFamily: "Jost_400Regular", color: C.text, lineHeight: 21, marginBottom: 10 },
    founderQuote: { fontSize: 13, fontFamily: "Jost_400Regular", color: C.muted, fontStyle: "italic", lineHeight: 20, borderTopWidth: 1, borderTopColor: theme === "dark" ? "#2a2a2a" : "#ece8de", paddingTop: 12, marginTop: 4 },

    trustSection: { marginHorizontal: 20, marginTop: 8, padding: 20, backgroundColor: C.surface, borderRadius: 16, gap: 12, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    trustRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    trustText: { fontSize: 13, fontFamily: "Jost_400Regular", color: C.text },

    version: { textAlign: "center", fontSize: 12, fontFamily: "Jost_400Regular", color: C.muted, marginTop: 32, marginBottom: 8 },
});
