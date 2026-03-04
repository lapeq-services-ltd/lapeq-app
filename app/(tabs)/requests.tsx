import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export default function RequestsScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>My Requests</Text>
            <Text style={styles.empty}>No requests yet. Submit one from Home.</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream, padding: 20 },
    title: { fontSize: 22, fontWeight: "700", color: Colors.black, marginBottom: 12 },
    empty: { fontSize: 13, color: Colors.muted, marginTop: 40, textAlign: "center" },
});
