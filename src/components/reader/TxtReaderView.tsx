import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { UserPreferences, ThemeMode } from '@/types';

interface TxtReaderViewProps {
  pages: string[];
  currentPage: number; // 1-based
  preferences: UserPreferences;
  onPageChange: (newPage: number) => void;
  onToggleOverlay: () => void;
}

export const TxtReaderView: React.FC<TxtReaderViewProps> = ({
  pages,
  currentPage,
  preferences,
  onPageChange,
  onToggleOverlay,
}) => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const themeMode: ThemeMode = preferences.themeMode;
  const isMidnight = themeMode === 'midnight';
  const isSepia = themeMode === 'sepia';

  const bgColor = isMidnight
    ? Colors.midnight.background
    : isSepia
    ? '#EFE7D3'
    : '#FAF6EE';

  const textColor = isMidnight
    ? Colors.text.primary
    : isSepia
    ? '#2D2319'
    : Colors.ivory.text;

  const getFontFamily = () => {
    switch (preferences.fontFamily) {
      case 'serif':
        return Platform.OS === 'ios' ? 'Georgia' : 'serif';
      case 'sans':
        return Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif';
      case 'mono':
        return Platform.OS === 'ios' ? 'Courier New' : 'monospace';
      default:
        return undefined;
    }
  };

  const getLineHeight = () => {
    const size = preferences.fontSize;
    switch (preferences.lineSpacing) {
      case 'normal':
        return size * 1.5;
      case 'relaxed':
        return size * 1.8;
      case 'loose':
        return size * 2.1;
      default:
        return size * 1.8;
    }
  };

  const currentIdx = Math.max(0, Math.min(pages.length - 1, currentPage - 1));
  const currentContent = pages[currentIdx] || '';

  // In paged mode, tapping left 25% flips back, right 25% flips forward, center 50% toggles overlay
  const handlePress = (e: any) => {
    const clickX = e.nativeEvent.locationX;
    const third = width * 0.25;

    if (preferences.readingMode === 'paged') {
      if (clickX < third) {
        if (currentPage > 1) {
          onPageChange(currentPage - 1);
        }
      } else if (clickX > width - third) {
        if (currentPage < pages.length) {
          onPageChange(currentPage + 1);
        }
      } else {
        onToggleOverlay();
      }
    } else {
      onToggleOverlay();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {preferences.readingMode === 'paged' ? (
        <Pressable
          style={styles.pagedContainer}
          onPress={handlePress}
          accessible={false}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.pagedContent}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                styles.bookText,
                {
                  color: textColor,
                  fontSize: preferences.fontSize,
                  fontFamily: getFontFamily(),
                  lineHeight: getLineHeight(),
                },
              ]}
              selectable
            >
              {currentContent}
            </Text>
          </ScrollView>
        </Pressable>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const contentHeight = e.nativeEvent.contentSize.height;
            const scrollY = e.nativeEvent.contentOffset.y;
            const viewHeight = e.nativeEvent.layoutMeasurement.height;
            if (contentHeight > viewHeight) {
              const ratio = (scrollY + viewHeight) / contentHeight;
              const calculatedPage = Math.max(
                1,
                Math.min(pages.length, Math.ceil(ratio * pages.length))
              );
              if (calculatedPage !== currentPage) {
                onPageChange(calculatedPage);
              }
            }
          }}
          scrollEventThrottle={150}
        >
          <Pressable onPress={onToggleOverlay}>
            {pages.map((p, idx) => (
              <View key={idx} style={styles.scrollPageBlock}>
                <Text
                  style={[
                    styles.bookText,
                    {
                      color: textColor,
                      fontSize: preferences.fontSize,
                      fontFamily: getFontFamily(),
                      lineHeight: getLineHeight(),
                    },
                  ]}
                  selectable
                >
                  {p}
                </Text>
                {idx < pages.length - 1 && (
                  <View
                    style={[
                      styles.pageDivider,
                      {
                        borderColor: isMidnight
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagedContainer: {
    flex: 1,
  },
  pagedContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 20,
    paddingBottom: Spacing.xxl + 40,
    flexGrow: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 20,
    paddingBottom: Spacing.xxl + 50,
  },
  scrollPageBlock: {
    marginBottom: Spacing.lg,
  },
  pageDivider: {
    borderBottomWidth: 1,
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.md,
  },
  bookText: {
    letterSpacing: 0.2,
  },
});
