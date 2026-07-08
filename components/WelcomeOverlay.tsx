import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Modal, Dimensions } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

interface Props {
    name: string;
    onDone: () => void;
}

export default function WelcomeOverlay({ name, onDone }: Props) {
    const opacity = useRef(new Animated.Value(0)).current;
    const nameOpacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.96)).current;

    useEffect(() => {
        // Fade in "Hello,"
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }).start(() => {
            // Fade in name with slight delay
            Animated.parallel([
                Animated.timing(nameOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, friction: 10, tension: 40, useNativeDriver: true }),
            ]).start(() => {
                // Hold
                setTimeout(() => {
                    Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }).start(() => onDone());
                }, 1600);
            });
        });
    }, []);

    return (
        <Modal visible transparent animationType="none" statusBarTranslucent>
            <Animated.View style={[s.root, { opacity }]}>
                <Animated.View style={{ transform: [{ scale }] }}>
                    <Text style={s.hello}>Hello,</Text>
                    <Animated.Text style={[s.name, { opacity: nameOpacity }]}>
                        {name}.
                    </Animated.Text>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#080808",
        alignItems: "center",
        justifyContent: "center",
    },
    hello: {
        fontSize: 52,
        fontFamily: "PlayfairDisplay_400Regular_Italic",
        color: "rgba(255,255,255,0.92)",
        textAlign: "center",
        letterSpacing: -0.5,
    },
    name: {
        fontSize: 52,
        fontFamily: "PlayfairDisplay_400Regular_Italic",
        color: "#c9a84c",
        textAlign: "center",
        letterSpacing: -0.5,
        marginTop: -4,
    },
});
