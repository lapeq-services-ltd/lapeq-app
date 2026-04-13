import React, { useState, useRef, useMemo, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Send, Crown, FileText, HelpCircle, MessageCircle } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

type Message = {
    id: string;
    content: string;
    sender_type: "client" | "admin";
    created_at: string;
    type?: string;
};

type ChatMode = null | "request" | "question" | "concierge";

const QUICK_QUESTIONS = [
    "What's included in Gold membership?",
    "How does Project Supervision work?",
    "Can you arrange airport pickup?",
    "What cities do you cover?",
    "How do I upgrade my tier?",
];

const FAQ_ANSWERS: Record<string, string> = {
    "What's included in Gold membership?":
        "Gold membership includes full concierge access with a 24-hour response guarantee, chauffeur service, bespoke travel planning, lifestyle management, event access, and priority reservations at partner venues across Abuja, Lagos, and Port Harcourt.",
    "How does Project Supervision work?":
        "Our team provides independent oversight of your construction or renovation project in Nigeria. We conduct regular site visits, send weekly photo reports, verify materials, and liaise with contractors — keeping you fully informed from anywhere in the world.",
    "Can you arrange airport pickup?":
        "Yes. We arrange private airport transfers across all cities we cover. Simply provide your flight details and we'll handle the rest — including meet & greet, luggage assistance, and direct transfer to your destination.",
    "What cities do you cover?":
        "We currently operate in Abuja, Lagos, and Port Harcourt. Our concierge team is based across all three cities for on-the-ground service.",
    "How do I upgrade my tier?":
        "You can upgrade your membership directly in the app. Go to Profile → Upgrade Membership, select your desired tier, and submit a request. Our team will process it and reach out to confirm.",
};

const FAQ_KEYWORDS: { keywords: string[]; answer: string }[] = [
    { keywords: ["gold", "membership", "included", "include"], answer: FAQ_ANSWERS["What's included in Gold membership?"] },
    { keywords: ["project", "supervision", "construction", "build", "site"], answer: FAQ_ANSWERS["How does Project Supervision work?"] },
    { keywords: ["airport", "pickup", "transfer", "arrival", "flight"], answer: FAQ_ANSWERS["Can you arrange airport pickup?"] },
    { keywords: ["cities", "city", "cover", "location", "abuja", "lagos", "port harcourt"], answer: FAQ_ANSWERS["What cities do you cover?"] },
    { keywords: ["upgrade", "tier", "black", "silver", "change plan"], answer: FAQ_ANSWERS["How do I upgrade my tier?"] },
];

function getFaqAnswer(text: string): string | null {
    const lower = text.toLowerCase();
    // Exact match first
    if (FAQ_ANSWERS[text]) return FAQ_ANSWERS[text];
    // Keyword match
    for (const entry of FAQ_KEYWORDS) {
        if (entry.keywords.some(kw => lower.includes(kw))) return entry.answer;
    }
    return null;
}

