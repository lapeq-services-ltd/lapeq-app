import { useState, useEffect, useRef, useMemo } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, Animated, ActivityIndicator, Linking, Alert, AppState, useWindowDimensions, Modal, TextInput, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ShieldCheck, Crown, Star, MessageCircle, Phone, CalendarDays, Clock, Bell, MapPin, AlertTriangle, X, XCircle } from "lucide-react-native";
import Svg, { Path, Circle } from "react-native-svg";
import MapView, { Marker, Polyline } from "react-native-maps";

import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

const GOLD = "#C9A84C";

// OSRM/Nominatim are public community endpoints with no SLA — bound every call
// so a slow/unresponsive response can't hang geocoding or route-line fetches.
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

const CANCEL_REASONS = [
    "Chauffeur is taking too long",
    "My plans changed",
    "I no longer need this ride",
    "Booked by mistake",
    "Found another arrangement",
    "Other",
];

// Cycling "." / ".." / "..." suffix so a waiting state reads as live, not stalled.
function LoadingDots({ color }: { color: string }) {
    const [count, setCount] = useState(1);
    useEffect(() => {
        const id = setInterval(() => setCount(c => (c % 3) + 1), 450);
        return () => clearInterval(id);
    }, []);
    return <Text style={{ color }}>{".".repeat(count)}</Text>;
}

// Same car glyph used elsewhere in this screen — reused as the driver map marker so
// there's no emoji, just the app's own vector icon, tinted red to match the admin map.
function CarMarkerIcon({ color = "#ef4444" }: { color?: string }) {
    return (
        <View style={{
            width: 34, height: 34, borderRadius: 17, backgroundColor: color,
            alignItems: "center", justifyContent: "center",
            borderWidth: 3, borderColor: "#fff",
            shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6,
        }}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" color="#fff">
                <Path d="M5 17h2m10 0h2M3 11l1.5-5.5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.5L21 11M3 11h18M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx="7" cy="17" r="1.5" fill="currentColor" />
                <Circle cx="17" cy="17" r="1.5" fill="currentColor" />
            </Svg>
        </View>
    );
}

// Three dots bouncing in a staggered wave — no video/asset needed, pure Animated API.
function BouncingDots({ color = GOLD }: { color?: string }) {
    const anims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
    useEffect(() => {
        const loops = anims.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 150),
                    Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.delay((2 - i) * 150),
                ])
            )
        );
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, []);

    return (
        <View style={{ flexDirection: "row", gap: 8 }}>
            {anims.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={{
                        width: 10, height: 10, borderRadius: 5, backgroundColor: color,
                        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }],
                    }}
                />
            ))}
        </View>
    );
}

const LOCATING_MESSAGES = [
    "Locating your chauffeur…",
    "Fetching live position…",
    "Syncing GPS signal…",
    "Pinpointing their route…",
    "Almost there…",
    "Refining their location…",
    "Just a moment longer…",
];

function LocatingLoader() {
    const [msgIndex, setMsgIndex] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setMsgIndex(i => (i + 1) % LOCATING_MESSAGES.length), 2200);
        return () => clearInterval(id);
    }, []);
    return (
        <>
            <BouncingDots />
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 14 }}>{LOCATING_MESSAGES[msgIndex]}</Text>
        </>
    );
}

function PinMarker({ color }: { color: string }) {
    return (
        <View style={{
            width: 18, height: 18, borderRadius: 9, backgroundColor: color,
            borderWidth: 3, borderColor: "#fff",
            shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5,
        }} />
    );
}

