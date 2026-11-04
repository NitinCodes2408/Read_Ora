import { Platform } from 'react-native';
import { BookFormat } from '@/types';
import { extractEpubMetadata } from './epubService';
import { extractTxtMetadata } from './txtService';
import { readBookAsArrayBuffer } from './bookStorageService';
import { formatAuthorName, getKnownAuthor } from '@/utils/fileUtils';
import { PDF_JS_CODE, PDF_WORKER_JS_CODE } from './pdfjsBundle';

export interface ExtractedBookMetadata {
  coverUri?: string;
  title?: string;
  author?: string;
}

/**
 * Dynamically ensure Mozilla PDF.js is loaded in browser window on Web
 */
async function ensureWebPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  if (win.pdfjsLib) return win.pdfjsLib;

  // 1. Instant offline initialization from bundled local PDF.js scripts
  try {
    if (!win.pdfjsWorker && PDF_WORKER_JS_CODE) {
      const workerScript = document.createElement('script');
      workerScript.textContent = PDF_WORKER_JS_CODE;
      document.head.appendChild(workerScript);
    }
    if (!win.pdfjsLib && PDF_JS_CODE) {
      const pdfScript = document.createElement('script');
      pdfScript.textContent = PDF_JS_CODE;
      document.head.appendChild(pdfScript);
    }
    if (win.pdfjsLib) {
      return win.pdfjsLib;
    }
  } catch (err) {
    console.warn('[coverExtractionService] Failed to inject bundled local PDF.js:', err);
  }

  return new Promise((resolve) => {
    // Check if script is already injected
    let script = document.querySelector('script[src*="pdf.min.js"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      document.head.appendChild(script);
    }

    const checkInterval = setInterval(() => {
      if (win.pdfjsLib) {
        clearInterval(checkInterval);
        try {
          win.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } catch {
          // ignore
        }
        resolve(win.pdfjsLib);
      }
    }, 50);

    // Timeout after 4 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(win.pdfjsLib || null);
    }, 4000);
  });
}

/**
 * Extract Page 1 of a PDF as a thumbnail data URI and extract author/title metadata
 */
