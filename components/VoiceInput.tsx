import React, { useState, useEffect } from "react";
import {
    View, Text, TouchableOpacity, TextInput, Modal, Alert, Keyboard, Platform, StyleSheet, AppState
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { Maximize2, Mic, X, Pause, Play, Trash2, ChevronDown } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

interface VoiceInputProps {
    placeholder: string;
    value: string;
    onChange: (text: string) => void;
    accent: string;
    textColor: string;
    border: string;
    inputBg: string;
}

export default function VoiceInput({
    placeholder,
    value,
    onChange,
    accent,
    textColor,
    border,
    inputBg,
}: VoiceInputProps) {
    const [expanded, setExpanded] = useState(false);
    const insets = useSafeAreaInsets();

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [showRecordModal, setShowRecordModal] = useState(false);
    // Remembers whether the Notes modal was open when recording started, so
    // we can put it back afterward — see startRecording/stopRecording/cancelRecording.
    const [reopenNotesAfter, setReopenNotesAfter] = useState(false);

    const [uploading, setUploading] = useState(false);
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

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

    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    // Cleanup an in-progress recording on unmount. Without this, closing the
    // screen mid-recording leaves expo-av's native recording session running
    // orphaned in the background — and since it only allows one Recording
    // object globally, every future attempt to record fails with "Only one
    // Recording object can be prepared at a given time" until the app is
    // fully restarted.
    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync().catch(() => {});
            }
        };
    }, [recording]);

    // Extract voice note URL from notes value if it exists
    const voiceNoteUrlMatch = value ? value.match(/\[Voice Note: (https:\/\/.*?)\]/) : null;
    const voiceNoteUrl = voiceNoteUrlMatch ? voiceNoteUrlMatch[1] : null;

    // Local voiceUri should be synced if voiceNoteUrl is present
    useEffect(() => {
        if (voiceNoteUrl && !voiceUri) {
            setVoiceUri(voiceNoteUrl);
        }
    }, [voiceNoteUrl]);

    async function startRecording() {
        // expo-av only allows one Audio.Recording prepared at a time — this
        // component has two mic buttons (collapsed input + expanded modal)
        // that both call startRecording, so guard against either firing again
        // while a recording is already in progress.
        if (recording || isRecording) return;
        try {
            Keyboard.dismiss();
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== "granted") {
                Alert.alert("Permission Required", "Please allow microphone access in your device Settings to record voice notes.");
                return;
            }

            // If the app is transitioning from the iOS permission dialog, wait until UIKit marks it active
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
                    }, 1200);
                });
            }

            // Give iOS a moment to finish dismissing the permission dialog and restore the audio hardware route
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Clean up any lingering recording before preparing a new one
            if (recording) {
                try {
                    await (recording as Audio.Recording).stopAndUnloadAsync();
                } catch (_) {}
                setRecording(null);
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true, // Prevents "This experience is currently in the background" error
                interruptionModeIOS: 1, // InterruptionModeIOS.DoNotMix
                shouldDuckAndroid: true,
                interruptionModeAndroid: 1,
                playThroughEarpieceAndroid: false,
            });

            const recordingOptions = {
                isMeteringEnabled: true,
                android: {
                    extension: ".m4a",
                    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                    audioEncoder: Audio.AndroidAudioEncoder.AAC,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: ".m4a",
                    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
                    audioQuality: Audio.IOSAudioQuality.HIGH,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                web: {
                    mimeType: "audio/webm",
                    bitsPerSecond: 128000,
                },
            };

            let preparedRecording: Audio.Recording | null = null;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    preparedRecording = new Audio.Recording();
                    await preparedRecording.prepareToRecordAsync(recordingOptions);
                    await preparedRecording.startAsync();
                    break;
                } catch (prepErr: any) {
                    if (preparedRecording) {
                        try { await preparedRecording.stopAndUnloadAsync(); } catch (_) {}
                        preparedRecording = null;
                    }
                    if (attempt < 2 && (prepErr?.message?.includes("background") || prepErr?.message?.includes("Prepare encountered an error"))) {
                        console.warn(`Audio session busy or backgrounded, retrying in 600ms (attempt ${attempt + 1})...`);
                        await new Promise((resolve) => setTimeout(resolve, 600));
                        continue;
                    }
                    throw prepErr;
                }
            }

            if (!preparedRecording) {
                throw new Error("Could not initialize audio recorder. Please try again.");
            }

            // Two sibling <Modal> components don't reliably stack in React
            // Native — if the Notes modal is already open, close it so the
            // recording overlay is guaranteed to actually be what's showing,
            // and remember to reopen Notes once recording finishes.
            if (expanded) {
                setReopenNotesAfter(true);
                setExpanded(false);
            }

            setRecording(preparedRecording);
            setIsRecording(true);
            setShowRecordModal(true);
        } catch (err: any) {
            console.error("Failed to start recording:", err);
            Alert.alert("Recording Error", err?.message || "Could not start audio recording. Please try again.");
            if (recording) {
                try {
                    await (recording as Audio.Recording).stopAndUnloadAsync();
                } catch (_) {}
                setRecording(null);
            }
            setIsRecording(false);
            setShowRecordModal(false);
        }
    }

    async function stopRecording() {
        if (!recording) return;
        try {
            setIsRecording(false);
            setShowRecordModal(false);
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                interruptionModeIOS: 1,
            });
            const uri = recording.getURI();
            setRecording(null);
            if (reopenNotesAfter) {
                setReopenNotesAfter(false);
                setExpanded(true);
            }
            if (uri) {
                setVoiceUri(uri);
                await uploadVoiceNote(uri);
            }
        } catch (err) {
            console.error("Failed to stop recording:", err);
            setRecording(null);
            setIsRecording(false);
            setShowRecordModal(false);
            Alert.alert("Error", "Could not stop audio recording.");
        }
    }

    async function cancelRecording() {
        if (!recording) return;
        try {
            setIsRecording(false);
            setShowRecordModal(false);
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                interruptionModeIOS: 1,
            });
            setRecording(null);
            if (reopenNotesAfter) {
                setReopenNotesAfter(false);
                setExpanded(true);
            }
        } catch (err) {
            console.error("Failed to cancel recording:", err);
            setRecording(null);
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
                Alert.alert("Upload Error", "Failed to upload voice note.");
            } else {
                const { data: pub } = supabase.storage.from("voice-notes").getPublicUrl(path);
                const publicUrl = pub.publicUrl;
                // Append voice note marker to notes text
                const textWithoutVoice = value ? value.replace(/\n\n\[Voice Note: .*?\]/, "") : "";
                onChange(textWithoutVoice + "\n\n[Voice Note: " + publicUrl + "]");
            }
        } catch (err) {
            console.error("Failed to upload voice note:", err);
            Alert.alert("Upload Error", "Could not upload voice note.");
        } finally {
            setUploading(false);
        }
    }

    async function playSound() {
        if (!voiceUri) return;
        try {
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                interruptionModeIOS: 1,
            });
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: voiceUri },
                { shouldPlay: true }
            );
            setSound(newSound);
            setIsPlaying(true);
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (err) {
            console.error("Failed to play sound:", err);
            Alert.alert("Error", "Could not play the recorded audio.");
        }
    }

    async function pauseSound() {
        if (sound) {
            await sound.pauseAsync();
            setIsPlaying(false);
        }
    }

    async function deleteSound() {
        try {
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }
            setIsPlaying(false);
            setVoiceUri(null);
            // Remove voice note marker from notes text
            const textWithoutVoice = value ? value.replace(/\n\n\[Voice Note: .*?\]/, "") : "";
            onChange(textWithoutVoice);
        } catch (err) {
            console.error("Failed to delete sound:", err);
        }
    }

    function formatTime(secs: number) {
        const mins = Math.floor(secs / 60);
        const remainder = secs % 60;
        return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
    }

    const displayValue = value ? value.replace(/\n\n\[Voice Note: .*?\]/, "") : "";

    return (
        <View style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setExpanded(true)}
                    style={{
                        flex: 1, minHeight: 90,
                        backgroundColor: inputBg, borderRadius: 14, borderWidth: 1, borderColor: border,
                        padding: 14, justifyContent: "flex-start",
                    }}
                >
                    <Text
                        style={{ fontSize: 14, fontFamily: "Jost_400Regular", color: displayValue ? textColor : `${textColor}50`, lineHeight: 20 }}
                        numberOfLines={4}
                    >
                        {displayValue || placeholder}
                    </Text>
                </TouchableOpacity>
                <View style={{ gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => setExpanded(true)}
                        style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: "center", justifyContent: "center", backgroundColor: inputBg }}
                    >
                        <Maximize2 size={16} color={accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={startRecording}
                        style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: "center", justifyContent: "center", backgroundColor: inputBg }}
                    >
                        <Mic size={18} color={accent} />
                    </TouchableOpacity>
                </View>
            </View>

            {voiceUri && (
                <View style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    backgroundColor: `${accent}10`, borderWidth: 1, borderColor: `${accent}25`,
                    borderRadius: 14, padding: 12, marginTop: 12,
                }}>
                    <TouchableOpacity
                        onPress={isPlaying ? pauseSound : playSound}
                        style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: accent, alignItems: "center", justifyContent: "center",
                        }}
                    >
                        {isPlaying ? (
                            <Pause size={16} color={inputBg === "#ffffff" || inputBg === "#fff" ? "#000" : "#fff"} />
                        ) : (
                            <Play size={16} color={inputBg === "#ffffff" || inputBg === "#fff" ? "#000" : "#fff"} style={{ marginLeft: 2 }} />
                        )}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: textColor, fontFamily: "Jost_600SemiBold" }}>
                            {uploading ? "Uploading voice note..." : "Voice Note Recorded"}
                        </Text>
                        <Text style={{ fontSize: 11, color: `${textColor}60`, fontFamily: "Jost_400Regular" }}>
                            {uploading ? "Please wait..." : "Tap play to preview"}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={deleteSound}
                        style={{
                            width: 36, height: 36, borderRadius: 8,
                            alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            )}

            <Modal visible={expanded} animationType="slide" presentationStyle="fullScreen">
                <View style={{ flex: 1, backgroundColor: inputBg, paddingTop: insets.top }}>
                    <View style={{
                        flexDirection: "row", alignItems: "center",
                        paddingHorizontal: 16, paddingVertical: 14,
                        borderBottomWidth: 1, borderBottomColor: border,
                    }}>
                        <TouchableOpacity onPress={() => { Keyboard.dismiss(); setExpanded(false); }} style={{ padding: 4, marginRight: 12 }}>
                            <X size={20} color={textColor} />
                        </TouchableOpacity>
                        <Text style={{ flex: 1, fontSize: 15, fontFamily: "Jost_600SemiBold", color: textColor }}>Notes</Text>
                        <TouchableOpacity onPress={startRecording} style={{ padding: 4, marginRight: 16 }}>
                            <Mic size={18} color={accent} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Keyboard.dismiss()} style={{ padding: 4, marginRight: 16 }}>
                            <ChevronDown size={20} color={textColor} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { Keyboard.dismiss(); setExpanded(false); }}>
                            <Text style={{ color: accent, fontFamily: "Jost_700Bold", fontSize: 15 }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={{ flex: 1, padding: 20, fontSize: 15, fontFamily: "Jost_400Regular", color: textColor, textAlignVertical: "top" }}
                        placeholder={placeholder}
                        placeholderTextColor={`${textColor}50`}
                        value={displayValue}
                        onChangeText={(text) => {
                            const match = value ? value.match(/\n\n\[Voice Note: .*?\]/) : null;
                            const voicePart = match ? match[0] : "";
                            onChange(text + voicePart);
                        }}
                        multiline
                        autoFocus
                        scrollEnabled
                    />
                </View>
            </Modal>

            {/* Recording Overlay Modal */}
            <Modal visible={showRecordModal} transparent animationType="fade">
                <View style={{
                    flex: 1, backgroundColor: "rgba(0,0,0,0.8)",
                    alignItems: "center", justifyContent: "center",
                    padding: 24,
                }}>
                    <View style={{
                        width: "90%", backgroundColor: inputBg, borderRadius: 18,
                        padding: 30, alignItems: "center", borderWidth: 1, borderColor: border,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: textColor, fontFamily: "Jost_700Bold", marginBottom: 8 }}>
                            Recording Voice Note
                        </Text>
                        <Text style={{ fontSize: 14, color: `${textColor}70`, fontFamily: "Jost_400Regular", marginBottom: 30, textAlign: "center" }}>
                            Describe your request details by speaking
                        </Text>

                        {/* Pulsing Mic Circle */}
                        <View style={{
                            width: 100, height: 100, borderRadius: 50,
                            backgroundColor: `${accent}15`, alignItems: "center", justifyContent: "center",
                            borderWidth: 1, borderColor: `${accent}30`,
                            marginBottom: 20,
                        }}>
                            <View style={{
                                width: 70, height: 70, borderRadius: 35,
                                backgroundColor: `${accent}30`, alignItems: "center", justifyContent: "center",
                            }}>
                                <Mic size={32} color={accent} />
                            </View>
                        </View>

                        <Text style={{ fontSize: 24, fontWeight: "700", color: textColor, fontFamily: "Jost_700Bold", marginBottom: 40 }}>
                            {formatTime(duration)}
                        </Text>

                        <View style={{ flexDirection: "row", gap: 16, width: "100%" }}>
                            <TouchableOpacity
                                onPress={cancelRecording}
                                style={{
                                    flex: 1, paddingVertical: 14, borderRadius: 8,
                                    borderWidth: 1, borderColor: border, alignItems: "center",
                                }}
                            >
                                <Text style={{ color: textColor, fontWeight: "600", fontFamily: "Jost_600SemiBold" }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={stopRecording}
                                style={{
                                    flex: 1, paddingVertical: 14, borderRadius: 8,
                                    backgroundColor: accent, alignItems: "center",
                                }}
                            >
                                <Text style={{ color: inputBg === "#ffffff" || inputBg === "#fff" ? "#000" : "#fff", fontWeight: "700", fontFamily: "Jost_700Bold" }}>Stop & Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