// Live trip map — mirrors the admin dashboard's driver map: red car marker for the
// chauffeur, green pin for pickup, yellow pin for dropoff, and a live route line that
// re-fetches once the driver has moved a meaningful distance.
function TripMapView({
    height, driverLat, driverLng, pickupCoords, dropoffCoords, driverStatus,
}: {
    height: number;
    driverLat: number | null | undefined;
    driverLng: number | null | undefined;
    pickupCoords: { lat: number; lng: number } | null;
    dropoffCoords: { lat: number; lng: number } | null;
    driverStatus: string | null | undefined;
}) {
    const mapRef = useRef<MapView | null>(null);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
    const lastRouteFetchPos = useRef<{ lat: number; lng: number } | null>(null);
    const hasFitOnce = useRef(false);

    // If the driver's position hasn't come through at all after 20s, stop spinning
    // forever and tell the user something's actually wrong, with a way to retry.
    const [locateTimedOut, setLocateTimedOut] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    useEffect(() => {
        if (driverLat != null && driverLng != null) {
            setLocateTimedOut(false);
            return;
        }
        setLocateTimedOut(false);
        const timer = setTimeout(() => setLocateTimedOut(true), 20000);
        return () => clearTimeout(timer);
    }, [driverLat, driverLng, retryKey]);

    // While pre-pickup, route to the pickup point; once the trip is under way, route to the destination.
    const target = driverStatus === "in_progress" ? dropoffCoords : pickupCoords;

    function distMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    useEffect(() => {
        if (driverLat == null || driverLng == null || !target) return;

        const moved = !lastRouteFetchPos.current || distMeters(lastRouteFetchPos.current.lat, lastRouteFetchPos.current.lng, driverLat, driverLng) > 80;
        if (!moved) return;
        lastRouteFetchPos.current = { lat: driverLat, lng: driverLng };

        let isMounted = true;
        (async () => {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${driverLng},${driverLat};${target.lng},${target.lat}?overview=full&geometries=geojson`;
                const res = await fetchWithTimeout(url);
                const data = await res.json();
                if (!isMounted || data.code !== "Ok" || !data.routes?.length) return;
                const coords = data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => ({ latitude: lat, longitude: lng }));
                setRouteCoords(coords);
            } catch (err) {
                console.warn("Mobile route fetch failed:", err);
            }
        })();
        return () => { isMounted = false; };
    }, [driverLat, driverLng, target?.lat, target?.lng]);

    useEffect(() => {
        if (driverLat == null || driverLng == null || !mapRef.current) return;
        const points = [{ latitude: driverLat, longitude: driverLng }];
        if (target) points.push({ latitude: target.lat, longitude: target.lng });
        mapRef.current.fitToCoordinates(points, {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: hasFitOnce.current,
        });
        hasFitOnce.current = true;
    }, [driverLat, driverLng, target?.lat, target?.lng]);

    if (driverLat == null || driverLng == null) {
        if (locateTimedOut) {
            return (
                <View style={{ height, alignItems: "center", justifyContent: "center", backgroundColor: "#111", paddingHorizontal: 32 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(248,113,113,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                        <AlertTriangle size={20} color="#f87171" />
                    </View>
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: 6 }}>
                        Can't locate your chauffeur right now
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "center", marginBottom: 18, lineHeight: 18 }}>
                        Their connection may be weak, or the app in the background. Check your own internet connection, then try again, or use the call/message buttons below to reach them directly.
                    </Text>
                    <TouchableOpacity
                        onPress={() => setRetryKey(k => k + 1)}
                        style={{ paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12, backgroundColor: GOLD }}
                    >
                        <Text style={{ color: "#000", fontWeight: "700", fontSize: 13 }}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <View style={{ height, alignItems: "center", justifyContent: "center", backgroundColor: "#111" }}>
                <LocatingLoader />
            </View>
        );
    }

    return (
        <View style={{ height, width: "100%" }}>
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{ latitude: driverLat, longitude: driverLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            >
                {routeCoords.length > 0 && (
                    <Polyline coordinates={routeCoords} strokeColor={GOLD} strokeWidth={5} />
                )}
                <Marker coordinate={{ latitude: driverLat, longitude: driverLng }} anchor={{ x: 0.5, y: 0.5 }}>
                    <CarMarkerIcon />
                </Marker>
                {pickupCoords && (
                    <Marker coordinate={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }} anchor={{ x: 0.5, y: 0.5 }}>
                        <PinMarker color="#34d399" />
                    </Marker>
                )}
                {dropoffCoords && (
                    <Marker coordinate={{ latitude: dropoffCoords.lat, longitude: dropoffCoords.lng }} anchor={{ x: 0.5, y: 0.5 }}>
                        <PinMarker color="#eab308" />
                    </Marker>
                )}
            </MapView>
        </View>
    );
}

export default function CoordinationScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const [heroHeight, setHeroHeight] = useState(460);
    const [heroPage, setHeroPage] = useState(0);
    const heroScrollRef = useRef<ScrollView | null>(null);

    const [loading, setLoading] = useState(true);
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [driver, setDriver] = useState<any>(null);
    const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState<"current" | "upcoming">("current");
    const [hasActiveRide, setHasActiveRide] = useState(false);

    // A just-completed, unpaid trip — surfaced here since this is the screen the
    // client actually looks at, rather than only on the separate request detail page.
    const [unpaidTrip, setUnpaidTrip] = useState<any>(null);
    const [unpaidTripDriver, setUnpaidTripDriver] = useState<any>(null);

    // Cancel ride
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState<string | null>(null);
    const [otherCancelReason, setOtherCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);

    // Post-trip rating
    const [rateTrip, setRateTrip] = useState<any>(null);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [waitingSeconds, setWaitingSeconds] = useState(0);

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
                const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
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
                        const fbRes = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?q=${fallbackQuery}&format=json&limit=1`, {
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

    // Same geocoding as pickup, but for the destination — needed so the progress bar
    // can track real distance to the actual destination once the trip is underway.
    const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
    useEffect(() => {
        if (!activeTrip?.dropoff_location) {
            setDropoffCoords(null);
            return;
        }
        let isMounted = true;
        async function geocode() {
            try {
                const addressQuery = activeTrip.dropoff_location.replace(/,?\s*Nigeria,\s*Nigeria/i, ', Nigeria');
                const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&limit=1`, {
                    headers: { 'User-Agent': 'LapeqMobile/1.0' }
                });
                const data = await res.json();
                if (data && data.length > 0 && isMounted) {
                    setDropoffCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                } else if (isMounted) {
                    setDropoffCoords(null);
                }
            } catch (err) {
                console.warn("Destination geocoding failed:", err);
            }
        }
        geocode();
        return () => { isMounted = false; };
    }, [activeTrip?.dropoff_location]);

    const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

    const [trafficETA, setTrafficETA] = useState<string | null>(null);
    const [actualDistance, setActualDistance] = useState<number | null>(null);

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
        if (actualDistance !== null) return actualDistance;
        if (!pickupCoords || !driver?.latitude || !driver?.longitude) return null;
        return getDistance(pickupCoords.lat, pickupCoords.lng, driver.latitude, driver.longitude);
    }, [actualDistance, pickupCoords, driver?.latitude, driver?.longitude]);

    // Distance from the chauffeur's live position to the actual destination — only
    // meaningful once the trip is under way (driver_status === 'in_progress').
    const distanceToDestination = useMemo(() => {
        if (!dropoffCoords || !driver?.latitude || !driver?.longitude) return null;
        return getDistance(dropoffCoords.lat, dropoffCoords.lng, driver.latitude, driver.longitude);
    }, [dropoffCoords, driver?.latitude, driver?.longitude]);

    const dynamicETA = useMemo(() => {
        if (activeTrip?.driver_status === 'arrived') return 'Arrived';
        if (activeTrip?.driver_status === 'in_progress') return 'On Trip';
        if (activeTrip?.driver_status === 'en_route' && currentDistance === null) return 'On The Way';
        if (activeTrip?.driver_status === 'assigned') return 'Assigned';
        
        // Use Google Maps Traffic ETA if available
        if (trafficETA) return trafficETA;

        if (currentDistance === null) {
            return activeTrip?.details?.pickupTime || 'Pending';
        }
        const mins = Math.max(Math.round(currentDistance * 3.5), 2); // 3.5 mins per km fallback
        return `${mins} min`;
    }, [currentDistance, activeTrip?.driver_status, activeTrip?.details?.pickupTime, trafficETA]);

    // Fetch traffic-aware ETA from Google Maps Distance Matrix
    useEffect(() => {
        if (!driver?.latitude || !driver?.longitude || !pickupCoords || !GOOGLE_KEY) {
            setTrafficETA(null);
            setActualDistance(null);
            return;
        }
        const pc = pickupCoords;
        let isMounted = true;
        async function fetchTrafficETA() {
            try {
                const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${driver.latitude},${driver.longitude}&destinations=${pc.lat},${pc.lng}&key=${GOOGLE_KEY}`;
                const res = await fetch(url);
                const json = await res.json();
                if (isMounted && json.rows?.[0]?.elements?.[0]?.status === 'OK') {
                    const element = json.rows[0].elements[0];
                    const durationText = element.duration_in_traffic?.text || element.duration?.text || null;
                    const distanceKm = element.distance?.value ? (element.distance.value / 1000) : null;
                    
                    setTrafficETA(durationText);
                    if (distanceKm !== null) {
                        setActualDistance(distanceKm);
                    }
                }
            } catch (err) {
                console.warn("Traffic ETA fetch failed:", err);
            }
        }
        fetchTrafficETA();
        return () => { isMounted = false; };
    }, [driver?.latitude, driver?.longitude, pickupCoords]);

    // Real distance-to-destination the first time it's known after pickup — progress
    // is calculated relative to this, not a fixed guess, so it scales to the actual
    // trip length instead of an arbitrary number.
    const destinationDistanceBaseline = useRef<{ tripId: string; distanceKm: number } | null>(null);

    // This bar represents the PICKUP -> DESTINATION leg specifically. Before the
    // chauffeur actually picks the passenger up (assigned/en_route/arrived), that leg
    // hasn't started yet, so it stays flush at the pickup end rather than showing
    // partial "progress" toward a destination nobody has left for.
    useEffect(() => {
        let targetValue = 0;
        if (activeTrip && activeTrip.driver_status === "in_progress") {
            if (distanceToDestination !== null && destinationDistanceBaseline.current?.tripId !== activeTrip.id) {
                destinationDistanceBaseline.current = { tripId: activeTrip.id, distanceKm: distanceToDestination };
            }
            const baselineEntry = destinationDistanceBaseline.current;
            let baseline: number | null = null;
            if (baselineEntry && baselineEntry.tripId === activeTrip.id) {
                baseline = baselineEntry.distanceKm;
            }

            if (distanceToDestination !== null && baseline) {
                const pct = baseline > 0 ? Math.max(0, Math.min(1, 1 - (distanceToDestination / baseline))) : 1;
                targetValue = Math.round(100 * pct);
            } else {
                targetValue = 8; // trip started, destination distance not yet known — nudge off zero
            }
        } else {
            destinationDistanceBaseline.current = null;
        }

        Animated.spring(progressAnim, {
            toValue: targetValue,
            tension: 10,
            friction: 5,
            useNativeDriver: false
        }).start();
    }, [activeTrip?.driver_status, activeTrip?.id, distanceToDestination]);

    // Active waiting timer effect for arrived chauffeur (using server-provided tamper-proof timestamp)
    useEffect(() => {
        if (activeTrip?.driver_status !== 'arrived') {
            setWaitingSeconds(0);
            return;
        }
        const rawArrivedAt = activeTrip.details?.arrived_at;
        const arrivalTime = rawArrivedAt ? new Date(rawArrivedAt).getTime() : new Date(activeTrip.updated_at || new Date()).getTime();
        
        const updateTimer = () => {
            const elapsed = Math.max(0, Math.floor((Date.now() - arrivalTime) / 1000));
            setWaitingSeconds(elapsed);
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeTrip?.driver_status, activeTrip?.details?.arrived_at, activeTrip?.updated_at]);

    // Subscribe to driver location real-time broadcast channel
    useEffect(() => {
        if (!activeTrip?.driver_id) return;
        
        const channel = supabase.channel(`driver-location:${activeTrip.driver_id}`, {
            config: { broadcast: { ack: false }, private: true }
        });
        
        channel.on('broadcast', { event: 'location-update' }, (payload) => {
            const { latitude, longitude } = payload.payload;
            if (latitude && longitude) {
                setDriver((prev: any) => {
                    if (!prev) return prev;
                    return { ...prev, latitude, longitude };
                });
            }
        });
        
        channel.subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeTrip?.driver_id]);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                // 1. Fetch every non-completed/cancelled trip, then pick which one is
                // actually "current" — a trip already assigned/en route/etc. must win
                // over a brand-new request that hasn't been touched yet, regardless of
                // which was created more recently. Everything else goes to Upcoming.
                const { data: allTrips, error: tripErr } = await supabase
                    .from("requests")
                    .select("*")
                    .eq("user_id", user.id)
                    .in("service_type", ["driving", "driving-service", "logistics"])
                    .not("status", "in", '("completed","cancelled")')
                    .order("created_at", { ascending: false });

                if (tripErr) console.warn("[Coordination] trip fetch error:", tripErr.message);

                // Abandoned rides are now genuinely resolved server-side (see
                // supabase/24_auto_resolve_stale_rides.sql), so this can just trust
                // `status` directly instead of second-guessing it on the client.
                const DRIVER_STATUS_RANK: Record<string, number> = {
                    en_route: 2, arrived: 2, in_progress: 2,
                    assigned: 1,
                };
                const trip = allTrips && allTrips.length > 0
                    ? [...allTrips].sort((a, b) => {
                        const ra = DRIVER_STATUS_RANK[a.driver_status ?? ""] ?? 0;
                        const rb = DRIVER_STATUS_RANK[b.driver_status ?? ""] ?? 0;
                        if (ra !== rb) return rb - ra;
                        // Tie (both same rank, e.g. both untouched pending) — whichever was
                        // submitted first is "current"; newer ones wait in Upcoming.
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    })[0]
                    : null;

                if (trip && isMounted) {
                    setActiveTrip(trip);
                    setHasActiveRide(true);

                    // Fetch driver profile separately so a bad join can't kill the whole query
                    if (trip.driver_id) {
                        const { data: driverProfile } = await supabase
                            .from("profiles")
                            .select("id, full_name, preferred_name, phone, avatar_url, vehicle_details, latitude, longitude")
                            .eq("id", trip.driver_id)
                            .single();
                        if (isMounted) setDriver(driverProfile ?? null);
                    } else {
                        if (isMounted) setDriver(null);
                    }
                } else if (isMounted) {
                    setHasActiveRide(false);
                    setActiveTrip(null);
                    setDriver(null);
                }

                // 2. Everything else non-completed/cancelled — including a different
                // trip that's already been assigned a driver but isn't "current" — goes
                // to Upcoming instead of disappearing.
                if (isMounted) {
                    const upcoming = (allTrips ?? [])
                        .filter(t => !trip || t.id !== trip.id)
                        .sort((a, b) => {
                            const at = a.scheduled_time ? new Date(a.scheduled_time).getTime() : new Date(a.created_at).getTime();
                            const bt = b.scheduled_time ? new Date(b.scheduled_time).getTime() : new Date(b.created_at).getTime();
                            return at - bt;
                        });
                    setUpcomingTrips(upcoming);
                }

                // 3. Fetch any unpaid completed fare — folded into this same loadData
                // (rather than a separate hasActiveRide-keyed effect) so it recomputes
                // on every trip change, not just when "does an active ride exist" flips.
                // Otherwise finishing trip A while trip B is already assigned leaves
                // hasActiveRide === true throughout, and the payment prompt never refires.
                const { data: unpaid } = await supabase
                    .from("requests")
                    .select("id, reference, driver_id, quoted_fare, surcharge_amount, updated_at")
                    .eq("user_id", user.id)
                    .in("service_type", ["driving", "driving-service", "logistics"])
                    .eq("status", "completed")
                    .not("quoted_fare", "is", null)
                    // payment_status is NULL until a payment is ever attempted — plain
                    // .neq("payment_status","paid") silently excludes NULL rows (SQL's
                    // three-valued logic: NULL <> 'paid' is unknown, not true), so every
                    // never-yet-paid trip was invisible to this query. NULL must count as unpaid.
                    .or("payment_status.is.null,payment_status.neq.paid")
                    .order("updated_at", { ascending: false })
                    .limit(1);

                if (isMounted) {
                    const unpaidTripRow = unpaid && unpaid.length > 0 ? unpaid[0] : null;
                    setUnpaidTrip(unpaidTripRow);
                    if (unpaidTripRow?.driver_id) {
                        const { data: unpaidDriverProfile } = await supabase
                            .from("profiles")
                            .select("id, full_name, preferred_name, phone, avatar_url, vehicle_details")
                            .eq("id", unpaidTripRow.driver_id)
                            .single();
                        if (isMounted) setUnpaidTripDriver(unpaidDriverProfile ?? null);
                    } else {
                        setUnpaidTripDriver(null);
                    }
                }

            } catch (err) {
                console.error("Failed to load coordination data:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadData();

        // Fallback polling of driver coordinates (throttled to 20s as we have high-frequency broadcast)
        const pollInterval = setInterval(() => { loadData(); }, 20000);

        // Reload when app comes back to foreground (catches stale state after background)
        const appStateSub = AppState.addEventListener('change', (state) => {
            if (state === 'active') loadData();
        });

        // Subscribe to real-time updates for requests and profile changes.
        // Driver-status alerts (en route / arrived / in progress / completed) are now
        // handled globally via a real push notification + blocking alert wired in
        // app/_layout.tsx (type: "trip_status") — that fires on every screen, not just
        // this one, so this screen only needs to refresh its own data on change.
        const requestsSubscription = supabase.channel('coordination-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
                loadData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                loadData();
            })
            .subscribe();

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            appStateSub.remove();
            supabase.removeChannel(requestsSubscription);
        };
    }, []);

    async function confirmCancelRide() {
        if (!activeTrip || !cancelReason) return;
        const reason = cancelReason === "Other" ? (otherCancelReason.trim() || "Other") : cancelReason;
        setCancelling(true);
        const { error } = await supabase
            .from("requests")
            .update({ status: "cancelled", driver_status: null, cancellation_reason: reason, cancelled_by: "client" })
            .eq("id", activeTrip.id);
        setCancelling(false);
        if (error) {
            Alert.alert("Couldn't Cancel", error.message);
            return;
        }
        setShowCancelModal(false);
        setCancelReason(null);
        setOtherCancelReason("");
        setActiveTrip(null);
        setHasActiveRide(false);
    }

    // Prompt for a rating once, shortly after a trip completes.
    useEffect(() => {
        let isMounted = true;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("requests")
                .select("id, reference, updated_at")
                .eq("user_id", user.id)
                .in("service_type", ["driving", "driving-service", "logistics"])
                .eq("status", "completed")
                .is("rating", null)
                .order("updated_at", { ascending: false })
                .limit(1);
            if (!isMounted || !data || data.length === 0) return;
            const trip = data[0];
            const completedRecently = Date.now() - new Date(trip.updated_at).getTime() < 48 * 3600 * 1000;
            if (completedRecently) setRateTrip(trip);
        })();
        return () => { isMounted = false; };
    }, []);

    async function submitRating() {
        if (!rateTrip || ratingValue === 0) return;
        setSubmittingRating(true);
        const { error } = await supabase
            .from("requests")
            .update({ rating: ratingValue, rating_comment: ratingComment.trim() || null })
            .eq("id", rateTrip.id);
        setSubmittingRating(false);
        if (error) {
            Alert.alert("Couldn't Submit Rating", error.message);
            return;
        }
        setRateTrip(null);
        setRatingValue(0);
        setRatingComment("");
    }

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.background, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={GOLD} />
            </SafeAreaView>
        );
    }

    const ds = activeTrip?.driver_status;
    const isArrived = ds === "arrived";
    const isInProgress = ds === "in_progress";
    const isEnRoute = ds === "en_route";

    const statusLabel =
        isInProgress ? "Trip in Progress" :
        isArrived    ? "Chauffeur Arrived" :
        isEnRoute    ? "On The Way" :
        ds === "assigned" ? "Chauffeur Assigned" :
        "Awaiting Assignment";

    const statusColor = isInProgress || isArrived ? "#34d399" : GOLD;

    // A driver truly moving/with her takes priority over anything else. But if the
    // "active" trip is merely a *future* one that's only been assigned (not yet
    // dispatched), an unpaid fare from the trip she just finished is more urgent —
    // otherwise this screen jumps straight to the next assignment and the payment
    // prompt is never seen.
    const hasLiveDriver = isEnRoute || isArrived || isInProgress;
    const showUnpaidFirst = !!unpaidTrip && !hasLiveDriver;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, gap: 14 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border }}
                >
                    <ChevronLeft size={20} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, fontWeight: "700", color: GOLD, letterSpacing: 2.5, marginBottom: 2 }}>MOBILITY</Text>
                    <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, letterSpacing: -0.3 }}>Elite Transit</Text>
                </View>
                {/* tab pills */}
                <View style={{ flexDirection: "row", backgroundColor: C.surface, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: C.border }}>
                    {(["current", "upcoming"] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, backgroundColor: activeTab === tab ? GOLD : "transparent" }}
                        >
                            <Text style={{ fontSize: 11, fontWeight: "700", color: activeTab === tab ? "#000" : C.muted }}>
                                {tab === "current" ? "Live" : "Upcoming"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
                {activeTab === "current" ? (
                    showUnpaidFirst ? (
                        /* ── TRIP COMPLETE, UNPAID FARE (takes priority over a next trip that's merely assigned) ── */
                        <View style={{ backgroundColor: "#0a0a0a", borderRadius: 24, padding: 24, marginBottom: 16 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#34d399" }} />
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#34d399", letterSpacing: 1.5, textTransform: "uppercase" }}>Trip Complete</Text>
                            </View>

                            {unpaidTripDriver && (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" }}>
                                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${GOLD}15`, borderWidth: 1.5, borderColor: `${GOLD}30`, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                        {unpaidTripDriver.avatar_url ? (
                                            <Image source={{ uri: unpaidTripDriver.avatar_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                                        ) : (
                                            <Text style={{ fontSize: 16, fontWeight: "700", color: GOLD }}>
                                                {unpaidTripDriver.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{unpaidTripDriver.full_name || "Your Chauffeur"}</Text>
                                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{unpaidTripDriver.vehicle_details || "Thanks for riding with LAPEQ"}</Text>
                                    </View>
                                </View>
                            )}

                            <View style={{ gap: 6, marginBottom: 18 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Ride fare</Text>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>₦{Number(unpaidTrip.quoted_fare || 0).toLocaleString()}</Text>
                                </View>
                                {!!unpaidTrip.surcharge_amount && unpaidTrip.surcharge_amount > 0 && (
                                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Waiting surcharge</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>₦{Number(unpaidTrip.surcharge_amount).toLocaleString()}</Text>
                                    </View>
                                )}
                                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" }}>
                                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Total Due</Text>
                                    <Text style={{ fontSize: 22, fontWeight: "800", color: GOLD }}>
                                        ₦{(Number(unpaidTrip.quoted_fare || 0) + Number(unpaidTrip.surcharge_amount || 0)).toLocaleString()}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => router.push(`/requests/${unpaidTrip.id}`)}
                                style={{ backgroundColor: GOLD, paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
                                activeOpacity={0.85}
                            >
                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#000" }}>Pay Ride Fare</Text>
                            </TouchableOpacity>

                        </View>
                    ) : hasActiveRide && activeTrip ? (
                        <>
                            {/* ── HERO ETA CARD (swipe left for map) ── */}
                            <View style={{ borderRadius: 28, overflow: "hidden", marginBottom: 16, position: "relative" }}>
                            <View pointerEvents="none" style={{ position: "absolute", bottom: 10, alignSelf: "center", zIndex: 10, flexDirection: "row", gap: 5 }}>
                                {[0, 1].map(i => (
                                    <View key={i} style={{
                                        width: heroPage === i ? 14 : 5, height: 5, borderRadius: 3,
                                        backgroundColor: heroPage === i ? GOLD : "rgba(255,255,255,0.35)",
                                    }} />
                                ))}
                            </View>
                            <ScrollView
                                ref={heroScrollRef}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                style={{ height: heroHeight }}
                                contentContainerStyle={{ alignItems: "flex-start" }}
                                onMomentumScrollEnd={(e) => setHeroPage(Math.round(e.nativeEvent.contentOffset.x / (windowWidth - 40)))}
                            >
                            <View style={{ width: windowWidth - 40 }} onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}>
                                <View style={{ backgroundColor: "#0a0a0a", padding: 28 }}>
                                    {/* Live dot + status */}
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
                                        <Text style={{ fontSize: 11, fontWeight: "700", color: statusColor, letterSpacing: 1.5, textTransform: "uppercase" }}>
                                            {statusLabel}
                                        </Text>
                                    </View>

                                    {/* ETA number */}
                                    <Text
                                        style={{ fontSize: 44, fontWeight: "800", color: "#ffffff", letterSpacing: -1, lineHeight: 48, marginBottom: 6 }}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.6}
                                    >
                                        {dynamicETA}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
                                        {isInProgress
                                            ? (distanceToDestination !== null
                                                ? `${distanceToDestination.toFixed(1)} km to your destination`
                                                : "En route to your destination")
                                            : currentDistance !== null
                                            ? `${currentDistance.toFixed(1)} km from your pickup`
                                            : isEnRoute ? <>Chauffeur is heading to you<LoadingDots color="rgba(255,255,255,0.4)" /></>
                                            : isArrived ? "Outside your pickup location"
                                            : "Your chauffeur has been assigned"}
                                    </Text>

                                    {/* Vehicle */}
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 18, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" }}>
                                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${GOLD}18`, alignItems: "center", justifyContent: "center" }}>
                                            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" color={GOLD}>
                                                <Path d="M5 17h2m10 0h2M3 11l1.5-5.5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.5L21 11M3 11h18M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <Circle cx="7" cy="17" r="1.5" fill="currentColor" />
                                                <Circle cx="17" cy="17" r="1.5" fill="currentColor" />
                                            </Svg>
                                        </View>
                                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", flex: 1 }} numberOfLines={1}>
                                            {activeTrip.details?.carDetails || activeTrip.details?.car_details || driver?.vehicle_details || "Vehicle details not set"}
                                        </Text>
                                    </View>

                                    {/* Fare — shown as soon as staff sets it, not just after the trip ends */}
                                    {!!activeTrip.quoted_fare && (
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14 }}>
                                            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Ride Fare</Text>
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: GOLD }}>₦{Number(activeTrip.quoted_fare).toLocaleString()}</Text>
                                        </View>
                                    )}

                                    {/* Arrived waiting timer */}
                                    {isArrived && (
                                        <View style={{ marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "rgba(52,211,153,0.08)", borderWidth: 1, borderColor: "rgba(52,211,153,0.2)" }}>
                                            <Text style={{ fontSize: 13, color: "#34d399", fontWeight: "700", marginBottom: 4 }}>
                                                Chauffeur waiting outside
                                            </Text>
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                                <Text style={{ fontSize: 12, color: "rgba(52,211,153,0.7)" }}>
                                                    {Math.floor(waitingSeconds / 60)}m {waitingSeconds % 60}s
                                                </Text>
                                                {waitingSeconds >= 600 && (
                                                    <Text style={{ fontSize: 12, color: GOLD, fontWeight: "600" }}>
                                                        +₦{Number(Math.floor(waitingSeconds / 600) * 3000).toLocaleString()} surcharge
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Progress track at bottom of hero */}
                                <View style={{ backgroundColor: "#111", paddingHorizontal: 20, paddingVertical: 16 }}>
                                    <View style={{ position: "relative", marginBottom: 10 }}>
                                        <View style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)" }}>
                                            <Animated.View style={{
                                                height: "100%",
                                                borderRadius: 2,
                                                backgroundColor: GOLD,
                                                width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] })
                                            }} />
                                        </View>
                                        <Animated.View style={{
                                            position: "absolute",
                                            top: "50%",
                                            marginTop: -14,
                                            marginLeft: -14,
                                            left: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] })
                                        }}>
                                            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: GOLD, alignItems: "center", justifyContent: "center", shadowColor: GOLD, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6 }}>
                                                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" color="#000">
                                                    <Path d="M5 17h2m10 0h2M3 11l1.5-5.5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.5L21 11M3 11h18M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <Circle cx="7" cy="17" r="1.5" fill="currentColor" />
                                                    <Circle cx="17" cy="17" r="1.5" fill="currentColor" />
                                                </Svg>
                                            </View>
                                        </Animated.View>
                                    </View>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                        <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>PICKUP</Text>
                                        <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>DESTINATION</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ width: windowWidth - 40 }}>
                                <TripMapView
                                    height={heroHeight}
                                    driverLat={driver?.latitude}
                                    driverLng={driver?.longitude}
                                    pickupCoords={pickupCoords}
                                    dropoffCoords={dropoffCoords}
                                    driverStatus={activeTrip?.driver_status}
                                />
                                {/* The map captures horizontal pan gestures for itself, so swiping
                                    back to the progress card doesn't work reliably here — give
                                    people an explicit way back instead of fighting the gesture. */}
                                <TouchableOpacity
                                    onPress={() => heroScrollRef.current?.scrollTo({ x: 0, animated: true })}
                                    style={{
                                        position: "absolute", top: 14, left: 14, zIndex: 20,
                                        width: 36, height: 36, borderRadius: 18,
                                        backgroundColor: "rgba(0,0,0,0.55)",
                                        alignItems: "center", justifyContent: "center",
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <ChevronLeft size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            </ScrollView>
                            </View>

                            {/* ── ROUTE CARD ── */}
                            <View style={{ backgroundColor: C.surface, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
                                <Text style={{ fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 14 }}>ROUTE</Text>
                                <View style={{ flexDirection: "row", gap: 14 }}>
                                    {/* Line */}
                                    <View style={{ alignItems: "center", paddingTop: 3 }}>
                                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#34d399" }} />
                                        <View style={{ width: 1.5, flex: 1, backgroundColor: C.border, marginVertical: 4 }} />
                                        <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2.5, borderColor: GOLD, backgroundColor: C.surface }} />
                                    </View>
                                    {/* Text */}
                                    <View style={{ flex: 1, gap: 12 }}>
                                        <View>
                                            <Text style={{ fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 0.8, marginBottom: 3 }}>PICKUP</Text>
                                            <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, lineHeight: 20 }} numberOfLines={2}>
                                                {activeTrip.pickup_location || "—"}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 0.8, marginBottom: 3 }}>DESTINATION</Text>
                                            <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, lineHeight: 20 }} numberOfLines={2}>
                                                {activeTrip.dropoff_location || "—"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Open in Maps button */}
                                {driver?.latitude && driver?.longitude && pickupCoords && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            const url = `https://www.google.com/maps/dir/?api=1&origin=${driver.latitude},${driver.longitude}&destination=${pickupCoords.lat},${pickupCoords.lng}&travelmode=driving`;
                                            Linking.openURL(url).catch(() => Alert.alert("Map Error", "Could not open Google Maps."));
                                        }}
                                        style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border }}
                                    >
                                        <MapPin size={13} color={GOLD} />
                                        <Text style={{ fontSize: 12, fontWeight: "700", color: GOLD }}>Open live route in Google Maps</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* ── DRIVER CARD ── */}
                            <View style={{ backgroundColor: C.surface, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
                                <Text style={{ fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 14 }}>YOUR CHAUFFEUR</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                                    {/* Avatar */}
                                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${GOLD}15`, borderWidth: 1.5, borderColor: `${GOLD}30`, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                        {driver?.avatar_url ? (
                                            <Image source={{ uri: driver.avatar_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                                        ) : (
                                            <Text style={{ fontSize: 20, fontWeight: "700", color: GOLD }}>
                                                {driver?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4 }}>
                                            {driver?.full_name || "Assigned Driver"}
                                        </Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <Star size={12} color={GOLD} fill={GOLD} />
                                            <Text style={{ fontSize: 12, fontWeight: "600", color: C.muted }}>5.0  ·  Lapeq Certified</Text>
                                        </View>
                                    </View>
                                    {/* Actions */}
                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                        <TouchableOpacity
                                            onPress={() => router.push({ pathname: "/chat", params: { mode: "driver_chat", packageId: activeTrip.id } })}
                                            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.background, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}
                                        >
                                            <MessageCircle size={18} color={C.text} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                const rawPhone = driver?.phone || activeTrip?.details?.driverPhone || activeTrip?.details?.driver_phone;
                                                if (rawPhone) {
                                                    Linking.openURL("tel:" + rawPhone.replace(/[^0-9+]/g, ""));
                                                } else {
                                                    Alert.alert("Phone Not Available", "Driver's phone number hasn't been set yet. Try the chat button.");
                                                }
                                            }}
                                            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" }}
                                        >
                                            <Phone size={18} color="#000" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* ── TIMELINE ── */}
                            <View style={{ backgroundColor: C.surface, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
                                <Text style={{ fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 16 }}>LIVE UPDATES</Text>
                                {(() => {
                                    const updates: { title: string; sub: string; done: boolean; active: boolean }[] = [
                                        {
                                            title: "Trip in progress",
                                            sub: `Heading to ${activeTrip.dropoff_location || "destination"}`,
                                            done: isInProgress,
                                            active: isInProgress,
                                        },
                                        {
                                            title: "Chauffeur arrived",
                                            sub: `${driver?.full_name || "Driver"} is at your pickup`,
                                            done: isInProgress || isArrived,
                                            active: isArrived,
                                        },
                                        {
                                            title: "On the way to you",
                                            sub: currentDistance !== null ? `${currentDistance.toFixed(1)} km away` : `${driver?.full_name || "Driver"} is en route`,
                                            done: isInProgress || isArrived || isEnRoute,
                                            active: isEnRoute,
                                        },
                                        {
                                            title: "Chauffeur assigned",
                                            sub: `${driver?.full_name || "A chauffeur"} confirmed for this trip`,
                                            done: true,
                                            active: ds === "assigned",
                                        },
                                    ];
                                    return updates.map((u, i) => (
                                        <View key={i} style={{ flexDirection: "row", gap: 14, marginBottom: i < updates.length - 1 ? 18 : 0 }}>
                                            <View style={{ alignItems: "center" }}>
                                                <View style={{
                                                    width: 12, height: 12, borderRadius: 6,
                                                    backgroundColor: u.active ? statusColor : u.done ? `${statusColor}40` : C.border,
                                                    borderWidth: u.active ? 0 : 1.5,
                                                    borderColor: u.done ? `${statusColor}60` : C.border,
                                                    marginTop: 3,
                                                }} />
                                                {i < updates.length - 1 && (
                                                    <View style={{ width: 1.5, flex: 1, marginTop: 5, backgroundColor: u.done ? `${statusColor}30` : C.border }} />
                                                )}
                                            </View>
                                            <View style={{ flex: 1, paddingBottom: i < updates.length - 1 ? 0 : 0 }}>
                                                <Text style={{ fontSize: 13, fontWeight: u.active ? "700" : "500", color: u.active ? C.text : C.muted, marginBottom: 2 }}>
                                                    {u.title}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: C.muted, lineHeight: 17 }}>{u.sub}</Text>
                                            </View>
                                            {u.active && (
                                                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${statusColor}15`, alignSelf: "flex-start", marginTop: 1 }}>
                                                    <Text style={{ fontSize: 9, fontWeight: "800", color: statusColor, letterSpacing: 0.5 }}>NOW</Text>
                                                </View>
                                            )}
                                        </View>
                                    ));
                                })()}
                            </View>

                            {/* ── SAFETY ── */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${GOLD}15`, alignItems: "center", justifyContent: "center" }}>
                                    <ShieldCheck size={18} color={GOLD} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 2 }}>Trip Protection Active</Text>
                                    <Text style={{ fontSize: 11, color: C.muted, lineHeight: 16 }}>Your movement is monitored by the Lapeq team end-to-end.</Text>
                                </View>
                            </View>

                            {/* ── CANCEL RIDE ── */}
                            {!isInProgress && (
                                <TouchableOpacity
                                    onPress={() => setShowCancelModal(true)}
                                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" }}
                                >
                                    <XCircle size={16} color="#f87171" />
                                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#f87171" }}>Cancel Ride</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        /* ── EMPTY STATE ── */
                        <View style={{ alignItems: "center", paddingTop: 32 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${GOLD}12`, borderWidth: 1, borderColor: `${GOLD}25`, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                                <Svg width="34" height="34" viewBox="0 0 24 24" fill="none" color={GOLD}>
                                    <Path d="M5 17h2m10 0h2M3 11l1.5-5.5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.5L21 11M3 11h18M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <Circle cx="7" cy="17" r="1.5" fill="currentColor" />
                                    <Circle cx="17" cy="17" r="1.5" fill="currentColor" />
                                </Svg>
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 8, textAlign: "center" }}>No active movements</Text>
                            <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20, paddingHorizontal: 24, marginBottom: 32 }}>
                                Your concierge is ready to arrange premium transportation safely and discreetly.
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/services/driving")}
                                style={{ backgroundColor: GOLD, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginBottom: 24 }}
                                activeOpacity={0.85}
                            >
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#000" }}>Book a Ride</Text>
                            </TouchableOpacity>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border }}>
                                <Bell size={16} color={GOLD} />
                                <Text style={{ fontSize: 12, color: C.muted, flex: 1, lineHeight: 18 }}>
                                    You'll be notified the moment your driver is en route or arrives.
                                </Text>
                            </View>
                        </View>
                    )
                ) : (
                    /* ── UPCOMING TAB ── */
                    <View style={{ gap: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: `${GOLD}10`, borderRadius: 14, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: `${GOLD}25` }}>
                            <Crown size={15} color={GOLD} />
                            <Text style={{ fontSize: 12, fontWeight: "600", color: GOLD, flex: 1 }}>
                                All scheduled movements are coordinated through your membership.
                            </Text>
                        </View>
                        {upcomingTrips.length > 0 ? (
                            upcomingTrips.map((trip, i) => {
                                const scheduledDate = trip.scheduled_time ? new Date(trip.scheduled_time) : new Date();
                                const dayStr = scheduledDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                                const timeStr = scheduledDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                                return (
                                    <View key={i} style={{ backgroundColor: C.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border }}>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, flex: 1, marginRight: 10 }} numberOfLines={1}>
                                                {trip.title || (trip.service_type === "driving-service" ? "Chauffeur Ride" : "Logistics")}
                                            </Text>
                                            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: `${GOLD}15` }}>
                                                <Text style={{ fontSize: 10, fontWeight: "700", color: GOLD }}>
                                                    {trip.status === "arranged" ? "ARRANGED" : trip.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                                <CalendarDays size={13} color={C.muted} />
                                                <Text style={{ fontSize: 12, color: C.muted }}>{dayStr}</Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                                <Clock size={13} color={C.muted} />
                                                <Text style={{ fontSize: 12, color: C.muted }}>{timeStr}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: "row", gap: 12 }}>
                                            <View style={{ alignItems: "center" }}>
                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#34d399" }} />
                                                <View style={{ width: 1, flex: 1, backgroundColor: C.border, marginVertical: 3 }} />
                                                <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: GOLD, backgroundColor: C.surface }} />
                                            </View>
                                            <View style={{ flex: 1, gap: 10 }}>
                                                <Text style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>{trip.pickup_location || "—"}</Text>
                                                <Text style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>{trip.dropoff_location || "—"}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={{ paddingVertical: 48, alignItems: "center" }}>
                                <Text style={{ fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 8 }}>No scheduled movements</Text>
                                <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", paddingHorizontal: 24, lineHeight: 20 }}>
                                    Upcoming transfers arranged by your concierge will appear here.
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* ── CANCEL RIDE MODAL ── */}
            <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowCancelModal(false)} />
                    <View style={{ backgroundColor: C.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>Cancel This Ride?</Text>
                            <TouchableOpacity onPress={() => setShowCancelModal(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" }}>
                                <X size={16} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Let us know why. This helps us follow up and improve.</Text>

                        {CANCEL_REASONS.map(reason => (
                            <TouchableOpacity
                                key={reason}
                                onPress={() => setCancelReason(reason)}
                                style={{
                                    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 14,
                                    borderRadius: 14, marginBottom: 8,
                                    backgroundColor: cancelReason === reason ? `${GOLD}15` : C.surface,
                                    borderWidth: 1, borderColor: cancelReason === reason ? GOLD : C.border,
                                }}
                            >
                                <View style={{
                                    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
                                    borderColor: cancelReason === reason ? GOLD : C.border,
                                    alignItems: "center", justifyContent: "center",
                                }}>
                                    {cancelReason === reason && <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: GOLD }} />}
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: "600", color: C.text, flex: 1 }}>{reason}</Text>
                            </TouchableOpacity>
                        ))}

                        {cancelReason === "Other" && (
                            <TextInput
                                value={otherCancelReason}
                                onChangeText={setOtherCancelReason}
                                placeholder="Tell us a bit more…"
                                placeholderTextColor={C.muted}
                                multiline
                                style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, fontSize: 13, color: C.text, minHeight: 70, marginBottom: 8, textAlignVertical: "top" }}
                            />
                        )}

                        <TouchableOpacity
                            onPress={confirmCancelRide}
                            disabled={!cancelReason || cancelling}
                            style={{ marginTop: 12, paddingVertical: 15, borderRadius: 16, alignItems: "center", backgroundColor: "#ef4444", opacity: !cancelReason || cancelling ? 0.5 : 1 }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
                                {cancelling ? "Cancelling…" : "Confirm Cancellation"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── RATE TRIP MODAL ── */}
            <Modal visible={!!rateTrip} transparent animationType="fade" onRequestClose={() => setRateTrip(null)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 }}>
                    <View style={{ width: "100%", maxWidth: 400, backgroundColor: C.surface, borderRadius: 24, padding: 26, borderWidth: 1, borderColor: C.border }}>
                        <Text style={{ fontSize: 18, fontWeight: "800", color: C.text, textAlign: "center", marginBottom: 6 }}>How was your ride?</Text>
                        <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 20 }}>
                            {rateTrip?.reference ? `Ref: ${rateTrip.reference}` : "Rate your recent trip"}
                        </Text>

                        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <TouchableOpacity key={n} onPress={() => setRatingValue(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                                    <Star size={34} color={GOLD} fill={n <= ratingValue ? GOLD : "transparent"} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            value={ratingComment}
                            onChangeText={setRatingComment}
                            placeholder="Anything you'd like to add? (optional)"
                            placeholderTextColor={C.muted}
                            multiline
                            style={{ backgroundColor: C.background, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, fontSize: 13, color: C.text, minHeight: 70, marginBottom: 16, textAlignVertical: "top" }}
                        />

                        <TouchableOpacity
                            onPress={submitRating}
                            disabled={ratingValue === 0 || submittingRating}
                            style={{ paddingVertical: 15, borderRadius: 16, alignItems: "center", backgroundColor: GOLD, opacity: ratingValue === 0 || submittingRating ? 0.5 : 1, marginBottom: 10 }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: "800", color: "#000" }}>
                                {submittingRating ? "Submitting…" : "Submit Rating"}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setRateTrip(null)} style={{ paddingVertical: 8, alignItems: "center" }}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: C.muted }}>Maybe later</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
