import { useState, useMemo, useRef } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Animated, Alert, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeft, Check, Calendar } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import VoiceInput from "@/components/VoiceInput";

const { width: W } = Dimensions.get("window");
const GOLD = "#c9a84c";

const OCCASIONS = ["Birthday", "Anniversary", "Mother's Day", "Father's Day", "Valentine's", "Sympathy", "Celebration", "Corporate Gift", "Just Because", "Other"];
const GIFT_TYPES = ["Fresh Flowers", "Floral Arrangement", "Luxury Hamper", "Personalised Gift", "Gift Basket", "Cake & Flowers", "Custom Package"];
const BUDGETS = ["₦20k – ₦50k", "₦50k – ₦150k", "₦150k – ₦500k", "₦500k+", "Open Budget"];

export default function GiftsFlowersScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);
    const isDark = theme === "dark";

    const [occasion, setOccasion] = useState("");
    const [giftType, setGiftType] = useState("");
    const [recipient, setRecipient] = useState("");
    const [budget, setBudget] = useState("");
    const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [message, setMessage] = useState("");
    const [preferences, setPreferences] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const fmtDate = (d: Date | null) => d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

    const handleSubmit = async () => {
        if (!occasion || !deliveryAddress.trim()) {
            Alert.alert("Add Details", "Please select an occasion and enter a delivery address.");
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "lifestyle-gifts",
            status: "pending",
            reference: ref,
            title: `Gift and Florals - ${occasion}`,
            details: { occasion, giftType, recipient, budget, deliveryDate: fmtDate(deliveryDate), deliveryAddress, message, preferences },
        });
        setLoading(false);
        if (!error) {
            setShowSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        }
    };

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 80 }}>

                    <View style={s.hero}>
                        <Image source={require("@/assets/images/lagos-restaurant.jpg")} style={s.heroImg} resizeMode="cover" />
                        <View style={s.heroScrim} />
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={s.heroContent}>
                            <Text style={s.heroEyebrow}>GIFT CURATION</Text>
                            <Text style={s.heroTitle}>Gift & Florals</Text>
                            <Text style={s.heroSub}>Every occasion made unforgettable.</Text>
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>What is the Occasion?</Text>
                        <View style={s.wrapRow}>
                            {OCCASIONS.map(occ => (
                                <TouchableOpacity
                                    key={occ}
                                    style={[s.chip, occasion === occ && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setOccasion(occ)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.chipText, occasion === occ && { color: "#0a0a0a", fontWeight: "700" }]}>{occ}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Type of Gift</Text>
                        <View style={s.wrapRow}>
                            {GIFT_TYPES.map(g => (
                                <TouchableOpacity
                                    key={g}
                                    style={[s.chip, giftType === g && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setGiftType(g)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.chipText, giftType === g && { color: "#0a0a0a", fontWeight: "700" }]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Who is it for?</Text>
                        <TextInput
                            style={s.input}
                            placeholder="e.g. My mum, Sarah, a business partner..."
                            placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)"}
                            value={recipient}
                            onChangeText={setRecipient}
                        />
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Budget</Text>
                        <View style={s.wrapRow}>
                            {BUDGETS.map(b => (
                                <TouchableOpacity
                                    key={b}
                                    style={[s.chip, budget === b && { backgroundColor: GOLD, borderColor: GOLD }]}
                                    onPress={() => setBudget(b)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.chipText, budget === b && { color: "#0a0a0a", fontWeight: "700" }]}>{b}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Delivery Date</Text>
                        <TouchableOpacity style={[s.dateBtn, deliveryDate && { borderColor: GOLD }]} onPress={() => setShowDatePicker(true)}>
                            <Calendar size={18} color={deliveryDate ? GOLD : C.muted} />
                            <Text style={{ fontSize: 15, color: deliveryDate ? C.text : C.muted, fontWeight: deliveryDate ? "600" : "400" }}>
                                {fmtDate(deliveryDate) ?? "Select delivery date"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Delivery Address</Text>
                        <TextInput
                            style={s.input}
                            placeholder="Full address including city and any landmark..."
                            placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)"}
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                        />
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Personal Message (optional)</Text>
                        <TextInput
                            style={s.input}
                            placeholder="Message to include on the gift card..."
                            placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)"}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                        />
                    </View>

                    <View style={s.section}>
                        <Text style={s.label}>Preferences and Notes</Text>
                        <VoiceInput
                            placeholder="Favourite colours, flowers to avoid, specific brands, aesthetic preferences..."
                            value={preferences}
                            onChange={setPreferences}
                            accent={GOLD}
                            textColor={C.text}
                            border={isDark ? "#2a2a2a" : "#e0dbd2"}
                            inputBg={C.surface}
                        />
                    </View>

                    <View style={s.feeCard}>
                        <Text style={s.feeEyebrow}>SERVICE FEE</Text>
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                            <Text style={s.feeAmount}>₦5,000</Text>
                            <Text style={s.feeNote}>per request</Text>
                        </View>
                        <Text style={s.feeSub}>Collected upon confirmation of your request.</Text>
                    </View>

                    <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
                        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                            <Text style={s.submitText}>{loading ? "Sending..." : "Place Order"}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

            {Platform.OS === "android" && showDatePicker && (
                <DateTimePicker value={deliveryDate ?? new Date()} mode="date" display="default" minimumDate={new Date()}
                    onChange={(_, d) => { setShowDatePicker(false); if (d) setDeliveryDate(d); }} />
            )}
            <Modal visible={Platform.OS === "ios" && showDatePicker} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
                    <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                        <View style={s.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                            <Text style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Delivery Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: GOLD, fontWeight: "700", fontSize: 16 }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={deliveryDate ?? new Date()} mode="date" display="spinner" minimumDate={new Date()} themeVariant={theme === "dark" ? "dark" : "light"} style={{ width: "100%" }} onChange={(_, d) => { if (d) setDeliveryDate(d); }} />
                    </View>
                </View>
            </Modal>

            <Modal visible={showSuccess} transparent animationType="none">
                <View style={s.overlay}>
                    <Animated.View style={[s.modalBox, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <View style={[s.modalIcon, { backgroundColor: `${GOLD}18` }]}><Check size={28} color={GOLD} strokeWidth={2} /></View>
                        <Text style={s.modalTitle}>Order Placed</Text>
                        <Text style={s.modalBody}>Your gift is being curated. We will confirm details and delivery with you shortly.</Text>
                        <TouchableOpacity style={s.modalBtnPri} onPress={() => { setShowSuccess(false); router.dismissAll(); router.push("/requests"); }}>
                            <Text style={s.modalBtnTxPri}>View Order</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalBtnSec} onPress={() => { setShowSuccess(false); router.back(); router.back(); }}>
                            <Text style={s.modalBtnTxSec}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    hero: { height: 260, position: "relative" },
    heroImg: { width: "100%", height: "100%", position: "absolute" },
    heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.52)" },
    backBtn: { position: "absolute", top: 16, left: 20, width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    heroContent: { position: "absolute", bottom: 28, left: 24, right: 24 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: GOLD, letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 32, fontWeight: "700", color: "#fff", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
    heroSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "PlayfairDisplay_400Regular_Italic" },
    section: { paddingHorizontal: 24, paddingTop: 28 },
    label: { fontSize: 11, fontWeight: "800", color: C.muted, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 },
    wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2", backgroundColor: C.surface },
    chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
    input: { backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    dateBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    textarea: { backgroundColor: C.surface, borderRadius: 16, padding: 18, fontSize: 15, color: C.text, minHeight: 120, lineHeight: 24, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#e0dbd2" },
    feeCard: { marginHorizontal: 24, marginTop: 28, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` },
    feeEyebrow: { fontSize: 9, fontWeight: "800", color: GOLD, letterSpacing: 2, marginBottom: 6 },
    feeAmount: { fontSize: 22, fontWeight: "800", color: GOLD },
    feeNote: { fontSize: 13, color: C.muted, fontWeight: "600" },
    feeSub: { fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 16 },
    submitBtn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
    submitText: { color: "#0a0a0a", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
    pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalBox: { width: "100%", backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: "center" },
    modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 24 },
    modalTitle: { color: C.text, fontSize: 24, fontWeight: "800", marginBottom: 12 },
    modalBody: { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 },
    modalBtnPri: { width: "100%", paddingVertical: 16, borderRadius: 14, backgroundColor: GOLD, alignItems: "center", marginBottom: 12 },
    modalBtnTxPri: { color: "#0a0a0a", fontSize: 15, fontWeight: "700" },
    modalBtnSec: { width: "100%", paddingVertical: 14, alignItems: "center" },
    modalBtnTxSec: { color: C.muted, fontSize: 14, fontWeight: "600" },
});
