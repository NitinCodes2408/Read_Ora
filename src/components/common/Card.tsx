import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows, Spacing } from '@/constants/spacing';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'goldAccent' | 'outline';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  onPress,
  accessibilityLabel,
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    variant === 'elevated' && Shadows.card,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          ...cardStyles,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.midnight.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
  },
  default: {
    backgroundColor: Colors.midnight.surface,
    borderColor: Colors.midnight.border,
  },
  elevated: {
    backgroundColor: Colors.midnight.surfaceElevated,
    borderColor: Colors.midnight.border,
  },
  goldAccent: {
    backgroundColor: Colors.midnight.surface,
    borderColor: Colors.gold.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: Colors.midnight.border,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
