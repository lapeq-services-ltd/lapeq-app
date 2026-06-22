import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type Props = {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
    style?: any;
};

export default function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: Props) {
    const { C } = useTheme();
    const opacity = useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.75, duration: 650, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    return (
        <Animated.View
            style={[{ width, height, borderRadius, backgroundColor: C.surface }, { opacity }, style]}
        />
    );
}
