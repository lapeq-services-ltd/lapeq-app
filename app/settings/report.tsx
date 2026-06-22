import { useMemo, useState, useRef } from "react";
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, Image, Animated, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Smartphone, ImagePlus, Trash2, Send, CheckCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import ReportModal from "@/components/ReportModal";

const GOLD = "#c9a84c";
const isAndroid = Platform.OS === "android";

export default function ReportScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [message, setMessage] = useState("");
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const toastAnim = useRef(new Animated.Value(-80)).current;

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.75,
        });
        if (!result.canceled) setScreenshot(result.assets[0].uri);
    };

    const showToast = () => {
        Animated.sequence([
            Animated.timing(toastAnim, { toValue: 20, duration: 300, useNativeDriver: true }),
            Animated.delay(1800),
            Animated.timing(toastAnim, { toValue: -80, duration: 300, useNativeDriver: true }),
        ]).start(() => router.back());
    };

    const handleClose = () => {
        setShowSuccess(false);
        router.back();
    };

    const submit = async () => {
        if (!message.trim() || sending) return;
        setSending(true);
        const { data: { user } } = await supabase.auth.getUser();

        let screenshotUrl: string | null = null;
        if (screenshot) {
            try {
                const ext = screenshot.split(".").pop()?.split("?")[0] ?? "jpg";
                const path = `reports/${user?.id ?? "anon"}/${Date.now()}.${ext}`;
                const resp = await fetch(screenshot);
                const blob = await resp.blob();
                const { error: upErr } = await supabase.storage
                    .from("bug-reports")
                    .upload(path, blob, { upsert: false, contentType: "image/jpeg" });
                if (!upErr) {
                    const { data: pub } = supabase.storage.from("bug-reports").getPublicUrl(path);
                    screenshotUrl = pub.publicUrl;
                }
            } catch {}
        }

        await supabase.from("bug_reports").insert({
            user_id: user?.id ?? null,
            message: message.trim(),
            route: "manual (settings)",
            screenshot_url: screenshotUrl,
        });

        setSending(false);
        setSent(true);
        setShowSuccess(true);
    };

    return (
        <SafeAreaView style={s.root}>
            {/* Toast */}
            <Animated.View style={[s.toast, { transform: [{ translateY: toastAnim }] }]}>
                <CheckCircle size={18} color={C.background} />
                <Text style={s.toastText}>Report sent - thank you</Text>
            </Animated.View>

            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Report a Problem</Text>
            </View>

            <KeyboardAvoidingView behavior={isAndroid ? undefined : "padding"} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Shake hint card */}
                    <View style={s.hintCard}>
                        <View style={s.hintIconWrap}>
                            <Smartphone size={20} color={GOLD} strokeWidth={1.6} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.hintTitle}>Shake to report instantly</Text>
                            <Text style={s.hintSub}>
                                From any screen, give your phone a firm shake. It automatically captures a screenshot and opens this form so you can describe exactly what went wrong.
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={s.label}>What's the problem?</Text>
                    <TextInput
                        style={[s.input, { borderColor: isDark ? "rgba(255,255,255,0.1)" : C.border }]}
                        placeholder="Describe the issue in as much detail as you can..."
                        placeholderTextColor={C.muted}
                        multiline
                        value={message}
                        onChangeText={setMessage}
                        maxLength={800}
                        textAlignVertical="top"
                        editable={!sent}
                    />

                    {/* Screenshot */}
                    <Text style={s.label}>Screenshot <Text style={s.optional}>(optional)</Text></Text>

                    {screenshot ? (
                        <View style={s.screenshotWrap}>
                            <Image source={{ uri: screenshot }} style={s.screenshotImg} resizeMode="cover" />
                            <TouchableOpacity
                                style={s.removeBtn}
                                onPress={() => setScreenshot(null)}
                                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                            >
                                <Trash2 size={14} color="#fff" />
                                <Text style={s.removeBtnText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={s.attachArea} onPress={pickImage}>
                            <ImagePlus size={22} color={C.muted} strokeWidth={1.6} />
                            <Text style={s.attachTitle}>Attach a screenshot</Text>
                            <Text style={s.attachSub}>Go back to the problem screen, take a screenshot, then come back and attach it here.</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer button */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.sendBtn, (!message.trim() || sending || sent) && s.sendBtnDisabled]}
                    onPress={submit}
                    disabled={!message.trim() || sending || sent}
                    activeOpacity={0.85}
                >
                    <Send size={16} color="#0a0a0a" />
                    <Text style={s.sendBtnText}>{sending ? "Sending..." : "Send Report"}</Text>
                </TouchableOpacity>
            </View>
            <ReportModal visible={showSuccess} onClose={handleClose} />
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },

    toast: {
        position: "absolute", top: 0, left: 20, right: 20,
        backgroundColor: C.text, borderRadius: 14, padding: 14,
        flexDirection: "row", alignItems: "center", gap: 10,
        zIndex: 100,
    },
    toastText: { fontSize: 14, fontFamily: "Jost_600SemiBold", color: C.background },

    header: {
        flexDirection: "row", alignItems: "center", gap: 16,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: 22, fontWeight: "700", color: C.text },

    hintCard: {
        flexDirection: "row", gap: 14,
        borderWidth: 1, borderColor: `${GOLD}30`,
        backgroundColor: `${GOLD}08`,
        borderRadius: 16, padding: isAndroid ? 16 : 18,
        marginBottom: 28,
    },
    hintIconWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: `${GOLD}18`,
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
    hintTitle: {
        fontSize: isAndroid ? 14 : 15,
        fontFamily: "Jost_700Bold",
        color: C.text,
        marginBottom: 6,
    },
    hintSub: {
        fontSize: isAndroid ? 12 : 13,
        fontFamily: "Jost_400Regular",
        color: C.muted,
        lineHeight: 20,
    },

    label: {
        fontSize: 13, fontFamily: "Jost_700Bold",
        color: C.text, marginBottom: 10,
    },
    optional: { fontFamily: "Jost_400Regular", color: C.muted },

    input: {
        backgroundColor: C.surface, borderWidth: 1,
        borderRadius: 16, padding: isAndroid ? 14 : 16,
        minHeight: 130, fontSize: 15,
        fontFamily: "Jost_400Regular",
        color: C.text, marginBottom: 26,
    },

    screenshotWrap: {
        borderRadius: 14, overflow: "hidden",
        marginBottom: 26, position: "relative",
    },
    screenshotImg: { width: "100%", height: 200 },
    removeBtn: {
        position: "absolute", bottom: 10, right: 10,
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 10,
    },
    removeBtnText: { fontSize: 12, fontFamily: "Jost_600SemiBold", color: "#fff" },

    attachArea: {
        borderWidth: 1, borderStyle: "dashed",
        borderColor: theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
        borderRadius: 16,
        paddingVertical: isAndroid ? 24 : 28,
        alignItems: "center", gap: 8,
        marginBottom: 26,
    },
    attachTitle: { fontSize: 14, fontFamily: "Jost_600SemiBold", color: C.text },
    attachSub: {
        fontSize: 12, fontFamily: "Jost_400Regular",
        color: C.muted, textAlign: "center",
        lineHeight: 19, paddingHorizontal: 20,
    },

    footer: {
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: isAndroid ? 20 : 28,
        borderTopWidth: 1,
        borderTopColor: theme === "dark" ? "#2a2a2a" : "#ece8de",
        backgroundColor: C.background,
    },
    sendBtn: {
        backgroundColor: GOLD, borderRadius: 14,
        paddingVertical: isAndroid ? 14 : 16,
        flexDirection: "row", alignItems: "center",
        justifyContent: "center", gap: 8,
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText: { fontSize: 15, fontFamily: "Jost_700Bold", color: "#0a0a0a" },
});
