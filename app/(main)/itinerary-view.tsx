import { useState, useEffect, useRef } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, Animated, TextInput, Image, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Calendar, Clock, Check, X, Plus, ArrowLeft } from "lucide-react-native";
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
            <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 20 }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" }}>
                        <ChevronLeft size={20} color={C.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Itinerary</Text>
                </View>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: C.muted, fontSize: 14 }}>No active itinerary found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const activeDay = itinerary.days.find(d => d.id === selectedDayId);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
            {selectedDayId === null ? (
                /* TRIP INFO - FIRST LOOK (Days list) */
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" }}>
                            <ChevronLeft size={20} color={C.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: GOLD, letterSpacing: 2.5 }}>ITINERARY</Text>
                            <Text style={{ fontSize: 24, fontWeight: "800", color: C.text, letterSpacing: -0.5 }}>Trip Info</Text>
                        </View>
                        <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: `${GOLD}15`, alignItems: "center", justifyContent: "center" }}>
                            <Calendar size={16} color={GOLD} />
                        </View>
                    </View>

                    {requestTitle ? (
                        <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
                            <Text style={{ fontSize: 14, color: muted, fontWeight: "500" }}>{requestTitle}</Text>
                        </View>
                    ) : null}

                    {/* Scrollable list of Day Cards */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                        {itinerary.days.map((day) => {
                            const dateInfo = parseDateString(day.date);
                            const imgSource = dayImages[day.image || ""] ?? dayImages["scenery"];

                            return (
                                <TouchableOpacity
                                    key={day.id}
                                    onPress={() => setSelectedDayId(day.id)}
                                    activeOpacity={0.85}
                                    style={{
                                        flexDirection: "row",
                                        backgroundColor: surface,
                                        borderRadius: 16,
                                        marginBottom: 16,
                                        borderWidth: 1,
                                        borderColor: border,
                                        overflow: "hidden",
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: isDark ? 0.25 : 0.05,
                                        shadowRadius: 8,
                                        elevation: 2,
                                    }}
                                >
                                    {/* Left Side: Large Date box */}
                                    <View style={{
                                        width: 90,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        paddingVertical: 20,
                                        borderRightWidth: 1,
                                        borderRightColor: border,
                                        backgroundColor: isDark ? "#161920" : "#faf9f6"
                                    }}>
                                        {dateInfo.weekday ? (
                                            <Text style={{ fontSize: 12, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                                                {dateInfo.weekday}
                                            </Text>
                                        ) : null}
                                        <Text style={{ fontSize: dateInfo.day ? 14 : 11, fontWeight: "800", color: GOLD, marginVertical: 3, textTransform: "uppercase", textAlign: "center" }}>
                                            {dateInfo.month}
                                        </Text>
                                        {dateInfo.day ? (
                                            <Text style={{ fontSize: 26, fontWeight: "800", color: C.text }}>
                                                {dateInfo.day}
                                            </Text>
                                        ) : null}
                                    </View>

                                    {/* Right Side: Image background with overlay */}
                                    <View style={{ flex: 1, height: 110, position: "relative" }}>
                                        <Image
                                            source={imgSource}
                                            style={{ width: "100%", height: "100%" }}
                                            resizeMode="cover"
                                        />
                                        <View style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: "rgba(0,0,0,0.45)",
                                            padding: 16,
                                            justifyContent: "flex-end"
                                        }}>
                                            <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.3 }} numberOfLines={1}>
                                                {day.title}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
                                                {day.items.length} {day.items.length === 1 ? "activity" : "activities"} scheduled
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            ) : activeDay ? (
                /* DETAILED SCHEDULE VIEW (For active day) */
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
                        <TouchableOpacity onPress={() => setSelectedDayId(null)} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" }}>
                            <ArrowLeft size={18} color={C.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: GOLD, letterSpacing: 2.5 }}>SCHEDULE</Text>
                            <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }} numberOfLines={1}>
                                {activeDay.date}
                            </Text>
                        </View>
                    </View>

                    <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
                        <Text style={{ fontSize: 14, color: muted, fontWeight: "600" }}>{activeDay.title}</Text>
                    </View>

                    {/* Timeline list of items */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
                        {activeDay.items.map((item, index) => {
                            const isChecked = item.checked;
                            return (
                                <View key={item.id} style={{ flexDirection: "row", minHeight: 70 }}>
                                    {/* Timeline graphics */}
                                    <View style={{ width: 24, alignItems: "center" }}>
                                        <View style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 6,
                                            backgroundColor: isChecked ? "#10b981" : GOLD,
                                            borderWidth: 2,
                                            borderColor: surface,
                                            marginTop: 14,
                                            zIndex: 2
                                        }} />
                                        {index < activeDay.items.length - 1 && (
                                            <View style={{
                                                position: "absolute",
                                                top: 20,
                                                bottom: -15,
                                                width: 1.5,
                                                backgroundColor: isChecked ? "rgba(16,185,129,0.35)" : `${GOLD}30`,
                                                zIndex: 1
                                            }} />
                                        )}
                                    </View>

                                    {/* Event Card Content */}
                                    <View style={{ flex: 1, marginLeft: 12, marginBottom: 16 }}>
                                        <View style={{
                                            flexDirection: "row",
                                            backgroundColor: isChecked ? (isDark ? "#101d18" : "#f0fbf7") : surface,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: isChecked ? "rgba(16,185,129,0.25)" : border,
                                            padding: 14,
                                            alignItems: "center",
                                            gap: 12,
                                        }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                                                    <Text style={{ fontSize: 11, fontWeight: "800", color: isChecked ? "#10b981" : GOLD, letterSpacing: 0.5 }}>
                                                        {item.time}
                                                    </Text>
                                                    <Text style={{
                                                        fontSize: 14,
                                                        fontWeight: "700",
                                                        color: isChecked ? C.muted : C.text,
                                                        textDecorationLine: isChecked ? "line-through" : "none",
                                                        opacity: isChecked ? 0.75 : 1
                                                    }}>
                                                        {item.label}
                                                    </Text>
                                                </View>
                                                {item.description ? (
                                                    <Text style={{
                                                        fontSize: 12,
                                                        color: C.muted,
                                                        lineHeight: 18,
                                                        textDecorationLine: isChecked ? "line-through" : "none",
                                                        opacity: isChecked ? 0.6 : 1
                                                    }}>
                                                        {item.description}
                                                    </Text>
                                                ) : null}
                                            </View>

                                            {/* Action buttons (Check and Delete) */}
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                                <TouchableOpacity
                                                    onPress={() => toggleItemChecked(item.id)}
                                                    activeOpacity={0.7}
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 14,
                                                        borderWidth: 2,
                                                        borderColor: isChecked ? "#10b981" : GOLD,
                                                        backgroundColor: isChecked ? "#10b981" : "transparent",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    {isChecked ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => deleteActivity(activeDay.id, item.id)}
                                                    activeOpacity={0.7}
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 14,
                                                        borderWidth: 1,
                                                        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                                                        backgroundColor: isDark ? "#1c1f26" : "#f5f5f5",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <X size={12} color={muted} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}

                        {/* Add activity row */}
                        <View style={{ marginLeft: 36, marginTop: 10 }}>
                            <AddItemRow
                                onAdd={(val) => addCustomActivity(activeDay.id, val)}
                                isDark={isDark}
                                muted={muted}
                            />
                        </View>
                    </ScrollView>
                </View>
            ) : null}
        </SafeAreaView>
    );
}

// Separate Add Item helper
function AddItemRow({ onAdd, isDark, muted }: { onAdd: (t: string) => void; isDark: boolean; muted: string }) {
    const [text, setText] = useState("");
    const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const inputBg = isDark ? "#0d0f14" : "#f5f6f8";
    const textColor = isDark ? "#e8eaf0" : "#111318";

    const submit = () => {
        if (!text.trim()) return;
        onAdd(text.trim());
        setText("");
    };

    return (
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <TextInput
                style={{
                    flex: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: 13
                }}
                placeholder="Add custom activity..."
                placeholderTextColor={muted}
                value={text}
                onChangeText={setText}
                onSubmitEditing={submit}
                returnKeyType="done"
            />
            <TouchableOpacity
                onPress={submit}
                activeOpacity={0.7}
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: `${GOLD}20`,
                    borderWidth: 1,
                    borderColor: `${GOLD}50`,
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                <Plus size={16} color={GOLD} />
            </TouchableOpacity>
        </View>
    );
}
