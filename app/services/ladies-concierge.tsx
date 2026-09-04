import { showToast } from "@/lib/toast";
import { cleanErr } from "@/lib/cleanErr";
import { useState, useRef, useEffect } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    TextInput, Modal, Alert, Image, Dimensions, Animated,
    Platform, Switch, Keyboard, AppState,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, CheckCircle2, X, Plus, Minus, Mic, Maximize2, Play, Pause, Trash2 } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Audio } from "expo-av";
import LocationSearch from "@/components/LocationSearch";

const { width: W } = Dimensions.get("window");
const archWidth = (W - 48 - 24) / 3; // 24px side padding, 12px gaps, ~3 visible per screen

const OCCASIONS = [
    { id: "date",          label: "Date Night",    emoji: "◎", color: "#7A3B5E", desc: "A night to remember, arranged for you", img: require("@/assets/images/ladies-date-night.png") },
    { id: "spa",           label: "Spa Day",        emoji: "✿", color: "#4A7A6A", desc: "Your body deserves the finest care", img: require("@/assets/images/ladies-spa.png") },
    { id: "shopping",      label: "Shopping",       emoji: "✤", color: "#8C6844", desc: "Curated fashion, personal styling", img: require("@/assets/images/ladies-shopping.png") },
    { id: "event",         label: "Event Prep",     emoji: "❋", color: "#6A3F72", desc: "Arrive flawless, always", img: require("@/assets/images/lagos-beach.jpg") },
    { id: "wellness",      label: "Wellness",       emoji: "◈", color: "#5A6A9E", desc: "Mind, body and soul, restored", img: require("@/assets/ladies-concierge-req/wellness.jpg") },
    { id: "home",          label: "Home",           emoji: "⌂", color: "#8A5C40", desc: "Your household, perfectly managed", img: require("@/assets/ladies-concierge-req/home.jpg") },
    { id: "business",      label: "Business",       emoji: "✦", color: "#3E5068", desc: "Corporate dining, workspace & executive travel", img: require("@/assets/ladies-concierge-req/business.jpg") },
    { id: "entertainment", label: "Entertainment",  emoji: "◎", color: "#2E6655", desc: "VIP events & private experiences", img: require("@/assets/ladies-concierge-req/entertainment.jpg") },
];

// ── Reusable form primitives ─────────────────────────────────────────────────
function SectionLabel({ text, muted }: { text: string; muted: string }) {
    return <Text style={[fl.sectionLabel, { color: muted }]}>{text}</Text>;
}

