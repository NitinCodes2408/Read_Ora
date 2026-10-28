import { BookFormat } from '@/types';

/**
 * Format bytes into readable string (e.g. 1.2 MB, 450 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Determine BookFormat from filename or mime type
 */
export function detectBookFormat(filename: string, mimeType?: string): BookFormat | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf') || mimeType === 'application/pdf') {
    return 'PDF';
  }
  if (lower.endsWith('.epub') || mimeType === 'application/epub+zip') {
    return 'EPUB';
  }
  if (lower.endsWith('.txt') || mimeType === 'text/plain') {
    return 'TXT';
  }
  return null;
}

/**
 * Clean filename into a human-readable title
 * E.g. "Atomic_Habits_James_Clear.epub" -> "Atomic Habits James Clear"
 */
export function deriveTitleFromFilename(filename: string): string {
  // Strip extension
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  // Replace underscores and multiple dashes with spaces
  const cleaned = withoutExt.replace(/[_-]+/g, ' ').trim();
  return cleaned || filename;
}

/**
 * Sanitize filename for safe local disk storage
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Format date into readable string (e.g. "Oct 28, 2026")
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}
