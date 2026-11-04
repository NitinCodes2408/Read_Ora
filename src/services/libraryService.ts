import { Book, ImportResult } from '@/types';
import { parseTitleAndAuthor, detectBookFormat, getKnownAuthor } from '@/utils/fileUtils';
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
  updateBookTitle,
} from './libraryDatabaseService';
import { extractBookMetadataAndCover } from './coverExtractionService';

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

  const { name, uri, size, mimeType, rawFile } = pickerResult.file;

  // Step 2: Validate format
  const format = detectBookFormat(name, mimeType);
  if (!format) {
    return {
      success: false,
      error: `Unsupported format for file "${name}". Please choose a PDF, EPUB, or TXT file.`,
    };
  }

  // Step 3: Check for exact duplicate (same filename AND same non-zero file size)
  if (size > 0) {
    const existingDuplicate = await findDuplicateBook(name, size);
    if (
      existingDuplicate &&
      existingDuplicate.originalFilename.toLowerCase() === name.toLowerCase() &&
      existingDuplicate.fileSizeBytes === size
    ) {
      const existsOnDisk = await verifyBookFileExists(existingDuplicate.fileUri, existingDuplicate.id);
      if (existsOnDisk) {
        return {
          success: true,
          book: existingDuplicate,
          isDuplicate: true,
        };
      } else {
        // Orphaned record - clean up so fresh import can proceed
        await deleteBookRecord(existingDuplicate.id);
        await deleteBookFile(existingDuplicate.fileUri, existingDuplicate.id);
      }
    }
  }

  // Step 4: Generate unique ID & metadata base
  const bookId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let { title, author } = parseTitleAndAuthor(name);
  const now = new Date().toISOString();

  let storedFileUri = '';

  try {
    // Step 5: Safely copy file to app-managed persistent storage
    const stored = await storeBookFile(uri, name, bookId, rawFile);
    storedFileUri = stored.fileUri;

    // Step 5b: Extract format-specific metadata (title, author) & original book cover
    let coverUri: string | undefined = undefined;

    try {
      const meta = await extractBookMetadataAndCover(
        stored.fileUri,
        format,
        bookId,
        rawFile,
        title
      );
      if (meta.title && meta.title.trim().length > 0) {
        title = meta.title.trim();
      }
      if (meta.author && meta.author.trim().length > 0 && meta.author !== 'Unknown Author') {
        author = meta.author.trim();
      }
      if (meta.coverUri) {
        coverUri = meta.coverUri;
      }
    } catch {
      // preserve filename title and author
    }

    // Fallback to knowledge base author resolution if author is still unknown
    if (!author || author === 'Unknown Author') {
      const known = getKnownAuthor(title);
      if (known) {
        author = known;
      }
    }

    const newBook: Book = {
      id: bookId,
      title,
      author,
      originalFilename: name,
      format,
      fileSizeBytes: stored.fileSizeBytes,
      fileUri: stored.fileUri,
      relativePath: stored.relativePath,
      addedAt: now,
      coverUri: coverUri || undefined,
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
      await deleteBookFile(storedFileUri, bookId);
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
      await deleteBookFile(book.fileUri, book.id);
    }

    return true;
  } catch (err) {
    console.error(`[libraryService] Failed to remove book: ${bookId}`, err);
    throw err;
  }
}

/**
 * Rename a book's display title in the library
 */
export async function renameBookInLibrary(
  bookId: string,
  newTitle: string
): Promise<boolean> {
  try {
    const cleanTitle = newTitle.trim();
    if (!bookId || !cleanTitle) return false;
    await updateBookTitle(bookId, cleanTitle);
    return true;
  } catch (err) {
    console.error(`[libraryService] Failed to rename book: ${bookId}`, err);
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
