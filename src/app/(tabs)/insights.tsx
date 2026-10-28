import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        title="Reading Insights"
        subtitle="Habit tracking & reading analytics"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Streak */}
          <Card variant="goldAccent" style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <Ionicons name="flame" size={20} color={Colors.gold.primary} />
            </View>
            <Text style={styles.metricValue}>0</Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
          </Card>

          {/* Card 2: Total Time */}
          <Card variant="default" style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <Ionicons name="time-outline" size={20} color={Colors.gold.primary} />
            </View>
            <Text style={styles.metricValue}>0h 0m</Text>
            <Text style={styles.metricLabel}>Total Read Time</Text>
          </Card>

          {/* Card 3: Books Completed */}
          <Card variant="default" style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <Ionicons name="checkmark-done" size={20} color={Colors.gold.primary} />
            </View>
            <Text style={styles.metricValue}>0</Text>
            <Text style={styles.metricLabel}>Books Completed</Text>
          </Card>
        </View>

        {/* Weekly Habit Tracker (Honest 0 state) */}
        <Card variant="default" style={styles.habitCard}>
          <View style={styles.habitHeader}>
            <Text style={styles.habitTitle}>This Week&apos;s Activity</Text>
            <Text style={styles.habitSubtitle}>0 of 7 days completed</Text>
          </View>

          <View style={styles.weekRow}>
            {DAYS.map((day, idx) => (
              <View key={idx} style={styles.dayCol}>
                <View style={styles.dayRing} />
                <Text style={styles.dayText}>{day}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Honest Empty State for Reading Analytics */}
        <Card variant="default" style={styles.emptyCard}>
          <EmptyState
            icon={
              <Ionicons
                name="analytics-outline"
                size={34}
                color={Colors.gold.primary}
              />
            }
            title="No Reading Activity Yet"
            description="Reading sessions, velocity, bookmarks, and page counts will automatically track here once you open and read a book."
          />
        </Card>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.text.tertiary} />
          <Text style={styles.privacyText}>
            All reading analytics and metrics are processed 100% locally on your device. Never transmitted or sold.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.midnight.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  metricLabel: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  habitCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  habitTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  habitSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.midnight.border,
    backgroundColor: Colors.midnight.surfaceElevated,
  },
  dayText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  emptyCard: {
    padding: Spacing.none,
    marginBottom: Spacing.md,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.midnight.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
  },
  privacyText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    lineHeight: 18,
  },
});
