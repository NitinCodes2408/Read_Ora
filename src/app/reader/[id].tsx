import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';
import {
  Book,
  Bookmark,
  UserPreferences,
  BookLocation,
  PdfLocation,
  EpubLocation,
  TxtLocation,
  Annotation,
  parseLocation,
  serializeLocation,
} from '@/types';
import {
  getBookById,
  updateReadingProgress,
  getBookmarks,
  addBookmark,
  deleteBookmark,
  getAnnotations,
  addAnnotation,
  deleteAnnotation,
  recordReadingSession,
} from '@/services/libraryDatabaseService';
import { updateStoreBookProgress } from '@/context/LibraryContext';
import { loadPreferences, savePreferences, DEFAULT_PREFERENCES } from '@/services/preferencesService';
import { loadTxtBook, ParsedTxt } from '@/services/txtService';
import { parseEpub, ParsedEpub } from '@/services/epubService';
import { CURATED_CLASSICS } from '@/data/curatedClassics';
import { downloadAndAddCuratedBook } from '@/services/curatedCatalogService';
import { ReaderHeader } from '@/components/reader/ReaderHeader';
import { ReaderFooter } from '@/components/reader/ReaderFooter';
import { ReaderControlsModal } from '@/components/reader/ReaderControlsModal';
import { ReaderTocModal, TocItem } from '@/components/reader/ReaderTocModal';
import { TxtReaderView } from '@/components/reader/TxtReaderView';
import { EpubReaderView } from '@/components/reader/EpubReaderView';
import { PdfReaderView } from '@/components/reader/PdfReaderView';

