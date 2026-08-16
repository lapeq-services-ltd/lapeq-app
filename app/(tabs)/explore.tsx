import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList, type ViewToken } from "@shopify/flash-list";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import Skeleton from "@/components/Skeleton";
import type { VenueMediaWithVenue } from "@/lib/venueTypes";

const GOLD = "#c9a84c";
const NUM_COLUMNS = 3;
const GRID_GAP = 3;
const { width: SCREEN_W } = Dimensions.get("window");
const CELL_SIZE = SCREEN_W / NUM_COLUMNS - GRID_GAP;

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function MediaCell({ item, isVisible, router, C }: { item: VenueMediaWithVenue; isVisible: boolean; router: any; C: any }) {
    const isVideo = item.media_type === "video";
    const player = useVideoPlayer(isVideo ? item.url : null, (p) => {
        p.loop = true;
        p.muted = true;
    });

    useEffect(() => {
        if (!isVideo) return;
        if (isVisible) player.play();
        else player.pause();
    }, [isVisible, isVideo]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={{ width: CELL_SIZE, height: CELL_SIZE, margin: GRID_GAP / 2, backgroundColor: C.surface }}
            onPress={() => router.push({ pathname: "/explore/venue-detail", params: { id: item.venue_id, mediaId: item.id } })}
        >
            {isVideo ? (
                <VideoView
                    player={player}
                    style={{ width: "100%", height: "100%" }}
                    nativeControls={false}
                    contentFit="cover"
                />
            ) : (
                <Image source={{ uri: item.url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            )}
        </TouchableOpacity>
    );
}

export default function ExploreScreen() {
    const { C, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const isDark = theme === "dark";

    const [media, setMedia] = useState<VenueMediaWithVenue[]>([]);
    const [loading, setLoading] = useState(true);
    const visibleIds = useRef<Set<string>>(new Set());
    const [visibleTick, setVisibleTick] = useState(0);

    useEffect(() => {
        setLoading(true);
        supabase
            .from("venue_images")
            .select("id, venue_id, url, media_type, caption, sort_order, venues(id, name, category, city)")
            .limit(150)
            .then(({ data }) => {
                setMedia(shuffle((data as any as VenueMediaWithVenue[]) ?? []));
                setLoading(false);
            });
    }, []);

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<VenueMediaWithVenue>[] }) => {
        visibleIds.current = new Set(viewableItems.filter(v => v.isViewable).map(v => v.item.id));
        setVisibleTick(t => t + 1);
    }, []);

    const venueCount = new Set(media.map(m => m.venue_id)).size;
    const cityCount = new Set(media.map(m => m.venues?.city).filter(Boolean)).size;

    return (
        <View style={[s.root, { backgroundColor: C.background }]}>
            <View style={[s.header, { paddingTop: insets.top + 16, backgroundColor: C.background }]}>
                <Text style={s.heroEyebrow}>CURATED BY LAPEQ</Text>
                <Text style={[s.heroTitle, { color: C.text }]}>Discover{"\n"}Nigeria's finest.</Text>

                {!loading && media.length > 0 && (
                    <View style={s.heroStats}>
                        <View style={s.heroStat}>
                            <Text style={s.heroStatNum}>{venueCount}</Text>
                            <Text style={[s.heroStatLabel, { color: C.muted }]}>Venues</Text>
                        </View>
                        <View style={[s.heroStatDivider, { backgroundColor: C.border }]} />
                        <View style={s.heroStat}>
                            <Text style={s.heroStatNum}>{cityCount}</Text>
                            <Text style={[s.heroStatLabel, { color: C.muted }]}>Cities</Text>
                        </View>
                        <View style={[s.heroStatDivider, { backgroundColor: C.border }]} />
                        <View style={s.heroStat}>
                            <Text style={s.heroStatNum}>{media.length}</Text>
                            <Text style={[s.heroStatLabel, { color: C.muted }]}>Photos & Videos</Text>
                        </View>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={s.skeletonGrid}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton key={i} width={CELL_SIZE} height={CELL_SIZE} borderRadius={0} style={{ margin: GRID_GAP / 2 }} />
                    ))}
                </View>
            ) : media.length === 0 ? (
                <View style={s.empty}>
                    <Text style={[s.emptyTitle, { color: C.text }]}>No photos or videos yet</Text>
                    <Text style={[s.emptyHint, { color: C.muted }]}>Check back soon</Text>
                </View>
            ) : (
                <FlashList
                    data={media}
                    numColumns={NUM_COLUMNS}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 110, paddingTop: 4 }}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                    renderItem={({ item }) => (
                        <MediaCell item={item} isVisible={visibleIds.current.has(item.id)} router={router} C={C} />
                    )}
                    extraData={visibleTick}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1 },

    header: { paddingHorizontal: 24, paddingBottom: 16 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 10 },
    heroTitle: { fontSize: 30, fontWeight: "800", fontFamily: "PlayfairDisplay_700Bold", lineHeight: 36 },

    heroStats: { flexDirection: "row", alignItems: "center", marginTop: 20 },
    heroStat: { flex: 1, alignItems: "center" },
    heroStatNum: { fontSize: 20, fontWeight: "800", color: GOLD, marginBottom: 2 },
    heroStatLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
    heroStatDivider: { width: 1, height: 32 },

    skeletonGrid: { flexDirection: "row", flexWrap: "wrap" },

    empty: { paddingTop: 60, alignItems: "center", gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: "700" },
    emptyHint: { fontSize: 13 },
});
