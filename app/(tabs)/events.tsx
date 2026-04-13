import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

export default function EventsScreen() {
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Events</Text>
            </View>
            <View style={s.empty}>
                <Text style={s.emptyTitle}>Nothing to see here</Text>
                <Text style={s.emptyBody}>Exclusive member events will appear here. Your concierge will notify you when new experiences are available.</Text>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
    emptyTitle: { fontSize: 22, fontWeight: "700", color: C.text },
    emptyBody: { fontSize: 15, color: C.muted, textAlign: "center", lineHeight: 24 },
});
