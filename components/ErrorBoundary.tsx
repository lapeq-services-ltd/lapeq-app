import { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AlertTriangle } from "lucide-react-native";

const GOLD = "#c9a84c";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        console.error("Unhandled render error:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={s.root}>
                    <View style={s.iconWrap}>
                        <AlertTriangle size={26} color={GOLD} />
                    </View>
                    <Text style={s.title}>Something went wrong</Text>
                    <Text style={s.body}>
                        Lapeq ran into an unexpected error. Restarting the app usually fixes this — if it keeps happening, let us know via Settings {'>'} Report a Problem.
                    </Text>
                    <TouchableOpacity
                        style={s.btn}
                        activeOpacity={0.85}
                        onPress={() => this.setState({ hasError: false })}
                    >
                        <Text style={s.btnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    iconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(201,168,76,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 18 },
    title: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 8, textAlign: "center" },
    body: { fontSize: 14, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 20, marginBottom: 24 },
    btn: { backgroundColor: GOLD, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    btnText: { color: "#000", fontWeight: "700", fontSize: 14 },
});
