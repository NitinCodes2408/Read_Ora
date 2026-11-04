import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { Bookmark, Annotation } from '@/types';
import { formatDate } from '@/utils/fileUtils';

export interface TocItem {
  title: string;
  pageIndex: number; // 0-based
  isFrontMatter?: boolean;
}

interface ReaderTocModalProps {
  visible: boolean;
  bookTitle: string;
  tocItems: TocItem[];
  currentPage: number; // 1-based
  bookmarks: Bookmark[];
  annotations?: Annotation[];
  onClose: () => void;
  onSelectPage: (page: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
}

export const ReaderTocModal: React.FC<ReaderTocModalProps> = ({
  visible,
  bookTitle,
  tocItems,
  currentPage,
  bookmarks,
  annotations = [],
  onClose,
  onSelectPage,
  onDeleteBookmark,
  onDeleteAnnotation,
}) => {
  const [activeTab, setActiveTab] = useState<'toc' | 'bookmarks' | 'annotations'>('toc');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.bookTitle} numberOfLines={1}>
                {bookTitle}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setActiveTab('toc')}
              style={[
                styles.tabButton,
                activeTab === 'toc' && styles.tabButtonActive,
              ]}
            >
              <Ionicons
                name="list"
                size={15}
                color={activeTab === 'toc' ? Colors.gold.primary : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'toc' && styles.tabTextActive,
                ]}
              >
                Chapters ({tocItems.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('bookmarks')}
              style={[
                styles.tabButton,
                activeTab === 'bookmarks' && styles.tabButtonActive,
              ]}
            >
              <Ionicons
                name="bookmark"
                size={15}
                color={activeTab === 'bookmarks' ? Colors.gold.primary : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'bookmarks' && styles.tabTextActive,
                ]}
              >
                Bookmarks ({bookmarks.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('annotations')}
              style={[
                styles.tabButton,
                activeTab === 'annotations' && styles.tabButtonActive,
              ]}
            >
              <Ionicons
                name="color-palette-outline"
                size={15}
                color={activeTab === 'annotations' ? Colors.gold.primary : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'annotations' && styles.tabTextActive,
                ]}
              >
                Highlights ({annotations.length})
              </Text>
            </Pressable>
          </View>

          {/* Content Area */}
          <ScrollView
            style={styles.scrollList}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'toc' ? (
              tocItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="book-outline" size={32} color={Colors.text.tertiary} />
                  <Text style={styles.emptyTitle}>No Chapters Detected</Text>
                  <Text style={styles.emptySubtitle}>
                    Use the bottom page controls to navigate through the book.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.tocSummaryBar}>
                    <Ionicons name="shield-checkmark" size={13} color={Colors.gold.primary} />
                    <Text style={styles.tocSummaryText}>
                      Unabridged Edition • {tocItems.filter((t) => !t.isFrontMatter).length || tocItems.length} Story Chapters ({tocItems.length} Sections)
                    </Text>
                  </View>

                  {tocItems.map((item, idx) => {
                    const targetPage = item.pageIndex + 1;
                    const isCurrent = currentPage === targetPage;
                    return (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          onSelectPage(targetPage);
                          onClose();
                        }}
                        style={({ pressed }) => [
                          styles.tocRow,
                          isCurrent && styles.tocRowCurrent,
                          pressed && styles.rowPressed,
                        ]}
                      >
                        <View style={styles.tocLeft}>
                          <Ionicons
                            name={
                              item.isFrontMatter
                                ? 'document-text-outline'
                                : isCurrent
                                ? 'bookmark'
                                : 'book-outline'
                            }
                            size={14}
                            color={isCurrent ? Colors.gold.primary : item.isFrontMatter ? Colors.text.tertiary : Colors.text.secondary}
                          />
                          <Text
                            style={[
                              styles.tocTitle,
                              isCurrent && styles.tocTitleActive,
                              item.isFrontMatter && styles.tocTitleFrontMatter,
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          {item.isFrontMatter && (
                            <View style={styles.frontMatterBadge}>
                              <Text style={styles.frontMatterBadgeText}>Front Matter</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.tocPageNum,
                            isCurrent && styles.tocPageNumActive,
                          ]}
                        >
                          p. {targetPage}
                        </Text>
                      </Pressable>
                    );
                  })}
                </>
              )
            ) : activeTab === 'bookmarks' ? (
              bookmarks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="bookmark-outline" size={32} color={Colors.gold.primary} />
                  <Text style={styles.emptyTitle}>No Bookmarks Saved</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap the bookmark icon in the top header while reading to save your favorite passages.
                  </Text>
                </View>
              ) : (
                bookmarks.map((bm) => (
                  <View key={bm.id} style={styles.bookmarkRow}>
                    <Pressable
                      onPress={() => {
                        onSelectPage(bm.page);
                        onClose();
                      }}
                      style={styles.bookmarkContent}
                    >
                      <Ionicons name="bookmark" size={18} color={Colors.gold.primary} />
                      <View style={styles.bookmarkTextColumn}>
                        <Text style={styles.bookmarkPageTitle}>
                          Page {bm.page}
                        </Text>
                        {bm.title && (
                          <Text style={styles.bookmarkSnippet} numberOfLines={1}>
                            {bm.title}
                          </Text>
                        )}
                        <Text style={styles.bookmarkDate}>
                          Saved {formatDate(bm.createdAt)}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => onDeleteBookmark(bm.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.deleteBookmarkBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.status.error} />
                    </Pressable>
                  </View>
                ))
              )
            ) : annotations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="color-palette-outline" size={32} color={Colors.gold.primary} />
                <Text style={styles.emptyTitle}>No Highlights or Underlines</Text>
                <Text style={styles.emptySubtitle}>
                  Select text anywhere in the book to apply highlights and underlines.
                </Text>
              </View>
            ) : (
              annotations.map((ann) => {
                const targetPage =
                  typeof ann.pageNumber === 'number'
                    ? ann.pageNumber
                    : typeof ann.chapterIndex === 'number'
                    ? ann.chapterIndex + 1
                    : 1;

                const locationLabel =
                  typeof ann.chapterIndex === 'number'
                    ? `Chapter ${ann.chapterIndex + 1}`
                    : `Page ${targetPage}`;

                return (
                  <View key={ann.id} style={styles.annotationRow}>
                    <Pressable
                      onPress={() => {
                        onSelectPage(targetPage);
                        onClose();
                      }}
                      style={styles.annotationContent}
                    >
                      <View style={styles.annotationHeaderRow}>
                        <View
                          style={[
                            styles.annDot,
                            { backgroundColor: ann.color || Colors.gold.primary },
                          ]}
                        />
                        <Text style={styles.annBadgeText}>{ann.type.toUpperCase()}</Text>
                        <Text style={styles.annLocationText}>{locationLabel}</Text>
                      </View>
                      <Text style={styles.annQuoteText} numberOfLines={3}>
                        {`"${ann.selectedText}"`}
                      </Text>
                      <Text style={styles.annDateText}>
                        Saved {formatDate(ann.createdAt)}
                      </Text>
                    </Pressable>

                    {onDeleteAnnotation && (
                      <Pressable
                        onPress={() => onDeleteAnnotation(ann.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.deleteBookmarkBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color={Colors.status.error} />
                      </Pressable>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.midnight.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: Spacing.lg,
    maxHeight: '75%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  bookTitle: {
    ...Typography.title3,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.midnight.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.midnight.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
  },
  tabText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  tabTextActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  scrollList: {
    marginTop: Spacing.xs,
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.borderSubtle,
    borderRadius: BorderRadius.sm,
  },
  tocRowCurrent: {
    backgroundColor: Colors.midnight.surfaceElevated,
  },
  rowPressed: {
    opacity: 0.7,
  },
  tocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chapterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text.tertiary,
  },
  chapterDotActive: {
    backgroundColor: Colors.gold.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tocTitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  tocTitleActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.semiBold,
  },
  tocPageNum: {
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    marginLeft: 8,
  },
  tocPageNumActive: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  tocSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(229, 186, 88, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 186, 88, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  tocSummaryText: {
    fontSize: FontSize.xs,
    color: Colors.gold.primary,
    fontWeight: FontWeight.medium,
  },
  tocTitleFrontMatter: {
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  frontMatterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginLeft: 6,
  },
  frontMatterBadgeText: {
    fontSize: 9,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.borderSubtle,
  },
  bookmarkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bookmarkTextColumn: {
    flex: 1,
  },
  bookmarkPageTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  bookmarkSnippet: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  bookmarkDate: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  deleteBookmarkBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  annotationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.midnight.borderSubtle,
  },
  annotationContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  annotationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  annDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  annBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    letterSpacing: 0.5,
  },
  annLocationText: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    marginLeft: 4,
  },
  annQuoteText: {
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    color: Colors.text.secondary,
    lineHeight: 18,
    marginVertical: 2,
  },
  annDateText: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});
