import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Animated, Image, ImageBackground,
    Modal
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";
const MUTED = "rgba(255,255,255,0.4)";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
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

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            const isUnconfirmed = error.message.toLowerCase().includes("not confirmed") || error.message.toLowerCase().includes("email");
            setAlertType(isUnconfirmed ? "unconfirmed" : "denied");
            setShowAlert(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
            ]).start();
        }
    };

    const hideAlert = () => {
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(alertScale, { toValue: 0.95, duration: 200, useNativeDriver: true })
        ]).start(() => setShowAlert(false));
    };

    return (
        <ImageBackground
            source={require("@/assets/images/auth-bg.png")}
            style={s.bg}
            resizeMode="cover"
        >
            <View style={s.overlay} />

            <SafeAreaView style={s.safe}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={s.kav}
                >
                    <Animated.View style={[s.content, { opacity, transform: [{ translateY: slideUp }] }]}>
                        <View style={s.logoArea}>
                            <Image
                                source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                                style={s.logo}
                                resizeMode="contain"
                            />
                            <Text style={s.tagline}>Access without limits.</Text>
                        </View>

                        <View style={s.form}>
                            <View style={[s.inputBlock, emailFocused && s.inputBlockFocused]}>
                                <Text style={s.inputLabel}>EMAIL</Text>
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

                            <View style={[s.inputBlock, passwordFocused && s.inputBlockFocused]}>
                                <Text style={s.inputLabel}>PASSWORD</Text>
                                <View style={s.passwordRow}>
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
                                        onSubmitEditing={handleLogin}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                                        {showPassword
                                            ? <EyeOff size={20} color={MUTED} />
                                            : <Eye size={20} color={MUTED} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} style={s.forgotRow}>
                                <Text style={s.forgot}>Forgot password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[s.btn, loading && s.btnLoading]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                <Text style={s.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={s.footer}>
                            <View style={s.divider}>
                                <View style={s.dividerLine} />
                                <Text style={s.dividerText}>New to Lapeq?</Text>
                                <View style={s.dividerLine} />
                            </View>
                            <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={s.registerBtn}>
                                <Text style={s.registerBtnText}>Request Access</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <Modal visible={showAlert} transparent animationType="none">
                <View style={s.modalOverlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={s.modalIconWrap}>
                            <Text style={s.modalIconX}>×</Text>
                        </View>
                        <Text style={s.modalTitle}>
                            {alertType === "unconfirmed" ? "Verify Your Email" : "Access Denied"}
                        </Text>
                        <Text style={s.modalBody}>
                            {alertType === "unconfirmed"
                                ? "Please check your inbox and click the confirmation link before signing in."
                                : "Incorrect email or password. Don't have an account yet? Request access to join Lapeq."}
                        </Text>
                        <View style={s.modalActions}>
                            <TouchableOpacity style={s.modalBtnSecondary} onPress={hideAlert}>
                                <Text style={s.modalBtnTxSec}>
                                    {alertType === "unconfirmed" ? "Got it" : "Try Again"}
                                </Text>
                            </TouchableOpacity>
                            {alertType === "denied" && (
                                <TouchableOpacity
                                    style={s.modalBtnPrimary}
                                    onPress={() => { hideAlert(); router.push("/(auth)/register"); }}
                                >
                                    <Text style={s.modalBtnTxPri}>Request Access</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const s = StyleSheet.create({
    bg: { flex: 1, backgroundColor: DARK },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.75)" },
    safe: { flex: 1 },
    kav: { flex: 1, justifyContent: "center" },
    content: { paddingHorizontal: 28 },

    logoArea: { alignItems: "center", marginBottom: 56 },
    logo: { width: 88, height: 88, marginBottom: 20 },
    tagline: { fontSize: 17, fontFamily: "PlayfairDisplay_400Regular_Italic", color: MUTED, letterSpacing: 0.3 },

    form: { marginBottom: 40 },
    inputBlock: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
        paddingVertical: 18,
        marginBottom: 8,
    },
    inputBlockFocused: { borderBottomColor: GOLD },
    inputLabel: { fontSize: 10, fontFamily: "Jost_800ExtraBold", color: GOLD, letterSpacing: 2, marginBottom: 14 },
    input: { fontSize: 20, fontFamily: "Jost_400Regular", color: "#fff", paddingVertical: 0 },
    passwordRow: { flexDirection: "row", alignItems: "center" },
    eyeBtn: { paddingLeft: 12 },

    forgotRow: { alignItems: "flex-end", marginTop: 12, marginBottom: 36 },
    forgot: { fontSize: 14, fontFamily: "Jost_400Regular", color: MUTED },

    btn: {
        backgroundColor: GOLD,
        borderRadius: 16,
        paddingVertical: 22,
        alignItems: "center",
    },
    btnLoading: { opacity: 0.6 },
    btnText: { color: DARK, fontSize: 17, fontFamily: "Jost_800ExtraBold", letterSpacing: 0.8 },

    footer: { gap: 20 },
    divider: { flexDirection: "row", alignItems: "center", gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
    dividerText: { fontSize: 13, fontFamily: "Jost_400Regular", color: MUTED },
    registerBtn: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: "center",
    },
    registerBtnText: { color: "rgba(255,255,255,0.7)", fontSize: 16, fontFamily: "Jost_500Medium" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: {
        width: "100%",
        backgroundColor: "#111",
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.3)",
        alignItems: "center",
    },
    modalIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,60,60,0.12)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalIconX: { color: "#ff5555", fontSize: 28, fontFamily: "Jost_300Light", lineHeight: 32 },
    modalTitle: { color: "#fff", fontSize: 20, fontFamily: "Jost_700Bold", marginBottom: 10 },
    modalBody: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "Jost_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 28 },
    modalActions: { flexDirection: "row", gap: 12, width: "100%" },
    modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center" },
    modalBtnTxSec: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Jost_600SemiBold" },
    modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: GOLD, alignItems: "center" },
    modalBtnTxPri: { color: DARK, fontSize: 14, fontFamily: "Jost_700Bold" },
});