function timeLabel(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ConciergeChatScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const s = useMemo(() => getStyles(C, theme), [C, theme]);

    const [mode, setMode] = useState<ChatMode>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const listRef = useRef<FlatList>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id);
        });
    }, []);

    // Load messages + Realtime when mode is selected
    useEffect(() => {
        if (!mode || !userId) return;

        const loadHistory = async () => {
            setLoading(true);
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("user_id", userId)
                .eq("type", mode)          // only this conversation type
                .order("created_at", { ascending: true })
                .limit(100);
            if (data) setMessages(data as Message[]);
            setLoading(false);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 150);
        };

        loadHistory();

        const channel = supabase.channel(`chat-${userId}-${mode}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `user_id=eq.${userId}`,
            }, (payload) => {
                const newMsg = payload.new as Message;
                if (newMsg.sender_type === "admin" && newMsg.type === mode) {
                    setMessages(prev => [...prev, newMsg]);
                    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            setMessages([]);  // clear when switching modes
        };
    }, [mode, userId]);

    const loadMessages = async () => {
        if (!userId || !mode) return;
        const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("user_id", userId)
            .eq("type", mode)
            .order("created_at", { ascending: true })
            .limit(100);
        if (data) setMessages(data as Message[]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    };

    const sendMessage = async (text?: string) => {
        const content = (text ?? input).trim();
        if (!content || !userId) return;
        setInput("");
        setSending(true);

        // Add user message to local state immediately
        const userMsg: Message = {
            id: `local-${Date.now()}`,
            content,
            sender_type: "client",
            created_at: new Date().toISOString(),
            type: mode ?? undefined,
        };
        setMessages(prev => [...prev, userMsg]);

        if (mode === "question") {
            // Save to DB
            await supabase.from("messages").insert({
                user_id: userId,
                sender_type: "client",
                content,
                type: mode,
            });

            // Check for FAQ answer
            const answer = getFaqAnswer(content);
            const replyText = answer ?? "Your concierge will follow up on this shortly. Is there anything else we can help you with?";

            setTimeout(async () => {
                // Save bot auto-reply directly to the DB so it persists
                // The Realtime channel will pick this up and append it to local state automatically
                await supabase.from("messages").insert({
                    user_id: userId,
                    sender_type: "admin",
                    content: replyText,
                    type: mode,
                });
            }, 800);
        } else {
            // request / concierge — save to DB, no auto-reply
            await supabase.from("messages").insert({
                user_id: userId,
                sender_type: "client",
                content,
                type: mode,
            });
        }

        setSending(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const getPlaceholder = () => {
        if (mode === "request") return "Describe what you need arranged...";
        if (mode === "question") return "Ask us anything...";
        return "Message your concierge...";
    };

    const getModeLabel = () => {
        if (mode === "request") return "New Request";
        if (mode === "question") return "Ask a Question";
        return "Concierge Chat";
    };

    // Entry screen — pick a mode
    if (!mode) {
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

                <View style={s.modeContainer}>
                    <Text style={s.modeTitle}>How can we help you today?</Text>
                    <Text style={s.modeSub}>Choose how you'd like to connect with your concierge.</Text>

                    <TouchableOpacity style={s.modeCard} onPress={() => setMode("request")} activeOpacity={0.85}>
                        <View style={[s.modeIcon, { backgroundColor: C.surface }]}>
                            <FileText size={24} color={C.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.modeCardTitle}>Make a Request</Text>
                            <Text style={s.modeCardSub}>Need something arranged? Tell us and we'll handle it.</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.modeCard} onPress={() => setMode("question")} activeOpacity={0.85}>
                        <View style={[s.modeIcon, { backgroundColor: C.surface }]}>
                            <HelpCircle size={24} color={C.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.modeCardTitle}>Ask a Question</Text>
                            <Text style={s.modeCardSub}>Membership, services, cities we cover — ask anything.</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.modeCard} onPress={() => setMode("concierge")} activeOpacity={0.85}>
                        <View style={[s.modeIcon, { backgroundColor: C.surface }]}>
                            <MessageCircle size={24} color={C.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.modeCardTitle}>Talk to My Concierge</Text>
                            <Text style={s.modeCardSub}>Direct line to your dedicated concierge. No forms needed.</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.root}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => setMode(null)} style={s.backBtn}>
                    <ChevronLeft size={28} color={C.text} />
                </TouchableOpacity>
                <View style={s.headerTitleContainer}>
                    <Text style={s.headerTitle}>{getModeLabel()}</Text>
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
                {loading ? (
                    <View style={s.center}>
                        <ActivityIndicator color={C.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={s.messageList}
                        ListHeaderComponent={
                            messages.length === 0 ? (
                                <View style={s.emptyChat}>
                                    {mode === "request" && (
                                        <Text style={s.emptyChatText}>Describe what you need — a reservation, transport, event access, anything. We'll take it from here.</Text>
                                    )}
                                    {mode === "question" && (
                                        <Text style={s.emptyChatText}>Ask us anything or pick a common question below.</Text>
                                    )}
                                    {mode === "concierge" && (
                                        <Text style={s.emptyChatText}>Your dedicated concierge is ready. Send a message to get started.</Text>
                                    )}
                                </View>
                            ) : null
                        }
                        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                        renderItem={({ item }) => (
                            <View style={[s.messageWrapper, item.sender_type === "client" ? s.wrapperUser : s.wrapperConcierge]}>
                                {item.sender_type === "admin" && (
                                    <Text style={s.senderLabel}>LAPEQ Concierge</Text>
                                )}
                                <View style={[s.bubble, item.sender_type === "client" ? s.bubbleUser : s.bubbleConcierge]}>
                                    <Text style={[s.msgText, item.sender_type === "client" ? s.msgTextUser : s.msgTextConcierge]}>
                                        {item.content}
                                    </Text>
                                </View>
                                <Text style={s.timeText}>{timeLabel(item.created_at)}</Text>
                            </View>
                        )}
                    />
                )}

                {/* Quick Questions sticky bar */}
                {mode === "question" && (
                    <View style={{ paddingBottom: 16 }}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                        >
                            {QUICK_QUESTIONS.map(q => (
                                <TouchableOpacity 
                                    key={q} 
                                    style={[s.quickQ, { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 }]} 
                                    onPress={() => sendMessage(q)}
                                    disabled={sending}
                                >
                                    <Text style={s.quickQText}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={s.inputContainer}>
                    <TextInput
                        style={s.input}
                        placeholder={getPlaceholder()}
                        placeholderTextColor={C.muted}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        onSubmitEditing={() => sendMessage()}
                    />
                    <TouchableOpacity
                        style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
                        onPress={() => sendMessage()}
                        disabled={!input.trim() || sending}
                    >
                        {sending
                            ? <ActivityIndicator size="small" color={C.background} />
                            : <Send size={20} color={!input.trim() ? C.muted : C.background} />
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (C: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
    headerTitleContainer: { alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: C.text },
    onlineBadgeContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
    onlineText: { fontSize: 12, color: C.muted, fontWeight: "500" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    modeContainer: { flex: 1, padding: 24, paddingTop: 32 },
    modeTitle: { fontSize: 24, fontWeight: "700", color: C.text, marginBottom: 8 },
    modeSub: { fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 22 },
    modeCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: theme === "dark" ? "#2a2a2a" : "#d8d3ca" },
    modeIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    modeCardTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4 },
    modeCardSub: { fontSize: 13, color: C.muted, lineHeight: 18 },

    messageList: { padding: 20, paddingBottom: 10 },
    emptyChat: { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: C.border },
    emptyChatText: { fontSize: 14, color: C.muted, lineHeight: 22 },
    quickQ: { backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border },
    quickQText: { fontSize: 13, color: C.primary, fontWeight: "500" },

    messageWrapper: { marginBottom: 16, maxWidth: "80%" },
    wrapperUser: { alignSelf: "flex-end", alignItems: "flex-end" },
    wrapperConcierge: { alignSelf: "flex-start", alignItems: "flex-start" },
    senderLabel: { fontSize: 10, color: C.primary, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
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
