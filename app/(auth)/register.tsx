import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !email || !password) return Alert.alert("Please fill in all required fields");
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, phone } },
        });
        setLoading(false);
        if (error) {
            Alert.alert("Registration failed", error.message);
        } else {
            Alert.alert("Account created", "Check your email to verify your account.");
            router.replace("/(auth)/login");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}>
                    <Text style={styles.brand}>Lapeq</Text>
                    <Text style={styles.title}>Create account</Text>
                    <Text style={styles.subtitle}>Join to access premium concierge services</Text>

                    <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={Colors.muted} value={fullName} onChangeText={setFullName} />
                    <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.muted} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                    <TextInput style={styles.input} placeholder="Phone number (optional)" placeholderTextColor={Colors.muted} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                    <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.muted} secureTextEntry value={password} onChangeText={setPassword} />

                    <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
                        <Text style={styles.btnText}>{loading ? "Creating account..." : "Create Account"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.switchRow}>
                        <Text style={styles.switchText}>Already have an account? <Text style={styles.switchLink}>Sign in</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
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
    btn: { backgroundColor: Colors.black, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.cream, fontSize: 15, fontWeight: "700" },
    switchRow: { marginTop: 24, alignItems: "center", marginBottom: 32 },
    switchText: { fontSize: 13, color: Colors.muted },
    switchLink: { color: Colors.gold, fontWeight: "600" },
});
