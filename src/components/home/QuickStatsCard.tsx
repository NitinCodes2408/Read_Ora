import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { Card } from '../common/Card';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const QuickStatsCard: React.FC = () => {
  return (
    <Card variant="goldAccent" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWithLabel}>
          <View style={styles.fireIcon}>
            <Ionicons name="flame" size={18} color={Colors.gold.primary} />
          </View>
          <View>
            <Text style={styles.streakTitle}>Daily Reading Habit</Text>
            <Text style={styles.streakSub}>Goal: 30 mins / day</Text>
          </View>
        </View>

        <View style={styles.streakBadge}>
          <Text style={styles.streakCount}>0</Text>
          <Text style={styles.streakUnit}>Days</Text>
        </View>
      </View>

      <View style={styles.daysRow}>
        {DAYS.map((day, index) => (
          <View key={index} style={styles.dayColumn}>
            <View style={styles.dayDot} />
            <Text style={styles.dayLabel}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.progressFootnote}>
        <Ionicons name="sparkles-outline" size={14} color={Colors.gold.primary} />
        <Text style={styles.footnoteText}>
          Read 10 minutes today to ignite your reading streak!
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  iconWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fireIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  streakSub: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  streakBadge: {
    alignItems: 'flex-end',
  },
  streakCount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    lineHeight: 26,
  },
  streakUnit: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.border,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.midnight.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
  },
  dayLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  progressFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  footnoteText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
});
