import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, Animated, Image
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

const GOLD = "#C9A84C";
const DARK = "#060606";
const SURFACE = "#111111";
const BORDER = "#222222";
const MUTED = "#555555";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Subtle fade in
    const opacity = useRef(new Animated.Value(0)).current;
    // Fade in on mount
    useEffect(() => {
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert("Please fill in all fields");
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) Alert.alert("Login failed", error.message);
    };

    return (
        <SafeAreaView style={s.root}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <Animated.View style={[s.content, { opacity }]}>
                    {/* Logo */}
                    <View style={s.logoRow}>
                        <Image
                            source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                            style={s.logoImg}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Headline */}
                    <Text style={s.title}>Welcome back.</Text>
                    <Text style={s.subtitle}>Sign in to your concierge account.</Text>

                    {/* Divider */}
                    <View style={s.divider} />

                    {/* Email */}
                    <Text style={s.label}>Email Address</Text>
                    <TextInput
                        style={s.input}
                        placeholder="you@example.com"
                        placeholderTextColor={MUTED}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        returnKeyType="next"
                    />

                    {/* Password */}
                    <Text style={s.label}>Password</Text>
                    <View style={s.passwordWrap}>
                        <TextInput
                            style={s.passwordInput}
                            placeholder="••••••••"
                            placeholderTextColor={MUTED}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                            {showPassword
                                ? <EyeOff size={18} color={MUTED} />
                                : <Eye size={18} color={MUTED} />
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Forgot */}
                    <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} style={s.forgotRow}>
                        <Text style={s.forgot}>Forgot password?</Text>
                    </TouchableOpacity>

                    {/* CTA */}
                    <TouchableOpacity
                        style={[s.btn, loading && s.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={s.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
                    </TouchableOpacity>

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
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: DARK },
    content: { flex: 1, paddingHorizontal: 28, justifyContent: "center", paddingBottom: 32 },

    logoRow: { alignItems: "center", marginBottom: 40 },
    logoImg: { width: 72, height: 72 },

    title: { fontSize: 30, fontWeight: "300", color: "#FFFFFF", letterSpacing: 0.5, marginBottom: 8 },
    subtitle: { fontSize: 14, color: MUTED, marginBottom: 32, letterSpacing: 0.2 },

    divider: { height: 1, backgroundColor: BORDER, marginBottom: 32 },

    label: { fontSize: 11, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },

    input: {
        backgroundColor: SURFACE,
        borderWidth: 1, borderColor: BORDER,
        borderRadius: 12,
        padding: 16, paddingHorizontal: 18,
        fontSize: 15, color: "#FFFFFF",
        marginBottom: 20,
    },

    passwordWrap: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: SURFACE,
        borderWidth: 1, borderColor: BORDER,
        borderRadius: 12,
        marginBottom: 12,
    },
    passwordInput: { flex: 1, padding: 16, paddingHorizontal: 18, fontSize: 15, color: "#FFFFFF" },
    eyeBtn: { padding: 16 },

    forgotRow: { alignItems: "flex-end", marginBottom: 32 },
    forgot: { fontSize: 12, color: GOLD, fontWeight: "600" },

    btn: {
        backgroundColor: GOLD,
        borderRadius: 12, padding: 17,
        alignItems: "center",
        marginBottom: 24,
        shadowColor: GOLD, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: DARK, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },

    switchRow: { alignItems: "center" },
    switchText: { fontSize: 13, color: MUTED },
    switchLink: { color: GOLD, fontWeight: "600" },
});
