import { useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async () => {
        if (!email) return Alert.alert("Enter your email address");
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "lapeq://reset-password",
        });
        setLoading(false);
        if (error) {
            Alert.alert("Error", error.message);
        } else {
            setSent(true);
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

                {sent ? (
                    <View style={styles.sentBox}>
                        <Text style={styles.sentTitle}>Check your inbox</Text>
                        <Text style={styles.sentBody}>
                            We've sent a password reset link to{" "}
                            <Text style={{ color: Colors.gold }}>{email}</Text>.
                            {"\n\n"}Open the link on this device to reset your password.
                        </Text>
                        <TouchableOpacity onPress={() => router.back()} style={styles.btn}>
                            <Text style={styles.btnText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Email address"
                            placeholderTextColor={Colors.muted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleReset} disabled={loading}>
                            <Text style={styles.btnText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
                            <Text style={styles.backText}>← Back to login</Text>
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
    input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, fontSize: 14, color: Colors.black, marginBottom: 14 },
    btn: { backgroundColor: Colors.black, borderRadius: 14, padding: 16, alignItems: "center" },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.cream, fontSize: 15, fontWeight: "700" },
    back: { marginTop: 24, alignItems: "center" },
    backText: { fontSize: 13, color: Colors.gold },
    sentBox: { alignItems: "center" },
    sentTitle: { fontSize: 22, fontWeight: "700", color: Colors.black, marginBottom: 12, textAlign: "center" },
    sentBody: { fontSize: 14, color: Colors.muted, textAlign: "center", lineHeight: 22, marginBottom: 32 },
});
