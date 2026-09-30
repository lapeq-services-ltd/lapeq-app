import { showToast } from "@/lib/toast";
import { cleanErr } from "@/lib/cleanErr";
import { useState, useMemo, useEffect } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Modal, Alert, Image, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ChevronLeft, ChevronRight, CheckCircle2, X,
    Plus, Minus, CalendarDays, Sparkles,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "@/context/ThemeContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";
import LocationSearch from "@/components/LocationSearch";

// ─── Image Assets (Real Authentic Photography) ────────────────────────────────

const IMAGES = {
    hero: require("@/assets/images/gentlemen/hero_gentleman.jpg"),
    bespokeTailoring: require("@/assets/images/gentlemen/bespoke_tailoring.jpg"),
    luxuryWatches: require("@/assets/images/gentlemen/luxury_watches.jpg"),
    personalStyling: require("@/assets/images/gentlemen/personal_styling.jpg"),
    barber: require("@/assets/images/gentlemen/private_barber.jpg"),
    sportsRecovery: require("@/assets/images/gentlemen/sports_recovery.jpg"),
    skincare: require("@/assets/images/gentlemen/skincare_facials.jpg"),
    chauffeur: require("@/assets/images/gentlemen/executive_chauffeur.jpg"),
    aviation: require("@/assets/images/gentlemen/private_aviation.jpg"),
    boardroom: require("@/assets/images/gentlemen/boardroom_workspace.jpg"),
    cigars: require("@/assets/images/gentlemen/cigars_spirits.jpg"),
    dining: require("@/assets/images/gentlemen/corporate_dining.jpg"),
    golf: require("@/assets/images/gentlemen/golf_networking.jpg"),
    chef: require("@/assets/images/gentlemen/private_chef.jpg"),
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "style" | "grooming" | "business" | "leisure";

type ChipField = { kind: "chips"; label: string; options: string[]; multi?: boolean };
type DateField = { kind: "date"; label: string };
type CounterField = { kind: "counter"; label: string; min: number; max: number; step: number; unit?: string; zeroLabel?: string };
type NotesField = { kind: "notes"; label: string; placeholder: string };
type LocationField = { kind: "location"; label: string; placeholder: string; showWhen: { field: string; oneOf: string[] } };

type Field = ChipField | DateField | CounterField | NotesField | LocationField;

type Service = {
    tab: Tab;
    title: string;
    short: string;
    tagline: string;
    full: string;
    heroImg: any;
    fields: Field[];
};

// ─── Curated Luxury Services ──────────────────────────────────────────────────

const SERVICES: Service[] = [
    // ─── STYLE ─────────────────────────────────────────────
    {
        tab: "style",
        title: "Bespoke Tailoring & Native Attire",
        short: "Suits, tuxedos, agbada & kaftans cut to your exact measure by master tailors",
        tagline: "Clothes crafted exclusively for you.",
        heroImg: IMAGES.bespokeTailoring,
        full: "Access to master tailors who construct each garment by hand to your exact silhouette and posture. Bespoke two-piece and three-piece suits, formal tuxedos, hand-loomed native attire, and kaftans. Measured and fitted at your residence, hotel suite, or master atelier.",
        fields: [
            { kind: "chips", label: "GARMENT TYPE", options: ["Two-Piece Suit", "Three-Piece Suit", "Tuxedo / Black Tie", "Agbada & Native Attire", "Bespoke Shirts", "Full Wardrobe"] },
            { kind: "chips", label: "OCCASION", options: ["Boardroom / Executive", "State & Diplomatic", "Wedding / Ceremony", "Casual Elegance"] },
            { kind: "chips", label: "FITTING LOCATION", options: ["At My Residence", "Hotel Suite", "Master Atelier"] },
            { kind: "location", label: "FITTING ADDRESS", placeholder: "Search and select residence or suite address...", showWhen: { field: "FITTING LOCATION", oneOf: ["At My Residence", "Hotel Suite"] } },
            { kind: "counter", label: "NUMBER OF PIECES", min: 1, max: 10, step: 1, unit: "pieces" },
            { kind: "date", label: "PREFERRED FITTING DATE" },
            { kind: "notes", label: "FABRIC & STYLING PREFERENCES", placeholder: "Italian wool, cashmere, linen, Swiss voile, color palette, reference cuts..." },
        ],
    },
    {
        tab: "style",
        title: "Luxury Horology & Timepieces",
        short: "Global procurement, authentication & bespoke watch finding for collectors",
        tagline: "Source the rarest. Wear with distinction.",
        heroImg: IMAGES.luxuryWatches,
        full: "Private sourcing and global procurement for prestigious timepieces. Whether seeking an elusive Rolex Daytona, Patek Philippe Nautilus, Audemars Piguet Royal Oak, or Richard Mille, our horology specialists verify authenticity, condition, and provenance with complete discretion.",
        fields: [
            { kind: "chips", label: "SERVICE REQUIRED", options: ["Acquisition & Sourcing", "Authentication & Appraisal", "Bespoke Customization", "Watch Servicing & Care"] },
            { kind: "chips", label: "MAISON / BRAND", options: ["Rolex", "Patek Philippe", "Audemars Piguet", "Vacheron Constantin", "Cartier", "Richard Mille", "Other Maison"] },
            { kind: "chips", label: "BUDGET RANGE", options: ["₦10M – ₦25M", "₦25M – ₦50M", "₦50M – ₦100M+", "Open Investment"] },
            { kind: "date", label: "TARGET DELIVERY DATE" },
            { kind: "notes", label: "MODEL SPECIFICATIONS", placeholder: "Specific reference numbers, dial color, year, box & papers requirement..." },
        ],
    },
    {
        tab: "style",
        title: "Personal Styling & Wardrobe Audit",
        short: "Curated wardrobe, footwear, leather goods & private showroom shopping",
        tagline: "Style is a form of authority.",
        heroImg: IMAGES.personalStyling,
        full: "Comprehensive personal styling for discerning gentlemen. Includes wardrobe auditing, bespoke outfit curation for milestone speaking engagements or international travel, and private showroom shopping with exclusive concierge access.",
        fields: [
            { kind: "chips", label: "SERVICES REQUIRED", options: ["Wardrobe Audit", "Event Styling", "Private Shopping Concierge", "Footwear & Leather Goods"], multi: true },
            { kind: "chips", label: "PRIMARY OCCASION", options: ["Executive / C-Suite", "Diplomatic / State", "International Travel", "Gala & Social"] },
            { kind: "counter", label: "ESTIMATED BUDGET", min: 0, max: 10000000, step: 250000, unit: "₦", zeroLabel: "Open / To Discuss" },
            { kind: "date", label: "CONSULTATION DATE" },
            { kind: "notes", label: "STYLE NOTES & SIZES", placeholder: "Jacket/shoe size, preferred European/local designers, personal style goals..." },
        ],
    },

    // ─── GROOMING ──────────────────────────────────────────
    {
        tab: "grooming",
        title: "Master Barber & Beard Sculpting",
        short: "Precision haircut, hot towel shave & grooming in your private quarters",
        tagline: "Looking the part begins with precision.",
        heroImg: IMAGES.barber,
        full: "Elite master barbers dispatched directly to your private residence, hotel suite, or reserved in an exclusive VIP salon lounge. Precision scissor cuts, beard lineation, hot towel treatments, and soothing scalp therapies executed strictly on your timetable.",
        fields: [
            { kind: "chips", label: "TREATMENT TYPE", options: ["Executive Haircut", "Beard Sculpt & Shape", "Hot Towel Straight Razor Shave", "Complete Grooming Package"] },
            { kind: "chips", label: "SERVICE LOCATION", options: ["Come to My Residence", "Hotel Suite", "VIP Salon Lounge"] },
            { kind: "location", label: "ADDRESS", placeholder: "Search and select your location...", showWhen: { field: "SERVICE LOCATION", oneOf: ["Come to My Residence", "Hotel Suite"] } },
            { kind: "date", label: "APPOINTMENT DATE" },
            { kind: "chips", label: "PREFERRED TIME", options: ["Morning (8am – 12pm)", "Afternoon (12pm – 4pm)", "Evening (4pm – 8pm)", "Late Night VIP"] },
            { kind: "notes", label: "SPECIAL PREFERENCES", placeholder: "Hair texture, skin sensitivities, favorite grooming products..." },
        ],
    },
    {
        tab: "grooming",
        title: "Sports Recovery & Deep Tissue",
        short: "Physiotherapists, deep tissue trigger release & athletic recovery therapy",
        tagline: "Restore. Decompress. Return stronger.",
        heroImg: IMAGES.sportsRecovery,
        full: "Certified sports recovery therapists and physiotherapists brought directly to your home or hotel. Deep tissue trigger release, percussive therapy, assisted stretching, and therapeutic massage designed to alleviate travel fatigue and peak physical strain.",
        fields: [
            { kind: "chips", label: "THERAPY TYPE", options: ["Deep Tissue Massage", "Sports Athletic Recovery", "Assisted Stretch Therapy", "Hot Stone & Tension Release"] },
            { kind: "chips", label: "SESSION DURATION", options: ["60 Minutes", "90 Minutes", "2 Hours"] },
            { kind: "chips", label: "LOCATION", options: ["In-Residence", "Hotel Suite", "Partner Wellness Spa"] },
            { kind: "location", label: "ADDRESS", placeholder: "Search and select address or hotel...", showWhen: { field: "LOCATION", oneOf: ["In-Residence", "Hotel Suite"] } },
            { kind: "date", label: "RECOVERY DATE" },
            { kind: "notes", label: "FOCUS AREAS & INJURIES", placeholder: "Shoulder tension, lower back stiffness, hamstring recovery, pressure preference..." },
        ],
    },
    {
        tab: "grooming",
        title: "Executive Skincare & Revitalizing Facial",
        short: "Tailored dermatological treatments, deep cleanse & jet-lag reset",
        tagline: "The look of relentless vitality.",
        heroImg: IMAGES.skincare,
        full: "Clinical and restorative skincare formulated specifically for gentlemen. Administered by licensed aestheticians to eliminate fatigue, congestion, and razor irritation, leaving you refreshed for high-stakes appearances.",
        fields: [
            { kind: "chips", label: "TREATMENT SELECTION", options: ["Executive Deep Cleanse", "Jet-Lag Hydration Reset", "Anti-Fatigue Eye & Face", "Bespoke Dermatological"] },
            { kind: "chips", label: "LOCATION", options: ["In-Residence", "Hotel Suite", "Private MedSpa"] },
            { kind: "location", label: "ADDRESS", placeholder: "Search and select location...", showWhen: { field: "LOCATION", oneOf: ["In-Residence", "Hotel Suite"] } },
            { kind: "date", label: "APPOINTMENT DATE" },
            { kind: "notes", label: "SKIN CONCERNS", placeholder: "Dryness, shaving sensitivity, blemishes, allergies..." },
        ],
    },

    // ─── BUSINESS ──────────────────────────────────────────
    {
        tab: "business",
        title: "Executive Chauffeur & Armored Escort",
        short: "Discreet armored B6/B7 SUVs, Maybachs & vetted security drivers",
        tagline: "Commanding transit. Uncompromised safety.",
        heroImg: IMAGES.chauffeur,
        full: "Secure executive transportation across Abuja, Lagos, and inter-state corridors. Armored B6/B7 luxury SUVs, Mercedes-Maybach, and Range Rovers manned by vetted tactical chauffeurs and optional close protection officers (CPOs).",
        fields: [
            { kind: "chips", label: "VEHICLE CLASS", options: ["Armored B6/B7 SUV", "Mercedes S-Class / Maybach", "Range Rover Autobiography", "Luxury VIP Sprinter"] },
            { kind: "chips", label: "SERVICE SCOPE", options: ["VIP Airport Protocol", "Half-Day (5 Hours)", "Full-Day (12 Hours)", "Multi-Day Inter-State"] },
            { kind: "chips", label: "SECURITY DETAIL", options: ["Standard Executive Chauffeur", "Armed Security Escort Vehicle", "Close Protection Officer (CPO)"] },
            { kind: "date", label: "START DATE" },
            { kind: "location", label: "PICKUP LOCATION", placeholder: "Enter pickup address, hotel, or airport terminal...", showWhen: { field: "VEHICLE CLASS", oneOf: ["Armored B6/B7 SUV", "Mercedes S-Class / Maybach", "Range Rover Autobiography", "Luxury VIP Sprinter"] } },
            { kind: "notes", label: "ITINERARY & FLIGHT DETAILS", placeholder: "Flight number, destination, passenger names, luggage count..." },
        ],
    },
    {
        tab: "business",
        title: "Private Aviation & Jet Charter",
        short: "Mid-size jets, heavy jets & helicopter charter with VIP tarmac boarding",
        tagline: "Your flight, on your schedule.",
        heroImg: IMAGES.aviation,
        full: "On-demand private jet charters and helicopter movements across Nigeria, the West African sub-region, and transatlantic routes. Light jets, mid-size Hawkers, and ultra-long-range Challengers prepared with seamless VIP terminal tarmac boarding.",
        fields: [
            { kind: "chips", label: "AIRCRAFT CLASS", options: ["Light Jet (4–6 seats)", "Mid-Size Jet (7–9 seats)", "Heavy Jet (10–14 seats)", "Helicopter Transfer"] },
            { kind: "chips", label: "ROUTING TYPE", options: ["One-Way Flight", "Round Trip", "Multi-Leg / Shuttle"] },
            { kind: "chips", label: "ORIGIN DEPARTURE", options: ["Abuja (ABV)", "Lagos (LOS)", "Port Harcourt (PHC)", "Kano (KAN)", "International"] },
            { kind: "counter", label: "PASSENGERS", min: 1, max: 14, step: 1, unit: "passengers" },
            { kind: "date", label: "DEPARTURE DATE" },
            { kind: "notes", label: "DESTINATION & FLIGHT SPECS", placeholder: "Destination airport, preferred takeoff time, return date, in-flight catering..." },
        ],
    },
    {
        tab: "business",
        title: "Boardrooms & Executive Workspace",
        short: "High-security boardrooms, private C-suite suites & high-tech AV",
        tagline: "Where significant decisions are made.",
        heroImg: IMAGES.boardroom,
        full: "High-level private boardrooms and executive suites located in premier corporate towers across Victoria Island, Ikoyi, and Maitama Abuja. Complete with encrypted video conferencing, secretarial protocol, and private dining service.",
        fields: [
            { kind: "chips", label: "LOCATION CITY", options: ["Abuja (Maitama / Central)", "Lagos (Victoria Island)", "Lagos (Ikoyi)"] },
            { kind: "chips", label: "SPACE TYPE", options: ["12-Person Boardroom", "Executive C-Suite Office", "24-Person Conference Room", "Private Dining Suite"] },
            { kind: "chips", label: "RESERVATION DURATION", options: ["Half Day (4 hrs)", "Full Day (8 hrs)", "Multi-Day Package"] },
            { kind: "counter", label: "ESTIMATED ATTENDEES", min: 2, max: 30, step: 1, unit: "people" },
            { kind: "date", label: "RESERVATION DATE" },
            { kind: "notes", label: "HOSPITALITY & AV REQUIREMENTS", placeholder: "Video conferencing, executive lunch catering, security clearance list..." },
        ],
    },

    // ─── LEISURE ───────────────────────────────────────────
    {
        tab: "leisure",
        title: "Fine Cigars & Rare Spirits",
        short: "Cuban puros, single malt scotches & private humidor delivery",
        tagline: "Curated for the connoisseur.",
        heroImg: IMAGES.cigars,
        full: "Immediate access to genuine Cuban cigars, rare single malts, and collector cognacs. Delivered in pristine temperature-controlled condition to your residence, hotel, or private dining room.",
        fields: [
            { kind: "chips", label: "CIGAR SELECTION", options: ["Cohiba Behike / Siglo", "Montecristo No. 2", "Partagás Serie D", "Arturo Fuente OpusX", "Curated Connoisseur Box"], multi: true },
            { kind: "chips", label: "SPIRIT PAIRING", options: ["25yo+ Single Malt Scotch", "Vintage Cognac (XO / Louis XIII)", "Japanese Whisky", "Small Batch Bourbon", "Cigars Only"] },
            { kind: "chips", label: "FULFILLMENT TYPE", options: ["Immediate Discreet Delivery", "Humidor Setup & Stocking", "Private Cigar Lounge Reservation"] },
            { kind: "date", label: "DELIVERY / TASTING DATE" },
            { kind: "notes", label: "SPECIAL LABELS & ACCESSORIES", placeholder: "Cigar cutter & torch needed, crystal glasses, specific vintage years..." },
        ],
    },
    {
        tab: "leisure",
        title: "Corporate Dining & Steakhouse Priority",
        short: "Guaranteed prime tables at top-tier steakhouses & fine dining",
        tagline: "The prime table, guaranteed.",
        heroImg: IMAGES.dining,
        full: "Guaranteed premier seating and private dining rooms at the most sought-after steakhouses and fine dining restaurants in Lagos and Abuja. Pre-arranged wine pairings, discreet billing, and arrival coordination for your deal closings.",
        fields: [
            { kind: "chips", label: "ATMOSPHERE", options: ["Prime Steakhouse", "Fine Dining Continental", "Private Dining Room", "Exclusive Rooftop"] },
            { kind: "chips", label: "LOCATION", options: ["Abuja", "Lagos (Victoria Island)", "Lagos (Ikoyi)", "Lagos (Lekki)"] },
            { kind: "chips", label: "TIME OF RESERVATION", options: ["Lunch (12:30pm – 2:30pm)", "Early Dinner (6:30pm – 8:30pm)", "Prime Dinner (8:30pm – 10:30pm)", "Late Night VIP"] },
            { kind: "counter", label: "NUMBER OF GUESTS", min: 1, max: 20, step: 1, unit: "guests" },
            { kind: "date", label: "RESERVATION DATE" },
            { kind: "notes", label: "TABLE & DIETARY REQUESTS", placeholder: "Corner booth preference, sommelier consultation, client name, special vintage..." },
        ],
    },
    {
        tab: "leisure",
        title: "Championship Golf & Private Clubs",
        short: "Tee times, pro caddies & private country club guest privileges",
        tagline: "Walk the finest fairways.",
        heroImg: IMAGES.golf,
        full: "Secured tee times, club access, and VIP hospitality at the most prestigious golf courses in Nigeria. Professional caddie arrangements, premium equipment hire, and clubhouse dining privileges.",
        fields: [
            { kind: "chips", label: "GOLF CLUB", options: ["IBB International Golf Club (Abuja)", "Ikoyi Club 1938 (Lagos)", "Smokin Hills Golf Resort", "Other Private Club"] },
            { kind: "chips", label: "TEE TIME WINDOW", options: ["Early Morning (6:30am – 8:30am)", "Mid-Morning (9:00am – 11:00am)", "Afternoon (1:00pm – 3:30pm)"] },
            { kind: "counter", label: "NUMBER OF PLAYERS", min: 1, max: 4, step: 1, unit: "players" },
            { kind: "chips", label: "ADDITIONAL COORDINATION", options: ["Pro Caddie Allocation", "Golf Cart Rental", "Clubhouse Lunch / Dining", "Premium Club Hire"], multi: true },
            { kind: "date", label: "DATE OF PLAY" },
            { kind: "notes", label: "PLAYER HANDICAPS & NOTES", placeholder: "Handicaps of players, member guest coordination, post-round drinks..." },
        ],
    },
    {
        tab: "leisure",
        title: "Private Chef & Gourmet Tasting",
        short: "Michelin-level gastronomy, tasting menus & full service in-home",
        tagline: "The finest dining room is yours.",
        heroImg: IMAGES.chef,
        full: "Private culinary virtuosos deployed to your residence or penthouse for intimate dinner parties, multi-course tastings, or executive hosting. Full menu conceptualization, premium ingredient sourcing, wine pairing, and spotless cleanup included.",
        fields: [
            { kind: "chips", label: "CUISINE CONCEPT", options: ["Afro-Fusion Gourmet", "French Haute Cuisine", "Wagyu & Prime Grill", "Contemporary Italian", "Chef's Omakase"] },
            { kind: "chips", label: "OCCASION", options: ["Private Dinner Party", "Intimate Tasting", "Executive Business Dinner", "Celebration"] },
            { kind: "counter", label: "GUESTS", min: 2, max: 30, step: 1, unit: "guests" },
            { kind: "date", label: "EVENT DATE" },
            { kind: "notes", label: "MENU DETAILS & ALLERGIES", placeholder: "Number of courses (3, 5, or 7), wine pairings, dietary restrictions, favorite ingredients..." },
        ],
    },
];

const TABS: { id: Tab; label: string }[] = [
    { id: "style", label: "STYLE" },
    { id: "grooming", label: "GROOMING" },
    { id: "business", label: "BUSINESS" },
    { id: "leisure", label: "LEISURE" },
];

// ─── Field state helpers ───────────────────────────────────────────────────────

function initFieldState(fields: Field[]): Record<string, any> {
    const s: Record<string, any> = {};
    for (const f of fields) {
        if (f.kind === "chips") s[f.label] = f.multi ? [] : "";
        if (f.kind === "date") s[f.label] = "";
        if (f.kind === "counter") s[f.label] = f.min;
        if (f.kind === "notes") s[f.label] = "";
        if (f.kind === "location") s[f.label] = "";
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
    const BLUE = "#7a9ecb"; // Refined Steel/Slate Blue
    const s = useMemo(() => getStyles(C, theme, BLUE), [C, theme]);

    const [activeTab, setActiveTab] = useState<Tab>("style");
    const [modalVisible, setModalVisible] = useState(false);
    const [activeService, setActiveService] = useState<Service | null>(null);
    const [fieldState, setFieldState] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Date Picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentDateField, setCurrentDateField] = useState<string | null>(null);
    const [pickerDate, setPickerDate] = useState<Date>(new Date());

    const [userTier, setUserTier] = useState<string | null>(null);
    const [monthlyRequestsCount, setMonthlyRequestsCount] = useState(0);

    useEffect(() => {
        const loadUserTier = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

                const [{ data: profile }, { count }] = await Promise.all([
                    supabase.from("profiles").select("tier").eq("id", user.id).single(),
                    supabase.from("requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfMonth),
                ]);

                if (profile) setUserTier(profile.tier);
                setMonthlyRequestsCount(count ?? 0);
            }
        };
        loadUserTier();
    }, []);

    const isFreeUser = !userTier || !["silver", "gold", "black"].includes(userTier.toLowerCase());
    const limitReached = isFreeUser && monthlyRequestsCount >= 5;

    const tabServices = SERVICES.filter(sv => sv.tab === activeTab);

    // Open Modal
    const openService = (svc: Service) => {
        setActiveService(svc);
        setFieldState(initFieldState(svc.fields));
        setModalVisible(true);
    };

    // Close Modal cleanly without white flash
    // We delay unmounting activeService so the native iOS slide animation finishes over dark content
    const closeModal = () => {
        setModalVisible(false);
        setTimeout(() => {
            setActiveService(null);
        }, 400);
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

    // Date Picker trigger
    const openDatePicker = (fieldLabel: string) => {
        setCurrentDateField(fieldLabel);
        setPickerDate(new Date());
        setShowDatePicker(true);
    };

    const handleDateConfirm = (selectedDate: Date) => {
        if (currentDateField) {
            const formatted = selectedDate.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
            });
            setField(currentDateField, formatted);
        }
        setShowDatePicker(false);
    };

    const handleSubmit = async () => {
        if (limitReached) {
            Alert.alert("Limit Reached", "You've used all 5 of your monthly requests. Upgrade to Premium to continue.");
            return;
        }
        if (!activeService) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const notesField = activeService.fields.find(f => f.kind === "notes") as NotesField | undefined;
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
            notes: `[${activeService.title}] ${summary}${notes ? ` | Notes: ${notes}` : ""}`,
        });
        setLoading(false);
        if (error) { showToast(cleanErr(error), "error"); return; }
        closeModal();
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
                                    activeOpacity={0.7}
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
            const isZero = val === f.min && !!f.zeroLabel;
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
            const val = fieldState[f.label];
            return (
                <View key={f.label} style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <TouchableOpacity
                        style={[s.datePicker, !!val && s.datePickerActive]}
                        onPress={() => openDatePicker(f.label)}
                        activeOpacity={0.75}
                    >
                        <CalendarDays size={18} color={val ? BLUE : C.muted} />
                        <Text style={[s.dateText, !!val && { color: C.text, fontWeight: "600" }]}>
                            {val || "Select preferred date"}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (f.kind === "location") {
            if (!f.showWhen.oneOf.includes(fieldState[f.showWhen.field])) return null;
            return (
                <View key={f.label} style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <LocationSearch
                        value={fieldState[f.label] ?? ""}
                        onChangeText={v => setField(f.label, v)}
                        placeholder={f.placeholder}
                        accentColor={BLUE}
                    />
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
            {/* Hero Header */}
            <View style={s.hero}>
                <Image source={IMAGES.hero} style={s.heroImg} resizeMode="cover" />
                <View style={s.heroOverlay} />
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
                    <ChevronLeft size={22} color="#fff" />
                </TouchableOpacity>
                <View style={s.heroContent}>
                    <View style={s.heroBadge}>
                        <Sparkles size={11} color={BLUE} />
                        <Text style={s.heroBadgeText}>PRIVATE BESPOKE CONCIERGE</Text>
                    </View>
                    <Text style={s.heroTitle}>Gentlemen's{"\n"}Concierge</Text>
                    <Text style={s.heroSubtitle}>Tailoring · Horology · Executive Transit · Fine Living</Text>
                </View>
            </View>

            {/* Category Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
                {TABS.map(t => {
                    const active = activeTab === t.id;
                    return (
                        <TouchableOpacity
                            key={t.id}
                            style={[s.tab, active && s.tabActive]}
                            onPress={() => setActiveTab(t.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Service List with Luxury Photo Cards */}
            <ScrollView style={{ backgroundColor: C.background }} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
                {tabServices.map((svc) => (
                    <TouchableOpacity
                        key={svc.title}
                        style={s.serviceCard}
                        onPress={() => openService(svc)}
                        activeOpacity={0.88}
                    >
                        <View style={s.cardImageContainer}>
                            <Image source={svc.heroImg} style={s.cardImage} resizeMode="cover" />
                            <View style={s.cardImageOverlay} />
                            <View style={s.cardBadge}>
                                <Text style={s.cardBadgeText}>{svc.tagline}</Text>
                            </View>
                        </View>
                        <View style={s.cardBody}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={s.serviceTitle}>{svc.title}</Text>
                                <Text style={s.serviceShort} numberOfLines={2}>{svc.short}</Text>
                            </View>
                            <View style={s.cardActionBtn}>
                                <ChevronRight size={18} color="#ffffff" />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* ─── Service Detail Modal Sheet (Zero White Flash Guaranteed) ─────────── */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeModal}
                onDismiss={() => setActiveService(null)}
            >
                <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
                    {activeService && (
                        <View style={s.sheet}>
                            {/* Sheet Hero */}
                            <View style={s.sheetHero}>
                                <Image source={activeService.heroImg} style={s.sheetHeroImg} resizeMode="cover" />
                                <View style={s.sheetHeroOverlay} />
                                <TouchableOpacity style={s.sheetClose} onPress={closeModal} activeOpacity={0.8}>
                                    <X size={18} color="#fff" />
                                </TouchableOpacity>
                                <View style={s.sheetHeroContent}>
                                    <Text style={s.sheetEyebrow}>GENTLEMEN'S CONCIERGE</Text>
                                    <Text style={s.sheetTitle}>{activeService.title}</Text>
                                    <Text style={s.sheetTagline}>{activeService.tagline}</Text>
                                </View>
                            </View>

                            <KeyboardAwareScrollView
                                contentContainerStyle={s.sheetScroll}
                                enableOnAndroid
                                extraScrollHeight={24}
                                keyboardOpeningTime={0}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={s.sheetDesc}>{activeService.full}</Text>
                                <View style={s.divider} />

                                {activeService.fields.map(renderField)}

                                {isFreeUser && (
                                    <View style={{ marginVertical: 12 }}>
                                        <Text style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
                                            Community Plan · {monthlyRequestsCount}/5 monthly requests used
                                        </Text>
                                    </View>
                                )}

                                {limitReached ? (
                                    <View style={s.limitBox}>
                                        <Text style={s.limitTitle}>Monthly Limit Reached</Text>
                                        <Text style={s.limitText}>
                                            You've used all 5 of your monthly concierge requests. Upgrade to Lapeq Premium for unlimited access.
                                        </Text>
                                        <TouchableOpacity
                                            style={s.upgradeBtn}
                                            onPress={() => { closeModal(); router.push("/(main)/membership" as any); }}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={s.upgradeBtnText}>Upgrade to Premium</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[s.submitBtn, loading && { opacity: 0.6 }]}
                                        onPress={handleSubmit}
                                        disabled={loading}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={s.submitText}>{loading ? "Submitting Request..." : "Request Concierge Service"}</Text>
                                    </TouchableOpacity>
                                )}
                            </KeyboardAwareScrollView>
                        </View>
                    )}
                </View>
            </Modal>

            {/* ─── Native Date Picker Integration ───────────────────────────────────── */}
            {Platform.OS === "android" && showDatePicker && (
                <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(_, d) => {
                        setShowDatePicker(false);
                        if (d) handleDateConfirm(d);
                    }}
                />
            )}

            <Modal
                visible={Platform.OS === "ios" && showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={s.pickerBackdrop}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => setShowDatePicker(false)}
                    />
                    <View style={s.pickerSheet}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                <Text style={s.pickerCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={s.pickerTitleText}>Select Preferred Date</Text>
                            <TouchableOpacity onPress={() => handleDateConfirm(pickerDate)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                <Text style={s.pickerDoneText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={pickerDate}
                            mode="date"
                            display="spinner"
                            minimumDate={new Date()}
                            themeVariant="dark"
                            style={{ width: "100%", height: 216 }}
                            onChange={(_, d) => {
                                if (d) setPickerDate(d);
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* ─── Success Confirmation Modal ───────────────────────────────────────── */}
            <Modal visible={success} transparent animationType="fade">
                <View style={s.successOverlay}>
                    <View style={s.successBox}>
                        <CheckCircle2 size={50} color={BLUE} style={{ marginBottom: 16 }} />
                        <Text style={s.successTitle}>Concierge Request Logged</Text>
                        <Text style={s.successBody}>
                            Your dedicated private concierge has received your request and will reach out promptly with tailored arrangements.
                        </Text>
                        <TouchableOpacity style={s.successBtn} onPress={() => { setSuccess(false); router.push("/requests" as any); }} activeOpacity={0.85}>
                            <Text style={s.successBtnText}>View My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSuccess(false); router.back(); }} style={{ marginTop: 14 }}>
                            <Text style={{ color: C.muted, fontSize: 14, fontWeight: "600" }}>Done</Text>
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
    hero: { height: 320, position: "relative" },
    heroImg: { width: "100%", height: "100%", position: "absolute" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,12,16,0.65)" },
    backBtn: { position: "absolute", top: 52, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
    heroContent: { position: "absolute", bottom: 24, left: 20, right: 20 },
    heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(122,158,203,0.18)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "rgba(122,158,203,0.3)", marginBottom: 10 },
    heroBadgeText: { fontSize: 10, fontWeight: "800", color: BLUE, letterSpacing: 1.5 },
    heroTitle: { fontSize: 32, fontWeight: "800", color: "#ffffff", lineHeight: 38, letterSpacing: -0.5, marginBottom: 8 },
    heroSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500", letterSpacing: 0.2 },

    // Tabs
    tabBar: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, flexGrow: 0, backgroundColor: C.background },
    tabBarContent: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
    tab: { paddingVertical: 9, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    tabActive: { backgroundColor: BLUE, borderColor: BLUE },
    tabText: { fontSize: 12, fontWeight: "700", color: C.muted, letterSpacing: 1 },
    tabTextActive: { color: "#ffffff" },

    // List & Cards
    list: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 50, gap: 18 },
    serviceCard: {
        backgroundColor: C.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 3,
    },
    cardImageContainer: {
        height: 145,
        width: "100%",
        position: "relative",
    },
    cardImage: {
        width: "100%",
        height: "100%",
    },
    cardImageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.38)",
    },
    cardBadge: {
        position: "absolute",
        top: 14,
        left: 14,
        backgroundColor: "rgba(0,0,0,0.65)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
    },
    cardBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#ffffff",
        letterSpacing: 0.5,
    },
    cardBody: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: C.surface,
    },
    serviceTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: C.text,
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    serviceShort: {
        fontSize: 13,
        color: C.muted,
        lineHeight: 18,
    },
    cardActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: BLUE,
        alignItems: "center",
        justifyContent: "center",
    },

    // Sheet (Obsidian luxury theme, zero white flash)
    sheet: { flex: 1, backgroundColor: "#0a0a0a" },
    sheetHero: { height: 220, position: "relative" },
    sheetHeroImg: { width: "100%", height: "100%", position: "absolute" },
    sheetHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,12,16,0.7)" },
    sheetClose: { position: "absolute", top: 16, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
    sheetHeroContent: { position: "absolute", bottom: 20, left: 20, right: 20 },
    sheetEyebrow: { fontSize: 10, fontWeight: "800", color: BLUE, letterSpacing: 2, marginBottom: 4 },
    sheetTitle: { fontSize: 26, fontWeight: "800", color: "#ffffff", marginBottom: 4, letterSpacing: -0.3 },
    sheetTagline: { fontSize: 13, fontStyle: "italic", color: "rgba(255,255,255,0.75)" },
    sheetScroll: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 50, backgroundColor: "#0a0a0a" },
    sheetDesc: { fontSize: 14, color: "rgba(240,236,228,0.7)", lineHeight: 22, marginBottom: 20 },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 20 },

    // Fields
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 11, fontWeight: "800", color: "rgba(240,236,228,0.5)", letterSpacing: 1.5, marginBottom: 10 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100, backgroundColor: "#141414", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
    chipActive: { backgroundColor: `${BLUE}25`, borderColor: BLUE },
    chipText: { fontSize: 13, color: "rgba(240,236,228,0.65)", fontWeight: "500" },
    chipTextActive: { color: BLUE, fontWeight: "700" },
    counterRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    counterBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#141414", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
    counterVal: { fontSize: 17, fontWeight: "700", color: "#ffffff", minWidth: 120, textAlign: "center" },

    // Date Picker Input Button
    datePicker: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#141414",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
    },
    datePickerActive: {
        borderColor: `${BLUE}80`,
        backgroundColor: `${BLUE}10`,
    },
    dateText: { fontSize: 15, color: "rgba(240,236,228,0.4)" },

    // Submit
    submitBtn: { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 12 },
    submitText: { fontSize: 16, fontWeight: "800", color: "#ffffff", letterSpacing: 0.3 },

    // Monthly Limit Box
    limitBox: { borderRadius: 18, padding: 24, alignItems: "center", gap: 10, borderWidth: 1, borderColor: `${BLUE}40`, backgroundColor: `${BLUE}08`, marginTop: 12 },
    limitTitle: { fontSize: 15, fontWeight: "800", color: BLUE, letterSpacing: -0.2 },
    limitText: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },
    upgradeBtn: { marginTop: 6, backgroundColor: BLUE, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    upgradeBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

    // Date Picker Modal (iOS Sheet)
    pickerBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
    pickerSheet: { backgroundColor: "#141414", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
    pickerCancelText: { fontSize: 15, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
    pickerTitleText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
    pickerDoneText: { fontSize: 15, fontWeight: "800", color: BLUE },

    // Success Modal
    successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
    successBox: { width: "100%", backgroundColor: "#141414", borderRadius: 24, padding: 32, alignItems: "center", borderWidth: 1, borderColor: `${BLUE}60` },
    successTitle: { fontSize: 22, fontWeight: "800", color: "#ffffff", marginBottom: 10, textAlign: "center" },
    successBody: { fontSize: 14, color: "rgba(240,236,228,0.7)", textAlign: "center", lineHeight: 22, marginBottom: 28 },
    successBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: BLUE, alignItems: "center" },
    successBtnText: { fontSize: 15, fontWeight: "800", color: "#ffffff" },
});
