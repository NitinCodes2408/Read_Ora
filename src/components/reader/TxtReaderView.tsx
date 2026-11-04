import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';
import { UserPreferences, ThemeMode, Annotation } from '@/types';
import { AnnotationFloatingMenu } from '@/components/reader/AnnotationFloatingMenu';

interface TxtReaderViewProps {
  bookId?: string;
  pages: string[];
  currentPage: number; // 1-based
  preferences: UserPreferences;
  annotations?: Annotation[];
  pageOffsets?: number[];
  onPageChange: (newPage: number) => void;
  onToggleOverlay: () => void;
  onAddAnnotation?: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
}

interface TextSegment {
  text: string;
  annotation?: Annotation;
}

function segmentPageText(
  pageText: string,
  pageStartChar: number,
  allAnnotations: Annotation[]
): TextSegment[] {
  const pageEndChar = pageStartChar + pageText.length;

  const relevant = (allAnnotations || [])
    .map((ann) => {
      try {
        const loc =
          typeof ann.locationJson === 'string'
            ? JSON.parse(ann.locationJson)
            : ann.locationJson;
        if (loc && loc.format === 'TXT' && typeof loc.startChar === 'number') {
          return { ann, start: loc.startChar, end: loc.endChar };
        }
      } catch {}

      const idx = pageText.indexOf(ann.selectedText);
      if (idx !== -1) {
        return {
          ann,
          start: pageStartChar + idx,
          end: pageStartChar + idx + ann.selectedText.length,
        };
      }
      return null;
    })
    .filter((item): item is { ann: Annotation; start: number; end: number } => {
      if (!item) return false;
      return item.start < pageEndChar && item.end > pageStartChar;
    })
    .sort((a, b) => a.start - b.start);

  if (relevant.length === 0) {
    return [{ text: pageText }];
  }

  const segments: TextSegment[] = [];
  let currentLocalOffset = 0;

  for (const item of relevant) {
    const localStart = Math.max(0, item.start - pageStartChar);
    const localEnd = Math.min(pageText.length, item.end - pageStartChar);

    if (localStart > currentLocalOffset) {
      segments.push({
        text: pageText.slice(currentLocalOffset, localStart),
      });
    }

    if (localEnd > localStart) {
      segments.push({
        text: pageText.slice(localStart, localEnd),
        annotation: item.ann,
      });
      currentLocalOffset = localEnd;
    }
  }

  if (currentLocalOffset < pageText.length) {
    segments.push({
      text: pageText.slice(currentLocalOffset),
    });
  }

  return segments;
}

