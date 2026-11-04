import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, BookFormat, Bookmark, ReadingSessionStats, Annotation } from '@/types';

const DATABASE_NAME = 'readora.db';
const CURRENT_SCHEMA_VERSION = 4;

// Storage keys for AsyncStorage offline/web fallback
const ASYNC_BOOKS_KEY = '@readora_books_v1';
const ASYNC_BOOKMARKS_KEY = '@readora_bookmarks_v1';
const ASYNC_SESSIONS_KEY = '@readora_sessions_v1';
const ASYNC_ANNOTATIONS_KEY = '@readora_annotations_v1';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// ==========================================
// AsyncStorage Resilient Backup Store
// ==========================================

async function getStoredBooksFromAsync(): Promise<Book[]> {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_BOOKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[libraryDatabaseService] Failed to read books from AsyncStorage:', err);
    return [];
  }
}

async function saveBooksToAsync(books: Book[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ASYNC_BOOKS_KEY, JSON.stringify(books));
  } catch (err) {
    console.warn('[libraryDatabaseService] Failed to save books to AsyncStorage:', err);
  }
}

async function getStoredBookmarksFromAsync(bookId?: string): Promise<Bookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_BOOKMARKS_KEY);
    if (!raw) return [];
    const list: Bookmark[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return bookId ? list.filter((b) => b.bookId === bookId) : list;
  } catch {
    return [];
  }
}

