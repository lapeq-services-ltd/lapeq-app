import { useState, useEffect, useRef } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Image, ActivityIndicator, Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ShieldCheck, Crown, Star, MessageCircle, Phone, CalendarDays, Clock, Bell } from "lucide-react-native";
import Svg, { Path, Circle } from "react-native-svg";

import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";

const scheduled = [
    { title: "Dinner at Nok by Alara", from: "Eko Hotel, VI", to: "Nok by Alara, Oniru", day: "Fri, Mar 20", time: "7:00 PM" },
    { title: "VIP Evening – Quilox", from: "Nok by Alara", to: "Quilox, Victoria Island", day: "Fri, Mar 20", time: "10:30 PM" },
    { title: "Nike Art Gallery Tour", from: "Eko Hotel, VI", to: "Nike Art Gallery, Lekki", day: "Sat, Mar 21", time: "9:30 AM" },
    { title: "Elegushi Beach Club", from: "Terra Kulture, VI", to: "Elegushi Beach, Lekki", day: "Sat, Mar 21", time: "3:30 PM" },
    { title: "Airport Departure", from: "Eko Hotel, VI", to: "Murtala Muhammed Intl.", day: "Sun, Mar 22", time: "11:00 AM" },
];

export default function CoordinationScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [loading, setLoading] = useState(true);
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [driver, setDriver] = useState<any>(null);
    const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState<"current" | "upcoming">("current");
    const [hasActiveRide, setHasActiveRide] = useState(false);
    const progressAnim = useRef(new Animated.Value(35)).current;
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!activeTrip?.pickup_location) {
            setPickupCoords(null);
            return;
        }

        let isMounted = true;
        async function geocode() {
            try {
                let addressQuery = activeTrip.pickup_location;
                // Clean up duplicate country strings
                addressQuery = addressQuery.replace(/,?\s*Nigeria,\s*Nigeria/i, ', Nigeria');
                
                const query = encodeURIComponent(addressQuery);
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
                    headers: { 'User-Agent': 'LapeqMobile/1.0' }
                });
                const data = await res.json();
                
                if (data && data.length > 0 && isMounted) {
                    setPickupCoords({
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon)
                    });
                } else if (isMounted) {
                    // Try fallback search with just the first two segments (e.g. "16 Karaye Street, Abuja")
                    const parts = addressQuery.split(',').map((p: string) => p.trim()).filter(Boolean);
                    if (parts.length > 1) {
                        const fallbackQuery = encodeURIComponent(parts.slice(0, 2).join(', '));
                        const fbRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${fallbackQuery}&format=json&limit=1`, {
                            headers: { 'User-Agent': 'LapeqMobile/1.0' }
                        });
                        const fbData = await fbRes.json();
                        if (fbData && fbData.length > 0 && isMounted) {
                            setPickupCoords({
                                lat: parseFloat(fbData[0].lat),
                                lng: parseFloat(fbData[0].lon)
                            });
                            return;
                        }
                    }
                    setPickupCoords(null);
                }
            } catch (err) {
                console.warn("Mobile geocoding failed:", err);
            }
        }

        geocode();
        return () => { isMounted = false; };
    }, [activeTrip?.pickup_location]);

    function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // km
    }

    const currentDistance = useMemo(() => {
        if (!pickupCoords || !driver?.latitude || !driver?.longitude) return null;
        return getDistance(pickupCoords.lat, pickupCoords.lng, driver.latitude, driver.longitude);
    }, [pickupCoords, driver?.latitude, driver?.longitude]);

    const dynamicETA = useMemo(() => {
        if (activeTrip?.driver_status === 'arrived') return 'Arrived';
        if (activeTrip?.driver_status === 'in_progress') return 'On Trip';
        if (activeTrip?.driver_status === 'assigned') return 'Assigned';
        if (currentDistance === null) {
            return activeTrip?.details?.pickupTime || '8 min';
        }
        const mins = Math.max(Math.round(currentDistance * 3.5), 2); // 3.5 mins per km in traffic, minimum 2 mins
        return `${mins} min`;
    }, [currentDistance, activeTrip?.driver_status, activeTrip?.details?.pickupTime]);

    // Trigger spring animation when the driver status/proximity changes
    useEffect(() => {
        let targetValue = 35;
        if (activeTrip) {
            const status = activeTrip.driver_status;
            if (status === "assigned") targetValue = 20;
            else if (status === "en_route") {
                if (currentDistance !== null) {
                    const pct = Math.max(0, Math.min(1, 1 - (currentDistance / 10)));
                    targetValue = 20 + Math.round(55 * pct);
                } else {
                    targetValue = 50;
                }
            }
            else if (status === "arrived") targetValue = 75;
            else if (status === "in_progress") targetValue = 90;
        } else {
            targetValue = 35;
        }

        Animated.spring(progressAnim, {
            toValue: targetValue,
            tension: 10,
            friction: 5,
            useNativeDriver: false
        }).start();
    }, [activeTrip?.driver_status, currentDistance]);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;                // 1. Fetch active trip (transport types: driving-service, logistics, driving)
                const { data: activeTrips } = await supabase
                    .from("requests")
                    .select("*, driver:profiles!requests_driver_id_fkey(id, full_name, preferred_name, phone, avatar_url, vehicle_details)")
                    .eq("user_id", user.id)
                    .in("service_type", ["driving", "driving-service", "logistics"])
                    .not("status", "in", '("completed","cancelled")')
                    .order("created_at", { ascending: false })
                    .limit(1);

                if (activeTrips && activeTrips.length > 0 && isMounted) {
                    const trip = activeTrips[0];
                    setActiveTrip(trip);
                    setHasActiveRide(true);
                    setDriver(trip.driver);
                } else if (isMounted) {
                    setHasActiveRide(false);
                    setActiveTrip(null);
                    setDriver(null);
                }

                // 2. Fetch upcoming scheduled trips
                const { data: upcoming } = await supabase
                    .from("requests")
                    .select("*")
                    .eq("user_id", user.id)
                    .in("service_type", ["driving", "driving-service", "logistics"])
                    .in("status", ["pending", "approved", "arranged"])
                    .order("scheduled_time", { ascending: true });

                if (upcoming && isMounted) {
                    // Filter out the active trip if it is also listed in upcoming
                    const filteredUpcoming = upcoming.filter(t => !activeTrips || activeTrips.length === 0 || t.id !== activeTrips[0].id);
                    setUpcomingTrips(filteredUpcoming);
                }

            } catch (err) {
                console.error("Failed to load coordination data:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadData();

        // Subscribe to real-time updates for requests and profile changes
        const requestsSubscription = supabase.channel('coordination-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
                loadData();
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(requestsSubscription);
        };
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={[s.root, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={C.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={32} color={C.cardFg} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Coordination</Text>
            </View>

            <View style={s.tabBar}>
                {(["current", "upcoming"] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[s.tab, activeTab === tab && s.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                            {tab === "current" ? "En Route" : "Scheduled"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                {activeTab === "current" ? (
                    hasActiveRide && activeTrip ? (
                        <>
                            <View style={s.etaCard}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <Text style={s.etaLabel}>
                                        {activeTrip.driver_status === 'arrived' ? 'Status' : 
                                         activeTrip.driver_status === 'in_progress' ? 'Status' : 'Arriving in'}
                                    </Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <ShieldCheck size={18} color={theme === 'dark' ? C.black : C.green} />
                                        <Text style={s.verifiedText}>Verified</Text>
                                    </View>
                                </View>
                                <Text style={s.etaTime}>
                                    {dynamicETA}
                                </Text>
                                <Text style={s.etaCar}>
                                    {currentDistance !== null ? `Chauffeur is ${currentDistance.toFixed(1)} km away` : 'Driver has been assigned'}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#6b6b6b', marginTop: 4, fontFamily: 'Jost_400Regular' }}>
                                    Vehicle: {activeTrip.details?.carDetails || 
                                             activeTrip.details?.car_details ||
                                             driver?.vehicle_details || 
                                             "Toyota Camry - Silver - LND 234 GH"}
                                </Text>
                                <View style={s.membershipTag}>
                                    <Crown size={16} color={theme === 'dark' ? C.black : C.primary} />
                                    <Text style={s.membershipTagText}>Included in your membership</Text>
                                </View>
                            </View>

                            <View style={{ marginBottom: 32 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={s.stopLabel}>Pickup</Text>
                                        <Text style={s.stopName} numberOfLines={2}>{activeTrip.pickup_location || 'Lekki Phase 1'}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: "flex-end", marginLeft: 8 }}>
                                        <Text style={s.stopLabel}>Destination</Text>
                                        <Text style={s.stopName} numberOfLines={2}>{activeTrip.dropoff_location || 'Destination'}</Text>
                                    </View>
                                </View>
                                <View style={{ position: "relative", marginBottom: 12 }}>
                                    <View style={s.trackBar}>
                                        <Animated.View style={[s.trackFill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }]} />
                                    </View>
                                    <Animated.View
                                        style={[
                                            s.carIconWrap,
                                            { left: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }
                                        ]}
                                    >
                                        <View style={s.carIconInner}>
                                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" color={C.black}>
                                                <Path d="M5 17h2m10 0h2M3 11l1.5-5.5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.5L21 11M3 11h18M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <Circle cx="7" cy="17" r="1.5" fill="currentColor" />
                                                <Circle cx="17" cy="17" r="1.5" fill="currentColor" />
                                            </Svg>
                                        </View>
                                    </Animated.View>
                                </View>
                                <View style={s.trackDots}>
                                    <View style={s.trackDotFilled} />
                                    <View style={s.trackLine} />
                                    <View style={s.trackDotEmpty} />
                                </View>
                            </View>

                            <View style={s.driverCard}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                                    <View style={s.driverAvatar}>
                                        <Text style={s.driverInitials}>
                                            {driver?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.driverName}>{driver?.full_name || 'Assigned Driver'}</Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <Star size={14} color={C.primary} fill={C.primary} />
                                            <Text style={s.driverRating}>{driver?.preferred_name ? '4.95' : '4.92'}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: "row", gap: 12 }}>
                                        <TouchableOpacity 
                                            style={s.driverActionSecondary}
                                            onPress={() => driver?.phone && Linking.openURL('sms:' + driver.phone)}
                                        >
                                            <MessageCircle size={24} color={C.cardFg} />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={s.driverActionPrimary}
                                            onPress={() => driver?.phone && Linking.openURL('tel:' + driver.phone)}
                                        >
                                            <Phone size={24} color={C.black} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <Text style={s.sectionTitle}>Updates</Text>
                            <View style={{ gap: 12, marginBottom: 20 }}>
                                {(() => {
                                    const ds = activeTrip.driver_status;
                                    const updatesList = [];
                                    
                                    if (ds === "in_progress") {
                                        updatesList.push({
                                            title: "Trip is underway",
                                            sub: "En route to " + (activeTrip.dropoff_location || "destination"),
                                            color: C.green,
                                            time: "Now"
                                        });
                                    }
                                    if (ds === "in_progress" || ds === "arrived") {
                                        updatesList.push({
                                            title: "Driver arrived at pickup",
                                            sub: driver?.full_name ? `${driver.full_name} is waiting for you` : "Driver is waiting at your location",
                                            color: ds === "arrived" ? C.green : "rgba(6,6,6,0.15)",
                                            time: ds === "arrived" ? "Now" : "Arrived"
                                        });
                                    }
                                    if (ds === "in_progress" || ds === "arrived" || ds === "en_route") {
                                        updatesList.push({
                                            title: "Driver en route to you",
                                            sub: driver?.full_name ? `${driver.full_name} is heading to your pickup location` : "Passing Admiralty Way",
                                            color: ds === "en_route" ? C.green : "rgba(6,6,6,0.15)",
                                            time: ds === "en_route" ? "Now" : "En Route"
                                        });
                                    }
                                    updatesList.push({
                                        title: "Chauffeur assigned",
                                        sub: driver?.full_name ? `${driver.full_name} has been assigned to your ride` : "A driver has been assigned to this trip",
                                        color: ds === "assigned" ? C.green : "rgba(6,6,6,0.15)",
                                        time: "Assigned"
                                    });
                                    updatesList.push({
                                        title: "Arrangement confirmed",
                                        sub: "Your concierge confirmed this transfer",
                                        color: !ds ? C.green : "rgba(6,6,6,0.15)",
                                        time: "2 min"
                                    });

                                    return updatesList.map((upd, idx) => (
                                        <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                                            <View style={[s.updateDot, { backgroundColor: upd.color }]} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={s.updateTitle}>{upd.title}</Text>
                                                <Text style={s.updateSub}>{upd.sub}</Text>
                                            </View>
                                            <Text style={s.updateTime}>{upd.time}</Text>
                                        </View>
                                    ));
                                })()}
                            </View>

                            <View style={s.safetyBox}>
                                <ShieldCheck size={28} color={C.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.safetyTitle}>Share trip details</Text>
                                    <Text style={s.safetySub}>Discreetly share your live location with someone you trust</Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        <View style={s.emptyStateContainer}>
                            <View style={s.emptyImageWrap}>
                                <Image
                                    source={{ uri: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80" }}
                                    style={s.emptyStateImage}
                                    resizeMode="cover"
                                />
                                <View style={s.emptyImageOverlay} />
                            </View>

                            <Text style={s.emptyStateTitle}>No active movements.</Text>
                            <Text style={s.emptyStateSub}>Your concierge is ready to arrange premium transportation safely and discreetly.</Text>

                            <TouchableOpacity style={s.bookRideBtn} onPress={() => router.push("/services/driving")}>
                                <Text style={s.bookRideBtnText}>Book a Ride</Text>
                            </TouchableOpacity>

                            <View style={s.notificationHint}>
                                <View style={s.notificationIconWrap}>
                                    <Bell size={18} color={C.primary} />
                                </View>
                                <Text style={s.notificationHintText}>You will be notified via Push Notification the moment your driver is en route or arrives.</Text>
                            </View>
                        </View>
                    )
                ) : (
                    <>
                        <View style={s.memberBanner}>
                            <Crown size={20} color={C.primary} />
                            <Text style={s.memberBannerText}><Text style={s.memberBannerBold}>All movements coordinated</Text> through your membership.</Text>
                        </View>
                        <View style={{ gap: 12 }}>
                            {upcomingTrips.length > 0 ? (
                                upcomingTrips.map((trip, i) => {
                                    const scheduledDate = trip.scheduled_time ? new Date(trip.scheduled_time) : new Date();
                                    const dayStr = scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                    const timeStr = scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    
                                    return (
                                        <TouchableOpacity key={i} style={s.tripCard}>
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                                <Text style={s.tripTitle}>{trip.title || (trip.service_type === 'driving-service' ? 'Chauffeur Ride' : 'Logistics Delivery')}</Text>
                                                <Text style={s.arrangedBadge}>{trip.status === 'arranged' ? 'Arranged' : trip.status}</Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                <CalendarDays size={16} color={C.muted} />
                                                <Text style={s.tripMeta}>{dayStr}</Text>
                                                <View style={{ width: 12 }} />
                                                <Clock size={16} color={C.muted} />
                                                <Text style={s.tripMeta}>{timeStr}</Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                                                <View style={{ alignItems: "center", gap: 2 }}>
                                                    <View style={s.routeDotFilled} />
                                                    <View style={s.routeLine} />
                                                    <View style={s.routeDotEmpty} />
                                                </View>
                                                <View style={{ gap: 8 }}>
                                                    <Text style={s.routeStop}>{trip.pickup_location || 'Lekki Phase 1'}</Text>
                                                    <Text style={s.routeStop}>{trip.dropoff_location || 'Destination'}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                                    <Text style={{ fontSize: 16, fontWeight: "600", color: C.text, marginBottom: 8 }}>No scheduled movements</Text>
                                    <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", paddingHorizontal: 20 }}>
                                        Any upcoming transfers booked through your concierge will be listed here.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text, flex: 1 },
    debugToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    debugToggleText: { fontSize: 11, fontWeight: "600", color: C.muted },
    tabBar: { flexDirection: "row", marginHorizontal: 20, padding: 6, backgroundColor: C.surface, borderRadius: 16, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
    tabActive: { backgroundColor: C.background, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 14, fontWeight: "600", color: C.muted },
    tabTextActive: { color: C.text },
    etaCard: { borderRadius: 20, backgroundColor: theme === 'dark' ? C.primary : C.black, padding: 24, marginBottom: 28 },
    etaLabel: { fontSize: 13, color: theme === 'dark' ? "rgba(0,0,0,0.6)" : "rgba(240,236,228,0.6)", textTransform: "uppercase", letterSpacing: 1 },
    verifiedText: { fontSize: 12, color: theme === 'dark' ? "rgba(0,0,0,0.8)" : C.green, fontWeight: "600" },
    etaTime: { fontSize: 48, fontWeight: "700", color: theme === 'dark' ? "#000000" : C.background, marginBottom: 8 },
    etaCar: { fontSize: 14, color: theme === 'dark' ? "rgba(0,0,0,0.5)" : "rgba(240,236,228,0.5)", marginBottom: 16 },
    membershipTag: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surface, alignSelf: "flex-start" },
    membershipTagText: { fontSize: 12, fontWeight: "600", color: theme === 'dark' ? C.black : C.primary },
    stopLabel: { fontSize: 12, color: C.muted },
    stopName: { fontSize: 15, fontWeight: "600", color: C.text, marginTop: 4 },
    trackBar: { height: 10, borderRadius: 5, backgroundColor: C.surface, overflow: "hidden" },
    trackFill: { height: "100%", backgroundColor: C.primary, borderRadius: 5 },
    carIconWrap: { position: "absolute", top: "50%", marginTop: -16, marginLeft: -16 },
    carIconInner: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
    trackDots: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
    trackDotFilled: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.primary },
    trackLine: { flex: 1, height: 1.5, borderStyle: "dashed", borderWidth: 1.5, borderColor: theme === 'dark' ? C.primary : C.border, marginHorizontal: 10 },
    trackDotEmpty: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: C.primary, backgroundColor: C.background },
    driverCard: { borderRadius: 20, borderWidth: 1, borderColor: theme === 'dark' ? C.primary : C.border, backgroundColor: C.background, padding: 20, marginBottom: 28 },
    driverAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    driverInitials: { fontSize: 18, fontWeight: "700", color: C.muted },
    driverName: { fontSize: 18, fontWeight: "600", color: C.text },
    driverRating: { fontSize: 14, fontWeight: "600", color: C.text },
    driverActionSecondary: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    driverActionPrimary: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: C.text, marginBottom: 16 },
    updateDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
    updateTitle: { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 2 },
    updateSub: { fontSize: 12, color: C.muted },
    updateTime: { fontSize: 12, color: C.muted, marginTop: 2 },
    safetyBox: { borderRadius: 16, backgroundColor: C.surface, padding: 16, flexDirection: "row", alignItems: "center", gap: 16 },
    safetyTitle: { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 2 },
    safetySub: { fontSize: 12, color: C.muted, lineHeight: 18 },
    memberBanner: { borderRadius: 16, backgroundColor: C.black, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
    memberBannerText: { fontSize: 14, color: theme === 'dark' ? "rgba(0,0,0,0.7)" : "rgba(240,236,228,0.7)", flex: 1, lineHeight: 20 },
    memberBannerBold: { fontWeight: "700", color: theme === 'dark' ? "#000000" : C.background },
    tripCard: { borderRadius: 20, borderWidth: 1, borderColor: theme === 'dark' ? C.primary : C.border, backgroundColor: C.background, padding: 20, marginBottom: 12 },
    tripTitle: { fontSize: 16, fontWeight: "600", color: C.text },
    arrangedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: C.surface, fontSize: 11, fontWeight: "600", color: C.primary },
    tripMeta: { fontSize: 13, color: C.muted, fontWeight: "500" },
    routeDotFilled: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
    routeLine: { width: 2, height: 16, backgroundColor: theme === 'dark' ? C.primary : C.border },
    routeDotEmpty: { width: 10, height: 10, borderRadius: 5, borderWidth: 2.5, borderColor: C.primary, backgroundColor: C.background },
    routeStop: { fontSize: 14, fontWeight: "500", color: C.text },
    emptyStateContainer: { alignItems: "center", paddingTop: 20 },
    emptyImageWrap: { width: "100%", height: 260, borderRadius: 24, overflow: "hidden", marginBottom: 28 },
    emptyStateImage: { width: "100%", height: "100%" },
    emptyImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme === 'dark' ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)" },
    emptyStateTitle: { fontSize: 22, fontWeight: "700", color: C.text, marginBottom: 12, textAlign: "center" },
    emptyStateSub: { fontSize: 15, color: C.muted, textAlign: "center", paddingHorizontal: 20, marginBottom: 32, lineHeight: 22 },
    bookRideBtn: { width: "100%", backgroundColor: C.black, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginBottom: 32 },
    bookRideBtnText: { color: C.cream, fontSize: 16, fontWeight: "700" },
    notificationHint: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: C.border },
    notificationIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    notificationHintText: { flex: 1, fontSize: 13, color: C.muted, lineHeight: 18 }
});
