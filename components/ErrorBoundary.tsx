import { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";

const GOLD = "#c9a84c";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

// Best-effort crash report — fires into the client_errors table (see
// supabase/43_security_hardening_2026-08-17.sql) so production crashes are
// visible to the team instead of vanishing with the console. Never throws:
// if the table/insert fails (e.g. migration not yet applied), we swallow it
// rather than compounding the original crash.
function reportCrash(error: Error, componentStack: string) {
    supabase
        .from("client_errors")
        .insert({
            message: error.message,
            stack: error.stack ?? null,
            component_stack: componentStack,
            platform: Platform.OS,
            app_version: Constants.expoConfig?.version ?? null,
        })
        .then(undefined, () => {});
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        console.error("Unhandled render error:", error, info.componentStack);
        try {
            reportCrash(error, info.componentStack);
        } catch {
            // reporting must never itself crash the boundary
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false });
        // Reset local boundary state alone can re-render straight back into
        // whatever screen state caused the crash. Send the user somewhere
        // known-good so "Try Again" reliably recovers.
        try {
            router.replace("/(tabs)");
        } catch {
            // still fine — boundary state is cleared either way
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={s.root}>
                    <View style={s.iconWrap}>
                        <AlertTriangle size={26} color={GOLD} />
                    </View>
                    <Text style={s.title}>Something went wrong</Text>
                    <Text style={s.body}>
                        Lapeq ran into an unexpected error. We've logged it — if it keeps happening, let us know via Settings {'>'} Report a Problem.
                    </Text>
                    <TouchableOpacity
                        style={s.btn}
                        activeOpacity={0.85}
                        onPress={this.handleRetry}
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