async function saveBookmarkToAsync(bookmark: Bookmark): Promise<void> {
  try {
    const all = await getStoredBookmarksFromAsync();
    const updated = [...all.filter((b) => b.id !== bookmark.id), bookmark];
    await AsyncStorage.setItem(ASYNC_BOOKMARKS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

async function deleteBookmarkFromAsync(bookmarkId: string): Promise<void> {
  try {
    const all = await getStoredBookmarksFromAsync();
    const updated = all.filter((b) => b.id !== bookmarkId);
    await AsyncStorage.setItem(ASYNC_BOOKMARKS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

interface StoredReadingSession {
  id: string;
  bookId: string;
  durationMinutes: number;
  readDate: string;
}

async function getStoredSessionsFromAsync(): Promise<StoredReadingSession[]> {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_SESSIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function saveSessionToAsync(session: StoredReadingSession): Promise<void> {
  try {
    const all = await getStoredSessionsFromAsync();
    all.push(session);
    await AsyncStorage.setItem(ASYNC_SESSIONS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

async function getStoredAnnotationsFromAsync(bookId?: string): Promise<Annotation[]> {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_ANNOTATIONS_KEY);
    if (!raw) return [];
    const list: Annotation[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return bookId ? list.filter((a) => a.bookId === bookId) : list;
  } catch {
    return [];
  }
}

async function saveAnnotationToAsync(annotation: Annotation): Promise<void> {
  try {
    const all = await getStoredAnnotationsFromAsync();
    const updated = [...all.filter((a) => a.id !== annotation.id), annotation];
    await AsyncStorage.setItem(ASYNC_ANNOTATIONS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

async function deleteAnnotationFromAsync(annotationId: string): Promise<void> {
  try {
    const all = await getStoredAnnotationsFromAsync();
    const updated = all.filter((a) => a.id !== annotationId);
    await AsyncStorage.setItem(ASYNC_ANNOTATIONS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

async function updateAnnotationNoteInAsync(annotationId: string, note: string): Promise<void> {
  try {
    const all = await getStoredAnnotationsFromAsync();
    const updated = all.map((a) => (a.id === annotationId ? { ...a, note } : a));
    await AsyncStorage.setItem(ASYNC_ANNOTATIONS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// ==========================================
// SQLite Database Initialization
// ==========================================

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await initializeSchema(db);
      dbInstance = db;
      return db;
    } catch (err) {
      dbInitPromise = null;
      console.warn('[libraryDatabaseService] SQLite init warning, falling back to AsyncStorage:', err);
      throw err;
    }
  })();

  return dbInitPromise;
}

async function initializeSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY NOT NULL
      );
    `);

    const versionRow = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version LIMIT 1;'
    );

    const currentVersion = versionRow?.version ?? 0;

    if (currentVersion < 1) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS books (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          originalFilename TEXT NOT NULL,
          format TEXT NOT NULL,
          fileSizeBytes INTEGER NOT NULL,
          fileUri TEXT NOT NULL,
          relativePath TEXT NOT NULL,
          addedAt TEXT NOT NULL,
          lastReadAt TEXT,
          coverUri TEXT,
          totalPages INTEGER,
          currentPage INTEGER DEFAULT 0,
          progressPercent REAL DEFAULT 0.0
        );

        CREATE INDEX IF NOT EXISTS idx_books_addedAt ON books(addedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_books_format ON books(format);
        CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
      `);
    }

    if (currentVersion < 2) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS bookmarks (
          id TEXT PRIMARY KEY NOT NULL,
          bookId TEXT NOT NULL,
          page INTEGER NOT NULL,
          title TEXT,
          createdAt TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_bookmarks_bookId ON bookmarks(bookId);

        CREATE TABLE IF NOT EXISTS reading_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          bookId TEXT NOT NULL,
          durationMinutes REAL NOT NULL,
          readDate TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_reading_sessions_date ON reading_sessions(readDate);
      `);
    }

    if (currentVersion < 3) {
      // Safe, versioned, idempotent column addition for Schema v3 (Precision Reading Progress)
      try {
        const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(books);');
        const hasLocationCol = tableInfo.some((col) => col.name === 'lastLocationJson');
        if (!hasLocationCol) {
          await db.execAsync('ALTER TABLE books ADD COLUMN lastLocationJson TEXT;');
        }
      } catch (colErr) {
        console.warn('[libraryDatabaseService] Migration v3 column check warning:', colErr);
      }
    }

    if (currentVersion < 4) {
      // Safe, versioned, idempotent creation of annotations table for Schema v4 (Phase C)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS annotations (
          id TEXT PRIMARY KEY NOT NULL,
          bookId TEXT NOT NULL,
          type TEXT NOT NULL,
          color TEXT NOT NULL,
          selectedText TEXT NOT NULL,
          note TEXT,
          pageNumber INTEGER,
          chapterIndex INTEGER,
          locationJson TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_annotations_bookId ON annotations(bookId);
        CREATE INDEX IF NOT EXISTS idx_annotations_created ON annotations(createdAt DESC);
      `);
    }

    await db.execAsync(`
      INSERT OR REPLACE INTO schema_version (version) VALUES (${CURRENT_SCHEMA_VERSION});
    `);
  } catch (err) {
    console.warn('[libraryDatabaseService] Schema initialization warning:', err);
  }
}

function mapRowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    originalFilename: row.originalFilename,
    format: row.format as BookFormat,
    fileSizeBytes: Number(row.fileSizeBytes),
    fileUri: row.fileUri,
    relativePath: row.relativePath,
    addedAt: row.addedAt,
    lastReadAt: row.lastReadAt || undefined,
    coverUri: row.coverUri || undefined,
    totalPages: row.totalPages ? Number(row.totalPages) : undefined,
    currentPage: Number(row.currentPage || 0),
    progressPercent: Number(row.progressPercent || 0),
    lastLocationJson: row.lastLocationJson || undefined,
  };
}

// ==========================================
// Book Repository Operations (Dual Persisted)
// ==========================================

export async function getAllBooks(): Promise<Book[]> {
  let sqliteBooks: Book[] = [];
  let sqliteSuccess = false;

  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM books ORDER BY addedAt DESC;'
    );
    sqliteBooks = rows.map(mapRowToBook);
    sqliteSuccess = true;
  } catch (err) {
    console.warn('[libraryDatabaseService] SQLite getAllBooks fallback to AsyncStorage:', err);
  }

  if (sqliteSuccess) {
    // SQLite is the single reliable source of truth.
    // Sync to AsyncStorage so it remains an accurate resilient backup mirror.
    if (sqliteBooks.length > 0) {
      saveBooksToAsync(sqliteBooks).catch(() => {});
    }
    return sqliteBooks;
  }

  // Fallback to AsyncStorage only if SQLite is unavailable
  return getStoredBooksFromAsync();
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM books WHERE id = ? OR id LIKE ? LIMIT 1;',
      [id, `%${id}%`]
    );
    if (row) return mapRowToBook(row);
  } catch {
    // fallback
  }

  const asyncBooks = await getStoredBooksFromAsync();
  return (
    asyncBooks.find((b) => b.id === id) ||
    asyncBooks.find(
      (b) =>
        b.id.includes(id) ||
        (id.startsWith('curated_') && b.id.includes(id.replace('curated_', '')))
    ) ||
    null
  );
}

export async function findDuplicateBook(
  originalFilename: string,
  fileSizeBytes: number
): Promise<Book | null> {
  if (!originalFilename || originalFilename.trim().length <= 3 || fileSizeBytes <= 0) {
    return null;
  }

  const cleanName = originalFilename.trim().toLowerCase();

  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM books WHERE LOWER(originalFilename) = ? AND fileSizeBytes = ? LIMIT 1;',
      [cleanName, fileSizeBytes]
    );
    if (row) return mapRowToBook(row);
  } catch {
    // fallback
  }

  const asyncBooks = await getStoredBooksFromAsync();
  return (
    asyncBooks.find(
      (b) =>
        b.originalFilename.trim().toLowerCase() === cleanName &&
        b.fileSizeBytes === fileSizeBytes
    ) || null
  );
}

