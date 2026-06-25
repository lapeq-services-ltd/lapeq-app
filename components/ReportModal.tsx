import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle, 
  interpolate,
  withDelay
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReportModal({ visible, onClose }: ReportModalProps) {
  const { C, theme } = useTheme();
  const isDark = theme === "dark";

  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  
  // Animation progress values
  const flyProgress = useSharedValue(0); // Glides plane into the circle
  const cardProgress = useSharedValue(0); // Card shoots out of the fold
  const ambientFloat = useSharedValue(0); // Gentle bobbing/hovering
  const floatingBlob1 = useSharedValue(0);
  const floatingBlob2 = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 1. Elastic modal entry
      modalScale.value = withSpring(1, { damping: 16, stiffness: 110 });
      modalOpacity.value = withTiming(1, { duration: 200 });

      // 2. Glide plane into position
      flyProgress.value = withSpring(1, { damping: 14, stiffness: 90 });

      // 3. Shoot card out from the plane fold after delay
      cardProgress.value = withDelay(450, withSpring(1, { damping: 12, stiffness: 80 }));

      // 4. Start hover loop
      ambientFloat.value = withRepeat(
        withTiming(1, { duration: 2200 }),
        -1,
        true
      );

      // 5. Ambient background blobs
      floatingBlob1.value = withRepeat(withTiming(1, { duration: 4000 }), -1, true);
      floatingBlob2.value = withRepeat(withTiming(1, { duration: 4500 }), -1, true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      modalScale.value = withTiming(0, { duration: 150 });
      modalOpacity.value = withTiming(0, { duration: 150 });
      flyProgress.value = withTiming(0, { duration: 150 });
      cardProgress.value = withTiming(0, { duration: 150 });
      ambientFloat.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  // Styles
  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const planeGroupStyle = useAnimatedStyle(() => {
    const hoverY = interpolate(ambientFloat.value, [0, 1], [0, -6]);
    const entryX = interpolate(flyProgress.value, [0, 1], [-25, 0]);
    const entryY = interpolate(flyProgress.value, [0, 1], [25, 0]);
    const scale = interpolate(flyProgress.value, [0, 1], [0.6, 1]);
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
    const ty = interpolate(cardProgress.value, [0, 1], [82, 40]);
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

  const animatedBlob1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatingBlob1.value, [0, 1], [0, -20]) }],
  }));

  const animatedBlob2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatingBlob2.value, [0, 1], [0, 16]) }],
  }));

  if (!visible) return null;

  // Custom colors matching the illustration request adapted to theme
  const circleBg = isDark ? '#0a221c' : '#e6f7f0';
  const lineColor = isDark ? '#4ade80' : '#0b4d3e';
  const keelBg = isDark ? '#143b2f' : '#f0fbf7';
  const cardBg = isDark ? '#10b981' : '#00c07f';
  const sparkleColor = isDark ? 'rgba(251, 191, 36, 0.45)' : '#fbbf24';

  return (
    <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(10, 10, 10, 0.85)' : 'rgba(238, 242, 246, 0.85)' }]}>
      {/* Background Ambience Shapes */}
      <Animated.View style={[styles.blob, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.04)' : 'rgba(201, 168, 76, 0.08)' }, styles.blobTopLeft, animatedBlob1Style]} />
      <Animated.View style={[styles.blob, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.04)' : 'rgba(201, 168, 76, 0.08)' }, styles.blobBottomRight, animatedBlob2Style]} />

      {/* Confirmation Dialog Card */}
      <Animated.View style={[styles.modalCard, { backgroundColor: C.surface, borderColor: C.border }, animatedModalStyle]}>
        
        {/* --- DYNAMIC SVG ILLUSTRATION CANVAS --- */}
        <View style={styles.iconContainerLayout}>
          {/* Background Soft Circle */}
          <View style={[styles.circleBase, { backgroundColor: circleBg }]} />

          {/* Sparkles / Stars decoration */}
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

          {/* Paper Plane + Card Sandwich Group */}
          <Animated.View style={[styles.planeGroup, planeGroupStyle]}>
            {/* Left wing background of plane */}
            <View style={StyleSheet.absoluteFill}>
              <Svg width={120} height={120} viewBox="0 0 120 120">
                <Path d="M 35 80 L 98 45 L 60 95 Z" fill="#ffffff" stroke={lineColor} strokeWidth={3} strokeLinejoin="round" />
              </Svg>
            </View>
            
            {/* Card (shoots/emerges out) */}
            <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
              <Svg width={32} height={44} viewBox="0 0 32 44">
                <Rect x={0} y={0} width={32} height={44} rx={6} fill={cardBg} />
                <Circle cx={10} cy={10} r={3.5} fill="#ffffff" />
                <Path d="M 5 30 Q 10 26 15 30 T 25 26" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
              </Svg>
            </Animated.View>

            {/* Right wing/foreground of plane */}
            <View style={StyleSheet.absoluteFill}>
              <Svg width={120} height={120} viewBox="0 0 120 120">
                <Path d="M 60 95 L 98 45 L 85 65 Z" fill="#ffffff" stroke={lineColor} strokeWidth={3} strokeLinejoin="round" />
                <Path d="M 35 80 L 60 95 L 50 100 Z" fill={keelBg} stroke={lineColor} strokeWidth={3} strokeLinejoin="round" />
                <Path d="M 98 45 L 60 95" stroke={lineColor} strokeWidth={3} strokeLinecap="round" />
              </Svg>
            </View>
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: C.text }]}>Report sent!</Text>
        
        <Text style={[styles.description, { color: C.muted }]}>
          Thank you for letting us know. Our trust and safety team will review this issue immediately to keep the community safe.
        </Text>

        <TouchableOpacity style={[styles.button, { backgroundColor: isDark ? C.primary : '#00c07f' }]} onPress={onClose} activeOpacity={0.85}>
          <Text style={[styles.buttonText, { color: isDark ? C.background : '#ffffff' }]}>Got it!</Text>
        </TouchableOpacity>
        
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: width - 48,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainerLayout: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  circleBase: {
    width: 110,
    height: 110,
    borderRadius: 55,
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
  sparkle: {
    position: 'absolute',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Jost_700Bold',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 12,
    fontFamily: 'Jost_400Regular',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Jost_700Bold',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTopLeft: {
    width: 180,
    height: 180,
    top: '10%',
    left: '-15%',
  },
  blobBottomRight: {
    width: 220,
    height: 220,
    bottom: '8%',
    right: '-10%',
  },
});
