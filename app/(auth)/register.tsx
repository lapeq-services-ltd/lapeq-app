import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Animated, Image,
    ImageBackground, ScrollView, Modal, FlatList, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, ChevronLeft, ChevronDown } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { COUNTRIES, STATES_BY_COUNTRY } from "@/constants/location";
import Svg, { Path } from "react-native-svg";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";

const GOLD = "#c9a84c";
const DARK = "#0a0a0a";
const MUTED = "rgba(255,255,255,0.4)";
const CARD = "rgba(255,255,255,0.10)";
const BORDER = "rgba(255,255,255,0.09)";
const BORDER_ACTIVE = "rgba(201,168,76,0.5)";
const isAndroid = Platform.OS === "android";

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

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const isAvailableState = (stateName: string) => {
    const normalized = stateName.toLowerCase();
    return normalized.includes("abuja") || 
           normalized.includes("lagos") || 
           normalized.includes("rivers") || 
           normalized.includes("port harcourt") || 
           normalized.includes("ph") || 
           normalized.includes("akwa ibom") || 
           normalized.includes("akwa-ibom") || 
           normalized.includes("kano");
};

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

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState(prefillEmail ?? "");
    const [phone, setPhone] = useState("");
    const [dialCode, setDialCode] = useState(DIAL_CODES[0]);
    const [gender, setGender] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [country, setCountry] = useState("");
    const [region, setRegion] = useState("");
    const [loading, setLoading] = useState(false);

    const [firstNameFocused, setFirstNameFocused] = useState(false);
    const [lastNameFocused, setLastNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmFocused, setConfirmFocused] = useState(false);

    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
    const [otpVerified, setOtpVerified] = useState(false);
    const otpRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));

    const [showDialModal, setShowDialModal] = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);

    const [showAlert, setShowAlert] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.95)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(30)).current;

    const lastNameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const phoneRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();
    }, []);

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

    const strength = getStrength(password);
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
    const selectedCountry = COUNTRIES.find(c => c.name === country);

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

    const triggerModal = (isError: boolean, msg?: string) => {
        if (isError && msg) setErrorMsg(msg);
        else setShowAlert(true);
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    };

    const handleGoogleSignIn = async () => {
        // Native Google Sign-In doesn't work in Expo Go — requires a real build
        const isExpoGo = Constants.executionEnvironment === "storeClient";
        if (isExpoGo) {
            Alert.alert(
                "Google Sign-In",
                "Google Sign-In is available in the full Lapeq app. Please download it from the App Store or TestFlight."
            );
            return;
        }

        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;

            if (!idToken) throw new Error("No ID token returned from Google.");

            const { error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: idToken,
            });
            if (error) throw error;
        } catch (e: any) {
            if (e.code === statusCodes.SIGN_IN_CANCELLED) {
                // User cancelled — do nothing
            } else if (e.code === statusCodes.IN_PROGRESS) {
                // Already signing in — do nothing
            } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert("Google Sign-In", "Google Play Services not available on this device.");
            } else {
                Alert.alert("Google Sign-In", e.message || "Something went wrong.");
            }
        }
    };

    const handleRegister = async () => {
        if (!firstName || !email || !password) return;
        if (password.length < 8) { triggerModal(true, "Password must be at least 8 characters long."); return; }
        if (password !== confirmPassword) { triggerModal(true, "Passwords do not match. Please check and try again."); return; }
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { first_name: firstName.trim(), last_name: lastName.trim(), country, region, gender },
            },
        });
        if (error) {
            setLoading(false);
            const msg = error.message.toLowerCase();
            const isExisting = msg.includes("already registered") || msg.includes("already exists");
            triggerModal(true, isExisting ? "An account with this email already exists. Try signing in instead." : error.message);
            return;
        }
        if (data.user) {
            await supabase.from("profiles").upsert({
                id: data.user.id,
                full_name: fullName,
                preferred_name: firstName.trim(),
                country,
                region,
                gender,
                phone: phone.trim() ? `${dialCode.code}${phone.trim()}` : null,
            }, { onConflict: "id" });
            await supabase.from("notifications").insert({
                user_id: data.user.id,
                title: "Welcome to Lapeq",
                body: "Your account is ready. Your concierge is standing by - explore the app and make your first request.",
                read: false,
            });
        }
        setLoading(false);
        triggerModal(false);
    };

    const hideAlertAndGo = () => {
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(alertScale, { toValue: 0.95, duration: 200, useNativeDriver: true }),
        ]).start(() => { setShowAlert(false); router.replace("/(auth)/login"); });
    };

    const hideError = () => {
        Animated.parallel([
            Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(alertScale, { toValue: 0.95, duration: 200, useNativeDriver: true }),
        ]).start(() => setErrorMsg(""));
    };

    return (
        <ImageBackground source={require("@/assets/images/auth-bg.png")} style={s.bg} resizeMode="cover">
            <View style={s.overlay} />

            <SafeAreaView style={s.safe}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={22} color={MUTED} />
                </TouchableOpacity>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.kav}>
                    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <Animated.View style={{ opacity, transform: [{ translateY: slideUp }] }}>

                            <View style={s.logoArea}>
                                <Image
                                    source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                                    style={s.logo}
                                    resizeMode="contain"
                                />
                                <Text style={s.tagline}>Access without limits.</Text>
                            </View>

                            <View style={s.socialRow}>
                                <TouchableOpacity style={s.socialBtn} onPress={() => {}} activeOpacity={0.8}>
                                    <AppleIcon size={19} />
                                    <Text style={s.socialText}>Apple</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.socialBtn} onPress={handleGoogleSignIn} activeOpacity={0.8}>
                                    <GoogleIcon size={19} />
                                    <Text style={s.socialText}>Google</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={s.dividerRow}>
                                <View style={s.dividerLineAlt} />
                                <Text style={s.dividerText}>or fill in your details</Text>
                                <View style={s.dividerLineAlt} />
                            </View>

                            <View style={s.form}>

                                {/* First + Last name - side by side */}
                                <View style={s.twoCol}>
                                    <View style={[s.fieldWrap, s.colHalf]}>
                                        <Text style={s.inputLabel}>FIRST NAME</Text>
                                        <View style={[s.inputBlock, firstNameFocused && s.inputBlockFocused]}>
                                            <TextInput
                                                style={s.input}
                                                placeholder="Adaeze"
                                                placeholderTextColor="rgba(255,255,255,0.2)"
                                                autoCapitalize="words"
                                                value={firstName}
                                                onChangeText={setFirstName}
                                                onFocus={() => setFirstNameFocused(true)}
                                                onBlur={() => setFirstNameFocused(false)}
                                                returnKeyType="next"
                                                onSubmitEditing={() => lastNameRef.current?.focus()}
                                            />
                                        </View>
                                    </View>
                                    <View style={[s.fieldWrap, s.colHalf]}>
                                        <Text style={s.inputLabel}>LAST NAME</Text>
                                        <View style={[s.inputBlock, lastNameFocused && s.inputBlockFocused]}>
                                            <TextInput
                                                ref={lastNameRef}
                                                style={s.input}
                                                placeholder="Okafor"
                                                placeholderTextColor="rgba(255,255,255,0.2)"
                                                autoCapitalize="words"
                                                value={lastName}
                                                onChangeText={setLastName}
                                                onFocus={() => setLastNameFocused(true)}
                                                onBlur={() => setLastNameFocused(false)}
                                                returnKeyType="next"
                                                onSubmitEditing={() => emailRef.current?.focus()}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Email */}
                                <View style={s.fieldWrap}>
                                    <Text style={s.inputLabel}>EMAIL</Text>
                                    <View style={[s.inputBlock, emailFocused && s.inputBlockFocused]}>
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
                                            onSubmitEditing={() => phoneRef.current?.focus()}
                                        />
                                    </View>
                                </View>

                                {/* Phone number */}
                                <View style={s.fieldWrap}>
                                    <Text style={s.inputLabel}>PHONE NUMBER</Text>
                                    <View style={[s.inputBlock, phoneFocused && s.inputBlockFocused]}>
                                        <View style={s.phoneRow}>
                                            <TouchableOpacity style={s.dialBtn} onPress={() => setShowDialModal(true)}>
                                                <Text style={s.dialFlag}>{dialCode.flag}</Text>
                                                <Text style={s.dialCodeText}>{dialCode.code}</Text>
                                                <ChevronDown size={13} color={MUTED} />
                                            </TouchableOpacity>
                                            <View style={s.dialDivider} />
                                            <TextInput
                                                ref={phoneRef}
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

                                {/* Country + State - side by side */}
                                <View style={s.twoCol}>
                                    <View style={[s.fieldWrap, s.colHalf]}>
                                        <Text style={s.inputLabel}>COUNTRY</Text>
                                        <TouchableOpacity style={s.inputBlock} onPress={() => setShowCountryModal(true)}>
                                            <View style={s.pickerRow}>
                                                {selectedCountry
                                                    ? <Text style={s.flagText}>{selectedCountry.flag}  </Text>
                                                    : null
                                                }
                                                <Text style={[s.input, { flex: 1, color: country ? "#fff" : "rgba(255,255,255,0.2)" }]} numberOfLines={1}>
                                                    {country || "Select"}
                                                </Text>
                                                <ChevronDown size={14} color="rgba(255,255,255,0.3)" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[s.fieldWrap, s.colHalf]}>
                                        <Text style={[s.inputLabel, !country && { opacity: 0.35 }]}>STATE</Text>
                                        <TouchableOpacity
                                            style={[s.inputBlock, !country && { opacity: 0.45 }]}
                                            onPress={() => country ? setShowRegionModal(true) : null}
                                            disabled={!country}
                                        >
                                            <View style={s.pickerRow}>
                                                <Text style={[s.input, { flex: 1, color: region ? "#fff" : "rgba(255,255,255,0.2)" }]} numberOfLines={1}>
                                                    {region || "Select"}
                                                </Text>
                                                <ChevronDown size={14} color="rgba(255,255,255,0.3)" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Gender pills */}
                                <View style={s.fieldWrap}>
                                    <Text style={s.inputLabel}>GENDER</Text>
                                    <View style={s.genderRow}>
                                        {GENDERS.map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[s.genderPill, gender === g && s.genderPillActive]}
                                                onPress={() => setGender(g)}
                                            >
                                                <Text style={[s.genderText, gender === g && s.genderTextActive]}>{g}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Password */}
                                <View style={s.fieldWrap}>
                                    <Text style={s.inputLabel}>PASSWORD</Text>
                                    <View style={[s.inputBlock, passwordFocused && s.inputBlockFocused]}>
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
                                                {showPassword ? <EyeOff size={18} color={MUTED} /> : <Eye size={18} color={MUTED} />}
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
                                </View>

                                {/* Confirm password */}
                                <View style={s.fieldWrap}>
                                    <Text style={s.inputLabel}>CONFIRM PASSWORD</Text>
                                    <View style={[s.inputBlock, confirmFocused && s.inputBlockFocused, passwordsMismatch && s.inputBlockError]}>
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
                                                {showConfirm ? <EyeOff size={18} color={MUTED} /> : <Eye size={18} color={MUTED} />}
                                            </TouchableOpacity>
                                        </View>
                                        {passwordsMismatch && <Text style={s.mismatchText}>Passwords do not match</Text>}
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
                                    Already a member?{"  "}<Text style={s.switchLink}>Sign In</Text>
                                </Text>
                            </TouchableOpacity>

                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Success / Error modal */}
            <Modal visible={showAlert || !!errorMsg} transparent animationType="none">
                <View style={s.modalOverlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIconWrap, !!errorMsg && s.modalIconWrapError]}>
                            <Text style={[s.modalIconCheck, !!errorMsg && s.modalIconX]}>{errorMsg ? "×" : "✓"}</Text>
                        </View>
                        <Text style={s.modalTitle}>{errorMsg ? "Oops, try again" : "Request Received"}</Text>
                        <Text style={s.modalBody}>
                            {errorMsg || "Welcome to Lapeq. Check your email to verify your account and unlock access."}
                        </Text>
                        <TouchableOpacity style={s.modalBtnPrimary} onPress={errorMsg ? hideError : hideAlertAndGo}>
                            <Text style={s.modalBtnTxPri}>{errorMsg ? "Try Again" : "Continue to Sign In"}</Text>
                        </TouchableOpacity>
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
                                    <Text style={[s.pickerItemText, dialCode.name === item.name && s.pickerItemTextActive]}>{item.name}</Text>
                                    <Text style={s.pickerCode}>{item.code}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Country picker */}
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
                            renderItem={({ item }) => {
                                const displayCountry = item.name === "Nigeria" ? item.name : `${item.name} (Coming Soon)`;
                                return (
                                    <TouchableOpacity
                                        style={[s.pickerItem, country === item.name && s.pickerItemActive]}
                                        onPress={() => { setCountry(item.name); setRegion(""); setShowCountryModal(false); }}
                                    >
                                        <Text style={s.pickerFlag}>{item.flag}</Text>
                                        <Text style={[s.pickerItemText, country === item.name && s.pickerItemTextActive]}>{displayCountry}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Region picker */}
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
                            renderItem={({ item }) => {
                                const displayState = (country === "Nigeria" && isAvailableState(item)) ? item : `${item} (Coming Soon)`;
                                return (
                                    <TouchableOpacity
                                        style={[s.pickerItem, region === item && s.pickerItemActive]}
                                        onPress={() => { setRegion(item); setShowRegionModal(false); }}
                                    >
                                        <Text style={[s.pickerItemText, region === item && s.pickerItemTextActive]}>{displayState}</Text>
                                    </TouchableOpacity>
                                );
                            }}
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
    scroll: { flexGrow: 1, paddingHorizontal: isAndroid ? 20 : 26, paddingBottom: 48 },

    logoArea: { alignItems: "center", marginTop: 8, marginBottom: isAndroid ? 22 : 28 },
    logo: { width: isAndroid ? 58 : 70, height: isAndroid ? 58 : 70, marginBottom: 12 },
    tagline: { fontSize: isAndroid ? 13 : 15, fontFamily: "PlayfairDisplay_400Regular_Italic", color: MUTED, letterSpacing: 0.3 },

    sectionDivider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: isAndroid ? 22 : 26 },
    dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
    dividerLabel: { fontSize: 9, fontFamily: "Jost_800ExtraBold", color: GOLD, letterSpacing: 2.5 },

    form: { gap: isAndroid ? 12 : 16, marginBottom: isAndroid ? 20 : 26 },
    fieldWrap: { gap: isAndroid ? 5 : 6 },
    twoCol: { flexDirection: "row", gap: isAndroid ? 10 : 12 },
    colHalf: { flex: 1 },

    inputBlock: {
        borderWidth: 1, borderColor: BORDER, borderRadius: 14,
        backgroundColor: CARD, paddingHorizontal: 14,
        paddingVertical: isAndroid ? 12 : 14,
    },
    inputBlockFocused: { borderColor: BORDER_ACTIVE, backgroundColor: "rgba(201,168,76,0.06)" },
    inputBlockError: { borderColor: "#ff5555" },
    inputLabel: { fontSize: 10, fontFamily: "Jost_800ExtraBold", color: GOLD, letterSpacing: 2 },
    input: { fontSize: isAndroid ? 13 : 15, fontFamily: "Jost_400Regular", color: "#fff", paddingVertical: 0 },
    passwordRow: { flexDirection: "row", alignItems: "center" },
    pickerRow: { flexDirection: "row", alignItems: "center" },
    flagText: { fontSize: isAndroid ? 14 : 16 },
    eyeBtn: { paddingLeft: 10 },

    // Phone
    phoneRow: { flexDirection: "row", alignItems: "center" },
    dialBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingRight: 10 },
    dialFlag: { fontSize: isAndroid ? 16 : 18 },
    dialCodeText: { fontSize: isAndroid ? 12 : 14, fontFamily: "Jost_500Medium", color: "#fff" },
    dialDivider: { width: 1, height: 18, backgroundColor: BORDER },
    sendBtn: {
        backgroundColor: GOLD, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: isAndroid ? 4 : 5, marginLeft: 8,
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText: { color: DARK, fontSize: 11, fontFamily: "Jost_700Bold", letterSpacing: 0.4 },
    verifiedCheck: { color: "#50c878", fontSize: 18, fontFamily: "Jost_600SemiBold", marginLeft: 8 },

    // OTP
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

    // Gender
    genderRow: { flexDirection: "row", flexWrap: "wrap", gap: isAndroid ? 7 : 9 },
    genderPill: {
        paddingHorizontal: isAndroid ? 13 : 15, paddingVertical: isAndroid ? 8 : 10,
        borderRadius: 99, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
    },
    genderPillActive: { borderColor: GOLD, backgroundColor: "rgba(201,168,76,0.12)" },
    genderText: { fontSize: isAndroid ? 11 : 12, fontFamily: "Jost_500Medium", color: MUTED },
    genderTextActive: { color: GOLD, fontFamily: "Jost_600SemiBold" },

    // Strength
    strengthWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
    strengthTrack: { flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" },
    strengthLabel: { fontSize: 10, fontFamily: "Jost_600SemiBold", letterSpacing: 0.5 },
    mismatchText: { fontSize: 11, fontFamily: "Jost_400Regular", color: "#ff5555", marginTop: 6 },

    btn: {
        backgroundColor: GOLD, borderRadius: 16,
        paddingVertical: isAndroid ? 14 : 18, alignItems: "center",
        marginBottom: isAndroid ? 18 : 24,
    },
    btnLoading: { opacity: 0.6 },
    btnText: { color: DARK, fontSize: isAndroid ? 14 : 16, fontFamily: "Jost_800ExtraBold", letterSpacing: 0.8 },

    // Social
    dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: isAndroid ? 14 : 18 },
    dividerLineAlt: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
    dividerText: { fontSize: 12, fontFamily: "Jost_400Regular", color: MUTED },
    socialRow: { flexDirection: "row", gap: 12, marginBottom: isAndroid ? 20 : 28 },
    socialBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 10, paddingVertical: isAndroid ? 12 : 16, borderRadius: 16,
        borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
    },
    socialText: { fontSize: isAndroid ? 13 : 14, fontFamily: "Jost_600SemiBold", color: "#fff" },

    switchRow: { alignItems: "center" },
    switchText: { fontSize: 13, fontFamily: "Jost_400Regular", color: MUTED },
    switchLink: { color: GOLD, fontFamily: "Jost_600SemiBold" },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: "#111", borderRadius: 24, padding: 32, borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", alignItems: "center" },
    modalIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#1e1e1e", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    modalIconWrapError: { backgroundColor: "#1e1e1e" },
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
    pickerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 8, borderRadius: 10, marginBottom: 2 },
    pickerItemActive: { backgroundColor: "#1e1e1e" },
    pickerFlag: { fontSize: 20, marginRight: 12 },
    pickerItemText: { flex: 1, fontSize: 15, fontFamily: "Jost_400Regular", color: "rgba(255,255,255,0.7)" },
    pickerItemTextActive: { color: GOLD, fontFamily: "Jost_600SemiBold" },
    pickerCode: { fontSize: 14, fontFamily: "Jost_500Medium", color: MUTED },
});
