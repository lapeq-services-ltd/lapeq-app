import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, CheckCircle2, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

type Service = {
    title: string;
    short: string;
    full: string;
};

const SERVICES: Service[] = [
    {
        title: "Executive Car Hire",
        short: "Vetted professional drivers, available 24/7",
        full: "Professionally vetted drivers available around the clock across Abuja, Lagos, Port Harcourt, and Akwa-Ibom. Airport transfers, late-night travel, multi-city itineraries — your safety and punctuality are handled without exception.",
    },
    {
        title: "Priority Reservations",
        short: "The best tables at the finest venues — no waiting",
        full: "From the most sought-after restaurants in Lagos to members-only lounges in Abuja, we secure your booking ahead of time. Preferred seating, arrival coordination, and any special requests arranged before you arrive.",
    },
    {
        title: "Private Event Planning",
        short: "Corporate dinners, celebrations & exclusive gatherings",
        full: "Whether it is a high-stakes business dinner, a private birthday celebration, or an exclusive social event, we handle every element — venue selection, catering, guest management, décor, and full on-the-day coordination. Complete discretion guaranteed.",
    },
    {
        title: "Sports & Recreation",
        short: "Golf, VIP tickets, gym memberships & exclusive access",
        full: "We arrange access to the clubs and experiences that matter. Golf course bookings at premium courses, VIP sporting event packages, gym and wellness memberships, and access to exclusive recreation facilities — all arranged on your behalf.",
    },
    {
        title: "Personal Shopping",
        short: "Luxury retail access, wardrobe & import assistance",
        full: "Our styling and procurement team handles the entire process — from curated wardrobe audits and personal shopping accompaniments to sourcing specific items from international retailers and managing customs and delivery. Look exceptional without effort.",
    },
    {
        title: "Business Concierge",
        short: "Travel, accommodation & executive logistics",
        full: "Seamless executive travel from end to end. Airport pickups, hotel arrangements, meeting room bookings, flight coordination, and on-ground support in any city. We make sure your business trips are as productive and comfortable as possible.",
    },
];

export default function GentlemensConciergeScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [selected, setSelected] = useState<Service | null>(null);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!selected) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        if (!notes.trim()) { Alert.alert("Please describe what you need."); return; }
        setLoading(true);
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user.id,
            reference: ref,
            service_type: "gentlemens-concierge",
            status: "pending",
            notes: `[${selected.title}] ${notes}`,
        });
        setLoading(false);
        if (error) { Alert.alert("Error", error.message); return; }
        setSelected(null);
        setNotes("");
        setSuccess(true);
    };

    return (
        <SafeAreaView style={s.root} edges={["bottom"]}>
            {/* Hero */}
            <View style={s.hero}>
                <Image
                    source={require("@/assets/images/onboarding-driving.png")}
                    style={s.heroImg}
                    resizeMode="cover"
                />
                <View style={s.heroOverlay} />
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={22} color="#fff" />
                </TouchableOpacity>
                <View style={s.heroContent}>
                    <Text style={s.heroEyebrow}>FOR HIM</Text>
                    <Text style={s.heroTitle}>Gentlemen's Concierge</Text>
                    <Text style={s.heroSub}>Time is the only true luxury. We handle every detail.</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 }}>
                <Text style={s.sectionLabel}>Choose a Service</Text>
                <View style={{ gap: 12 }}>
                    {SERVICES.map((svc, i) => (
                        <TouchableOpacity key={i} style={s.serviceCard} onPress={() => setSelected(svc)} activeOpacity={0.82}>
                            <View style={s.serviceAccent} />
                            <View style={{ flex: 1, paddingLeft: 16 }}>
                                <Text style={s.serviceTitle}>{svc.title}</Text>
                                <Text style={s.serviceShort}>{svc.short}</Text>
                            </View>
                            <ChevronRight size={18} color={C.primary} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Service detail + request modal */}
            <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
                <View style={s.sheet}>
                    <View style={s.sheetHandle} />
                    <View style={s.sheetHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.sheetEyebrow}>GENTLEMEN'S CONCIERGE</Text>
                            <Text style={s.sheetTitle}>{selected?.title}</Text>
                        </View>
                        <TouchableOpacity style={s.sheetClose} onPress={() => { setSelected(null); setNotes(""); }}>
                            <X size={18} color={C.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}>
                        <Text style={s.sheetDesc}>{selected?.full}</Text>

                        <View style={s.divider} />

                        <Text style={s.sheetFormLabel}>Tell us what you need</Text>
                        <VoiceInput
                            placeholder={`Describe your ${selected?.title.toLowerCase()} request in as much detail as you'd like...`}
                            value={notes}
                            onChange={setNotes}
                            accent={C.primary}
                            textColor={C.text}
                            border={theme === "dark" ? "#2a2a2a" : "#d8d3ca"}
                            inputBg={C.surface}
                        />

                        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                            <Text style={s.submitText}>{loading ? "Submitting..." : "Request This Service"}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Success modal */}
            <Modal visible={success} transparent animationType="fade">
                <View style={s.successOverlay}>
                    <View style={s.successBox}>
                        <CheckCircle2 size={48} color={C.primary} style={{ marginBottom: 16 }} />
                        <Text style={s.successTitle}>Request Received</Text>
                        <Text style={s.successBody}>Your concierge will reach out shortly to confirm the details and get everything arranged.</Text>
                        <TouchableOpacity style={s.successBtn} onPress={() => { setSuccess(false); router.push("/requests"); }}>
                            <Text style={s.successBtnText}>View My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSuccess(false); router.back(); }} style={{ marginTop: 12 }}>
                            <Text style={{ color: C.muted, fontSize: 14 }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },

    // Hero
    hero: { height: 260, position: "relative" },
    heroImg: { width: "100%", height: "100%", position: "absolute" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
    backBtn: { position: "absolute", top: 52, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
    heroContent: { position: "absolute", bottom: 28, left: 20, right: 20 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 3, marginBottom: 6 },
    heroTitle: { fontSize: 30, fontWeight: "700", color: "#ffffff", marginBottom: 6 },
    heroSub: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 20 },

    // Services list
    sectionLabel: { fontSize: 12, fontWeight: "700", color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 },
    serviceCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    serviceAccent: { width: 3, height: "100%", borderRadius: 2, backgroundColor: C.primary, position: "absolute", left: 0, top: 0, bottom: 0, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
    serviceTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 4 },
    serviceShort: { fontSize: 13, color: C.muted, lineHeight: 18 },

    // Sheet
    sheet: { flex: 1, backgroundColor: C.background, paddingTop: 12 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme === "dark" ? "#333" : "#ccc", alignSelf: "center", marginBottom: 20 },
    sheetHeader: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 24, paddingBottom: 20 },
    sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    sheetEyebrow: { fontSize: 10, fontWeight: "800", color: C.primary, letterSpacing: 2, marginBottom: 4 },
    sheetTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    sheetDesc: { fontSize: 15, color: C.muted, lineHeight: 24, marginBottom: 24 },
    divider: { height: 1, backgroundColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", marginBottom: 24 },
    sheetFormLabel: { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 12 },
    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 16, fontSize: 15, color: C.text, minHeight: 130, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", marginBottom: 24 },
    submitBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    submitText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },

    // Success
    successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    successBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center", borderWidth: 1, borderColor: C.primary },
    successTitle: { fontSize: 22, fontWeight: "700", color: C.text, marginBottom: 10 },
    successBody: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 28 },
    successBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: C.primary, alignItems: "center" },
    successBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0a0a" },
});
