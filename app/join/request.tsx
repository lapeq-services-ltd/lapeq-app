import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function MembershipRequestScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const { tier } = useLocalSearchParams();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [intent, setIntent] = useState(tier ? `I am interested in the ${tier} membership.` : "");

    return (
        <SafeAreaView style={s.root}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <ChevronLeft size={32} color={C.cardFg} />
                    </TouchableOpacity>
                    <Text style={s.title}>Request {tier ? `${tier} ` : ""}Membership</Text>
                    <Text style={s.subtitle}>Apply to join LAPEQ and unlock exclusive concierge services.</Text>

                    <Text style={s.label}>Full Name</Text>
                    <TextInput style={s.input} placeholder="e.g. Chidi Okonkwo" placeholderTextColor={C.muted} value={name} onChangeText={setName} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />

                    <Text style={s.label}>Email Address</Text>
                    <TextInput style={s.input} placeholder="e.g. chidi@example.com" keyboardType="email-address" placeholderTextColor={C.muted} value={email} onChangeText={setEmail} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />

                    <Text style={s.label}>Phone Number</Text>
                    <TextInput style={s.input} placeholder="+234 800 000 0000" keyboardType="phone-pad" placeholderTextColor={C.muted} value={phone} onChangeText={setPhone} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />

                    <Text style={s.label}>What are you looking for?</Text>
                    <TextInput style={[s.input, s.textarea]} placeholder="Tell us how LAPEQ can assist you..." placeholderTextColor={C.muted} value={intent} onChangeText={setIntent} multiline numberOfLines={4} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />

                    <View style={s.submitSection}>
                        <TouchableOpacity style={s.btnA} onPress={() => router.push("/join/option-a")}>
                            <Text style={s.btnTextA}>Submit Application (Fixed Pricing)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.btnB} onPress={() => router.push("/join/option-b")}>
                            <Text style={s.btnTextB}>Submit Application (Personal Touch)</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Space filler so keyboard works nicely */}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    backBtn: { paddingVertical: 16, marginTop: 10, alignSelf: "flex-start" },
    title: { fontSize: 26, fontWeight: "700", color: C.text, marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 22 },
    label: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 15, color: C.text, marginBottom: 20 },
    textarea: { height: 100, textAlignVertical: "top" },
    submitSection: { marginTop: 16, gap: 12 },
    btnA: { backgroundColor: C.primary, padding: 16, borderRadius: 12, alignItems: "center" },
    btnTextA: { color: C.black, fontSize: 16, fontWeight: "700" },
    btnB: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.primary, padding: 16, borderRadius: 12, alignItems: "center" },
    btnTextB: { color: C.primary, fontSize: 16, fontWeight: "700" },
});
