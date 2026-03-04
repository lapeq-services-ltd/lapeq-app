import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <View style={styles.section}>
                <TouchableOpacity style={styles.row}>
                    <Text style={styles.rowLabel}>Account Details</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.row}>
                    <Text style={styles.rowLabel}>Settings</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.row}>
                    <Text style={styles.rowLabel}>Support</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signOut} onPress={() => supabase.auth.signOut()}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream, padding: 20 },
    title: { fontSize: 22, fontWeight: "700", color: Colors.black, marginBottom: 24 },
    section: { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    rowLabel: { fontSize: 14, color: Colors.black },
    arrow: { fontSize: 18, color: Colors.muted },
    signOut: { marginTop: 32, alignItems: "center" },
    signOutText: { fontSize: 13, color: Colors.error },
});
