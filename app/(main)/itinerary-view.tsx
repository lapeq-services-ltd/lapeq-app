import { useState, useEffect, useRef, useMemo } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, Animated, TextInput, Image, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Calendar, Clock, Check, X, Plus, ArrowLeft, MapPin, Coffee, Crown, Star, Car } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a84c";

interface ItineraryItem {
    id: string;
    time: string;
    label: string;
    description?: string;
    checked: boolean;
}

interface ItineraryDay {
    id: string;
    date: string; // e.g. "FRI JAN 17" or "2026-06-25"
    title: string;
    image?: string; // key of image to display
    items: ItineraryItem[];
}

interface Itinerary {
    days: ItineraryDay[];
}

// Local image registry mapping image key to local assets
const dayImages: Record<string, any> = {
    "card-1": require("@/assets/images/card-1.png"),
    "card-2": require("@/assets/images/card-2.png"),
    "card-3": require("@/assets/images/card-3.png"),
    "scenery": require("@/assets/images/beautiful-scenery.webp"),
    "hotel": require("@/assets/images/lagos-hotel.jpg"),
    "beach": require("@/assets/images/lagos-beach.jpg"),
    "restaurant": require("@/assets/images/lagos-restaurant.jpg"),
};

function guessCategory(title: string): string {
    const t = title.toLowerCase();
    if (t.includes("flight") || t.includes("transfer") || t.includes("airport") || t.includes("taxi") || t.includes("car hire") || t.includes("drive") || t.includes("chauffeur")) {
        return "travel";
    }
    if (t.includes("dinner") || t.includes("lunch") || t.includes("breakfast") || t.includes("dining") || t.includes("restaurant") || t.includes("food") || t.includes("sommelier") || t.includes("nok by alara")) {
        return "dining";
    }
    if (t.includes("club") || t.includes("bar") || t.includes("nightlife") || t.includes("lounge") || t.includes("vip evening") || t.includes("quilox") || t.includes("bottle service")) {
        return "nightlife";
    }
    if (t.includes("spa") || t.includes("treatment") || t.includes("art") || t.includes("gallery") || t.includes("tour") || t.includes("sightseeing") || t.includes("nike art")) {
        return "activity";
    }
    return "hotel";
}

function getCategoryIcon(category: string | undefined, title: string, color: string) {
    const cat = category || guessCategory(title);
    switch (cat) {
        case "dining": return <Coffee size={18} color={color} />;
        case "nightlife": return <Crown size={18} color={color} />;
        case "activity": return <Star size={18} color={color} />;
        case "travel": return <Car size={18} color={color} />;
        case "hotel":
        default:
            return <MapPin size={18} color={color} />;
    }
}

// Normalize legacy formats (weekday/weekend) to sequential day-by-day format
const normalizeItinerary = (data: any): ItineraryDay[] => {
    if (!data) return [];
    if (Array.isArray(data.days)) return data.days;

    const days: ItineraryDay[] = [];
    if (Array.isArray(data.weekday) && data.weekday.length > 0) {
        days.push({
            id: "weekday",
            date: "WEEKDAY SCHEDULE",
            title: "Weekday Coordinate",
            image: "card-1",
            items: data.weekday.flatMap((block: any, bi: number) => {
                const itemsList = Array.isArray(block.items) ? block.items : [];
                return itemsList.map((itemText: string, ii: number) => ({
                    id: `weekday-${bi}-${ii}`,
                    time: block.time || "All Day",
                    label: block.label || "Activity",
                    description: itemText,
                    checked: false,
                }));
            }),
        });
    }
    if (Array.isArray(data.weekend) && data.weekend.length > 0) {
        days.push({
            id: "weekend",
            date: "WEEKEND SCHEDULE",
            title: "Weekend Coordinate",
            image: "card-2",
            items: data.weekend.flatMap((block: any, bi: number) => {
                const itemsList = Array.isArray(block.items) ? block.items : [];
                return itemsList.map((itemText: string, ii: number) => ({
                    id: `weekend-${bi}-${ii}`,
                    time: block.time || "All Day",
                    label: block.label || "Activity",
                    description: itemText,
                    checked: false,
                }));
            }),
        });
    }
    return days;
};

// Robust date string parser to split "FRI JAN 17" or similar into weekday, month, day components
const parseDateString = (dateStr: string) => {
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length >= 3) {
        return {
            weekday: parts[0],
            month: parts[1],
            day: parts[2]
        };
    }
    return {
        weekday: "",
        month: dateStr,
        day: ""
    };
};

