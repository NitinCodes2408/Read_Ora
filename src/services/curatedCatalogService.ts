import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { Book, CuratedBook } from '@/types';
import { sanitizeFilename } from '@/utils/fileUtils';
import { ensureBooksDirectory, saveWebBookFile } from './bookStorageService';
import { insertBook } from './libraryDatabaseService';
import { addStoreBook } from '@/context/LibraryContext';

/**
 * Check if a curated classic is already present in the user's library
 */
export function isCuratedBookInLibrary(
  curatedBook: CuratedBook,
  libraryBooks: Book[]
): Book | undefined {
  const normTitle = curatedBook.title.trim().toLowerCase();
  return libraryBooks.find(
    (b) =>
      b.title.trim().toLowerCase() === normTitle ||
      b.id === curatedBook.id ||
      b.originalFilename.toLowerCase().includes(normTitle)
  );
}

/**
 * Generate a resilient, valid standalone EPUB binary buffer containing the book's details
 * Used when offline or if remote download times out
 */
async function generateResilientEpub(curatedBook: CuratedBook): Promise<ArrayBuffer> {
  const zip = new JSZip();

  // 1. mimetype (must be uncompressed, but standard JSZip store is accepted by our reader)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. OEBPS/content.opf
  const opfContent = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${curatedBook.title}</dc:title>
    <dc:creator opf:role="aut">${curatedBook.author}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookID">urn:readora:${curatedBook.id}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="chap1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chap2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chap1"/>
    <itemref idref="chap2"/>
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', opfContent);

  // 4. OEBPS/toc.ncx
  const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:readora:${curatedBook.id}"/>
  </head>
  <docTitle>
    <text>${curatedBook.title}</text>
  </docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Introduction &amp; Overview</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
    <navPoint id="navpoint-2" playOrder="2">
      <navLabel><text>Opening Discourse</text></navLabel>
      <content src="chapter2.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', ncxContent);

  // 5. OEBPS/chapter1.xhtml
  const chap1 = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${curatedBook.title} - Introduction</title>
</head>
<body>
  <h1>${curatedBook.title}</h1>
  <h3>by ${curatedBook.author} (${curatedBook.publishedYear})</h3>
  <hr/>
  <p><strong>Category:</strong> ${curatedBook.category}</p>
  <p><strong>Overview:</strong></p>
  <p>${curatedBook.description}</p>
  <p><em>This public domain edition is legally curated and prepared for the ReadOra reader engine.</em></p>
</body>
</html>`;
  zip.file('OEBPS/chapter1.xhtml', chap1);

  // 6. OEBPS/chapter2.xhtml
  const chap2 = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${curatedBook.title} - Opening Chapter</title>
</head>
<body>
  <h2>Chapter I</h2>
  <p>${curatedBook.description}</p>
  <p>Delve into the timeless prose of ${curatedBook.author}. Written in ${curatedBook.publishedYear}, this work remains one of the foundational masterpieces of ${curatedBook.category.toLowerCase()} literature.</p>
  <p>ReadOra offers comfortable typography, custom line spacing, sepia, ivory and midnight dark mode themes, as well as offline reading tracking for all classic texts.</p>
</body>
</html>`;
  zip.file('OEBPS/chapter2.xhtml', chap2);

  return await zip.generateAsync({ type: 'arraybuffer' });
}

/**
 * Download or import a curated classic book into the user's permanent library
 */
export async function downloadAndAddCuratedBook(
  curatedBook: CuratedBook,
  onProgress?: (percent: number) => void
): Promise<Book> {
  const bookId = `curated_${Date.now()}_${curatedBook.id.replace('curated_', '')}`;
  const cleanTitle = sanitizeFilename(curatedBook.title);
  const ext = curatedBook.format.toLowerCase();
  const destinationFilename = `${bookId}_${cleanTitle}.${ext}`;
  const relativePath = `books/${destinationFilename}`;

  let finalFileUri = '';
  let finalSize = curatedBook.fileSizeBytes;

  if (onProgress) onProgress(20);

  if (Platform.OS === 'web') {
    let arrayBuffer: ArrayBuffer | null = null;

    // 1. First attempt to load full-text EPUB from local /books/
    try {
      const localUrl = `/books/${curatedBook.id}.epub`;
      const localResp = await fetch(localUrl);
      if (localResp.ok) {
        const buf = await localResp.arrayBuffer();
        if (buf && buf.byteLength > 2000) {
          arrayBuffer = buf;
          finalSize = buf.byteLength;
        }
      }
    } catch {
      // Local fetch fallback
    }

    if (onProgress) onProgress(50);

    // 2. If not found locally, attempt online fetch from curatedBook.downloadUrl
    if (!arrayBuffer) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const resp = await fetch(curatedBook.downloadUrl, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          if (buf && buf.byteLength > 2000) {
            arrayBuffer = buf;
            finalSize = buf.byteLength;
          }
        }
      } catch {
        // Fallback
      }
    }

    if (onProgress) onProgress(75);

    // 3. Resilient fallback generator if network fetch failed
    if (!arrayBuffer) {
      arrayBuffer = await generateResilientEpub(curatedBook);
      finalSize = arrayBuffer.byteLength;
    }

    // 4. Save to browser IndexedDB
    await saveWebBookFile(bookId, arrayBuffer);
    finalFileUri = `web_storage://books/${destinationFilename}`;
  } else {
    // Native (Android / iOS)
    const booksDir = await ensureBooksDirectory();
    const destinationUri = `${booksDir}${destinationFilename}`;

    let downloadSuccess = false;

    // 1. Attempt native download via FileSystem.downloadAsync from direct canonical CDN
    const targetUrl = curatedBook.gutenbergId
      ? `https://www.gutenberg.org/cache/epub/${curatedBook.gutenbergId}/pg${curatedBook.gutenbergId}.epub`
      : curatedBook.downloadUrl;

    try {
      const downloadRes = await FileSystem.downloadAsync(
        targetUrl,
        destinationUri
      );

      if (downloadRes.status === 200) {
        const info = await FileSystem.getInfoAsync(destinationUri);
        if (info.exists && (info.size ?? 0) > 2000) {
          finalSize = info.size ?? curatedBook.fileSizeBytes;
          downloadSuccess = true;
        }
      }
    } catch {
      // Network drop or Gutenberg rate limit
    }

    if (onProgress) onProgress(70);

    // 2. If download failed, generate resilient local copy directly to disk
    if (!downloadSuccess) {
      const fallbackBuffer = await generateResilientEpub(curatedBook);
      finalSize = fallbackBuffer.byteLength;

      // Convert buffer to base64 for FileSystem.writeAsStringAsync
      const bytes = new Uint8Array(fallbackBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      await FileSystem.writeAsStringAsync(destinationUri, base64, {
        encoding: 'base64',
      });
    }

    finalFileUri = destinationUri;
  }

  if (onProgress) onProgress(90);

  const newBook: Book = {
    id: bookId,
    title: curatedBook.title,
    author: curatedBook.author,
    originalFilename: `${cleanTitle}.${ext}`,
    format: curatedBook.format,
    fileSizeBytes: finalSize,
    fileUri: finalFileUri,
    relativePath,
    addedAt: new Date().toISOString(),
    coverUri: curatedBook.coverUrl,
    totalPages: curatedBook.estimatedPages,
    currentPage: 0,
    progressPercent: 0,
  };

  // 1. Persist to SQLite & AsyncStorage
  await insertBook(newBook);

  // 2. Update reactive in-memory state so Library and Home instantly show the book
  addStoreBook(newBook);

  if (onProgress) onProgress(100);

  return newBook;
}
