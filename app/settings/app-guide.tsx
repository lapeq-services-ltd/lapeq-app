import { useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ChevronLeft, ChevronDown, ChevronUp,
    Home, Car, Compass, Calendar, User,
    MessageCircle, ClipboardList, Globe, Plane,
    HeartHandshake, Bell, Settings, BookOpen,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

const SECTIONS = [
    {
        icon: Home,
        title: "Home",
        summary: "Your main dashboard with quick access to all services.",
        details: [
            "See a greeting with your name and membership tier at the top.",
            "The Diaspora Support card is a premium service for Nigerians abroad.",
            "Quick service cards take you directly to request forms.",
            "Scroll down to see featured venues, articles, and promotions.",
            "Tap the bell icon to view your notifications.",
        ],
    },
    {
        icon: Car,
        title: "Chauffeur & Driving",
        summary: "Book a private driver or scheduled ride.",
        details: [
            "Choose from Standard Sedan, Luxury Sedan, Premium SUV, or Executive Van.",
            "Set your pickup and drop-off locations - search any address or business by name.",
            "Pick a date, time, number of passengers, and preferred car colour.",
            "Add any special instructions for the driver.",
            "Track the status of your request in My Requests after submission.",
        ],
    },
    {
        icon: Plane,
        title: "Lifestyle & Travel",
        summary: "Book curated travel experiences and lifestyle arrangements.",
        details: [
            "Submit a travel request for flights, hotels, or full trip planning.",
            "Your concierge handles the logistics - you just show up.",
            "Specify destination, travel dates, number of guests, and budget.",
        ],
    },
    {
        icon: Globe,
        title: "Diaspora Support",
        summary: "Premium support for Nigerians living abroad.",
        details: [
            "Services include property sourcing, family care coordination, business setup, and more.",
            "Select your city of concern (Lagos, Abuja, Port Harcourt, Akwa Ibom, or Kano).",
            "Describe what you need in detail - your concierge follows up directly.",
        ],
    },
    {
        icon: Compass,
        title: "Explore",
        summary: "Discover curated venues and experiences in your city.",
        details: [
            "Browse restaurants, lounges, spas, clubs, and hotels.",
            "Filter by city or category.",
            "Save places to your Saved Places list by tapping the bookmark icon.",
            "Tap a venue to see details, contact info, and how to book.",
        ],
    },
    {
        icon: Calendar,
        title: "Events",
        summary: "Browse and book exclusive events.",
        details: [
            "See upcoming events curated for Lapeq members.",
            "Tap an event to view full details and request a booking.",
            "Your concierge confirms your spot and handles any tickets or arrangements.",
        ],
    },
    {
        icon: MessageCircle,
        title: "Chat / Concierge",
        summary: "Your personal concierge is one tap away.",
        details: [
            "Tap the chat bubble icon on the home screen to open a direct conversation.",
            "Available 24/7 for any request - big or small.",
            "All messages are private and handled by your dedicated concierge.",
            "Use the quick-reply buttons for common questions, or type anything freely.",
        ],
    },
    {
        icon: ClipboardList,
        title: "My Requests",
        summary: "Track every service request you've submitted.",
        details: [
            "See all requests with their current status: Pending, In Progress, Completed, or Cancelled.",
            "Tap a request to view full details and any notes from your concierge.",
            "Receipts and confirmations are attached to each request when available.",
        ],
    },
    {
        icon: BookOpen,
        title: "Journal",
        summary: "Curated articles and stories for Lapeq members.",
        details: [
            "Browse articles across categories like lifestyle, travel, culture, and finance.",
            "Filter by category using the chips at the top.",
            "Tap an article to read the full piece.",
        ],
    },
    {
        icon: User,
        title: "Profile",
        summary: "View your membership and manage your account.",
        details: [
            "See your membership tier (Standard, Silver, Gold, or Black).",
            "Tap 'Personal Information' to update your name, phone, country, and region.",
            "Access settings like notifications, privacy, theme, and payment methods.",
            "Use 'Help Center' to contact support or read FAQs.",
            "Tap 'Sign Out' to log out of your account.",
        ],
    },
    {
        icon: Bell,
        title: "Notifications",
        summary: "Stay updated on your requests and account activity.",
        details: [
            "Receive real-time push notifications when your request status changes.",
            "In-app notifications appear as a banner at the top of the screen.",
            "Tap any notification to go directly to the relevant request or page.",
            "Manage notification preferences in Settings → Notification Preferences.",
        ],
    },
    {
        icon: Settings,
        title: "Settings",
        summary: "Customise your Lapeq experience.",
        details: [
            "Toggle between Light and Dark mode.",
            "Manage notification preferences - choose which updates you receive.",
            "Update privacy settings and data preferences.",
            "View payment methods and billing information.",
            "Read the About page for app version and legal information.",
        ],
    },
    {
        icon: HeartHandshake,
        title: "Membership Tiers",
        summary: "Understanding the Lapeq membership levels.",
        details: [
            "Standard - full access to all core services and concierge support.",
            "Silver - priority handling and enhanced service options.",
            "Gold - dedicated concierge, faster response times, exclusive perks.",
            "Black - the highest tier. White-glove service, bespoke arrangements, and priority access to everything.",
            "Contact your concierge to learn about upgrading your membership.",
        ],
    },
];

function SectionCard({ section }: { section: typeof SECTIONS[0] }) {
    const { C, theme } = useTheme();
    const [open, setOpen] = useState(false);
    const Icon = section.icon;

    return (
        <TouchableOpacity
            style={[s.card, { backgroundColor: C.surface, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }]}
            onPress={() => setOpen(o => !o)}
            activeOpacity={0.85}
        >
            <View style={s.cardHeader}>
                <View style={[s.iconBox, { backgroundColor: `${C.primary}15` }]}>
                    <Icon size={18} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: C.text }]}>{section.title}</Text>
                    <Text style={[s.cardSummary, { color: C.muted }]}>{section.summary}</Text>
                </View>
                {open
                    ? <ChevronUp size={18} color={C.muted} />
                    : <ChevronDown size={18} color={C.muted} />
                }
            </View>
            {open && (
                <View style={[s.details, { borderTopColor: theme === "dark" ? "#2a2a2a" : "#e5e0d8" }]}>
                    {section.details.map((d, i) => (
                        <View key={i} style={s.detailRow}>
                            <Text style={[s.bullet, { color: C.primary }]}>•</Text>
                            <Text style={[s.detailText, { color: C.muted }]}>{d}</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function AppGuideScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const replayTour = async () => {
        await AsyncStorage.setItem("lapeq_start_tour", "1");
        router.replace("/(tabs)" as any);
    };

    return (
        <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
            <View style={s.header}>
                <TouchableOpacity style={[s.backBtn, { backgroundColor: C.surface }]} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={[s.headerTitle, { color: C.text }]}>App Guide</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
                <Text style={[s.intro, { color: C.muted }]}>
                    Everything you need to know about using Lapeq. Tap any section to expand.
                </Text>

                <TouchableOpacity
                    style={[s.tourBtn, { borderColor: C.primary }]}
                    onPress={replayTour}
                    activeOpacity={0.85}
                >
                    <Text style={[s.tourBtnText, { color: C.primary }]}>Replay App Tour</Text>
                </TouchableOpacity>

                <View style={{ gap: 12, marginTop: 8 }}>
                    {SECTIONS.map((section, i) => (
                        <SectionCard key={i} section={section} />
                    ))}
                </View>
            </ScrollView>

        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontWeight: "700" },
    intro: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
    tourBtn: {
        borderWidth: 1.5,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        marginBottom: 20,
    },
    tourBtnText: { fontSize: 14, fontWeight: "700" },
    card: { borderRadius: 18, padding: 16, borderWidth: 1 },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
    iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
    cardSummary: { fontSize: 12, lineHeight: 18 },
    details: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, gap: 10 },
    detailRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    bullet: { fontSize: 16, lineHeight: 20, flexShrink: 0 },
    detailText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
