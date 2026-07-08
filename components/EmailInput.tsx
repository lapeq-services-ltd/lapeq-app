import { forwardRef, useState, useMemo } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Platform,
} from "react-native";

const GOLD = "#c9a84c";
const CARD = "rgba(255,255,255,0.10)";
const BORDER = "rgba(255,255,255,0.09)";
const BORDER_ACTIVE = "rgba(201,168,76,0.5)";
const isAndroid = Platform.OS === "android";

const DOMAINS = ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@icloud.com"];

interface Props {
    value: string;
    onChangeText: (v: string) => void;
    focused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    returnKeyType?: "next" | "done" | "go" | "search" | "send";
    onSubmitEditing?: () => void;
    // allow caller to pass extra box / input styles
    boxStyle?: any;
    inputStyle?: any;
}

const EmailInput = forwardRef<TextInput, Props>(function EmailInput(
    { value, onChangeText, focused, onFocus, onBlur, returnKeyType, onSubmitEditing, boxStyle, inputStyle },
    ref
) {
    const [open, setOpen] = useState(false);

    const suggestions = useMemo(() => {
        if (!value.trim()) return [];
        const atIdx = value.indexOf("@");
        if (atIdx < 0) {
            return DOMAINS.map(d => value + d);
        }
        const username = value.slice(0, atIdx);
        const typed = value.slice(atIdx);
        if (!username) return [];
        // filter to domains that start with what they typed after @, but aren't already complete
        return DOMAINS
            .filter(d => d.startsWith(typed) && d !== typed)
            .map(d => username + d);
    }, [value]);

    const visible = open && suggestions.length > 0;

    const pick = (sugg: string) => {
        onChangeText(sugg);
        setOpen(false);
    };

    return (
        <View style={{ zIndex: 10 }}>
            <View style={[s.box, focused && s.boxFocused, boxStyle]}>
                <TextInput
                    ref={ref}
                    style={[s.input, inputStyle]}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => { onFocus(); setOpen(true); }}
                    onBlur={() => { onBlur(); setTimeout(() => setOpen(false), 160); }}
                    returnKeyType={returnKeyType}
                    onSubmitEditing={onSubmitEditing}
                />
            </View>

            {visible && (
                <View style={s.dropdown}>
                    {suggestions.map((sugg, i) => {
                        const atIdx = sugg.indexOf("@");
                        const name = sugg.slice(0, atIdx);
                        const domain = sugg.slice(atIdx);
                        return (
                            <TouchableOpacity
                                key={sugg}
                                style={[s.row, i < suggestions.length - 1 && s.rowBorder]}
                                onPress={() => pick(sugg)}
                                activeOpacity={0.65}
                            >
                                <Text style={s.name}>{name}</Text>
                                <Text style={s.domain}>{domain}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
});

export default EmailInput;

const s = StyleSheet.create({
    box: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 14,
        backgroundColor: CARD,
        paddingHorizontal: 16,
        paddingVertical: isAndroid ? 13 : 15,
    },
    boxFocused: {
        borderColor: BORDER_ACTIVE,
        backgroundColor: "rgba(201,168,76,0.06)",
    },
    input: {
        fontSize: isAndroid ? 14 : 16,
        fontFamily: "Jost_400Regular",
        color: "#fff",
        paddingVertical: 0,
    },
    dropdown: {
        marginTop: 6,
        backgroundColor: "#181818",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.18)",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: isAndroid ? 11 : 13,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    name: {
        fontSize: isAndroid ? 13 : 14,
        fontFamily: "Jost_400Regular",
        color: "rgba(255,255,255,0.45)",
    },
    domain: {
        fontSize: isAndroid ? 13 : 14,
        fontFamily: "Jost_700Bold",
        color: GOLD,
    },
});
