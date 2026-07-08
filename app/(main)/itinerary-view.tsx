import { useState, useEffect, useRef, useMemo } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, Animated, TextInput, Image, StyleSheet, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Calendar, Clock, Check, X, Plus, ArrowLeft, MapPin, Coffee, Crown, Star, Car, Wallet, Lock } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { PayWithFlutterwave } from "flutterwave-react-native";

const GOLD = "#c9a84c";
const FLW_PUBLIC_KEY = process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? "";

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
    
    // New paywall & verification states
    const [request, setRequest] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [userEmail, setUserEmail] = useState("");
    const [userName, setUserName] = useState("");
    const [verifying, setVerifying] = useState(false);
    
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
            
            // Dynamically load request details, user profile, and city
            if (d?.requestId) {
                const { data: req } = await supabase
                    .from("requests")
                    .select("*")
                    .eq("id", d.requestId)
                    .single();
                if (req) {
                    setRequest(req);
                    const reqTitle = req.title || "";
                    if (reqTitle.toLowerCase().includes("abuja")) setPkgCity("Abuja");
                    else if (reqTitle.toLowerCase().includes("port harcourt")) setPkgCity("Port Harcourt");
                    else setPkgCity(req.details?.city || "Lagos");

                    if (req.user_id) {
                        const { data: prof } = await supabase
                            .from("profiles")
                            .select("*")
                            .eq("id", req.user_id)
                            .single();
                        if (prof) {
                            setProfile(prof);
                            setUserName(prof.full_name ?? "Member");
                            setUserEmail(prof.email ?? "");
                        }
                    }
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

    const verifyPayment = async (payload: {
        tx_ref: string;
        request_id: string;
        expected_amount: number;
        payment_type: "curation" | "option";
        option_title?: string;
    }) => {
        setVerifying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-payment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            const result = await res.json();
            if (!res.ok || !result.success) {
                Alert.alert(
                    "Verification Failed",
                    "Your payment was received but could not be verified automatically. Please contact support."
                );
                return null;
            }
            return result;
        } catch {
            Alert.alert(
                "Verification Error",
                "Could not reach our server to verify your payment."
            );
            return null;
        } finally {
            setVerifying(false);
        }
    };

    const handleCurationSuccess = () => {
        if (request) {
            setRequest({
                ...request,
                payment_status: "paid"
            });
        }
    };

    const handleOptionSuccess = async (opt: { title: string; price: number }) => {
        if (!request) return;
        const updatedDetails = {
            ...request.details,
            curated_options: {
                ...request.details.curated_options,
                selection: {
                    title: opt.title,
                    price: opt.price,
                    confirmed_at: new Date().toISOString()
                }
            }
        };
        setRequest({
            ...request,
            details: updatedDetails
        });
        await supabase
            .from("requests")
            .update({ details: updatedDetails })
            .eq("id", request.id);
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

    const userTier = (profile?.tier ?? "Standard").toLowerCase();
    const isPremium = ["silver", "gold", "black"].includes(userTier);
    const needsCurationFee = !isPremium && (request?.payment_status !== "paid");
    const hasCuratedOptions = !!request?.details?.curated_options;
    const hasSelectedOption = !!request?.details?.curated_options?.selection;
    const needsOptionPayment = hasCuratedOptions && !hasSelectedOption;
    const showPaywall = needsOptionPayment;

    const renderPaywall = () => {
        if (needsCurationFee) {
            return (
                <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 24 }}>
                    <View style={{ alignItems: "center", gap: 16 }}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${GOLD}15`, alignItems: "center", justifyContent: "center" }}>
                            <Lock size={28} color={GOLD} />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: C.text, textAlign: "center" }}>Unlock Your Custom Itinerary</Text>
                        <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 }}>
                            Standard community accounts require a one-time ₦5,000 curation fee to view their tailored schedule breakdown.
                        </Text>
                    </View>

                    <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 20, gap: 12 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: C.muted }}>Concierge Curation Fee</Text>
                            <Text style={{ fontSize: 22, fontWeight: "800", color: GOLD }}>₦5,000</Text>
                        </View>
                    </View>

                    {verifying ? (
                        <ActivityIndicator color={GOLD} size="small" />
                    ) : userEmail ? (
                        <PayWithFlutterwave
                            options={{
                                tx_ref: `CUR-${request.id.replace(/-/g, "").slice(0, 20)}`,
                                authorization: FLW_PUBLIC_KEY,
                                customer: { email: userEmail, name: userName },
                                amount: 5000,
                                currency: "NGN",
                                payment_options: "card,banktransfer,ussd",
                                customizations: {
                                    title: "Lapeq Curation Fee",
                                    description: "Unlock curated daily experience coordinates",
                                    logo: "https://iwedpnipbuurohaqibag.supabase.co/storage/v1/object/public/avatars/lapeq-logo.png",
                                },
                            }}
                            customButton={(props) => (
                                <TouchableOpacity
                                    onPress={props.onPress}
                                    disabled={props.disabled}
                                    style={{ backgroundColor: GOLD, paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
                                >
                                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#000" }}>Pay Curation Fee (₦5,000)</Text>
                                </TouchableOpacity>
                            )}
                            onRedirect={async (data) => {
                                if (data.status === "successful" || data.status === "completed") {
                                    const result = await verifyPayment({
                                        tx_ref: `CUR-${request.id.replace(/-/g, "").slice(0, 20)}`,
                                        request_id: request.id,
                                        expected_amount: 5000,
                                        payment_type: "curation",
                                    });
                                    if (result?.success) {
                                        handleCurationSuccess();
                                        Alert.alert("Success", "Curation fee paid successfully! Daily timeline coordinates are now unlocked.");
                                    }
                                }
                            }}
                        />
                    ) : (
                        <ActivityIndicator color={GOLD} size="small" />
                    )}
                </View>
            );
        }

        if (needsOptionPayment) {
            const recommended = request.details.curated_options.recommended;
            const suggestions = request.details.curated_options.suggestions || [];
            return (
                <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
                    <View style={{ alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${GOLD}15`, alignItems: "center", justifyContent: "center" }}>
                            <Wallet size={28} color={GOLD} />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: C.text, textAlign: "center" }}>Select Experience Option</Text>
                        <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 }}>
                            Select and confirm one of the custom options curated by your concierge to unlock your full itinerary schedule.
                        </Text>
                    </View>

                    {recommended && (
                        <View style={{ borderRadius: 24, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, overflow: "hidden" }}>
                            {recommended.image && (
                                <Image source={{ uri: recommended.image }} style={{ width: "100%", height: 140 }} resizeMode="cover" />
                            )}
                            <View style={{ padding: 20, gap: 12 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                    <View style={{ flex: 1, gap: 4 }}>
                                        <View style={{ alignSelf: "flex-start", backgroundColor: `${GOLD}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 9, fontWeight: "700", color: GOLD }}>RECOMMENDED</Text>
                                        </View>
                                        <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>{recommended.title}</Text>
                                    </View>
                                    <Text style={{ fontSize: 17, fontWeight: "800", color: GOLD }}>₦{Number(recommended.price).toLocaleString()}</Text>
                                </View>
                                {recommended.description && (
                                    <Text style={{ fontSize: 12, color: C.muted, lineHeight: 18 }}>{recommended.description}</Text>
                                )}
                                
                                {verifying ? (
                                    <ActivityIndicator size="small" color={GOLD} />
                                ) : userEmail ? (
                                    <PayWithFlutterwave
                                        options={{
                                            tx_ref: `OPT-${request.id.replace(/-/g, "").slice(0, 16)}-${recommended.title.replace(/\s+/g, "").slice(0, 4)}-${Date.now().toString().slice(-4)}`,
                                            authorization: FLW_PUBLIC_KEY,
                                            customer: { email: userEmail, name: userName },
                                            amount: Number(recommended.price),
                                            currency: "NGN",
                                            payment_options: "card,banktransfer,ussd",
                                            customizations: {
                                                title: recommended.title,
                                                description: `Confirm Booking: ${recommended.title}`,
                                                logo: "https://iwedpnipbuurohaqibag.supabase.co/storage/v1/object/public/avatars/lapeq-logo.png",
                                            },
                                        }}
                                        customButton={(props) => (
                                            <TouchableOpacity
                                                onPress={props.onPress}
                                                disabled={props.disabled}
                                                style={{ backgroundColor: GOLD, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
                                            >
                                                <Text style={{ fontSize: 13, fontWeight: "700", color: "#000" }}>Select & Pay Recommended</Text>
                                            </TouchableOpacity>
                                        )}
                                        onRedirect={async (data) => {
                                            if (data.status === "successful" || data.status === "completed") {
                                                const result = await verifyPayment({
                                                    tx_ref: `OPT-${request.id.replace(/-/g, "").slice(0, 16)}-${recommended.title.replace(/\s+/g, "").slice(0, 4)}-${Date.now().toString().slice(-4)}`,
                                                    request_id: request.id,
                                                    expected_amount: Number(recommended.price),
                                                    payment_type: "option",
                                                    option_title: recommended.title,
                                                });
                                                if (result?.success) {
                                                    await handleOptionSuccess({ title: recommended.title, price: Number(recommended.price) });
                                                    Alert.alert("Success", "Booking confirmed! Your schedule details are now unlocked.");
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <ActivityIndicator size="small" color={GOLD} />
                                )}
                            </View>
                        </View>
                    )}

                    {suggestions.length > 0 && (
                        <View style={{ gap: 10 }}>
                            <Text style={{ fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 1 }}>ALTERNATIVE OPTIONS</Text>
                            {suggestions.map((sug: any, idx: number) => (
                                <View key={idx} style={{ borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <View style={{ flex: 1, gap: 4 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>{sug.title}</Text>
                                            {sug.description && <Text style={{ fontSize: 11, color: C.muted }}>{sug.description}</Text>}
                                        </View>
                                        <Text style={{ fontSize: 15, fontWeight: "800", color: GOLD }}>₦{Number(sug.price).toLocaleString()}</Text>
                                    </View>

                                    {verifying ? (
                                        <ActivityIndicator size="small" color={GOLD} />
                                    ) : userEmail ? (
                                        <PayWithFlutterwave
                                            options={{
                                                tx_ref: `OPT-${request.id.replace(/-/g, "").slice(0, 16)}-${sug.title.replace(/\s+/g, "").slice(0, 4)}-${Date.now().toString().slice(-4)}`,
                                                authorization: FLW_PUBLIC_KEY,
                                                customer: { email: userEmail, name: userName },
                                                amount: Number(sug.price),
                                                currency: "NGN",
                                                payment_options: "card,banktransfer,ussd",
                                                customizations: {
                                                    title: sug.title,
                                                    description: `Confirm Booking: ${sug.title}`,
                                                    logo: "https://iwedpnipbuurohaqibag.supabase.co/storage/v1/object/public/avatars/lapeq-logo.png",
                                                },
                                            }}
                                            customButton={(props) => (
                                                <TouchableOpacity
                                                    onPress={props.onPress}
                                                    disabled={props.disabled}
                                                    style={{ backgroundColor: `${GOLD}20`, paddingVertical: 10, borderRadius: 10, alignItems: "center" }}
                                                >
                                                    <Text style={{ fontSize: 12, fontWeight: "700", color: GOLD }}>Select & Pay Option</Text>
                                                </TouchableOpacity>
                                            )}
                                            onRedirect={async (data) => {
                                                if (data.status === "successful" || data.status === "completed") {
                                                    const result = await verifyPayment({
                                                        tx_ref: `OPT-${request.id.replace(/-/g, "").slice(0, 16)}-${sug.title.replace(/\s+/g, "").slice(0, 4)}-${Date.now().toString().slice(-4)}`,
                                                        request_id: request.id,
                                                        expected_amount: Number(sug.price),
                                                        payment_type: "option",
                                                        option_title: sug.title,
                                                    });
                                                    if (result?.success) {
                                                        await handleOptionSuccess({ title: sug.title, price: Number(sug.price) });
                                                        Alert.alert("Success", "Booking confirmed! Your schedule details are now unlocked.");
                                                    }
                                                }
                                            }}
                                        />
                                    ) : (
                                        <ActivityIndicator size="small" color={GOLD} />
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            );
        }
        return null;
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Your Experience</Text>
            </View>

            {showPaywall ? (
                renderPaywall()
            ) : (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

                {needsCurationFee && (
                    <View style={{ marginBottom: 16, padding: 14, borderRadius: 16, backgroundColor: `${GOLD}12`, borderWidth: 1, borderColor: `${GOLD}30`, flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Lock size={16} color={GOLD} />
                        <Text style={{ fontSize: 12, color: GOLD, fontWeight: "600", flex: 1 }}>
                            Preview Mode · Pay the ₦5,000 curation fee to unlock the full itinerary schedule.
                        </Text>
                    </View>
                )}

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

                {(needsCurationFee ? itinerary.days.slice(0, 2) : itinerary.days).map((day, dayIndex) => (
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

                {needsCurationFee && (
                    <View style={{ marginTop: 8, marginBottom: 24, padding: 24, borderRadius: 24, backgroundColor: C.surface, borderWidth: 1, borderColor: `${GOLD}40`, alignItems: "center", gap: 12 }}>
                        <Lock size={26} color={GOLD} />
                        <Text style={{ fontSize: 16, fontWeight: "700", color: C.text, textAlign: "center" }}>Unlock Full Itinerary</Text>
                        <Text style={{ fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18 }}>
                            You are currently viewing a 2-day preview. Pay the ₦5,000 curation fee to unlock all remaining days and enable custom adjustments with your concierge.
                        </Text>
                        
                        {verifying ? (
                            <ActivityIndicator color={GOLD} size="small" style={{ marginTop: 8 }} />
                        ) : userEmail ? (
                            <PayWithFlutterwave
                                options={{
                                    tx_ref: `CUR-${request?.id?.replace(/-/g, "").slice(0, 20)}`,
                                    authorization: FLW_PUBLIC_KEY,
                                    customer: { email: userEmail, name: userName },
                                    amount: 5000,
                                    currency: "NGN",
                                    payment_options: "card,banktransfer,ussd",
                                    customizations: {
                                        title: "Lapeq Curation Fee",
                                        description: "Unlock curated daily experience coordinates",
                                        logo: "https://iwedpnipbuurohaqibag.supabase.co/storage/v1/object/public/avatars/lapeq-logo.png",
                                    },
                                }}
                                customButton={(props) => (
                                    <TouchableOpacity
                                        onPress={props.onPress}
                                        disabled={props.disabled}
                                        style={{ backgroundColor: GOLD, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: "100%", alignItems: "center", marginTop: 8 }}
                                    >
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#000" }}>Unlock All Days (₦5,000)</Text>
                                    </TouchableOpacity>
                                )}
                                onRedirect={async (data) => {
                                    if (data.status === "successful" || data.status === "completed") {
                                        const result = await verifyPayment({
                                            tx_ref: `CUR-${request?.id?.replace(/-/g, "").slice(0, 20)}`,
                                            request_id: request?.id,
                                            expected_amount: 5000,
                                            payment_type: "curation",
                                        });
                                        if (result?.success) {
                                            handleCurationSuccess();
                                            Alert.alert("Success", "Curation fee paid successfully! Daily timeline coordinates are now unlocked.");
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <ActivityIndicator color={GOLD} size="small" style={{ marginTop: 8 }} />
                        )}
                    </View>
                )}

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
                    style={[s.cta, needsCurationFee && { opacity: 0.6 }]}
                    onPress={() => {
                        if (needsCurationFee) {
                            Alert.alert("Curation Fee Required", "Please pay the curation fee to begin coordinating adjustments with your concierge.");
                            return;
                        }
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
            )}
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
