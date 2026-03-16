import React, { useState, useRef, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Send, Crown } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

type Message = { id: string; text: string; sender: "user" | "concierge"; time: string };

export default function ConciergeChatScreen() {
    const router = useRouter();
    const { C } = useTheme();
    const s = useMemo(() => getStyles(C), [C]);

    const [messages, setMessages] = useState<Message[]>([
        { id: "1", text: "Welcome to LAPEQ Concierge. How may we elevate your experience today?", sender: "concierge", time: "09:00 AM" }
    ]);
    const [input, setInput] = useState("");
    const listRef = useRef<FlatList>(null);

    const sendMessage = () => {
        if (!input.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: "user",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInput("");

        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "Your dedicated concierge has received your request and will assist you shortly.",
                sender: "concierge",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 1500);
    };

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={28} color={C.text} />
                </TouchableOpacity>
                <View style={s.headerTitleContainer}>
                    <Text style={s.headerTitle}>LAPEQ Concierge</Text>
                    <View style={s.onlineBadgeContainer}>
                        <View style={s.onlineDot} />
                        <Text style={s.onlineText}>Available 24/7</Text>
                    </View>
                </View>
                <Crown size={24} color={C.primary} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            >
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={s.messageList}
                    onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => listRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => (
                        <View style={[s.messageWrapper, item.sender === "user" ? s.wrapperUser : s.wrapperConcierge]}>
                            <View style={[s.bubble, item.sender === "user" ? s.bubbleUser : s.bubbleConcierge]}>
                                <Text style={[s.msgText, item.sender === "user" ? s.msgTextUser : s.msgTextConcierge]}>{item.text}</Text>
                            </View>
                            <Text style={s.timeText}>{item.time}</Text>
                        </View>
                    )}
                />

                <View style={s.inputContainer}>
                    <TextInput
                        style={s.input}
                        placeholder="Message your concierge..."
                        placeholderTextColor={C.muted}
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <TouchableOpacity style={[s.sendBtn, !input.trim() && s.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim()}>
                        <Send size={20} color={!input.trim() ? C.muted : C.background} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (C: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitleContainer: { alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: C.text },
    onlineBadgeContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
    onlineText: { fontSize: 12, color: C.muted, fontWeight: "500" },
    messageList: { padding: 20, paddingBottom: 10 },
    messageWrapper: { marginBottom: 16, maxWidth: "80%" },
    wrapperUser: { alignSelf: "flex-end", alignItems: "flex-end" },
    wrapperConcierge: { alignSelf: "flex-start", alignItems: "flex-start" },
    bubble: { padding: 14, borderRadius: 20 },
    bubbleUser: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
    bubbleConcierge: { backgroundColor: C.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
    msgText: { fontSize: 15, lineHeight: 22 },
    msgTextUser: { color: C.black },
    msgTextConcierge: { color: C.text },
    timeText: { fontSize: 11, color: C.muted, marginTop: 4, paddingHorizontal: 4 },
    inputContainer: { flexDirection: "row", alignItems: "flex-end", padding: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.background },
    input: { flex: 1, minHeight: 48, maxHeight: 120, backgroundColor: C.surface, borderRadius: 24, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, marginRight: 12 },
    sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
    sendBtnDisabled: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
});
