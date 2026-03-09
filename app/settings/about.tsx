import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Crown } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function AboutScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={32} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>About Lapeq</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, alignItems: "center", paddingTop: 60 }}>
                <View style={s.logoBox}>
                    <Crown size={40} color={C.primary} />
                </View>
                <Text style={s.appName}>LAPEQ</Text>
                <Text style={s.version}>Version 1.0.0</Text>

                <Text style={s.desc}>
                    Lapeq is an exclusive members-only lifestyle and travel concierge serving high-net-worth individuals visiting or residing in Lagos, Nigeria.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },
    logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: `${C.primary}18`, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    appName: { fontSize: 24, fontWeight: "700", color: C.text, letterSpacing: 4, marginBottom: 8 },
    version: { fontSize: 14, color: C.muted, marginBottom: 32 },
    desc: { fontSize: 15, color: C.text, textAlign: "center", lineHeight: 24, paddingHorizontal: 20 },
});
