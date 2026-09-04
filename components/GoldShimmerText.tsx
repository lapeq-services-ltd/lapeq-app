import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Text as SvgText, LinearGradient, Stop, Defs } from "react-native-svg";

interface GoldShimmerTextProps {
    text: string;
    fontSize?: number;
    fontFamily?: string;
    style?: any;
}

export default function GoldShimmerText({
    text,
    fontSize = 18,
    fontFamily = "Jost_700Bold",
    style,
}: GoldShimmerTextProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let animationId: number;
        let startTime = Date.now();
        const duration = 2500; // 2.5s loop for shimmer sweep

        const step = () => {
            const elapsed = Date.now() - startTime;
            const current = (elapsed % duration) / duration; // 0 to 1
            setProgress(current);
            animationId = requestAnimationFrame(step);
        };

        animationId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animationId);
    }, []);

    // Sweeping gradient coordinates to make the gold shimmer slide across letters
    const x1 = `${progress * 220 - 110}%`;
    const x2 = `${progress * 220 - 10}%`;

    // Generate a unique ID for the gradient definition to prevent collision between instances
    const gradientId = React.useMemo(() => `shimmer-${Math.random().toString(36).substring(2, 11)}`, []);

    // SVG height adjusted for line height padding
    const svgHeight = fontSize * 1.35;

    return (
        <View style={[{ height: svgHeight, justifyContent: "center" }, style]}>
            <Svg height="100%" width="100%">
                <Defs>
                    <LinearGradient id={gradientId} x1={x1} y1="0%" x2={x2} y2="0%">
                        <Stop offset="0%" stopColor="#c9a84c" />
                        <Stop offset="35%" stopColor="#c9a84c" />
                        <Stop offset="50%" stopColor="#ffffff" />
                        <Stop offset="65%" stopColor="#c9a84c" />
                        <Stop offset="100%" stopColor="#c9a84c" />
                    </LinearGradient>
                </Defs>
                <SvgText
                    fill={`url(#${gradientId})`}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    fontWeight="bold"
                    x="0"
                    y={fontSize * 0.98}
                >
                    {text}
                </SvgText>
            </Svg>
        </View>
    );
}
