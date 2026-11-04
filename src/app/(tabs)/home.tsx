import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { ReadOraLogo } from '@/components/common/ReadOraLogo';
import { SearchInput } from '@/components/common/SearchInput';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { GreetingCard } from '@/components/home/GreetingCard';
import { QuickStatsCard } from '@/components/home/QuickStatsCard';
import { ActionShortcuts } from '@/components/home/ActionShortcuts';
import { useLibrary } from '@/hooks/useLibrary';
import { formatFileSize, formatDate } from '@/utils/fileUtils';

export default function HomeScreen() {
  const router = useRouter();
  const { books, refresh, importBook } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Refresh library data whenever Home tab comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Determine current active or most recent book
  const recentBook = useMemo(() => {
    if (books.length === 0) return null;
    const readBooks = books.filter((b) => b.lastReadAt);
    if (readBooks.length > 0) {
      return [...readBooks].sort(
        (a, b) => new Date(b.lastReadAt!).getTime() - new Date(a.lastReadAt!).getTime()
      )[0];
    }
    return books[0];
  }, [books]);

  // Other recently added books
  const otherRecentBooks = useMemo(() => {
    if (books.length <= 1) return [];
    return books.filter((b) => b.id !== recentBook?.id).slice(0, 4);
  }, [books, recentBook]);

  // Matching books when user searches from the sticky Home search bar
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    );
  }, [books, searchQuery]);

  const handleImportBook = async () => {
    try {
      setIsImporting(true);
      const result = await importBook();

      if (result.success) {
        Alert.alert(
          'Book Saved in Library',
          `"${result.book.title}" (${result.book.format}) was added to your library.`,
          [
            {
              text: 'Read Now',
              onPress: () => {
                router.push({
                  pathname: '/reader/[id]',
                  params: { id: result.book.id },
                });
              },
            },
            {
              text: 'Go to Library',
              onPress: () => router.push('/(tabs)/library'),
            },
            { text: 'Done', style: 'cancel' },
          ]
        );
      } else {
        if (!result.canceled && result.error) {
          Alert.alert('Import Failed', result.error, [{ text: 'OK' }]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error during import';
      Alert.alert('Import Error', msg, [{ text: 'OK' }]);
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenRecentBook = () => {
    if (!recentBook) return;
    router.push({
      pathname: '/reader/[id]',
      params: { id: recentBook.id },
    });
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Reading Reminders',
      'Daily reading habit notifications and reminders will be configurable in your reading preferences.',
      [{ text: 'Close' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Sticky Top Bar & Search Bar */}
      <View style={styles.stickyHeaderContainer}>
        <View style={styles.stickyHeaderContent}>
          <View style={styles.topBar}>
            <ReadOraLogo variant="transparent" width={210} style={styles.logo} />
            <Pressable
              onPress={handleNotificationPress}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.text.primary}
              />
            </Pressable>
          </View>

          {/* Sticky Greeting Line */}
          <GreetingCard />

          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search books, authors..."
            style={styles.searchBar}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Results if user searched from Home */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.searchResultsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Library Matches ({searchResults.length})
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/discover',
                    params: { q: searchQuery },
                  })
                }
              >
                <Text style={styles.sectionAction}>Search Worldwide →</Text>
              </Pressable>
            </View>

            {searchResults.length > 0 ? (
              searchResults.map((book) => (
                <Pressable
                  key={book.id}
                  onPress={() =>
                    router.push({
                      pathname: '/reader/[id]',
                      params: { id: book.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.searchResultItem,
                    pressed && styles.miniCardPressed,
                  ]}
                >
                  <Ionicons
                    name={book.format === 'EPUB' ? 'book' : 'document-text'}
                    size={22}
                    color={Colors.gold.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchResultTitle} numberOfLines={1}>
                      {book.title}
                    </Text>
                    <Text style={styles.searchResultAuthor}>by {book.author}</Text>
                  </View>
                  <View style={styles.miniFormatTag}>
                    <Text style={styles.miniFormatText}>{book.format}</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={styles.noSearchMatch}>
                <Text style={styles.noSearchMatchText}>
                  No books found in your library for &quot;{searchQuery}&quot;
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/discover',
                      params: { q: searchQuery },
                    })
                  }
                  style={styles.searchDiscoverBtn}
                >
                  <Ionicons name="search" size={14} color="#000000" />
                  <Text style={styles.searchDiscoverBtnText}>
                    Search &quot;{searchQuery}&quot; on Discover
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Continue Reading Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue Reading</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/library')}
            accessibilityRole="button"
            accessibilityLabel="View all books in library"
          >
            <Text style={styles.sectionAction}>View Library</Text>
          </Pressable>
        </View>

        {recentBook ? (
          /* Recent Real Book Card */
          <Card variant="goldAccent" style={styles.recentBookCard}>
            <View style={styles.recentContent}>
              <View style={styles.recentCoverBox}>
                {recentBook.coverUri ? (
                  <Image
                    source={{ uri: recentBook.coverUri }}
                    style={styles.recentCoverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name={recentBook.format === 'EPUB' ? 'book' : 'document-text'}
                    size={28}
                    color={Colors.gold.primary}
                  />
                )}
                <View style={styles.recentFormatTag}>
                  <Text style={styles.recentFormatText}>{recentBook.format}</Text>
                </View>
              </View>

              <View style={styles.recentDetails}>
                <Text style={styles.recentTitle} numberOfLines={2}>
                  {recentBook.title}
                </Text>
                <Text style={styles.recentAuthor}>{recentBook.author}</Text>
                <Text style={styles.recentMeta}>
                  {recentBook.currentPage && recentBook.currentPage > 0
                    ? `Page ${recentBook.currentPage}${recentBook.totalPages ? ` of ${recentBook.totalPages}` : ''} • `
                    : `Added ${formatDate(recentBook.addedAt)} • `}
                  {formatFileSize(recentBook.fileSizeBytes)}
                </Text>

                {recentBook.progressPercent > 0 && (
                  <View style={styles.recentProgressContainer}>
                    <View style={styles.recentProgressBarBg}>
                      <View
                        style={[
                          styles.recentProgressBarFill,
                          { width: `${Math.min(100, Math.max(5, recentBook.progressPercent))}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.recentProgressPercent}>
                      {recentBook.progressPercent}%
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.recentActionsRow}>
              <Button
                title={recentBook.progressPercent > 0 ? 'Continue Reading' : 'Start Reading'}
                onPress={handleOpenRecentBook}
                variant="primary"
                size="md"
                style={styles.continueButton}
              />
              <Button
                title="Manage"
                onPress={() => router.push('/(tabs)/library')}
                variant="secondary"
                size="md"
                style={styles.manageButton}
              />
            </View>
          </Card>
        ) : (
          /* Honest Empty State when 0 books exist */
          <Card variant="default" style={styles.continueReadingCard}>
            <EmptyState
              icon={
                <Ionicons
                  name="book-outline"
                  size={30}
                  color={Colors.gold.primary}
                />
              }
              title="No Book in Progress"
              description="Your recent reads will appear here with your saved position, bookmarks, and progress."
              actionTitle={isImporting ? 'Importing...' : '+ Import Book'}
              onActionPress={handleImportBook}
            />
          </Card>
        )}

        {/* Recently Added Books Section if multiple books exist */}
        {otherRecentBooks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Added</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/library')}
                accessibilityRole="button"
                accessibilityLabel="View all books"
              >
                <Text style={styles.sectionAction}>See All ({books.length})</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalBooksScroll}
            >
              {otherRecentBooks.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: '/reader/[id]',
                      params: { id: item.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.miniBookCard,
                    pressed && styles.miniCardPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Read ${item.title}`}
                >
                  <View style={styles.miniCoverBox}>
                    {item.coverUri ? (
                      <Image
                        source={{ uri: item.coverUri }}
                        style={styles.miniCoverImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name={
                          item.format === 'EPUB'
                            ? 'book'
                            : item.format === 'PDF'
                            ? 'document-text'
                            : 'document'
                        }
                        size={20}
                        color={Colors.gold.primary}
                      />
                    )}
                    <View style={styles.miniFormatTag}>
                      <Text style={styles.miniFormatText}>{item.format}</Text>
                    </View>
                  </View>
                  <Text style={styles.miniTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.miniAuthor} numberOfLines={1}>
                    {item.author}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Quick Action Shortcuts (Library, Discover) with real book count */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </View>
        <ActionShortcuts
          onImportPress={handleImportBook}
          bookCount={books.length}
        />

        {/* Compact Reading Progress & Habit Tracker */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reading Habit</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/insights')}
            accessibilityRole="button"
            accessibilityLabel="View all reading insights"
          >
            <Text style={styles.sectionAction}>Detailed Stats</Text>
          </Pressable>
        </View>
        <QuickStatsCard />

        {/* Primary Call to Action Banner */}
        <Card variant="goldAccent" style={styles.importBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="folder-open" size={24} color={Colors.gold.primary} />
            </View>
            <View style={styles.bannerTextBox}>
              <Text style={styles.bannerTitle}>
                {books.length > 0 ? 'Add More to Your Library' : 'Build Your Digital Library'}
              </Text>
              <Text style={styles.bannerSub}>
                Import PDF documents, EPUB e-books, or TXT study notes directly into offline storage.
              </Text>
            </View>
          </View>
          <Button
            title={isImporting ? 'Importing...' : '+ Import Book (PDF, EPUB, TXT)'}
            onPress={handleImportBook}
            variant="primary"
            size="md"
            style={styles.bannerButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.midnight.background,
  },
  stickyHeaderContainer: {
    backgroundColor: Colors.midnight.background,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  stickyHeaderContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'web' ? Spacing.lg : Spacing.md,
    paddingBottom: Spacing.xs,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl + 20,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  logo: {
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.midnight.surface,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  searchBar: {
    marginBottom: Spacing.xxs,
  },
  searchResultsContainer: {
    backgroundColor: Colors.midnight.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchResultTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.primary,
  },
  searchResultAuthor: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  noSearchMatch: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  noSearchMatchText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  searchDiscoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold.primary,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  searchDiscoverBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  sectionAction: {
    fontSize: FontSize.sm,
    color: Colors.gold.primary,
    fontWeight: FontWeight.medium,
  },
  continueReadingCard: {
    padding: Spacing.none,
    marginBottom: Spacing.lg,
  },
  recentBookCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  recentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recentCoverBox: {
    width: 56,
    height: 76,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  recentCoverImage: {
    width: '100%',
    height: '100%',
  },
  recentFormatTag: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(11, 14, 20, 0.88)',
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  recentFormatText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  recentDetails: {
    flex: 1,
  },
  recentTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  recentAuthor: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  recentMeta: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  recentProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  recentProgressBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.midnight.surfaceHighlight,
    overflow: 'hidden',
  },
  recentProgressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.gold.primary,
  },
  recentProgressPercent: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  horizontalBooksScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  miniBookCard: {
    width: 120,
    backgroundColor: Colors.midnight.surface,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  miniCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  miniCoverBox: {
    width: '100%',
    height: 80,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.midnight.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  miniCoverImage: {
    width: '100%',
    height: '100%',
  },
  miniFormatTag: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(11, 14, 20, 0.88)',
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  miniFormatText: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
  miniTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.primary,
    lineHeight: 16,
  },
  miniAuthor: {
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  recentActionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  continueButton: {
    flex: 1,
  },
  manageButton: {
    width: 90,
  },
  importBanner: {
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  bannerSub: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  bannerButton: {
    width: '100%',
  },
});
