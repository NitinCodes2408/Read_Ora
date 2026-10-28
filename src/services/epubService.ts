import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { Chapter } from '@/types';

export interface ParsedEpub {
  title: string;
  author: string;
  chapters: Chapter[];
  toc: { title: string; chapterIndex: number }[];
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
export async function parseEpub(fileUri: string): Promise<ParsedEpub> {
  // 1. Read EPUB file as base64 string
  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  });

  // 2. Unzip with JSZip
  const zip = await JSZip.loadAsync(base64Data, { base64: true });

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
    const idMatch = itemTag.match(/id=["']([^"']+)["']/i);
    const hrefMatch = itemTag.match(/href=["']([^"']+)["']/i);
    const typeMatch = itemTag.match(/media-type=["']([^"']+)["']/i);

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

  // 7. Extract Chapters
  const chapters: Chapter[] = [];
  const toc: { title: string; chapterIndex: number }[] = [];

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

    // Extract chapter title
    let chapterTitle = '';
    const h1Match = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);

    if (h1Match) {
      chapterTitle = stripTags(h1Match[1]);
    } else if (titleTagMatch && stripTags(titleTagMatch[1]).length > 0) {
      chapterTitle = stripTags(titleTagMatch[1]);
    } else {
      chapterTitle = `Section ${i + 1}`;
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
    });

    toc.push({
      title: chapterTitle,
      chapterIndex: chapters.length - 1,
    });
  }

  return {
    title: bookTitle,
    author: bookAuthor,
    chapters,
    toc,
  };
}
