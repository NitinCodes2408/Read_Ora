import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { Chapter } from '@/types';
import { readBookAsArrayBuffer } from './bookStorageService';
import { formatAuthorName } from '@/utils/fileUtils';

export interface ParsedEpub {
  title: string;
  author: string;
  chapters: Chapter[];
  toc: { title: string; chapterIndex: number; isFrontMatter?: boolean }[];
  firstStoryChapterIndex: number;
}

/**
 * Universal EPUB zip loader across Web (ArrayBuffer) and Native (base64)
 */
async function loadEpubZip(fileUri: string, bookId?: string): Promise<JSZip> {
  if (Platform.OS === 'web') {
    const arrayBuffer = await readBookAsArrayBuffer(fileUri, bookId);
    return await JSZip.loadAsync(arrayBuffer);
  }
  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  });
  return await JSZip.loadAsync(base64Data, { base64: true });
}

/**
 * Clean and normalize a path inside a zip archive
 */
function resolvePath(baseDir: string, relativePath: string): string {
  const stack = baseDir ? baseDir.split('/').filter(Boolean) : [];
  const parts = relativePath.split('/');

  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }

  return stack.join('/');
}

/**
 * Get directory part of a path
 */
function getDir(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx !== -1 ? path.substring(0, idx) : '';
}

/**
 * Strip XML/HTML tags to extract plain text
 */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/**
 * Determine MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

/**
 * Parse an EPUB file into structured chapters and table of contents
 */
