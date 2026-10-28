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
import { Bookmark } from '@/types';
import { formatDate } from '@/utils/fileUtils';

export interface TocItem {
  title: string;
  pageIndex: number; // 0-based
}

interface ReaderTocModalProps {
  visible: boolean;
  bookTitle: string;
  tocItems: TocItem[];
  currentPage: number; // 1-based
  bookmarks: Bookmark[];
  onClose: () => void;
  onSelectPage: (page: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
}

export const ReaderTocModal: React.FC<ReaderTocModalProps> = ({
  visible,
  bookTitle,
  tocItems,
  currentPage,
  bookmarks,
  onClose,
  onSelectPage,
  onDeleteBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<'toc' | 'bookmarks'>('toc');

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
                size={16}
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
                size={16}
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
                tocItems.map((item, idx) => {
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
                        <View
                          style={[
                            styles.chapterDot,
                            isCurrent && styles.chapterDotActive,
                          ]}
                        />
                        <Text
                          style={[
                            styles.tocTitle,
                            isCurrent && styles.tocTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
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
                })
              )
            ) : bookmarks.length === 0 ? (
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
});