export const TxtReaderView: React.FC<TxtReaderViewProps> = ({
  bookId,
  pages,
  currentPage,
  preferences,
  annotations = [],
  pageOffsets = [],
  onPageChange,
  onToggleOverlay,
  onAddAnnotation,
  onDeleteAnnotation,
}) => {
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<any>(null);
  const flatListRef = useRef<any>(null);

  const [selectedSnippet, setSelectedSnippet] = useState<string>('');
  const [selectedOffsets, setSelectedOffsets] = useState<{
    startChar: number;
    endChar: number;
  } | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);

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
      case 'compact':
        return size * 1.4;
      case 'relaxed':
      case 'loose':
        return size * 2.1;
      case 'normal':
      default:
        return size * 1.7;
    }
  };

  const currentIdx = Math.max(0, Math.min(pages.length - 1, currentPage - 1));
  const currentContent = pages[currentIdx] || '';

  // Web text selection detection with character offset calculation
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleSelectionChange = () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          return;
        }
        const text = sel.toString().trim();
        if (text.length >= 2) {
          const idx = currentContent.indexOf(text);
          if (idx !== -1) {
            const pageStart =
              pageOffsets[currentIdx] !== undefined
                ? pageOffsets[currentIdx]
                : currentIdx * 1400;
            setSelectedSnippet(text);
            setSelectedOffsets({
              startChar: pageStart + idx,
              endChar: pageStart + idx + text.length,
            });
          }
        }
      };

      document.addEventListener('selectionchange', handleSelectionChange);
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [currentContent, currentIdx, pageOffsets]);

  const handleApplyHighlight = (color: string) => {
    if (!selectedOffsets || !selectedSnippet || !onAddAnnotation || !bookId) {
      setSelectedSnippet('');
      setSelectedOffsets(null);
      return;
    }

    onAddAnnotation({
      bookId,
      type: 'highlight',
      color,
      selectedText: selectedSnippet,
      pageNumber: currentPage,
      locationJson: JSON.stringify({
        format: 'TXT',
        startChar: selectedOffsets.startChar,
        endChar: selectedOffsets.endChar,
        pageIndex: currentIdx,
      }),
    });

    if (Platform.OS === 'web') {
      window.getSelection()?.removeAllRanges();
    }
    setSelectedSnippet('');
    setSelectedOffsets(null);
  };

  const handleApplyUnderline = (color: string) => {
    if (!selectedOffsets || !selectedSnippet || !onAddAnnotation || !bookId) {
      setSelectedSnippet('');
      setSelectedOffsets(null);
      return;
    }

    onAddAnnotation({
      bookId,
      type: 'underline',
      color,
      selectedText: selectedSnippet,
      pageNumber: currentPage,
      locationJson: JSON.stringify({
        format: 'TXT',
        startChar: selectedOffsets.startChar,
        endChar: selectedOffsets.endChar,
        pageIndex: currentIdx,
      }),
    });

    if (Platform.OS === 'web') {
      window.getSelection()?.removeAllRanges();
    }
    setSelectedSnippet('');
    setSelectedOffsets(null);
  };

  // In paged mode, tapping left 25% flips back, right 25% flips forward, center 50% toggles overlay
  const handlePress = (e: any) => {
    if (selectedSnippet) {
      setSelectedSnippet('');
      setSelectedOffsets(null);
      return;
    }
    if (selectedAnnotation) {
      setSelectedAnnotation(null);
      return;
    }

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

  const renderSegmentedText = (pageText: string, pageIdx: number) => {
    const startChar =
      pageOffsets[pageIdx] !== undefined ? pageOffsets[pageIdx] : pageIdx * 1400;
    const segments = segmentPageText(pageText, startChar, annotations);

    return (
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
        {segments.map((seg, idx) => {
          if (!seg.annotation) {
            return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
          }

          const isUnderline = seg.annotation.type === 'underline';
          const color = seg.annotation.color || '#F5D061';

          return (
            <Text
              key={idx}
              style={[
                isUnderline
                  ? {
                      textDecorationLine: 'underline',
                      textDecorationColor: color,
                      textDecorationStyle: 'solid',
                    }
                  : {
                      backgroundColor: color + '55',
                      borderRadius: 2,
                    },
              ]}
              onPress={() => setSelectedAnnotation(seg.annotation || null)}
            >
              {seg.text}
            </Text>
          );
        })}
      </Text>
    );
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
            ref={scrollViewRef}
            contentContainerStyle={styles.pagedContent}
            showsVerticalScrollIndicator={false}
          >
            {renderSegmentedText(currentContent, currentIdx)}
          </ScrollView>
        </Pressable>
      ) : (
        <FlatList
          ref={flatListRef}
          data={pages}
          keyExtractor={(_, idx) => idx.toString()}
          initialScrollIndex={Math.max(0, Math.min(pages.length - 1, currentPage - 1))}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: false,
              });
            }, 100);
          }}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onMomentumScrollEnd={(e) => {
            const contentHeight = e.nativeEvent.contentSize.height;
            const scrollY = e.nativeEvent.contentOffset.y;
            const viewHeight = e.nativeEvent.layoutMeasurement.height;
            if (contentHeight > viewHeight) {
              const ratio = (scrollY + viewHeight * 0.5) / contentHeight;
              const calculatedPage = Math.max(
                1,
                Math.min(pages.length, Math.ceil(ratio * pages.length))
              );
              if (calculatedPage !== currentPage) {
                onPageChange(calculatedPage);
              }
            }
          }}
          renderItem={({ item, index }) => (
            <Pressable onPress={onToggleOverlay} style={styles.scrollPageBlock}>
              {renderSegmentedText(item, index)}
              {index < pages.length - 1 && (
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
            </Pressable>
          )}
        />
      )}

      {/* Floating Action Menu for Text Selection */}
      <AnnotationFloatingMenu
        visible={Boolean(selectedSnippet && selectedSnippet.length >= 2)}
        selectedText={selectedSnippet}
        onApplyHighlight={handleApplyHighlight}
        onApplyUnderline={handleApplyUnderline}
        onDismiss={() => {
          setSelectedSnippet('');
          setSelectedOffsets(null);
        }}
      />

      {/* Selected Annotation Info / Delete Banner */}
      {selectedAnnotation && (
        <View style={styles.deleteBannerContainer}>
          <View style={styles.deleteBannerCard}>
            <View style={styles.deleteBannerInfo}>
              <View
                style={[
                  styles.annBadgeDot,
                  { backgroundColor: selectedAnnotation.color || Colors.gold.primary },
                ]}
              />
              <Text style={styles.deleteBannerTitle} numberOfLines={1}>
                {`${selectedAnnotation.type.toUpperCase()}: "${selectedAnnotation.selectedText}"`}
              </Text>
            </View>
            <View style={styles.deleteBannerActions}>
              <Pressable
                style={styles.deleteActionBtn}
                onPress={() => {
                  if (onDeleteAnnotation) {
                    onDeleteAnnotation(selectedAnnotation.id);
                  }
                  setSelectedAnnotation(null);
                }}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.status.error} />
                <Text style={styles.deleteActionText}>Delete</Text>
              </Pressable>
              <Pressable
                style={styles.dismissActionBtn}
                onPress={() => setSelectedAnnotation(null)}
              >
                <Ionicons name="close" size={16} color={Colors.text.secondary} />
              </Pressable>
            </View>
          </View>
        </View>
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
  deleteBannerContainer: {
    position: 'absolute',
    bottom: 84,
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
    zIndex: 9999,
  },
  deleteBannerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#121620',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  deleteBannerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  annBadgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  deleteBannerTitle: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text.primary,
    fontStyle: 'italic',
  },
  deleteBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: BorderRadius.sm,
  },
  deleteActionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.status.error,
  },
  dismissActionBtn: {
    padding: 4,
  },
});

