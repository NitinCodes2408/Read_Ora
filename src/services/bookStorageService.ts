import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { sanitizeFilename } from '@/utils/fileUtils';

export interface StoredBookFile {
  bookId: string;
  fileUri: string;
  relativePath: string;
  fileSizeBytes: number;
}

const BOOKS_SUBDIRECTORY = 'books/';

// --- In-Memory Cache & IndexedDB for Persistent Web Storage ---
const memoryBlobCache = new Map<string, Blob>();
const IDB_NAME = 'ReadOra_Storage_v1';
const IDB_STORE = 'books';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open browser storage database.'));
  });
}

/**
 * Save file data (Blob or ArrayBuffer) permanently in browser IndexedDB & memory cache
 */
export async function saveWebBookFile(bookId: string, data: Blob | ArrayBuffer): Promise<void> {
  let blobToCache: Blob;
  let bufferToSave: ArrayBuffer;

  if (data instanceof Blob) {
    blobToCache = data;
    bufferToSave = await data.arrayBuffer();
  } else {
    blobToCache = new Blob([data]);
    bufferToSave = data;
  }

  // Cache in memory for instant synchronous retrieval
  memoryBlobCache.set(bookId, blobToCache);

  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(bufferToSave, bookId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to save file in browser storage.'));
      tx.onabort = () => reject(tx.error || new Error('Storage transaction aborted.'));
    });
  } catch (err) {
    console.warn('[bookStorageService] IndexedDB save warning (cached in memory):', err);
  }
}

/**
 * Retrieve a stored file as a Blob from memory cache or browser IndexedDB
 */
export async function getWebBookBlob(bookId: string): Promise<Blob | null> {
  if (memoryBlobCache.has(bookId)) {
    return memoryBlobCache.get(bookId)!;
  }

  try {
    const db = await openIndexedDB();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(bookId);
      req.onsuccess = () => {
        const res = req.result;
        if (!res) return resolve(null);
        if (res instanceof Blob) {
          resolve(res);
        } else if (res instanceof ArrayBuffer) {
          resolve(new Blob([res]));
        } else {
          resolve(new Blob([res]));
        }
      };
      req.onerror = () => reject(req.error || new Error('Failed to retrieve file from browser storage.'));
    });

    if (blob) {
      memoryBlobCache.set(bookId, blob);
    }
    return blob;
  } catch (err) {
    console.warn('[bookStorageService] IndexedDB read warning:', err);
    return null;
  }
}

/**
 * Delete a stored file from browser IndexedDB and memory cache
 */
export async function deleteWebBookFile(bookId: string): Promise<boolean> {
  memoryBlobCache.delete(bookId);
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(bookId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error || new Error('Failed to delete file from browser storage.'));
    });
  } catch {
    return false;
  }
}

/**
 * Extract book ID pattern (book_<timestamp>_<random> or curated_<timestamp>_<slug>) from a URI
 */
export function extractBookIdFromUri(fileUri: string): string | null {
  const match =
    fileUri.match(/((?:book|curated)_\d+_[a-z0-9_]+)/i) ||
    fileUri.match(/(curated_[a-z0-9_]+)/i);
  return match ? match[1] : null;
}

/**
 * Get Blob for a book on web, checking memory cache, live URLs, and persistent IndexedDB
 */
export async function getWebFileBlob(fileUri: string, bookId?: string): Promise<Blob | null> {
  const resolvedBookId = bookId || extractBookIdFromUri(fileUri);

  // Check if this book corresponds to a curated classic
  const classicMatch = resolvedBookId
    ? resolvedBookId.match(/curated_\d+_(.*)$/) || resolvedBookId.match(/^(curated_.*)$/)
    : fileUri.match(/(curated_[a-z0-9_]+)/i);
  const classicId = classicMatch
    ? (classicMatch[1].startsWith('curated_') ? classicMatch[1] : `curated_${classicMatch[1]}`)
    : null;

  // 1. If it's a curated classic, check if memory cache has a stale tiny dummy (< 5000 bytes)
  if (resolvedBookId && memoryBlobCache.has(resolvedBookId)) {
    const memBlob = memoryBlobCache.get(resolvedBookId)!;
    // If it's a full-size book (> 5000 bytes) or not a curated classic, use memory cache
    if (memBlob.size >= 5000 || !classicId) {
      return memBlob;
    }
  }

  // 2. Query persistent browser IndexedDB
  if (resolvedBookId) {
    let storedBlob = await getWebBookBlob(resolvedBookId);

    // Auto-upgrade: if storedBlob is small (< 5000 bytes) or missing, and corresponds to a curated classic,
    // upgrade it automatically with the full-text EPUB from /books/
    if (classicId && (!storedBlob || storedBlob.size < 5000)) {
      try {
        const fullResp = await fetch(`/books/${classicId}.epub`);
        if (fullResp.ok) {
          const fullBlob = await fullResp.blob();
          if (fullBlob.size > 2000) {
            storedBlob = fullBlob;
            await saveWebBookFile(resolvedBookId, fullBlob);
          }
        }
      } catch {
        // Upgrade fallback
      }
    }

    if (storedBlob && (storedBlob.size >= 5000 || !classicId)) {
      memoryBlobCache.set(resolvedBookId, storedBlob);
      return storedBlob;
    }
  }

  // 2.5 Direct fetch from /books/ if it's a curated classic
  if (classicId) {
    try {
      const fullResp = await fetch(`/books/${classicId}.epub`);
      if (fullResp.ok) {
        const fullBlob = await fullResp.blob();
        if (fullBlob.size > 2000) {
          if (resolvedBookId) {
            await saveWebBookFile(resolvedBookId, fullBlob);
          }
          memoryBlobCache.set(resolvedBookId || classicId, fullBlob);
          return fullBlob;
        }
      }
    } catch {
      // Fallback
    }
  }

  // 3. If it's a live blob:, data:, or http(s) URL, try fetching it
  if (
    fileUri.startsWith('blob:') ||
    fileUri.startsWith('data:') ||
    fileUri.startsWith('http://') ||
    fileUri.startsWith('https://')
  ) {
    try {
      const resp = await fetch(fileUri);
      if (resp.ok) {
        const blob = await resp.blob();
        if (resolvedBookId) {
          saveWebBookFile(resolvedBookId, blob).catch(() => {});
        }
        return blob;
      }
    } catch {
      // Fetch failed (e.g. revoked blob URL)
    }
  }

  return null;
}

