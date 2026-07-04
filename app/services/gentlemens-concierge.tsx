import { useState, useMemo } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    TextInput, Modal, Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ChevronLeft, ChevronRight, CheckCircle2, X,
    Mic, Plus, Minus, CalendarDays,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "grooming" | "style" | "business" | "home";

type ChipField  = { kind: "chips";   label: string; options: string[]; multi?: boolean };
type DateField  = { kind: "date";    label: string };
type CounterField = { kind: "counter"; label: string; min: number; max: number; step: number; unit?: string; zeroLabel?: string };
type NotesField = { kind: "notes";   label: string; placeholder: string };

type Field = ChipField | DateField | CounterField | NotesField;

type Service = {
    tab: Tab;
    title: string;
    short: string;
    tagline: string;
    full: string;
    heroImg: any;
    fields: Field[];
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES: Service[] = [
    // GROOMING
    {
        tab: "grooming",
        title: "Barber & Grooming",
        short: "Sharp cuts, refined finish",
        tagline: "Looking the part starts here.",
        heroImg: require("@/assets/images/barber-grooming.png"),
        full: "Expert barbers and grooming specialists available on-site or at your location. From precision cuts and beard sculpting to full grooming sessions — arranged around your schedule, never the other way.",
        fields: [
            { kind: "chips", label: "SERVICE", options: ["Haircut", "Beard Trim", "Full Groom", "Hot Towel Shave", "Other"] },
            { kind: "chips", label: "LOCATION", options: ["At Salon", "Come to Me"] },
            { kind: "notes", label: "NOTES", placeholder: "Any preferences, styles, or special requests..." },
        ],
    },
    {
        tab: "grooming",
        title: "Skincare & Facials",
        short: "Treatments tailored to you",
        tagline: "Your skin, properly looked after.",
        heroImg: require("@/assets/images/skincare-facials.png"),
        full: "Professional skincare treatments administered by certified aestheticians. Whether you need a classic facial, targeted treatment, or a bespoke regimen built around your skin — we bring the expertise to you.",
        fields: [
            { kind: "chips", label: "TREATMENT", options: ["Classic Facial", "Deep Cleanse", "Anti-Aging", "Brightening", "Bespoke"] },
            { kind: "chips", label: "LOCATION", options: ["At Spa", "Come to Me"] },
            { kind: "notes", label: "NOTES", placeholder: "Skin concerns, allergies, or preferences..." },
        ],
    },
    {
        tab: "grooming",
        title: "Spa & Massage",
        short: "Full-body restoration",
        tagline: "Restore. Reset. Return better.",
        heroImg: require("@/assets/images/ladies-spa.png"),
        full: "Access to premium spa facilities and private massage therapists across Abuja and Lagos. Choose your treatment, duration, and location — we handle the rest. In-hotel, in-home, or at a vetted spa partner.",
        fields: [
            { kind: "chips", label: "TYPE", options: ["Swedish", "Deep Tissue", "Hot Stone", "Sports", "Custom"] },
            { kind: "chips", label: "DURATION", options: ["60 Min", "90 Min", "2 Hours"] },
            { kind: "chips", label: "LOCATION", options: ["At Spa", "Come to Me", "Hotel Room"] },
            { kind: "notes", label: "NOTES", placeholder: "Pressure preference, areas to focus, any injuries..." },
        ],
    },
    {
        tab: "grooming",
        title: "Nail & Finishing",
        short: "Details that set you apart",
        tagline: "The details others notice.",
        heroImg: require("@/assets/images/onboarding-lifestyle.png"),
        full: "A complete nail care and finishing service for the gentleman who knows that every detail counts. Manicure, pedicure, buff and polish — professional finish, complete discretion.",
        fields: [
            { kind: "chips", label: "SERVICE", options: ["Manicure", "Pedicure", "Both", "Buff & Polish"] },
            { kind: "chips", label: "LOCATION", options: ["At Salon", "Come to Me"] },
            { kind: "notes", label: "NOTES", placeholder: "Any additional requests..." },
        ],
    },

    // STYLE
    {
        tab: "style",
        title: "Bespoke Tailoring",
        short: "Crafted to your exact measure",
        tagline: "Clothes that were made for you — because they were.",
        heroImg: require("@/assets/images/onboarding-driving.png"),
        full: "Access to master tailors who build each garment from scratch to your exact measurements and specifications. Suits, shirts, agbada, native attire, and formal wear — all cut to reflect who you are.",
        fields: [
            { kind: "chips", label: "GARMENT", options: ["Suit", "Shirt", "Native Attire", "Agbada", "Full Outfit"] },
            { kind: "chips", label: "OCCASION", options: ["Work", "Formal", "Social", "Wedding", "Custom"] },
            { kind: "counter", label: "PIECES", min: 1, max: 10, step: 1, unit: "pieces" },
            { kind: "notes", label: "NOTES", placeholder: "Fabric preferences, colours, style references..." },
        ],
    },
    {
        tab: "style",
        title: "Personal Styling",
        short: "A wardrobe built for your life",
        tagline: "Style is a form of authority.",
        heroImg: require("@/assets/images/onboarding-lifestyle.png"),
        full: "Our stylists audit your wardrobe, curate outfits for any occasion, and accompany you on personal shopping trips.",
        fields: [
            { kind: "chips", label: "WHAT DO YOU NEED?", options: ["Wardrobe Audit", "Outfit Curation", "Shopping Trip"], multi: true },
            { kind: "chips", label: "OCCASION", options: ["Work", "Social", "Travel", "Formal"] },
            { kind: "counter", label: "BUDGET", min: 0, max: 2000000, step: 50000, unit: "₦", zeroLabel: "Open Budget" },
            { kind: "notes", label: "NOTES", placeholder: "Style preferences, brands you like..." },
        ],
    },
    {
        tab: "style",
        title: "Luxury Accessories",
        short: "Source rare. Wear right.",
        tagline: "The right piece changes everything.",
        heroImg: require("@/assets/images/onboarding-driving.png"),
        full: "We source and authenticate luxury accessories on your behalf — from Swiss timepieces and Italian leather to rare sneakers and statement jewellery. We handle procurement, authentication, and delivery.",
        fields: [
            { kind: "chips", label: "CATEGORY", options: ["Watches", "Shoes", "Bags", "Jewellery", "Sunglasses", "Other"] },
            { kind: "chips", label: "BUDGET RANGE", options: ["₦500k–₦1M", "₦1M–₦5M", "₦5M+", "Open Budget"] },
            { kind: "notes", label: "NOTES", placeholder: "Specific brands, models, or references..." },
        ],
    },

    // BUSINESS
    {
        tab: "business",
        title: "Executive Travel",
        short: "Business-class, door to door",
        tagline: "Every leg of your journey, handled.",
        heroImg: require("@/assets/images/range-rover-suv.png"),
        full: "End-to-end executive travel coordination — airport pickups, hotel arrangements, flight bookings, inter-city movements, and on-ground support in any Nigerian city. Travel without friction.",
        fields: [
            { kind: "date",    label: "DATE" },
            { kind: "chips",   label: "SERVICE", options: ["Airport Transfer", "Hotel Arrangement", "Inter-City", "Full Trip"] },
            { kind: "chips",   label: "VEHICLE CLASS", options: ["Sedan", "SUV", "Sprinter Van"] },
            { kind: "notes",   label: "NOTES", placeholder: "Route, flight details, hotel preferences..." },
        ],
    },
    {
        tab: "business",
        title: "Corporate Dining",
        short: "The best table, always reserved",
        tagline: "Your deal starts at the table.",
        heroImg: require("@/assets/images/onboarding-driving.png"),
        full: "Priority reservations at the finest restaurants across Lagos and Abuja. Preferred seating, arrival coordination, curated menus, and complete discretion for your most important business meals.",
        fields: [
            { kind: "date",    label: "DATE" },
            { kind: "counter", label: "GUESTS", min: 1, max: 20, step: 1, unit: "guests" },
            { kind: "chips",   label: "OCCASION", options: ["Client Dinner", "Team Lunch", "Deal Close", "Celebration"] },
            { kind: "notes",   label: "NOTES", placeholder: "Dietary requirements, ambiance preference, wine..." },
        ],
    },
    {
        tab: "business",
        title: "Meeting & Workspace",
        short: "Premium space to close deals",
        tagline: "Your next deal starts here.",
        heroImg: require("@/assets/images/onboarding-benefits.png"),
        full: "Private offices, boardrooms, and conference spaces across Abuja and Lagos. AV, catering, and support all included.",
        fields: [
            { kind: "date",    label: "DATE" },
            { kind: "chips",   label: "DURATION", options: ["2 Hours", "Half Day", "Full Day"] },
            { kind: "counter", label: "CAPACITY", min: 1, max: 50, step: 1, unit: "people" },
            { kind: "notes",   label: "NOTES", placeholder: "AV requirements, catering, specific location..." },
        ],
    },
    {
        tab: "business",
        title: "Client Entertainment",
        short: "Beyond the boardroom",
        tagline: "Relationships are built off the clock.",
        heroImg: require("@/assets/images/onboarding-driving.png"),
        full: "Curated entertainment experiences for your clients and business partners. Golf outings, private dining, VIP event access, sports packages, and exclusive social experiences — all arranged to impress.",
        fields: [
            { kind: "date",    label: "DATE" },
            { kind: "chips",   label: "TYPE", options: ["Golf Outing", "Private Dinner", "VIP Event", "Sports Package", "Custom"] },
            { kind: "counter", label: "GUESTS", min: 1, max: 20, step: 1, unit: "guests" },
            { kind: "notes",   label: "NOTES", placeholder: "Guest preferences, budget, any specific requests..." },
        ],
    },

    // HOME
    {
        tab: "home",
        title: "Home Chef",
        short: "Restaurant quality, in your home",
        tagline: "The best dining room is yours.",
        heroImg: require("@/assets/images/onboarding-lifestyle.png"),
        full: "Professional chefs brought directly to your home for any occasion — dinner parties, family meals, weekly meal prep, or a private dining experience. Full menu planning, grocery procurement, and kitchen cleanup included.",
        fields: [
            { kind: "date",    label: "DATE" },
            { kind: "chips",   label: "OCCASION", options: ["Dinner Party", "Date Night", "Meal Prep", "Family Meal", "Custom"] },
            { kind: "chips",   label: "CUISINE", options: ["Nigerian", "Continental", "Fusion", "Seafood", "Chef's Choice"] },
            { kind: "counter", label: "GUESTS", min: 1, max: 30, step: 1, unit: "guests" },
            { kind: "notes",   label: "NOTES", placeholder: "Dietary restrictions, favourite dishes, budget..." },
        ],
    },
    {
        tab: "home",
        title: "Housekeeping",
        short: "Immaculate, without the effort",
        tagline: "Your space, always at its best.",
        heroImg: require("@/assets/images/onboarding-lifestyle.png"),
        full: "Vetted, professional housekeeping staff deployed to your home on a one-time or recurring basis. Deep cleans, regular maintenance, laundry, ironing, and home organisation — done to your standard.",
        fields: [
            { kind: "chips", label: "SERVICE", options: ["Regular Clean", "Deep Clean", "Laundry & Ironing", "Organisation", "Full Service"] },
            { kind: "chips", label: "FREQUENCY", options: ["Once", "Weekly", "Bi-Weekly", "Monthly"] },
            { kind: "notes", label: "NOTES", placeholder: "Home size, specific areas to focus on..." },
        ],
    },
    {
        tab: "home",
        title: "Home Maintenance",
        short: "Fix it before you notice",
        tagline: "A well-kept home is a statement.",
        heroImg: require("@/assets/images/onboarding-benefits.png"),
        full: "Trusted tradespeople for every home repair and maintenance need — plumbing, electrical, AC servicing, painting, carpentry, and more. Vetted professionals, fair pricing, and work you can rely on.",
        fields: [
            { kind: "chips", label: "SERVICE", options: ["Plumbing", "Electrical", "AC Service", "Painting", "Carpentry", "Other"] },
            { kind: "notes", label: "NOTES", placeholder: "Describe the issue or work required..." },
        ],
    },
    {
        tab: "home",
        title: "Interior Refresh",
        short: "Space that works for you",
        tagline: "Your environment shapes everything.",
        heroImg: require("@/assets/images/onboarding-lifestyle.png"),
        full: "Interior styling and decoration support for any room or entire property. From artwork curation and furniture sourcing to full room redesigns — we help you build a space that reflects your taste and supports how you live.",
        fields: [
            { kind: "chips", label: "SCOPE", options: ["One Room", "Multiple Rooms", "Full Home", "Office"] },
            { kind: "chips", label: "STYLE", options: ["Modern", "Classic", "Afro-Luxe", "Minimalist", "Custom"] },
            { kind: "counter", label: "BUDGET", min: 0, max: 5000000, step: 100000, unit: "₦", zeroLabel: "Open Budget" },
            { kind: "notes", label: "NOTES", placeholder: "Reference images, colours you love, must-haves..." },
        ],
    },
];

const TABS: { id: Tab; label: string }[] = [
    { id: "grooming", label: "GROOMING" },
    { id: "style",    label: "STYLE" },
    { id: "business", label: "BUSINESS" },
    { id: "home",     label: "HOME" },
];

// ─── Field state helpers ───────────────────────────────────────────────────────

function initFieldState(fields: Field[]): Record<string, any> {
    const s: Record<string, any> = {};
    for (const f of fields) {
        if (f.kind === "chips")   s[f.label] = f.multi ? [] : "";
        if (f.kind === "date")    s[f.label] = "";
        if (f.kind === "counter") s[f.label] = f.min;
        if (f.kind === "notes")   s[f.label] = "";
    }
    return s;
}

function formatCounterValue(f: CounterField, val: number): string {
    if (val === f.min && f.zeroLabel) return f.zeroLabel;
    if (f.unit === "₦") return `₦${(val).toLocaleString()}`;
    return `${val} ${f.unit ?? ""}`.trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GentlemensConciergeScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const BLUE = "#6b8fc4";
    const s = useMemo(() => getStyles(C, theme, BLUE), [C, theme]);

    const [activeTab, setActiveTab] = useState<Tab>("grooming");
    const [selected, setSelected]   = useState<Service | null>(null);
    const [fieldState, setFieldState] = useState<Record<string, any>>({});
    const [loading, setLoading]     = useState(false);
    const [success, setSuccess]     = useState(false);

    const tabServices = SERVICES.filter(sv => sv.tab === activeTab);

    const openService = (svc: Service) => {
        setSelected(svc);
        setFieldState(initFieldState(svc.fields));
    };

    const setField = (label: string, value: any) => {
        setFieldState(prev => ({ ...prev, [label]: value }));
    };

    const toggleChip = (label: string, option: string, multi?: boolean) => {
        if (multi) {
            setFieldState(prev => {
                const arr: string[] = prev[label] ?? [];
                return { ...prev, [label]: arr.includes(option) ? arr.filter(x => x !== option) : [...arr, option] };
            });
        } else {
            setField(label, fieldState[label] === option ? "" : option);
        }
    };

    const adjustCounter = (label: string, f: CounterField, dir: 1 | -1) => {
        const cur = fieldState[label] ?? f.min;
        const next = Math.min(f.max, Math.max(f.min, cur + dir * f.step));
        setField(label, next);
    };

    const handleSubmit = async () => {
        if (!selected) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const notesField = selected.fields.find(f => f.kind === "notes") as NotesField | undefined;
        const notes = notesField ? (fieldState[notesField.label] ?? "") : "";

        const summary = Object.entries(fieldState)
            .filter(([k]) => k !== notesField?.label)
            .map(([k, v]) => {
                const val = Array.isArray(v) ? v.join(", ") : v;
                return val ? `${k}: ${val}` : null;
            })
            .filter(Boolean)
            .join(" | ");

        setLoading(true);
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user.id,
            reference: ref,
            service_type: "gentlemens-concierge",
            status: "pending",
            notes: `[${selected.title}] ${summary}${notes ? ` | Notes: ${notes}` : ""}`,
        });
        setLoading(false);
        if (error) { Alert.alert("Error", error.message); return; }
        setSelected(null);
        setSuccess(true);
    };

    const renderField = (f: Field) => {
        if (f.kind === "chips") {
            const val = fieldState[f.label];
            return (
                <View key={f.label} style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <View style={s.chipRow}>
                        {f.options.map(opt => {
                            const active = f.multi
                                ? (val as string[])?.includes(opt)
                                : val === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[s.chip, active && s.chipActive]}
                                    onPress={() => toggleChip(f.label, opt, f.multi)}
                                >
                                    <Text style={[s.chipText, active && s.chipTextActive]}>{opt}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            );
        }

        if (f.kind === "counter") {
            const val = fieldState[f.label] ?? f.min;
            const display = formatCounterValue(f, val);
            const isZero  = val === f.min && !!f.zeroLabel;
            return (
                <View key={f.label} style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <View style={s.counterRow}>
                        <TouchableOpacity style={s.counterBtn} onPress={() => adjustCounter(f.label, f, -1)} disabled={val <= f.min}>
                            <Minus size={16} color={val <= f.min ? C.muted : C.text} />
                        </TouchableOpacity>
                        <Text style={[s.counterVal, isZero && { color: BLUE }]}>{display}</Text>
                        <TouchableOpacity style={s.counterBtn} onPress={() => adjustCounter(f.label, f, 1)} disabled={val >= f.max}>
                            <Plus size={16} color={val >= f.max ? C.muted : C.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        if (f.kind === "date") {
            return (
                <View key={f.label} style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <TouchableOpacity
                        style={s.datePicker}
                        onPress={() => Alert.alert("Date Selection", "Please note your preferred date in the notes field below.")}
                    >
                        <CalendarDays size={16} color={C.muted} />
                        <Text style={[s.dateText, fieldState[f.label] ? { color: C.text } : {}]}>
                            {fieldState[f.label] || "Select a date"}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (f.kind === "notes") {
            return (
                <View key={f.label} style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <VoiceInput
                        placeholder={f.placeholder}
                        value={fieldState[f.label] ?? ""}
                        onChange={v => setField(f.label, v)}
                        accent={BLUE}
                        textColor={C.text}
                        border={C.border}
                        inputBg={C.surface}
                    />
                </View>
            );
        }

        return null;
    };

    return (
        <SafeAreaView style={s.root} edges={["bottom"]}>
            {/* Hero */}
            <View style={s.hero}>
                <Image source={require("@/assets/images/onboarding-driving.png")} style={s.heroImg} resizeMode="cover" />
                <View style={s.heroOverlay} />
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={22} color="#fff" />
                </TouchableOpacity>
                <View style={s.heroContent}>
                    <Text style={s.heroTagline}>PREMIUM · DISCREET · COMPLETE</Text>
                    <Text style={s.heroTitle}>Your standard,{"\n"}our responsibility.</Text>
                </View>
            </View>

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
                {TABS.map(t => (
                    <TouchableOpacity
                        key={t.id}
                        style={[s.tab, activeTab === t.id && s.tabActive]}
                        onPress={() => setActiveTab(t.id)}
                    >
                        <Text style={[s.tabText, activeTab === t.id && s.tabTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Service list */}
            <ScrollView style={{ backgroundColor: C.background }} contentContainerStyle={s.list}>
                {tabServices.map((svc, i) => (
                    <TouchableOpacity key={i} style={s.serviceCard} onPress={() => openService(svc)} activeOpacity={0.82}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.serviceTitle}>{svc.title}</Text>
                            <Text style={s.serviceShort}>{svc.short}</Text>
                        </View>
                        <ChevronRight size={18} color={BLUE} />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Service detail sheet */}
            <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
                {selected && (
                    <View style={s.sheet}>
                        {/* Sheet hero */}
                        <View style={s.sheetHero}>
                            <Image source={selected.heroImg} style={s.sheetHeroImg} resizeMode="cover" />
                            <View style={s.sheetHeroOverlay} />
                            <TouchableOpacity style={s.sheetClose} onPress={() => setSelected(null)}>
                                <X size={18} color="#fff" />
                            </TouchableOpacity>
                            <View style={s.sheetHeroContent}>
                                <Text style={s.sheetEyebrow}>GENTLEMEN'S CONCIERGE</Text>
                                <Text style={s.sheetTitle}>{selected.title}</Text>
                                <Text style={s.sheetTagline}>{selected.tagline}</Text>
                            </View>
                        </View>

                        <ScrollView contentContainerStyle={s.sheetScroll}>
                            <Text style={s.sheetDesc}>{selected.full}</Text>
                            <View style={s.divider} />

                            {selected.fields.map(renderField)}

                            <TouchableOpacity
                                style={[s.submitBtn, loading && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={s.submitText}>{loading ? "Submitting..." : "Request This Service"}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}
            </Modal>

            {/* Success */}
            <Modal visible={success} transparent animationType="fade">
                <View style={s.successOverlay}>
                    <View style={s.successBox}>
                        <CheckCircle2 size={48} color={BLUE} style={{ marginBottom: 16 }} />
                        <Text style={s.successTitle}>Request Received</Text>
                        <Text style={s.successBody}>Your concierge will reach out shortly to confirm the details and get everything arranged.</Text>
                        <TouchableOpacity style={s.successBtn} onPress={() => { setSuccess(false); router.push("/requests" as any); }}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (C: any, theme: string, BLUE: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },

    // Hero
    hero: { height: 300, position: "relative" },
    heroImg: { width: "100%", height: "100%", position: "absolute" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    backBtn: { position: "absolute", top: 52, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
    heroContent: { position: "absolute", bottom: 24, left: 20, right: 20 },
    heroTagline: { fontSize: 10, fontWeight: "700", color: BLUE, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 28, fontWeight: "700", color: "#ffffff", lineHeight: 34 },

    // Tabs
    tabBar: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, flexGrow: 0, backgroundColor: C.background },
    tabBarContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
    tab: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: C.border },
    tabActive: { backgroundColor: BLUE, borderColor: BLUE },
    tabText: { fontSize: 12, fontWeight: "700", color: C.muted, letterSpacing: 0.8 },
    tabTextActive: { color: "#ffffff" },

    // List
    list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, gap: 12 },
    serviceCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
    serviceTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 3 },
    serviceShort: { fontSize: 13, color: C.muted },

    // Sheet
    sheet: { flex: 1, backgroundColor: C.background },
    sheetHero: { height: 200, position: "relative" },
    sheetHeroImg: { width: "100%", height: "100%", position: "absolute" },
    sheetHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)" },
    sheetClose: { position: "absolute", top: 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
    sheetHeroContent: { position: "absolute", bottom: 20, left: 20, right: 20 },
    sheetEyebrow: { fontSize: 10, fontWeight: "800", color: BLUE, letterSpacing: 2, marginBottom: 4 },
    sheetTitle: { fontSize: 26, fontWeight: "700", color: "#fff", marginBottom: 4 },
    sheetTagline: { fontSize: 13, fontStyle: "italic", color: "rgba(255,255,255,0.7)" },
    sheetScroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 },
    sheetDesc: { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 20 },
    divider: { height: 1, backgroundColor: C.border, marginBottom: 20 },

    // Fields
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 1.5, marginBottom: 10 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 100, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    chipActive: { backgroundColor: `${BLUE}22`, borderColor: BLUE },
    chipText: { fontSize: 13, color: C.muted, fontWeight: "500" },
    chipTextActive: { color: BLUE, fontWeight: "700" },
    counterRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    counterBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
    counterVal: { fontSize: 17, fontWeight: "700", color: C.text, minWidth: 120, textAlign: "center" },
    datePicker: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: C.border },
    dateText: { fontSize: 15, color: C.muted },
    notesRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    textarea: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 16, fontSize: 14, color: C.text, minHeight: 110, borderWidth: 1, borderColor: C.border },
    micBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, marginTop: 4 },
    submitBtn: { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 8 },
    submitText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },

    // Success
    successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    successBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center", borderWidth: 1, borderColor: BLUE },
    successTitle: { fontSize: 22, fontWeight: "700", color: C.text, marginBottom: 10 },
    successBody: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 28 },
    successBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: BLUE, alignItems: "center" },
    successBtnText: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
});
