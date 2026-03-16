import { useState, useRef, useEffect, useMemo } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Animated, Image, ImageBackground,
    Modal
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

export default function LoginScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
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
            Animated.timing(alertScale, { toValue: 0.9, duration: 200, useNativeDriver: true })
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

                        <View style={s.card}>
                            <Text style={s.heading}>Sign In</Text>

                            <View style={[s.inputWrap, emailFocused && s.inputWrapFocused]}>
                                <Text style={s.inputLabel}>Email</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor={C.muted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    returnKeyType="next"
                                />
                            </View>

                            <View style={[s.inputWrap, passwordFocused && s.inputWrapFocused]}>
                                <Text style={s.inputLabel}>Password</Text>
                                <View style={s.passwordRow}>
                                    <TextInput
                                        style={[s.input, { flex: 1 }]}
                                        placeholder="••••••••"
                                        placeholderTextColor={C.muted}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        returnKeyType="done"
                                        onSubmitEditing={handleLogin}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                                        {showPassword ? <EyeOff size={16} color={C.muted} /> : <Eye size={16} color={C.muted} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} style={s.forgotRow}>
                                <Text style={s.forgot}>Forgot password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[s.btn, loading && { opacity: 0.6 }]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <Text style={s.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={s.switchRow}>
                            <Text style={s.switchText}>
                                Don't have an account?{"  "}
                                <Text style={s.switchLink}>Request Access</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <Modal visible={showAlert} transparent animationType="none">
                <View style={s.modalOverlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={s.modalIconWrap}>
                            <Text style={s.modalIconX}>×</Text>
                        </View>
                        <Text style={s.modalTitle}>Access Denied</Text>
                        <Text style={s.modalBody}>
                            You do not have a registered account. Please request access to join Lapeq.
                        </Text>
                        <View style={s.modalActions}>
                            <TouchableOpacity style={s.modalBtnSecondary} onPress={hideAlert}>
                                <Text style={s.modalBtnTxSec}>Try Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={s.modalBtnPrimary}
                                onPress={() => { hideAlert(); router.push("/(auth)/register"); }}
                            >
                                <Text style={s.modalBtnTxPri}>Request Access</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    bg: { flex: 1, backgroundColor: C.background },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.82)" },
    safe: { flex: 1 },
    kav: { flex: 1, justifyContent: "center" },
    content: { paddingHorizontal: 28, paddingBottom: 24 },
    logoArea: { alignItems: "center", marginBottom: 48 },
    logo: { width: 72, height: 72, marginBottom: 14 },
    tagline: { fontSize: 14, fontStyle: "italic", color: C.muted, letterSpacing: 0.5, fontWeight: "300" },
    card: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1, borderColor: "#242424",
        borderRadius: 20, padding: 24, marginBottom: 24,
    },
    heading: { fontSize: 22, fontWeight: "700", color: "#fff", letterSpacing: 0.5, marginBottom: 28 },
    inputWrap: {
        borderBottomWidth: 1, borderBottomColor: "#383838",
        marginBottom: 24, paddingBottom: 10,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 8, paddingHorizontal: 12, paddingTop: 10,
    },
    inputWrapFocused: { borderBottomColor: C.primary, backgroundColor: "rgba(201,168,76,0.06)" },
    inputLabel: { fontSize: 10, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    input: { fontSize: 16, color: "#fff", paddingVertical: 2 },
    passwordRow: { flexDirection: "row", alignItems: "center" },
    eyeBtn: { paddingLeft: 12 },
    forgotRow: { alignItems: "flex-end", marginBottom: 28 },
    forgot: { fontSize: 12, color: C.muted },
    btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
    btnText: { color: C.background, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
    switchRow: { alignItems: "center" },
    switchText: { fontSize: 13, color: C.muted },
    switchLink: { color: C.primary, fontWeight: "600" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.background, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: C.primary, alignItems: "center" },
    modalIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,50,50,0.1)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalIconX: { color: "#ff4444", fontSize: 24, fontWeight: "600", marginTop: -2 },
    modalTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 12 },
    modalBody: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalActions: { flexDirection: "row", gap: 12, width: "100%" },
    modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#222", alignItems: "center" },
    modalBtnTxSec: { color: "#fff", fontSize: 14, fontWeight: "600" },
    modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary, alignItems: "center" },
    modalBtnTxPri: { color: C.background, fontSize: 14, fontWeight: "700" },
});
