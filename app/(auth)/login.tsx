import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Animated, Image, ImageBackground,
    ScrollView, Modal, FlatList, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, ChevronDown } from "lucide-react-native";

const isAndroid = Platform.OS === "android";
import Svg, { Path } from "react-native-svg";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";
const MUTED = "rgba(255,255,255,0.4)";
const CARD = "rgba(255,255,255,0.10)";
const BORDER = "rgba(255,255,255,0.09)";
const BORDER_ACTIVE = "rgba(201,168,76,0.5)";

const DIAL_CODES = [
    { flag: "🇳🇬", code: "+234", name: "Nigeria" },
    { flag: "🇬🇧", code: "+44",  name: "United Kingdom" },
    { flag: "🇺🇸", code: "+1",   name: "United States" },
    { flag: "🇨🇦", code: "+1",   name: "Canada" },
    { flag: "🇬🇭", code: "+233", name: "Ghana" },
    { flag: "🇿🇦", code: "+27",  name: "South Africa" },
    { flag: "🇰🇪", code: "+254", name: "Kenya" },
    { flag: "🇦🇪", code: "+971", name: "UAE" },
    { flag: "🇫🇷", code: "+33",  name: "France" },
    { flag: "🇩🇪", code: "+49",  name: "Germany" },
];

function AppleIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </Svg>
    );
}

function GoogleIcon({ size = 20 }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </Svg>
    );
}

