import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, CheckCircle2 } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function OptionBScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={s.closeBtn}>
                    <X size={28} color={C.muted} />
                </TouchableOpacity>
            </View>

            <View style={s.content}>
                <CheckCircle2 size={64} color={C.primary} style={{ marginBottom: 24 }} strokeWidth={1.5} />
                <Text style={s.title}>Request Received.</Text>
                <Text style={s.body}>
                    Thank you for your interest in joining LAPEQ.{"\n\n"}
                    We have received your details. One of our dedicated membership directors will reach out to you within the next 24 hours to craft a personalized package tailored precisely to your lifestyle and requirements.
                </Text>

                <TouchableOpacity style={s.doneBtn} onPress={() => router.replace("/(tabs)")}>
                    <Text style={s.doneBtnText}>Return Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { alignItems: "flex-end", paddingHorizontal: 20, paddingTop: 16 },
    closeBtn: { padding: 8 },
    content: { flex: 1, paddingHorizontal: 32, justifyContent: "center", alignItems: "center", paddingBottom: 60 },
    title: { fontSize: 28, fontWeight: "300", color: C.text, marginBottom: 20, textAlign: "center" },
    body: { fontSize: 16, color: C.muted, lineHeight: 28, textAlign: "center", fontWeight: "400" },
    doneBtn: { marginTop: 40, borderBottomWidth: 1, borderBottomColor: C.primary, paddingBottom: 2 },
    doneBtnText: { color: C.primary, fontSize: 15, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }
});
