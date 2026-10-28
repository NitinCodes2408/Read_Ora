
import * as SQLite from 'expo-sqlite';
import { Book, BookFormat } from '@/types';

const DATABASE_NAME = 'readora.db';
const CURRENT_SCHEMA_VERSION = 1;

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

  if (currentVersion < CURRENT_SCHEMA_VERSION) {
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

      INSERT OR REPLACE INTO schema_version (version) VALUES (${CURRENT_SCHEMA_VERSION});
    `);
  }
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
