import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, Animated, Image,
    ImageBackground, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

const GOLD = "#C9A84C";
const DARK = "#0A0A0A";
const MUTED = "#555555";
const INPUT_LINE = "#282828";

export default function RegisterScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [nameFocused, setNameFocused] = useState(false);
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

    const handleRegister = async () => {
        if (!fullName || !email || !password) return Alert.alert("Please fill in all fields");
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });
        setLoading(false);
        if (error) {
            Alert.alert("Registration failed", error.message);
        } else {
            Alert.alert("Welcome to Lapeq", "Your account has been created.");
            router.replace("/(auth)/login");
        }
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
                    <ScrollView
                        contentContainerStyle={s.scroll}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View style={{ opacity, transform: [{ translateY: slideUp }] }}>
                            {/* Logo + tagline */}
                            <View style={s.logoArea}>
                                <Image
                                    source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                                    style={s.logo}
                                    resizeMode="contain"
                                />
                                <Text style={s.tagline}>Your world, handled.</Text>
                            </View>

                            {/* Form card */}
                            <View style={s.card}>
                                <Text style={s.heading}>Request Access</Text>
                                <Text style={s.subheading}>Join a circle of people who expect more.</Text>

                                {/* Full Name */}
                                <View style={[s.inputWrap, nameFocused && s.inputWrapFocused]}>
                                    <Text style={s.inputLabel}>Full Name</Text>
                                    <TextInput
                                        style={s.input}
                                        placeholder="e.g. Adaeze Okafor"
                                        placeholderTextColor="#333"
                                        autoCapitalize="words"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        onFocus={() => setNameFocused(true)}
                                        onBlur={() => setNameFocused(false)}
                                        returnKeyType="next"
                                    />
                                </View>

                                {/* Email */}
                                <View style={[s.inputWrap, emailFocused && s.inputWrapFocused]}>
                                    <Text style={s.inputLabel}>Email Address</Text>
                                    <TextInput
                                        style={s.input}
                                        placeholder="you@example.com"
                                        placeholderTextColor="#333"
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
                                            placeholder="min. 8 characters"
                                            placeholderTextColor="#333"
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={setPassword}
                                            onFocus={() => setPasswordFocused(true)}
                                            onBlur={() => setPasswordFocused(false)}
                                            returnKeyType="done"
                                            onSubmitEditing={handleRegister}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                                            {showPassword ? <EyeOff size={16} color={MUTED} /> : <Eye size={16} color={MUTED} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* CTA */}
                                <TouchableOpacity
                                    style={[s.btn, loading && { opacity: 0.6 }]}
                                    onPress={handleRegister}
                                    disabled={loading}
                                >
                                    <Text style={s.btnText}>{loading ? "Creating account..." : "Create Account"}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Login link */}
                            <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={s.switchRow}>
                                <Text style={s.switchText}>
                                    Already a member?{"  "}
                                    <Text style={s.switchLink}>Sign In</Text>
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const s = StyleSheet.create({
    bg: { flex: 1, backgroundColor: DARK },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.82)" },
    safe: { flex: 1 },
    kav: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 32 },

    logoArea: { alignItems: "center", marginBottom: 40 },
    logo: { width: 68, height: 68, marginBottom: 12 },
    tagline: { fontSize: 14, fontStyle: "italic", color: MUTED, letterSpacing: 0.5, fontWeight: "300" },

    card: {
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1, borderColor: "#1a1a1a",
        borderRadius: 20, padding: 24, marginBottom: 24,
    },
    heading: { fontSize: 22, fontWeight: "300", color: "#fff", letterSpacing: 0.5, marginBottom: 6 },
    subheading: { fontSize: 13, color: MUTED, marginBottom: 28, fontStyle: "italic" },

    inputWrap: {
        borderBottomWidth: 1, borderBottomColor: INPUT_LINE,
        marginBottom: 24, paddingBottom: 8,
    },
    inputWrapFocused: { borderBottomColor: GOLD },
    inputLabel: { fontSize: 10, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
    input: { fontSize: 15, color: "#fff", paddingVertical: 0 },
    passwordRow: { flexDirection: "row", alignItems: "center" },
    eyeBtn: { paddingLeft: 12 },

    btn: {
        backgroundColor: GOLD, borderRadius: 12,
        paddingVertical: 16, alignItems: "center", marginTop: 4,
    },
    btnText: { color: DARK, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },

    switchRow: { alignItems: "center" },
    switchText: { fontSize: 13, color: MUTED },
    switchLink: { color: GOLD, fontWeight: "600" },
});