export async function insertBook(book: Book): Promise<void> {
  // 1. Immediately persist to AsyncStorage (guaranteed fast & durable)
  try {
    const current = await getStoredBooksFromAsync();
    // Only replace an existing record if it shares the exact same book.id
    const remaining = current.filter((b) => b.id !== book.id);
    await saveBooksToAsync([book, ...remaining]);
  } catch (err) {
    console.warn('[libraryDatabaseService] AsyncStorage saveBook warning:', err);
  }

  // 2. Persist to SQLite
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO books (
        id, title, author, originalFilename, format,
        fileSizeBytes, fileUri, relativePath, addedAt,
        lastReadAt, coverUri, totalPages, currentPage, progressPercent, lastLocationJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        book.id,
        book.title,
        book.author,
        book.originalFilename,
        book.format,
        book.fileSizeBytes,
        book.fileUri,
        book.relativePath,
        book.addedAt,
        book.lastReadAt ?? null,
        book.coverUri ?? null,
        book.totalPages ?? null,
        book.currentPage ?? 0,
        book.progressPercent ?? 0.0,
        book.lastLocationJson ?? null,
      ]
    );
  } catch (err) {
    console.warn('[libraryDatabaseService] SQLite insertBook warning (persisted via AsyncStorage):', err);
  }
}

export async function deleteBookRecord(id: string): Promise<void> {
  // 1. Remove from AsyncStorage
  try {
    const current = await getStoredBooksFromAsync();
    await saveBooksToAsync(current.filter((b) => b.id !== id));
  } catch (err) {
    console.warn('[libraryDatabaseService] AsyncStorage delete warning:', err);
  }

  // 2. Remove from SQLite
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM books WHERE id = ?;', [id]);
  } catch (err) {
    console.warn('[libraryDatabaseService] SQLite delete warning:', err);
  }
}

export async function getBookCount(): Promise<number> {
  const books = await getAllBooks();
  return books.length;
}

export async function getRecentBooks(limit = 3): Promise<Book[]> {
  const books = await getAllBooks();
  return books.slice(0, limit);
}

