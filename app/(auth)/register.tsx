import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Animated, Image,
    ImageBackground, ScrollView, Modal
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, ChevronLeft } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";
const MUTED = "rgba(255,255,255,0.4)";

export default function RegisterScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const [showAlert, setShowAlert] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.95)).current;

    const opacity = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleRegister = async () => {
        if (!fullName || !email || !password) return;
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, phone } },
        });
        setLoading(false);
        if (error) {
            setErrorMsg(error.message);
        } else {
            setShowAlert(true);
        }
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
        ]).start();
    };

    const hideAlertAndGo = () => {
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(alertScale, { toValue: 0.95, duration: 200, useNativeDriver: true })
        ]).start(() => {
            setShowAlert(false);
            router.replace("/(auth)/login");
        });
    };

    return (
        <ImageBackground
            source={require("@/assets/images/auth-bg.png")}
            style={s.bg}
            resizeMode="cover"
        >
            <View style={s.overlay} />

            <SafeAreaView style={s.safe}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={22} color={MUTED} />
                </TouchableOpacity>

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
                            <View style={s.logoArea}>
                                <Image
                                    source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                                    style={s.logo}
                                    resizeMode="contain"
                                />
                                <Text style={s.tagline}>Access without limits.</Text>
                            </View>

                            <View style={s.dividerRow}>
                                <View style={s.dividerLine} />
                                <Text style={s.dividerLabel}>MEMBERSHIP REQUEST</Text>
                                <View style={s.dividerLine} />
                            </View>

                            <View style={s.form}>
                                <View style={[s.inputBlock, nameFocused && s.inputBlockFocused]}>
                                    <Text style={s.inputLabel}>FULL NAME</Text>
                                    <TextInput
                                        style={s.input}
                                        placeholder="e.g. Adaeze Okafor"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        autoCapitalize="words"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        onFocus={() => setNameFocused(true)}
                                        onBlur={() => setNameFocused(false)}
                                        returnKeyType="next"
                                    />
                                </View>

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

                                <View style={[s.inputBlock, phoneFocused && s.inputBlockFocused]}>
                                    <Text style={s.inputLabel}>PHONE</Text>
                                    <TextInput
                                        style={s.input}
                                        placeholder="+234 800 000 0000"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        keyboardType="phone-pad"
                                        value={phone}
                                        onChangeText={setPhone}
                                        onFocus={() => setPhoneFocused(true)}
                                        onBlur={() => setPhoneFocused(false)}
                                        returnKeyType="next"
                                    />
                                </View>

                                <View style={[s.inputBlock, passwordFocused && s.inputBlockFocused]}>
                                    <Text style={s.inputLabel}>PASSWORD</Text>
                                    <View style={s.passwordRow}>
                                        <TextInput
                                            style={[s.input, { flex: 1 }]}
                                            placeholder="min. 8 characters"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={setPassword}
                                            onFocus={() => setPasswordFocused(true)}
                                            onBlur={() => setPasswordFocused(false)}
                                            returnKeyType="done"
                                            onSubmitEditing={handleRegister}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                                            {showPassword
                                                ? <EyeOff size={20} color={MUTED} />
                                                : <Eye size={20} color={MUTED} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[s.btn, loading && s.btnLoading]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                <Text style={s.btnText}>{loading ? "Submitting..." : "Request Access"}</Text>
                            </TouchableOpacity>

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

            <Modal visible={showAlert || !!errorMsg} transparent animationType="none">
                <View style={s.modalOverlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIconWrap, !!errorMsg && s.modalIconWrapError]}>
                            <Text style={[s.modalIconCheck, !!errorMsg && s.modalIconX]}>
                                {errorMsg ? "×" : "✓"}
                            </Text>
                        </View>
                        <Text style={s.modalTitle}>{errorMsg ? "Something went wrong" : "Request Received"}</Text>
                        <Text style={s.modalBody}>
                            {errorMsg || "Welcome to Lapeq. Check your email to verify your account and unlock access."}
                        </Text>
                        <TouchableOpacity
                            style={s.modalBtnPrimary}
                            onPress={errorMsg ? () => {
                                Animated.parallel([
                                    Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                                    Animated.timing(alertScale, { toValue: 0.95, duration: 200, useNativeDriver: true })
                                ]).start(() => setErrorMsg(""));
                            } : hideAlertAndGo}
                        >
                            <Text style={s.modalBtnTxPri}>{errorMsg ? "Try Again" : "Continue to Sign In"}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const s = StyleSheet.create({
    bg: { flex: 1, backgroundColor: DARK },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.78)" },
    safe: { flex: 1 },
    backBtn: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
    kav: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },

    logoArea: { alignItems: "center", marginTop: 8, marginBottom: 36 },
    logo: { width: 72, height: 72, marginBottom: 14 },
    tagline: { fontSize: 16, fontFamily: "PlayfairDisplay_400Regular_Italic", color: MUTED, letterSpacing: 0.3 },

    dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 36 },
    dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
    dividerLabel: { fontSize: 9, fontFamily: "Jost_800ExtraBold", color: GOLD, letterSpacing: 2.5 },

    form: { marginBottom: 32 },
    inputBlock: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
        paddingVertical: 16,
        marginBottom: 8,
    },
    inputBlockFocused: { borderBottomColor: GOLD },
    inputLabel: { fontSize: 10, fontFamily: "Jost_800ExtraBold", color: GOLD, letterSpacing: 2, marginBottom: 12 },
    input: { fontSize: 18, fontFamily: "Jost_400Regular", color: "#fff", paddingVertical: 0 },
    passwordRow: { flexDirection: "row", alignItems: "center" },
    eyeBtn: { paddingLeft: 12 },

    btn: {
        backgroundColor: GOLD,
        borderRadius: 16,
        paddingVertical: 22,
        alignItems: "center",
        marginBottom: 28,
    },
    btnLoading: { opacity: 0.6 },
    btnText: { color: DARK, fontSize: 17, fontFamily: "Jost_800ExtraBold", letterSpacing: 0.8 },

    switchRow: { alignItems: "center" },
    switchText: { fontSize: 13, fontFamily: "Jost_400Regular", color: MUTED },
    switchLink: { color: GOLD, fontFamily: "Jost_600SemiBold" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: "#111", borderRadius: 24, padding: 32, borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", alignItems: "center" },
    modalIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(201,168,76,0.12)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalIconWrapError: { backgroundColor: "rgba(255,60,60,0.12)" },
    modalIconCheck: { color: GOLD, fontSize: 24, fontFamily: "Jost_600SemiBold" },
    modalIconX: { color: "#ff5555", fontSize: 28, fontFamily: "Jost_300Light", lineHeight: 32 },
    modalTitle: { color: "#fff", fontSize: 20, fontFamily: "Jost_700Bold", marginBottom: 10 },
    modalBody: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "Jost_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 28 },
    modalBtnPrimary: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: GOLD, alignItems: "center" },
    modalBtnTxPri: { color: DARK, fontSize: 14, fontFamily: "Jost_700Bold" },
});
