import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle, 
  interpolate,
  withDelay
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { Heart } from 'lucide-react-native';

interface EmptyStateProps {
  type: 'requests' | 'saved';
  title: string;
  description: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

export default function EmptyState({ type, title, description, buttonText, onButtonPress }: EmptyStateProps) {
  const { C, theme } = useTheme();
  const isDark = theme === "dark";

  // Animation values
  const flyProgress = useSharedValue(0);
  const cardProgress = useSharedValue(0);
  const ambientFloat = useSharedValue(0);

  useEffect(() => {
    // Reset and trigger animations
    flyProgress.value = 0;
    cardProgress.value = 0;

    flyProgress.value = withSpring(1, { damping: 14, stiffness: 85 });
    cardProgress.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 75 }));

    ambientFloat.value = withRepeat(
      withTiming(1, { duration: 2400 }),
      -1,
      true
    );

    return () => {
      flyProgress.value = 0;
      cardProgress.value = 0;
      ambientFloat.value = 0;
    };
  }, [type]);

  // Interpolated Styles
  const planeGroupStyle = useAnimatedStyle(() => {
    const hoverY = interpolate(ambientFloat.value, [0, 1], [0, -6]);
    const entryX = interpolate(flyProgress.value, [0, 1], [-20, 0]);
    const entryY = interpolate(flyProgress.value, [0, 1], [20, 0]);
    const scale = interpolate(flyProgress.value, [0, 1], [0.7, 1]);
    const opacity = flyProgress.value;

    return {
      transform: [
        { translateX: entryX },
        { translateY: entryY + hoverY },
        { scale }
      ],
      opacity
    };
  });

  const animatedCardStyle = useAnimatedStyle(() => {
    const tx = interpolate(cardProgress.value, [0, 1], [52, 74]);
    const ty = interpolate(cardProgress.value, [0, 1], [82, 38]);
    const s = interpolate(cardProgress.value, [0, 1], [0.4, 1]);
    const opacity = interpolate(cardProgress.value, [0, 1], [0, 1]);
    const rotate = interpolate(cardProgress.value, [0, 1], [0, -10]);

    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: s },
        { rotate: `${rotate}deg` }
      ],
      opacity
    };
  });

  // Theme adaptations
  const circleBg = isDark ? '#0c241f' : '#e6f7f0';
  const lineColor = isDark ? '#4ade80' : '#0b4d3e';
  const keelBg = isDark ? '#14382e' : '#f0fbf7';
  
  // Requests uses vibrant green, Saved uses premium coral red
  const cardBg = type === 'saved' 
    ? (isDark ? '#f43f5e' : '#f43f5e') 
    : (isDark ? '#10b981' : '#00c07f');
    
  const sparkleColor = isDark ? 'rgba(251, 191, 36, 0.4)' : '#fbbf24';

  return (
    <View style={styles.container}>
      {/* Illustration Canvas */}
      <View style={styles.iconContainerLayout}>
        {/* Base Circle */}
        <View style={[styles.circleBase, { backgroundColor: circleBg }]} />

        {/* Sparkles */}
        <View style={StyleSheet.absoluteFill}>
          <View style={[styles.sparkle, { top: 12, left: 16 }]}>
            <Svg width={12} height={12} viewBox="0 0 12 12">
              <Path d="M 6 0 Q 6 6 12 6 Q 6 6 6 12 Q 6 6 0 6 Q 6 6 6 0" fill={sparkleColor} />
            </Svg>
          </View>
          <View style={[styles.sparkle, { bottom: 20, right: 24 }]}>
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Path d="M 8 0 Q 8 8 16 8 Q 8 8 8 16 Q 8 8 0 8 Q 8 8 8 0" fill={sparkleColor} />
            </Svg>
          </View>
          <View style={[styles.sparkle, { top: 22, right: 20 }]}>
            <Svg width={10} height={10} viewBox="0 0 10 10">
              <Path d="M 5 0 Q 5 5 10 5 Q 5 5 5 10 Q 5 5 0 5 Q 5 5 5 0" fill={sparkleColor} />
            </Svg>
          </View>
        </View>

        {/* Paper Plane + Card Sandwich */}
        <Animated.View style={[styles.planeGroup, planeGroupStyle]}>
          {/* Left Wing Background */}
          <View style={StyleSheet.absoluteFill}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Path d="M 35 80 L 98 45 L 60 95 Z" fill="#ffffff" stroke={lineColor} strokeWidth={3} strokeLinejoin="round" />
            </Svg>
          </View>
          
          {/* Custom Card (emerging) */}
          <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
            {type === 'saved' ? (
              // Saved item card shows a clean Heart
              <View style={[styles.cardSurface, { backgroundColor: cardBg }]}>
                <Heart size={16} color="#ffffff" fill="#ffffff" />
              </View>
            ) : (
              // Requests shows a concierge card
              <Svg width={32} height={44} viewBox="0 0 32 44">
                <Rect x={0} y={0} width={32} height={44} rx={6} fill={cardBg} />
                <Circle cx={10} cy={10} r={3.5} fill="#ffffff" />
                <Path d="M 5 30 Q 10 26 15 30 T 25 26" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
              </Svg>
            )}
          </Animated.View>

          {/* Right Wing Foreground & Creases */}
          <View style={StyleSheet.absoluteFill}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Path d="M 60 95 L 98 45 L 85 65 Z" fill="#ffffff" stroke={lineColor} strokeWidth={3} strokeLinejoin="round" />
              <Path d="M 35 80 L 60 95 L 50 100 Z" fill={keelBg} stroke={lineColor} strokeWidth={3} strokeLinejoin="round" />
              <Path d="M 98 45 L 60 95" stroke={lineColor} strokeWidth={3} strokeLinecap="round" />
            </Svg>
          </View>
        </Animated.View>
      </View>

      {/* Copywriting */}
      <Text style={[styles.title, { color: C.text }]}>{title}</Text>
      <Text style={[styles.description, { color: C.muted }]}>{description}</Text>

      {/* CTA Button */}
      {buttonText && onButtonPress && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: C.primary }]} 
          onPress={onButtonPress} 
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: C.background }]}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerLayout: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  circleBase: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  planeGroup: {
    width: 120,
    height: 120,
    position: 'absolute',
  },
  cardContainer: {
    width: 32,
    height: 44,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardSurface: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  sparkle: {
    position: 'absolute',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Jost_700Bold',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    paddingHorizontal: 24,
    fontFamily: 'Jost_400Regular',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Jost_700Bold',
  },
});