export async function updateReadingProgress(
  bookId: string,
  currentPage: number,
  totalPages?: number,
  progressPercent?: number,
  lastLocationJson?: string
): Promise<void> {
  const now = new Date().toISOString();
  const calculatedPercent =
    progressPercent !== undefined
      ? progressPercent
      : totalPages && totalPages > 0
      ? Math.min(100, Math.round((currentPage / totalPages) * 100))
      : 0;

  // 1. Update in SQLite (Authoritative Primary Store)
  try {
    const db = await getDatabase();
    if (lastLocationJson !== undefined) {
      await db.runAsync(
        `UPDATE books
         SET currentPage = ?,
             totalPages = COALESCE(?, totalPages),
             progressPercent = ?,
             lastReadAt = ?,
             lastLocationJson = ?
         WHERE id = ?;`,
        [currentPage, totalPages ?? null, calculatedPercent, now, lastLocationJson, bookId]
      );
    } else {
      await db.runAsync(
        `UPDATE books
         SET currentPage = ?,
             totalPages = COALESCE(?, totalPages),
             progressPercent = ?,
             lastReadAt = ?
         WHERE id = ?;`,
        [currentPage, totalPages ?? null, calculatedPercent, now, bookId]
      );
    }
  } catch (err) {
    console.warn('[libraryDatabaseService] SQLite updateReadingProgress warning:', err);
  }

  // 2. Mirror update to AsyncStorage (Resilient Secondary Store)
  try {
    const current = await getStoredBooksFromAsync();
    const updated = current.map((b) => {
      if (b.id === bookId) {
        return {
          ...b,
          currentPage,
          totalPages: totalPages ?? b.totalPages,
          progressPercent: calculatedPercent,
          lastReadAt: now,
          ...(lastLocationJson !== undefined ? { lastLocationJson } : {}),
        };
      }
      return b;
    });
    await saveBooksToAsync(updated);
  } catch {
    // ignore
  }
}

export async function updateBookCover(bookId: string, coverUri: string): Promise<void> {
  if (!bookId || !coverUri) return;

  // 1. Update in AsyncStorage
  try {
    const current = await getStoredBooksFromAsync();
    const updated = current.map((b) => {
      if (b.id === bookId) {
        return { ...b, coverUri };
      }
      return b;
    });
    await saveBooksToAsync(updated);
  } catch (err) {
    console.warn('[libraryDatabaseService] Failed to update cover in AsyncStorage:', err);
  }

  // 2. Update in SQLite
  try {
    const db = await getDatabase();
    await db.runAsync('UPDATE books SET coverUri = ? WHERE id = ?;', [coverUri, bookId]);
  } catch (err) {
    console.warn('[libraryDatabaseService] Failed to update cover in SQLite:', err);
  }
}

export async function updateBookAuthor(bookId: string, author: string): Promise<void> {
  if (!bookId || !author || author === 'Unknown Author') return;

  // 1. Update in AsyncStorage
  try {
    const current = await getStoredBooksFromAsync();
    const updated = current.map((b) => {
      if (b.id === bookId) {
        return { ...b, author };
      }
      return b;
    });
    await saveBooksToAsync(updated);
  } catch (err) {
    console.warn('[libraryDatabaseService] Failed to update author in AsyncStorage:', err);
  }

  // 2. Update in SQLite
  try {
    const db = await getDatabase();
    await db.runAsync('UPDATE books SET author = ? WHERE id = ?;', [author, bookId]);
  } catch (err) {
    console.warn('[libraryDatabaseService] Failed to update author in SQLite:', err);
  }
}

export async function updateBookTitle(bookId: string, title: string): Promise<void> {
  const cleanTitle = title.trim();
  if (!bookId || !cleanTitle) return;

  // 1. Update in AsyncStorage
  try {
    const current = await getStoredBooksFromAsync();
    const updated = current.map((b) => {
      if (b.id === bookId) {
        return { ...b, title: cleanTitle };
      }
      return b;
    });
    await saveBooksToAsync(updated);
  } catch (err) {
    console.warn('[libraryDatabaseService] Failed to update title in AsyncStorage:', err);
  }

  // 2. Update in SQLite
  try {
    const db = await getDatabase();
    await db.runAsync('UPDATE books SET title = ? WHERE id = ?;', [cleanTitle, bookId]);
  } catch (err) {
    console.warn('[libraryDatabaseService] Failed to update title in SQLite:', err);
  }
}

// ==========================================
// Bookmark Operations (Dual Persisted)
// ==========================================

export async function getBookmarks(bookId: string): Promise<Bookmark[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM bookmarks WHERE bookId = ? ORDER BY page ASC;',
      [bookId]
    );
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        bookId: r.bookId,
        page: Number(r.page),
        title: r.title || undefined,
        createdAt: r.createdAt,
      }));
    }
  } catch {
    // fallback
  }

  return await getStoredBookmarksFromAsync(bookId);
}

