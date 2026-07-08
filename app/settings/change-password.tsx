import { showToast } from "@/lib/toast";
import { cleanErr } from "@/lib/cleanErr";
import { useState, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff, Lock } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const newRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    const mismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;

    const handleSave = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert("All fields required");
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert("Too short", "New password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Passwords don't match");
            return;
        }
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error("Could not retrieve account.");

            const { error: authErr } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: oldPassword,
            });
            if (authErr) {
                Alert.alert("Incorrect password", "Your current password is wrong. Please try again.");
                setLoading(false);
                return;
            }

            const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
            if (updateErr) throw updateErr;

            Alert.alert("Done", "Your password has been updated.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (e: any) {
            showToast(cleanErr(e), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Change Password</Text>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 12 }}>
                <Text style={s.subtitle}>Enter your current password then choose a new one.</Text>

                {/* Current password */}
                <View style={s.inputRow}>
                    <Lock size={16} color={C.muted} />
                    <TextInput
                        style={s.input}
                        placeholder="Current password"
                        placeholderTextColor={C.muted}
                        secureTextEntry={!showOld}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        autoCapitalize="none"
                        returnKeyType="next"
                        onSubmitEditing={() => newRef.current?.focus()}
                    />
                    <TouchableOpacity onPress={() => setShowOld(v => !v)}>
                        {showOld ? <EyeOff size={18} color={C.muted} /> : <Eye size={18} color={C.muted} />}
                    </TouchableOpacity>
                </View>

                <View style={s.divider} />

                {/* New password */}
                <View style={s.inputRow}>
                    <Lock size={16} color={C.muted} />
                    <TextInput
                        ref={newRef}
                        style={s.input}
                        placeholder="New password"
                        placeholderTextColor={C.muted}
                        secureTextEntry={!showNew}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        autoCapitalize="none"
                        returnKeyType="next"
                        onSubmitEditing={() => confirmRef.current?.focus()}
                    />
                    <TouchableOpacity onPress={() => setShowNew(v => !v)}>
                        {showNew ? <EyeOff size={18} color={C.muted} /> : <Eye size={18} color={C.muted} />}
                    </TouchableOpacity>
                </View>

                {/* Confirm new password */}
                <View style={[s.inputRow, mismatch && { borderColor: "#ef4444" }]}>
                    <Lock size={16} color={mismatch ? "#ef4444" : C.muted} />
                    <TextInput
                        ref={confirmRef}
                        style={s.input}
                        placeholder="Confirm new password"
                        placeholderTextColor={C.muted}
                        secureTextEntry={!showConfirm}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        autoCapitalize="none"
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
                        {showConfirm ? <EyeOff size={18} color={C.muted} /> : <Eye size={18} color={C.muted} />}
                    </TouchableOpacity>
                </View>
                {mismatch && <Text style={s.mismatch}>Passwords don't match</Text>}

                <TouchableOpacity
                    style={[s.saveBtn, loading && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading
                        ? <ActivityIndicator color="#0a0a0a" />
                        : <Text style={s.saveBtnText}>Update Password</Text>
                    }
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontWeight: "700", color: C.text },
    subtitle: { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 6 },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: C.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: C.text,
        fontFamily: "Jost_400Regular",
    },
    divider: {
        height: 1,
        backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        marginVertical: 2,
    },
    mismatch: { fontSize: 12, color: "#ef4444", marginTop: -4 },
    saveBtn: {
        marginTop: 8,
        backgroundColor: C.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
    },
    saveBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0a0a" },
});
