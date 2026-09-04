import { useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Modal, Dimensions, Linking } from "react-native";
import { useRouter } from "expo-router";
import { User, MessageCircle, Info, LogOut, X, Crown, Linkedin, Instagram } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

// lucide's "X" is a generic close-mark, not the actual brand logo — this is
// the real one, same pattern as the Apple/Google icons on the login screen.
function XLogo({ size = 19, color = "#000" }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </Svg>
    );
}

const SOCIAL_LINKS = [
    { icon: Linkedin, label: "LinkedIn", url: "https://linkedin.com/in/lapeqconcierge" },
    { icon: XLogo, label: "X", url: "https://x.com/Lapeqconcierge" },
    { icon: Instagram, label: "Instagram", url: "https://www.instagram.com/lapeqconcierge/" },
];

const { width: SW } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(300, SW * 0.8);

interface Props {
    visible: boolean;
    onClose: () => void;
    avatarUri: string | null;
    name: string;
    tier?: string;
}

export default function AccountDrawer({ visible, onClose, avatarUri, name, tier }: Props) {
    const router = useRouter();
    const { C, theme } = useTheme();
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateX, { toValue: visible ? 0 : -DRAWER_WIDTH, duration: 260, useNativeDriver: true }),
            Animated.timing(backdropOpacity, { toValue: visible ? 1 : 0, duration: 260, useNativeDriver: true }),
        ]).start();
    }, [visible]);

    const go = (route: string) => {
        onClose();
        router.push(route as any);
    };

    const items = [
        { icon: User, label: "Profile", route: "/settings/personal-info" },
        { icon: MessageCircle, label: "Chat", route: "/(main)/chat" },
        { icon: Info, label: "About Us", route: "/settings/about" },
    ];

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)", opacity: backdropOpacity }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu" />
            </Animated.View>

            <Animated.View
                style={[
                    s.drawer,
                    { width: DRAWER_WIDTH, backgroundColor: theme === "dark" ? "#111" : "#fff", transform: [{ translateX }] },
                ]}
            >
                <View style={s.topRow}>
                    <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityRole="button" accessibilityLabel="Close menu">
                        <X size={20} color={C.muted} />
                    </TouchableOpacity>
                </View>

                <View style={s.profileBlock}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={s.avatar} />
                    ) : (
                        <View style={[s.avatar, s.avatarFallback, { backgroundColor: `${C.primary}20` }]}>
                            <User size={26} color={C.primary} />
                        </View>
                    )}
                    <Text style={[s.name, { color: C.text }]} numberOfLines={1}>{name || "Member"}</Text>
                    {!!tier && <Text style={[s.tier, { color: C.primary }]}>{tier} Member</Text>}
                </View>

                <TouchableOpacity
                    style={[s.membershipRow, { borderColor: `${C.primary}35`, backgroundColor: `${C.primary}12` }]}
                    onPress={() => go("/membership")}
                    accessibilityRole="button"
                    accessibilityLabel="Membership"
                >
                    <Crown size={20} color={C.primary} />
                    <Text style={[s.menuLabel, { color: C.primary }]}>Membership</Text>
                </TouchableOpacity>

                <View style={s.menu}>
                    {items.map(item => {
                        const Icon = item.icon;
                        return (
                            <TouchableOpacity key={item.label} style={s.menuRow} onPress={() => go(item.route)} accessibilityRole="button" accessibilityLabel={item.label}>
                                <Icon size={20} color={C.text} />
                                <Text style={[s.menuLabel, { color: C.text }]}>{item.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={s.socialBlock}>
                    <Text style={[s.socialLabel, { color: C.muted }]}>Follow Us</Text>
                    <View style={s.socialRow}>
                        {SOCIAL_LINKS.map(social => {
                            const Icon = social.icon;
                            return (
                                <TouchableOpacity
                                    key={social.label}
                                    style={s.socialBtn}
                                    onPress={() => { onClose(); Linking.openURL(social.url).catch(() => {}); }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Open Lapeq on ${social.label}`}
                                >
                                    <Icon size={19} color={C.primary} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <TouchableOpacity
                    style={s.signOutRow}
                    onPress={() => { onClose(); supabase.auth.signOut(); }}
                    accessibilityRole="button"
                    accessibilityLabel="Sign out"
                >
                    <LogOut size={20} color={C.muted} />
                    <Text style={[s.menuLabel, { color: C.muted }]}>Sign Out</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

const s = StyleSheet.create({
    drawer: { position: "absolute", top: 0, bottom: 0, left: 0, paddingTop: 56, paddingHorizontal: 20 },
    topRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
    closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    profileBlock: { alignItems: "flex-start", marginBottom: 28, paddingHorizontal: 4 },
    avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
    avatarFallback: { alignItems: "center", justifyContent: "center" },
    name: { fontSize: 18, fontWeight: "700" },
    tier: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginTop: 4 },
    membershipRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
    menu: { gap: 4 },
    menuRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 4 },
    menuLabel: { fontSize: 15, fontWeight: "600" },
    signOutRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 4, position: "absolute", bottom: 40, left: 20, right: 20 },
    socialBlock: { marginTop: 20, paddingHorizontal: 4 },
    socialLabel: { fontSize: 10.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 },
    socialRow: { flexDirection: "row", gap: 4 },
    socialBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
