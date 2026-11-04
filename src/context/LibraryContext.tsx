import React, { useCallback, useSyncExternalStore } from 'react';
import { Book, ImportResult } from '@/types';
import {
  fetchLibrary,
  importBookFromPicker,
  removeBookFromLibrary,
  renameBookInLibrary,
} from '@/services/libraryService';
import { extractBookCover, extractBookMetadataAndCover } from '@/services/coverExtractionService';
import { updateBookCover, updateBookAuthor } from '@/services/libraryDatabaseService';
import { formatAuthorName, getKnownAuthor } from '@/utils/fileUtils';

export interface LibraryContextType {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  importBook: () => Promise<ImportResult>;
  removeBook: (bookId: string, deleteFile?: boolean) => Promise<boolean>;
  renameBook: (bookId: string, newTitle: string) => Promise<boolean>;
}

interface LibraryStoreState {
  books: Book[];
  isLoading: boolean;
  error: string | null;
}

// Module-level reactive store that works independently of React Context nesting
let globalStoreState: LibraryStoreState = {
  books: [],
  isLoading: true,
  error: null,
};

const storeListeners = new Set<() => void>();

function notifyStore() {
  for (const listener of storeListeners) {
    try {
      listener();
    } catch {
      // ignore listener error
    }
  }
}

function subscribe(callback: () => void): () => void {
  storeListeners.add(callback);
  return () => {
    storeListeners.delete(callback);
  };
}

function getSnapshot(): LibraryStoreState {
  return globalStoreState;
}

/**
 * Update a book cover in the reactive in-memory store
 */
export function updateStoreBookCover(bookId: string, coverUri: string): void {
  const existing = globalStoreState.books.find((b) => b.id === bookId);
  if (!existing || existing.coverUri === coverUri) return;

  globalStoreState = {
    ...globalStoreState,
    books: globalStoreState.books.map((b) =>
      b.id === bookId ? { ...b, coverUri } : b
    ),
  };
  notifyStore();
}

/**
 * Update a book reading progress in the reactive in-memory store
 */
export function updateStoreBookProgress(
  bookId: string,
  currentPage: number,
  totalPages?: number,
  progressPercent?: number,
  lastLocationJson?: string
): void {
  const existing = globalStoreState.books.find((b) => b.id === bookId);
  if (!existing) return;

  const now = new Date().toISOString();
  const calculatedPercent =
    progressPercent !== undefined
      ? progressPercent
      : totalPages && totalPages > 0
      ? Math.min(100, Math.round((currentPage / totalPages) * 100))
      : existing.progressPercent;

  globalStoreState = {
    ...globalStoreState,
    books: globalStoreState.books.map((b) =>
      b.id === bookId
        ? {
            ...b,
            currentPage,
            totalPages: totalPages ?? b.totalPages,
            progressPercent: calculatedPercent,
            lastReadAt: now,
            ...(lastLocationJson !== undefined ? { lastLocationJson } : {}),
          }
        : b
    ),
  };
  notifyStore();
}

/**
 * Update a book author in the reactive in-memory store
 */
export function updateStoreBookAuthor(bookId: string, author: string): void {
  const existing = globalStoreState.books.find((b) => b.id === bookId);
  if (!existing || existing.author === author) return;

  globalStoreState = {
    ...globalStoreState,
    books: globalStoreState.books.map((b) =>
      b.id === bookId ? { ...b, author } : b
    ),
  };
  notifyStore();
}

/**
 * Update a book title in the reactive in-memory store
 */
export function updateStoreBookTitle(bookId: string, title: string): void {
  const existing = globalStoreState.books.find((b) => b.id === bookId);
  if (!existing || existing.title === title) return;

  globalStoreState = {
    ...globalStoreState,
    books: globalStoreState.books.map((b) =>
      b.id === bookId ? { ...b, title } : b
    ),
  };
  notifyStore();
}

/**
 * Add or prepend a newly imported or downloaded book to the reactive in-memory store
 */
export function addStoreBook(book: Book): void {
  const currentBooks = globalStoreState.books.filter((b) => b.id !== book.id);
  globalStoreState = {
    ...globalStoreState,
    books: [book, ...currentBooks],
    isLoading: false,
    error: null,
  };
  notifyStore();
}

let isBackfillingCovers = false;
async function backfillMissingCovers(books: Book[]): Promise<void> {
  if (isBackfillingCovers) return;
  const missing = books.filter((b) => !b.coverUri && (b.format === 'PDF' || b.format === 'EPUB'));
  if (missing.length === 0) return;

  isBackfillingCovers = true;
  try {
    for (const book of missing) {
      try {
        const cover = await extractBookCover(book.fileUri, book.format, book.id);
        if (cover) {
          await updateBookCover(book.id, cover);
          updateStoreBookCover(book.id, cover);
        }
      } catch {
        // continue to next book
      }
    }
  } finally {
    isBackfillingCovers = false;
  }
}

