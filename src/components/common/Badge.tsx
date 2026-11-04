import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';

interface BadgeProps {
  label: string;
  variant?: 'gold' | 'surface' | 'outline' | 'neutral';
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'surface',
  selected = false,
  onPress,
  icon,
  style,
  textStyle,
}) => {
  const content = (
    <View
      style={[
        styles.base,
        styles[variant],
        selected && styles.selected,
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          styles[`${variant}Text` as keyof typeof styles],
          selected && styles.selectedText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconContainer: {
    marginRight: 6,
  },
  pressed: {
    opacity: 0.8,
  },

  // Variants
  surface: {
    backgroundColor: Colors.midnight.surfaceElevated,
    borderColor: Colors.midnight.border,
  },
  gold: {
    backgroundColor: Colors.gold.glow,
    borderColor: Colors.gold.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: Colors.midnight.border,
  },
  neutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'transparent',
  },

  // Selected state
  selected: {
    backgroundColor: Colors.gold.primary,
    borderColor: Colors.gold.primary,
  },

  // Text styles
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  surfaceText: {
    color: Colors.text.secondary,
  },
  goldText: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.semiBold,
  },
  outlineText: {
    color: Colors.text.secondary,
  },
  neutralText: {
    color: Colors.text.tertiary,
  },
  selectedText: {
    color: Colors.midnight.darkest,
    fontWeight: FontWeight.bold,
  },
});
