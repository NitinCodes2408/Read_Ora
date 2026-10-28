import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';

export const GreetingCard: React.FC = () => {
  // Determine time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.textColumn}>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.readerText}> Reader</Text>
        </View>
        <Text style={styles.tagline}>Your personal reading sanctum awaits.</Text>
      </View>
      <View style={styles.badgeContainer}>
        <Ionicons name="moon-outline" size={16} color={Colors.gold.primary} />
        <Text style={styles.badgeText}>Offline</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  textColumn: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  greetingText: {
    ...Typography.title2,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  readerText: {
    ...Typography.title2,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  tagline: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.midnight.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    gap: 5,
  },
  badgeText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
    letterSpacing: 0.3,
  },
});