export default function ReaderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // State
  const [book, setBook] = useState<Book | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Reading Navigation State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // EPUB / TXT Specific Content
  const [epubData, setEpubData] = useState<ParsedEpub | null>(null);
  const [txtData, setTxtData] = useState<ParsedTxt | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);

  // Overlay & Modals
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // Session tracking timer, location references, and progress debounce
  const sessionStartRef = useRef<number>(0);
  const bookRef = useRef<Book | null>(null);
  const pageRef = useRef<number>(1);
  const totalRef = useRef<number>(1);
  const debounceTimerRef = useRef<any>(null);

  // Precision Location Tracking
  const locationRef = useRef<BookLocation | null>(null);
  const [initialScrollPercent, setInitialScrollPercent] = useState<number>(0);
  const [initialZoom, setInitialZoom] = useState<number>(1.0);
  const zoomRef = useRef<number>(1.0);
  const epubDataRef = useRef<ParsedEpub | null>(null);
  const txtDataRef = useRef<ParsedTxt | null>(null);
  const prefsRef = useRef<UserPreferences>(preferences);

  // Initialize session start timestamp
  useEffect(() => {
    sessionStartRef.current = Date.now();
  }, []);

  // Sync refs in effect
  useEffect(() => {
    bookRef.current = book;
    pageRef.current = currentPage;
    totalRef.current = totalPages;
    epubDataRef.current = epubData;
    txtDataRef.current = txtData;
    prefsRef.current = preferences;
  }, [book, currentPage, totalPages, epubData, txtData, preferences]);

  // Debounced progress saver
  const scheduleDebouncedProgressSave = useCallback(
    (curP: number, totP: number, percent: number, loc?: BookLocation) => {
      const currentBook = bookRef.current;
      if (!currentBook) return;

      if (loc) {
        locationRef.current = loc;
      }

      const activeLocationJson = locationRef.current
        ? serializeLocation(locationRef.current)
        : undefined;

      // Update in-memory reactive store immediately for instantaneous UI sync
      updateStoreBookProgress(currentBook.id, curP, totP, percent, activeLocationJson);

      // Debounce writes to SQLite and AsyncStorage
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        updateReadingProgress(currentBook.id, curP, totP, percent, activeLocationJson).catch(() => {});
      }, 500);
    },
    []
  );

  // Persist session minutes and reading progress immediately on unmount or exit
  const saveSessionAndProgress = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const currentBook = bookRef.current;
    if (!currentBook) return;

    const elapsedMs = Date.now() - sessionStartRef.current;
    const elapsedMinutes = Math.max(0.1, Number((elapsedMs / (1000 * 60)).toFixed(1)));
    const curP = pageRef.current;
    const totP = totalRef.current;
    const percent = totP > 0 ? Math.min(100, Math.round((curP / totP) * 100)) : 0;
    const activeLocationJson = locationRef.current
      ? serializeLocation(locationRef.current)
      : undefined;

    // Immediately flush progress and session to SQLite
    updateStoreBookProgress(currentBook.id, curP, totP, percent, activeLocationJson);
    recordReadingSession(currentBook.id, elapsedMinutes).catch(() => {});
    updateReadingProgress(currentBook.id, curP, totP, percent, activeLocationJson).catch(() => {});
  }, []);

  // Annotations CRUD Handlers (Phase C)
  const handleAddAnnotation = useCallback(
    async (ann: Omit<Annotation, 'id' | 'createdAt'>) => {
      try {
        const created = await addAnnotation(ann);
        setAnnotations((prev) => [...prev, created]);
      } catch (err) {
        console.warn('[Reader] Failed to add annotation:', err);
      }
    },
    []
  );

  const handleDeleteAnnotation = useCallback(
    async (annId: string) => {
      try {
        await deleteAnnotation(annId);
        setAnnotations((prev) => prev.filter((a) => a.id !== annId));
      } catch (err) {
        console.warn('[Reader] Failed to delete annotation:', err);
      }
    },
    []
  );

  // 1. Initial Load: Book metadata, user preferences, bookmarks, and annotations
  useEffect(() => {
    let isMounted = true;

    async function initializeReader() {
      if (!id) {
        setLoadError('No book specified.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);

        let [bookRecord, savedPrefs, savedBookmarks, savedAnnotations] = await Promise.all([
          getBookById(id),
          loadPreferences(),
          getBookmarks(id),
          getAnnotations(id),
        ]);

        if (!bookRecord) {
          const classic = CURATED_CLASSICS.find(
            (c) => c.id === id || id.includes(c.id.replace('curated_', ''))
          );
          if (classic) {
            bookRecord = await downloadAndAddCuratedBook(classic);
          }
        }

        if (!bookRecord) {
          throw new Error('Book not found in library.');
        }

        if (!isMounted) return;

        setBook(bookRecord);
        setPreferences(savedPrefs);
        setBookmarks(savedBookmarks);
        setAnnotations(savedAnnotations);

        // Parse saved precision location if available
        const savedLocation = parseLocation(bookRecord.lastLocationJson);
        locationRef.current = savedLocation;

        const initialPage = Math.max(1, bookRecord.currentPage || 1);
        const initialTotal = Math.max(1, bookRecord.totalPages || 1);
        setCurrentPage(initialPage);
        setTotalPages(initialTotal);
        setProgressPercent(bookRecord.progressPercent || 0);

        // 2. Parse book content according to format
        if (bookRecord.format === 'TXT') {
          const parsed = await loadTxtBook(bookRecord.fileUri, bookRecord.id);
          if (isMounted) {
            setTxtData(parsed);
            setTotalPages(parsed.totalPages);

            let targetPage = initialPage;
            if (savedLocation && savedLocation.format === 'TXT') {
              if (typeof savedLocation.pageIndex === 'number') {
                targetPage = Math.max(1, Math.min(parsed.totalPages, savedLocation.pageIndex + 1));
              } else if (typeof savedLocation.charOffset === 'number' && parsed.pageOffsets.length > 0) {
                let matchedIdx = 0;
                for (let i = 0; i < parsed.pageOffsets.length; i++) {
                  if (savedLocation.charOffset >= parsed.pageOffsets[i]) {
                    matchedIdx = i;
                  } else {
                    break;
                  }
                }
                targetPage = matchedIdx + 1;
              }
            }

            const validPage = Math.min(targetPage, parsed.totalPages);
            setCurrentPage(validPage);
            const pct = Math.round((validPage / parsed.totalPages) * 100);
            setProgressPercent(pct);

            const pageIdx = validPage - 1;
            const charOff = parsed.pageOffsets[pageIdx] ?? pageIdx * 1400;
            const txtLoc: TxtLocation = {
              format: 'TXT',
              pageIndex: pageIdx,
              charOffset: charOff,
              totalPages: parsed.totalPages,
              readingMode: savedPrefs.readingMode,
            };
            locationRef.current = txtLoc;
          }
        } else if (bookRecord.format === 'EPUB') {
          const parsed = await parseEpub(bookRecord.fileUri, bookRecord.id);
          if (isMounted) {
            setEpubData(parsed);
            setTotalPages(parsed.chapters.length);

            let validChapter = parsed.firstStoryChapterIndex;
            let initialScroll = 0;

            if (savedLocation && savedLocation.format === 'EPUB') {
              validChapter = Math.min(
                Math.max(0, savedLocation.chapterIndex),
                parsed.chapters.length - 1
              );
              initialScroll = Math.max(0, Math.min(100, savedLocation.scrollPercent || 0));
            } else {
              const hasStoryProgress =
                (bookRecord.currentPage ?? 0) > parsed.firstStoryChapterIndex;
              validChapter = hasStoryProgress
                ? Math.min(
                    Math.max(0, initialPage - 1),
                    parsed.chapters.length - 1
                  )
                : Math.min(parsed.firstStoryChapterIndex, parsed.chapters.length - 1);
            }

            setInitialScrollPercent(initialScroll);
            setCurrentChapterIndex(validChapter);
            setCurrentPage(validChapter + 1);

            const chapterBase = (validChapter / parsed.chapters.length) * 100;
            const chapterFraction = (initialScroll / 100) * (1 / parsed.chapters.length) * 100;
            const initialPercent = Math.min(100, Math.round(chapterBase + chapterFraction));
            setProgressPercent(initialPercent);

            const epubLoc: EpubLocation = {
              format: 'EPUB',
              chapterIndex: validChapter,
              scrollPercent: initialScroll,
              totalChapters: parsed.chapters.length,
              chapterHref: parsed.chapters[validChapter]?.href,
              chapterId: parsed.chapters[validChapter]?.id,
            };
            locationRef.current = epubLoc;
          }
        } else if (bookRecord.format === 'PDF') {
          if (savedLocation && savedLocation.format === 'PDF') {
            if (savedLocation.pageNumber) {
              setCurrentPage(savedLocation.pageNumber);
            }
            if (savedLocation.zoom) {
              setInitialZoom(savedLocation.zoom);
              zoomRef.current = savedLocation.zoom;
            }
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load book.';
          setLoadError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeReader();

    return () => {
      isMounted = false;
      // Record reading time and save progress on unmount
      saveSessionAndProgress();
    };
  }, [id, saveSessionAndProgress]);

  // Safe navigation back handler (handles direct URL/refreshed page with empty stack)
  const handleSafeBack = useCallback(() => {
    saveSessionAndProgress();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/library');
    }
  }, [router, saveSessionAndProgress]);

  // Android hardware back handler
  useEffect(() => {
    const onBackPress = () => {
      handleSafeBack();
      return true;
    };

    const handler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => handler.remove();
  }, [handleSafeBack]);

  // Handle Page Change
  const handlePageChange = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(totalPages, newPage));
      setCurrentPage(validPage);

      const calculatedPercent =
        totalPages > 0 ? Math.min(100, Math.round((validPage / totalPages) * 100)) : 0;
      setProgressPercent(calculatedPercent);

      let newLoc: BookLocation | undefined = undefined;

      if (book?.format === 'EPUB') {
        const chapIdx = validPage - 1;
        setCurrentChapterIndex(chapIdx);
        setInitialScrollPercent(0);
        newLoc = {
          format: 'EPUB',
          chapterIndex: chapIdx,
          scrollPercent: 0,
          totalChapters: totalPages,
          chapterHref: epubDataRef.current?.chapters[chapIdx]?.href,
          chapterId: epubDataRef.current?.chapters[chapIdx]?.id,
        };
      } else if (book?.format === 'TXT') {
        const pageIdx = validPage - 1;
        const charOff = txtDataRef.current?.pageOffsets?.[pageIdx] ?? pageIdx * 1400;
        newLoc = {
          format: 'TXT',
          pageIndex: pageIdx,
          charOffset: charOff,
          totalPages,
          readingMode: prefsRef.current.readingMode,
        };
      } else if (book?.format === 'PDF') {
        newLoc = {
          format: 'PDF',
          pageNumber: validPage,
          totalPages,
          zoom: zoomRef.current,
        };
      }

      scheduleDebouncedProgressSave(validPage, totalPages, calculatedPercent, newLoc);
    },
    [totalPages, book, scheduleDebouncedProgressSave]
  );

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    if (!book) return;

    const existing = bookmarks.find((b) => b.page === currentPage);
    if (existing) {
      await deleteBookmark(existing.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
    } else {
      let snippet = `Page ${currentPage}`;
      if (book.format === 'EPUB' && epubData?.chapters[currentChapterIndex]) {
        snippet = epubData.chapters[currentChapterIndex].title;
      }
      const newBm = await addBookmark(book.id, currentPage, snippet);
      setBookmarks((prev) => [...prev, newBm]);
    }
  };

  // Update Reading Preferences
  const handleUpdatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const updated = await savePreferences(updates);
      setPreferences(updated);
    } catch {
      // ignore
    }
  };

  // Build TOC Items for modal
  const tocItems: TocItem[] = React.useMemo(() => {
    if (book?.format === 'EPUB' && epubData) {
      return epubData.chapters.map((ch, idx) => ({
        title: ch.title,
        pageIndex: idx,
        isFrontMatter: ch.isFrontMatter,
      }));
    }
    if (book?.format === 'TXT' && txtData) {
      return txtData.sections;
    }
    // PDF: generate intervals
    const items: TocItem[] = [];
    const step = Math.max(1, Math.floor(totalPages / 10));
    for (let p = 0; p < totalPages; p += step) {
      items.push({
        title: `Page ${p + 1}`,
        pageIndex: p,
      });
    }
    return items;
  }, [book, epubData, txtData, totalPages]);

  // Determine active theme colors for root screen
  const isMidnight = preferences.themeMode === 'midnight';
  const isSepia = preferences.themeMode === 'sepia';
  const rootBgColor = isMidnight
    ? Colors.midnight.background
    : isSepia
    ? '#EFE7D3'
    : '#FAF6EE';

  const isBookmarked = bookmarks.some((b) => b.page === currentPage);

  if (isLoading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: Colors.midnight.background }]}>
        <ActivityIndicator size="large" color={Colors.gold.primary} />
        <Text style={styles.loadingScreenText}>Opening book...</Text>
      </View>
    );
  }

  if (loadError || !book) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: Colors.midnight.background }]}>
        <Text style={styles.errorScreenTitle}>Unable to Open Book</Text>
        <Text style={styles.errorScreenMessage}>{loadError || 'Book record not found.'}</Text>
        <Pressable
          style={styles.errorBackBtn}
          onPress={handleSafeBack}
        >
          <Text style={styles.errorBackText}>Return to Library</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.rootContainer, { backgroundColor: rootBgColor }]}>
      <StatusBar style={isMidnight ? 'light' : 'dark'} />

      {/* Top Header Overlay */}
      {overlayVisible && (
        <ReaderHeader
          title={book.title}
          subtitle={
            book.format === 'EPUB' && epubData?.chapters[currentChapterIndex]
              ? epubData.chapters[currentChapterIndex].title
              : book.format === 'TXT' && txtData?.sections
              ? txtData.sections.find((s) => s.pageIndex <= currentPage - 1)?.title
              : book.format === 'PDF' && totalPages > 1
              ? `Page ${currentPage} of ${totalPages}`
              : undefined
          }
          themeMode={preferences.themeMode}
          isBookmarked={isBookmarked}
          onBack={handleSafeBack}
          onToggleBookmark={handleToggleBookmark}
          onOpenControls={() => setIsControlsOpen(true)}
          onOpenToc={() => setIsTocOpen(true)}
        />
      )}

      {/* Reader Content Body */}
      <View style={styles.readerArea}>
        {book.format === 'TXT' && txtData && (
          <TxtReaderView
            bookId={book.id}
            pages={txtData.pages}
            currentPage={currentPage}
            preferences={preferences}
            annotations={annotations}
            pageOffsets={txtData.pageOffsets}
            onPageChange={handlePageChange}
            onToggleOverlay={() => setOverlayVisible((prev) => !prev)}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
          />
        )}

        {book.format === 'EPUB' && epubData && (
          <EpubReaderView
            bookId={book.id}
            chapters={epubData.chapters}
            currentChapterIndex={currentChapterIndex}
            preferences={preferences}
            annotations={annotations}
            firstStoryChapterIndex={epubData.firstStoryChapterIndex}
            initialScrollPercent={initialScrollPercent}
            onPrevChapter={() => handlePageChange(currentPage - 1)}
            onNextChapter={() => handlePageChange(currentPage + 1)}
            onJumpToChapter={(idx) => handlePageChange(idx + 1)}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onToggleOverlay={() => setOverlayVisible((prev) => !prev)}
            onScrollProgress={(percent) => {
              // Smooth progress update for chapter
              const chapterBase = (currentChapterIndex / totalPages) * 100;
              const chapterFraction = (percent / 100) * (1 / totalPages) * 100;
              const smoothPercent = Math.min(100, Math.round(chapterBase + chapterFraction));
              setProgressPercent(smoothPercent);

              const epubLoc: EpubLocation = {
                format: 'EPUB',
                chapterIndex: currentChapterIndex,
                scrollPercent: percent,
                totalChapters: totalPages,
                chapterHref: epubData.chapters[currentChapterIndex]?.href,
                chapterId: epubData.chapters[currentChapterIndex]?.id,
              };
              scheduleDebouncedProgressSave(currentPage, totalPages, smoothPercent, epubLoc);
            }}
          />
        )}

        {book.format === 'PDF' && (
          <PdfReaderView
            bookId={book.id}
            fileUri={book.fileUri}
            currentPage={currentPage}
            initialZoom={initialZoom}
            preferences={preferences}
            annotations={annotations}
            onTotalPagesDetected={(total) => {
              setTotalPages(total);
              const calculated = Math.min(100, Math.round((currentPage / total) * 100));
              setProgressPercent(calculated);
              const pdfLoc: PdfLocation = {
                format: 'PDF',
                pageNumber: currentPage,
                totalPages: total,
                zoom: zoomRef.current,
              };
              scheduleDebouncedProgressSave(currentPage, total, calculated, pdfLoc);
            }}
            onPageChange={handlePageChange}
            onZoomChange={(newZoom) => {
              zoomRef.current = newZoom;
              const pdfLoc: PdfLocation = {
                format: 'PDF',
                pageNumber: currentPage,
                totalPages,
                zoom: newZoom,
              };
              scheduleDebouncedProgressSave(currentPage, totalPages, progressPercent, pdfLoc);
            }}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onToggleOverlay={() => setOverlayVisible((prev) => !prev)}
            onBack={handleSafeBack}
          />
        )}
      </View>

      {/* Bottom Footer Overlay */}
      {overlayVisible && (
        <ReaderFooter
          currentPage={currentPage}
          totalPages={totalPages}
          progressPercent={progressPercent}
          themeMode={preferences.themeMode}
          isChapterBased={book.format === 'EPUB'}
          onPrevPage={() => handlePageChange(currentPage - 1)}
          onNextPage={() => handlePageChange(currentPage + 1)}
        />
      )}

      {/* Reading Controls Modal */}
      <ReaderControlsModal
        visible={isControlsOpen}
        preferences={preferences}
        format={book.format}
        onClose={() => setIsControlsOpen(false)}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {/* Table of Contents, Bookmarks & Highlights Modal */}
      <ReaderTocModal
        visible={isTocOpen}
        bookTitle={book.title}
        tocItems={tocItems}
        currentPage={currentPage}
        bookmarks={bookmarks}
        annotations={annotations}
        onClose={() => setIsTocOpen(false)}
        onSelectPage={handlePageChange}
        onDeleteBookmark={async (bmId) => {
          await deleteBookmark(bmId);
          setBookmarks((prev) => prev.filter((b) => b.id !== bmId));
        }}
        onDeleteAnnotation={handleDeleteAnnotation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  readerArea: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingScreenText: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
  },
  errorScreenTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.status.error,
    marginBottom: Spacing.xs,
  },
  errorScreenMessage: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  errorBackBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.midnight.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.gold.primary,
  },
  errorBackText: {
    color: Colors.gold.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
});