let isBackfillingAuthors = false;
async function backfillMissingAuthors(books: Book[]): Promise<void> {
  if (isBackfillingAuthors) return;
  const missing = books.filter((b) => {
    if (!b.author) return true;
    const formatted = formatAuthorName(b.author);
    return formatted === 'Unknown Author' || formatted !== b.author;
  });
  if (missing.length === 0) return;

  isBackfillingAuthors = true;
  try {
    for (const book of missing) {
      try {
        let resolvedAuthor: string | undefined = undefined;
        if (book.author && formatAuthorName(book.author) !== 'Unknown Author') {
          resolvedAuthor = formatAuthorName(book.author);
        } else {
          const meta = await extractBookMetadataAndCover(
            book.fileUri,
            book.format,
            book.id,
            undefined,
            book.title
          );
          resolvedAuthor = meta.author;
          if (!resolvedAuthor || resolvedAuthor === 'Unknown Author') {
            resolvedAuthor = getKnownAuthor(book.title);
          }
        }

        if (
          resolvedAuthor &&
          resolvedAuthor !== 'Unknown Author' &&
          resolvedAuthor !== book.author
        ) {
          await updateBookAuthor(book.id, resolvedAuthor);
          updateStoreBookAuthor(book.id, resolvedAuthor);
        }
      } catch {
        // continue to next book
      }
    }
  } finally {
    isBackfillingAuthors = false;
  }
}

/**
 * Fetch latest books from SQLite and notify all active screens
 */
export async function refreshLibraryStore(): Promise<void> {
  try {
    globalStoreState = { ...globalStoreState, error: null };
    notifyStore();

    const data = await fetchLibrary();
    globalStoreState = {
      books: data,
      isLoading: false,
      error: null,
    };
    notifyStore();

    // Automatically generate covers for any existing books missing a cover
    backfillMissingCovers(data).catch(() => {});
    // Automatically detect authors for any existing books with Unknown Author
    backfillMissingAuthors(data).catch(() => {});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load library';
    globalStoreState = {
      ...globalStoreState,
      isLoading: false,
      error: message,
    };
    notifyStore();
  }
}

// Kick off initial fetch on module load in client environments
if (typeof window !== 'undefined') {
  setTimeout(() => {
    refreshLibraryStore().catch(() => {});
  }, 50);
}

/**
 * Robust useLibrary hook powered by useSyncExternalStore for 100% compliance with React 19
 */
export function useLibrary(): LibraryContextType {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const handleImport = useCallback(async (): Promise<ImportResult> => {
    try {
      const result = await importBookFromPicker();
      if (result.success && result.book) {
        const importedBook = result.book;
        const currentBooks = globalStoreState.books.filter((b) => b.id !== importedBook.id);
        globalStoreState = {
          ...globalStoreState,
          books: [importedBook, ...currentBooks],
          isLoading: false,
          error: null,
        };
        notifyStore();
        await refreshLibraryStore();
      }
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed';
      return { success: false, error: message };
    }
  }, []);

  const handleRemove = useCallback(
    async (bookId: string, deleteFile = true): Promise<boolean> => {
      try {
        const success = await removeBookFromLibrary(bookId, deleteFile);
        if (success) {
          globalStoreState = {
            ...globalStoreState,
            books: globalStoreState.books.filter((b) => b.id !== bookId),
          };
          notifyStore();
        }
        return success;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to remove book';
        globalStoreState = { ...globalStoreState, error: message };
        notifyStore();
        return false;
      }
    },
    []
  );

  const handleRename = useCallback(
    async (bookId: string, newTitle: string): Promise<boolean> => {
      try {
        const cleanTitle = newTitle.trim();
        if (!cleanTitle) return false;
        const success = await renameBookInLibrary(bookId, cleanTitle);
        if (success) {
          updateStoreBookTitle(bookId, cleanTitle);
        }
        return success;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to rename book';
        globalStoreState = { ...globalStoreState, error: message };
        notifyStore();
        return false;
      }
    },
    []
  );

  return {
    books: state.books,
    isLoading: state.isLoading,
    error: state.error,
    refresh: refreshLibraryStore,
    importBook: handleImport,
    removeBook: handleRemove,
    renameBook: handleRename,
  };
}

/**
 * Backward compatibility wrapper for RootLayout
 */
export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
