import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle, 
  interpolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReportModal({ visible, onClose }: ReportModalProps) {
  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  const floatingBlob1 = useSharedValue(0);
  const floatingBlob2 = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Pop the modal forward elastically
      modalScale.value = withSpring(1, {
        damping: 16,
        stiffness: 110,
      });
      modalOpacity.value = withTiming(1, { duration: 200 });

      // Ambient background animations
      floatingBlob1.value = withRepeat(withTiming(1, { duration: 4000 }), -1, true);
      floatingBlob2.value = withRepeat(withTiming(1, { duration: 4500 }), -1, true);

      // Trigger success haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      modalScale.value = withTiming(0, { duration: 150 });
      modalOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const animatedBlob1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatingBlob1.value, [0, 1], [0, -25]) }],
  }));

  const animatedBlob2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatingBlob2.value, [0, 1], [0, 20]) }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Background Ambience Shapes */}
      <Animated.View style={[styles.blob, styles.blobTopLeft, animatedBlob1Style]} />
      <Animated.View style={[styles.blob, styles.blobBottomRight, animatedBlob2Style]} />

      {/* Spring Card */}
      <Animated.View style={[styles.modalCard, animatedModalStyle]}>
        
        {/* Shield / Document Icon Placeholder */}
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 42 }}>🛡️</Text>
        </View>

        <Text style={styles.title}>Report received!</Text>
        
        <Text style={styles.description}>
          Thank you for letting us know. Our trust and safety team will review this issue immediately to keep the community safe.
        </Text>

        <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Got it!</Text>
        </TouchableOpacity>
        
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EEF2F6', // Soft slate background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: width - 48,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E0E7FF', // Light Indigo
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1B4B', // Deep Indigo/Black text
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#475569', // Slate grey body
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: '#4F46E5', // Indigo primary button
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  blob: {
    position: 'absolute',
    backgroundColor: '#E0E7FF',
    opacity: 0.7,
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
