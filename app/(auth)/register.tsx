import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Animated, Image,
    ImageBackground, ScrollView, Modal, FlatList
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, ChevronLeft } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { COUNTRIES, STATES_BY_COUNTRY } from "@/constants/location";
import { ChevronDown } from "lucide-react-native";

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";
const MUTED = "rgba(255,255,255,0.4)";

function getStrength(pwd: string) {
    if (pwd.length === 0) return { level: 0, label: "", color: "transparent" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "#ff5555" };
    if (score <= 3) return { level: 2, label: "Fair", color: "#f0a500" };
    return { level: 3, label: "Strong", color: "#50c878" };
}

export default function RegisterScreen() {
    const router = useRouter();
    const { email: prefillEmail } = useLocalSearchParams<{ email?: string }>();
    const [fullName, setFullName] = useState("");
    const [preferredName, setPreferredName] = useState("");
    const [email, setEmail] = useState(prefillEmail ?? "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const [nameFocused, setNameFocused] = useState(false);
    const [preferredFocused, setPreferredFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmFocused, setConfirmFocused] = useState(false);

    const [country, setCountry] = useState("");
    const [region, setRegion] = useState("");
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);

    const [showAlert, setShowAlert] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.95)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(30)).current;

    const preferredRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();
    }, []);

    const strength = getStrength(password);
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

    const triggerModal = (isError: boolean, msg?: string) => {
        if (isError && msg) setErrorMsg(msg);
        else setShowAlert(true);
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
        ]).start();
    };

    const handleRegister = async () => {
        if (!fullName || !email || !password) return;
        if (password.length < 8) {
            triggerModal(true, "Password must be at least 8 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            triggerModal(true, "Passwords do not match. Please check and try again.");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    preferred_name: preferredName || fullName.split(" ")[0],
                    country,
                    region,
                },
            },
        });
        setLoading(false);
        if (error) {
            const msg = error.message.toLowerCase();
            const isExisting = msg.includes("already registered") || msg.includes("already exists");
            triggerModal(true, isExisting
                ? "An account with this email already exists. Try signing in instead."
                : "Something went wrong on our end. Please try again shortly."
            );
        } else {
            triggerModal(false);
        }
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

    const hideError = () => {
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(alertScale, { toValue: 0.95, duration: 200, useNativeDriver: true })
        ]).start(() => setErrorMsg(""));
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
                                        onSubmitEditing={() => preferredRef.current?.focus()}
                                    />
                                </View>

                                <View style={[s.inputBlock, preferredFocused && s.inputBlockFocused]}>
                                    <Text style={s.inputLabel}>PREFERRED NAME</Text>
                                    <TextInput
                                        ref={preferredRef}
                                        style={s.input}
                                        placeholder="What should we call you?"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        autoCapitalize="words"
                                        value={preferredName}
                                        onChangeText={setPreferredName}
                                        onFocus={() => setPreferredFocused(true)}
                                        onBlur={() => setPreferredFocused(false)}
                                        returnKeyType="next"
                                        onSubmitEditing={() => emailRef.current?.focus()}
                                    />
                                </View>

                                <View style={[s.inputBlock, emailFocused && s.inputBlockFocused]}>
                                    <Text style={s.inputLabel}>EMAIL</Text>
                                    <TextInput
                                        ref={emailRef}
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
                                        onSubmitEditing={() => passwordRef.current?.focus()}
                                    />
                                </View>

                                <TouchableOpacity style={s.inputBlock} onPress={() => setShowCountryModal(true)}>
                                    <Text style={s.inputLabel}>COUNTRY</Text>
                                    <View style={s.pickerRow}>
                                        <Text style={[s.input, { flex: 1, color: country ? "#fff" : "rgba(255,255,255,0.2)" }]}>
                                            {country ? country : "Select your country"}
                                        </Text>
                                        <ChevronDown size={18} color="rgba(255,255,255,0.3)" />
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={s.inputBlock}
                                    onPress={() => country ? setShowRegionModal(true) : null}
                                    disabled={!country}
                                >
                                    <Text style={s.inputLabel}>STATE / REGION</Text>
                                    <View style={s.pickerRow}>
                                        <Text style={[s.input, { flex: 1, color: region ? "#fff" : "rgba(255,255,255,0.2)" }]}>
                                            {region || (country ? "Select your state or region" : "Select a country first")}
                                        </Text>
                                        <ChevronDown size={18} color="rgba(255,255,255,0.3)" />
                                    </View>
                                </TouchableOpacity>

                                <View style={[s.inputBlock, passwordFocused && s.inputBlockFocused]}>
                                    <Text style={s.inputLabel}>PASSWORD</Text>
                                    <View style={s.passwordRow}>
                                        <TextInput
                                            ref={passwordRef}
                                            style={[s.input, { flex: 1 }]}
                                            placeholder="min. 8 characters"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={setPassword}
                                            onFocus={() => setPasswordFocused(true)}
                                            onBlur={() => setPasswordFocused(false)}
                                            returnKeyType="next"
                                            onSubmitEditing={() => confirmRef.current?.focus()}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                                            {showPassword ? <EyeOff size={20} color={MUTED} /> : <Eye size={20} color={MUTED} />}
                                        </TouchableOpacity>
                                    </View>
                                    {password.length > 0 && confirmPassword.length === 0 && (
                                        <View style={s.strengthWrap}>
                                            <View style={s.strengthTrack}>
                                                <View style={{ flex: strength.level, backgroundColor: strength.color, height: 2, borderRadius: 99 }} />
                                                <View style={{ flex: 3 - strength.level }} />
                                            </View>
                                            <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={[s.inputBlock, confirmFocused && s.inputBlockFocused, passwordsMismatch && s.inputBlockError]}>
                                    <Text style={s.inputLabel}>CONFIRM PASSWORD</Text>
                                    <View style={s.passwordRow}>
                                        <TextInput
                                            ref={confirmRef}
                                            style={[s.input, { flex: 1 }]}
                                            placeholder="re-enter password"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            secureTextEntry={!showConfirm}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            onFocus={() => setConfirmFocused(true)}
                                            onBlur={() => setConfirmFocused(false)}
                                            returnKeyType="done"
                                            onSubmitEditing={handleRegister}
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={s.eyeBtn}>
                                            {showConfirm ? <EyeOff size={20} color={MUTED} /> : <Eye size={20} color={MUTED} />}
                                        </TouchableOpacity>
                                    </View>
                                    {passwordsMismatch && (
                                        <Text style={s.mismatchText}>Passwords do not match</Text>
                                    )}
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
                        <Text style={s.modalTitle}>{errorMsg ? "Oops, try again" : "Request Received"}</Text>
                        <Text style={s.modalBody}>
                            {errorMsg || "Welcome to Lapeq. Check your email to verify your account and unlock access."}
                        </Text>
                        <TouchableOpacity
                            style={s.modalBtnPrimary}
                            onPress={errorMsg ? hideError : hideAlertAndGo}
                        >
                            <Text style={s.modalBtnTxPri}>{errorMsg ? "Try Again" : "Continue to Sign In"}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            <Modal visible={showCountryModal} animationType="slide" transparent onRequestClose={() => setShowCountryModal(false)}>
                <View style={s.pickerOverlay}>
                    <View style={s.pickerSheet}>
                        <View style={s.pickerHeader}>
                            <Text style={s.pickerTitle}>Select Country</Text>
                            <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                                <Text style={s.pickerClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={COUNTRIES}
                            keyExtractor={item => item.name}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[s.pickerItem, country === item.name && s.pickerItemActive]}
                                    onPress={() => { setCountry(item.name); setRegion(""); setShowCountryModal(false); }}
                                >
                                    <Text style={[s.pickerItemText, country === item.name && s.pickerItemTextActive]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={showRegionModal} animationType="slide" transparent onRequestClose={() => setShowRegionModal(false)}>
                <View style={s.pickerOverlay}>
                    <View style={s.pickerSheet}>
                        <View style={s.pickerHeader}>
                            <Text style={s.pickerTitle}>Select State / Region</Text>
                            <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                                <Text style={s.pickerClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={STATES_BY_COUNTRY[country] ?? []}
                            keyExtractor={item => item}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[s.pickerItem, region === item && s.pickerItemActive]}
                                    onPress={() => { setRegion(item); setShowRegionModal(false); }}
                                >
                                    <Text style={[s.pickerItemText, region === item && s.pickerItemTextActive]}>{item}</Text>
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
    inputBlockError: { borderBottomColor: "#ff5555" },
    inputLabel: { fontSize: 10, fontFamily: "Jost_800ExtraBold", color: GOLD, letterSpacing: 2, marginBottom: 12 },
    input: { fontSize: 18, fontFamily: "Jost_400Regular", color: "#fff", paddingVertical: 0 },
    passwordRow: { flexDirection: "row", alignItems: "center" },
    pickerRow: { flexDirection: "row", alignItems: "center" },
    eyeBtn: { paddingLeft: 12 },

    strengthWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
    strengthTrack: { flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" },
    strengthFill: { height: "100%", borderRadius: 99 },
    strengthLabel: { fontSize: 10, fontFamily: "Jost_600SemiBold", letterSpacing: 0.5 },

    mismatchText: { fontSize: 11, fontFamily: "Jost_400Regular", color: "#ff5555", marginTop: 6 },

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

    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    pickerSheet: { backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "75%", padding: 24, borderTopWidth: 1, borderColor: "rgba(201,168,76,0.2)" },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
    pickerTitle: { fontSize: 16, fontFamily: "Jost_700Bold", color: "#fff" },
    pickerClose: { fontSize: 20, color: MUTED, fontFamily: "Jost_300Light" },
    pickerItem: { paddingVertical: 14, paddingHorizontal: 8, borderRadius: 10, marginBottom: 2 },
    pickerItemActive: { backgroundColor: "rgba(201,168,76,0.1)" },
    pickerItemText: { fontSize: 16, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.7)" },
    pickerItemTextActive: { color: GOLD, fontFamily: "Jost_600SemiBold" },
});
