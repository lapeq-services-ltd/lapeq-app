import { useEffect, useRef, useState } from "react";
import {
    View, Text, Modal, TextInput, TouchableOpacity, Image,
    StyleSheet, Platform, KeyboardAvoidingView,
    Keyboard, TouchableWithoutFeedback, ScrollView,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import { captureScreen } from "react-native-view-shot";
import * as ImagePicker from "expo-image-picker";
import { AlertTriangle, X, Send, CheckCircle, ImagePlus, ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { usePathname } from "expo-router";
import { supabase } from "@/lib/supabase";
import ReportModal from "./ReportModal";

const GOLD = "#c9a84c";
const SHAKE_THRESHOLD = 2.4;
const SHAKE_COOLDOWN_MS = 2500;

export default function ShakeReport() {
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const pathname = usePathname();

    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState<"choice" | "details">("choice");
    const [includeScreenshot, setIncludeScreenshot] = useState(true);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const lastShakeAt = useRef(0);
    const shakeCount = useRef(0);
    const lastShakeEventTime = useRef(0);
    const lastAccel = useRef({ x: 0, y: 0, z: 0 });
    const currentRoute = useRef(pathname);

    // Keep route ref current
    useEffect(() => { currentRoute.current = pathname; }, [pathname]);

    useEffect(() => {
        Accelerometer.setUpdateInterval(80);
        const sub = Accelerometer.addListener(({ x, y, z }) => {
            const prev = lastAccel.current;
            const delta = Math.sqrt((x - prev.x) ** 2 + (y - prev.y) ** 2 + (z - prev.z) ** 2);
            lastAccel.current = { x, y, z };

            const now = Date.now();
            if (now - lastShakeAt.current < SHAKE_COOLDOWN_MS) return;

            if (delta > SHAKE_THRESHOLD) {
                // Ignore raw accelerometer updates that are part of the same initial movement
                if (now - lastShakeEventTime.current > 350) {
                    if (now - lastShakeEventTime.current < 1800) {
                        shakeCount.current += 1;
                    } else {
                        shakeCount.current = 1;
                    }
                    lastShakeEventTime.current = now;

                    if (shakeCount.current >= 2) {
                        shakeCount.current = 0;
                        lastShakeAt.current = now;
                        handleShake();
                    }
                }
            }
        });
        return () => sub.remove();
    }, []);

    const handleShake = async () => {
        let uri: string | null = null;
        try {
            uri = await captureScreen({ format: "jpg", quality: 0.75 });
        } catch {}
        openModal(uri);
    };

    const openModal = (screenshotUri: string | null = null) => {
        setSent(false);
        setShowSuccess(false);
        setMessage("");
        setScreenshot(screenshotUri);
        setIncludeScreenshot(true);
        setStep("choice");
        setVisible(true);
    };

    const dismiss = () => {
        Keyboard.dismiss();
        setVisible(false);
        setSent(false);
        setShowSuccess(false);
        setMessage("");
        setScreenshot(null);
        setStep("choice");
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.75,
        });
        if (!result.canceled) {
            setScreenshot(result.assets[0].uri);
            setIncludeScreenshot(true);
        }
    };

    const submit = async () => {
        if (!message.trim() || sending) return;
        setSending(true);
        const { data: { user } } = await supabase.auth.getUser();

        let screenshotUrl: string | null = null;
        if (screenshot && includeScreenshot) {
            try {
                const ext = screenshot.startsWith("http") ? "jpg" : (screenshot.split(".").pop()?.split("?")[0] ?? "jpg");
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
            route: currentRoute.current,
            screenshot_url: screenshotUrl,
        });

        setSending(false);
        setSent(true);
        setVisible(false);
        setShowSuccess(true);
    };

    if (!visible && !showSuccess) return null;

    return (
        <>
            <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss}>
            <View style={s.backdrop}>
                <TouchableWithoutFeedback onPress={dismiss}>
                    <View style={StyleSheet.absoluteFillObject} />
                </TouchableWithoutFeedback>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
                    <View style={[
                        s.sheet,
                        { backgroundColor: isDark ? "#121212" : C.surface }
                    ]}>
                        {/* Header Row */}
                        <View style={s.headerRow}>
                            {step === "details" && !sent ? (
                                <TouchableOpacity onPress={() => setStep("choice")} style={s.backBtn} activeOpacity={0.7}>
                                    <ChevronLeft size={18} color={C.muted} />
                                    <Text style={[s.backBtnText, { color: C.muted }]}>Back</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={{ flex: 1 }} />
                            )}
                            <TouchableOpacity
                                onPress={dismiss}
                                style={s.closeBtn}
                                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            >
                                <X size={16} color={C.muted} />
                            </TouchableOpacity>
                        </View>

                        {sent ? (
                            <View style={s.sentWrap}>
                                <CheckCircle size={40} color={GOLD} strokeWidth={1.5} />
                                <Text style={[s.sentTitle, { color: C.text }]}>Report sent.</Text>
                                <Text style={[s.sentSub, { color: C.muted }]}>
                                    Thanks - we'll look into it right away.
                                </Text>
                            </View>
                        ) : step === "choice" ? (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                bounces={false}
                            >
                                <View style={s.iconWrap}>
                                    <AlertTriangle size={20} color={GOLD} strokeWidth={1.6} />
                                </View>

                                <Text style={[s.title, { color: C.text }]}>Report a Problem</Text>
                                
                                <Text style={[s.description, { color: C.muted }]}>
                                    Spotted a bug or having trouble? Let us know so we can fix it. You can optionally attach a capture of your current screen to help us diagnose the issue.
                                </Text>



                                {/* Screenshot preview */}
                                {screenshot && (
                                    <View style={s.previewCard}>
                                        <Image source={{ uri: screenshot }} style={s.previewThumb} resizeMode="cover" />
                                        <View style={{ flex: 1, gap: 2 }}>
                                            <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>Screen Capture Ready</Text>
                                            <Text style={{ fontSize: 11, color: C.muted }}>We can include this to help trace the issue</Text>
                                        </View>
                                    </View>
                                )}

                                <View style={{ gap: 10, marginTop: 8 }}>
                                    {screenshot ? (
                                        <>
                                            <TouchableOpacity
                                                style={s.primaryBtn}
                                                onPress={() => {
                                                    setIncludeScreenshot(true);
                                                    setStep("details");
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={s.primaryBtnText}>Attach Screenshot & Continue</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[s.secondaryBtn, { borderColor: C.border }]}
                                                onPress={() => {
                                                    setIncludeScreenshot(false);
                                                    setStep("details");
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[s.secondaryBtnText, { color: C.text }]}>Proceed without Screenshot</Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                style={[s.secondaryBtn, { borderColor: C.border, borderStyle: "dashed", marginBottom: 6 }]}
                                                onPress={pickImage}
                                                activeOpacity={0.8}
                                            >
                                                <ImagePlus size={16} color={C.muted} style={{ marginRight: 6 }} />
                                                <Text style={[s.secondaryBtnText, { color: C.muted }]}>Choose from gallery</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={s.primaryBtn}
                                                onPress={() => {
                                                    setIncludeScreenshot(false);
                                                    setStep("details");
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={s.primaryBtnText}>Describe Issue & Continue</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </ScrollView>
                        ) : (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                bounces={false}
                            >
                                <Text style={[s.title, { color: C.text, marginTop: 8 }]}>Describe the Issue</Text>
                                <Text style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Please provide details about what went wrong.</Text>

                                <View style={[
                                    s.formRow,
                                    includeScreenshot && screenshot ? { flexDirection: "row", gap: 14 } : null
                                ]}>
                                    {includeScreenshot && screenshot && (
                                        <View style={s.formScreenshotWrap}>
                                            <Image source={{ uri: screenshot }} style={s.formScreenshotImg} resizeMode="cover" />
                                        </View>
                                    )}

                                    <TextInput
                                        style={[
                                            s.input,
                                            {
                                                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : C.background,
                                                borderColor: isDark ? "rgba(255,255,255,0.1)" : C.border,
                                                color: C.text,
                                                flex: includeScreenshot && screenshot ? 1 : undefined,
                                                minHeight: includeScreenshot && screenshot ? 160 : 120,
                                            }
                                        ]}
                                        placeholder="What happened? e.g., the button didn't respond, layout was broken..."
                                        placeholderTextColor={C.muted}
                                        multiline
                                        value={message}
                                        onChangeText={setMessage}
                                        maxLength={500}
                                        textAlignVertical="top"
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[s.sendBtn, (!message.trim() || sending) && s.sendBtnDisabled, { marginTop: 16 }]}
                                    onPress={submit}
                                    disabled={!message.trim() || sending}
                                    activeOpacity={0.85}
                                >
                                    <Send size={15} color="#0a0a0a" />
                                    <Text style={s.sendBtnText}>{sending ? "Sending..." : "Submit Report"}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
        <ReportModal visible={showSuccess} onClose={dismiss} />
    </>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "flex-end",
    },
    sheet: {
        width: "100%",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        padding: 24,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    backBtnText: {
        fontSize: 13,
        fontFamily: "Jost_500Medium",
    },
    closeBtn: {
        padding: 4,
        alignSelf: "flex-end",
    },
    iconWrap: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: `${GOLD}18`,
        alignItems: "center", justifyContent: "center",
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontFamily: "PlayfairDisplay_700Bold",
        marginBottom: 8,
    },
    description: {
        fontSize: 13.5,
        fontFamily: "Jost_400Regular",
        lineHeight: 20,
        marginBottom: 12,
    },
    routeBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8, borderWidth: 1,
        marginBottom: 16,
    },
    routeText: { fontSize: 11, fontFamily: "Jost_500Medium" },
    previewCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.02)",
        marginBottom: 18,
    },
    previewThumb: {
        width: 40,
        height: 64,
        borderRadius: 6,
    },
    primaryBtn: {
        backgroundColor: GOLD,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryBtnText: {
        fontSize: 14,
        fontFamily: "Jost_700Bold",
        color: "#0a0a0a",
    },
    secondaryBtn: {
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    secondaryBtnText: {
        fontSize: 14,
        fontFamily: "Jost_600SemiBold",
    },
    formRow: {
        width: "100%",
    },
    formScreenshotWrap: {
        width: 100,
        height: 160,
        borderRadius: 12,
        overflow: "hidden",
    },
    formScreenshotImg: {
        width: "100%",
        height: "100%",
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        fontSize: 14,
        fontFamily: "Jost_400Regular",
    },
    sendBtn: {
        backgroundColor: GOLD,
        borderRadius: 14,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText: {
        fontSize: 14,
        fontFamily: "Jost_700Bold",
        color: "#0a0a0a",
    },
    sentWrap: {
        alignItems: "center",
        paddingVertical: 24,
        gap: 12,
    },
    sentTitle: {
        fontSize: 20,
        fontFamily: "PlayfairDisplay_700Bold",
        textAlign: "center",
    },
    sentSub: {
        fontSize: 13.5,
        fontFamily: "Jost_400Regular",
        textAlign: "center",
        lineHeight: 20,
    },
});
