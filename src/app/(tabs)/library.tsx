import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { BookCard } from '@/components/library/BookCard';
import { BookActionModal } from '@/components/library/BookActionModal';
import { useLibrary } from '@/hooks/useLibrary';

export default function LibraryScreen() {
  const { books, isLoading, importBook, removeBook } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportPress = async () => {
    try {
      setIsImporting(true);
      const result = await importBook();

      if (result.success) {
        if (result.isDuplicate) {
          Alert.alert(
            'Already in Library',
            `"${result.book.title}" is already in your library.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Book Imported',
            `"${result.book.title}" (${result.book.format}) was successfully stored in your offline library.`,
            [{ text: 'View Book', onPress: () => setSelectedBook(result.book) }, { text: 'Done' }]
          );
        }
      } else if (!result.canceled && result.error) {
        Alert.alert('Import Failed', result.error, [{ text: 'OK' }]);
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

  const bookCountText =
    books.length === 1 ? '1 Book in local storage' : `${books.length} Books in local storage`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Screen Header with Book Count and Add Button */}
      <Header
        title="My Library"
        subtitle={bookCountText}
        rightAction={
          <Pressable
            onPress={handleImportPress}
            disabled={isImporting}
            accessibilityRole="button"
            accessibilityLabel="Import new book"
            style={({ pressed }) => [
              styles.addIconButton,
              pressed && styles.buttonPressed,
              isImporting && styles.buttonDisabled,
            ]}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color={Colors.midnight.darkest} />
            ) : (
              <Ionicons name="add" size={24} color={Colors.midnight.darkest} />
            )}
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search in library..."
          style={styles.searchBar}
        />

        {/* Filter Chips (All, PDF, EPUB, TXT) and Sort Button */}
        <FilterBar
          selectedFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          onSortPress={handleSortPress}
        />

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

        {/* Case 3: Real Book Records List */}
        {!isLoading && displayedBooks.length > 0 && (
          <View style={styles.booksList}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderText}>
                Showing {displayedBooks.length} of {books.length} {books.length === 1 ? 'book' : 'books'}
              </Text>
              <Text style={styles.sortIndicatorText}>
                Sorted by: {sortOption === 'recent' ? 'Recent' : sortOption === 'title' ? 'A-Z' : 'Size'}
              </Text>
            </View>

            {displayedBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onPress={() => setSelectedBook(book)}
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
      />
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
  addIconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
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
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
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
  booksList: {
    marginTop: Spacing.xs,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  listHeaderText: {
    ...Typography.caption,
    fontSize: FontSize.xxs,
    color: Colors.text.tertiary,
  },
  sortIndicatorText: {
    ...Typography.caption,
    fontSize: FontSize.xxs,
    color: Colors.gold.primary,
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
