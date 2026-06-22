import { useState, useEffect, useRef } from "react";
import {
    View, Text, Modal, ScrollView, TouchableOpacity,
    StyleSheet, Animated, Platform, Dimensions,
} from "react-native";

const { height: SH } = Dimensions.get("window");
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";

const GOLD = "#c9a84c";
const isAndroid = Platform.OS === "android";
const TC_KEY = "lapeq_tc_v1";

export default function TermsSheet() {
    const { C, theme } = useTheme();
    const isDark = theme === "dark";
    const [visible, setVisible] = useState(false);
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const translateY = useRef(new Animated.Value(800)).current;
    const backdropOp = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        AsyncStorage.getItem(TC_KEY).then(val => {
            if (!val) setVisible(true);
        });
    }, []);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(backdropOp, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, friction: 9, tension: 55, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const accept = () => {
        AsyncStorage.setItem(TC_KEY, "accepted");
        Animated.parallel([
            Animated.timing(backdropOp, { toValue: 0, duration: 220, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 800, duration: 260, useNativeDriver: true }),
        ]).start(() => setVisible(false));
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={() => {}}>
            <View style={s.root}>
                <Animated.View style={[s.backdrop, { opacity: backdropOp }]} />

                <Animated.View style={[
                    s.sheet,
                    { backgroundColor: isDark ? "#111111" : "#ffffff", transform: [{ translateY }] },
                ]}>
                    <View style={[s.handle, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }]} />

                    <Text style={[s.title, { color: C.text }]}>Terms & Conditions</Text>
                    <Text style={[s.sub, { color: C.muted }]}>
                        Please review our terms before continuing
                    </Text>

                    <ScrollView
                        style={s.scroll}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={s.scrollContent}
                        onScroll={({ nativeEvent }) => {
                            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 32) {
                                setScrolledToBottom(true);
                            }
                        }}
                        scrollEventThrottle={16}
                    >
                        <Section title="1. About Lapeq" C={C}>
                            Lapeq is a premium concierge and lifestyle management service operating in Nigeria and for the Nigerian diaspora. By using this application, you agree to be bound by these Terms and Conditions in full.
                        </Section>

                        <Section title="2. Membership & Access" C={C}>
                            Access to Lapeq services is granted on a membership basis. Free members receive a limited number of concierge requests per month. Paid membership tiers (Silver, Gold, Black, and Corporate) unlock expanded access, priority service, and exclusive benefits as described on the Membership page.
                        </Section>

                        <Section title="3. Service Requests" C={C}>
                            All service requests submitted through the app are handled by the Lapeq concierge team. Response times vary by membership tier. Lapeq reserves the right to decline requests that are unlawful, unethical, or outside the scope of our service offering.
                        </Section>

                        <Section title="4. Confidentiality & Discretion" C={C}>
                            Lapeq operates under a strict confidentiality policy. All staff members sign NDAs. Your personal information, preferences, and requests will never be shared with third parties without your explicit consent, except where required by Nigerian law.
                        </Section>

                        <Section title="5. Privacy & Data" C={C}>
                            We collect only the information necessary to provide our services. Your data is stored securely and processed in accordance with the Nigeria Data Protection Act (NDPA). You may request deletion of your data at any time by contacting us.
                        </Section>

                        <Section title="6. Payments & Billing" C={C}>
                            Membership fees are billed as agreed at the point of subscription. Service-specific costs (travel, bookings, logistics) are quoted separately and must be authorised by you before any spend is incurred on your behalf. All transactions are final unless otherwise agreed in writing.
                        </Section>

                        <Section title="7. Liability" C={C}>
                            Lapeq acts as a facilitator between members and third-party service providers. We are not liable for the actions, errors, or omissions of third parties, including hotels, airlines, restaurants, or transport providers. Our liability is limited to the value of the membership fees paid.
                        </Section>

                        <Section title="8. Acceptable Use" C={C}>
                            You agree not to use Lapeq for any unlawful purpose, to submit false or misleading information, or to attempt to gain unauthorised access to our systems. Misuse may result in immediate termination of your membership.
                        </Section>

                        <Section title="9. Changes to Terms" C={C}>
                            Lapeq may update these Terms from time to time. You will be notified of material changes within the app. Continued use of the service after notification constitutes acceptance of the updated terms.
                        </Section>

                        <Section title="10. Governing Law" C={C}>
                            These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of Nigerian courts.
                        </Section>

                        <Text style={[s.contact, { color: C.muted }]}>
                            Questions? Contact us at{" "}
                            <Text style={{ color: GOLD }}>concierge@lapeq.com</Text>
                        </Text>
                    </ScrollView>

                    <View style={[s.footer, { borderTopColor: isDark ? "#2a2a2a" : "#ece8de", backgroundColor: isDark ? "#111111" : "#ffffff" }]}>
                        <TouchableOpacity
                            style={[s.btn, !scrolledToBottom && s.btnLocked]}
                            onPress={scrolledToBottom ? accept : undefined}
                            activeOpacity={scrolledToBottom ? 0.85 : 1}
                        >
                            <Text style={s.btnText}>
                                {scrolledToBottom ? "I Accept & Continue" : "Scroll to read all terms ↓"}
                            </Text>
                        </TouchableOpacity>
                        <Text style={[s.footnote, { color: C.muted }]}>
                            By continuing you agree to our Terms & Conditions and Privacy Policy
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

function Section({ title, children, C }: { title: string; children: string; C: any }) {
    return (
        <View style={s.section}>
            <Text style={[s.sectionTitle, { color: C.text }]}>{title}</Text>
            <Text style={[s.sectionBody, { color: C.muted }]}>{children}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    sheet: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: SH * 0.85,
        paddingTop: 12,
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        alignSelf: "center", marginBottom: 20,
    },
    title: {
        fontSize: isAndroid ? 22 : 24,
        fontFamily: "PlayfairDisplay_700Bold",
        paddingHorizontal: 24,
        marginBottom: 6,
    },
    sub: {
        fontSize: 13,
        fontFamily: "Jost_400Regular",
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 8 },
    section: { marginBottom: 20 },
    sectionTitle: {
        fontSize: 13,
        fontFamily: "Jost_700Bold",
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    sectionBody: {
        fontSize: isAndroid ? 13 : 14,
        fontFamily: "Jost_400Regular",
        lineHeight: 22,
    },
    contact: {
        fontSize: 13,
        fontFamily: "Jost_400Regular",
        marginTop: 8,
        marginBottom: 16,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: isAndroid ? 24 : 32,
        borderTopWidth: 1,
        gap: 12,
    },
    btn: {
        backgroundColor: GOLD,
        borderRadius: 16,
        paddingVertical: isAndroid ? 14 : 16,
        alignItems: "center",
    },
    btnLocked: {
        backgroundColor: "rgba(201,168,76,0.35)",
    },
    btnText: {
        fontSize: 15,
        fontFamily: "Jost_700Bold",
        color: "#0a0a0a",
    },
    footnote: {
        fontSize: 11,
        fontFamily: "Jost_400Regular",
        textAlign: "center",
        lineHeight: 17,
    },
});
