import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, Animated, Image, ImageBackground
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

const GOLD = "#C9A84C";
const DARK = "#0A0A0A";
const MUTED = "#666666";
const INPUT_LINE = "#383838";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const opacity = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert("Please fill in all fields");
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) Alert.alert("Login failed", error.message);
    };

    return (
        <ImageBackground
            source={require("@/assets/images/auth-bg.png")}
            style={s.bg}
            resizeMode="cover"
        >
            {/* Dark overlay */}
            <View style={s.overlay} />

            <SafeAreaView style={s.safe}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={s.kav}
                >
                    <Animated.View style={[s.content, { opacity, transform: [{ translateY: slideUp }] }]}>
                        {/* Logo + Tagline */}
                        <View style={s.logoArea}>
                            <Image
                                source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                                style={s.logo}
                                resizeMode="contain"
                            />
                            <Text style={s.tagline}>Access without limits.</Text>
                        </View>

                        {/* Form card */}
                        <View style={s.card}>
                            <Text style={s.heading}>Sign In</Text>

                            {/* Email */}
                            <View style={[s.inputWrap, emailFocused && s.inputWrapFocused]}>
                                <Text style={s.inputLabel}>Email</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor={GOLD}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    returnKeyType="next"
                                />
                            </View>

                            {/* Password */}
                            <View style={[s.inputWrap, passwordFocused && s.inputWrapFocused]}>
                                <Text style={s.inputLabel}>Password</Text>
                                <View style={s.passwordRow}>
                                    <TextInput
                                        style={[s.input, { flex: 1 }]}
                                        placeholder="••••••••"
                                        placeholderTextColor={GOLD}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        returnKeyType="done"
                                        onSubmitEditing={handleLogin}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                                        {showPassword ? <EyeOff size={16} color={MUTED} /> : <Eye size={16} color={MUTED} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Forgot */}
                            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} style={s.forgotRow}>
                                <Text style={s.forgot}>Forgot password?</Text>
                            </TouchableOpacity>

                            {/* CTA */}
                            <TouchableOpacity
                                style={[s.btn, loading && { opacity: 0.6 }]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <Text style={s.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Register link */}
                        <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={s.switchRow}>
                            <Text style={s.switchText}>
                                Don't have an account?{"  "}
                                <Text style={s.switchLink}>Request Access</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const s = StyleSheet.create({
    bg: { flex: 1, backgroundColor: DARK },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.82)" },
    safe: { flex: 1 },
    kav: { flex: 1, justifyContent: "center" },
    content: { paddingHorizontal: 28, paddingBottom: 24 },

    logoArea: { alignItems: "center", marginBottom: 48 },
    logo: { width: 72, height: 72, marginBottom: 14 },
    tagline: { fontSize: 14, fontStyle: "italic", color: MUTED, letterSpacing: 0.5, fontWeight: "300" },

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
    inputWrapFocused: { borderBottomColor: GOLD, backgroundColor: "rgba(201,168,76,0.06)" },
    inputLabel: { fontSize: 10, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    input: { fontSize: 16, color: "#fff", paddingVertical: 2 },
    passwordRow: { flexDirection: "row", alignItems: "center" },
    eyeBtn: { paddingLeft: 12 },

    forgotRow: { alignItems: "flex-end", marginBottom: 28 },
    forgot: { fontSize: 12, color: MUTED },

    btn: {
        backgroundColor: GOLD, borderRadius: 12,
        paddingVertical: 16, alignItems: "center",
    },
    btnText: { color: DARK, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },

    switchRow: { alignItems: "center" },
    switchText: { fontSize: 13, color: MUTED },
    switchLink: { color: GOLD, fontWeight: "600" },
});