async function extractPdfMetadataAndCoverWeb(
  fileUri: string,
  bookId?: string,
  rawFile?: any,
  fallbackTitle?: string
): Promise<ExtractedBookMetadata> {
  if (typeof window === 'undefined') return {};

  try {
    let arrayBuffer: ArrayBuffer | null = null;
    if (rawFile && typeof rawFile.arrayBuffer === 'function') {
      arrayBuffer = await rawFile.arrayBuffer();
    } else {
      arrayBuffer = await readBookAsArrayBuffer(fileUri, bookId);
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) return {};

    const pdfjsLib = await ensureWebPdfJs();
    if (!pdfjsLib) return {};

    const uint8 = new Uint8Array(arrayBuffer);
    const pdfDoc = await pdfjsLib.getDocument({ data: uint8 }).promise;
    if (!pdfDoc || pdfDoc.numPages < 1) return {};

    let detectedTitle: string | undefined = undefined;
    let detectedAuthor: string | undefined = undefined;

    // 1. Try Document Metadata (Info Dictionary & XMP metadata)
    try {
      const docMeta = await pdfDoc.getMetadata();
      if (docMeta && docMeta.info) {
        if (docMeta.info.Author) {
          const formatted = formatAuthorName(docMeta.info.Author);
          if (formatted !== 'Unknown Author') {
            detectedAuthor = formatted;
          }
        }
        if (docMeta.info.Title && typeof docMeta.info.Title === 'string') {
          const t = docMeta.info.Title.trim();
          if (t.length > 2 && !t.toLowerCase().endsWith('.pdf')) {
            detectedTitle = t;
          }
        }
      }

      if (!detectedAuthor && docMeta && docMeta.metadata) {
        const dcCreator = docMeta.metadata.get('dc:creator');
        if (dcCreator && typeof dcCreator === 'string') {
          const formatted = formatAuthorName(dcCreator);
          if (formatted !== 'Unknown Author') {
            detectedAuthor = formatted;
          }
        }
      }
    } catch {
      // ignore metadata failure
    }

    // 2. Render Page 1 to canvas for cover
    const page = await pdfDoc.getPage(1);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    const targetWidth = 300;
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    let coverUri: string | undefined = undefined;

    if (ctx) {
      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;
      coverUri = canvas.toDataURL('image/jpeg', 0.85);
    }

    // 3. If author is not yet found, inspect Page 1 and Page 2 text content
    if (!detectedAuthor) {
      try {
        const pagesToScan = Math.min(2, pdfDoc.numPages);
        for (let pNum = 1; pNum <= pagesToScan; pNum++) {
          const scanPage = pNum === 1 ? page : await pdfDoc.getPage(pNum);
          const textContent = await scanPage.getTextContent();
          const items: string[] = textContent.items
            .map((it: any) => (it.str ? it.str.trim() : ''))
            .filter((s: string) => s.length > 0);

          for (let i = 0; i < items.length; i++) {
            const line = items[i];

            // Match "By Author Name"
            const byMatch = line.match(/^(?:by|written by|author[:\s])\s+([A-Z][a-zA-Z\s.'’\-]+)$/i);
            if (byMatch && byMatch[1]) {
              const formatted = formatAuthorName(byMatch[1]);
              if (formatted !== 'Unknown Author' && formatted.split(' ').length <= 5) {
                detectedAuthor = formatted;
                break;
              }
            }

            // Match "By" on one line and name on subsequent line
            if (/^(?:by|written by)$/i.test(line) && i + 1 < items.length) {
              const nextLine = items[i + 1];
              const formatted = formatAuthorName(nextLine);
              if (formatted !== 'Unknown Author' && formatted.split(' ').length <= 5) {
                detectedAuthor = formatted;
                break;
              }
            }
          }

          if (detectedAuthor) break;
        }
      } catch {
        // ignore text scanning failure
      }
    }

    // 4. Fallback to knowledge base check on title
    if (!detectedAuthor) {
      const candidateTitle = detectedTitle || fallbackTitle || '';
      const known = getKnownAuthor(candidateTitle);
      if (known) {
        detectedAuthor = known;
      }
    }

    return {
      coverUri,
      title: detectedTitle,
      author: detectedAuthor,
    };
  } catch (err) {
    console.warn('[coverExtractionService] Failed to extract PDF metadata/cover on web:', err);
    return {};
  }
}

/**
 * Universal Book Metadata & Cover Extractor:
 * Supports EPUB, PDF, and TXT across Web and Native.
 */
export async function extractBookMetadataAndCover(
  fileUri: string,
  format: BookFormat,
  bookId?: string,
  rawFile?: any,
  fallbackTitle?: string
): Promise<ExtractedBookMetadata> {
  try {
    if (format === 'EPUB') {
      const meta = await extractEpubMetadata(fileUri, bookId);
      let author = meta.author ? formatAuthorName(meta.author) : undefined;
      if (!author || author === 'Unknown Author') {
        author = getKnownAuthor(meta.title || fallbackTitle || '');
      }
      return {
        coverUri: meta.coverUri,
        title: meta.title,
        author,
      };
    }

    if (format === 'PDF') {
      if (Platform.OS === 'web') {
        return await extractPdfMetadataAndCoverWeb(fileUri, bookId, rawFile, fallbackTitle);
      }
      // On Native, resolve author from knowledge base if available
      const known = getKnownAuthor(fallbackTitle || '');
      return { author: known };
    }

    if (format === 'TXT') {
      const meta = await extractTxtMetadata(fileUri, bookId);
      let author = meta.author ? formatAuthorName(meta.author) : undefined;
      if (!author || author === 'Unknown Author') {
        author = getKnownAuthor(meta.title || fallbackTitle || '');
      }
      return {
        title: meta.title,
        author,
      };
    }

    return {};
  } catch (err) {
    console.warn('[coverExtractionService] Error extracting book metadata and cover:', err);
    return {};
  }
}

/**
 * Universal Cover Extractor (backwards compatible)
 */
export async function extractBookCover(
  fileUri: string,
  format: BookFormat,
  bookId?: string,
  rawFile?: any,
  fallbackTitle?: string
): Promise<string | undefined> {
  const result = await extractBookMetadataAndCover(fileUri, format, bookId, rawFile, fallbackTitle);
  return result.coverUri;
}