/**
 * Universal book reader: read file as base64 string across Web and Native
 */
export async function readBookAsBase64(fileUri: string, bookId?: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = await getWebFileBlob(fileUri, bookId);
    if (!blob) {
      throw new Error(
        'Book file not found in browser storage. Please remove this book and re-import it.'
      );
    }
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const commaIdx = res.indexOf(',');
        resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res);
      };
      reader.onerror = () => reject(new Error('Failed to read document in browser.'));
      reader.readAsDataURL(blob);
    });
  }

  return await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  });
}

/**
 * Universal book reader: read file as ArrayBuffer across Web and Native
 */
export async function readBookAsArrayBuffer(fileUri: string, bookId?: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const blob = await getWebFileBlob(fileUri, bookId);
    if (!blob) {
      throw new Error(
        'Book file not found in browser storage. Please remove this book and re-import it.'
      );
    }
    return await blob.arrayBuffer();
  }

  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  });
  // Convert base64 to ArrayBuffer for native JSZip usage if needed
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Universal book reader: read file as UTF-8 text across Web and Native
 */
export async function readBookAsText(fileUri: string, bookId?: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = await getWebFileBlob(fileUri, bookId);
    if (!blob) {
      throw new Error(
        'Book file not found in browser storage. Please remove this book and re-import it.'
      );
    }
    return await blob.text();
  }

  return await FileSystem.readAsStringAsync(fileUri);
}

/**
 * Get or create the app-managed persistent directory for storing books on native devices
 */
export async function ensureBooksDirectory(): Promise<string> {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    if (Platform.OS === 'web') {
      return 'web_storage://books/';
    }
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
 * On native, copies without reading entire file into JavaScript memory.
 * On web, persists data in IndexedDB and returns a stable virtual URI.
 */
export async function storeBookFile(
  sourceUri: string,
  originalFilename: string,
  bookId: string,
  rawFile?: any
): Promise<StoredBookFile> {
  const cleanName = sanitizeFilename(originalFilename);
  const destinationFilename = `${bookId}_${cleanName}`;
  const relativePath = `${BOOKS_SUBDIRECTORY}${destinationFilename}`;

  if (Platform.OS === 'web') {
    let size = 0;
    try {
      let arrayBuffer: ArrayBuffer | null = null;
      if (rawFile && typeof rawFile.arrayBuffer === 'function') {
        const ab = await rawFile.arrayBuffer();
        arrayBuffer = ab;
        size = rawFile.size || ab.byteLength;
      } else if (sourceUri) {
        const resp = await fetch(sourceUri);
        const blob = await resp.blob();
        size = blob.size;
        arrayBuffer = await blob.arrayBuffer();
      }

      if (arrayBuffer) {
        await saveWebBookFile(bookId, arrayBuffer);
      } else {
        throw new Error('Could not read file binary data.');
      }
    } catch (err) {
      console.warn('[bookStorageService] Warning: Failed to persist file in IndexedDB:', err);
      throw err;
    }

    return {
      bookId,
      fileUri: `web_storage://books/${destinationFilename}`,
      relativePath,
      fileSizeBytes: size,
    };
  }

  const booksDir = await ensureBooksDirectory();
  const destinationUri = `${booksDir}${destinationFilename}`;

  // Check source existence safely (content:// URIs on Android can return exists: false)
  let sourceSize = 0;
  try {
    const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
    if (sourceInfo.exists && sourceInfo.size) {
      sourceSize = sourceInfo.size;
    }
  } catch {
    // Proceed to copy
  }

  // Copy file to persistent storage
  try {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
  } catch (copyErr) {
    try {
      const content = await FileSystem.readAsStringAsync(sourceUri, { encoding: 'base64' });
      await FileSystem.writeAsStringAsync(destinationUri, content, { encoding: 'base64' });
    } catch {
      throw copyErr;
    }
  }

  // Verify copied file existence and size
  const destInfo = await FileSystem.getInfoAsync(destinationUri);
  if (!destInfo.exists) {
    throw new Error('Verification failed: Copied file does not exist in local app storage.');
  }

  const finalSize = destInfo.size && destInfo.size > 0 ? destInfo.size : sourceSize;

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
export async function deleteBookFile(fileUri: string, bookId?: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const resolvedBookId = bookId || extractBookIdFromUri(fileUri);
      if (resolvedBookId) {
        await deleteWebBookFile(resolvedBookId);
      }
      return true;
    }
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
 * Check if a book file still exists in persistent storage
 */
export async function verifyBookFileExists(fileUri: string, bookId?: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const resolvedBookId = bookId || extractBookIdFromUri(fileUri);
      if (resolvedBookId) {
        const blob = await getWebBookBlob(resolvedBookId);
        if (blob !== null && blob.size > 0) return true;
      }
      if (fileUri.startsWith('blob:') || fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
        try {
          const resp = await fetch(fileUri);
          return resp.ok;
        } catch {
          return false;
        }
      }
      return false;
    }
    const info = await FileSystem.getInfoAsync(fileUri);
    return info.exists;
  } catch {
    return false;
  }
}
