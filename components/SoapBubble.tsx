/**
 * SoapBubble.tsx
 *
 * ⚠️  Requires a custom dev build or EAS build.
 *     @shopify/react-native-skia is NOT supported in Expo Go.
 *     When running in Expo Go, this component renders a plain
 *     frosted-glass fallback so the rest of the app still works.
 *
 * Animation:
 *   Uses react-native-reanimated's useSharedValue + withRepeat + withTiming
 *   to drive the iTime uniform - useClock / useClockValue from Skia are
 *   deprecated and must not be used.
 */

import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import {
    useSharedValue,
    withRepeat,
    withTiming,
    useDerivedValue,
    Easing,
} from "react-native-reanimated";

// ─── Expo Go guard ────────────────────────────────────────────────────────────
// appOwnership === "expo"  →  running inside Expo Go (no native modules)
// appOwnership === null    →  standalone / dev-client build (Skia available)
const IS_EXPO_GO = Constants.appOwnership === "expo";

// ─── Lazy Skia import - only attempted in dev/standalone builds ───────────────
let SkiaCanvas: any = null;
let SkiaFill: any   = null;
let SkiaShader: any = null;
let compiledEffect: any = null;

if (!IS_EXPO_GO) {
    try {
        // Dynamic require so Metro doesn't blow up in Expo Go
        const Skia = require("@shopify/react-native-skia");

        SkiaCanvas = Skia.Canvas;
        SkiaFill   = Skia.Fill;
        SkiaShader = Skia.Shader;

        // ── SKSL shader ────────────────────────────────────────────────────────
        // • feTurbulence-style FBM noise warps the bubble surface
        // • Cosine colour palette drives the iridescent film colours
        // • iTime uniform (driven by Reanimated) animates everything
        const SKSL = `
            uniform float  iTime;
            uniform float2 iResolution;

            // ── Value noise ───────────────────────────────────────────────────
            float hash(float2 p) {
                p = fract(p * float2(127.1, 311.7));
                p += dot(p, p + 19.19);
                return fract(p.x * p.y);
            }
            float noise(float2 p) {
                float2 i = floor(p);
                float2 f = fract(p);
                float2 u = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i),               hash(i + float2(1,0)), u.x),
                    mix(hash(i + float2(0,1)), hash(i + float2(1,1)), u.x),
                    u.y
                );
            }
            float fbm(float2 p) {
                float v = 0.0; float a = 0.5;
                for (int i = 0; i < 4; i++) {
                    v += a * noise(p);
                    p  = p * 2.0 + float2(5.3, 1.7);
                    a *= 0.5;
                }
                return v;
            }

            // ── Cosine colour palette (iridescent thin-film) ──────────────────
            half3 palette(float t) {
                half3 a = half3(0.55, 0.55, 0.60);
                half3 b = half3(0.45, 0.45, 0.40);
                half3 c = half3(1.0,  1.0,  1.0 );
                half3 d = half3(0.00, 0.33, 0.67);
                return a + b * cos(6.28318 * (c * t + d));
            }

            half4 main(float2 fragCoord) {
                float2 uv  = (fragCoord - iResolution * 0.5)
                           / min(iResolution.x, iResolution.y);
                float  r   = length(uv);
                float  phi = atan(uv.y, uv.x);

                // Turbulent surface warp
                float2 nUV  = uv * 2.8 + float2(iTime * 0.12, iTime * 0.09);
                float  warp = fbm(nUV) * 2.0 - 1.0;

                // Iridescent colour
                float edge   = smoothstep(0.0, 0.38, r);
                float colT   = phi / 6.28318 + edge * 0.4 + warp * 0.18 + iTime * 0.08;
                half3 col    = palette(colT);

                // Bubble shape - thin hollow sphere
                float rW     = r + warp * 0.04;
                float alpha  = smoothstep(0.46, 0.40, rW);
                float hollow = smoothstep(0.10, 0.32, rW);
                float film   = alpha * (1.0 - hollow * 0.75);

                // Specular glints
                float2 g1 = uv - float2(-0.12, -0.12);
                float2 g2 = uv - float2( 0.16,  0.14);
                float  s1 = exp(-dot(g1, g1) * 120.0);
                float  s2 = exp(-dot(g2, g2) * 220.0) * 0.4;
                half3  sp = half3(s1 + s2);

                half3  final = col * film + sp * alpha;
                float  a     = film * 0.78 + (s1 + s2 * 0.5) * alpha;
                return half4(final * a, a);
            }
        `;

        compiledEffect = Skia.Skia.RuntimeEffect.Make(SKSL);
    } catch (e) {
        console.warn("[SoapBubble] Skia unavailable - using fallback.", e);
    }
}

// ─── Fallback for Expo Go ─────────────────────────────────────────────────────
function FallbackBubble({ size }: { size: number }) {
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: "rgba(255,255,255,0.07)",
                borderWidth: 1.2,
                borderColor: "rgba(200,185,255,0.30)",
            }}
        >
            {/* Specular glint */}
            <View style={[styles.glint]} />
        </View>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface SoapBubbleProps {
    size?: number;
}

export function SoapBubble({ size = 72 }: SoapBubbleProps) {
    // If Skia isn't available, show the plain fallback
    if (IS_EXPO_GO || !SkiaCanvas || !compiledEffect) {
        return <FallbackBubble size={size} />;
    }

    return <SkiaBubble size={size} />;
}

// ─── Skia bubble (dev build only) ─────────────────────────────────────────────
function SkiaBubble({ size }: { size: number }) {
    // ── Animation via Reanimated ──────────────────────────────────────────────
    // useSharedValue + withRepeat + withTiming replaces the deprecated
    // useClock / useClockValue from Skia.
    const time = useSharedValue(0);

    useEffect(() => {
        time.value = withRepeat(
            withTiming(3600, {          // counts up to 1 hour then loops
                duration: 3_600_000,    // 1 hour in ms → 1 s of real time = 1.0 iTime
                easing: Easing.linear,
            }),
            -1,   // infinite
            false // don't reverse
        );
    }, []);

    // useDerivedValue bridges Reanimated → Skia uniforms
    const uniforms = useDerivedValue(() => ({
        iTime:       time.value,
        iResolution: [size, size] as [number, number],
    }));

    return (
        <SkiaCanvas style={{ width: size, height: size }}>
            <SkiaFill>
                <SkiaShader source={compiledEffect} uniforms={uniforms} />
            </SkiaFill>
        </SkiaCanvas>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    glint: {
        position: "absolute",
        top: 10,
        left: 14,
        width: 14,
        height: 6,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.38)",
        transform: [{ rotate: "-18deg" }],
    },
});
