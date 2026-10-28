import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';
import { ThemeMode } from '@/types';

interface ReaderFooterProps {
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  themeMode: ThemeMode;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const ReaderFooter: React.FC<ReaderFooterProps> = ({
  currentPage,
  totalPages,
  progressPercent,
  themeMode,
  onPrevPage,
  onNextPage,
}) => {
  const insets = useSafeAreaInsets();

  const isMidnight = themeMode === 'midnight';
  const isSepia = themeMode === 'sepia';

  const bgColor = isMidnight
    ? 'rgba(11, 14, 20, 0.95)'
    : isSepia
    ? 'rgba(239, 231, 211, 0.96)'
    : 'rgba(250, 246, 238, 0.96)';

  const borderColor = isMidnight
    ? Colors.midnight.border
    : isSepia
    ? 'rgba(197, 154, 61, 0.25)'
    : 'rgba(232, 224, 208, 0.8)';

  const textColor = isMidnight
    ? Colors.text.primary
    : isSepia
    ? '#2D2319'
    : Colors.ivory.text;

  const subtextColor = isMidnight
    ? Colors.text.secondary
    : isSepia
    ? '#6D5B4B'
    : Colors.ivory.textMuted;

  const trackBg = isMidnight
    ? 'rgba(255, 255, 255, 0.08)'
    : isSepia
    ? 'rgba(45, 35, 25, 0.12)'
    : 'rgba(28, 25, 23, 0.08)';

  const safePercent = Math.min(100, Math.max(0, Math.round(progressPercent)));
  const displayCurrent = Math.max(1, currentPage);
  const displayTotal = Math.max(1, totalPages);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10),
          backgroundColor: bgColor,
          borderTopColor: borderColor,
        },
      ]}
    >
      {/* Progress Track */}
      <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${safePercent}%`, backgroundColor: Colors.gold.primary },
          ]}
        />
      </View>

      <View style={styles.controlsRow}>
        {/* Previous Button */}
        <Pressable
          onPress={onPrevPage}
          disabled={displayCurrent <= 1}
          style={({ pressed }) => [
            styles.navBtn,
            displayCurrent <= 1 && styles.disabledBtn,
            pressed && styles.pressed,
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={displayCurrent <= 1 ? Colors.text.disabled : textColor}
          />
        </Pressable>

        {/* Center Progress Text */}
        <View style={styles.centerInfo}>
          <Text style={[styles.pageText, { color: textColor }]}>
            Page {displayCurrent} of {displayTotal}
          </Text>
          <Text style={[styles.percentText, { color: subtextColor }]}>
            {safePercent}% Completed
          </Text>
        </View>

        {/* Next Button */}
        <Pressable
          onPress={onNextPage}
          disabled={displayCurrent >= displayTotal}
          style={({ pressed }) => [
            styles.navBtn,
            displayCurrent >= displayTotal && styles.disabledBtn,
            pressed && styles.pressed,
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Next page"
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={displayCurrent >= displayTotal ? Colors.text.disabled : textColor}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.6,
  },
  centerInfo: {
    alignItems: 'center',
  },
  pageText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
  },
  percentText: {
    fontSize: FontSize.xxs,
    marginTop: 1,
  },
});
