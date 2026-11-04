import { readBookAsText } from './bookStorageService';
import { formatAuthorName } from '@/utils/fileUtils';

export interface ParsedTxt {
  rawText: string;
  totalPages: number;
  pages: string[];
  pageOffsets: number[];
  sections: { title: string; pageIndex: number }[];
}

const CHARACTERS_PER_PAGE = 1400;

/**
 * Load and paginate plain text files
 */
export async function loadTxtBook(fileUri: string, bookId?: string): Promise<ParsedTxt> {
  const raw = await readBookAsText(fileUri, bookId);
  const normalized = raw.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return {
      rawText: 'This document is empty.',
      totalPages: 1,
      pages: ['This document is empty.'],
      pageOffsets: [0],
      sections: [{ title: 'Start', pageIndex: 0 }],
    };
  }

  // Split into paragraphs
  const paragraphs = normalized.split(/\n\s*\n/);
  const pages: string[] = [];
  const sections: { title: string; pageIndex: number }[] = [];

  let currentPageText = '';

  paragraphs.forEach((para) => {
    const trimmed = para.trim();
    if (!trimmed) return;

    // Detect chapter headings (e.g. Chapter 1, CHAPTER II, Part 1, Act I)
    const isHeading =
      /^(chapter|part|book|section|act)\s+[0-9ivxlcdm]+/i.test(trimmed) ||
      (trimmed.length < 50 && /^[A-Z0-9\s—–:-]+$/.test(trimmed));

    if (isHeading) {
      if (currentPageText.length > 0) {
        pages.push(currentPageText.trim());
        currentPageText = '';
      }
      sections.push({
        title: trimmed.substring(0, 40),
        pageIndex: pages.length,
      });
    }

    if (currentPageText.length + trimmed.length > CHARACTERS_PER_PAGE && currentPageText.length > 0) {
      pages.push(currentPageText.trim());
      currentPageText = trimmed;
    } else {
      currentPageText = currentPageText ? `${currentPageText}\n\n${trimmed}` : trimmed;
    }
  });

  if (currentPageText.trim().length > 0) {
    pages.push(currentPageText.trim());
  }

  const finalPages = pages.length > 0 ? pages : [normalized];

  // Compute deterministic absolute character offsets for every page
  const pageOffsets: number[] = [];
  let searchPointer = 0;
  for (const pageContent of finalPages) {
    const foundIdx = normalized.indexOf(pageContent, searchPointer);
    if (foundIdx !== -1) {
      pageOffsets.push(foundIdx);
      searchPointer = foundIdx + pageContent.length;
    } else {
      pageOffsets.push(searchPointer);
      searchPointer += pageContent.length;
    }
  }

  if (sections.length === 0) {
    // Generate evenly distributed navigation markers if no explicit chapters found
    const step = Math.max(1, Math.floor(finalPages.length / 5));
    for (let i = 0; i < finalPages.length; i += step) {
      sections.push({
        title: `Page ${i + 1}`,
        pageIndex: i,
      });
    }
  }

  return {
    rawText: normalized,
    totalPages: Math.max(1, finalPages.length),
    pages: finalPages,
    pageOffsets,
    sections,
  };
}

/**
 * Extract metadata from plain text header if present
 */
export async function extractTxtMetadata(
  fileUri: string,
  bookId?: string
): Promise<{ title?: string; author?: string }> {
  try {
    const raw = await readBookAsText(fileUri, bookId);
    const sample = raw.substring(0, 2000);
    const titleMatch = sample.match(/(?:title|book title)[:\t ]+([^\r\n]+)/i);
    const authorMatch = sample.match(/(?:author|by|written by)[:\t ]+([^\r\n]+)/i);

    const rawAuthor = authorMatch ? authorMatch[1].trim() : undefined;
    const author = rawAuthor ? formatAuthorName(rawAuthor) : undefined;

    return {
      title: titleMatch ? titleMatch[1].trim() : undefined,
      author: author !== 'Unknown Author' ? author : undefined,
    };
  } catch {
    return {};
  }
}