export async function parseEpub(fileUri: string, bookId?: string): Promise<ParsedEpub> {
  // 1. Unzip with JSZip (support Web IndexedDB and Native FileSystem)
  const zip = await loadEpubZip(fileUri, bookId);

  // 3. Locate container.xml
  const containerEntry = zip.file('META-INF/container.xml');
  if (!containerEntry) {
    throw new Error('Invalid EPUB file: META-INF/container.xml missing.');
  }

  const containerXml = await containerEntry.async('text');

  // Extract OPF package path
  const rootfileMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
  if (!rootfileMatch || !rootfileMatch[1]) {
    throw new Error('Invalid EPUB: Unable to find OPF package path.');
  }

  const opfPath = rootfileMatch[1];
  const opfDir = getDir(opfPath);

  // 4. Read OPF file
  const opfEntry = zip.file(opfPath);
  if (!opfEntry) {
    throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
  }

  const opfContent = await opfEntry.async('text');

  // Extract Metadata: Title & Author
  const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
  const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
  const bookTitle = titleMatch ? titleMatch[1].trim() : 'Unknown Title';
  const bookAuthor = authorMatch ? authorMatch[1].trim() : 'Unknown Author';

  // 5. Parse Manifest: id -> href & media-type
  const manifestMap: Record<string, { href: string; mediaType: string }> = {};
  const itemRegex = /<item\s+[^>]*>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(opfContent)) !== null) {
    const itemTag = itemMatch[0];
    const idMatch = itemTag.match(/\bid=["']([^"']+)["']/i);
    const hrefMatch = itemTag.match(/\bhref=["']([^"']+)["']/i);
    const typeMatch = itemTag.match(/\bmedia-type=["']([^"']+)["']/i);

    if (idMatch && hrefMatch) {
      manifestMap[idMatch[1]] = {
        href: hrefMatch[1],
        mediaType: typeMatch ? typeMatch[1] : '',
      };
    }
  }

  // 6. Parse Spine: list of itemrefs in reading sequence
  const spineItemIds: string[] = [];
  const itemrefRegex = /<itemref\s+[^>]*idref=["']([^"']+)["'][^>]*>/gi;
  let spineMatch: RegExpExecArray | null;

  while ((spineMatch = itemrefRegex.exec(opfContent)) !== null) {
    spineItemIds.push(spineMatch[1]);
  }

  // 7. Extract Chapters with Smart Title Detection & Front-Matter Classification
  const chapters: Chapter[] = [];
  const toc: { title: string; chapterIndex: number; isFrontMatter?: boolean }[] = [];
  let firstStoryChapterIndex = -1;

  for (let i = 0; i < spineItemIds.length; i++) {
    const itemId = spineItemIds[i];
    const manifestItem = manifestMap[itemId];
    if (!manifestItem) continue;

    // Resolve full path inside zip
    const chapterPath = resolvePath(opfDir, manifestItem.href);
    const chapterEntry = zip.file(chapterPath);
    if (!chapterEntry) continue;

    let html = await chapterEntry.async('text');
    const chapterDir = getDir(chapterPath);
    const cleanText = stripTags(html);
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    // Identify if this is a cover page
    const isCover =
      /wrap0000|cover/i.test(manifestItem.href) ||
      /cover/i.test(itemId) ||
      (wordCount < 30 && /<img|<image|<svg/i.test(html));

    // Extract chapter title intelligently
    let chapterTitle = '';
    const h1Match = html.match(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/i);
    const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);

    if (h1Match) {
      const candidate = stripTags(h1Match[1]);
      if (candidate && candidate.length > 1 && !new RegExp(`^${bookTitle}$`, 'i').test(candidate)) {
        chapterTitle = candidate;
      }
    }

    if (!chapterTitle) {
      // Look for chapter/letter/part pattern in body
      const patternMatch = html.match(
        /(?:<p[^>]*>|<div[^>]*>)?\s*(?:<b[^>]*>)?\s*(Chapter\s+[0-9IVXLCDM]+|Letter\s+[0-9IVXLCDM]+|Book\s+[0-9IVXLCDM]+|Part\s+[0-9IVXLCDM]+|Act\s+[0-9IVXLCDM]+)(?:<\/b>)?(?:\s*[:.\-—]\s*([^<]+))?/i
      );
      if (patternMatch) {
        chapterTitle =
          patternMatch[1] + (patternMatch[2] ? `: ${stripTags(patternMatch[2])}` : '');
      }
    }

    if (!chapterTitle && titleTagMatch && stripTags(titleTagMatch[1]).length > 0) {
      const candidate = stripTags(titleTagMatch[1]);
      if (!new RegExp(`^${bookTitle}$`, 'i').test(candidate)) {
        chapterTitle = candidate;
      }
    }

    if (!chapterTitle) {
      if (isCover) {
        chapterTitle = 'Cover';
      } else {
        chapterTitle = `Section ${i + 1}`;
      }
    }

    // Identify Gutenberg disclaimer or internal table of contents
    const isGutenbergNotice =
      /The Project Gutenberg eBook of|GUTENBERG LICENSE|full Project Gutenberg/i.test(cleanText) &&
      wordCount < 600;
    const isToc =
      /^contents?$|^table\s*of\s*contents$/i.test(chapterTitle.trim()) ||
      (wordCount < 400 && /<a\s+[^>]*href=/i.test(html) && /chapter|letter|part/i.test(cleanText));

    const isFrontMatter = isCover || isGutenbergNotice || isToc;

    if (firstStoryChapterIndex === -1 && !isFrontMatter && wordCount > 30) {
      firstStoryChapterIndex = chapters.length;
    }

    // In-line images as base64 data URIs so they render offline
    const imgRegex = /<(?:img|image)[^>]+(?:src|xlink:href)=["']([^"']+)["'][^>]*>/gi;
    const matches = Array.from(html.matchAll(imgRegex));

    for (const match of matches) {
      const rawImgSrc = match[1];
      if (rawImgSrc.startsWith('data:') || rawImgSrc.startsWith('http')) continue;

      const fullImgPath = resolvePath(chapterDir, rawImgSrc);
      const imgEntry = zip.file(fullImgPath);

      if (imgEntry) {
        try {
          const imgBase64 = await imgEntry.async('base64');
          const mime = getMimeType(fullImgPath);
          const dataUri = `data:${mime};base64,${imgBase64}`;
          html = html.replace(rawImgSrc, dataUri);
        } catch {
          // ignore individual image failure
        }
      }
    }

    // Extract body content if present
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;

    chapters.push({
      id: itemId,
      title: chapterTitle,
      href: manifestItem.href,
      contentHtml: bodyHtml,
      isFrontMatter,
    });

    toc.push({
      title: chapterTitle,
      chapterIndex: chapters.length - 1,
      isFrontMatter,
    });
  }

  // Fallback to first chapter if none classified as story
  if (firstStoryChapterIndex === -1) {
    firstStoryChapterIndex = 0;
  }

  return {
    title: bookTitle,
    author: bookAuthor,
    chapters,
    toc,
    firstStoryChapterIndex,
  };
}