export async function addBookmark(
  bookId: string,
  page: number,
  title?: string
): Promise<Bookmark> {
  const id = `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const bookmark: Bookmark = { id, bookId, page, title, createdAt: now };

  await saveBookmarkToAsync(bookmark);

  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO bookmarks (id, bookId, page, title, createdAt) VALUES (?, ?, ?, ?, ?);`,
      [id, bookId, page, title ?? null, now]
    );
  } catch {
    // ignore
  }

  return bookmark;
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  await deleteBookmarkFromAsync(bookmarkId);

  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?;', [bookmarkId]);
  } catch {
    // ignore
  }
}

export async function isPageBookmarked(
  bookId: string,
  page: number
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT id FROM bookmarks WHERE bookId = ? AND page = ? LIMIT 1;',
      [bookId, page]
    );
    if (row) return true;
  } catch {
    // fallback
  }

  const marks = await getStoredBookmarksFromAsync(bookId);
  return marks.some((b) => b.page === page);
}

// ==========================================
// Reading Analytics (Dual Persisted)
// ==========================================

export async function recordReadingSession(
  bookId: string,
  durationMinutes: number
): Promise<void> {
  if (durationMinutes <= 0) return;
  const today = new Date().toISOString().split('T')[0];
  const id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await saveSessionToAsync({ id, bookId, durationMinutes, readDate: today });

  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO reading_sessions (id, bookId, durationMinutes, readDate) VALUES (?, ?, ?, ?);`,
      [id, bookId, durationMinutes, today]
    );
  } catch {
    // ignore
  }
}

export async function getReadingStats(): Promise<ReadingSessionStats> {
  let totalReadingMinutes = 0;
  let booksCompletedCount = 0;
  let currentBook: ReadingSessionStats['currentBook'];
  const today = new Date();
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayIndex = (today.getDay() + 6) % 7;

  const minutesByDate: Record<string, number> = {};

  try {
    const db = await getDatabase();

    const totalRow = await db.getFirstAsync<{ total: number | null }>(
      'SELECT SUM(durationMinutes) as total FROM reading_sessions;'
    );
    totalReadingMinutes = Math.round(totalRow?.total || 0);

    const completedRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM books WHERE progressPercent >= 99.5;'
    );
    booksCompletedCount = completedRow?.count || 0;

    const sessionRows = await db.getAllAsync<{ durationMinutes: number; readDate: string }>(
      `SELECT durationMinutes, readDate FROM reading_sessions
       WHERE date(readDate) >= date('now', '-7 days');`
    );
    sessionRows.forEach((r) => {
      minutesByDate[r.readDate] = (minutesByDate[r.readDate] || 0) + Number(r.durationMinutes);
    });

    const currentBookRow = await db.getFirstAsync<any>(
      'SELECT * FROM books WHERE lastReadAt IS NOT NULL ORDER BY lastReadAt DESC LIMIT 1;'
    );
    if (currentBookRow) {
      currentBook = {
        id: currentBookRow.id,
        title: currentBookRow.title,
        progressPercent: Number(currentBookRow.progressPercent || 0),
        format: currentBookRow.format as BookFormat,
        coverUri: currentBookRow.coverUri || undefined,
      };
    }
  } catch {
    // Compute from AsyncStorage fallback
    const sessions = await getStoredSessionsFromAsync();
    totalReadingMinutes = Math.round(
      sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)
    );

    const books = await getStoredBooksFromAsync();
    booksCompletedCount = books.filter((b) => (b.progressPercent || 0) >= 99.5).length;

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sessions.forEach((s) => {
      if (new Date(s.readDate) >= sevenDaysAgo) {
        minutesByDate[s.readDate] = (minutesByDate[s.readDate] || 0) + Number(s.durationMinutes);
      }
    });

    const readBooks = books.filter((b) => b.lastReadAt);
    if (readBooks.length > 0) {
      const top = [...readBooks].sort(
        (a, b) => new Date(b.lastReadAt!).getTime() - new Date(a.lastReadAt!).getTime()
      )[0];
      currentBook = {
        id: top.id,
        title: top.title,
        progressPercent: top.progressPercent || 0,
        format: top.format,
        coverUri: top.coverUri || undefined,
      };
    }
  }

  const weeklyActivity = daysOfWeek.map((day, idx) => {
    const diff = idx - dayIndex;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    const dateStr = targetDate.toISOString().split('T')[0];
    const minutes = Math.round(minutesByDate[dateStr] || 0);
    return {
      day,
      minutes,
      completed: minutes > 0,
    };
  });

  // Reading streak calculation
  let readingStreakDays = 0;
  let checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayMinutes = minutesByDate[dateStr] || 0;
    if (dayMinutes > 0) {
      readingStreakDays += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (readingStreakDays === 0 && dateStr === today.toISOString().split('T')[0]) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yestStr = checkDate.toISOString().split('T')[0];
        if ((minutesByDate[yestStr] || 0) > 0) {
          readingStreakDays = 1;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  return {
    readingStreakDays,
    totalReadingMinutes,
    booksCompletedCount,
    weeklyActivity,
    currentBook,
  };
}

// ==========================================
// Annotations Repository (Phase C: Dual Persisted)
// ==========================================

function mapRowToAnnotation(row: any): Annotation {
  return {
    id: row.id,
    bookId: row.bookId,
    type: row.type as Annotation['type'],
    color: row.color,
    selectedText: row.selectedText,
    note: row.note || undefined,
    pageNumber: row.pageNumber !== null && row.pageNumber !== undefined ? Number(row.pageNumber) : undefined,
    chapterIndex: row.chapterIndex !== null && row.chapterIndex !== undefined ? Number(row.chapterIndex) : undefined,
    locationJson: row.locationJson,
    createdAt: row.createdAt,
  };
}

export async function getAnnotations(bookId: string): Promise<Annotation[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM annotations WHERE bookId = ? ORDER BY createdAt ASC;',
      [bookId]
    );
    const annotations = rows.map(mapRowToAnnotation);
    if (annotations.length > 0) {
      // Sync to AsyncStorage as mirrored backup
      AsyncStorage.setItem(
        `${ASYNC_ANNOTATIONS_KEY}_${bookId}`,
        JSON.stringify(annotations)
      ).catch(() => {});
    }
    return annotations;
  } catch (err) {
    console.warn('[libraryDatabaseService] SQLite getAnnotations fallback to AsyncStorage:', err);
  }

  // Fallback to AsyncStorage
  return getStoredAnnotationsFromAsync(bookId);
}

export async function addAnnotation(
  annotation: Omit<Annotation, 'id' | 'createdAt'>
): Promise<Annotation> {
  const newAnnotation: Annotation = {
    ...annotation,
    id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  // 1. Persist to SQLite (Authoritative Primary)
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO annotations (
        id, bookId, type, color, selectedText, note,
        pageNumber, chapterIndex, locationJson, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newAnnotation.id,
        newAnnotation.bookId,
        newAnnotation.type,
        newAnnotation.color,
        newAnnotation.selectedText,
        newAnnotation.note ?? null,
        newAnnotation.pageNumber ?? null,
        newAnnotation.chapterIndex ?? null,
        newAnnotation.locationJson,
        newAnnotation.createdAt,
      ]
    );
  } catch (err) {
    console.warn('[libraryDatabaseService] SQLite addAnnotation warning:', err);
  }

  // 2. Mirror to AsyncStorage
  await saveAnnotationToAsync(newAnnotation);

  return newAnnotation;
}

export async function deleteAnnotation(annotationId: string): Promise<void> {
  // 1. Remove from SQLite
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM annotations WHERE id = ?;', [annotationId]);
  } catch (err) {
    console.warn('[libraryDatabaseService] SQLite deleteAnnotation warning:', err);
  }

  // 2. Remove from AsyncStorage
  await deleteAnnotationFromAsync(annotationId);
}

export async function updateAnnotationNote(
  annotationId: string,
  note: string
): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('UPDATE annotations SET note = ? WHERE id = ?;', [
      note,
      annotationId,
    ]);
  } catch (err) {
    console.warn('[libraryDatabaseService] SQLite updateAnnotationNote warning:', err);
  }

  await updateAnnotationNoteInAsync(annotationId, note);
}

