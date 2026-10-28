/**
 * ReadOra TypeScript Definitions
 */

export type BookFormat = 'PDF' | 'EPUB' | 'TXT';

export interface Book {
  id: string;
  title: string;
  author: string;
  originalFilename: string;
  format: BookFormat;
  fileSizeBytes: number;
  fileUri: string;
  relativePath: string;
  addedAt: string;
  lastReadAt?: string;
  coverUri?: string;
  totalPages?: number;
  currentPage?: number;
  progressPercent: number;
}

export type SortOption = 'recent' | 'title' | 'size';

export interface PickedDocument {
  name: string;
  uri: string;
  size: number;
  mimeType?: string;
}

export type ImportResult =
  | { success: true; book: Book; isDuplicate?: boolean }
  | { success: false; canceled?: boolean; error?: string; reason?: string };

export interface ReadingSessionStats {
  readingStreakDays: number;
  totalReadingMinutes: number;
  booksCompletedCount: number;
  currentBook?: {
    title: string;
    progressPercent: number;
  };
}

export interface DiscoverBookCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
}

export type ThemeMode = 'midnight' | 'sepia' | 'ivory';

export interface UserPreferences {
  themeMode: ThemeMode;
  fontSize: number;
  fontFamily: 'default' | 'serif' | 'sans' | 'mono';
  lineSpacing: 'normal' | 'relaxed' | 'loose';
}
