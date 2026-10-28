import { Book, ImportResult } from '@/types';
import { deriveTitleFromFilename, detectBookFormat } from '@/utils/fileUtils';
import { pickBookDocument } from './documentPickerService';
import {
  storeBookFile,
  deleteBookFile,
  verifyBookFileExists,
} from './bookStorageService';
import {
  getAllBooks,
  getBookById,
  findDuplicateBook,
  insertBook,
  deleteBookRecord,
  getBookCount,
  getRecentBooks,
} from './libraryDatabaseService';

/**
 * Import a book via system document picker, store in sandbox, and register in SQLite
 */
export async function importBookFromPicker(): Promise<ImportResult> {
  // Step 1: User selects document
  const pickerResult = await pickBookDocument();

  if (pickerResult.canceled) {
    return { success: false, canceled: true };
  }

  if (pickerResult.error || !pickerResult.file) {
    return {
      success: false,
      error: pickerResult.error || 'Failed to select document.',
    };
  }

  const { name, uri, size, mimeType } = pickerResult.file;

  // Step 2: Validate format
  const format = detectBookFormat(name, mimeType);
  if (!format) {
    return {
      success: false,
      error: `Unsupported format for file "${name}". Please choose a PDF, EPUB, or TXT file.`,
    };
  }

  // Step 3: Check for duplicates
  const existingDuplicate = await findDuplicateBook(name, size);
  if (existingDuplicate) {
    // Verify file still exists on disk
    const existsOnDisk = await verifyBookFileExists(existingDuplicate.fileUri);
    if (existsOnDisk) {
      return {
        success: true,
        book: existingDuplicate,
        isDuplicate: true,
      };
    } else {
      // Clean up orphaned database record if original file was removed
      await deleteBookRecord(existingDuplicate.id);
    }
  }

  // Step 4: Generate unique ID & metadata
  const bookId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const title = deriveTitleFromFilename(name);
  const now = new Date().toISOString();

  let storedFileUri = '';

  try {
    // Step 5: Safely copy file to app-managed persistent storage
    const stored = await storeBookFile(uri, name, bookId);
    storedFileUri = stored.fileUri;

    const newBook: Book = {
      id: bookId,
      title,
      author: 'Unknown Author', // Will be parsed from EPUB/PDF metadata in reader phase
      originalFilename: name,
      format,
      fileSizeBytes: stored.fileSizeBytes,
      fileUri: stored.fileUri,
      relativePath: stored.relativePath,
      addedAt: now,
      currentPage: 0,
      progressPercent: 0,
    };

    // Step 6: Persist in SQLite
    await insertBook(newBook);

    return {
      success: true,
      book: newBook,
      isDuplicate: false,
    };
  } catch (err: unknown) {
    // Rollback copied file if database insert fails
    if (storedFileUri) {
      await deleteBookFile(storedFileUri);
    }
    const message = err instanceof Error ? err.message : 'Storage or database failure';
    return {
      success: false,
      error: `Failed to import book: ${message}`,
    };
  }
}

/**
 * Remove a book from the library and optionally delete the file from disk
 */
export async function removeBookFromLibrary(
  bookId: string,
  deleteFile = true
): Promise<boolean> {
  try {
    const book = await getBookById(bookId);
    if (!book) return false;

    // Delete from database
    await deleteBookRecord(bookId);

    // Delete underlying file if requested
    if (deleteFile && book.fileUri) {
      await deleteBookFile(book.fileUri);
    }

    return true;
  } catch (err) {
    console.error(`[libraryService] Failed to remove book: ${bookId}`, err);
    throw err;
  }
}

/**
 * Fetch all library books
 */
export async function fetchLibrary(): Promise<Book[]> {
  return await getAllBooks();
}

/**
 * Fetch library summary for home screen
 */
export async function fetchLibrarySummary(): Promise<{
  totalCount: number;
  recentBooks: Book[];
}> {
  const [totalCount, recentBooks] = await Promise.all([
    getBookCount(),
    getRecentBooks(3),
  ]);

  return { totalCount, recentBooks };
}
