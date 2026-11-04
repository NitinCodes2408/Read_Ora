import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ReadingSessionStats } from '@/types';
import { getReadingStats } from '@/services/libraryDatabaseService';

export default function InsightsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<ReadingSessionStats>({
    readingStreakDays: 0,
    totalReadingMinutes: 0,
    booksCompletedCount: 0,
    weeklyActivity: [
      { day: 'Mon', minutes: 0, completed: false },
      { day: 'Tue', minutes: 0, completed: false },
      { day: 'Wed', minutes: 0, completed: false },
      { day: 'Thu', minutes: 0, completed: false },
      { day: 'Fri', minutes: 0, completed: false },
      { day: 'Sat', minutes: 0, completed: false },
      { day: 'Sun', minutes: 0, completed: false },
    ],
  });

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getReadingStats()
        .then((s) => {
          if (isMounted) setStats(s);
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const hours = Math.floor(stats.totalReadingMinutes / 60);
  const minutes = stats.totalReadingMinutes % 60;
  const timeDisplay = `${hours}h ${minutes}m`;
  const completedDaysCount = stats.weeklyActivity.filter((d) => d.completed).length;

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
            <Text style={styles.metricValue}>{stats.readingStreakDays}</Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
          </Card>

          {/* Card 2: Total Time */}
          <Card variant="default" style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <Ionicons name="time-outline" size={20} color={Colors.gold.primary} />
            </View>
            <Text style={styles.metricValue}>{timeDisplay}</Text>
            <Text style={styles.metricLabel}>Total Read Time</Text>
          </Card>

          {/* Card 3: Books Completed */}
          <Card variant="default" style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <Ionicons name="checkmark-done" size={20} color={Colors.gold.primary} />
            </View>
            <Text style={styles.metricValue}>{stats.booksCompletedCount}</Text>
            <Text style={styles.metricLabel}>Books Completed</Text>
          </Card>
        </View>

        {/* Weekly Habit Tracker */}
        <Card variant="default" style={styles.habitCard}>
          <View style={styles.habitHeader}>
            <Text style={styles.habitTitle}>This Week&apos;s Activity</Text>
            <Text style={styles.habitSubtitle}>
              {completedDaysCount} of 7 days completed
            </Text>
          </View>

          <View style={styles.weekRow}>
            {stats.weeklyActivity.map((item, idx) => (
              <View key={idx} style={styles.dayCol}>
                <View
                  style={[
                    styles.dayRing,
                    item.completed && styles.dayRingActive,
                  ]}
                >
                  {item.completed && (
                    <Ionicons name="checkmark" size={14} color={Colors.gold.primary} />
                  )}
                </View>
                <Text
                  style={[
                    styles.dayText,
                    item.completed && styles.dayTextActive,
                  ]}
                >
                  {item.day}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Active Reading Progress Card or Empty State */}
        {stats.currentBook ? (
          <Card variant="goldAccent" style={styles.activeBookCard}>
            <View style={styles.activeBookHeader}>
              <View style={styles.activeBookIcon}>
                {stats.currentBook.coverUri ? (
                  <Image
                    source={{ uri: stats.currentBook.coverUri }}
                    style={styles.activeBookCoverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="book" size={20} color={Colors.gold.primary} />
                )}
              </View>
              <View style={styles.activeBookText}>
                <Text style={styles.activeBookLabel}>RECENTLY READ</Text>
                <Text style={styles.activeBookTitle} numberOfLines={1}>
                  {stats.currentBook.title}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/reader/[id]',
                    params: { id: stats.currentBook!.id },
                  })
                }
                style={styles.resumeBtn}
              >
                <Text style={styles.resumeBtnText}>Resume</Text>
              </Pressable>
            </View>

            {/* Progress Bar */}
            <View style={styles.activeBookProgressRow}>
              <View style={styles.activeBookTrack}>
                <View
                  style={[
                    styles.activeBookFill,
                    { width: `${Math.min(100, Math.max(5, stats.currentBook.progressPercent))}%` },
                  ]}
                />
              </View>
              <Text style={styles.activeBookPercent}>
                {stats.currentBook.progressPercent}%
              </Text>
            </View>
          </Card>
        ) : (
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
              description="Open and read any book in your library to start tracking your reading streak, minutes, and pace."
            />
          </Card>
        )}

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRingActive: {
    borderColor: Colors.gold.primary,
    backgroundColor: Colors.gold.glow,
  },
  dayText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  dayTextActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  activeBookCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  activeBookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  activeBookIcon: {
    width: 38,
    height: 48,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    overflow: 'hidden',
  },
  activeBookCoverImage: {
    width: '100%',
    height: '100%',
  },
  activeBookText: {
    flex: 1,
  },
  activeBookLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    letterSpacing: 0.5,
  },
  activeBookTitle: {
    ...Typography.headline,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    marginTop: 2,
  },
  resumeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gold.primary,
  },
  resumeBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.midnight.darkest,
  },
  activeBookProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  activeBookTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.midnight.surfaceElevated,
    overflow: 'hidden',
  },
  activeBookFill: {
    height: '100%',
    backgroundColor: Colors.gold.primary,
    borderRadius: 3,
  },
  activeBookPercent: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
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