function MultiPill({ options, selected, onToggle, accent, textColor }: any) {
    return (
        <View style={fl.pillRow}>
            {options.map((opt: string) => {
                const active = selected.includes(opt);
                return (
                    <TouchableOpacity
                        key={opt}
                        style={[fl.pill, { borderColor: active ? accent : "rgba(150,120,80,0.2)" }, active && { backgroundColor: `${accent}18` }]}
                        onPress={() => onToggle(opt)}
                        activeOpacity={0.8}
                    >
                        <Text style={[fl.pillText, { color: active ? accent : textColor }]}>{opt}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function RadioPill({ options, selected, onSelect, accent, textColor }: any) {
    return (
        <View style={fl.pillRow}>
            {options.map((opt: string) => {
                const active = selected === opt;
                return (
                    <TouchableOpacity
                        key={opt}
                        style={[fl.pill, { borderColor: active ? accent : "rgba(150,120,80,0.2)" }, active && { backgroundColor: `${accent}18` }]}
                        onPress={() => onSelect(opt)}
                        activeOpacity={0.8}
                    >
                        <Text style={[fl.pillText, { color: active ? accent : textColor }]}>{opt}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function BudgetStepper({ value, onChange, accent, textColor }: any) {
    const step = 50000;
    return (
        <View style={fl.stepperRow}>
            <TouchableOpacity style={[fl.stepBtn, { borderColor: accent }]} onPress={() => onChange(Math.max(0, value - step))}>
                <Minus size={16} color={accent} />
            </TouchableOpacity>
            <Text style={[fl.stepValue, { color: textColor }]}>
                {value === 0 ? "Open Budget" : `₦${value.toLocaleString()}`}
            </Text>
            <TouchableOpacity style={[fl.stepBtn, { borderColor: accent }]} onPress={() => onChange(value + step)}>
                <Plus size={16} color={accent} />
            </TouchableOpacity>
        </View>
    );
}

function VoiceInput({ value, onChange, voiceUri, onVoiceChange, placeholder, bg, border, textColor, accent }: any) {
    const [expanded, setExpanded] = useState(false);
    const insets = useSafeAreaInsets();

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [showRecordModal, setShowRecordModal] = useState(false);

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

    async function startRecording() {
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
            if (onVoiceChange) onVoiceChange(uri);
            setRecording(null);
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
        } catch (err) {
            console.error("Failed to cancel recording:", err);
            setRecording(null);
            setIsRecording(false);
            setShowRecordModal(false);
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
            setIsPlaying(false);
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
            if (onVoiceChange) onVoiceChange(null);
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
                        flex: 1, minHeight: 90,
                        backgroundColor: bg, borderRadius: 14, borderWidth: 1, borderColor: border,
                        padding: 14, justifyContent: "flex-start",
                    }}
                >
                    <Text
                        style={{ fontSize: 14, color: value ? textColor : `${textColor}55`, lineHeight: 20 }}
                        numberOfLines={4}
                    >
                        {value || placeholder}
                    </Text>
                </TouchableOpacity>
                <View style={{ gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => setExpanded(true)}
                        style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: "center", justifyContent: "center", backgroundColor: bg }}
                    >
                        <Maximize2 size={16} color={accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={startRecording}
                        style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: "center", justifyContent: "center", backgroundColor: bg }}
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
                            <Pause size={16} color={bg === "#ffffff" || bg === "#fff" ? "#000" : "#fff"} />
                        ) : (
                            <Play size={16} color={bg === "#ffffff" || bg === "#fff" ? "#000" : "#fff"} style={{ marginLeft: 2 }} />
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
                            width: 36, height: 36, borderRadius: 10,
                            alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            )}

            <Modal visible={expanded} animationType="slide" presentationStyle="fullScreen">
                <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
                    <View style={{
                        flexDirection: "row", alignItems: "center",
                        paddingHorizontal: 16, paddingVertical: 14,
                        borderBottomWidth: 1, borderBottomColor: border,
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
                        value={value}
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
                    flex: 1, backgroundColor: "rgba(0,0,0,0.8)",
                    alignItems: "center", justifyContent: "center",
                    padding: 24,
                }}>
                    <View style={{
                        width: "90%", backgroundColor: bg, borderRadius: 24,
                        padding: 30, alignItems: "center", borderWidth: 1, borderColor: border,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: textColor, marginBottom: 8 }}>
                            Recording Voice Note
                        </Text>
                        <Text style={{ fontSize: 14, color: `${textColor}70`, marginBottom: 30, textAlign: "center" }}>
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

                        <Text style={{ fontSize: 24, fontWeight: "700", color: textColor, marginBottom: 40 }}>
                            {formatTime(duration)}
                        </Text>

                        <View style={{ flexDirection: "row", gap: 16, width: "100%" }}>
                            <TouchableOpacity
                                onPress={cancelRecording}
                                style={{
                                    flex: 1, paddingVertical: 14, borderRadius: 14,
                                    borderWidth: 1, borderColor: border, alignItems: "center",
                                }}
                            >
                                <Text style={{ color: textColor, fontWeight: "600" }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={stopRecording}
                                style={{
                                    flex: 1, paddingVertical: 14, borderRadius: 14,
                                    backgroundColor: accent, alignItems: "center",
                                }}
                            >
                                <Text style={{ color: bg === "#ffffff" || bg === "#fff" ? "#000" : "#fff", fontWeight: "700" }}>Stop & Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ── Occasion-specific forms ──────────────────────────────────────────────────
function DateNightForm({ accent, muted, textColor, cardBg, border, onData, onDatePick }: any) {
    const [needs, setNeeds] = useState<string[]>([]);
    const [date, setDate] = useState(new Date());
    const [notes, setNotes] = useState("");
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

    const toggle = (v: string) => {
        const next = needs.includes(v) ? needs.filter((x: string) => x !== v) : [...needs, v];
        setNeeds(next); onData({ needs: next, date, notes, notes_voice_note_uri: voiceUri });
    };
    const update = (key: string, val: any) => {
        let nVal = notes;
        let dVal = date;
        if (key === "date") { dVal = val; setDate(val); }
        if (key === "notes") { nVal = val; setNotes(val); }
        onData({ needs, date: dVal, notes: nVal, notes_voice_note_uri: voiceUri });
    };
    const handleVoiceChange = (uri: string | null) => {
        setVoiceUri(uri);
        onData({ needs, date, notes, notes_voice_note_uri: uri });
    };

    return (
        <View>
            <Image source={require("@/assets/images/ladies-date-night.png")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(80,20,20,0.5)" }]}>
                <Text style={fl.formBannerText}>An evening designed for you</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>Tell us what you'd like arranged - we handle every detail with complete discretion.</Text>
                <SectionLabel text="WHAT SHOULD WE ARRANGE?" muted={muted} />
                <MultiPill options={["Transport & Driver", "Outfit Styling", "Restaurant / Venue", "Beauty Appointment", "Full Evening Package"]} selected={needs} onToggle={toggle} accent={accent} textColor={textColor} />
                <SectionLabel text="WHEN IS THE SERVICE?" muted={muted} />
                <TouchableOpacity style={[fl.dateBtn, { borderColor: `${accent}40`, backgroundColor: cardBg }]} onPress={() => onDatePick(date, (d: Date) => update("date", d))}>
                    <Text style={[fl.dateBtnText, { color: textColor }]}>{date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Text>
                </TouchableOpacity>
                <SectionLabel text="ANYTHING ELSE TO KNOW?" muted={muted} />
                <VoiceInput value={notes} onChange={(v: string) => update("notes", v)} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="Dress code, preferences, special requests..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
            </View>
        </View>
    );
}

function SpaDayForm({ accent, muted, textColor, cardBg, border, onData }: any) {
    const [treatments, setTreatments] = useState<string[]>([]);
    const [duration, setDuration] = useState("");
    const [location, setLocation] = useState("");
    const [address, setAddress] = useState("");
    const [allergies, setAllergies] = useState("");
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

    const toggle = (v: string) => {
        const next = treatments.includes(v) ? treatments.filter((x: string) => x !== v) : [...treatments, v];
        setTreatments(next); onData({ treatments: next, duration, location, address, allergies, allergies_voice_note_uri: voiceUri });
    };
    const update = (key: string, val: string) => {
        let dur = duration;
        let loc = location;
        let addr = address;
        let allg = allergies;
        if (key === "duration") { dur = val; setDuration(val); }
        if (key === "location") { loc = val; setLocation(val); if (val === "At Spa") { addr = ""; setAddress(""); } }
        if (key === "address") { addr = val; setAddress(val); }
        if (key === "allergies") { allg = val; setAllergies(val); }
        onData({ treatments, duration: dur, location: loc, address: addr, allergies: allg, allergies_voice_note_uri: voiceUri });
    };
    const handleVoiceChange = (uri: string | null) => {
        setVoiceUri(uri);
        onData({ treatments, duration, location, address, allergies, allergies_voice_note_uri: uri });
    };


    return (
        <View>
            <Image source={require("@/assets/images/ladies-spa.png")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(20,50,60,0.5)" }]}>
                <Text style={fl.formBannerText}>Restore. Renew. Refresh.</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>Your perfect spa day, curated at our finest partner spa, or brought to you. Select what you'd love.</Text>
                <SectionLabel text="WHICH TREATMENTS?" muted={muted} />
                <MultiPill options={["Massage", "Facial", "Manicure & Pedicure", "Hair Treatment", "Body Scrub", "Full Spa Day"]} selected={treatments} onToggle={toggle} accent={accent} textColor={textColor} />
                <SectionLabel text="HOW LONG?" muted={muted} />
                <RadioPill options={["Half Day", "Full Day", "Evening Session"]} selected={duration} onSelect={(v: string) => update("duration", v)} accent={accent} textColor={textColor} />
                <SectionLabel text="WHERE?" muted={muted} />
                <RadioPill options={["At Spa", "Come to Me", "Hotel Room"]} selected={location} onSelect={(v: string) => update("location", v)} accent={accent} textColor={textColor} />
                {(location === "Come to Me" || location === "Hotel Room") && (
                    <LocationSearch
                        value={address}
                        onChangeText={(v: string) => update("address", v)}
                        placeholder={location === "Hotel Room" ? "Search and select hotel..." : "Search and select your address..."}
                        accentColor={accent}
                        style={{ marginTop: 10 }}
                    />
                )}
                <SectionLabel text="ALLERGIES OR SENSITIVITIES?" muted={muted} />
                <VoiceInput value={allergies} onChange={(v: string) => update("allergies", v)} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="Tell us so we ensure a safe, comfortable experience..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
            </View>
        </View>
    );
}

function ShoppingForm({ accent, muted, textColor, cardBg, border, onData }: any) {
    const [shoppingFor, setShoppingFor] = useState("");
    const [budget, setBudget] = useState(0);
    const [brands, setBrands] = useState("");
    const [needStylist, setNeedStylist] = useState(false);
    const [location, setLocation] = useState("");
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

    const update = (patch: any) => {
        const brandsUri = patch.hasOwnProperty("brands_voice_note_uri") ? patch.brands_voice_note_uri : voiceUri;
        onData({ shoppingFor, budget, brands, needStylist, location, brands_voice_note_uri: brandsUri, ...patch });
    };
    const handleVoiceChange = (uri: string | null) => {
        setVoiceUri(uri);
        update({ brands_voice_note_uri: uri });
    };

    return (
        <View>
            <Image source={require("@/assets/images/ladies-shopping.png")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(30,20,60,0.5)" }]}>
                <Text style={fl.formBannerText}>Style curated just for you</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>Whether it's a full wardrobe overhaul or the perfect gift - our team sources, selects, and styles it for you.</Text>
                <SectionLabel text="SHOPPING FOR?" muted={muted} />
                <RadioPill options={["Myself", "A Gift", "Wardrobe Overhaul"]} selected={shoppingFor} onSelect={(v: string) => { setShoppingFor(v); update({ shoppingFor: v }); }} accent={accent} textColor={textColor} />
                <SectionLabel text="BUDGET" muted={muted} />
                <BudgetStepper value={budget} onChange={(v: number) => { setBudget(v); update({ budget: v }); }} accent={accent} textColor={textColor} />
                <SectionLabel text="PREFERRED STYLES OR BRANDS" muted={muted} />
                <VoiceInput value={brands} onChange={(v: string) => { setBrands(v); update({ brands: v }); }} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="e.g. minimal, Lagos designers, Zara, specific boutiques..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
                <SectionLabel text="WHERE TO SHOP?" muted={muted} />
                <RadioPill options={["In-Store", "Online", "Both"]} selected={location} onSelect={(v: string) => { setLocation(v); update({ location: v }); }} accent={accent} textColor={textColor} />
                <View style={[fl.toggleRow, { borderTopColor: border }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[fl.toggleLabel, { color: textColor }]}>Personal stylist to accompany?</Text>
                        <Text style={[fl.toggleSub, { color: muted }]}>A Lapeq stylist will come with you</Text>
                    </View>
                    <Switch value={needStylist} onValueChange={(v) => { setNeedStylist(v); update({ needStylist: v }); }} trackColor={{ false: "#e0dbd2", true: `${accent}60` }} thumbColor={needStylist ? accent : "#fff"} />
                </View>
            </View>
        </View>
    );
}

function EventPrepForm({ accent, muted, textColor, cardBg, border, onData, onDatePick }: any) {
    const [eventType, setEventType] = useState("");
    const [eventDate, setEventDate] = useState(new Date());
    const [services, setServices] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

    const toggle = (v: string) => {
        const next = services.includes(v) ? services.filter((x: string) => x !== v) : [...services, v];
        setServices(next); onData({ eventType, eventDate, services: next, notes, notes_voice_note_uri: voiceUri });
    };
    const update = (key: string, val: any) => {
        let evT = eventType;
        let evD = eventDate;
        let nts = notes;
        if (key === "eventType") { evT = val; setEventType(val); }
        if (key === "eventDate") { evD = val; setEventDate(val); }
        if (key === "notes") { nts = val; setNotes(val); }
        onData({ eventType: evT, eventDate: evD, services, notes: nts, notes_voice_note_uri: voiceUri });
    };
    const handleVoiceChange = (uri: string | null) => {
        setVoiceUri(uri);
        onData({ eventType, eventDate, services, notes, notes_voice_note_uri: uri });
    };

    return (
        <View>
            <Image source={require("@/assets/images/lagos-beach.jpg")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(20,40,20,0.5)" }]}>
                <Text style={fl.formBannerText}>Walk in flawlessly, every time</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>Every great appearance is planned in advance. Let Lapeq coordinate every detail.</Text>
                <SectionLabel text="WHAT KIND OF EVENT?" muted={muted} />
                <RadioPill options={["Wedding", "Gala", "Birthday", "Corporate", "Private Party"]} selected={eventType} onSelect={(v: string) => update("eventType", v)} accent={accent} textColor={textColor} />
                <SectionLabel text="EVENT DATE" muted={muted} />
                <TouchableOpacity style={[fl.dateBtn, { borderColor: `${accent}40`, backgroundColor: cardBg }]} onPress={() => onDatePick(eventDate, (d: Date) => update("eventDate", d))}>
                    <Text style={[fl.dateBtnText, { color: textColor }]}>{eventDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Text>
                </TouchableOpacity>
                <SectionLabel text="WHAT DO YOU NEED?" muted={muted} />
                <MultiPill options={["Hair & Makeup", "Outfit Styling", "Transport & Driver", "Accommodation", "Full Preparation"]} selected={services} onToggle={toggle} accent={accent} textColor={textColor} />
                <SectionLabel text="ANYTHING SPECIFIC?" muted={muted} />
                <VoiceInput value={notes} onChange={(v: string) => update("notes", v)} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="Theme, dress code, timing, venue details..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
            </View>
        </View>
    );
}

function WellnessForm({ accent, muted, textColor, cardBg, border, onData }: any) {
    const [focus, setFocus] = useState("");
    const [frequency, setFrequency] = useState("");
    const [notes, setNotes] = useState("");
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

    const update = (key: string, val: string) => {
        let fcs = focus;
        let frq = frequency;
        let nts = notes;
        if (key === "focus") { fcs = val; setFocus(val); }
        if (key === "frequency") { frq = val; setFrequency(val); }
        if (key === "notes") { nts = val; setNotes(val); }
        onData({ focus: fcs, frequency: frq, notes: nts, notes_voice_note_uri: voiceUri });
    };
    const handleVoiceChange = (uri: string | null) => {
        setVoiceUri(uri);
        onData({ focus, frequency, notes, notes_voice_note_uri: uri });
    };

    return (
        <View>
            <Image source={require("@/assets/ladies-concierge-req/wellness.jpg")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(40,30,60,0.5)" }]}>
                <Text style={fl.formBannerText}>Designed around you, entirely</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>True wellness is personal. Tell us what you need and we'll create a restorative experience built entirely for you.</Text>
                <SectionLabel text="WHAT KIND OF WELLNESS?" muted={muted} />
                <RadioPill options={["Physical & Fitness", "Mental & Emotional", "Beauty & Self-Care", "Complete Wellness Day"]} selected={focus} onSelect={(v: string) => update("focus", v)} accent={accent} textColor={textColor} />
                <SectionLabel text="HOW OFTEN?" muted={muted} />
                <RadioPill options={["Just Once", "Weekly", "Monthly"]} selected={frequency} onSelect={(v: string) => update("frequency", v)} accent={accent} textColor={textColor} />
                <SectionLabel text="GOALS OR PREFERENCES?" muted={muted} />
                <VoiceInput value={notes} onChange={(v: string) => update("notes", v)} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="Health conditions, environment preference, goals..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
            </View>
        </View>
    );
}

function HomeForm({ accent, muted, textColor, cardBg, border, onData }: any) {
    const [needs, setNeeds] = useState<string[]>([]);
    const [urgency, setUrgency] = useState("");
    const [notes, setNotes] = useState("");
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

    const toggle = (v: string) => {
        const next = needs.includes(v) ? needs.filter((x: string) => x !== v) : [...needs, v];
        setNeeds(next); onData({ needs: next, urgency, notes, notes_voice_note_uri: voiceUri });
    };
    const update = (key: string, val: string) => {
        let urg = urgency;
        let nts = notes;
        if (key === "urgency") { urg = val; setUrgency(val); }
        if (key === "notes") { nts = val; setNotes(val); }
        onData({ needs, urgency: urg, notes: nts, notes_voice_note_uri: voiceUri });
    };
    const handleVoiceChange = (uri: string | null) => {
        setVoiceUri(uri);
        onData({ needs, urgency, notes, notes_voice_note_uri: uri });
    };

    return (
        <View>
            <Image source={require("@/assets/ladies-concierge-req/home.jpg")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(10,30,20,0.5)" }]}>
                <Text style={fl.formBannerText}>Your home, seamlessly managed</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>Your home and family deserve the same care you give everything else. Let us carry some of the load.</Text>
                <SectionLabel text="WHAT DO YOU NEED HELP WITH?" muted={muted} />
                <MultiPill options={["Domestic Staff", "Home Repairs", "Family Errands", "Admin & Paperwork", "Property Management"]} selected={needs} onToggle={toggle} accent={accent} textColor={textColor} />
                <SectionLabel text="HOW URGENT?" muted={muted} />
                <RadioPill options={["ASAP", "This Week", "This Month", "Ongoing"]} selected={urgency} onSelect={(v: string) => update("urgency", v)} accent={accent} textColor={textColor} />
                <SectionLabel text="DETAILS" muted={muted} />
                <VoiceInput value={notes} onChange={(v: string) => update("notes", v)} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="Describe your situation and what would be most helpful..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
            </View>
        </View>
    );
}

function BusinessForm({ accent, muted, textColor, cardBg, border, onData, onDatePick }: any) {
    const [needs, setNeeds] = useState<string[]>([]);
    const [date, setDate] = useState(new Date());
    const [notes, setNotes] = useState("");
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

    const toggle = (v: string) => {
        const next = needs.includes(v) ? needs.filter((x: string) => x !== v) : [...needs, v];
        setNeeds(next); onData({ needs: next, date, notes, notes_voice_note_uri: voiceUri });
    };
    const update = (key: string, val: any) => {
        let dt = date;
        let nts = notes;
        if (key === "date") { dt = val; setDate(val); }
        if (key === "notes") { nts = val; setNotes(val); }
        onData({ needs, date: dt, notes: nts, notes_voice_note_uri: voiceUri });
    };
    const handleVoiceChange = (uri: string | null) => {
        setVoiceUri(uri);
        onData({ needs, date, notes, notes_voice_note_uri: uri });
    };

    return (
        <View>
            <Image source={require("@/assets/ladies-concierge-req/business.jpg")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(5,10,20,0.58)" }]}>
                <Text style={fl.formBannerText}>Business handled with precision</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>A power lunch, the right workspace, or a seamless business trip - we arrange it all, so you can focus on what matters.</Text>
                <SectionLabel text="WHAT DO YOU NEED?" muted={muted} />
                <MultiPill options={["Corporate Dining", "Meeting Space", "Executive Travel", "Client Event", "Airport Protocol"]} selected={needs} onToggle={toggle} accent={accent} textColor={textColor} />
                <SectionLabel text="WHEN?" muted={muted} />
                <TouchableOpacity style={[fl.dateBtn, { borderColor: `${accent}40`, backgroundColor: cardBg }]} onPress={() => onDatePick(date, (d: Date) => update("date", d))}>
                    <Text style={[fl.dateBtnText, { color: textColor }]}>{date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Text>
                </TouchableOpacity>
                <SectionLabel text="DETAILS" muted={muted} />
                <VoiceInput value={notes} onChange={(v: string) => update("notes", v)} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="Guests, preferences, specific requirements..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
            </View>
        </View>
    );
}

function EntertainmentForm({ accent, muted, textColor, cardBg, border, onData, onDatePick }: any) {
    const [eventType, setEventType] = useState("");
    const [guests, setGuests] = useState("");
    const [date, setDate] = useState(new Date());
    const [notes, setNotes] = useState("");
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

    const update = (key: string, val: any) => {
        let evT = eventType;
        let gst = guests;
        let dt = date;
        let nts = notes;
        if (key === "eventType") { evT = val; setEventType(val); }
        if (key === "guests") { gst = val; setGuests(val); }
        if (key === "date") { dt = val; setDate(val); }
        if (key === "notes") { nts = val; setNotes(val); }
        onData({ eventType: evT, guests: gst, date: dt, notes: nts, notes_voice_note_uri: voiceUri });
    };
    const handleVoiceChange = (uri: string | null) => {
        setVoiceUri(uri);
        onData({ eventType, guests, date, notes, notes_voice_note_uri: uri });
    };

    return (
        <View>
            <Image source={require("@/assets/ladies-concierge-req/entertainment.jpg")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(5,10,5,0.55)" }]}>
                <Text style={fl.formBannerText}>Experiences worth talking about</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>VIP access, private events, and unforgettable experiences arranged for you and your guests.</Text>
                <SectionLabel text="WHAT KIND OF EXPERIENCE?" muted={muted} />
                <RadioPill options={["Golf Day", "Sporting Event", "Concert", "Private Screening", "Yacht / Boat", "Casino Night"]} selected={eventType} onSelect={(v: string) => update("eventType", v)} accent={accent} textColor={textColor} />
                <SectionLabel text="HOW MANY GUESTS?" muted={muted} />
                <RadioPill options={["Just Me", "2 guests", "3–5 guests", "Group (6+)"]} selected={guests} onSelect={(v: string) => update("guests", v)} accent={accent} textColor={textColor} />
                <SectionLabel text="DATE" muted={muted} />
                <TouchableOpacity style={[fl.dateBtn, { borderColor: `${accent}40`, backgroundColor: cardBg }]} onPress={() => onDatePick(date, (d: Date) => update("date", d))}>
                    <Text style={[fl.dateBtnText, { color: textColor }]}>{date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Text>
                </TouchableOpacity>
                <SectionLabel text="ANYTHING ELSE?" muted={muted} />
                <VoiceInput value={notes} onChange={(v: string) => update("notes", v)} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="Specific venues, teams, dietary needs, accessibility..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
            </View>
        </View>
    );
}

const FORM_MAP: Record<string, any> = {
    date: DateNightForm,
    spa: SpaDayForm,
    shopping: ShoppingForm,
    event: EventPrepForm,
    wellness: WellnessForm,
    home: HomeForm,
    business: BusinessForm,
    entertainment: EntertainmentForm,
};

// ── Main screen ───────────────────────────────────────────────────────────────
export default function LadiesConciergeScreen() {
    const router = useRouter();
    const { C, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === "dark";

    // Theme-aware warm colors
    const pageBg = isDark ? "#0f0c0a" : "#fdf9f5";
    const cardBg = isDark ? "#1a1410" : "#ffffff";
    const textColor = isDark ? "#f0ece4" : "#2a2218";
    const muted = isDark ? "rgba(240,236,228,0.45)" : "rgba(42,34,24,0.45)";
    const border = isDark ? "rgba(201,168,76,0.15)" : "rgba(150,120,80,0.18)";
    const formCard = isDark ? "#1e1810" : "#ffffff";

    const { eventTag, eventDate: eventDateParam } = useLocalSearchParams<{ eventTag?: string; eventDate?: string }>();

    const [occasion, setOccasion] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const formAnim = useRef(new Animated.Value(0)).current;
    const archScrollRef = useRef<ScrollView>(null);

    const [userTier, setUserTier] = useState<string | null>(null);
    const [monthlyRequestsCount, setMonthlyRequestsCount] = useState(0);

    useEffect(() => {
        const loadUserTier = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

                const [{ data: profile }, { count }] = await Promise.all([
                    supabase.from("profiles").select("tier").eq("id", user.id).single(),
                    supabase.from("requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfMonth),
                ]);

                if (profile) setUserTier(profile.tier);
                setMonthlyRequestsCount(count ?? 0);
            }
        };
        loadUserTier();
    }, []);

    const isFreeUser = !userTier || !["silver", "gold", "black"].includes(userTier.toLowerCase());
    const limitReached = isFreeUser && monthlyRequestsCount >= 5;

    // Screen-level date picker (lifted out of form components to avoid nesting/overflow issues)
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerDate, setPickerDate] = useState(new Date());
    const [pickerCallback, setPickerCallback] = useState<((d: Date) => void) | null>(null);

    const handleDatePick = (currentDate: Date, onSelect: (d: Date) => void) => {
        setPickerDate(currentDate);
        setPickerCallback(() => onSelect);
        setShowDatePicker(true);
    };

    const currentOccasion = OCCASIONS.find(o => o.id === occasion);

    const selectOccasion = (id: string) => {
        if (id === occasion) return;
        Animated.timing(formAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setOccasion(id);
            setFormData({});
            Animated.spring(formAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
        });
    };

    useEffect(() => {
        const idx = OCCASIONS.findIndex(o => o.id === occasion);
        if (idx < 0 || !archScrollRef.current) return;
        const itemLeft = 24 + idx * (archWidth + 12);
        const targetX = Math.max(0, itemLeft - (W - archWidth) / 2);
        archScrollRef.current.scrollTo({ x: targetX, animated: true });
    }, [occasion]);

    const handleSubmit = async () => {
        if (limitReached) {
            Alert.alert("Limit Reached", "You've used all 5 of your monthly requests. Upgrade to Premium to continue.");
            return;
        }
        if (!occasion) { Alert.alert("Please select a service first."); return; }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setLoading(true);

        const uploadedDetails = { ...formData };
        for (const [key, value] of Object.entries(formData)) {
            if (key.endsWith("_uri") && value) {
                try {
                    const ext = "m4a";
                    const path = `voice-notes/${user.id}/${Date.now()}_${key.replace("_uri", "")}.${ext}`;
                    const resp = await fetch(String(value));
                    const blob = await resp.blob();
                    const { error: upErr } = await supabase.storage
                        .from("voice-notes")
                        .upload(path, blob, { upsert: false, contentType: "audio/m4a" });
                    
                    if (upErr) {
                        console.error("Error uploading voice note:", upErr);
                    } else {
                        const { data: pub } = supabase.storage.from("voice-notes").getPublicUrl(path);
                        const fieldName = key.replace("_uri", "");
                        uploadedDetails[fieldName] = pub.publicUrl;
                    }
                } catch (upErr) {
                    console.error("Failed to upload voice note:", upErr);
                }
                delete uploadedDetails[key];
            }
        }

        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const { error } = await supabase.from("requests").insert({
            user_id: user.id, reference: ref,
            service_type: "ladies-concierge", status: "pending",
            title: `Ladies Concierge - ${currentOccasion?.label}`,
            details: { occasion, ...uploadedDetails, ...(eventTag ? { eventTag, eventDate: eventDateParam } : {}) },
        });
        setLoading(false);
        if (error) { showToast(cleanErr(error), "error"); return; }
        setSuccess(true);
    };

    const FormComponent = occasion ? FORM_MAP[occasion] : null;

    return (
        <View style={[s.root, { backgroundColor: pageBg }]}>
            {/* Faint wash of the active occasion's own color */}
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: currentOccasion ? `${currentOccasion.color}1A` : "transparent" }]} />

            <View style={[s.slimHeader, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={[s.backBtnSlim, { backgroundColor: cardBg }]} onPress={() => router.back()}>
                    <ChevronLeft size={20} color={textColor} />
                </TouchableOpacity>
                <Text style={[s.slimHeaderTitle, { color: textColor }]} numberOfLines={1}>
                    {currentOccasion ? currentOccasion.label : "Ladies Concierge"}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {!!eventTag && (
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, marginTop: 4 }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: "#c9a84c25", borderWidth: 1, borderColor: "#c9a84c60" }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#c9a84c", letterSpacing: 0.5 }}>EVENT · {eventTag}</Text>
                    </View>
                </View>
            )}

            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} enableOnAndroid extraScrollHeight={20} keyboardOpeningTime={0}>

                {/* ── Occasion arches ── */}
                <ScrollView
                    ref={archScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 6 }}
                >
                    {OCCASIONS.map(o => {
                        const active = occasion === o.id;
                        return (
                            <TouchableOpacity
                                key={o.id}
                                style={{ width: archWidth, opacity: active ? 1 : 0.65 }}
                                onPress={() => selectOccasion(o.id)}
                                activeOpacity={0.85}
                            >
                                <View
                                    style={{
                                        width: archWidth,
                                        height: 158,
                                        borderTopLeftRadius: archWidth / 2,
                                        borderTopRightRadius: archWidth / 2,
                                        borderBottomLeftRadius: 28,
                                        borderBottomRightRadius: 28,
                                        overflow: "hidden",
                                        backgroundColor: cardBg,
                                    }}
                                >
                                    <Image source={o.img} style={{ width: "100%", height: "100%", position: "absolute" }} resizeMode="cover" />
                                    <View
                                        pointerEvents="none"
                                        style={{
                                            position: "absolute",
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            borderTopLeftRadius: archWidth / 2,
                                            borderTopRightRadius: archWidth / 2,
                                            borderBottomLeftRadius: 28,
                                            borderBottomRightRadius: 28,
                                            borderWidth: active ? 2.5 : 1.5,
                                            borderColor: o.color,
                                        }}
                                    />
                                </View>
                                <Text
                                    style={{ fontSize: 11, fontWeight: "800", color: textColor, textAlign: "center", marginTop: 8 }}
                                    numberOfLines={2}
                                >
                                    {o.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── Form ── */}
                {FormComponent && (
                    <Animated.View style={[s.formSection, { backgroundColor: pageBg, opacity: formAnim, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] }]}>
                        <View style={[s.formCard, { backgroundColor: formCard, borderColor: `${C.primary}20`, shadowColor: C.primary }]}>
                            <FormComponent
                                accent={C.primary}
                                muted={muted}
                                textColor={textColor}
                                cardBg={isDark ? "#2a2010" : "#f5f0ea"}
                                border={border}
                                onData={setFormData}
                                onDatePick={handleDatePick}
                            />
                        </View>
                        {isFreeUser && (
                            <View style={{ marginVertical: 12 }}>
                                <Text style={{ fontSize: 12, color: muted, textAlign: "center" }}>
                                    Community Plan · {monthlyRequestsCount}/5 monthly requests used
                                </Text>
                            </View>
                        )}
                        {limitReached ? (
                            <View style={{ borderRadius: 18, padding: 24, alignItems: "center", gap: 10, borderWidth: 1, borderColor: `${C.primary}40`, backgroundColor: `${C.primary}08`, marginTop: 12 }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: C.primary, letterSpacing: -0.2 }}>Monthly Limit Reached</Text>
                                <Text style={{ fontSize: 13, color: muted, textAlign: "center", lineHeight: 20 }}>
                                    You've used all 5 of your monthly concierge requests. Upgrade to Lapeq Premium for unlimited access.
                                </Text>
                                <TouchableOpacity
                                    style={{ marginTop: 6, backgroundColor: C.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
                                    onPress={() => router.push("/(main)/membership" as any)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={{ color: "#000", fontSize: 14, fontWeight: "800" }}>Upgrade to Premium</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[s.submitBtn, { backgroundColor: C.primary, opacity: loading ? 0.6 : 1 }]}
                                onPress={handleSubmit}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                <Text style={s.submitText}>{loading ? "Submitting..." : `Request ${currentOccasion?.label}`}</Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}

                {!occasion && (
                    <View style={s.emptyState}>
                        <Image
                            source={require("@/assets/emptystate/ladies.png")}
                            style={{ width: 260, height: 260 }}
                            resizeMode="contain"
                        />
                        <Text style={[s.emptyText, { color: muted }]}>Select a service above{"\n"}to get started</Text>
                    </View>
                )}
            </KeyboardAwareScrollView>

            {/* ── Date Picker (screen-level, avoids overflow/nesting issues) ── */}
            <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
                    <View style={{ backgroundColor: isDark ? "#1e1810" : "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" }}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ fontSize: 15, fontWeight: "700", color: "#888" }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ fontSize: 15, fontWeight: "700", color: C.primary }}>Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={pickerDate}
                            mode="date"
                            display="spinner"
                            themeVariant={isDark ? "dark" : "light"}
                            style={{ width: "100%" }}
                            onChange={(_, d) => {
                                if (d) {
                                    setPickerDate(d);
                                    if (pickerCallback) pickerCallback(d);
                                }
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* ── Success ── */}
            <Modal visible={success} transparent animationType="fade">
                <View style={s.successOverlay}>
                    <View style={[s.successBox, { backgroundColor: isDark ? "#1a1410" : "#fff", borderColor: C.primary }]}>
                        <CheckCircle2 size={48} color={C.primary} style={{ marginBottom: 16 }} />
                        <Text style={[s.successTitle, { color: textColor }]}>Request Received</Text>
                        <Text style={[s.successBody, { color: muted }]}>Your concierge will reach out shortly to confirm every detail.</Text>
                        <TouchableOpacity style={[s.successBtn, { backgroundColor: C.primary }]} onPress={() => { setSuccess(false); router.push("/requests"); }}>
                            <Text style={s.successBtnText}>View My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSuccess(false); router.back(); }} style={{ marginTop: 12 }}>
                            <Text style={[s.successDone, { color: muted }]}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ── Form styles ───────────────────────────────────────────────────────────────
const fl = StyleSheet.create({
    formBanner: { width: "100%", height: 160 },
    formBannerOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: 160, justifyContent: "flex-end", padding: 16 },
    formBannerText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", fontStyle: "italic" },
    formBody: { padding: 20, gap: 2 },
    formDesc: { fontSize: 14, lineHeight: 23, marginBottom: 8, fontStyle: "italic" },
    sectionLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 2, marginBottom: 10, marginTop: 16 },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, borderWidth: 1 },
    pillText: { fontSize: 13, fontWeight: "500" },
    stepperRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 4 },
    stepBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
    stepValue: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
    voiceWrap: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
    input: { padding: 14, fontSize: 14, minHeight: 100, fontStyle: "italic" },
    micBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, gap: 6 },
    dateBtn: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 4 },
    dateBtnText: { fontSize: 15, fontWeight: "600" },
    dateModal: { flex: 1, justifyContent: "flex-end" },
    dateBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
    dateSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
    dateSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },
    dateSheetBtn: { fontSize: 15, fontWeight: "700" },
    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
    toggleLabel: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
    toggleSub: { fontSize: 12 },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1 },
    slimHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
    backBtnSlim: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    slimHeaderTitle: { flex: 1, fontSize: 20, fontWeight: "800", textAlign: "center", fontFamily: "PlayfairDisplay_700Bold" },

    formSection: { paddingHorizontal: 20, paddingTop: 24 },
    formCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
    submitBtn: { borderRadius: 16, paddingVertical: 18, alignItems: "center", marginBottom: 12 },
    submitText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },

    emptyState: { alignItems: "center", paddingTop: 8 },
    emptyText: { fontSize: 15, textAlign: "center", lineHeight: 24, fontStyle: "italic" },

    successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    successBox: { width: "100%", borderRadius: 24, padding: 32, alignItems: "center", borderWidth: 1 },
    successTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10, fontFamily: "PlayfairDisplay_700Bold" },
    successBody: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 28, fontStyle: "italic" },
    successBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
    successBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0a0a" },
    successDone: { fontSize: 14 },
});
