import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';
import { ThemeMode } from '@/types';

interface ReaderHeaderProps {
  title: string;
  subtitle?: string;
  themeMode: ThemeMode;
  isBookmarked: boolean;
  onBack: () => void;
  onToggleBookmark: () => void;
  onOpenControls: () => void;
  onOpenToc: () => void;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({
  title,
  subtitle,
  themeMode,
  isBookmarked,
  onBack,
  onToggleBookmark,
  onOpenControls,
  onOpenToc,
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

  const iconColor = isMidnight
    ? Colors.text.primary
    : isSepia
    ? '#2D2319'
    : Colors.ivory.text;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 8),
          backgroundColor: bgColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Back Button */}
        <Pressable
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to library"
        >
          <Ionicons name="arrow-back" size={22} color={iconColor} />
        </Pressable>

        {/* Title & Section details */}
        <View style={styles.titleColumn}>
          <Text style={[styles.titleText, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitleText, { color: subtextColor }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Actions Row: TOC, Bookmark, Controls */}
        <View style={styles.actionsRow}>
          {/* Table of Contents / Bookmarks */}
          <Pressable
            onPress={onOpenToc}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Table of contents and bookmarks"
          >
            <Ionicons name="list" size={21} color={iconColor} />
          </Pressable>

          {/* Bookmark Toggle */}
          <Pressable
            onPress={onToggleBookmark}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={21}
              color={isBookmarked ? Colors.gold.primary : iconColor}
            />
          </Pressable>

          {/* Reading Preferences / Typography */}
          <Pressable
            onPress={onOpenControls}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={({ pressed }) => [styles.controlsBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Reading settings and typography"
          >
            <Text style={[styles.controlsText, { color: textColor }]}>Aa</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    paddingBottom: Spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  titleColumn: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  titleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  subtitleText: {
    fontSize: FontSize.xxs,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
});
