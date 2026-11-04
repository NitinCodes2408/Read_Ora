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
  lastLocationJson?: string;
}

export type SortOption = 'recent' | 'title' | 'size';

export interface PickedDocument {
  name: string;
  uri: string;
  size: number;
  mimeType?: string;
  rawFile?: any;
}

export type ImportResult =
  | { success: true; book: Book; isDuplicate?: boolean }
  | { success: false; canceled?: boolean; error?: string; reason?: string };

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  title?: string;
  createdAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  href?: string;
  contentHtml?: string;
  isFrontMatter?: boolean;
}

export type ReadingMode = 'paged' | 'scroll';

export interface ReadingSessionStats {
  readingStreakDays: number;
  totalReadingMinutes: number;
  booksCompletedCount: number;
  weeklyActivity: { day: string; minutes: number; completed: boolean }[];
  currentBook?: {
    id: string;
    title: string;
    progressPercent: number;
    format: BookFormat;
    coverUri?: string;
  };
}

export interface DiscoverBookCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
}

export type BookAvailabilityTier =
  | 'free_full'
  | 'preview'
  | 'borrow'
  | 'commercial'
  | 'metadata_only';

export interface BookAvailability {
  tier: BookAvailabilityTier;
  label: string;
  badgeColor: string;
  badgeBg: string;
  canAddToLibrary: boolean;
  canReadInApp: boolean;
  previewUrl?: string;
  borrowUrl?: string;
  infoUrl?: string;
  description: string;
}

export interface CuratedBook {
  id: string;
  gutenbergId?: number;
  openLibraryKey?: string;
  googleBooksId?: string;
  isbn?: string;
  title: string;
  author: string;
  category: 'Classics' | 'Philosophy' | 'Science' | 'Fiction' | 'History' | 'Poetry';
  description: string;
  format: BookFormat;
  coverUrl: string;
  downloadUrl: string;
  fallbackTextUrl?: string;
  fileSizeBytes: number;
  publishedYear: string;
  estimatedPages: number;
  publisher?: string;
  language?: string;
  badge?: string;
  provider?: 'gutenberg' | 'openlibrary' | 'googlebooks' | 'curated';
  availability?: BookAvailability;
  collection?: string;
}

export type ThemeMode = 'midnight' | 'sepia' | 'ivory';

export interface UserPreferences {
  themeMode: ThemeMode;
  fontSize: number;
  fontFamily: 'serif' | 'sans' | 'default' | 'mono';
  lineSpacing: 'compact' | 'normal' | 'relaxed' | 'loose';
  readingMode: ReadingMode;
}

// ==========================================
// Standardized Location Indexing (Phase A)
// ==========================================

export interface PdfLocation {
  format: 'PDF';
  pageNumber: number; // 1-based page index (PDF.js standard)
  totalPages: number;
  zoom?: number;
}

export interface EpubLocation {
  format: 'EPUB';
  chapterIndex: number; // 0-based chapter index
  scrollPercent: number; // 0-100 float vertical scroll progress within chapter
  totalChapters: number;
  chapterHref?: string;
  chapterId?: string;
}

export interface TxtLocation {
  format: 'TXT';
  pageIndex: number; // 0-based page chunk index
  charOffset: number; // 0-based absolute character offset in normalized text
  totalPages: number;
  readingMode: ReadingMode;
}

export type BookLocation = PdfLocation | EpubLocation | TxtLocation;

export function serializeLocation(location: BookLocation): string {
  return JSON.stringify(location);
}

export function parseLocation(rawJson?: string | null): BookLocation | null {
  if (!rawJson || typeof rawJson !== 'string') return null;
  try {
    const parsed = JSON.parse(rawJson);
    if (parsed && typeof parsed === 'object' && parsed.format) {
      return parsed as BookLocation;
    }
  } catch {
    // Return null if invalid JSON
  }
  return null;
}

// ==========================================
// Text Highlights & Underlines (Phase C)
// ==========================================

export type AnnotationType = 'highlight' | 'underline';

export const HIGHLIGHT_COLORS = [
  { name: 'Gold', hex: '#F5D061', darkHex: '#C59A3D' },
  { name: 'Emerald', hex: '#86EFAC', darkHex: '#10B981' },
  { name: 'Sky', hex: '#93C5FD', darkHex: '#3B82F6' },
  { name: 'Rose', hex: '#F472B6', darkHex: '#EC4899' },
  { name: 'Purple', hex: '#C084FC', darkHex: '#A855F7' },
];

export interface Annotation {
  id: string;
  bookId: string;
  type: AnnotationType;
  color: string; // hex color e.g. '#F5D061'
  selectedText: string;
  note?: string;
  pageNumber?: number; // 1-based page index (PDF/TXT)
  chapterIndex?: number; // 0-based chapter index (EPUB)
  locationJson: string; // format-specific anchor data
  createdAt: string;
}

export interface PdfAnnotationLocation {
  format: 'PDF';
  pageNumber: number;
  rects: {
    left: number; // percentage of page width (0 to 1)
    top: number; // percentage of page height (0 to 1)
    width: number; // percentage of page width (0 to 1)
    height: number; // percentage of page height (0 to 1)
  }[];
}

export interface EpubAnnotationLocation {
  format: 'EPUB';
  chapterIndex: number;
  textSnippet: string;
  startOffset?: number;
  endOffset?: number;
  containerSelector?: string;
}

export interface TxtAnnotationLocation {
  format: 'TXT';
  startChar: number; // absolute 0-based character offset in book
  endChar: number;
  pageIndex: number;
}
