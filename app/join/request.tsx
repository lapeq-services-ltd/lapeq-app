import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Crown } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function MembershipRequestScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const [demoMode, setDemoMode] = useState<"A" | "B">("A");
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            if (demoMode === "A") {
                router.push("/join/option-a");
            } else {
                router.push("/join/option-b");
            }
        }, 1200); // Brief elegant loading state
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={32} color={C.cardFg} />
                </TouchableOpacity>

                {/* Demo Toggle (Discreetly at the top for presentation) */}
                <View style={s.toggleContainer}>
                    <TouchableOpacity
                        style={[s.toggleBtn, demoMode === "A" && s.toggleBtnActive]}
                        onPress={() => setDemoMode("A")}
                    >
                        <Text style={[s.toggleBtnText, demoMode === "A" && s.toggleBtnTextActive]}>Demo A</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.toggleBtn, demoMode === "B" && s.toggleBtnActive]}
                        onPress={() => setDemoMode("B")}
                    >
                        <Text style={[s.toggleBtnText, demoMode === "B" && s.toggleBtnTextActive]}>Demo B</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={s.content}>
                <Crown size={48} color={C.primary} style={{ marginBottom: 24 }} />
                <Text style={s.title}>Ready to join Lapeq?</Text>
                <Text style={s.subtitle}>Elevate your lifestyle with unparalleled concierge services and exclusive global access.</Text>
            </View>

            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.submitBtn, loading && s.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={C.black} size="small" />
                    ) : (
                        <Text style={s.submitBtnText}>Request Membership</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10 },
    backBtn: { paddingVertical: 10, paddingRight: 20 },

    toggleContainer: { flexDirection: "row", backgroundColor: C.surface, borderRadius: 20, padding: 4, borderWidth: 1, borderColor: C.border },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
    toggleBtnActive: { backgroundColor: C.primary },
    toggleBtnText: { fontSize: 12, fontWeight: "600", color: C.muted },
    toggleBtnTextActive: { color: C.black },

    content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingBottom: 60 },
    title: { fontSize: 32, fontWeight: "300", color: C.text, marginBottom: 16, textAlign: "center", letterSpacing: 0.5 },
    subtitle: { fontSize: 16, color: C.muted, textAlign: "center", lineHeight: 24, paddingHorizontal: 10 },

    footer: { paddingHorizontal: 24, paddingBottom: 40 },
    submitBtn: { backgroundColor: C.primary, borderRadius: 30, paddingVertical: 18, alignItems: "center", shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    submitBtnDisabled: { opacity: 0.8 },
    submitBtnText: { color: C.black, fontSize: 16, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
});
