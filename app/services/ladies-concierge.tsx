import { useState, useRef, useEffect } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    TextInput, Modal, Alert, Image, Dimensions, Animated,
    Platform, Switch, Keyboard,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, CheckCircle2, X, Plus, Minus, Mic, Maximize2, Play, Pause, Trash2, ChevronDown, ChevronUp } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Audio } from "expo-av";

const { width: W } = Dimensions.get("window");

const OCCASIONS = [
    { id: "date", label: "Date Night", emoji: "◎", img: require("@/assets/images/ladies-date-night.png"), desc: "A night to remember, arranged for you" },
    { id: "spa", label: "Spa Day", emoji: "✿", img: require("@/assets/images/ladies-spa.png"), desc: "Your body deserves the finest care" },
    { id: "shopping", label: "Shopping", emoji: "✤", img: require("@/assets/images/ladies-shopping.png"), desc: "Curated fashion, personal styling" },
    { id: "event", label: "Event Prep", emoji: "❋", img: require("@/assets/images/lagos-beach.jpg"), desc: "Arrive flawless, always" },
    { id: "wellness", label: "Wellness", emoji: "◈", img: require("@/assets/images/onboarding-lifestyle.png"), desc: "Mind, body and soul, restored" },
    { id: "home", label: "Home", emoji: "⌂", img: require("@/assets/images/lagos-hotel.jpg"), desc: "Your household, perfectly managed" },
    { id: "business", label: "Business", emoji: "✦", img: require("@/assets/images/onboarding-trust.png"), desc: "Corporate dining, workspace & executive travel" },
    { id: "entertainment", label: "Entertainment", emoji: "◎", img: require("@/assets/images/lagos-rooftop.jpg"), desc: "Golf, VIP events & private experiences" },
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
        try {
            Keyboard.dismiss();
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== "granted") {
                Alert.alert("Permission Denied", "Please allow microphone access to record voice notes.");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
            setShowRecordModal(true);
        } catch (err) {
            console.error("Failed to start recording:", err);
            Alert.alert("Error", "Could not start audio recording.");
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
            });
            const uri = recording.getURI();
            if (onVoiceChange) onVoiceChange(uri);
            setRecording(null);
        } catch (err) {
            console.error("Failed to stop recording:", err);
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
            });
            setRecording(null);
        } catch (err) {
            console.error("Failed to cancel recording:", err);
        }
    }

    async function playSound() {
        if (!voiceUri) return;
        try {
            if (sound) {
                await sound.unloadAsync();
            }
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
function DateNightForm({ accent, muted, textColor, cardBg, border, onData }: any) {
    const [needs, setNeeds] = useState<string[]>([]);
    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
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
                <SectionLabel text="WHEN IS THE OCCASION?" muted={muted} />
                <TouchableOpacity style={[fl.dateBtn, { borderColor: `${accent}40`, backgroundColor: cardBg }]} onPress={() => setShowDate(true)}>
                    <Text style={[fl.dateBtnText, { color: textColor }]}>{date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Text>
                </TouchableOpacity>
                {showDate && Platform.OS === "android" && <DateTimePicker value={date} mode="date" display="default" onChange={(_, d) => { setShowDate(false); if (d) update("date", d); }} />}
                {showDate && Platform.OS === "ios" && (
                    <Modal transparent animationType="slide" visible>
                        <View style={fl.dateModal}><View style={fl.dateSheet}>
                            <DateTimePicker value={date} mode="datetime" display="spinner" onChange={(_, d) => { if (d) update("date", d); }} />
                            <TouchableOpacity style={[fl.dateDone, { backgroundColor: accent }]} onPress={() => setShowDate(false)}><Text style={fl.dateDoneText}>Done</Text></TouchableOpacity>
                        </View></View>
                    </Modal>
                )}
                <SectionLabel text="ANYTHING ELSE TO KNOW?" muted={muted} />
                <VoiceInput value={notes} onChange={(v: string) => update("notes", v)} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="Dress code, preferences, special requests..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
            </View>
        </View>
    );
}

function SpaDayForm({ accent, muted, textColor, cardBg, border, onData }: any) {
    const [treatments, setTreatments] = useState<string[]>([]);
    const [duration, setDuration] = useState("");
    const [allergies, setAllergies] = useState("");
    const [voiceUri, setVoiceUri] = useState<string | null>(null);

    const toggle = (v: string) => {
        const next = treatments.includes(v) ? treatments.filter((x: string) => x !== v) : [...treatments, v];
        setTreatments(next); onData({ treatments: next, duration, allergies, allergies_voice_note_uri: voiceUri });
    };
    const update = (key: string, val: string) => {
        let dur = duration;
        let allg = allergies;
        if (key === "duration") { dur = val; setDuration(val); }
        if (key === "allergies") { allg = val; setAllergies(val); }
        onData({ treatments, duration: dur, allergies: allg, allergies_voice_note_uri: voiceUri });
    };
    const handleVoiceChange = (uri: string | null) => {
        setVoiceUri(uri);
        onData({ treatments, duration, allergies, allergies_voice_note_uri: uri });
    };


    return (
        <View>
            <Image source={require("@/assets/images/ladies-spa.png")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(20,50,60,0.5)" }]}>
                <Text style={fl.formBannerText}>Restore. Renew. Refresh.</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>Your perfect spa day, curated at our finest partner spa. Select what you'd love.</Text>
                <SectionLabel text="WHICH TREATMENTS?" muted={muted} />
                <MultiPill options={["Massage", "Facial", "Manicure & Pedicure", "Hair Treatment", "Body Scrub", "Full Spa Day"]} selected={treatments} onToggle={toggle} accent={accent} textColor={textColor} />
                <SectionLabel text="HOW LONG?" muted={muted} />
                <RadioPill options={["Half Day", "Full Day", "Evening Session"]} selected={duration} onSelect={(v: string) => update("duration", v)} accent={accent} textColor={textColor} />
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

function EventPrepForm({ accent, muted, textColor, cardBg, border, onData }: any) {
    const [eventType, setEventType] = useState("");
    const [eventDate, setEventDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
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
                <TouchableOpacity style={[fl.dateBtn, { borderColor: `${accent}40`, backgroundColor: cardBg }]} onPress={() => setShowDate(true)}>
                    <Text style={[fl.dateBtnText, { color: textColor }]}>{eventDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Text>
                </TouchableOpacity>
                {showDate && Platform.OS === "android" && <DateTimePicker value={eventDate} mode="date" display="default" onChange={(_, d) => { setShowDate(false); if (d) update("eventDate", d); }} />}
                {showDate && Platform.OS === "ios" && (
                    <Modal transparent animationType="slide" visible>
                        <View style={fl.dateModal}><View style={fl.dateSheet}>
                            <DateTimePicker value={eventDate} mode="date" display="spinner" onChange={(_, d) => { if (d) update("eventDate", d); }} />
                            <TouchableOpacity style={[fl.dateDone, { backgroundColor: accent }]} onPress={() => setShowDate(false)}><Text style={fl.dateDoneText}>Done</Text></TouchableOpacity>
                        </View></View>
                    </Modal>
                )}
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
            <Image source={require("@/assets/images/onboarding-lifestyle.png")} style={fl.formBanner} resizeMode="cover" />
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
            <Image source={require("@/assets/images/lagos-hotel.jpg")} style={fl.formBanner} resizeMode="cover" />
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

function BusinessForm({ accent, muted, textColor, cardBg, border, onData }: any) {
    const [needs, setNeeds] = useState<string[]>([]);
    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
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
            <Image source={require("@/assets/images/onboarding-trust.png")} style={fl.formBanner} resizeMode="cover" />
            <View style={[fl.formBannerOverlay, { backgroundColor: "rgba(5,10,20,0.58)" }]}>
                <Text style={fl.formBannerText}>Business handled with precision</Text>
            </View>
            <View style={fl.formBody}>
                <Text style={[fl.formDesc, { color: muted }]}>A power lunch, the right workspace, or a seamless business trip - we arrange it all, so you can focus on what matters.</Text>
                <SectionLabel text="WHAT DO YOU NEED?" muted={muted} />
                <MultiPill options={["Corporate Dining", "Meeting Space", "Executive Travel", "Client Event", "Airport Protocol"]} selected={needs} onToggle={toggle} accent={accent} textColor={textColor} />
                <SectionLabel text="WHEN?" muted={muted} />
                <TouchableOpacity style={[fl.dateBtn, { borderColor: `${accent}40`, backgroundColor: cardBg }]} onPress={() => setShowDate(true)}>
                    <Text style={[fl.dateBtnText, { color: textColor }]}>{date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Text>
                </TouchableOpacity>
                {showDate && Platform.OS === "android" && <DateTimePicker value={date} mode="date" display="default" onChange={(_, d) => { setShowDate(false); if (d) update("date", d); }} />}
                {showDate && Platform.OS === "ios" && (
                    <Modal transparent animationType="slide" visible>
                        <View style={fl.dateModal}><View style={fl.dateSheet}>
                            <DateTimePicker value={date} mode="date" display="spinner" onChange={(_, d) => { if (d) update("date", d); }} />
                            <TouchableOpacity style={[fl.dateDone, { backgroundColor: accent }]} onPress={() => setShowDate(false)}><Text style={fl.dateDoneText}>Done</Text></TouchableOpacity>
                        </View></View>
                    </Modal>
                )}
                <SectionLabel text="DETAILS" muted={muted} />
                <VoiceInput value={notes} onChange={(v: string) => update("notes", v)} voiceUri={voiceUri} onVoiceChange={handleVoiceChange} placeholder="Guests, preferences, specific requirements..." bg={cardBg} border={border} textColor={textColor} accent={accent} />
            </View>
        </View>
    );
}

function EntertainmentForm({ accent, muted, textColor, cardBg, border, onData }: any) {
    const [eventType, setEventType] = useState("");
    const [guests, setGuests] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
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
            <Image source={require("@/assets/images/lagos-rooftop.jpg")} style={fl.formBanner} resizeMode="cover" />
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
                <TouchableOpacity style={[fl.dateBtn, { borderColor: `${accent}40`, backgroundColor: cardBg }]} onPress={() => setShowDate(true)}>
                    <Text style={[fl.dateBtnText, { color: textColor }]}>{date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Text>
                </TouchableOpacity>
                {showDate && Platform.OS === "android" && <DateTimePicker value={date} mode="date" display="default" onChange={(_, d) => { setShowDate(false); if (d) update("date", d); }} />}
                {showDate && Platform.OS === "ios" && (
                    <Modal transparent animationType="slide" visible>
                        <View style={fl.dateModal}><View style={fl.dateSheet}>
                            <DateTimePicker value={date} mode="date" display="spinner" onChange={(_, d) => { if (d) update("date", d); }} />
                            <TouchableOpacity style={[fl.dateDone, { backgroundColor: accent }]} onPress={() => setShowDate(false)}><Text style={fl.dateDoneText}>Done</Text></TouchableOpacity>
                        </View></View>
                    </Modal>
                )}
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
    const [occExpanded, setOccExpanded] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const formAnim = useRef(new Animated.Value(0)).current;
    const heroOpacity = useRef(new Animated.Value(1)).current;

    const currentOccasion = OCCASIONS.find(o => o.id === occasion);

    const selectOccasion = (id: string) => {
        if (id === occasion) return;
        Animated.sequence([
            Animated.timing(heroOpacity, { toValue: 0.5, duration: 180, useNativeDriver: true }),
            Animated.timing(heroOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        Animated.timing(formAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setOccasion(id);
            setFormData({});
            Animated.spring(formAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
        });
    };

    const handleSubmit = async () => {
        if (!occasion) { Alert.alert("Please select an occasion first."); return; }
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
        if (error) { Alert.alert("Error", error.message); return; }
        setSuccess(true);
    };

    const FormComponent = occasion ? FORM_MAP[occasion] : null;

    return (
        <View style={[s.root, { backgroundColor: pageBg }]}>
            <ScrollView scrollEnabled={!occExpanded} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                {/* ── Hero ── */}
                <View style={s.heroWrap}>
                    <Animated.Image
                        source={currentOccasion?.img ?? require("@/assets/images/queens.jpg")}
                        style={[s.heroImg, { opacity: heroOpacity }]}
                        resizeMode="cover"
                    />
                    <View style={s.heroOverlay} />
                    <View style={s.heroScrim} />
                    <TouchableOpacity style={[s.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
                        <ChevronLeft size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={s.heroTextWrap}>
                        <Text style={s.heroEyebrow}>FOR HER</Text>
                        <Text style={s.heroTitle}>Ladies{"\n"}Concierge</Text>
                        {!!eventTag && (
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: "#c9a84c25", borderWidth: 1, borderColor: "#c9a84c60" }}>
                                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#c9a84c", letterSpacing: 0.5 }}>EVENT · {eventTag}</Text>
                                </View>
                            </View>
                        )}
                        <Text style={s.heroTagline}>
                            {currentOccasion ? currentOccasion.desc : "Every detail, thoughtfully arranged"}
                        </Text>
                    </View>
                </View>

                {/* ── Occasion cards ── */}
                <View style={[s.occasionSection, { backgroundColor: pageBg, paddingHorizontal: 24 }]}>
                    <Text style={[s.occasionHeading, { color: textColor, paddingHorizontal: 0 }]}>What's the occasion?</Text>
                    
                    {!occExpanded ? (
                        currentOccasion ? (
                            <TouchableOpacity
                                style={s.occSelectedCard}
                                onPress={() => setOccExpanded(true)}
                                activeOpacity={0.85}
                            >
                                <Image source={currentOccasion.img} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                                <View style={s.occSelectedCardOverlay} />
                                <View style={s.occSelectedCardContent}>
                                    <Text style={s.occSelectedCardEmoji}>{currentOccasion.emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.occSelectedCardLabel}>{currentOccasion.label}</Text>
                                        <Text style={s.occSelectedCardDesc} numberOfLines={1}>{currentOccasion.desc}</Text>
                                    </View>
                                    <ChevronDown size={20} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[s.occDropdownPlaceholder, { backgroundColor: cardBg, borderColor: border }]}
                                onPress={() => setOccExpanded(true)}
                                activeOpacity={0.85}
                            >
                                <Text style={[s.occPlaceholderEmoji, { color: C.primary }]}>✦</Text>
                                <Text style={[s.occPlaceholderText, { color: textColor }]}>Select the Occasion...</Text>
                                <ChevronDown size={20} color={C.primary} />
                            </TouchableOpacity>
                        )
                    ) : (
                        <View style={{ gap: 12 }}>
                            <TouchableOpacity
                                style={s.dropdownHeader}
                                onPress={() => setOccExpanded(false)}
                                activeOpacity={0.85}
                            >
                                <Text style={[s.dropdownHeaderText, { color: muted }]}>Choose an Occasion</Text>
                                <ChevronUp size={20} color={C.primary} />
                            </TouchableOpacity>
                            
                            <View style={{ maxHeight: 310, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: border }}>
                                <ScrollView nestedScrollEnabled={true} style={{ backgroundColor: isDark ? "#111" : "#faf6ee" }} contentContainerStyle={{ padding: 10, gap: 10 }}>
                                    {OCCASIONS.map(o => {
                                        const active = occasion === o.id;
                                        return (
                                            <TouchableOpacity
                                                key={o.id}
                                                style={[s.occListCard, active && { borderColor: C.primary, borderWidth: 1.5 }]}
                                                onPress={() => {
                                                    selectOccasion(o.id);
                                                    setOccExpanded(false);
                                                }}
                                                activeOpacity={0.85}
                                            >
                                                <Image source={o.img} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                                                <View style={[s.occListCardOverlay, active && { backgroundColor: "rgba(199,168,76,0.3)" }]} />
                                                <View style={s.occListCardContent}>
                                                    <Text style={s.occListCardEmoji}>{o.emoji}</Text>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[s.occListCardLabel, active && { color: C.primary }]}>{o.label}</Text>
                                                        <Text style={s.occListCardDesc} numberOfLines={1}>{o.desc}</Text>
                                                    </View>
                                                    <View style={[s.occRadio, active && { borderColor: C.primary }]}>
                                                        {active && <View style={[s.occRadioInner, { backgroundColor: C.primary }]} />}
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>
                    )}
                </View>

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
                            />
                        </View>
                        <TouchableOpacity
                            style={[s.submitBtn, { backgroundColor: C.primary, opacity: loading ? 0.6 : 1 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <Text style={s.submitText}>{loading ? "Submitting..." : `Request ${currentOccasion?.label}`}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {!occasion && (
                    <View style={s.emptyState}>
                        <Text style={s.emptyEmoji}>✦</Text>
                        <Text style={[s.emptyText, { color: muted }]}>Select an occasion above{"\n"}to get started</Text>
                    </View>
                )}
            </ScrollView>

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
    dateModal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
    dateSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    dateDone: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 12 },
    dateDoneText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },
    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
    toggleLabel: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
    toggleSub: { fontSize: 12 },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1 },
    heroWrap: { width: W, height: 400, position: "relative" },
    heroImg: { width: "100%", height: "100%", position: "absolute" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(80,20,30,0.4)" },
    heroScrim: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200, backgroundColor: "rgba(15,8,5,0.65)" },
    backBtn: { position: "absolute", left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
    heroTextWrap: { position: "absolute", bottom: 28, left: 0, right: 0, paddingHorizontal: 24 },
    heroEyebrow: { fontSize: 10, fontWeight: "800", color: "#c9a84c", letterSpacing: 3, marginBottom: 8 },
    heroTitle: { fontSize: 52, fontWeight: "800", color: "#fff", letterSpacing: -2, lineHeight: 54, marginBottom: 10, fontFamily: "PlayfairDisplay_700Bold" },
    heroTagline: { fontSize: 14, color: "rgba(255,255,255,0.65)", fontStyle: "italic" },

    occasionSection: { paddingTop: 28, paddingBottom: 8 },
    occasionHeading: { fontSize: 20, fontWeight: "700", paddingHorizontal: 24, marginBottom: 16, fontFamily: "PlayfairDisplay_700Bold" },
    occasionScroll: { paddingHorizontal: 20, gap: 10 },
    occasionCard: { width: 110, height: 130, borderRadius: 18, overflow: "hidden", borderWidth: 1.5, borderColor: "transparent" },
    occasionCardImg: { width: "100%", height: "100%", position: "absolute" },
    occasionCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
    occasionCardContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
    occasionCardEmoji: { fontSize: 22, color: "#fff" },
    occasionCardLabel: { fontSize: 12, fontWeight: "700", color: "#fff", textAlign: "center" },

    formSection: { paddingHorizontal: 20, paddingTop: 24 },
    formCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
    submitBtn: { borderRadius: 16, paddingVertical: 18, alignItems: "center", marginBottom: 12 },
    submitText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },

    emptyState: { alignItems: "center", paddingTop: 48 },
    emptyEmoji: { fontSize: 32, color: "#c9a84c", marginBottom: 12 },
    emptyText: { fontSize: 15, textAlign: "center", lineHeight: 24, fontStyle: "italic" },

    successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    successBox: { width: "100%", borderRadius: 24, padding: 32, alignItems: "center", borderWidth: 1 },
    successTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10, fontFamily: "PlayfairDisplay_700Bold" },
    successBody: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 28, fontStyle: "italic" },
    successBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
    successBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0a0a" },
    successDone: { fontSize: 14 },

    occListCard: { width: "100%", height: 74, borderRadius: 16, overflow: "hidden", position: "relative", borderWidth: 1.5, borderColor: "transparent" },
    occListCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.52)" },
    occListCardContent: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 },
    occListCardEmoji: { fontSize: 20, color: "#fff", width: 28, textAlign: "center" },
    occListCardLabel: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "PlayfairDisplay_700Bold" },
    occListCardDesc: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2, fontStyle: "italic" },
    occRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
    occRadioInner: { width: 10, height: 10, borderRadius: 5 },
    occSelectedCard: { width: "100%", height: 74, borderRadius: 16, overflow: "hidden", position: "relative" },
    occSelectedCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
    occSelectedCardContent: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 },
    occSelectedCardEmoji: { fontSize: 20, color: "#fff", width: 28, textAlign: "center" },
    occSelectedCardLabel: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "PlayfairDisplay_700Bold" },
    occSelectedCardDesc: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2, fontStyle: "italic" },
    occDropdownPlaceholder: { width: "100%", height: 68, borderRadius: 16, borderStyle: "solid", borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, gap: 12 },
    occPlaceholderEmoji: { fontSize: 16, fontWeight: "700" },
    occPlaceholderText: { flex: 1, fontSize: 14, fontWeight: "600", fontFamily: "PlayfairDisplay_700Bold", fontStyle: "italic" },
    dropdownHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 4 },
    dropdownHeaderText: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
});
