import { useEffect, useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, Alert, KeyboardAvoidingView, Platform, Keyboard, Modal, FlatList, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Camera, User, Mail, Phone, MapPin, Crown, Check, ChevronDown, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
    "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
    "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
    "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const COUNTRIES = [
    { name: "Nigeria", flag: "🇳🇬" },
    { name: "United Kingdom", flag: "🇬🇧" },
    { name: "United States", flag: "🇺🇸" },
    { name: "Canada", flag: "🇨🇦" },
    { name: "Ghana", flag: "🇬🇭" },
    { name: "South Africa", flag: "🇿🇦" },
    { name: "Kenya", flag: "🇰🇪" },
    { name: "United Arab Emirates", flag: "🇦🇪" },
    { name: "France", flag: "🇫🇷" },
    { name: "Germany", flag: "🇩🇪" }
];

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const [name, setName] = useState("Nife");
    const [email, setEmail] = useState("nife@example.com");
    const [phone, setPhone] = useState("+234 800 123 4567");
    const [country, setCountry] = useState("Nigeria");
    const [state, setState] = useState("Lagos");
    const [imageUri, setImageUri] = useState<string | null>(null);

    const [showStateModal, setShowStateModal] = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const toastAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await AsyncStorage.getItem("personal_info");
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.name) setName(parsed.name);
                if (parsed.email) setEmail(parsed.email);
                if (parsed.phone) setPhone(parsed.phone);
                if (parsed.country) setCountry(parsed.country);
                if (parsed.state) setState(parsed.state);
                if (parsed.imageUri) setImageUri(parsed.imageUri);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        try {
            await AsyncStorage.setItem("personal_info", JSON.stringify({
                name, email, phone, country, state, imageUri
            }));

            setToastVisible(true);
            Animated.timing(toastAnim, { toValue: 20, duration: 300, useNativeDriver: true }).start();

            setTimeout(() => {
                Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }).start(() => {
                    setToastVisible(false);
                    router.back();
                });
            }, 2000);

        } catch (error) {
            Alert.alert("Error", "Could not save your data");
        }
    };

    return (
        <SafeAreaView style={s.root}>
            {toastVisible && (
                <Animated.View style={[s.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
                    <Check size={24} color={C.background} />
                    <Text style={s.toastText}>Profile saved successfully</Text>
                </Animated.View>
            )}

            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={32} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Personal Info</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                    <View style={s.pfpContainer}>
                        <TouchableOpacity style={s.pfpWrap} onPress={pickImage}>
                            <Image
                                source={imageUri ? { uri: imageUri } : require("@/assets/logo/Gemini_Generated_Image_ht0yyyht0yyyht0y-removebg-preview.png")}
                                style={s.pfp}
                                resizeMode="cover"
                            />
                            <View style={s.cameraBtn}>
                                <Camera size={18} color={C.background} />
                            </View>
                        </TouchableOpacity>
                        <Text style={s.pfpText} onPress={pickImage}>Change Profile Photo</Text>
                    </View>

                    <View style={s.formGroup}>
                        <Text style={s.label}>Full Name</Text>
                        <View style={s.inputContainer}>
                            <User size={20} color={C.muted} style={s.inputIcon} />
                            <TextInput
                                style={s.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={C.muted}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                        </View>
                    </View>

                    <View style={s.formGroup}>
                        <Text style={s.label}>Email Address</Text>
                        <View style={s.inputContainer}>
                            <Mail size={20} color={C.muted} style={s.inputIcon} />
                            <TextInput
                                style={s.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                placeholderTextColor={C.muted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                        </View>
                    </View>

                    <View style={s.formGroup}>
                        <Text style={s.label}>Phone Number</Text>
                        <View style={s.inputContainer}>
                            <Phone size={20} color={C.muted} style={s.inputIcon} />
                            <TextInput
                                style={s.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter your phone number"
                                placeholderTextColor={C.muted}
                                keyboardType="phone-pad"
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                        </View>
                    </View>

                    <View style={s.formGroup}>
                        <Text style={s.label}>Country</Text>
                        <TouchableOpacity style={s.inputContainer} onPress={() => setShowCountryModal(true)}>
                            <MapPin size={20} color={C.muted} style={s.inputIcon} />
                            <Text style={[s.input, { height: 'auto', color: country ? C.text : C.muted }]}>
                                {country ? `${COUNTRIES.find(c => c.name === country)?.flag || ""} ${country}`.trim() : "Select your Country"}
                            </Text>
                            <ChevronDown size={20} color={C.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={s.formGroup}>
                        <Text style={s.label}>State / Region</Text>
                        <TouchableOpacity style={s.inputContainer} onPress={() => setShowStateModal(true)}>
                            <MapPin size={20} color={C.muted} style={s.inputIcon} />
                            <Text style={[s.input, { height: 'auto', color: state ? C.text : C.muted }]}>
                                {state || "Select your State or Region"}
                            </Text>
                            <ChevronDown size={20} color={C.muted} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={s.tierBtn} onPress={() => router.push("/membership")}>
                        <Crown size={20} color={C.black} />
                        <Text style={s.tierBtnText}>Manage Subscription</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            <View style={s.footer}>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                    <Text style={s.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showStateModal} animationType="slide" transparent={true} onRequestClose={() => setShowStateModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Select State</Text>
                            <TouchableOpacity onPress={() => setShowStateModal(false)} style={s.modalCloseBtn}>
                                <X size={24} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={NIGERIAN_STATES}
                            keyExtractor={(item) => item}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[s.stateItem, state === item && s.stateItemActive]}
                                    onPress={() => {
                                        setState(item);
                                        setShowStateModal(false);
                                    }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                        <MapPin size={18} color={state === item ? C.primary : C.muted} />
                                        <Text style={[s.stateText, state === item && s.stateTextActive]}>{item}</Text>
                                    </View>
                                    {state === item && <Check size={20} color={C.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={showCountryModal} animationType="slide" transparent={true} onRequestClose={() => setShowCountryModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Select Country</Text>
                            <TouchableOpacity onPress={() => setShowCountryModal(false)} style={s.modalCloseBtn}>
                                <X size={24} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={COUNTRIES}
                            keyExtractor={(item) => item.name}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[s.stateItem, country === item.name && s.stateItemActive]}
                                    onPress={() => {
                                        setCountry(item.name);
                                        setShowCountryModal(false);
                                    }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                        <MapPin size={18} color={country === item.name ? C.primary : C.muted} />
                                        <Text style={[s.stateText, country === item.name && s.stateTextActive]}>{item.flag} {item.name}</Text>
                                    </View>
                                    {country === item.name && <Check size={20} color={C.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: C.text },

    pfpContainer: { alignItems: "center", marginBottom: 32, marginTop: 12 },
    pfpWrap: { position: "relative", width: 100, height: 100, borderRadius: 50, backgroundColor: C.surface, borderWidth: 3, borderColor: C.primary },
    pfp: { width: "100%", height: "100%", borderRadius: 50 },
    cameraBtn: { position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: C.text, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: C.background },
    pfpText: { fontSize: 15, fontWeight: "600", color: C.primary, marginTop: 12 },

    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 8, marginLeft: 4 },
    inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, height: 52 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: C.text, height: "100%" },

    tierBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 18, borderRadius: 16, backgroundColor: C.primary, marginTop: 12 },
    tierBtnText: { fontSize: 16, fontWeight: "700", color: C.black },

    footer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.border },
    saveBtn: { borderRadius: 20, paddingVertical: 18, backgroundColor: C.primary, alignItems: "center" },
    saveBtnText: { fontSize: 18, fontWeight: "700", color: C.black },

    toastContainer: { position: "absolute", top: 60, left: 20, right: 20, backgroundColor: C.primary, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 100, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
    toastText: { fontSize: 15, fontWeight: "600", color: C.background },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", padding: 20 },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle: { fontSize: 18, fontWeight: "700", color: C.text },
    modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    stateItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8 },
    stateItemActive: { backgroundColor: C.surface },
    stateText: { fontSize: 16, color: C.text, fontWeight: "500" },
    stateTextActive: { fontWeight: "700", color: C.primary },
});
