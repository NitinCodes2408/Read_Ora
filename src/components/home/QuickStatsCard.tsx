import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { getReadingStats } from '@/services/libraryDatabaseService';
import { ReadingSessionStats } from '@/types';
import { Card } from '../common/Card';

export const QuickStatsCard: React.FC = () => {
  const [stats, setStats] = useState<ReadingSessionStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    getReadingStats()
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch(() => {
        // preserve null
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const streakDays = stats?.readingStreakDays ?? 0;
  const weeklyActivity = stats?.weeklyActivity ?? [
    { day: 'Mon', minutes: 0, completed: false },
    { day: 'Tue', minutes: 0, completed: false },
    { day: 'Wed', minutes: 0, completed: false },
    { day: 'Thu', minutes: 0, completed: false },
    { day: 'Fri', minutes: 0, completed: false },
    { day: 'Sat', minutes: 0, completed: false },
    { day: 'Sun', minutes: 0, completed: false },
  ];

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
          <Text style={styles.streakCount}>{streakDays}</Text>
          <Text style={styles.streakUnit}>Days</Text>
        </View>
      </View>

      <View style={styles.daysRow}>
        {weeklyActivity.map((item, index) => (
          <View key={index} style={styles.dayColumn}>
            <View
              style={[
                styles.dayDot,
                item.completed && styles.dayDotActive,
              ]}
            />
            <Text
              style={[
                styles.dayLabel,
                item.completed && styles.dayLabelActive,
              ]}
            >
              {item.day.charAt(0)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.progressFootnote}>
        <Ionicons name="sparkles-outline" size={14} color={Colors.gold.primary} />
        <Text style={styles.footnoteText}>
          {streakDays > 0
            ? `You're on a ${streakDays}-day reading streak! Keep reading today.`
            : 'Read 10 minutes today to ignite your reading streak!'}
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
  dayDotActive: {
    backgroundColor: Colors.gold.primary,
    borderColor: Colors.gold.border,
  },
  dayLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  dayLabelActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
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
