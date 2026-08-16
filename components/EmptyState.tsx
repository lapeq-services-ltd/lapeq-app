import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const IMAGES: Record<string, any> = {
  requests: require("@/assets/emptystate/profile-request.png"),
  saved: require("@/assets/emptystate/profile-saved.png"),
};

interface EmptyStateProps {
  type: 'requests' | 'saved';
  title: string;
  description: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

export default function EmptyState({ type, title, description, buttonText, onButtonPress }: EmptyStateProps) {
  const { C } = useTheme();

  return (
    <View style={styles.container}>
      <Image source={IMAGES[type]} style={styles.img} resizeMode="contain" />
      <Text style={[styles.title, { color: C.text }]}>{title}</Text>
      <Text style={[styles.description, { color: C.muted }]}>{description}</Text>
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
  img: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Jost_700Bold',
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
