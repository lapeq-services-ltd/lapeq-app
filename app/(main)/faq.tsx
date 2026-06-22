import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const FAQS = [
    {
        q: "How do I join LAPEQ?",
        a: "You can join LAPEQ by registering on the app. Start with our free tier - no obligation. When you're ready to unlock full concierge access, upgrade to Silver, Gold, or Black from your profile.",
    },
    {
        q: "What is the difference between Silver and Gold?",
        a: "Silver gives you full concierge access with a 48-hour response guarantee. Gold upgrades this to a 24-hour response, adds Ladies Concierge, Executive Networking Transit, Project Supervision access, and invitations to private events.",
    },
    {
        q: "Is the Black membership truly invitation-only?",
        a: "Yes. Black tier is strictly by invitation. It represents our most complete offering - same-day response, a dedicated personal concierge, access to Investment Advisorship, exclusive Black events, and full Corporate Pairing access.",
    },
    {
        q: "Can I upgrade my membership at any time?",
        a: "Yes. Go to Profile → Upgrade Membership in the app, select your desired tier, and submit a request. Our team will process it and contact you to confirm.",
    },
    {
        q: "Does LAPEQ offer corporate membership?",
        a: "Yes. Corporate membership is available for companies and executive teams. It includes concierge services for multiple employees, corporate event planning, B2B networking, and dedicated account management. Contact us at info@lapeq.net.",
    },
    {
        q: "Which cities does LAPEQ currently operate in?",
        a: "We currently operate in Abuja and Lagos, with services in Port Harcourt, Akwa Ibom, and Kano coming soon. Our concierge teams are on the ground in each active city for real-time service delivery.",
    },
    {
        q: "How do I make a service request?",
        a: "Tap any service from the home screen - Chauffeur, Travel, Experiences, or more. Fill in your details and submit. You'll receive a reference number and can track your request status in real time from the app.",
    },
    {
        q: "What is Project Supervision?",
        a: "Project Supervision is LAPEQ's construction oversight service. We send a team member to your build site for regular inspections, verify materials, liaise with your contractors, and send you weekly photo reports - so you stay fully informed from anywhere in the world.",
    },
    {
        q: "How do I contact my concierge?",
        a: "Tap the chat icon on the home screen or go to the 24/7 Concierge section. You can make a request, ask a question, or speak directly with your dedicated concierge at any time.",
    },
];

export default function FAQScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const [open, setOpen] = useState<number | null>(null);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>FAQ</Text>
                    <Text style={s.subtitle}>Answers to common questions</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
                {FAQS.map((faq, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[s.item, open === i && s.itemOpen]}
                        onPress={() => setOpen(open === i ? null : i)}
                        activeOpacity={0.85}
                    >
                        <View style={s.itemHeader}>
                            <Text style={s.question}>{faq.q}</Text>
                            {open === i
                                ? <ChevronUp size={18} color={C.primary} />
                                : <ChevronDown size={18} color={C.muted} />}
                        </View>
                        {open === i && (
                            <Text style={s.answer}>{faq.a}</Text>
                        )}
                    </TouchableOpacity>
                ))}

                <View style={s.contactBox}>
                    <Text style={s.contactTitle}>Still have questions?</Text>
                    <Text style={s.contactText}>Reach us at concierge@lapeq.net or send a message through the app.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: "700", color: C.text },
    subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
    item: { backgroundColor: C.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    itemOpen: { borderColor: C.primary },
    itemHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    question: { flex: 1, fontSize: 15, fontWeight: "600", color: C.text, lineHeight: 22 },
    answer: { fontSize: 14, color: C.muted, lineHeight: 22, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    contactBox: { marginTop: 8, backgroundColor: C.surface, borderRadius: 16, padding: 20, borderLeftWidth: 3, borderLeftColor: C.primary },
    contactTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 6 },
    contactText: { fontSize: 14, color: C.muted, lineHeight: 22 },
});
