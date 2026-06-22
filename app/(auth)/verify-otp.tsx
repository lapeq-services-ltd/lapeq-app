import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Animated, Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";
const MUTED = "rgba(255,255,255,0.4)";
const BORDER = "rgba(255,255,255,0.09)";
const BORDER_ACTIVE = "rgba(201,168,76,0.6)";
const RESEND_SECONDS = 60;

export default function VerifyOtpScreen() {
    const router = useRouter();
    const { phone, display } = useLocalSearchParams<{ phone: string; display: string }>();

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [seconds, setSeconds] = useState(RESEND_SECONDS);
    const [canResend, setCanResend] = useState(false);
    const [focused, setFocused] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(30)).current;
    const shakeX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
        setTimeout(() => inputRef.current?.focus(), 400);
    }, []);

    useEffect(() => {
        if (seconds === 0) { setCanResend(true); return; }
        const t = setInterval(() => setSeconds(s => s - 1), 1000);
        return () => clearInterval(t);
    }, [seconds]);

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const handleVerify = async () => {
        if (otp.length < 4) return;
        setLoading(true);
        setError("");
        const { error: err } = await supabase.auth.verifyOtp({
            phone: phone ?? "",
            token: otp,
            type: "sms",
        });
        setLoading(false);
        if (err) {
            setError("Incorrect code. Please try again.");
            setOtp("");
            shake();
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setCanResend(false);
        setSeconds(RESEND_SECONDS);
        setError("");
        await supabase.auth.signInWithOtp({ phone: phone ?? "" });
    };

    const pad = (n: number) => String(n).padStart(2, "0");

    return (
        <SafeAreaView style={s.container}>
            <Animated.View style={[s.inner, { opacity, transform: [{ translateY: slideUp }] }]}>

                {/* Header */}
                <View style={s.topRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <ChevronLeft size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Logo */}
                <View style={s.logoArea}>
                    <Image
                        source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                        style={s.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Heading */}
                <Text style={s.heading}>Verify your{"\n"}number</Text>
                <Text style={s.subtext}>
                    We sent a 4-digit code to{"\n"}
                    <Text style={s.phoneDisplay}>{display ?? phone}</Text>
                </Text>

                {/* OTP Boxes */}
                <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={s.otpArea}>
                    <Animated.View style={[s.otpRow, { transform: [{ translateX: shakeX }] }]}>
                        {[0, 1, 2, 3].map(i => {
                            const isActive = focused && i === otp.length;
                            const filled = !!otp[i];
                            return (
                                <View
                                    key={i}
                                    style={[
                                        s.otpBox,
                                        isActive && s.otpBoxActive,
                                        filled && s.otpBoxFilled,
                                    ]}
                                >
                                    {filled
                                        ? <Text style={s.otpDigit}>{otp[i]}</Text>
                                        : isActive
                                            ? <View style={s.otpCursor} />
                                            : null}
                                </View>
                            );
                        })}
                    </Animated.View>
                </TouchableOpacity>

                <TextInput
                    ref={inputRef}
                    style={s.hiddenInput}
                    value={otp}
                    onChangeText={val => {
                        const clean = val.replace(/[^0-9]/g, "").slice(0, 4);
                        setOtp(clean);
                        setError("");
                        if (clean.length === 4) {
                            // auto-verify when all 4 digits entered
                            setTimeout(() => {
                                if (clean.length === 4) handleVerify();
                            }, 100);
                        }
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />

                {/* Error */}
                {!!error && <Text style={s.errorText}>{error}</Text>}

                {/* Resend */}
                <View style={s.resendRow}>
                    {canResend ? (
                        <TouchableOpacity onPress={handleResend}>
                            <Text style={s.resendActive}>Resend code</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={s.resendTimer}>
                            Resend code in <Text style={s.resendCountdown}>00:{pad(seconds)}</Text>
                        </Text>
                    )}
                </View>

                {/* Button */}
                <TouchableOpacity
                    style={[s.btn, (otp.length < 4 || loading) && s.btnDisabled]}
                    onPress={handleVerify}
                    disabled={otp.length < 4 || loading}
                    activeOpacity={0.85}
                >
                    <Text style={s.btnText}>{loading ? "Verifying..." : "Continue"}</Text>
                </TouchableOpacity>

            </Animated.View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK },
    inner: { flex: 1, paddingHorizontal: 28 },

    topRow: { paddingTop: 8, marginBottom: 16 },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center", justifyContent: "center",
    },

    logoArea: { alignItems: "flex-start", marginBottom: 32 },
    logo: { width: 44, height: 44 },

    heading: {
        fontSize: 36, fontFamily: "Jost_800ExtraBold",
        color: "#fff", lineHeight: 42, letterSpacing: -0.5, marginBottom: 12,
    },
    subtext: { fontSize: 15, fontFamily: "Jost_400Regular", color: MUTED, lineHeight: 22, marginBottom: 48 },
    phoneDisplay: { color: "#fff", fontFamily: "Jost_600SemiBold" },

    // OTP
    otpArea: { marginBottom: 20 },
    otpRow: { flexDirection: "row", gap: 14, justifyContent: "center" },
    otpBox: {
        width: 68, height: 68, borderRadius: 18,
        borderWidth: 1.5, borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.03)",
        alignItems: "center", justifyContent: "center",
    },
    otpBoxActive: { borderColor: BORDER_ACTIVE, backgroundColor: "rgba(201,168,76,0.05)" },
    otpBoxFilled: { borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(255,255,255,0.06)" },
    otpDigit: { fontSize: 26, fontFamily: "Jost_700Bold", color: "#fff" },
    otpCursor: { width: 2, height: 26, backgroundColor: GOLD, borderRadius: 1 },

    hiddenInput: {
        position: "absolute", width: 0, height: 0, opacity: 0,
    },

    errorText: {
        textAlign: "center", fontSize: 13, fontFamily: "Jost_400Regular",
        color: "#ff5555", marginBottom: 16,
    },

    resendRow: { alignItems: "center", marginBottom: 40 },
    resendTimer: { fontSize: 13, fontFamily: "Jost_400Regular", color: MUTED },
    resendCountdown: { fontFamily: "Jost_600SemiBold", color: "#fff" },
    resendActive: { fontSize: 14, fontFamily: "Jost_600SemiBold", color: GOLD },

    btn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: DARK, fontSize: 16, fontFamily: "Jost_800ExtraBold", letterSpacing: 0.6 },
});
