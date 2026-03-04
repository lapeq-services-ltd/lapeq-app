import { useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email) return Alert.alert("Enter your email address");
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        setLoading(false);
        if (error) {
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Email sent", "Check your inbox for the password reset link.");
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center" }}>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>We'll send a reset link to your email</Text>

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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream, paddingHorizontal: 24 },
    title: { fontSize: 28, fontWeight: "700", color: Colors.black, marginBottom: 6 },
    subtitle: { fontSize: 14, color: Colors.muted, marginBottom: 32 },
    input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, fontSize: 14, color: Colors.black, marginBottom: 14 },
    btn: { backgroundColor: Colors.black, borderRadius: 14, padding: 16, alignItems: "center" },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.cream, fontSize: 15, fontWeight: "700" },
    back: { marginTop: 24, alignItems: "center" },
    backText: { fontSize: 13, color: Colors.gold },
});
