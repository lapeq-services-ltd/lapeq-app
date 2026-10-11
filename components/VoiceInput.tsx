import React, { useState, useEffect, useRef } from "react";
import {
    View, Text, TouchableOpacity, TextInput, Modal, Alert, Keyboard, Platform, StyleSheet, AppState
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Maximize2, Mic, X, Pause, Play, Trash2, ChevronDown } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

let ExpoAudio: any = null;
try {
    ExpoAudio = require("expo-audio");
} catch (e) {
    console.warn("expo-audio module not available:", e);
}

interface VoiceInputProps {
    placeholder?: string;
    value: string;
    onChange: (text: string) => void;
    accent?: string;
    textColor?: string;
    border?: string;
    inputBg?: string;
    bg?: string;
    voiceUri?: string | null;
    onVoiceChange?: (uri: string | null) => void;
}

export default function VoiceInput({
    placeholder = "Add notes or record a voice note...",
    value = "",
    onChange,
    accent = "#D4AF37",
    textColor = "#FFFFFF",
    border = "#2A2A2A",
    inputBg,
    bg,
    voiceUri: externalVoiceUri,
    onVoiceChange,
}: VoiceInputProps) {
    const effectiveBg = bg || inputBg || "#141414";
    const [expanded, setExpanded] = useState(false);
    const insets = useSafeAreaInsets();

    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [reopenNotesAfter, setReopenNotesAfter] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [voiceUri, setVoiceUri] = useState<string | null>(externalVoiceUri || null);

    const recorderRef = useRef<any>(null);
    const playerRef = useRef<any>(null);

    // Sync external voiceUri
    useEffect(() => {
        if (externalVoiceUri !== undefined) {
            setVoiceUri(externalVoiceUri);
        }
    }, [externalVoiceUri]);

    // Keep track of recording duration
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            setDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Cleanup sound player and recorder on unmount
    useEffect(() => {
        return () => {
            if (playerRef.current) {
                try { playerRef.current.remove(); } catch (_) {}
            }
            if (recorderRef.current) {
                try { recorderRef.current.stop(); } catch (_) {}
            }
        };
    }, []);

    // Extract voice note URL from notes value if it exists
    const voiceNoteUrlMatch = value ? value.match(/\[Voice Note: (https:\/\/.*?)\]/) : null;
    const voiceNoteUrl = voiceNoteUrlMatch ? voiceNoteUrlMatch[1] : null;

    useEffect(() => {
        if (voiceNoteUrl && !voiceUri) {
            setVoiceUri(voiceNoteUrl);
        }
    }, [voiceNoteUrl]);

    async function startRecording() {
        if (isRecording) return;
        if (!ExpoAudio) {
            Alert.alert(
                "Voice Recording Unavailable",
                "Voice recording is not supported in this Expo build. Please type your request notes in the text box."
            );
            return;
        }

        try {
            Keyboard.dismiss();
            const perm = await ExpoAudio.requestRecordingPermissionsAsync();
            if (perm?.status !== "granted") {
                Alert.alert("Permission Required", "Please allow microphone access in device Settings to record voice notes.");
                return;
            }

            if (AppState.currentState !== "active") {
                await new Promise<void>((resolve) => {
                    const sub = AppState.addEventListener("change", (nextState) => {
                        if (nextState === "active") {
                            sub.remove();
                            resolve();
                        }
                    });
                    setTimeout(() => {
                        sub.remove();
                        resolve();
                    }, 1000);
                });
            }

            if (ExpoAudio.setAudioModeAsync) {
                await ExpoAudio.setAudioModeAsync({
                    allowsRecording: true,
                    playsInSilentMode: true,
                }).catch(() => {});
            }

            const options = ExpoAudio.RecordingPresets?.HIGH_QUALITY || {};
            const recorder = new ExpoAudio.AudioModule.AudioRecorder(options);
            if (recorder.prepareToRecordAsync) {
                await recorder.prepareToRecordAsync();
            }
            recorder.record();
            recorderRef.current = recorder;

            if (expanded) {
                setReopenNotesAfter(true);
                setExpanded(false);
            }

            setIsRecording(true);
            setShowRecordModal(true);
        } catch (err: any) {
            console.error("Failed to start recording:", err);
            Alert.alert("Recording Error", err?.message || "Could not start recording. Please try again.");
            setIsRecording(false);
            setShowRecordModal(false);
        }
    }

    async function stopRecording() {
        try {
            setIsRecording(false);
            setShowRecordModal(false);
            const recorder = recorderRef.current;
            let uri: string | null = null;
            if (recorder) {
                await recorder.stop();
                uri = recorder.uri;
                recorderRef.current = null;
            }

            if (ExpoAudio?.setAudioModeAsync) {
                await ExpoAudio.setAudioModeAsync({
                    allowsRecording: false,
                    playsInSilentMode: true,
                }).catch(() => {});
            }

            if (reopenNotesAfter) {
                setReopenNotesAfter(false);
                setExpanded(true);
            }

            if (uri) {
                setVoiceUri(uri);
                if (onVoiceChange) onVoiceChange(uri);
                await uploadVoiceNote(uri);
            }
        } catch (err) {
            console.error("Failed to stop recording:", err);
            setIsRecording(false);
            setShowRecordModal(false);
            Alert.alert("Error", "Could not stop audio recording.");
        }
    }

    async function cancelRecording() {
        try {
            setIsRecording(false);
            setShowRecordModal(false);
            const recorder = recorderRef.current;
            if (recorder) {
                await recorder.stop();
                recorderRef.current = null;
            }
            if (reopenNotesAfter) {
                setReopenNotesAfter(false);
                setExpanded(true);
            }
        } catch (err) {
            console.error("Failed to cancel recording:", err);
            setIsRecording(false);
            setShowRecordModal(false);
        }
    }

    async function uploadVoiceNote(uri: string) {
        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert("Error", "You must be signed in to upload voice notes.");
                return;
            }
            const ext = "m4a";
            const path = `voice-notes/${user.id}/${Date.now()}.${ext}`;
            const resp = await fetch(uri);
            const blob = await resp.blob();
            const { error: upErr } = await supabase.storage
                .from("voice-notes")
                .upload(path, blob, { upsert: false, contentType: "audio/m4a" });

            if (upErr) {
                console.error("Error uploading voice note:", upErr);
            } else {
                const { data: pub } = supabase.storage.from("voice-notes").getPublicUrl(path);
                const publicUrl = pub.publicUrl;
                const textWithoutVoice = value ? value.replace(/\n\n\[Voice Note: .*?\]/, "") : "";
                onChange(textWithoutVoice + "\n\n[Voice Note: " + publicUrl + "]");
            }
        } catch (err) {
            console.error("Failed to upload voice note:", err);
        } finally {
            setUploading(false);
        }
    }

    async function playSound() {
        if (!voiceUri || !ExpoAudio) return;
        try {
            if (playerRef.current) {
                try { playerRef.current.remove(); } catch (_) {}
                playerRef.current = null;
            }

            const player = ExpoAudio.createAudioPlayer({ uri: voiceUri });
            playerRef.current = player;
            player.play();
            setIsPlaying(true);

            player.addListener("playbackStatusUpdate", (status: any) => {
                if (status?.didJustFinish || (status?.duration > 0 && status?.currentTime >= status?.duration)) {
                    setIsPlaying(false);
                }
            });
        } catch (err) {
            console.error("Failed to play sound:", err);
            setIsPlaying(false);
            Alert.alert("Playback Error", "Could not play the recorded audio.");
        }
    }

    async function pauseSound() {
        if (playerRef.current) {
            try { playerRef.current.pause(); } catch (_) {}
            setIsPlaying(false);
        }
    }

    async function deleteSound() {
        try {
            if (playerRef.current) {
                try { playerRef.current.remove(); } catch (_) {}
                playerRef.current = null;
            }
            setIsPlaying(false);
            setVoiceUri(null);
            if (onVoiceChange) onVoiceChange(null);
            if (value && value.includes("[Voice Note:")) {
                const cleaned = value.replace(/\n\n\[Voice Note: .*?\]/, "").replace(/\[Voice Note: .*?\]/, "").trim();
                onChange(cleaned);
            }
        } catch (err) {
            console.error("Failed to delete sound:", err);
        }
    }

    function formatTime(secs: number) {
        const mins = Math.floor(secs / 60);
        const remainder = secs % 60;
        return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
    }

    return (
        <View style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setExpanded(true)}
                    style={{
                        flex: 1,
                        minHeight: 80,
                        backgroundColor: effectiveBg,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: border,
                        padding: 14,
                        justifyContent: "flex-start",
                    }}
                >
                    <Text
                        style={{ fontSize: 14, color: value ? textColor : `${textColor}55`, lineHeight: 20 }}
                        numberOfLines={4}
                    >
                        {value ? value.replace(/\n\n\[Voice Note: .*?\]/, "") : placeholder}
                    </Text>
                </TouchableOpacity>

                <View style={{ gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => setExpanded(true)}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: border,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: effectiveBg,
                        }}
                    >
                        <Maximize2 size={16} color={accent} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={startRecording}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: border,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: effectiveBg,
                        }}
                    >
                        <Mic size={18} color={accent} />
                    </TouchableOpacity>
                </View>
            </View>

            {voiceUri && (
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: `${accent}10`,
                    borderWidth: 1,
                    borderColor: `${accent}25`,
                    borderRadius: 14,
                    padding: 12,
                    marginTop: 12,
                }}>
                    <TouchableOpacity
                        onPress={isPlaying ? pauseSound : playSound}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: accent,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {isPlaying ? (
                            <Pause size={16} color={effectiveBg === "#ffffff" || effectiveBg === "#fff" ? "#000" : "#fff"} />
                        ) : (
                            <Play size={16} color={effectiveBg === "#ffffff" || effectiveBg === "#fff" ? "#000" : "#fff"} style={{ marginLeft: 2 }} />
                        )}
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: textColor }}>
                            Voice Note Recorded
                        </Text>
                        <Text style={{ fontSize: 11, color: `${textColor}60` }}>
                            Tap play to preview
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={deleteSound}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Expanded Full-Screen Notes Modal */}
            <Modal visible={expanded} animationType="slide" presentationStyle="fullScreen">
                <View style={{ flex: 1, backgroundColor: effectiveBg, paddingTop: insets.top }}>
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: border,
                    }}>
                        <TouchableOpacity onPress={() => { Keyboard.dismiss(); setExpanded(false); }} style={{ padding: 4, marginRight: 12 }}>
                            <X size={20} color={textColor} />
                        </TouchableOpacity>
                        <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: textColor }}>Notes</Text>
                        <TouchableOpacity onPress={startRecording} style={{ padding: 4, marginRight: 16 }}>
                            <Mic size={18} color={accent} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { Keyboard.dismiss(); setExpanded(false); }}>
                            <Text style={{ color: accent, fontWeight: "700", fontSize: 15 }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={{ flex: 1, padding: 20, fontSize: 15, color: textColor, textAlignVertical: "top" }}
                        placeholder={placeholder}
                        placeholderTextColor={`${textColor}55`}
                        value={value ? value.replace(/\n\n\[Voice Note: .*?\]/, "") : ""}
                        onChangeText={onChange}
                        multiline
                        autoFocus
                        scrollEnabled
                    />
                </View>
            </Modal>

            {/* Recording Overlay Modal */}
            <Modal visible={showRecordModal} transparent animationType="fade">
                <View style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                }}>
                    <View style={{
                        width: "90%",
                        backgroundColor: effectiveBg,
                        borderRadius: 24,
                        padding: 30,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: border,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: textColor, marginBottom: 8 }}>
                            Recording Voice Note
                        </Text>
                        <Text style={{ fontSize: 14, color: `${textColor}70`, marginBottom: 30, textAlign: "center" }}>
                            Describe your request details by speaking
                        </Text>

                        {/* Pulsing Mic Circle */}
                        <View style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: `${accent}15`,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: `${accent}30`,
                            marginBottom: 20,
                        }}>
                            <View style={{
                                width: 70,
                                height: 70,
                                borderRadius: 35,
                                backgroundColor: `${accent}30`,
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <Mic size={32} color={accent} />
                            </View>
                        </View>

                        {/* Timer */}
                        <Text style={{ fontSize: 28, fontWeight: "700", color: textColor, marginBottom: 30, fontVariant: ["tabular-nums"] }}>
                            {formatTime(duration)}
                        </Text>

                        {/* Action Buttons */}
                        <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                            <TouchableOpacity
                                onPress={cancelRecording}
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 14,
                                    borderWidth: 1,
                                    borderColor: border,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: textColor, fontWeight: "600" }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={stopRecording}
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 14,
                                    backgroundColor: accent,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: effectiveBg === "#ffffff" || effectiveBg === "#fff" ? "#000" : "#fff", fontWeight: "700" }}>
                                    Stop & Save
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
