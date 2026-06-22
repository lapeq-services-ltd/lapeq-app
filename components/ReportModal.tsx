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
import { Shield } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');
const GOLD = '#c9a84c';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReportModal({ visible, onClose }: ReportModalProps) {
  const { C, theme } = useTheme();
  const isDark = theme === "dark";

  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  
  // 🚀 The Flying Asset Values
  const flyProgress = useSharedValue(0); // 0 = inside circle, 1 = flown up and out
  const ambientFloat = useSharedValue(0); // Subtle hovering once it lands

  // Background blobs
  const floatingBlob1 = useSharedValue(0);
  const floatingBlob2 = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 1. Pop the main card elastically
      modalScale.value = withSpring(1, { damping: 16, stiffness: 110 });
      modalOpacity.value = withTiming(1, { duration: 200 });

      // 2. Trigger the "Flying" effect with a spring snap
      flyProgress.value = withSpring(1, { damping: 12, stiffness: 90 });

      // 3. Start ambient background floating loops
      floatingBlob1.value = withRepeat(withTiming(1, { duration: 4000 }), -1, true);
      floatingBlob2.value = withRepeat(withTiming(1, { duration: 4500 }), -1, true);
      
      // 4. Start subtle icon idle hover after it finishes flying
      ambientFloat.value = withDelay(800, withRepeat(withTiming(1, { duration: 2000 }), -1, true));

      // Trigger success haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      modalScale.value = withTiming(0, { duration: 150 });
      modalOpacity.value = withTiming(0, { duration: 150 });
      flyProgress.value = withTiming(0, { duration: 150 });
      ambientFloat.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  // --- ANIMATION STYLES ---
  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  // This handles the dramatic launch + the floating once it arrives
  const animatedFlyingIconStyle = useAnimatedStyle(() => {
    const translateY = interpolate(flyProgress.value, [0, 1], [40, -28]); // Shoots upwards out of the circle
    const translateX = interpolate(flyProgress.value, [0, 1], [-20, 15]); // Adjust to make it slide diagonally
    const scale = interpolate(flyProgress.value, [0, 1], [0.4, 1.2]); // Starts small, bursts out bigger
    
    const hoverY = interpolate(ambientFloat.value, [0, 1], [0, -6]); // Gentle bobbing effect

    return {
      transform: [
        { translateX },
        { translateY: translateY + hoverY },
        { scale }
      ],
      opacity: flyProgress.value,
    };
  });

  const animatedBlob1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatingBlob1.value, [0, 1], [0, -25]) }],
  }));

  const animatedBlob2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatingBlob2.value, [0, 1], [0, 20]) }],
  }));

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(10, 10, 10, 0.85)' : 'rgba(238, 242, 246, 0.85)' }]}>
      {/* Background Ambience Shapes */}
      <Animated.View style={[styles.blob, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.05)' : 'rgba(201, 168, 76, 0.1)' }, styles.blobTopLeft, animatedBlob1Style]} />
      <Animated.View style={[styles.blob, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.05)' : 'rgba(201, 168, 76, 0.1)' }, styles.blobBottomRight, animatedBlob2Style]} />

      {/* Spring Card */}
      <Animated.View style={[styles.modalCard, { backgroundColor: C.surface, borderColor: C.border }, animatedModalStyle]}>
        
        {/* --- ICON WRAPPER ARCHITECTURE --- */}
        <View style={styles.iconContainerLayout}>
          {/* The background base circle */}
          <View style={[styles.circleBase, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.08)' : 'rgba(201, 168, 76, 0.12)' }]} />
          
          {/* The Flying Shield Layer */}
          <Animated.View style={[styles.flyingIconWrapper, animatedFlyingIconStyle]}>
            <View style={[styles.shieldBackgroundCircle, { backgroundColor: isDark ? '#141416' : '#f4f4f6', borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(201, 168, 76, 0.2)' }]}>
              <Shield size={42} color={GOLD} strokeWidth={1.5} />
            </View>
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: C.text }]}>Report received!</Text>
        
        <Text style={[styles.description, { color: C.muted }]}>
          Thank you for letting us know. Our trust and safety team will review this issue immediately to keep the community safe.
        </Text>

        <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.85}>
          <Text style={[styles.buttonText, { color: C.background }]}>Got it!</Text>
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
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainerLayout: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  circleBase: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  flyingIconWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  shieldBackgroundCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Jost_700Bold',
  },
  description: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 12,
    fontFamily: 'Jost_400Regular',
  },
  button: {
    backgroundColor: GOLD,
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
