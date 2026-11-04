import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight, Typography } from '@/constants/typography';
import { Header } from '@/components/common/Header';
import { SearchInput } from '@/components/common/SearchInput';
import { Badge } from '@/components/common/Badge';
import { useLibrary } from '@/context/LibraryContext';
import { CURATED_CLASSICS } from '@/data/curatedClassics';
import { CuratedBook, Book } from '@/types';
import {
  isCuratedBookInLibrary,
  downloadAndAddCuratedBook,
} from '@/services/curatedCatalogService';
import { searchGlobalBooks } from '@/services/onlineCatalogService';
import { CuratedBookCard, CuratedBookModal, BookCarouselShelf } from '@/components/discover';

const CATEGORIES = [
  'All',
  'Indian Heritage',
  'Philosophy',
  'Classics',
  'Fiction',
  'Science',
  'History',
  'Poetry',
];

interface AvailabilityFilterItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const AVAILABILITY_FILTERS: AvailabilityFilterItem[] = [
  { id: 'all', label: 'All Access', icon: 'layers-outline', color: Colors.gold.primary },
  { id: 'free_full', label: 'Free to Read', icon: 'shield-checkmark', color: '#22C55E' },
  { id: 'preview', label: 'Previews', icon: 'eye', color: '#F59E0B' },
  { id: 'borrow', label: 'Borrowable', icon: 'library', color: '#38BDF8' },
];

