import { useState, useEffect } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, View, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react-native";

export default function ResetPasswordScreen() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" || session) {
                setReady(true);
            }
        });
        // Also check if session already exists
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setReady(true);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleUpdate = async () => {
        if (!password || password.length < 8) {
            Alert.alert("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            Alert.alert("Passwords do not match.");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (error) {
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Password updated", "You can now sign in with your new password.", [
                { text: "Sign In", onPress: () => router.replace("/(auth)/login") }
            ]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center" }}>

                <View style={styles.logoArea}>
                    <Image
                        source={require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {error ? (
                    <View style={{ alignItems: "center" }}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => router.replace("/(auth)/forgot-password")} style={styles.btn}>
                            <Text style={styles.btnText}>Request New Link</Text>
                        </TouchableOpacity>
                    </View>
                ) : !ready ? (
                    <View style={{ alignItems: "center" }}>
                        <ActivityIndicator color={Colors.gold} />
                        <Text style={[styles.subtitle, { marginTop: 16, textAlign: "center" }]}>
                            Verifying your reset link...
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.title}>New Password</Text>
                        <Text style={styles.subtitle}>Choose a strong password for your account</Text>

                        <View style={styles.inputWrap}>
                            <TextInput
                                style={styles.inputInner}
                                placeholder="New password"
                                placeholderTextColor={Colors.muted}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                                {showPassword ? <EyeOff size={18} color={Colors.muted} /> : <Eye size={18} color={Colors.muted} />}
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm password"
                            placeholderTextColor={Colors.muted}
                            secureTextEntry={!showPassword}
                            value={confirm}
                            onChangeText={setConfirm}
                            autoCapitalize="none"
                        />

                        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleUpdate} disabled={loading}>
                            <Text style={styles.btnText}>{loading ? "Updating..." : "Update Password"}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream, paddingHorizontal: 24 },
    logoArea: { alignItems: "center", marginBottom: 40 },
    logo: { width: 80, height: 80 },
    title: { fontSize: 26, fontWeight: "700", color: Colors.black, marginBottom: 6 },
    subtitle: { fontSize: 14, color: Colors.muted, marginBottom: 28 },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, marginBottom: 14, paddingRight: 14 },
    inputInner: { flex: 1, padding: 16, fontSize: 14, color: Colors.black },
    input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, fontSize: 14, color: Colors.black, marginBottom: 14 },
    eyeBtn: { padding: 4 },
    btn: { backgroundColor: Colors.black, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.cream, fontSize: 15, fontWeight: "700" },
    errorText: { fontSize: 14, color: "#ef4444", textAlign: "center", marginBottom: 24, lineHeight: 22 },
});
