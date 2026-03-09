import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";

export default function RequestDetailsScreen() {
    const { id } = useLocalSearchParams();

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Request Details</Text>
            <Text style={styles.body}>Viewing configuration for Request ID: {id}</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream, padding: 20 },
    title: { fontSize: 22, fontWeight: "700", color: Colors.black, marginBottom: 12 },
    body: { fontSize: 16, color: Colors.muted },
});
