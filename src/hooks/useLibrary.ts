import { useState, useEffect, useCallback } from 'react';
import { Book, ImportResult } from '@/types';
import {
  fetchLibrary,
  importBookFromPicker,
  removeBookFromLibrary,
} from '@/services/libraryService';

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchLibrary();
      setBooks(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load library';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchLibrary()
      .then((data) => {
        if (isMounted) {
          setBooks(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load library';
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleImport = useCallback(async (): Promise<ImportResult> => {
    try {
      const result = await importBookFromPicker();
      if (result.success) {
        // Refresh library list
        await loadBooks();
      }
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed';
      return { success: false, error: message };
    }
  }, [loadBooks]);

  const handleRemove = useCallback(
    async (bookId: string, deleteFile = true): Promise<boolean> => {
      try {
        const success = await removeBookFromLibrary(bookId, deleteFile);
        if (success) {
          setBooks((prev) => prev.filter((b) => b.id !== bookId));
        }
        return success;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to remove book';
        setError(message);
        return false;
      }
    },
    []
  );

  return {
    books,
    isLoading,
    error,
    refresh: loadBooks,
    importBook: handleImport,
    removeBook: handleRemove,
  };
}
