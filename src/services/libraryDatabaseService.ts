import * as SQLite from 'expo-sqlite';
import { Book, BookFormat, Bookmark, ReadingSessionStats } from '@/types';

const DATABASE_NAME = 'readora.db';
const CURRENT_SCHEMA_VERSION = 2;

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize SQLite database connection
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeSchema(db);
  dbInstance = db;
  return dbInstance;
}

/**
 * Initialize versioned schema and migrations
 */
async function initializeSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create schema version tracker
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
    // Migration V1: Initial Books table and indexes
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
    // Migration V2: Bookmarks & Reading Sessions
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

  await db.execAsync(`
    INSERT OR REPLACE INTO schema_version (version) VALUES (${CURRENT_SCHEMA_VERSION});
  `);
}

/**
 * Retrieve all books sorted by addedAt DESC
 */
export async function getAllBooks(): Promise<Book[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM books ORDER BY addedAt DESC;'
  );

  return rows.map(mapRowToBook);
}

/**
 * Retrieve single book by ID
 */
export async function getBookById(id: string): Promise<Book | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM books WHERE id = ? LIMIT 1;',
    [id]
  );

  return row ? mapRowToBook(row) : null;
}

/**
 * Check if a book with matching title/filename and file size already exists
 */
export async function findDuplicateBook(
  originalFilename: string,
  fileSizeBytes: number
): Promise<Book | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM books WHERE originalFilename = ? AND fileSizeBytes = ? LIMIT 1;',
    [originalFilename, fileSizeBytes]
  );

  return row ? mapRowToBook(row) : null;
}

/**
 * Insert new book record
 */
export async function insertBook(book: Book): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO books (
      id, title, author, originalFilename, format,
      fileSizeBytes, fileUri, relativePath, addedAt,
      lastReadAt, coverUri, totalPages, currentPage, progressPercent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
    ]
  );
}

/**
 * Delete book record by ID
 */
export async function deleteBookRecord(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM books WHERE id = ?;', [id]);
}

/**
 * Get total book count
 */
export async function getBookCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM books;'
  );
  return result?.count ?? 0;
}

/**
 * Get recent books for home screen
 */
export async function getRecentBooks(limit = 3): Promise<Book[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM books ORDER BY addedAt DESC LIMIT ?;',
    [limit]
  );
  return rows.map(mapRowToBook);
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
  };
}

/**
 * Update reading progress (currentPage, totalPages, progressPercent, lastReadAt)
 */
export async function updateReadingProgress(
  bookId: string,
  currentPage: number,
  totalPages?: number,
  progressPercent?: number
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const calculatedPercent =
    progressPercent !== undefined
      ? progressPercent
      : totalPages && totalPages > 0
      ? Math.min(100, Math.round((currentPage / totalPages) * 100))
      : 0;

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

/**
 * Bookmark Management
 */
export async function getBookmarks(bookId: string): Promise<Bookmark[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM bookmarks WHERE bookId = ? ORDER BY page ASC;',
    [bookId]
  );
  return rows.map((r) => ({
    id: r.id,
    bookId: r.bookId,
    page: Number(r.page),
    title: r.title || undefined,
    createdAt: r.createdAt,
  }));
}

export async function addBookmark(
  bookId: string,
  page: number,
  title?: string
): Promise<Bookmark> {
  const db = await getDatabase();
  const id = `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO bookmarks (id, bookId, page, title, createdAt) VALUES (?, ?, ?, ?, ?);`,
    [id, bookId, page, title ?? null, now]
  );

  return { id, bookId, page, title, createdAt: now };
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM bookmarks WHERE id = ?;', [bookmarkId]);
}

export async function isPageBookmarked(
  bookId: string,
  page: number
): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT id FROM bookmarks WHERE bookId = ? AND page = ? LIMIT 1;',
    [bookId, page]
  );
  return !!row;
}

/**
 * Record a reading session (adds minutes read on today's date)
 */
export async function recordReadingSession(
  bookId: string,
  durationMinutes: number
): Promise<void> {
  if (durationMinutes <= 0) return;
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await db.runAsync(
    `INSERT INTO reading_sessions (id, bookId, durationMinutes, readDate) VALUES (?, ?, ?, ?);`,
    [id, bookId, durationMinutes, today]
  );
}

/**
 * Compute reading analytics for Insights tab
 */
export async function getReadingStats(): Promise<ReadingSessionStats> {
  const db = await getDatabase();

  // 1. Total reading minutes
  const totalRow = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(durationMinutes) as total FROM reading_sessions;'
  );
  const totalReadingMinutes = Math.round(totalRow?.total || 0);

  // 2. Books completed (progress >= 100%)
  const completedRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM books WHERE progressPercent >= 99.5;'
  );
  const booksCompletedCount = completedRow?.count || 0;

  // 3. Weekly activity (Mon-Sun for the current week)
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  // Get current day of week (0 is Sunday, 1 is Monday...)
  const dayIndex = (today.getDay() + 6) % 7; // Convert to Mon=0 ... Sun=6

  // Query sessions from the last 7 days
  const sessionRows = await db.getAllAsync<{ durationMinutes: number; readDate: string }>(
    `SELECT durationMinutes, readDate FROM reading_sessions
     WHERE date(readDate) >= date('now', '-7 days');`
  );

  const minutesByDate: Record<string, number> = {};
  sessionRows.forEach((r) => {
    minutesByDate[r.readDate] = (minutesByDate[r.readDate] || 0) + Number(r.durationMinutes);
  });

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

  // 4. Calculate reading streak
  let readingStreakDays = 0;
  let checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayTotal = await db.getFirstAsync<{ total: number | null }>(
      'SELECT SUM(durationMinutes) as total FROM reading_sessions WHERE readDate = ?;',
      [dateStr]
    );
    if (dayTotal?.total && dayTotal.total > 0) {
      readingStreakDays += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If today has 0 minutes, check if yesterday had reading activity
      if (readingStreakDays === 0 && dateStr === today.toISOString().split('T')[0]) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yestStr = checkDate.toISOString().split('T')[0];
        const yestTotal = await db.getFirstAsync<{ total: number | null }>(
          'SELECT SUM(durationMinutes) as total FROM reading_sessions WHERE readDate = ?;',
          [yestStr]
        );
        if (yestTotal?.total && yestTotal.total > 0) {
          readingStreakDays = 1;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  // 5. Current active book (most recently read)
  const currentBookRow = await db.getFirstAsync<any>(
    'SELECT * FROM books WHERE lastReadAt IS NOT NULL ORDER BY lastReadAt DESC LIMIT 1;'
  );

  let currentBook;
  if (currentBookRow) {
    currentBook = {
      id: currentBookRow.id,
      title: currentBookRow.title,
      progressPercent: Number(currentBookRow.progressPercent || 0),
      format: currentBookRow.format as BookFormat,
    };
  }

  return {
    readingStreakDays,
    totalReadingMinutes,
    booksCompletedCount,
    weeklyActivity,
    currentBook,
  };
}
