import { showToast } from "@/lib/toast";
import { cleanErr } from "@/lib/cleanErr";
import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Lock, Eye, Trash2, ShieldCheck, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

const DELETE_REASONS = [
    "I'm not using it anymore",
    "I found a better service",
    "Too expensive",
    "Privacy concerns",
    "Technical issues",
    "Other",
];

export default function PrivacyScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reason, setReason] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [isOAuth, setIsOAuth] = useState(false);
    const [userName, setUserName] = useState("");

    const openDeleteModal = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const provider = user.app_metadata?.provider ?? "email";
        setIsOAuth(provider !== "email");
        const name = user.user_metadata?.full_name?.split(" ")[0] || user.user_metadata?.first_name || "";
        setUserName(name);
        setReason("");
        setPassword("");
        setConfirm("");
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!reason) { Alert.alert("Please select a reason"); return; }
        if (confirm !== "DELETE") { Alert.alert("Type DELETE exactly to confirm"); return; }

        if (!isOAuth && !password) { Alert.alert("Please enter your password"); return; }

        setDeleting(true);
        try {
            if (!isOAuth) {
                const { data: { user } } = await supabase.auth.getUser();
                const email = user?.email ?? "";
                const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
                if (authErr) { Alert.alert("Wrong password", "Please try again."); setDeleting(false); return; }
            }

            const { error } = await supabase.rpc("delete_user");
            if (error) throw error;

            await supabase.auth.signOut();
            setShowDeleteModal(false);
            router.replace("/(auth)/sign-in" as any);
        } catch (err: any) {
            showToast(cleanErr(err), "error");
        } finally {
            setDeleting(false);
        }
    };

    const handleChangePassword = () => {
        router.push("/settings/change-password" as any);
    };

    const sections = [
        {
            title: "Security",
            items: [
                {
                    icon: Lock,
                    label: "Change Password",
                    desc: "Update your password directly from here.",
                    action: handleChangePassword,
                    danger: false,
                },
                {
                    icon: Eye,
                    label: "Active Sessions",
                    desc: "You are currently signed in on this device.",
                    action: null,
                    danger: false,
                },
            ],
        },
        {
            title: "Data & Privacy",
            items: [
                {
                    icon: ShieldCheck,
                    label: "Your Data",
                    desc: "Lapeq collects only the information needed to deliver your concierge service. Your data is never sold or shared with third parties.",
                    action: null,
                    danger: false,
                },
                {
                    icon: Trash2,
                    label: "Delete Account",
                    desc: "Permanently remove your account and all associated data.",
                    action: openDeleteModal,
                    danger: true,
                },
            ],
        },
    ];

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Privacy & Security</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 }}>
                {sections.map((section, si) => (
                    <View key={si} style={{ marginBottom: 28 }}>
                        <Text style={s.sectionTitle}>{section.title}</Text>
                        <View style={s.card}>
                            {section.items.map((item, i) => {
                                const Icon = item.icon;
                                const isLast = i === section.items.length - 1;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[s.row, !isLast && s.rowBorder]}
                                        onPress={item.action ?? undefined}
                                        activeOpacity={item.action ? 0.7 : 1}
                                    >
                                        <View style={[s.iconBox, item.danger && s.iconBoxDanger]}>
                                            <Icon size={18} color={item.danger ? "#ef4444" : C.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.rowLabel, item.danger && { color: "#ef4444" }]}>{item.label}</Text>
                                            <Text style={s.rowDesc}>{item.desc}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Delete Account Modal */}
            <Modal visible={showDeleteModal} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        <TouchableOpacity style={s.modalClose} onPress={() => setShowDeleteModal(false)}>
                            <X size={20} color={C.muted} />
                        </TouchableOpacity>

                        <Text style={s.sorryTitle}>
                            Sorry to see you go{userName ? `, ${userName}` : ""}
                        </Text>
                        <Text style={s.sorrySub}>
                            This will permanently delete your account and all your data. This cannot be undone.
                        </Text>

                        <Text style={s.fieldLabel}>Why are you leaving?</Text>
                        <View style={s.reasonGrid}>
                            {DELETE_REASONS.map(r => (
                                <TouchableOpacity
                                    key={r}
                                    style={[s.reasonChip, reason === r && s.reasonChipActive]}
                                    onPress={() => setReason(r)}
                                >
                                    <Text style={[s.reasonChipText, reason === r && s.reasonChipTextActive]}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {!isOAuth && (
                            <>
                                <Text style={s.fieldLabel}>Confirm your password</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor={C.muted}
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </>
                        )}

                        <Text style={s.fieldLabel}>Type <Text style={{ color: "#ef4444", fontWeight: "700" }}>DELETE</Text> to confirm</Text>
                        <TextInput
                            style={s.input}
                            placeholder="DELETE"
                            placeholderTextColor={C.muted}
                            autoCapitalize="characters"
                            value={confirm}
                            onChangeText={setConfirm}
                        />

                        <TouchableOpacity
                            style={[s.deleteBtn, (confirm !== "DELETE" || deleting) && { opacity: 0.5 }]}
                            onPress={handleDelete}
                            disabled={confirm !== "DELETE" || deleting}
                        >
                            {deleting
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.deleteBtnText}>Delete My Account</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={{ marginTop: 12, alignItems: "center" }}>
                            <Text style={{ fontSize: 14, color: C.muted }}>Actually, keep my account</Text>
        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontWeight: "700", color: C.text },
    sectionTitle: { fontSize: 12, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginLeft: 2 },
    card: { backgroundColor: C.surface, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    row: { flexDirection: "row", alignItems: "flex-start", padding: 16, gap: 14 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    iconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: `${C.primary}15`, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
    iconBoxDanger: { backgroundColor: "#fef2f2" },
    rowLabel: { fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 3 },
    rowDesc: { fontSize: 13, color: C.muted, lineHeight: 19 },

    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
    modalSheet: { backgroundColor: C.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48 },
    modalClose: { position: "absolute", top: 20, right: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },

    sorryTitle: { fontSize: 22, fontWeight: "700", color: C.text, textAlign: "center", marginBottom: 8 },
    sorrySub: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20, marginBottom: 24 },

    fieldLabel: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 10 },
    reasonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
    reasonChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    reasonChipActive: { backgroundColor: `${"#ef4444"}18`, borderColor: "#ef4444" },
    reasonChipText: { fontSize: 13, color: C.muted },
    reasonChipTextActive: { color: "#ef4444", fontWeight: "600" },

    input: { backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 20 },

    deleteBtn: { backgroundColor: "#ef4444", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 4 },
    deleteBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
