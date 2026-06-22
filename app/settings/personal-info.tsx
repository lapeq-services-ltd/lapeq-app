import { useEffect, useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, Alert, KeyboardAvoidingView, Platform, Keyboard, Modal, FlatList, Animated, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Camera, User, Phone, MapPin, Crown, Check, ChevronDown, X, Mail, Lock } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { COUNTRIES, STATES_BY_COUNTRY } from "@/constants/location";

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

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [fullName, setFullName] = useState("");
    const [preferredName, setPreferredName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [country, setCountry] = useState("");
    const [region, setRegion] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showStateModal, setShowStateModal] = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const toastAnim = useRef(new Animated.Value(-100)).current;
    const [toastVisible, setToastVisible] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setEmail(user.email ?? "");
        const meta = user.user_metadata ?? {};
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, preferred_name, phone, country, region, avatar_url")
            .eq("id", user.id)
            .single();

        const resolvedName = profile?.full_name || meta.full_name || meta.name || "";
        const resolvedPreferred = profile?.preferred_name || meta.preferred_name || "";
        const resolvedCountry = profile?.country || meta.country || "";
        const resolvedRegion = profile?.region || meta.region || "";

        setFullName(resolvedName);
        setPreferredName(resolvedPreferred);
        setPhone(profile?.phone ?? "");
        setCountry(resolvedCountry);
        setRegion(resolvedRegion);
        const storedUrl = profile?.avatar_url ?? null;
        if (storedUrl) {
            // Refresh signed URL so it works regardless of bucket privacy setting
            const path = `${user.id}/avatar.jpg`;
            const { data: signed } = await supabase.storage
                .from("avatars")
                .createSignedUrl(path, 60 * 60 * 24 * 365);
            setImageUri(signed?.signedUrl ?? storedUrl);
        } else {
            setImageUri(null);
        }
        setLoading(false);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const showToast = () => {
        setToastVisible(true);
        Animated.timing(toastAnim, { toValue: 20, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => {
            Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }).start(() => setToastVisible(false));
        }, 2000);
    };

    const handleSave = async () => {
        if (!fullName.trim()) { Alert.alert("Full name is required."); return; }
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSaving(false); return; }

        let finalAvatarUrl: string | null = imageUri;

        // Upload if it's a new local file (not already a remote URL)
        if (imageUri && !imageUri.startsWith("http")) {
            try {
                const path = `${user.id}/avatar.jpg`;

                const resp = await fetch(imageUri);
                const arrayBuffer = await resp.arrayBuffer();

                const { error: upErr } = await supabase.storage
                    .from("avatars")
                    .upload(path, arrayBuffer, { upsert: true, contentType: "image/jpeg" });

                if (upErr) { setSaving(false); Alert.alert("Upload failed", upErr.message); return; }

                // Use signed URL — works whether the bucket is public or private
                const { data: signed } = await supabase.storage
                    .from("avatars")
                    .createSignedUrl(path, 60 * 60 * 24 * 365);
                finalAvatarUrl = signed?.signedUrl ?? null;

                // Update local state immediately so the image shows without re-navigating
                if (finalAvatarUrl) setImageUri(finalAvatarUrl);
            } catch {
                setSaving(false);
                Alert.alert("Upload failed", "Could not process the photo.");
                return;
            }
        }

        const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            full_name: fullName.trim(),
            preferred_name: preferredName.trim() || null,
            phone: phone.trim() || null,
            country: country || null,
            region: region || null,
            avatar_url: finalAvatarUrl,
        }, { onConflict: "id" });

        setSaving(false);
        if (error) { Alert.alert("Error", error.message); return; }
        showToast();
        setTimeout(() => router.back(), 2400);
    };

    if (loading) {
        return (
            <SafeAreaView style={s.root}>
                <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.root}>
            {toastVisible && (
                <Animated.View style={[s.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
                    <Check size={20} color={C.background} />
                    <Text style={s.toastText}>Profile updated</Text>
                </Animated.View>
            )}

            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Personal Info</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">

                    {/* Avatar */}
                    <View style={s.pfpContainer}>
                        <TouchableOpacity style={s.pfpWrap} onPress={pickImage}>
                            <Image
                                source={imageUri ? { uri: imageUri } : require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                                style={s.pfp}
                                resizeMode="cover"
                                onError={() => setImageUri(null)}
                            />
                            <View style={s.cameraBtn}>
                                <Camera size={16} color={C.background} />
                            </View>
                        </TouchableOpacity>
                        <Text style={s.pfpText} onPress={pickImage}>Change Profile Photo</Text>
                    </View>

                    {/* Full Name */}
                    <View style={s.formGroup}>
                        <Text style={s.label}>Full Name</Text>
                        <View style={s.inputContainer}>
                            <User size={18} color={C.muted} style={s.inputIcon} />
                            <TextInput style={s.input} value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={C.muted} returnKeyType="next" onSubmitEditing={() => Keyboard.dismiss()} />
                        </View>
                    </View>

                    {/* Preferred Name */}
                    <View style={s.formGroup}>
                        <Text style={s.label}>Preferred Name <Text style={s.optional}>(optional)</Text></Text>
                        <View style={s.inputContainer}>
                            <User size={18} color={C.muted} style={s.inputIcon} />
                            <TextInput style={s.input} value={preferredName} onChangeText={setPreferredName} placeholder="What should we call you?" placeholderTextColor={C.muted} returnKeyType="next" onSubmitEditing={() => Keyboard.dismiss()} />
                        </View>
                        <Text style={s.hint}>This is the name used in greetings throughout the app.</Text>
                    </View>

                    {/* Email - read only */}
                    <View style={s.formGroup}>
                        <Text style={s.label}>Email Address</Text>
                        <View style={[s.inputContainer, s.readOnly]}>
                            <Mail size={18} color={C.muted} style={s.inputIcon} />
                            <Text style={[s.input, { color: C.muted }]}>{email}</Text>
                            <Lock size={14} color={C.muted} />
                        </View>
                        <Text style={s.hint}>To change your email, use the Privacy & Security settings.</Text>
                    </View>

                    {/* Phone */}
                    <View style={s.formGroup}>
                        <Text style={s.label}>Phone Number <Text style={s.optional}>(optional)</Text></Text>
                        <View style={s.inputContainer}>
                            <Phone size={18} color={C.muted} style={s.inputIcon} />
                            <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+234 000 000 0000" placeholderTextColor={C.muted} keyboardType="phone-pad" returnKeyType="done" />
                        </View>
                    </View>

                    {/* Country */}
                    <View style={s.formGroup}>
                        <Text style={s.label}>Country</Text>
                        <TouchableOpacity style={s.inputContainer} onPress={() => setShowCountryModal(true)}>
                            <MapPin size={18} color={C.muted} style={s.inputIcon} />
                            <Text style={[s.input, { color: country ? C.text : C.muted }]}>{country || "Select your country"}</Text>
                            <ChevronDown size={18} color={C.muted} />
                        </TouchableOpacity>
                    </View>

                    {/* State / Region */}
                    <View style={s.formGroup}>
                        <Text style={s.label}>State / Region</Text>
                        <TouchableOpacity style={s.inputContainer} onPress={() => setShowStateModal(true)}>
                            <MapPin size={18} color={C.muted} style={s.inputIcon} />
                            <Text style={[s.input, { color: region ? C.text : C.muted }]}>{region || "Select your state or region"}</Text>
                            <ChevronDown size={18} color={C.muted} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={s.tierBtn} onPress={() => router.push("/membership")}>
                        <Crown size={18} color="#0a0a0a" />
                        <Text style={s.tierBtnText}>Manage Membership</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            <View style={s.footer}>
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                    <Text style={s.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
                </TouchableOpacity>
            </View>

            {/* State Modal */}
            <Modal visible={showStateModal} animationType="slide" transparent onRequestClose={() => setShowStateModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Select State</Text>
                            <TouchableOpacity onPress={() => setShowStateModal(false)} style={s.modalCloseBtn}>
                                <X size={22} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={STATES_BY_COUNTRY[country] ?? []}
                            keyExtractor={item => item}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            renderItem={({ item }) => {
                                const displayState = (country === "Nigeria" && isAvailableState(item)) ? item : `${item} (Coming Soon)`;
                                return (
                                    <TouchableOpacity style={[s.listItem, region === item && s.listItemActive]} onPress={() => { setRegion(item); setShowStateModal(false); }}>
                                        <Text style={[s.listText, region === item && s.listTextActive]}>{displayState}</Text>
                                        {region === item && <Check size={18} color={C.primary} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Country Modal */}
            <Modal visible={showCountryModal} animationType="slide" transparent onRequestClose={() => setShowCountryModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Select Country</Text>
                            <TouchableOpacity onPress={() => setShowCountryModal(false)} style={s.modalCloseBtn}>
                                <X size={22} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={COUNTRIES}
                            keyExtractor={item => item.name}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            renderItem={({ item }) => {
                                const displayCountry = item.name === "Nigeria" ? item.name : `${item.name} (Coming Soon)`;
                                return (
                                    <TouchableOpacity style={[s.listItem, country === item.name && s.listItemActive]} onPress={() => { setCountry(item.name); setRegion(""); setShowCountryModal(false); }}>
                                        <Text style={[s.listText, country === item.name && s.listTextActive]}>{displayCountry}</Text>
                                        {country === item.name && <Check size={18} color={C.primary} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
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

    pfpContainer: { alignItems: "center", marginBottom: 32, marginTop: 8 },
    pfpWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.surface, borderWidth: 2, borderColor: C.primary },
    pfp: { width: "100%", height: "100%", borderRadius: 48 },
    cameraBtn: { position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: C.text, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.background },
    pfpText: { fontSize: 14, fontWeight: "600", color: C.primary, marginTop: 10 },

    formGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 8 },
    optional: { color: C.muted, fontWeight: "400" },
    hint: { fontSize: 12, color: C.muted, marginTop: 6, marginLeft: 2 },
    inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca", paddingHorizontal: 14, height: 52 },
    readOnly: { opacity: 0.6 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: C.text },

    tierBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14, backgroundColor: C.primary, marginTop: 8 },
    tierBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0a0a" },

    footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    saveBtn: { borderRadius: 14, paddingVertical: 16, backgroundColor: C.primary, alignItems: "center" },
    saveBtnText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },

    toastContainer: { position: "absolute", top: 60, left: 20, right: 20, backgroundColor: C.text, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, zIndex: 100 },
    toastText: { fontSize: 14, fontWeight: "600", color: C.background },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", padding: 20 },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme === "dark" ? "#2a2a2a" : "#ece8de" },
    modalTitle: { fontSize: 17, fontWeight: "700", color: C.text },
    modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    listItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 10, borderRadius: 10, marginBottom: 4 },
    listItemActive: { backgroundColor: C.surface },
    listText: { fontSize: 15, color: C.text },
    listTextActive: { fontWeight: "700", color: C.primary },
});
