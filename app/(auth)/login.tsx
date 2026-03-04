import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert("Please fill in all fields");
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) Alert.alert("Login failed", error.message);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center" }}>
                <Text style={styles.brand}>Lapeq</Text>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={Colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={Colors.muted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
                    <Text style={styles.forgot}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.switchRow}>
                    <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchLink}>Register</Text></Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream, paddingHorizontal: 24 },
    brand: { fontSize: 13, fontWeight: "800", color: Colors.gold, letterSpacing: 3, textTransform: "uppercase", marginBottom: 24 },
    title: { fontSize: 28, fontWeight: "700", color: Colors.black, marginBottom: 6 },
    subtitle: { fontSize: 14, color: Colors.muted, marginBottom: 32 },
    input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, fontSize: 14, color: Colors.black, marginBottom: 14 },
    forgot: { fontSize: 12, color: Colors.gold, textAlign: "right", marginBottom: 24 },
    btn: { backgroundColor: Colors.black, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.cream, fontSize: 15, fontWeight: "700" },
    switchRow: { marginTop: 24, alignItems: "center" },
    switchText: { fontSize: 13, color: Colors.muted },
    switchLink: { color: Colors.gold, fontWeight: "600" },
});
