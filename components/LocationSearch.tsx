import { useRef, useState, useCallback } from "react";
import {
    View, TextInput, TouchableOpacity, Text, StyleSheet,
    ActivityIndicator, Keyboard,
} from "react-native";
import { MapPin } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

interface Props {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onSelect?: (place: string) => void;
    style?: object;
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

// Reverse-geocode coords → street address using Mapbox (better Nigerian coverage)
export async function reverseGeocodeWithMapbox(lat: number, lng: number): Promise<string | null> {
    if (!MAPBOX_TOKEN) return null;
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi&country=NG&language=en&limit=1`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.features?.length > 0) {
            return json.features[0].place_name_en || json.features[0].place_name || null;
        }
    } catch {}
    return null;
}

export default function LocationSearch({ value, onChangeText, placeholder = "Search location...", onSelect, style }: Props) {
    const { C, theme } = useTheme();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [searching, setSearching] = useState(false);
    const [focused, setFocused] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const search = useCallback(async (text: string) => {
        if (timer.current) clearTimeout(timer.current);
        if (abortRef.current) abortRef.current.abort();
        if (text.length < 2) { setSuggestions([]); return; }

        setSearching(true);
        timer.current = setTimeout(async () => {
            const controller = new AbortController();
            abortRef.current = controller;
            try {
                // Mapbox Geocoding — much better Nigerian street & POI coverage than Nominatim
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_TOKEN}&country=NG&language=en&limit=8&types=address,poi,place,locality,neighborhood,district`;
                const res = await fetch(url, { signal: controller.signal });
                const json = await res.json();

                const results: string[] = (json.features ?? []).map((f: any) => {
                    // Use English place name, strip ", Nigeria" suffix for cleaner display
                    const name: string = f.place_name_en || f.place_name || f.text || "";
                    return name.replace(/, Nigeria$/i, "").trim();
                }).filter(Boolean);

                // Remove exact duplicates
                setSuggestions([...new Set(results)]);
            } catch (e: any) {
                if (e?.name !== "AbortError") setSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 350);
    }, []);

    const handleChange = (text: string) => {
        onChangeText(text);
        if (!text) { setSuggestions([]); return; }
        search(text);
    };

    const handleSelect = (place: string) => {
        onChangeText(place);
        setSuggestions([]);
        setFocused(false);
        Keyboard.dismiss();
        onSelect?.(place);
    };

    const borderColor = focused ? C.primary : (theme === "dark" ? "#2a2a2a" : "#d8d3ca");

    return (
        <View style={style}>
            <View style={[s.inputRow, { backgroundColor: C.surface, borderColor }]}>
                {searching
                    ? <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 8 }} />
                    : <MapPin size={18} color={C.primary} style={{ marginRight: 8 }} />
                }
                <TextInput
                    style={[s.input, { color: C.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={C.muted}
                    value={value}
                    onChangeText={handleChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => { setFocused(false); setSuggestions([]); }, 300)}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                />
            </View>

            {suggestions.length > 0 && (
                <View style={[s.suggestionBox, { backgroundColor: C.surface, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" }]}>
                    {suggestions.map((place, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[s.suggestionItem, i < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#2a2a2a" : "#ece8de" }]}
                            onPress={() => handleSelect(place)}
                        >
                            <MapPin size={12} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                            <Text style={[s.suggestionText, { color: C.text }]} numberOfLines={2}>{place}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    input: { flex: 1, fontSize: 14 },
    suggestionBox: {
        borderWidth: 1,
        borderRadius: 14,
        marginTop: 4,
        overflow: "hidden",
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        padding: 14,
    },
    suggestionText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
