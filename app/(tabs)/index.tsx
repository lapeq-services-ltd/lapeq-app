import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { SERVICES } from "@/constants/services";
import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good morning,</Text>
                        <Text style={styles.name}>Member</Text>
                    </View>
                    <TouchableOpacity style={styles.notifBtn}>
                        <Text style={{ fontSize: 18 }}>🔔</Text>
                    </TouchableOpacity>
                </View>

                {/* Concierge Banner */}
                <View style={styles.banner}>
                    <Text style={styles.bannerTitle}>24/7 Concierge Available</Text>
                    <Text style={styles.bannerSub}>Your dedicated concierge is a message away</Text>
                </View>

                {/* Services */}
                <Text style={styles.sectionTitle}>Services</Text>
                <View style={styles.grid}>
                    {SERVICES.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={styles.card}
                            onPress={() => router.push(`/services/${service.id}`)}
                        >
                            <Text style={styles.cardLabel}>{service.label}</Text>
                            <Text style={styles.cardDesc} numberOfLines={2}>{service.description}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Sign out (temp helper) */}
                <TouchableOpacity
                    onPress={() => supabase.auth.signOut()}
                    style={styles.signOut}
                >
                    <Text style={styles.signOutText}>Sign out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    greeting: { fontSize: 13, color: Colors.muted },
    name: { fontSize: 22, fontWeight: "700", color: Colors.black },
    notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
    banner: { marginHorizontal: 20, marginBottom: 24, backgroundColor: Colors.black, borderRadius: 16, padding: 16 },
    bannerTitle: { fontSize: 14, fontWeight: "700", color: Colors.cream, marginBottom: 4 },
    bannerSub: { fontSize: 12, color: "rgba(240,236,228,0.6)" },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.black, paddingHorizontal: 20, marginBottom: 12 },
    grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 12 },
    card: { width: "46%", marginHorizontal: "2%", backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
    cardLabel: { fontSize: 13, fontWeight: "700", color: Colors.black, marginBottom: 4 },
    cardDesc: { fontSize: 11, color: Colors.muted, lineHeight: 16 },
    signOut: { margin: 20, marginTop: 32, alignItems: "center" },
    signOutText: { fontSize: 12, color: Colors.muted },
});
