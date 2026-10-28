import * as FileSystem from 'expo-file-system/legacy';
import { sanitizeFilename } from '@/utils/fileUtils';

export interface StoredBookFile {
  bookId: string;
  fileUri: string;
  relativePath: string;
  fileSizeBytes: number;
}

const BOOKS_SUBDIRECTORY = 'books/';

/**
 * Get or create the app-managed persistent directory for storing books
 */
export async function ensureBooksDirectory(): Promise<string> {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    throw new Error('Device document directory is not available.');
  }

  const booksDir = `${docDir}${BOOKS_SUBDIRECTORY}`;
  const info = await FileSystem.getInfoAsync(booksDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(booksDir, { intermediates: true });
  }

  return booksDir;
}

/**
 * Safely copy a picked book into ReadOra persistent app storage.
 * Does not read the entire file into JavaScript memory.
 */
export async function storeBookFile(
  sourceUri: string,
  originalFilename: string,
  bookId: string
): Promise<StoredBookFile> {
  const booksDir = await ensureBooksDirectory();

  // Create unique collision-proof filename
  const cleanName = sanitizeFilename(originalFilename);
  const destinationFilename = `${bookId}_${cleanName}`;
  const destinationUri = `${booksDir}${destinationFilename}`;
  const relativePath = `${BOOKS_SUBDIRECTORY}${destinationFilename}`;

  // Check source existence
  const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
  if (!sourceInfo.exists) {
    throw new Error('Source file could not be read or does not exist.');
  }

  // Copy file to persistent storage
  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  // Verify copied file existence and size
  const destInfo = await FileSystem.getInfoAsync(destinationUri);
  if (!destInfo.exists) {
    throw new Error('Verification failed: Copied file does not exist in local app storage.');
  }

  const finalSize = destInfo.size && destInfo.size > 0 ? destInfo.size : (sourceInfo.size ?? 0);

  return {
    bookId,
    fileUri: destinationUri,
    relativePath,
    fileSizeBytes: finalSize,
  };
}

/**
 * Delete a book file from persistent storage
 */
export async function deleteBookFile(fileUri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[bookStorageService] Error deleting file: ${fileUri}`, err);
    return false;
  }
}

/**
 * Check if a book file still exists on disk
 */
export async function verifyBookFileExists(fileUri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    return info.exists;
  } catch {
    return false;
  }
}