/**
 * Lightweight metadata extractor that only reads the OPF file without parsing all chapters
 */
export async function extractEpubMetadata(
  fileUri: string,
  bookId?: string
): Promise<{ title?: string; author?: string; coverUri?: string }> {
  try {
    const zip = await loadEpubZip(fileUri, bookId);

    const containerEntry = zip.file('META-INF/container.xml');
    if (!containerEntry) return {};

    const containerXml = await containerEntry.async('text');
    const rootfileMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
    if (!rootfileMatch || !rootfileMatch[1]) return {};

    const opfPath = rootfileMatch[1];
    const opfDir = getDir(opfPath);
    const opfEntry = zip.file(opfPath);
    if (!opfEntry) return {};

    const opfContent = await opfEntry.async('text');
    const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);

    // Extract Cover Image
    let coverUri: string | undefined = undefined;

    // 1. Check for <meta name="cover" content="<id>"/> or reversed attributes
    const metaCoverMatch =
      opfContent.match(/<meta[^>]+name=["']cover["'][^>]+content=["']([^"']+)["']/i) ||
      opfContent.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']cover["']/i);
    const coverId = metaCoverMatch ? metaCoverMatch[1] : null;

    // 2. Scan manifest items to locate cover image
    const itemRegex = /<item\s+[^>]*>/gi;
    let itemMatch: RegExpExecArray | null;
    let coverHref: string | null = null;
    let fallbackCoverHref: string | null = null;

    while ((itemMatch = itemRegex.exec(opfContent)) !== null) {
      const tag = itemMatch[0];
      const idM = tag.match(/id=["']([^"']+)["']/i);
      const hrefM = tag.match(/href=["']([^"']+)["']/i);
      const propsM = tag.match(/properties=["']([^"']+)["']/i);
      const mediaM = tag.match(/media-type=["']([^"']+)["']/i);

      if (hrefM) {
        const id = idM ? idM[1] : '';
        const href = hrefM[1];
        const props = propsM ? propsM[1] : '';
        const media = mediaM ? mediaM[1] : '';

        if (coverId && id === coverId) {
          coverHref = href;
          break;
        } else if (props.includes('cover-image')) {
          coverHref = href;
          break;
        } else if (
          media.startsWith('image/') &&
          (id.toLowerCase().includes('cover') || href.toLowerCase().includes('cover'))
        ) {
          fallbackCoverHref = href;
        }
      }
    }

    const targetHref = coverHref || fallbackCoverHref;
    if (targetHref) {
      const fullCoverPath = resolvePath(opfDir, targetHref);
      const coverFile = zip.file(fullCoverPath);
      if (coverFile) {
        const base64 = await coverFile.async('base64');
        const mime = getMimeType(fullCoverPath);
        coverUri = `data:${mime};base64,${base64}`;
      }
    }

    const rawAuthor = authorMatch ? stripTags(authorMatch[1]).trim() : undefined;
    const author = rawAuthor ? formatAuthorName(rawAuthor) : undefined;

    return {
      title: titleMatch ? stripTags(titleMatch[1]).trim() : undefined,
      author: author !== 'Unknown Author' ? author : undefined,
      coverUri,
    };
  } catch {
    return {};
  }
}
