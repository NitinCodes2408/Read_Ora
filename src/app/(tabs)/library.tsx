import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Book, SortOption } from '@/types';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { Header } from '@/components/common/Header';
import { SearchInput } from '@/components/common/SearchInput';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterBar, FilterType } from '@/components/library/FilterBar';
import { BookGridCard } from '@/components/library/BookGridCard';
import { BookActionModal } from '@/components/library/BookActionModal';
import { useLibrary } from '@/hooks/useLibrary';

export default function LibraryScreen() {
  const router = useRouter();
  const { books, isLoading, refresh, importBook, removeBook, renameBook } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Refresh library data whenever tab comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleImportPress = async () => {
    try {
      setIsImporting(true);
      const result = await importBook();

      if (result.success) {
        Alert.alert(
          'Book Saved in Library',
          `"${result.book.title}" (${result.book.format}) was successfully stored in your library.`,
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
              text: 'View Details',
              onPress: () => setSelectedBook(result.book),
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

  const handleSortPress = () => {
    const options: SortOption[] = ['recent', 'title', 'size'];
    const labels = ['Most Recent', 'Alphabetical (A-Z)', 'File Size (Largest)'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, 'Cancel'],
          cancelButtonIndex: 3,
          title: 'Sort Library',
        },
        (buttonIndex) => {
          if (buttonIndex < 3) {
            setSortOption(options[buttonIndex]);
          }
        }
      );
    } else {
      Alert.alert(
        'Sort Library',
        'Choose how to order your books:',
        [
          { text: 'Most Recent', onPress: () => setSortOption('recent') },
          { text: 'Alphabetical (A-Z)', onPress: () => setSortOption('title') },
          { text: 'File Size', onPress: () => setSortOption('size') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Filter and sort books based on state
  const displayedBooks = useMemo(() => {
    let result = [...books];

    // Filter by format
    if (activeFilter !== 'ALL') {
      result = result.filter((b) => b.format === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.author.toLowerCase().includes(query) ||
          b.originalFilename.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortOption === 'size') {
        return b.fileSizeBytes - a.fileSizeBytes;
      }
      // default 'recent'
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });

    return result;
  }, [books, activeFilter, searchQuery, sortOption]);

  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 340;
  const horizontalPadding = isCompact ? 12 : Spacing.lg;
  const gridGap = isCompact ? 8 : 12;
  const numColumns = 3;
  const availableWidth = screenWidth - (horizontalPadding * 2) - (gridGap * (numColumns - 1));
  const itemWidth = Math.max(56, Math.floor(availableWidth / numColumns));
  const coverHeight = Math.floor(itemWidth * 1.48);

  const bookCountText = `${books.length} ${books.length === 1 ? 'Book' : 'Books'}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Screen Header with Book Count and Add Button */}
      <Header
        title="My Library"
        subtitle={bookCountText}
        rightAction={
          <View style={styles.headerRightActions}>
            <Pressable
              onPress={handleSortPress}
              accessibilityRole="button"
              accessibilityLabel="Sort books"
              style={({ pressed }) => [
                styles.headerSwapButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="swap-vertical" size={17} color="#CAD2E0" />
            </Pressable>
            <Pressable
              onPress={handleImportPress}
              disabled={isImporting}
              accessibilityRole="button"
              accessibilityLabel="Import new book"
              style={({ pressed }) => [
                styles.headerAddButton,
                pressed && styles.buttonPressed,
                isImporting && styles.buttonDisabled,
              ]}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color={Colors.midnight.darkest} />
              ) : (
                <Ionicons name="add" size={20} color={Colors.midnight.darkest} />
              )}
            </Pressable>
          </View>
        }
      />

      {/* Sticky Search & Filter Bar */}
      <View style={styles.stickyHeaderContainer}>
        <View style={[styles.stickyHeaderContent, { paddingHorizontal: horizontalPadding }]}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search in library..."
            style={styles.searchBar}
          />

          <FilterBar
            selectedFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            onSortPress={handleSortPress}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.gold.primary} />
            <Text style={styles.loadingText}>Loading your library...</Text>
          </View>
        )}

        {/* Case 1: Library is completely empty */}
        {!isLoading && books.length === 0 && (
          <>
            <Card variant="default" style={styles.emptyCard}>
              <EmptyState
                icon={
                  <Ionicons
                    name="library-outline"
                    size={34}
                    color={Colors.gold.primary}
                  />
                }
                title="Your Library is Empty"
                description="Import PDF, EPUB, or TXT books from your phone or tablet to start building your personal digital library."
                actionTitle={isImporting ? 'Importing...' : '+ Import Book'}
                onActionPress={handleImportPress}
              />
            </Card>

            {/* Supported File Formats Guide */}
            <View style={styles.guideSection}>
              <Text style={styles.guideTitle}>Supported File Formats</Text>

              <View style={styles.formatGrid}>
                <View style={styles.formatItem}>
                  <View style={styles.formatBadge}>
                    <Text style={styles.formatBadgeText}>PDF</Text>
                  </View>
                  <Text style={styles.formatLabel}>Standard Documents</Text>
                  <Text style={styles.formatDesc}>High fidelity pages, diagrams, and textbook layouts.</Text>
                </View>

                <View style={styles.formatItem}>
                  <View style={styles.formatBadge}>
                    <Text style={styles.formatBadgeText}>EPUB</Text>
                  </View>
                  <Text style={styles.formatLabel}>Reflowable E-Books</Text>
                  <Text style={styles.formatDesc}>Dynamic font scaling, custom margins, and warm themes.</Text>
                </View>

                <View style={styles.formatItem}>
                  <View style={styles.formatBadge}>
                    <Text style={styles.formatBadgeText}>TXT</Text>
                  </View>
                  <Text style={styles.formatLabel}>Plain Text Files</Text>
                  <Text style={styles.formatDesc}>Lightweight, distraction-free reading without clutter.</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Case 2: Books exist, but filter or search returned 0 */}
        {!isLoading && books.length > 0 && displayedBooks.length === 0 && (
          <Card variant="default" style={styles.emptyCard}>
            <EmptyState
              icon={
                <Ionicons
                  name="search-outline"
                  size={32}
                  color={Colors.text.tertiary}
                />
              }
              title="No Matching Books"
              description={`No ${activeFilter !== 'ALL' ? activeFilter + ' ' : ''}books match "${searchQuery}".`}
              actionTitle="Clear Filter"
              onActionPress={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
            />
          </Card>
        )}

        {/* Case 3: Real Book Records Grid (3 Columns) */}
        {!isLoading && displayedBooks.length > 0 && (
          <View style={[styles.booksGrid, { gap: gridGap }]}>
            {displayedBooks.map((book) => (
              <BookGridCard
                key={book.id}
                book={book}
                itemWidth={itemWidth}
                coverHeight={coverHeight}
                onPress={() =>
                  router.push({
                    pathname: '/reader/[id]',
                    params: { id: book.id },
                  })
                }
                onOptionsPress={() => setSelectedBook(book)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Book Action / Details Modal */}
      <BookActionModal
        visible={!!selectedBook}
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onRemove={async (id, deleteFile) => {
          await removeBook(id, deleteFile);
          setSelectedBook(null);
        }}
        onRename={async (id, newTitle) => {
          const success = await renameBook(id, newTitle);
          if (success) {
            setSelectedBook((prev) => (prev && prev.id === id ? { ...prev, title: newTitle } : null));
          }
          return success;
        }}
      />
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
    paddingTop: Spacing.xxs,
  },
  scrollContent: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl + 20,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSwapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  searchBar: {
    marginBottom: Spacing.xxs,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  emptyCard: {
    marginVertical: Spacing.md,
    padding: Spacing.none,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  guideSection: {
    marginTop: Spacing.md,
  },
  guideTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  formatGrid: {
    gap: Spacing.sm,
  },
  formatItem: {
    backgroundColor: Colors.midnight.surface,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  formatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    marginBottom: 6,
  },
  formatBadgeText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    letterSpacing: 0.5,
  },
  formatLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.text.primary,
  },
  formatDesc: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