export default function LoginScreen() {
    const router = useRouter();
    const [tab, setTab] = useState<"email" | "phone">("email");

    // Email fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Phone fields
    const [dialCode, setDialCode] = useState(DIAL_CODES[0]);
    const [phone, setPhone] = useState("");
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [showDialModal, setShowDialModal] = useState(false);

    // Phone OTP
    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
    const [otpVerified, setOtpVerified] = useState(false);
    const otpRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));

    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState<"denied" | "unconfirmed">("denied");

    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.95)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(slideUp, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        setOtpCode(["", "", "", "", "", ""]);
        setOtpSent(false);
        setOtpVerified(false);
        setOtpCountdown(0);
        setPhone("");
    }, [tab]);

    useEffect(() => {
        if (otpCountdown <= 0) return;
        const timer = setInterval(() => {
            setOtpCountdown(c => {
                if (c <= 1) { clearInterval(timer); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [otpCountdown]);

    const handleEmailLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            const isUnconfirmed = error.message.toLowerCase().includes("not confirmed") || error.message.toLowerCase().includes("confirmation");
            setAlertType(isUnconfirmed ? "unconfirmed" : "denied");
            setShowAlert(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        }
    };

    const sendOTP = async () => {
        if (!phone.trim() || otpSending || otpCountdown > 0) return;
        setOtpSending(true);
        const fullPhone = `${dialCode.code}${phone.trim()}`;
        const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
        setOtpSending(false);
        if (!error) {
            setOtpSent(true);
            setOtpCountdown(60);
        }
    };

    const handleOtpChange = async (val: string, idx: number) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...otpCode];
        next[idx] = val.slice(-1);
        setOtpCode(next);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
        if (next.every(d => d)) {
            const fullPhone = `${dialCode.code}${phone.trim()}`;
            const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: next.join(""), type: "sms" });
            if (!error) setOtpVerified(true);
        }
    };

    const handleOtpKeyPress = (e: any, idx: number) => {
        if (e.nativeEvent.key === "Backspace" && !otpCode[idx] && idx > 0) {
            const next = [...otpCode];
            next[idx - 1] = "";
            setOtpCode(next);
            otpRefs.current[idx - 1]?.focus();
        }
    };

    const handleAppleSignIn = async () => {
        // Requires expo-apple-authentication - to be wired up
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const redirectTo = makeRedirectUri({ scheme: "lapeq" });
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo, skipBrowserRedirect: true },
            });
            if (error || !data.url) {
                Alert.alert("Google Sign-In", error?.message ?? "Could not start sign in.");
                return;
            }
            const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
            if (result.type === "success" && result.url) {
                const fragment = result.url.split("#")[1] ?? result.url.split("?")[1] ?? "";
                const params: Record<string, string> = {};
                fragment.split("&").forEach(part => {
                    const [k, v] = part.split("=");
                    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
                });
                if (params.access_token && params.refresh_token) {
                    await supabase.auth.setSession({
                        access_token: params.access_token,
                        refresh_token: params.refresh_token,
                    });
                }
            }
        } catch {
            Alert.alert("Error", "Something went wrong with Google sign in.");
        } finally {
            setLoading(false);
        }
    };

    const hideAlert = () => {
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(alertScale, { toValue: 0.95, duration: 200, useNativeDriver: true }),
        ]).start(() => setShowAlert(false));
    };

    return (
        <ImageBackground source={require("@/assets/images/auth-bg.png")} style={s.bg} resizeMode="cover">
            <View style={s.overlay} />
            <SafeAreaView style={s.safe}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.kav}>
                    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <Animated.View style={{ opacity, transform: [{ translateY: slideUp }] }}>

                            {/* Logo */}
                            <View style={s.logoArea}>
                                <Image
                                    source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                                    style={s.logo}
                                    resizeMode="contain"
                                />
                                <Text style={s.tagline}>Access without limits.</Text>
                            </View>

                            {/* Tab Toggle */}
                            <View style={s.toggle}>
                                <TouchableOpacity style={[s.toggleBtn, tab === "email" && s.toggleBtnActive]} onPress={() => setTab("email")}>
                                    <Text style={[s.toggleText, tab === "email" && s.toggleTextActive]}>Email</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.toggleBtn, tab === "phone" && s.toggleBtnActive]} onPress={() => setTab("phone")}>
                                    <Text style={[s.toggleText, tab === "phone" && s.toggleTextActive]}>Phone Number</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Email Form */}
                            {tab === "email" && (
                                <View style={s.form}>
                                    <View style={s.fieldWrap}>
                                        <Text style={s.inputLabel}>EMAIL</Text>
                                        <View style={[s.inputBox, emailFocused && s.inputBoxFocused]}>
                                            <TextInput
                                                style={s.input}
                                                placeholder="you@example.com"
                                                placeholderTextColor="rgba(255,255,255,0.2)"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                value={email}
                                                onChangeText={setEmail}
                                                onFocus={() => setEmailFocused(true)}
                                                onBlur={() => setEmailFocused(false)}
                                                returnKeyType="next"
                                            />
                                        </View>
                                    </View>

                                    <View style={s.fieldWrap}>
                                        <Text style={s.inputLabel}>PASSWORD</Text>
                                        <View style={[s.inputBox, passwordFocused && s.inputBoxFocused]}>
                                            <View style={s.row}>
                                                <TextInput
                                                    style={[s.input, { flex: 1 }]}
                                                    placeholder="••••••••"
                                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                                    secureTextEntry={!showPassword}
                                                    value={password}
                                                    onChangeText={setPassword}
                                                    onFocus={() => setPasswordFocused(true)}
                                                    onBlur={() => setPasswordFocused(false)}
                                                    returnKeyType="done"
                                                    onSubmitEditing={handleEmailLogin}
                                                />
                                                <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                                                    {showPassword ? <EyeOff size={18} color={MUTED} /> : <Eye size={18} color={MUTED} />}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} style={s.forgotRow}>
                                        <Text style={s.forgot}>Forgot password?</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleEmailLogin} disabled={loading} activeOpacity={0.85}>
                                        <Text style={s.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Phone Form */}
                            {tab === "phone" && (
                                <View style={s.form}>
                                    <View style={s.fieldWrap}>
                                        <Text style={s.inputLabel}>MOBILE NUMBER</Text>
                                        <View style={[s.inputBox, phoneFocused && s.inputBoxFocused]}>
                                            <View style={s.row}>
                                                <TouchableOpacity style={s.dialBtn} onPress={() => setShowDialModal(true)}>
                                                    <Text style={s.dialFlag}>{dialCode.flag}</Text>
                                                    <Text style={s.dialCode}>{dialCode.code}</Text>
                                                    <ChevronDown size={14} color={MUTED} />
                                                </TouchableOpacity>
                                                <View style={s.dialDivider} />
                                                <TextInput
                                                    style={[s.input, { flex: 1, paddingLeft: 12 }]}
                                                    placeholder="800 000 0000"
                                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                                    keyboardType="phone-pad"
                                                    value={phone}
                                                    onChangeText={setPhone}
                                                    onFocus={() => setPhoneFocused(true)}
                                                    onBlur={() => setPhoneFocused(false)}
                                                />
                                                {otpVerified ? (
                                                    <Text style={s.verifiedCheck}>✓</Text>
                                                ) : phone.trim().length >= 7 ? (
                                                    <TouchableOpacity
                                                        style={[s.sendBtn, (otpSending || otpCountdown > 0) && s.sendBtnDisabled]}
                                                        onPress={sendOTP}
                                                        disabled={otpSending || otpCountdown > 0}
                                                    >
                                                        <Text style={s.sendBtnText}>
                                                            {otpSending ? "..." : otpCountdown > 0 ? `${otpCountdown}s` : otpSent ? "Resend" : "Send"}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : null}
                                            </View>
                                        </View>
                                    </View>

                                    {/* OTP boxes */}
                                    {!otpVerified && (
                                        <View style={s.fieldWrap}>
                                            <Text style={s.inputLabel}>VERIFICATION CODE</Text>
                                            <View style={s.otpRow}>
                                                {otpCode.map((digit, i) => (
                                                    <View key={i} style={[s.otpBox, digit ? s.otpBoxFilled : null]}>
                                                        <TextInput
                                                            ref={r => { otpRefs.current[i] = r; }}
                                                            style={s.otpInput}
                                                            value={digit}
                                                            onChangeText={v => handleOtpChange(v, i)}
                                                            onKeyPress={e => handleOtpKeyPress(e, i)}
                                                            keyboardType="number-pad"
                                                            maxLength={1}
                                                            selectTextOnFocus
                                                            textAlign="center"
                                                        />
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Social auth */}
                            <View style={s.dividerRow}>
                                <View style={s.dividerLine} />
                                <Text style={s.dividerText}>or continue with</Text>
                                <View style={s.dividerLine} />
                            </View>

                            <View style={s.socialRow}>
                                <TouchableOpacity style={s.socialBtn} onPress={handleAppleSignIn} activeOpacity={0.8}>
                                    <AppleIcon size={19} />
                                    <Text style={s.socialText}>Apple</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.socialBtn} onPress={handleGoogleSignIn} activeOpacity={0.8}>
                                    <GoogleIcon size={19} />
                                    <Text style={s.socialText}>Google</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Footer */}
                            <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={s.footerRow}>
                                <Text style={s.footerText}>
                                    New to Lapeq? <Text style={s.footerLink}>Request Access</Text>
                                </Text>
                            </TouchableOpacity>

                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Error modal */}
            <Modal visible={showAlert} transparent animationType="none">
                <View style={s.modalOverlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={s.modalIconWrap}>
                            <Text style={s.modalIconX}>×</Text>
                        </View>
                        <Text style={s.modalTitle}>{alertType === "unconfirmed" ? "Verify Your Email" : "Access Denied"}</Text>
                        <Text style={s.modalBody}>
                            {alertType === "unconfirmed"
                                ? "Please check your inbox and click the confirmation link before signing in."
                                : "Incorrect email or password. Don't have an account yet? Request access to join Lapeq."}
                        </Text>
                        <View style={s.modalActions}>
                            <TouchableOpacity style={s.modalBtnSecondary} onPress={hideAlert}>
                                <Text style={s.modalBtnTxSec}>{alertType === "unconfirmed" ? "Got it" : "Try Again"}</Text>
                            </TouchableOpacity>
                            {alertType === "denied" && (
                                <TouchableOpacity style={s.modalBtnPrimary} onPress={() => { hideAlert(); router.push({ pathname: "/(auth)/register", params: { email } }); }}>
                                    <Text style={s.modalBtnTxPri}>Request Access</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Dial code picker */}
            <Modal visible={showDialModal} animationType="slide" transparent onRequestClose={() => setShowDialModal(false)}>
                <View style={s.pickerOverlay}>
                    <View style={s.pickerSheet}>
                        <View style={s.pickerHeader}>
                            <Text style={s.pickerTitle}>Select Country Code</Text>
                            <TouchableOpacity onPress={() => setShowDialModal(false)}>
                                <Text style={s.pickerClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={DIAL_CODES}
                            keyExtractor={item => item.name}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[s.pickerItem, dialCode.name === item.name && s.pickerItemActive]}
                                    onPress={() => { setDialCode(item); setShowDialModal(false); }}
                                >
                                    <Text style={s.pickerFlag}>{item.flag}</Text>
                                    <Text style={[s.pickerItemText, dialCode.name === item.name && s.pickerItemTextActive]}>
                                        {item.name}
                                    </Text>
                                    <Text style={s.pickerCode}>{item.code}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const s = StyleSheet.create({
    bg: { flex: 1, backgroundColor: DARK },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.78)" },
    safe: { flex: 1 },
    kav: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: isAndroid ? 22 : 28, paddingVertical: isAndroid ? 16 : 24 },

    logoArea: { alignItems: "center", marginBottom: isAndroid ? 24 : 40 },
    logo: { width: isAndroid ? 60 : 80, height: isAndroid ? 60 : 80, marginBottom: isAndroid ? 10 : 16 },
    tagline: { fontSize: isAndroid ? 13 : 16, fontFamily: "PlayfairDisplay_400Regular_Italic", color: MUTED, letterSpacing: 0.3 },

    // Toggle
    toggle: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: 4,
        marginBottom: isAndroid ? 20 : 28,
    },
    toggleBtn: { flex: 1, paddingVertical: isAndroid ? 8 : 10, borderRadius: 11, alignItems: "center" },
    toggleBtnActive: { backgroundColor: GOLD },
    toggleText: { fontSize: isAndroid ? 12 : 13, fontFamily: "Jost_600SemiBold", color: MUTED },
    toggleTextActive: { color: DARK },

    // Inputs
    form: { gap: isAndroid ? 14 : 18, marginBottom: isAndroid ? 20 : 28 },
    fieldWrap: { gap: isAndroid ? 5 : 6 },
    inputBox: {
        borderWidth: 1, borderColor: BORDER, borderRadius: 14,
        backgroundColor: CARD, paddingHorizontal: 16, paddingVertical: isAndroid ? 13 : 15,
    },
    inputBoxFocused: { borderColor: BORDER_ACTIVE, backgroundColor: "rgba(201,168,76,0.06)" },
    inputLabel: { fontSize: 10, fontFamily: "Jost_800ExtraBold", color: GOLD, letterSpacing: 2 },
    input: { fontSize: isAndroid ? 14 : 16, fontFamily: "Jost_400Regular", color: "#fff", paddingVertical: 0 },
    row: { flexDirection: "row", alignItems: "center" },
    eyeBtn: { paddingLeft: 12 },

    // Phone
    dialBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 12 },
    dialFlag: { fontSize: isAndroid ? 17 : 20 },
    dialCode: { fontSize: isAndroid ? 13 : 15, fontFamily: "Jost_500Medium", color: "#fff" },
    dialDivider: { width: 1, height: 20, backgroundColor: BORDER },
    sendBtn: {
        backgroundColor: GOLD, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: isAndroid ? 4 : 5, marginLeft: 8,
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText: { color: DARK, fontSize: 11, fontFamily: "Jost_700Bold", letterSpacing: 0.4 },
    verifiedCheck: { color: "#50c878", fontSize: 18, fontFamily: "Jost_600SemiBold", marginLeft: 8 },
    otpRow: { flexDirection: "row", gap: isAndroid ? 7 : 9 },
    otpBox: {
        flex: 1, height: isAndroid ? 44 : 50,
        borderWidth: 1, borderColor: BORDER, borderRadius: 12,
        backgroundColor: CARD, justifyContent: "center", alignItems: "center",
    },
    otpBoxFilled: { borderColor: BORDER_ACTIVE, backgroundColor: "rgba(201,168,76,0.06)" },
    otpInput: {
        fontSize: isAndroid ? 17 : 19, fontFamily: "Jost_700Bold",
        color: GOLD, width: "100%", textAlign: "center",
    },

    forgotRow: { alignItems: "flex-end", marginTop: -4 },
    forgot: { fontSize: isAndroid ? 12 : 13, fontFamily: "Jost_400Regular", color: MUTED },

    btn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: isAndroid ? 14 : 18, alignItems: "center" },
    btnDisabled: { opacity: 0.45 },
    btnText: { color: DARK, fontSize: isAndroid ? 14 : 16, fontFamily: "Jost_800ExtraBold", letterSpacing: 0.6 },

    // Social
    dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: isAndroid ? 14 : 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
    dividerText: { fontSize: 12, fontFamily: "Jost_400Regular", color: MUTED },

    socialRow: { flexDirection: "row", gap: 12, marginBottom: isAndroid ? 20 : 32 },
    socialBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 10, paddingVertical: isAndroid ? 12 : 16, borderRadius: 16,
        borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
    },
    socialText: { fontSize: isAndroid ? 13 : 14, fontFamily: "Jost_600SemiBold", color: "#fff" },

    footerRow: { alignItems: "center" },
    footerText: { fontSize: isAndroid ? 12 : 13, fontFamily: "Jost_400Regular", color: MUTED },
    footerLink: { color: GOLD, fontFamily: "Jost_600SemiBold" },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: "#111", borderRadius: 24, padding: 32, borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", alignItems: "center" },
    modalIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#1e1e1e", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalIconX: { color: "#ff5555", fontSize: 28, fontFamily: "Jost_300Light", lineHeight: 32 },
    modalTitle: { color: "#fff", fontSize: 20, fontFamily: "Jost_700Bold", marginBottom: 10 },
    modalBody: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "Jost_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 28 },
    modalActions: { flexDirection: "row", gap: 12, width: "100%" },
    modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#1e1e1e", borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center" },
    modalBtnTxSec: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Jost_600SemiBold" },
    modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: GOLD, alignItems: "center" },
    modalBtnTxPri: { color: DARK, fontSize: 14, fontFamily: "Jost_700Bold" },

    // Dial picker
    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    pickerSheet: { backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "60%", padding: 24, borderTopWidth: 1, borderColor: "rgba(201,168,76,0.2)" },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
    pickerTitle: { fontSize: 16, fontFamily: "Jost_700Bold", color: "#fff" },
    pickerClose: { fontSize: 20, color: MUTED, fontFamily: "Jost_300Light" },
    pickerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 8, borderRadius: 10, marginBottom: 2 },
    pickerItemActive: { backgroundColor: "#1e1e1e" },
    pickerFlag: { fontSize: 20, marginRight: 12 },
    pickerItemText: { flex: 1, fontSize: 15, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.7)" },
    pickerItemTextActive: { color: GOLD, fontFamily: "Jost_600SemiBold" },
    pickerCode: { fontSize: 14, fontFamily: "Jost_500Medium", color: MUTED },
});