export default function ItineraryViewScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const { notifId } = useLocalSearchParams<{ notifId?: string }>();

    const [loading, setLoading] = useState(true);
    const [notificationData, setNotificationData] = useState<any>(null);
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [requestTitle, setRequestTitle] = useState("");
    const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
    const [pkgCity, setPkgCity] = useState("Lagos");
    const s = useMemo(() => getStyles(C), [C]);

    const surface = isDark ? "#111318" : "#fff";
    const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const muted = isDark ? "rgba(200,205,215,0.45)" : "rgba(17,19,24,0.45)";

    useEffect(() => {
        const load = async () => {
            if (!notifId) { setLoading(false); return; }
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("id", notifId)
                .single();

            if (error || !data) { setLoading(false); return; }
            const d = (data as any).data;
            setNotificationData(d);
            if (d?.requestTitle) setRequestTitle(d.requestTitle);
            if (d?.itinerary) {
                setItinerary({
                    days: normalizeItinerary(d.itinerary)
                });
            }
            
            // Dynamically load the city from the related request
            if (d?.requestId) {
                const { data: req } = await supabase
                    .from("requests")
                    .select("title, details")
                    .eq("id", d.requestId)
                    .single();
                if (req) {
                    const reqTitle = req.title || "";
                    if (reqTitle.toLowerCase().includes("abuja")) setPkgCity("Abuja");
                    else if (reqTitle.toLowerCase().includes("port harcourt")) setPkgCity("Port Harcourt");
                    else setPkgCity(req.details?.city || "Lagos");
                }
            }
            setLoading(false);
        };
        load();

        // Subscribe to real-time notification changes
        const subscription = supabase
            .channel(`notification-itinerary-${notifId}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "notifications", filter: `id=eq.${notifId}` },
                (payload) => {
                    const newPayload = payload.new as any;
                    const d = newPayload.data;
                    setNotificationData(d);
                    if (d?.requestTitle) setRequestTitle(d.requestTitle);
                    if (d?.itinerary) {
                        setItinerary({
                            days: normalizeItinerary(d.itinerary)
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [notifId]);

    // Handle checkmark toggle
    const toggleItemChecked = async (itemId: string) => {
        if (!itinerary || !notifId) return;
        const updatedDays = itinerary.days.map(day => ({
            ...day,
            items: day.items.map(item =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
            )
        }));

        const newItinerary = { ...itinerary, days: updatedDays };
        setItinerary(newItinerary);

        // Update database with latest itinerary representation
        await supabase
            .from("notifications")
            .update({
                data: {
                    ...notificationData,
                    itinerary: newItinerary
                }
            } as any)
            .eq("id", notifId);
    };

    // Add custom activity
    const addCustomActivity = async (dayId: string, label: string) => {
        if (!itinerary || !notifId || !label.trim()) return;
        const newItem: ItineraryItem = {
            id: `custom-${Date.now()}`,
            time: "Flexible",
            label: label.trim(),
            description: "Self-arranged",
            checked: false,
        };

        const updatedDays = itinerary.days.map(day => {
            if (day.id === dayId) {
                return { ...day, items: [...day.items, newItem] };
            }
            return day;
        });

        const newItinerary = { ...itinerary, days: updatedDays };
        setItinerary(newItinerary);

        await supabase
            .from("notifications")
            .update({
                data: {
                    ...notificationData,
                    itinerary: newItinerary
                }
            } as any)
            .eq("id", notifId);
    };

    // Delete activity
    const deleteActivity = async (dayId: string, itemId: string) => {
        if (!itinerary || !notifId) return;
        const updatedDays = itinerary.days.map(day => {
            if (day.id === dayId) {
                return { ...day, items: day.items.filter(item => item.id !== itemId) };
            }
            return day;
        });

        const newItinerary = { ...itinerary, days: updatedDays };
        setItinerary(newItinerary);

        await supabase
            .from("notifications")
            .update({
                data: {
                    ...notificationData,
                    itinerary: newItinerary
                }
            } as any)
            .eq("id", notifId);
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.background, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={GOLD} size="large" />
            </SafeAreaView>
        );
    }

    if (!itinerary || itinerary.days.length === 0) {
        return (
            <SafeAreaView style={s.root}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <ChevronLeft size={24} color={C.text} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Your Experience</Text>
                </View>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: C.muted, fontSize: 14 }}>No active itinerary found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Your Experience</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                {/* Horizontal City selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        {["Lagos", "Abuja", "Port Harcourt", "Akwa Ibom", "Kano"].map((city) => {
                            const isAvailable = city === "Lagos" || city === "Abuja" || city === "Port Harcourt";
                            const displayLabel = isAvailable ? city : `${city} (Soon)`;
                            const isActive = city.toLowerCase() === pkgCity.toLowerCase();
                            return (
                                <View key={city} style={[s.cityChip, isActive && s.cityChipActive]}>
                                    <Text style={[s.cityChipText, isActive && s.cityChipTextActive]}>{displayLabel}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>

                {itinerary.days.map((day, dayIndex) => (
                    <View key={day.id || dayIndex} style={{ marginBottom: 24 }}>
                        {/* Day header */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <View style={s.dayBadge}><Text style={s.dayNum}>{dayIndex + 1}</Text></View>
                            <Text style={s.dayTitle}>{day.date} -- {day.title}</Text>
                        </View>

                        {/* Day timeline items */}
                        <View style={s.timeline}>
                            {day.items.map((item, i) => {
                                const isChecked = item.checked;
                                const isVip = item.category === "nightlife" || !!item.badge?.toLowerCase().includes("priority") || !!item.badge?.toLowerCase().includes("vip");
                                const itemColor = isChecked ? "#10b981" : (isVip ? GOLD : C.text);

                                return (
                                    <View key={item.id || i} style={[s.timelineItem, isVip && s.timelineItemVip, { marginBottom: i === day.items.length - 1 ? 0 : 16 }]}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                            <View style={{ width: 24, alignItems: "center" }}>
                                                {getCategoryIcon(item.category, item.label, itemColor)}
                                            </View>
                                            <Text style={[s.itemTitle, isChecked && { textDecorationLine: "line-through", opacity: 0.6 }]}>{item.label}</Text>
                                            
                                            {/* Checked toggle button */}
                                            <TouchableOpacity
                                                onPress={() => toggleItemChecked(item.id)}
                                                activeOpacity={0.7}
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 12,
                                                    borderWidth: 2,
                                                    borderColor: isChecked ? "#10b981" : GOLD,
                                                    backgroundColor: isChecked ? "#10b981" : "transparent",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    marginLeft: "auto"
                                                }}
                                            >
                                                {isChecked ? <Check size={12} color="#fff" strokeWidth={3} /> : null}
                                            </TouchableOpacity>
                                        </View>
                                        
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 10 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                <Clock size={14} color={C.muted} />
                                                <Text style={s.itemMeta}>{item.time}</Text>
                                            </View>
                                            {item.rating && (
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                    <Star size={14} color={GOLD} fill={GOLD} />
                                                    <Text style={s.itemMeta}>{item.rating}</Text>
                                                </View>
                                            )}
                                            {isVip && item.badge && (
                                                <Text style={s.priorityBadge}>{item.badge}</Text>
                                            )}
                                        </View>

                                        {item.description ? (
                                            <Text style={[s.itemDesc, isChecked && { textDecorationLine: "line-through", opacity: 0.5 }]}>{item.description}</Text>
                                        ) : null}

                                        {item.badge && !isVip && (
                                            <View style={s.tagBadge}>
                                                <Text style={s.tagBadgeText}>{item.badge}</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* Concierge Note Card */}
                <View style={s.conciergeNote}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <Crown size={20} color={GOLD} />
                        <Text style={s.conciergeNoteTitle}>Everything Is Handled</Text>
                    </View>
                    <Text style={s.conciergeNoteBody}>
                        All reservations, car hire, and arrangements have been coordinated by your dedicated concierge. Costs are managed through your membership - no surprises, no hassle.
                    </Text>
                </View>

                {/* CTA Button */}
                <TouchableOpacity 
                    style={s.cta}
                    onPress={() => {
                        const requestId = notificationData?.requestId;
                        if (requestId) {
                            router.push({ pathname: "/chat", params: { mode: "concierge", packageId: requestId } });
                        } else {
                            router.push("/chat");
                        }
                    }}
                >
                    <Text style={s.ctaText}>Contact Concierge</Text>
                </TouchableOpacity>
                <Text style={s.ctaSub}>Available 24/7 for adjustments</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    cityChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: C.surface },
    cityChipActive: { backgroundColor: C.text },
    cityChipText: { fontSize: 15, fontWeight: "600", color: C.text },
    cityChipTextActive: { color: C.background },
    dayBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
    dayNum: { fontSize: 14, fontWeight: "700", color: "#000" },
    dayTitle: { fontSize: 18, fontWeight: "700", color: C.text },
    timeline: { marginLeft: 16, paddingLeft: 24, borderLeftWidth: 2, borderLeftColor: `${GOLD}33`, gap: 16, paddingBottom: 12 },
    timelineItem: { borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, padding: 16 },
    timelineItemVip: { borderColor: `${GOLD}4d`, backgroundColor: `${GOLD}0d` },
    itemTitle: { fontSize: 16, fontWeight: "600", color: C.text, flex: 1 },
    itemMeta: { fontSize: 13, color: C.muted, fontWeight: "500" },
    itemDesc: { fontSize: 13, color: C.muted, lineHeight: 20, marginTop: 4 },
    priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: `${GOLD}18`, fontSize: 11, fontWeight: "600", color: GOLD },
    tagBadge: { marginTop: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: `${GOLD}18`, alignSelf: "flex-start" },
    tagBadgeText: { fontSize: 11, fontWeight: "600", color: GOLD },
    conciergeNote: { borderRadius: 20, backgroundColor: C.surface, padding: 20, marginTop: 24, marginBottom: 24, borderLeftWidth: 3, borderLeftColor: GOLD, borderWidth: 1, borderColor: C.border },
    conciergeNoteTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    conciergeNoteBody: { fontSize: 14, color: C.muted, lineHeight: 22 },
    cta: { borderRadius: 20, paddingVertical: 18, backgroundColor: GOLD, alignItems: "center", marginBottom: 12 },
    ctaText: { fontSize: 18, fontWeight: "600", color: "#000" },
    ctaSub: { textAlign: "center", fontSize: 13, color: C.muted },
});
