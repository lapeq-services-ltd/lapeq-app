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
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=jsonv2&addressdetails=1&limit=10&accept-language=en`;
                const res = await fetch(url, {
                    signal: controller.signal,
                    headers: { "User-Agent": "LapeqApp/1.0" },
                });
                const json = await res.json();
                const places = (json as any[]).map((item: any) => {
                    const a = item.address || {};
                    const parts: string[] = [];
                    if (a.road) parts.push(a.house_number ? `${a.house_number} ${a.road}` : a.road);
                    const area = a.suburb || a.neighbourhood || a.quarter || a.village;
                    if (area) parts.push(area);
                    const city = a.city || a.town || a.state_district || a.county;
                    if (city) parts.push(city);
                    const state = a.state;
                    if (state && state !== city) parts.push(state);
                    const country = a.country;
                    if (country) parts.push(country);

                    return {
                        display: parts.length > 0 ? parts.join(", ") : item.display_name,
                        is_nigeria: a.country_code === "ng" || (country && country.toLowerCase() === "nigeria"),
                    };
                });

                // Boost/sort Nigeria results to the top
                places.sort((a, b) => {
                    if (a.is_nigeria && !b.is_nigeria) return -1;
                    if (!a.is_nigeria && b.is_nigeria) return 1;
                    return 0;
                });

                setSuggestions(places.map(p => p.display));
            } catch (e: any) {
                if (e?.name !== "AbortError") setSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 400);
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