const LANGUAGE_FILTERS = [
  { id: 'all', label: 'All Languages' },
  { id: 'en', label: 'English' },
  { id: 'mr', label: 'मराठी' },
  { id: 'hi', label: 'हिंदी' },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { books: libraryBooks } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [recentlyAddedBook, setRecentlyAddedBook] = useState<Book | null>(null);
  const [selectedModalBook, setSelectedModalBook] = useState<CuratedBook | null>(null);

  // Live online search state for 70,000+ books
  const [onlineBooks, setOnlineBooks] = useState<CuratedBook[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Instant local filtering
  const localFilteredBooks = useMemo(() => {
    let list = CURATED_CLASSICS;

    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Indian Heritage') {
        list = list.filter(
          (b) =>
            b.collection === 'Indian Heritage' ||
            b.language === 'Marathi' ||
            b.language === 'Hindi'
        );
      } else {
        list = list.filter((b) => b.category === selectedCategory);
      }
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          (b.language && b.language.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedCategory, searchQuery]);

  // Debounced live global search across 70,000+ books
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    let isMounted = true;

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const results = await searchGlobalBooks(trimmed, selectedCategory);
        if (isMounted) {
          setOnlineBooks(results);
        }
      } catch {
        // Fallback to local
      } finally {
        if (isMounted) {
          setIsSearchingOnline(false);
        }
      }
    }, 450);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory]);

  // Combined source list
  const rawBooks = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      if (onlineBooks.length > 0) return onlineBooks;
      return localFilteredBooks;
    }
    return localFilteredBooks;
  }, [searchQuery, onlineBooks, localFilteredBooks]);

  // Phase 3: Filter by Availability Tier and Language
  const displayBooks = useMemo(() => {
    return rawBooks.filter((b) => {
      // 1. Availability filter
      if (selectedAvailability !== 'all') {
        const tier = b.availability?.tier || (b.provider === 'curated' ? 'free_full' : undefined);
        if (tier !== selectedAvailability) return false;
      }

      // 2. Language filter
      if (selectedLanguage !== 'all') {
        const lang = (b.language || 'English').toLowerCase();
        if (selectedLanguage === 'mr' && !lang.includes('marathi')) return false;
        if (selectedLanguage === 'hi' && !lang.includes('hindi')) return false;
        if (selectedLanguage === 'en' && !lang.includes('english')) return false;
      }

      return true;
    });
  }, [rawBooks, selectedAvailability, selectedLanguage]);

  // Thematic Shelves for Discover home view
  const indianHeritageBooks = useMemo(() => {
    return CURATED_CLASSICS.filter(
      (b) =>
        b.collection === 'Indian Heritage' ||
        b.language === 'Marathi' ||
        b.language === 'Hindi'
    );
  }, []);

  const philosophyBooks = useMemo(() => {
    return CURATED_CLASSICS.filter((b) => b.category === 'Philosophy');
  }, []);

  const mysteryBooks = useMemo(() => {
    return CURATED_CLASSICS.filter(
      (b) =>
        b.collection === 'Gothic & Mystery' ||
        b.category === 'Science' ||
        b.id.includes('sherlock') ||
        b.id.includes('frankenstein') ||
        b.id.includes('dracula')
    );
  }, []);

  const worldClassicsBooks = useMemo(() => {
    return CURATED_CLASSICS.filter(
      (b) =>
        b.collection === 'Trending' ||
        b.category === 'Classics' ||
        b.id.includes('pride') ||
        b.id.includes('great_gatsby') ||
        b.id.includes('dorian')
    );
  }, []);

  // Determine if in default exploration mode
  const isBrowsingAll = useMemo(() => {
    return (
      !searchQuery.trim() &&
      selectedCategory === 'All' &&
      selectedAvailability === 'all' &&
      selectedLanguage === 'all'
    );
  }, [searchQuery, selectedCategory, selectedAvailability, selectedLanguage]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedAvailability('all');
    setSelectedLanguage('all');
    setOnlineBooks([]);
  }, []);

  // Featured book of the day (The Art of War)
  const featuredBook = useMemo(() => {
    return CURATED_CLASSICS.find((b) => b.id === 'curated_art_of_war') || CURATED_CLASSICS[0];
  }, []);

  const featuredLibraryBook = useMemo(() => {
    return isCuratedBookInLibrary(featuredBook, libraryBooks);
  }, [featuredBook, libraryBooks]);

  // Download and add to library handler with progress and toast notification
  const handleAddBook = useCallback(
    async (book: CuratedBook) => {
      if (downloadingBookId) return;

      if (book.availability && book.availability.canAddToLibrary === false) {
        setSelectedModalBook(book);
        return;
      }

      setDownloadingBookId(book.id);
      setDownloadProgress(15);

      try {
        const newBook = await downloadAndAddCuratedBook(book, (percent) => {
          setDownloadProgress(percent);
        });

        // Trigger floating success notification with direct "Read Now" action
        setRecentlyAddedBook(newBook);

        // Auto dismiss after 6 seconds
        setTimeout(() => {
          setRecentlyAddedBook((curr: Book | null) => (curr?.id === newBook.id ? null : curr));
        }, 6000);
      } catch (err) {
        console.warn('[Discover] Failed to add curated book:', err);
      } finally {
        setDownloadingBookId(null);
        setDownloadProgress(0);
      }
    },
    [downloadingBookId]
  );

  // Open book directly in the reader
  const handleOpenBook = useCallback(
    (curatedBook: CuratedBook) => {
      const existing = isCuratedBookInLibrary(curatedBook, libraryBooks);
      if (existing) {
        router.push(`/reader/${existing.id}` as any);
      } else {
        // Direct read: Reader screen automatically downloads and initializes the curated book on the fly!
        router.push(`/reader/${curatedBook.id}` as any);
      }
    },
    [libraryBooks, router]
  );

  // Modal library book status
  const modalLibraryBook = useMemo(() => {
    if (!selectedModalBook) return undefined;
    return isCuratedBookInLibrary(selectedModalBook, libraryBooks);
  }, [selectedModalBook, libraryBooks]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        title="Discover"
        subtitle="Search 70,000+ public-domain books & timeless classics"
      />

      {/* Sticky Search Bar and Dual Filter Rows */}
      <View style={styles.stickyHeaderContainer}>
        <View style={styles.stickyHeaderContent}>
          <SearchInput
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim()) {
                setIsSearchingOnline(true);
              } else {
                setOnlineBooks([]);
                setIsSearchingOnline(false);
              }
            }}
            onClear={() => {
              setSearchQuery('');
              setOnlineBooks([]);
              setIsSearchingOnline(false);
            }}
            placeholder="Search any book or author (e.g. Premchand, Austen)..."
            style={styles.searchBar}
          />

          {/* Live Searching Indicator */}
          {isSearchingOnline && (
            <View style={styles.searchingRow}>
              <ActivityIndicator size="small" color={Colors.gold.primary} />
              <Text style={styles.searchingText}>Searching worldwide catalog & archives...</Text>
            </View>
          )}

          {/* Row 1: Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                label={cat}
                selected={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
              />
            ))}
          </ScrollView>

          {/* Row 2: Phase 3 Availability & Language Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.secondaryFilterScroll}
          >
            {/* Availability Filter Chips */}
            {AVAILABILITY_FILTERS.map((f) => {
              const isSelected = selectedAvailability === f.id;
              return (
                <Pressable
                  key={f.id}
                  style={[
                    styles.smartPill,
                    isSelected && {
                      backgroundColor: f.color + '22',
                      borderColor: f.color,
                    },
                  ]}
                  onPress={() => setSelectedAvailability(f.id)}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={f.icon}
                    size={11}
                    color={isSelected ? f.color : Colors.text.tertiary}
                  />
                  <Text
                    style={[
                      styles.smartPillText,
                      isSelected && { color: f.color, fontWeight: FontWeight.bold },
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}

            <View style={styles.filterDivider} />

            {/* Language Filter Chips */}
            {LANGUAGE_FILTERS.map((l) => {
              const isSelected = selectedLanguage === l.id;
              return (
                <Pressable
                  key={l.id}
                  style={[
                    styles.langPill,
                    isSelected && styles.langPillSelected,
                  ]}
                  onPress={() => setSelectedLanguage(l.id)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.langPillText,
                      isSelected && styles.langPillTextSelected,
                    ]}
                  >
                    {l.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Filter Bar (when filters are active) */}
        {!isBrowsingAll && (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterLabel}>
              Active Filters: {selectedCategory !== 'All' ? `${selectedCategory} • ` : ''}
              {selectedAvailability !== 'all' ? `${selectedAvailability.replace('_', ' ')} • ` : ''}
              {selectedLanguage !== 'all' ? `${selectedLanguage.toUpperCase()}` : ''}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.resetBtn, pressed && styles.btnPressed]}
              onPress={handleResetFilters}
              accessibilityRole="button"
              accessibilityLabel="Reset all filters"
            >
              <Ionicons name="close-circle-outline" size={13} color={Colors.gold.primary} />
              <Text style={styles.resetBtnText}>Reset</Text>
            </Pressable>
          </View>
        )}

        {/* Phase 3: Thematic Browsing Shelves (Only shown in default All view) */}
        {isBrowsingAll && (
          <>
            {/* Featured Hero Banner */}
            <View style={styles.featuredContainer}>
              <View style={styles.featuredHeader}>
                <Ionicons name="sparkles" size={14} color={Colors.gold.primary} />
                <Text style={styles.featuredHeading}>Featured Classic of the Day</Text>
              </View>

              <View style={styles.featuredCard}>
                {/* Cover art */}
                <Pressable
                  onPress={() => setSelectedModalBook(featuredBook)}
                  accessibilityLabel={`Cover: ${featuredBook.title}`}
                >
                  <Image
                    source={{ uri: featuredBook.coverUrl }}
                    style={styles.featuredCover}
                    resizeMode="cover"
                  />
                </Pressable>

                {/* Text & Button content column */}
                <View style={styles.featuredContent}>
                  <Pressable
                    onPress={() => setSelectedModalBook(featuredBook)}
                    accessibilityLabel={`Details: ${featuredBook.title}`}
                  >
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>{featuredBook.badge}</Text>
                    </View>

                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {featuredBook.title}
                    </Text>
                    <Text style={styles.featuredAuthor}>by {featuredBook.author}</Text>
                    <Text style={styles.featuredDesc} numberOfLines={3}>
                      {featuredBook.description}
                    </Text>
                  </Pressable>

                  <View style={styles.featuredAction}>
                    {downloadingBookId === featuredBook.id ? (
                      <View style={styles.featuredDownloading}>
                        <ActivityIndicator size="small" color={Colors.gold.primary} />
                        <Text style={styles.featuredDownloadingText}>
                          {downloadProgress > 0 ? `Adding (${downloadProgress}%)...` : 'Adding to Library...'}
                        </Text>
                      </View>
                    ) : featuredLibraryBook ? (
                      <Pressable
                        style={({ pressed }) => [styles.featuredReadBtn, pressed && styles.btnPressed]}
                        onPress={() => handleOpenBook(featuredBook)}
                        accessibilityRole="button"
                        accessibilityLabel="Read Featured Book"
                      >
                        <Ionicons name="book" size={14} color="#000000" />
                        <Text style={styles.featuredReadText}>Read Now</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [styles.featuredAddBtn, pressed && styles.btnPressed]}
                        onPress={() => handleAddBook(featuredBook)}
                        accessibilityRole="button"
                        accessibilityLabel="Add Featured Book"
                      >
                        <Ionicons name="download-outline" size={14} color="#000000" />
                        <Text style={styles.featuredAddText}>+ Add to Library</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Shelf 1: Indian & Regional Heritage */}
            <BookCarouselShelf
              title="Indian & Regional Heritage"
              subtitle="Timeless Marathi, Hindi & Sanskrit masterworks"
              iconName="library"
              badgeLabel="Regional Classics"
              books={indianHeritageBooks}
              libraryBooks={libraryBooks}
              downloadingBookId={downloadingBookId}
              downloadProgress={downloadProgress}
              onBookPress={setSelectedModalBook}
              onAddPress={handleAddBook}
              onOpenPress={handleOpenBook}
            />

            {/* Shelf 2: Philosophy & Stoic Wisdom */}
            <BookCarouselShelf
              title="Philosophy & Stoic Wisdom"
              subtitle="Reflections on life, virtue, duty & strategy"
              iconName="compass"
              badgeLabel="Wisdom"
              books={philosophyBooks}
              libraryBooks={libraryBooks}
              downloadingBookId={downloadingBookId}
              downloadProgress={downloadProgress}
              onBookPress={setSelectedModalBook}
              onAddPress={handleAddBook}
              onOpenPress={handleOpenBook}
            />

            {/* Shelf 3: Gothic Mystery & Classic Sci-Fi */}
            <BookCarouselShelf
              title="Gothic Mystery & Sci-Fi"
              subtitle="Intrigue, suspense, and visionary sci-fi"
              iconName="moon"
              badgeLabel="Mystery"
              books={mysteryBooks}
              libraryBooks={libraryBooks}
              downloadingBookId={downloadingBookId}
              downloadProgress={downloadProgress}
              onBookPress={setSelectedModalBook}
              onAddPress={handleAddBook}
              onOpenPress={handleOpenBook}
            />

            {/* Shelf 4: World Masterpieces */}
            <BookCarouselShelf
              title="World Masterpieces"
              subtitle="Celebrated literary achievements across centuries"
              iconName="sparkles"
              badgeLabel="Classics"
              books={worldClassicsBooks}
              libraryBooks={libraryBooks}
              downloadingBookId={downloadingBookId}
              downloadProgress={downloadProgress}
              onBookPress={setSelectedModalBook}
              onAddPress={handleAddBook}
              onOpenPress={handleOpenBook}
            />
          </>
        )}

        {/* Section Title */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim()
              ? `Results for "${searchQuery.trim()}"`
              : !isBrowsingAll
              ? `${selectedCategory !== 'All' ? selectedCategory : 'Filtered'} Books`
              : 'All Curated Editions'}
          </Text>
          <Text style={styles.sectionCount}>
            {displayBooks.length} {displayBooks.length === 1 ? 'book' : 'books'}
          </Text>
        </View>

        {/* Grid of Books */}
        {displayBooks.length === 0 ? (
          <View style={styles.emptyResults}>
            {isSearchingOnline ? (
              <>
                <ActivityIndicator size="large" color={Colors.gold.primary} />
                <Text style={styles.emptyResultsText}>
                  Searching worldwide archives for &quot;{searchQuery}&quot;...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="search-outline" size={32} color={Colors.text.tertiary} />
                <Text style={styles.emptyResultsText}>
                  No books found matching the selected filters.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.resetFiltersBtn, pressed && styles.btnPressed]}
                  onPress={handleResetFilters}
                >
                  <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <View style={styles.booksGrid}>
            {displayBooks.map((curated) => {
              const libBook = isCuratedBookInLibrary(curated, libraryBooks);
              const isDownloading = downloadingBookId === curated.id;

              return (
                <View key={curated.id} style={styles.gridColumn}>
                  <CuratedBookCard
                    curatedBook={curated}
                    libraryBook={libBook}
                    isDownloading={isDownloading}
                    downloadProgress={isDownloading ? downloadProgress : 0}
                    onPress={() => setSelectedModalBook(curated)}
                    onAddPress={() => handleAddBook(curated)}
                    onOpenPress={() => handleOpenBook(curated)}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Legal & Open Source Literature Commitment */}
        <View style={styles.commitmentCard}>
          <View style={styles.commitmentHeader}>
            <View style={styles.checkIcon}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.gold.primary} />
            </View>
            <View style={styles.commitmentHeaderText}>
              <Text style={styles.commitmentTitle}>Transparent Book Availability</Text>
              <Text style={styles.commitmentSubtitle}>Verified legal access & open literature</Text>
            </View>
          </View>
          <Text style={styles.commitmentText}>
            ReadOra strictly classifies book availability into 5 transparent tiers: Free Full-Text classics (Project Gutenberg / Open Access), Authorized Previews (Google Books), Digital Lending (Open Library), Commercial editions, and Bibliographic records.
          </Text>

          <View style={styles.sourcesList}>
            <View style={styles.sourceItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.status.success} />
              <Text style={styles.sourceText}>100% offline access for Public Domain & Open Access</Text>
            </View>
            <View style={styles.sourceItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.status.success} />
              <Text style={styles.sourceText}>Authorized publisher previews & sample chapters</Text>
            </View>
            <View style={styles.sourceItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.status.success} />
              <Text style={styles.sourceText}>Zero piracy or fabricated full-text downloads</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Details Modal */}
      <CuratedBookModal
        visible={!!selectedModalBook}
        curatedBook={selectedModalBook}
        libraryBook={modalLibraryBook}
        isDownloading={downloadingBookId === selectedModalBook?.id}
        downloadProgress={downloadProgress}
        onClose={() => setSelectedModalBook(null)}
        onAddPress={() => {
          if (selectedModalBook) handleAddBook(selectedModalBook);
        }}
        onOpenPress={() => {
          if (selectedModalBook) {
            handleOpenBook(selectedModalBook);
            setSelectedModalBook(null);
          }
        }}
      />

      {/* Floating Gold Success Toast with instant Read Now action */}
      {recentlyAddedBook && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          <View style={styles.toastCard}>
            <View style={styles.toastIconCircle}>
              <Ionicons name="checkmark-done" size={20} color="#000000" />
            </View>
            <View style={styles.toastTextColumn}>
              <Text style={styles.toastTitle} numberOfLines={1}>
                Added to Offline Library!
              </Text>
              <Text style={styles.toastSubtitle} numberOfLines={1}>
                &quot;{recentlyAddedBook.title}&quot; is ready to read
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.toastReadBtn, pressed && styles.btnPressed]}
              onPress={() => {
                const bookToOpen = recentlyAddedBook;
                setRecentlyAddedBook(null);
                router.push(`/reader/${bookToOpen.id}` as any);
              }}
              accessibilityRole="button"
              accessibilityLabel="Read Now"
            >
              <Ionicons name="book" size={13} color="#000000" />
              <Text style={styles.toastReadBtnText}>Read Now</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.toastCloseBtn, pressed && styles.btnPressed]}
              onPress={() => setRecentlyAddedBook(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
            >
              <Ionicons name="close" size={16} color={Colors.text.tertiary} />
            </Pressable>
          </View>
        </View>
      )}
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
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    paddingTop: Spacing.xxs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl + 20,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  searchBar: {
    marginBottom: Spacing.xs,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  searchingText: {
    fontSize: 11,
    color: Colors.gold.primary,
    fontWeight: FontWeight.medium,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingBottom: 6,
    paddingTop: 2,
  },
  secondaryFilterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
  },
  smartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  smartPillText: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  filterDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.midnight.border,
    marginHorizontal: 2,
  },
  langPill: {
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  langPillSelected: {
    backgroundColor: Colors.gold.glow,
    borderColor: Colors.gold.border,
  },
  langPillText: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  langPillTextSelected: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginBottom: Spacing.md,
  },
  activeFilterLabel: {
    fontSize: 11,
    color: Colors.gold.primary,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.midnight.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resetBtnText: {
    fontSize: 10,
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
  },
  featuredContainer: {
    marginBottom: Spacing.lg,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  featuredHeading: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featuredCard: {
    flexDirection: 'row',
    backgroundColor: Colors.midnight.surface,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  featuredCover: {
    width: 90,
    aspectRatio: 2 / 3,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.midnight.surfaceElevated,
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(229, 186, 88, 0.15)',
    borderWidth: 1,
    borderColor: Colors.gold.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  featuredAuthor: {
    ...Typography.bodySecondary,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  featuredDesc: {
    ...Typography.bodySecondary,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  featuredAction: {
    marginTop: Spacing.xs,
  },
  featuredAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gold.primary,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  featuredReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gold.primary,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  btnPressed: {
    opacity: 0.8,
  },
  featuredAddText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  featuredReadText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  featuredDownloading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.midnight.surfaceElevated,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignSelf: 'flex-start',
  },
  featuredDownloadingText: {
    fontSize: 10,
    color: Colors.gold.primary,
    fontWeight: FontWeight.medium,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  sectionCount: {
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: FontWeight.medium,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  gridColumn: {
    width: '50%',
    paddingHorizontal: Spacing.xs,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyResultsText: {
    fontSize: FontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  resetFiltersBtn: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    borderRadius: BorderRadius.sm,
  },
  resetFiltersBtnText: {
    fontSize: 12,
    fontWeight: FontWeight.semiBold,
    color: Colors.gold.primary,
  },
  commitmentCard: {
    backgroundColor: Colors.midnight.surface,
    borderWidth: 1,
    borderColor: Colors.midnight.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  commitmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gold.glow,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitmentHeaderText: {
    flex: 1,
  },
  commitmentTitle: {
    ...Typography.headline,
    fontSize: FontSize.sm + 1,
    color: Colors.text.primary,
  },
  commitmentSubtitle: {
    fontSize: 10,
    color: Colors.gold.primary,
    fontWeight: FontWeight.medium,
  },
  commitmentText: {
    ...Typography.bodySecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginVertical: Spacing.sm,
  },
  sourcesList: {
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderColor: Colors.midnight.border,
    paddingTop: Spacing.sm,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 85,
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastCard: {
    maxWidth: 540,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#131924',
    borderWidth: 1.5,
    borderColor: Colors.gold.primary,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.gold.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  toastIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTextColumn: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  toastTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  toastSubtitle: {
    fontSize: FontSize.xs - 1,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  toastReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.gold.primary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  toastReadBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#000000',
  },
  toastCloseBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
